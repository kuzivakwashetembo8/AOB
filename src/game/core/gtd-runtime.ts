import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  Mesh,
  Ray,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type {
  GameAction,
  GameCommand,
  GameEvent,
  GameRuntime,
  GameSnapshot,
  HudContext,
  InputMode,
} from "./types";
import { MeridianPhysics } from "../physics/rapier-world";
import { FirstDriveTrial } from "../vehicles/first-drive-trial";
import { canInitializePlayerVehicle } from "../vehicles/drive-availability";
import { ferrariRearCameraAlpha, advanceFerrariCameraAlpha } from "../vehicles/ferrari-camera";
import { FL4Diagnostics } from "../debug/fl4-diagnostics";
import {
  beginWorldRenderWarmup,
  type WorldRenderWarmup,
} from "./world-render-warmup";
import { resolveFL4RasterOverride } from "../debug/fl4-quality-trial";
import { renderHardwareScale, normalizeRenderClarity, normalizeRenderScalePercent, capRenderHardwareScale, type RenderClarityMode } from "../renderer/render-clarity";
import {
  DEFAULT_TOUCH_CAMERA_SENSITIVITY,
  normalizeTouchCameraSensitivity,
  mapTouchCameraDrag,
} from "../input/touch-camera-sensitivity";
import { mountFL4EvidenceExport } from "../debug/fl4-evidence-export";
import {
  resolveVehicleOptimizationMode,
  shouldRenderAcceptedImportedVehicles,
} from "../experiments/fl4-vehicle-optimization";
import {
  beginImportedCarEvaluation,
  type ImportedCarProbe,
} from "../experiments/imported-car-evaluation";
import {
  ACTIVE_FIRST_LIGHT_WORLD_SOURCE,
  createFirstLightRuntimeWorld,
  isGeneratedFirstLightWorld,
  type RuntimeFirstLightWorld,
} from "../world/first-light-runtime-source";
import type { VoightPrototype } from "../character/voight";
import { resolveCharacterTrialStreetWitnesses } from "../character/character-trial-street-witnesses";
import { southWardLocationAt } from "../world-generation/south-ward-location";
import { isolateCharacterTrialGroundShaders } from "../character/character-trial-ground-isolation";
import {
  DEFAULT_TRAVEL_HEADING,
  normalizeHeadingSettings,
  stepTravelHeading,
  type TravelHeadingSettings,
} from "../character/locomotion/travel-heading";
import { collectCharacterTrialSceneReport } from "../character/character-trial-diagnostics";
import {
  capTrialPbrLightUniforms,
  isMeridiaCharacterTrialRequested,
  loadMeridiaCharacterTrial,
  type LoadedMeridiaCharacter,
} from "../character/voight-humanoid-trial";

const FIXED_STEP = 1 / 60;
const MAX_FRAME_DELTA = 0.1;
const WALK_SPEED = 3.8;
const SPRINT_SPEED = 6.4;
const JUMP_SPEED = 5.4;
const SNAPSHOT_INTERVAL = 1 / 12;

type Lifecycle = GameSnapshot["lifecycle"];

export class GTDGameRuntime implements GameRuntime {
  private host: HTMLCanvasElement | null = null;
  private engine: Engine | null = null;
  private fl4Diagnostics: FL4Diagnostics | null = null;
  private removeFL4EvidenceExport: (() => void) | null = null;
  private importedCarProbe: ImportedCarProbe | null = null;
  private drivingTrial: FirstDriveTrial | null = null;
  /** L0 permits one onboarding entry from the initial garage; later entry requires proximity. */
  private hasBoardedFerrari = false;
  private worldRenderWarmup: WorldRenderWarmup | null = null;
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;
  private physics: MeridianPhysics | null = null;
  private voight: VoightPrototype | null = null;
  private characterTrial: LoadedMeridiaCharacter | null = null;
  private headingSettings: TravelHeadingSettings = DEFAULT_TRAVEL_HEADING;
  private headingTurnSign: -1 | 1 = 1;
  private locomotionTick = 0;
  private locomotionSamples: Array<{
    atMs: number; inputX: number; inputZ: number;
    headingYawRad: number; targetYawRad: number | null;
    remainingErrorRad: number; turnRateRad: number;
    travelFactor: number; actualPlanarMps: number;
    actualPlanarX: number; actualPlanarZ: number;
    grounded: boolean; sprint: boolean;
    visualGait: string | null; rawGait: string | null;
  }> = [];
  private movementInputRepeatCount = 0;
  private movementInputEvents: Array<{
    atMs: number; x: number; y: number; source: string;
    released: boolean; changed: boolean;
  }> = [];
  private gaitEvents: Array<{
    atMs: number; rawGrounded: boolean;
    correctedPlanarMps: number; intentMagnitude: number;
    rawGait: string; visualGait: string;
    transition: string | null; briefGroundLoss: boolean; briefSpeedLoss: boolean;
  }> = [];
  private world: RuntimeFirstLightWorld | null = null;
  private lifecycle: Lifecycle = "idle";
  private context: HudContext = "walking";
  private inputMode: InputMode = "keyboard";
  private move = { x: 0, y: 0 };
  private look = { x: 0, y: 0 };
  private pendingTouchLook = { x: 0, y: 0 };
  private touchCameraSensitivity = DEFAULT_TOUCH_CAMERA_SENSITIVITY;
  private invertLookY = false;
  private renderClarity: RenderClarityMode = "Auto";
  private renderScalePercent = 100;
  private diagnosticHardwareScale: number | null = null;
  private actions = new Set<GameAction>();
  private verticalVelocity = 0;
  private grounded = true;
  private accumulator = 0;
  private snapshotAccumulator = 0;
  private previousTime = 0;
  private preferredCameraRadius = 6.2;
  private frameHandle: number | null = null;
  private snapshotListeners = new Set<(snapshot: GameSnapshot) => void>();
  private eventListeners = new Set<(event: GameEvent) => void>();
  private resize = () => {
    if (!this.engine) return;
    const bounds = this.host?.getBoundingClientRect();
    const cssWidth = bounds?.width;
    const cssHeight = bounds?.height;
    const next = this.diagnosticHardwareScale === null
      ? renderHardwareScale({
        mode: this.renderClarity,
        renderScalePercent: this.renderScalePercent,
        devicePixelRatio: window.devicePixelRatio,
        coarsePointer: window.matchMedia?.("(pointer: coarse)")?.matches ?? false,
        cssWidth,
        cssHeight,
      })
      : capRenderHardwareScale(this.diagnosticHardwareScale, cssWidth, cssHeight);
    if (Math.abs(next - this.engine.getHardwareScalingLevel()) > 0.0001) {
      this.engine.setHardwareScalingLevel(next);
    }
    this.engine.resize();
  };
  private snapshot: GameSnapshot = {
    lifecycle: "idle",
    context: "walking",
    location: "South Ward // First Light",
    objective: "Walk the South Ward garage corner",
    health: 100,
    reputation: 0,
    heat: 0,
    speed: 0,
    vehicle: null,
    meridianTime: "14:30",
    meridianMinuteOfDay: 14 * 60 + 30,
    meridianTimeScale: 2,
    interiorState: "outside",
  };

  async bootstrap(host: HTMLCanvasElement): Promise<void> {
    if (this.lifecycle !== "idle") return;
    const bootStartedAt = performance.now();
    this.lifecycle = "bootstrapping";
    this.publishSnapshot();
    this.emit({ type: "load-checkpoint", id: "renderer", status: "running" });
    this.host = host;
    const engine = new Engine(
      host,
      true,
      { preserveDrawingBuffer: false, stencil: true },
      false, // Manual hardware-scaling mode; all explicit settings use CSS×DPR.
    );
    // Keep accepted Auto/legacy pixel workloads; Native and Custom are now
    // calibrated relative to CSS canvas dimensions * devicePixelRatio.
    // Full physical density increases raster work and is always opt-in.
    const diagnosticParams = new URLSearchParams(window.location.search);
    // Only explicit FL-4 diagnostics may exceed native device pixels.
    // Never override ordinary players' saved graphics preferences.
    const initialCanvasBounds = host.getBoundingClientRect();
    this.diagnosticHardwareScale = resolveFL4RasterOverride(
      diagnosticParams,
      window.devicePixelRatio,
      initialCanvasBounds.width,
      initialCanvasBounds.height,
    ).hardwareScale;
    const hardwareScale = this.diagnosticHardwareScale ?? renderHardwareScale({
      mode: this.renderClarity,
      renderScalePercent: this.renderScalePercent,
      devicePixelRatio: window.devicePixelRatio,
      coarsePointer: window.matchMedia?.("(pointer: coarse)")?.matches ?? false,
      cssWidth: initialCanvasBounds.width,
      cssHeight: initialCanvasBounds.height,
    });
    engine.setHardwareScalingLevel(hardwareScale);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.055, 0.075, 0.09, 1);
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.006;
    scene.fogColor = new Color3(0.09, 0.12, 0.14);

    this.emit({ type: "load-checkpoint", id: "renderer", status: "done" });
    this.emit({ type: "load-checkpoint", id: "physics", status: "running" });
    const physics = await MeridianPhysics.create();
    this.emit({ type: "load-checkpoint", id: "physics", status: "done" });
    this.emit({ type: "load-checkpoint", id: "world", status: "running" });
    const firstLight = createFirstLightRuntimeWorld(
      scene,
      physics,
      ACTIVE_FIRST_LIGHT_WORLD_SOURCE,
      {
        // The accepted humanoid requires existing raised-sidewalk support
        // colliders in every preview, matching current main behavior.
        enableSidewalkSupportCollision: isMeridiaCharacterTrialRequested(
          window.location.search, window.location.hostname,
        ),
      },
    );
    this.emit({ type: "load-checkpoint", id: "world", status: "done" });
    // This getter is available even when startup dies at 7/8. No network
    // telemetry: only a user-initiated download reads its snapshot.
    let lastTrialWarmup: ReturnType<WorldRenderWarmup["snapshot"]> | null = null;
    let groundIsolation: ReturnType<typeof isolateCharacterTrialGroundShaders> | null = null;
    if (isMeridiaCharacterTrialRequested(window.location.search, window.location.hostname)) {
      window.__GTD_CHAR_DIAGNOSTICS__ = () => ({
        schema: "gtd.char001.runtime.v1",
        scene: collectCharacterTrialSceneReport(scene, engine),
        character: this.characterTrial?.report() ?? null,
        vehicles: this.importedCarProbe?.report() ?? null,
        warmup: this.worldRenderWarmup?.snapshot() ?? lastTrialWarmup,
        surfaceIsolation: groundIsolation,
      });
    }
    // Explicit main-branch mobile validation authorized 2026-10-10.
    // Accepted imported buggy and sports-car GLBs now replace ALL old parked
    // car graphics in default gameplay, including the public production host.
    // The importer hides old cars and removes their colliders synchronously;
    // loading/failure leaves an empty slot, never a procedural stand-in.
    // A historical procedural comparison is available ONLY by combining
    // gtdVehicleProbe=baseline and fl4Diagnostics=1 on a NONPRODUCTION host.
    // Third-party commercial/redistribution rights remain unverified:
    // production access for mobile QA is NOT a licensing determination.
    const vehicleMode = diagnosticParams.get("gtdVehicleProbe");
    const productionHostname = window.location.hostname === "grand-theft-division.vercel.app";
    const diagnosticsEnabled = diagnosticParams.get("fl4Diagnostics") === "1";
    const useAcceptedImportedVehicles = shouldRenderAcceptedImportedVehicles(
      vehicleMode,
      diagnosticsEnabled,
      productionHostname,
    );
    if (useAcceptedImportedVehicles && isGeneratedFirstLightWorld(firstLight)) {
      const importedCarProbe = beginImportedCarEvaluation(scene, firstLight, {
        optimizationMode: resolveVehicleOptimizationMode(
          diagnosticParams.get("fl4VehicleOptimization"),
          diagnosticsEnabled,
          // Approved selective-shadow FL-4 closeout renderer is also the
          // default in the main mobile-validation build, with full detail
          // available via explicit diagnostics for reversible comparison.
          productionHostname || diagnosticParams.get("fl4FinalReview") === "1",
        ),
        onCheckpoint: (id, status, detail) =>
          this.emit(detail === undefined
            ? { type: "load-checkpoint", id, status }
            : { type: "load-checkpoint", id, status, detail }),
      });
      this.importedCarProbe = importedCarProbe;
      (window as Window & { __GTD_VEHICLE_PROBE_REPORT__?: () => ReturnType<ImportedCarProbe["report"]> })
        .__GTD_VEHICLE_PROBE_REPORT__ = () => importedCarProbe.report();
    } else {
      // The historical non-production baseline does not import GLBs.
      for (const id of ["vehicle-loader", "vehicle-offroad", "vehicle-sports"] as const) {
        this.emit({ type: "load-checkpoint", id, status: "skipped", detail: "No GLB requested" });
      }
    }
    // FL-4 isolation probes are strictly opt-in, never regular gameplay.
    // noSky tests the sky layer; noShadows tests shadow-pass overhead.
    if (diagnosticParams.get("fl4Diagnostics") === "1") {
      const probe = diagnosticParams.get("fl4Probe");
      if (probe === "noSky") {
        for (const mesh of scene.meshes) {
          if (mesh.name === "meridian-sky-dome" || mesh.name === "meridian-star-dome") {
            mesh.setEnabled(false);
          }
        }
      } else if (probe === "noShadows") {
        scene.shadowsEnabled = false;
      }
    }
    physics.setPlayerPosition({
      x: firstLight.spawn.x,
      y: firstLight.spawn.y,
      z: firstLight.spawn.z,
    });

    const camera = new ArcRotateCamera(
      "gtd-third-person-camera",
      -Math.PI / 2,
      1.16,
      6.2,
      firstLight.focus,
      scene,
    );
    camera.lowerRadiusLimit = 1.15;
    camera.upperRadiusLimit = 8.8;
    camera.minZ = 0.08;
    camera.lowerBetaLimit = 0.35;
    camera.upperBetaLimit = 2.25;
    camera.fov = 0.9;
    scene.activeCamera = camera;

    this.emit({ type: "load-checkpoint", id: "voight", status: "running" });
    // The rigged humanoid is the only supported actor. Never fall back to the
    // obsolete capsule on previews or when an external asset fails to load.
    let voight: LoadedMeridiaCharacter;
    try {
        const trial = await loadMeridiaCharacterTrial(scene);
        this.characterTrial = trial;
        voight = trial;
        // A real movement trace is exported only when the gamer requests it.
        // This does not upload, log or simulate performance data.
        (window as Window & { __GTD_CHARACTER_LOCOMOTION_REPORT__?: () => unknown })
          .__GTD_CHARACTER_LOCOMOTION_REPORT__ = () => ({
            schema: "gtd.char001.l2-gait-continuity.v1",
            generatedAt: new Date().toISOString(),
            trial: true,
            settings: this.headingSettings,
            model: this.characterTrial?.report() ?? null,
            sampleCount: this.locomotionSamples.length,
            samples: this.locomotionSamples.slice(),
            inputCommandEvents: this.movementInputEvents.slice(),
            repeatedIdenticalInputCommands: this.movementInputRepeatCount,
            gaitEvents: this.gaitEvents.slice(),
            note: "Real command changes and animation decisions. Isolated one-tick ground/speed glitches may be stabilized visually. Raw Rapier remains authoritative; no IK or synthetic event samples.",
          });
        (window as Window & { __GTD_CHARACTER_TRIAL_REPORT__?: () => ReturnType<LoadedMeridiaCharacter["report"]> })
          .__GTD_CHARACTER_TRIAL_REPORT__ = () => trial.report();
    } catch (error) {
      this.emit({ type: "load-checkpoint", id: "voight", status: "failed",
        detail: error instanceof Error ? error.message : String(error) });
      throw error;
    }
    const spawn = physics.playerPosition();
    voight.root.position.set(spawn.x, spawn.y, spawn.z);
    // Match the very first camera view to the actual protagonist position.
    // Before this, initial focus was displaced from Voight until the first
    // simulation tick; the loading gate now validates his visible mesh.
    camera.target.set(spawn.x, spawn.y + 0.55, spawn.z);
    this.emit({ type: "load-checkpoint", id: "voight", status: "done" });

    this.engine = engine;
    this.scene = scene;
    // FL-4 is opt-in: production players incur no instrumentation cost.
    if (new URLSearchParams(window.location.search).get("fl4Diagnostics") === "1") {
      const diagnostics = new FL4Diagnostics(engine, scene, host);
      this.fl4Diagnostics = diagnostics;
      (window as Window & { __GTD_FL4_REPORT__?: () => ReturnType<FL4Diagnostics["report"]> })
        .__GTD_FL4_REPORT__ = () => diagnostics.report();
      // Mount the user export only AFTER actual vehicle and first-frame readiness.
    }
    this.physics = physics;
    this.camera = camera;
    this.voight = voight;
    this.world = firstLight;
    window.addEventListener("resize", this.resize);

    // Pre-render the actual world behind the startup overlay WHILE external
    // GLBs are loading. Otherwise the first scene frame is postponed until
    // cars are installed; the previous onAfterRender-only gate admitted
    // sky-and-cars frames with no ground/streets/Voight on mobile.
    const ground = scene.getMeshByName("generated-first-light-ground");
    const protagonist = voight.witness;
    if (!(ground instanceof Mesh) || !(protagonist instanceof Mesh)) {
      throw new Error("Generated ground or Voight render witness was not constructed");
    }
    // Material families, not mesh-name prefixes, identify First Light streets.
    // The reference city names these "generated-parity-*" while procedural
    // districts use "generated-asphalt:*"/"generated-sidewalk-*".
    const trialStreetWitnesses = this.characterTrial
      ? resolveCharacterTrialStreetWitnesses(firstLight)
      : null;
    const roadSurfaces = trialStreetWitnesses?.roads ?? [];
    const sidewalkSurfaces = trialStreetWitnesses?.sidewalks ?? [];
    const markingSurfaces = this.characterTrial && isGeneratedFirstLightWorld(firstLight)
      ? firstLight.urbanSurfaces.meshes.filter(mesh =>
          mesh.material?.name === "generated-road-marking" && mesh.isEnabled())
      : [];
    if (this.characterTrial && (!roadSurfaces.length || !sidewalkSurfaces.length)) {
      throw new Error(
        "GTD character trial: actual road/sidewalk materials missing (" +
        "roads=" + roadSurfaces.length + ", sidewalks=" + sidewalkSurfaces.length +
        "); samples=" + JSON.stringify(trialStreetWitnesses?.sample ?? []),
      );
    }
    const trialBuildingSurfaces = this.characterTrial && isGeneratedFirstLightWorld(firstLight)
      ? firstLight.buildings.flatMap(building =>
          building.meshes.filter(mesh => mesh.isEnabled() && mesh.getTotalVertices() > 0))
      : [];
    if (this.characterTrial && !trialBuildingSurfaces.length) {
      throw new Error("GTD character trial: no generated First Light building geometry available");
    }
    if (this.characterTrial && !markingSurfaces.length) {
      throw new Error("GTD character trial: generated road-marking meshes unavailable");
    }
    const trialScenery = this.characterTrial && isGeneratedFirstLightWorld(firstLight)
      ? [
          ...trialBuildingSurfaces,
          ...markingSurfaces,
          ...firstLight.streetContext.meshes,
          ...(firstLight.garageInterior?.meshes ?? []),
        ].filter(mesh => mesh.isEnabled() && mesh.material instanceof StandardMaterial)
      : [];
    if (this.characterTrial) {
      // Preserve the tested humanoid PBR/world shader integration from main:
      // real streets and buildings must remain visible after rig import.
      groundIsolation = isolateCharacterTrialGroundShaders(
        ground, roadSurfaces, sidewalkSurfaces, trialScenery,
      );
      scene.shadowsEnabled = false;
    }
    // Intercept newly created PBR materials from concurrent vehicle imports
    // BEFORE each warm-up render. The normal procedural city and its lamps
    // remain unchanged. Remove the temporary observer at startup completion.
    if (this.characterTrial) capTrialPbrLightUniforms(scene);
    const trialLightBudgetObserver = this.characterTrial
      ? scene.onBeforeRenderObservable.add(() => {
          capTrialPbrLightUniforms(scene);
        })
      : null;
    const warmup = beginWorldRenderWarmup(
      scene,
      {
        ground,
        voight: protagonist,
        ...(this.characterTrial ? {
          roadSurfaces, sidewalkSurfaces, markingSurfaces,
          buildingSurfaces: trialBuildingSurfaces,
        } : {}),
      },
      this.characterTrial
        ? { postImportDeadlineMs: 45000, minimumPostImportRenderAttempts: 4 }
        : undefined,
    );
    this.worldRenderWarmup = warmup;
    try {
      // Preserve real GLTF source/parking/collider completion requirements.
      if (this.importedCarProbe) await this.importedCarProbe.settled;
      if (this.host !== host || this.engine !== engine) return;
      // EXP-VEH-002 / GTD-WORLD-002: owner desktop-accepted Ferrari L0
      // promoted to main for default production/mobile validation on 2026-10-12.
      // This is a DEVELOPMENT SPECIMEN, not a commercial-asset rights clearance.
      // Import/first-frame gates stay authoritative; no procedural fallback.
      // Reuse ONE accepted sports GLB and preserve every parked buggy.
      // Do not require a preview-only query flag or exclude production hosts.
      if (canInitializePlayerVehicle(
        this.importedCarProbe !== null, isGeneratedFirstLightWorld(firstLight),
      ) && this.importedCarProbe && isGeneratedFirstLightWorld(firstLight)) {
        const sports = this.importedCarProbe.report().slots.find(slot =>
          slot.source === "sports" && slot.status === "imported" && slot.finalVisualMetres);
        const anchor = sports
          ? scene.getTransformNodeByName("vehicle-probe-anchor:" + sports.id)
          : null;
        if (sports?.finalVisualMetres && anchor) {
          let trial: FirstDriveTrial | null = null;
          try {
            trial = new FirstDriveTrial(physics, anchor, {
              x: sports.finalVisualMetres.width,
              y: sports.finalVisualMetres.height,
              z: sports.finalVisualMetres.length,
            });
            // Remove the original fixed parked collider only after the
            // dynamic chassis and collider have successfully been allocated.
            firstLight.releaseParkedCarCollider(sports.id);
            this.drivingTrial = trial;
            (window as Window & { __GTD_DRIVE_TRIAL_REPORT__?: () => unknown })
              .__GTD_DRIVE_TRIAL_REPORT__ = () => ({
                experiment: "EXP-VEH-002", importedSlotId: sports.id,
                ...trial!.status, pose: { ...trial!.pose },
                context: this.context,
              });
          } catch (error) {
            trial?.dispose();
            console.error("[EXP-VEH-002] Ferrari trial not available", error);
            this.emit({ type: "error", message: "Ferrari driving trial unavailable: " + String(error) });
          }
        } else {
          this.emit({ type: "error", message: "Ferrari trial asset unavailable; no replacement or proxy activated" });
        }
      }
      this.emit({ type: "load-checkpoint", id: "first-frame", status: "running" });
      const finalRenderStartedAt = performance.now();
      // Only finish startup after a POST-import frame actually submits
      // ground and Voight geometry; a sky/car-only render cannot pass.
      await warmup.awaitWorldAfterVehicleSettlement();
      if (this.host !== host || this.engine !== engine) return;
      this.fl4Diagnostics?.recordStartup(
        finalRenderStartedAt - bootStartedAt,
        performance.now() - finalRenderStartedAt,
      );
      this.emit({ type: "load-checkpoint", id: "first-frame", status: "done" });
      this.lifecycle = "ready";
      this.publishSnapshot();
    } finally {
      if (this.characterTrial) lastTrialWarmup = warmup.snapshot();
      if (trialLightBudgetObserver) {
        scene.onBeforeRenderObservable.remove(trialLightBudgetObserver);
      }
      warmup.cancel();
      if (this.worldRenderWarmup === warmup) this.worldRenderWarmup = null;
    }
    if (this.fl4Diagnostics) {
      // Local-only, user-initiated export. Avoid capturing misleading partial
      // "loaded" reports during GLB import or first-frame shader preparation.
      this.removeFL4EvidenceExport = mountFL4EvidenceExport(
        () => this.fl4Diagnostics!.report(),
        () => this.importedCarProbe?.report() ?? null,
      );
    }
  }

  start(): void {
    if (this.lifecycle !== "ready" && this.lifecycle !== "paused") return;
    this.lifecycle = "running";
    this.accumulator = 0;
    this.previousTime = performance.now();
    this.publishSnapshot();
    this.schedule();
  }

  pause(): void {
    if (this.lifecycle !== "running") return;
    this.lifecycle = "paused";
    this.accumulator = 0;
    this.pendingTouchLook = { x: 0, y: 0 };
    if (this.frameHandle !== null) cancelAnimationFrame(this.frameHandle);
    this.frameHandle = null;
    this.scene?.render();
    this.publishSnapshot();
  }

  resume(): void {
    if (this.lifecycle !== "paused" && this.lifecycle !== "ready") return;
    this.start();
  }

  destroy(): void {
    if (this.lifecycle === "destroyed") return;
    if (this.frameHandle !== null) cancelAnimationFrame(this.frameHandle);
    this.frameHandle = null;
    window.removeEventListener("resize", this.resize);
    this.worldRenderWarmup?.cancel();
    this.worldRenderWarmup = null;
    this.drivingTrial?.dispose();
    this.drivingTrial = null;
    this.hasBoardedFerrari = false;
    delete (window as Window & { __GTD_DRIVE_TRIAL_REPORT__?: unknown }).__GTD_DRIVE_TRIAL_REPORT__;
    this.importedCarProbe?.dispose();
    this.importedCarProbe = null;
    delete (window as Window & { __GTD_VEHICLE_PROBE_REPORT__?: unknown }).__GTD_VEHICLE_PROBE_REPORT__;
    delete (window as Window & { __GTD_CHARACTER_TRIAL_REPORT__?: unknown }).__GTD_CHARACTER_TRIAL_REPORT__;
    delete window.__GTD_CHAR_DIAGNOSTICS__;
    delete (window as Window & { __GTD_CHARACTER_LOCOMOTION_REPORT__?: unknown })
      .__GTD_CHARACTER_LOCOMOTION_REPORT__;
    this.locomotionSamples = [];
    this.locomotionTick = 0;
    this.movementInputEvents = [];
    this.movementInputRepeatCount = 0;
    this.gaitEvents = [];
    this.characterTrial = null;
    this.removeFL4EvidenceExport?.();
    this.removeFL4EvidenceExport = null;
    this.world?.dispose();
    this.fl4Diagnostics?.dispose();
    this.fl4Diagnostics = null;
    delete (window as Window & { __GTD_FL4_REPORT__?: unknown }).__GTD_FL4_REPORT__;
    this.scene?.dispose();
    this.engine?.dispose();
    this.physics?.destroy();
    this.host = null;
    this.engine = null;
    this.scene = null;
    this.camera = null;
    this.physics = null;
    this.voight = null;
    this.world = null;
    this.actions.clear();
    this.pendingTouchLook = { x: 0, y: 0 };
    this.lifecycle = "destroyed";
    this.publishSnapshot();
    this.snapshotListeners.clear();
    this.eventListeners.clear();
  }

  command(command: GameCommand): void {
    if (command.type === "move") {
      const length = Math.hypot(command.x, command.y);
      const next = length > 1
        ? { x: command.x / length, y: command.y / length }
        : { x: command.x, y: command.y };
      if (!Number.isFinite(next.x) || !Number.isFinite(next.y)) return;
      if (this.characterTrial) {
        const changed = Math.abs(next.x - this.move.x) > 0.0001 ||
          Math.abs(next.y - this.move.y) > 0.0001;
        if (!changed) this.movementInputRepeatCount++;
        // Store true source transitions (including blur, pointer cancellation,
        // lost capture). Repeated identical keydowns count separately.
        if (changed || command.source === "desktop-pointer-cancel" ||
            command.source === "desktop-pointer-lost" || command.source === "keyboard-reset") {
          this.movementInputEvents.push({
            atMs: performance.now(), x: next.x, y: next.y,
            source: command.source ?? "unspecified",
            changed, released: Math.hypot(next.x, next.y) < 0.05,
          });
          if (this.movementInputEvents.length > 180) this.movementInputEvents.shift();
        }
      }
      this.move = next;
      return;
    }
    if (command.type === "look") {
      this.look = { x: command.x, y: command.y };
      return;
    }
    if (command.type === "render-clarity") {
      this.renderClarity = normalizeRenderClarity(command.mode);
      this.renderScalePercent = normalizeRenderScalePercent(command.scalePercent);
      // A deliberate FL-4 diagnostics hardware-scale override must remain
      // fixed, regardless of persisted graphics settings.
      if (this.engine && this.diagnosticHardwareScale === null) this.resize();
      return;
    }
    if (command.type === "camera-settings") {
      this.touchCameraSensitivity = normalizeTouchCameraSensitivity(command.touchSensitivity);
      this.invertLookY = command.invertY;
      return;
    }
    if (command.type === "look-delta") {
      // Touch gestures express displacement, not a held joystick velocity.
      // Consume once in the fixed simulation, independent of display FPS.
      if (Number.isFinite(command.x) && Number.isFinite(command.y)) {
        this.pendingTouchLook.x += command.x;
        this.pendingTouchLook.y += command.y;
      }
      return;
    }
    if (command.type === "action") {
      if (command.action === "vehicle" && command.pressed && this.drivingTrial) {
        this.toggleFerrariDriving();
        return;
      }
      if (command.pressed) this.actions.add(command.action);
      else this.actions.delete(command.action);
      return;
    }
    if (command.type === "set-context") {
      this.context = command.context;
      this.publishSnapshot();
      return;
    }
    if (command.type === "input-mode") {
      this.inputMode = command.mode;
      return;
    }
    if (command.type === "character-locomotion-tuning") {
      // Only the opt-in preview's imported humanoid can be tuned.
      // Baseline capsule physics, world and production remain untouched.
      if (!this.characterTrial) return;
      this.headingSettings = normalizeHeadingSettings({ ...this.headingSettings, ...command.settings });
      this.characterTrial.setVisualForward(this.headingSettings.visualForwardDeg);
      return;
    }
    if (command.type === "set-meridian-time") {
      this.world?.setTimeMinutes(command.minuteOfDay);
      this.publishSnapshot();
      this.scene?.render();
      return;
    }
    if (command.type === "set-meridian-time-scale") {
      this.world?.setTimeScale(command.scale);
      this.publishSnapshot();
      return;
    }
  }

  getSnapshot(): GameSnapshot {
    return this.snapshot;
  }

  subscribeSnapshot(listener: (snapshot: GameSnapshot) => void): () => void {
    this.snapshotListeners.add(listener);
    return () => this.snapshotListeners.delete(listener);
  }

  subscribeEvent(listener: (event: GameEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  /** Development-only possession: enter/exit instantly; no unverified door rig. */
  private toggleFerrariDriving() {
    const trial = this.drivingTrial;
    const physics = this.physics;
    const voight = this.voight;
    if (!trial || !physics || !voight) return;
    if (this.context === "driving") {
      if (Math.abs(trial.speedMps) > 0.25) {
        this.emit({ type: "interaction", label: "Stop the Ferrari before exiting" });
        return;
      }
      const position = trial.findSafeExitPosition();
      if (!position) {
        this.emit({ type: "interaction", label: "No clear space beside the Ferrari; reposition before exiting" });
        return;
      }
      // Position B is authoritative; never reuse the entry location A.
      physics.setPlayerPosition(position);
      voight.root.position.set(position.x, position.y, position.z);
      this.camera?.target.set(position.x, position.y + 0.55, position.z);
      this.context = "walking";
      voight.root.setEnabled(true);
      this.move = { x: 0, y: 0 };
      this.preferredCameraRadius = 6.2;
      this.publishSnapshot(0);
      this.emit({ type: "interaction", label: "Ferrari trial: press F to drive again" });
      return;
    }
    // Preserve the initial garage test entry; after first exit, the
    // original garage location cannot remotely summon/board a car parked at B.
    const actorPosition = physics.playerPosition();
    const carPosition = trial.pose;
    if (this.hasBoardedFerrari &&
        Math.hypot(actorPosition.x - carPosition.x, actorPosition.z - carPosition.z) > 3.5) {
      this.emit({ type: "interaction", label: "Walk to the Ferrari to re-enter it" });
      return;
    }
    this.hasBoardedFerrari = true;
    this.context = "driving";
    voight.root.setEnabled(false);
    this.move = { x: 0, y: 0 };
    this.preferredCameraRadius = 7.6;
    const position = trial.pose;
    if (this.camera) {
      // A fresh entry always begins BEHIND the authored -Z-facing Ferrari.
      // Any drag after entry remains an independent free-look offset.
      this.camera.alpha = ferrariRearCameraAlpha(trial.headingYaw);
      this.camera.beta = 1.14;
      this.camera.target.set(position.x, position.y + 0.7, position.z);
    }
    this.publishSnapshot(0);
    this.emit({ type: "interaction", label: "Ferrari driving: WASD / arrows / joystick · F to exit when stopped" });
  }

  private schedule() {
    if (this.lifecycle !== "running") return;
    this.frameHandle = requestAnimationFrame((time) => {
      const delta = Math.min(MAX_FRAME_DELTA, Math.max(0, (time - this.previousTime) / 1000));
      this.previousTime = time;
      this.accumulator += delta;
      while (this.accumulator >= FIXED_STEP) {
        this.fixedUpdate(FIXED_STEP);
        this.accumulator -= FIXED_STEP;
      }
      const renderStart = performance.now();
      this.scene?.render();
      this.fl4Diagnostics?.recordFrame(time, performance.now() - renderStart);
      this.schedule();
    });
  }

  private fixedUpdate(dt: number) {
    const physics = this.physics;
    const camera = this.camera;
    const voight = this.voight;
    if (!physics || !camera || !voight) return;

    // Screen-drag displacement is applied once; it must never keep rotating
    // after the finger lifts or multiply with low mobile frame rates.
    const touchDrag = this.pendingTouchLook;
    this.pendingTouchLook = { x: 0, y: 0 };
    const swipe = mapTouchCameraDrag(
      touchDrag.x,
      touchDrag.y,
      this.touchCameraSensitivity,
      this.invertLookY,
    );
    camera.alpha -= this.look.x * (this.inputMode === "touch" ? 1.8 : 0.035) * dt * 60;
    camera.alpha += swipe.alpha;
    camera.beta = Math.max(
      0.38,
      Math.min(
        2.22,
        camera.beta + this.look.y * (this.inputMode === "touch" ? 1.25 : 0.028) * dt * 60
          + swipe.beta,
      ),
    );

    if (this.context === "driving" && this.drivingTrial) {
      const trial = this.drivingTrial;
      const previousYaw = trial.headingYaw;
      trial.prepare(dt, this.move.x, this.move.y);
      // Exactly one Rapier step each fixed tick. The existing character
      // controller owns the step until world physics is centrally refactored.
      physics.movePlayer({ x: 0, y: 0, z: 0 });
      trial.finish(dt);
      const position = trial.pose;
      this.world?.update(dt, position);
      camera.target.set(position.x, position.y + 0.7, position.z);
      // Follow the CAR'S heading delta, not a hard-coded target bearing.
      // The user's pointer/touch look updates above are preserved, rather
      // than auto-overridden on every simulation frame.
      camera.alpha = advanceFerrariCameraAlpha(
        camera.alpha, previousYaw, trial.headingYaw,
      );
      this.preferredCameraRadius = 7.6;
      this.resolveCameraObstruction(camera, position, dt);
      this.snapshotAccumulator += dt;
      if (this.snapshotAccumulator >= SNAPSHOT_INTERVAL) {
        this.snapshotAccumulator = 0;
        this.publishSnapshot(Math.abs(trial.speedMps));
      }
      return;
    }

    const forward = new Vector3(-Math.cos(camera.alpha), 0, -Math.sin(camera.alpha));
    const right = new Vector3(-Math.sin(camera.alpha), 0, Math.cos(camera.alpha));
    const desired = forward.scale(-this.move.y).add(right.scale(this.move.x));
    if (desired.lengthSquared() > 1) desired.normalize();
    const speed = this.actions.has("sprint") ? SPRINT_SPEED : WALK_SPEED;
    const headingStep = this.characterTrial
      ? stepTravelHeading(
          voight.root.rotation.y, desired.x, desired.z, dt, this.headingSettings,
          this.headingTurnSign,
        )
      : null;
    if (headingStep) this.headingTurnSign = headingStep.turnSign;
    // Travel-facing translation uses the character's actual facing, never a
    // sideways or backwards vector during turns. Rapier still owns collisions.
    const horizontal = headingStep
      ? new Vector3(headingStep.travelX, 0, headingStep.travelZ).scale(speed * dt)
      : desired.scale(speed * dt);

    if (this.actions.has("jump") && this.grounded) {
      this.verticalVelocity = JUMP_SPEED;
      this.grounded = false;
      this.actions.delete("jump");
    }
    this.verticalVelocity += -9.81 * dt;

    const movement = physics.movePlayer({
      x: horizontal.x,
      y: this.verticalVelocity * dt,
      z: horizontal.z,
    });
    this.grounded = movement.grounded;
    if (this.grounded && this.verticalVelocity < 0) this.verticalVelocity = 0;

    const position = physics.playerPosition();
    this.world?.update(dt, position);
    const correctedPlanarMps =
      Math.hypot(movement.movement.x, movement.movement.z) / Math.max(dt, 0.0001);
    const gaitDecision = this.characterTrial?.updateAnimation({
      correctedPlanarSpeed: correctedPlanarMps,
      rawGrounded: this.grounded,
      intentMagnitude: desired.length(),
      sprintRequested: this.actions.has("sprint"),
      jumpAscending: !this.grounded && this.verticalVelocity > 0.2,
      dt,
    });
    if (gaitDecision?.lastTransition || gaitDecision?.briefGroundLoss ||
        gaitDecision?.briefSpeedLoss) {
      this.gaitEvents.push({
        atMs: performance.now(), rawGrounded: this.grounded,
        correctedPlanarMps, intentMagnitude: desired.length(),
        rawGait: gaitDecision.rawCandidate,
        visualGait: gaitDecision.state,
        transition: gaitDecision.lastTransition,
        briefGroundLoss: gaitDecision.briefGroundLoss,
        briefSpeedLoss: gaitDecision.briefSpeedLoss,
      });
      if (this.gaitEvents.length > 240) this.gaitEvents.shift();
    }
    const interiorState = this.world?.interiorState ?? "outside";
    this.preferredCameraRadius =
      interiorState === "inside" ? 3.35 : interiorState === "threshold" ? 4.5 : 6.2;

    voight.root.position.set(position.x, position.y, position.z);
    if (headingStep) {
      voight.root.rotation.y = headingStep.yaw;
      this.locomotionTick++;
      if (this.locomotionTick % 3 === 0) {
        this.locomotionSamples.push({
          atMs: performance.now(),
          inputX: desired.x, inputZ: desired.z,
          headingYawRad: headingStep.yaw,
          targetYawRad: headingStep.targetYaw,
          remainingErrorRad: headingStep.remainingErrorRad,
          turnRateRad: headingStep.angularRateRad,
          travelFactor: headingStep.travelScale,
          actualPlanarMps: Math.hypot(movement.movement.x, movement.movement.z) / Math.max(dt, 0.0001),
          actualPlanarX: movement.movement.x / Math.max(dt, 0.0001),
          actualPlanarZ: movement.movement.z / Math.max(dt, 0.0001),
          grounded: this.grounded,
          sprint: this.actions.has("sprint"),
          visualGait: gaitDecision?.state ?? null,
          rawGait: gaitDecision?.rawCandidate ?? null,
        });
        if (this.locomotionSamples.length > 900) this.locomotionSamples.shift();
      }
    } else if (desired.lengthSquared() > 0.001) {
      // Unmodified main-branch capsule behavior in the non-trial baseline.
      voight.root.rotation.y = Math.atan2(desired.x, desired.z);
    }
    camera.target.set(position.x, position.y + 0.55, position.z);
    this.resolveCameraObstruction(camera, position, dt);

    this.snapshotAccumulator += dt;
    if (this.snapshotAccumulator >= SNAPSHOT_INTERVAL) {
      this.snapshotAccumulator = 0;
      this.publishSnapshot(
        headingStep
          ? Math.hypot(movement.movement.x, movement.movement.z) / Math.max(dt, 0.0001)
          : desired.length() * speed,
      );
    }
  }


  private resolveCameraObstruction(
    camera: ArcRotateCamera,
    playerPosition: { x: number; y: number; z: number },
    dt: number,
  ) {
    const scene = this.scene;
    if (!scene) return;

    const target = new Vector3(
      playerPosition.x,
      playerPosition.y + 0.55,
      playerPosition.z,
    );
    const sinBeta = Math.sin(camera.beta);
    const desiredOffset = new Vector3(
      Math.cos(camera.alpha) * sinBeta,
      Math.cos(camera.beta),
      Math.sin(camera.alpha) * sinBeta,
    ).scale(this.preferredCameraRadius);

    const desiredPosition = target.add(desiredOffset);
    const rayVector = desiredPosition.subtract(target);
    const rayLength = rayVector.length();
    if (rayLength < 0.001) return;

    const ray = new Ray(target, rayVector.scale(1 / rayLength), rayLength);
    const hit = scene.pickWithRay(
      ray,
      (mesh) =>
        mesh.isEnabled() &&
        mesh.isVisible &&
        mesh.metadata?.cameraBlocker === true,
    );

    let targetRadius = this.preferredCameraRadius;
    if (hit?.hit && hit.distance > 0) {
      targetRadius = Math.max(1.2, hit.distance - 0.28);
    }

    const current = camera.radius;
    const response = targetRadius < current ? 20 : 6;
    const blend = 1 - Math.exp(-response * dt);
    camera.radius = current + (targetRadius - current) * blend;
  }

  private publishSnapshot(speed = this.snapshot.speed) {
    this.snapshot = {
      lifecycle: this.lifecycle,
      context: this.context,
      location: this.world && this.physics && isGeneratedFirstLightWorld(this.world)
        ? southWardLocationAt(
          this.context === "driving" && this.drivingTrial
            ? this.drivingTrial.pose
            : this.physics.playerPosition(),
        )
        : this.world?.location ?? "South Ward // First Light",
      objective: this.drivingTrial
        ? this.context === "driving"
          ? "Ferrari trial · Drive with WASD / arrows · F to exit when stopped"
          : "Ferrari trial · Press F to enter the sports car"
        : this.world?.objective ?? "Walk the generated South Ward garage corner",
      health: 100,
      reputation: 0,
      heat: 0,
      speed: Math.round(speed * 3.6),
      vehicle: this.context === "driving" && this.drivingTrial
        ? "Ferrari · EXP-VEH-002"
        : null,
      meridianTime:
        this.world?.environmentSnapshot.formattedTime ?? this.snapshot.meridianTime,
      meridianMinuteOfDay:
        this.world?.environmentSnapshot.minuteOfDay ??
        this.snapshot.meridianMinuteOfDay,
      meridianTimeScale:
        this.world?.environmentSnapshot.timeScale ?? this.snapshot.meridianTimeScale,
      interiorState: this.world?.interiorState ?? "outside",
    };
    this.snapshotListeners.forEach((listener) => listener(this.snapshot));
  }

  private emit(event: GameEvent) {
    this.eventListeners.forEach((listener) => listener(event));
  }
}
