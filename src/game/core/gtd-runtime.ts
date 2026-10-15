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
import { ferrariSeatWorldPose } from "../vehicles/driver-seat-placement";
import { canInitializePlayerVehicle } from "../vehicles/drive-availability";
import { ferrariRearCameraAlpha, advanceFerrariCameraAlpha, FERRARI_REAR_CAMERA_BETA, FERRARI_REAR_CAMERA_RADIUS } from "../vehicles/ferrari-camera";
import { nearestSportsCar, stationaryDisembark, type Point3 } from "../vehicles/local-boarding";
import { flightFacingPolicy } from "../character/locomotion/flight-pose";
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
import { acceptedBrickSurfaceEnabled } from "../world-generation/brick-surface-policy";
import { parseBusinessBrickFocus } from "../world-generation/brick-business-field-trial";
import { parseWoodFocus } from "../world-generation/wood-south-ward-field-trial";
import { parseGlassFocus } from "../world-generation/glass-south-ward-field-trial";
import { resolveAcceptedSouthWardPresentation } from "../world-generation/south-ward-accepted-presentation";
import { isCurbAscent } from "../character/locomotion/curb-step";
import { flightDisplacement, toggleInspectionFlight } from "../character/locomotion/inspection-flight";
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
  private readonly sportsCars=new Map<string,FirstDriveTrial>();
  private drivingTrial: FirstDriveTrial | null = null;
  private seatTrialEnabled = false;
  private seatedDriverActive = false;
  private enteredAt: Point3 | null = null;
  private carEnteredAt: Point3 | null = null;
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
  private flightEnabled = false;
  private curbStepSeconds = 0;
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
    this.seatTrialEnabled = diagnosticParams.get("gtdSeat001") === "1";
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
    const acceptedSouthWard=resolveAcceptedSouthWardPresentation(diagnosticParams);
    const firstLight = createFirstLightRuntimeWorld(
      scene,
      physics,
      ACTIVE_FIRST_LIGHT_WORLD_SOURCE,
      {
        // The accepted humanoid requires existing raised-sidewalk support
        // colliders in every preview, matching current main behavior.
        // Canonical Voight always needs physical sidewalk TOP support.
        // Trial-only support previously allowed feet to clip through paving.
        enableSidewalkSupportCollision: true,
        // Accepted South Ward ground and woodland now load without URL
        // parameters. Explicit ?gtdGround001=0 or ?gtdTreePlace001=0
        // individually restores the former field-test baseline.
        ...acceptedSouthWard,
        // GRN-004: photo grass trials removed. The approved GRN-01 grass is always used.
        // GRN-005: discontinued photo/aerial foliage URL trials are inert.
        // MAT-003: approved apartment and garage brick surfaces are default-on.
        // An explicit ?gtdBrickTrial=0 permits reversible field diagnostics.
        enableBrickMaterialTrial: acceptedBrickSurfaceEnabled(diagnosticParams),
        // MAT-005 candidate business surfaces default to preview-on.
        // ?gtdBrickField=0 removes only the new candidate assignment layer.
        enableBrickBusinessFieldTrial: diagnosticParams.get("gtdBrickField") !== "0",
        // ?gtdBrickFocus=BRK-05 previews another committed surface on corner shop.
        brickBusinessFocusSurface: parseBusinessBrickFocus(
          diagnosticParams.get("gtdBrickFocus")),
        enableWoodSurfaceFieldTrial: diagnosticParams.get("gtdWoodField") !== "0",
        woodSurfaceFocusId: parseWoodFocus(diagnosticParams.get("gtdWoodFocus")),
        // MAT-007 curtain-wall towers replace the prior timber preview.
        enableGlassSurfaceFieldTrial: diagnosticParams.get("gtdGlassField") !== "0",
        glassSurfaceFocusId: parseGlassFocus(diagnosticParams.get("gtdGlassFocus")),
      },
    );
    this.emit({ type: "load-checkpoint", id: "world", status: "done" });
    // Lightweight read-only runtime benchmark: first 15 seconds are warm-up.
    // Bounded memory, no network telemetry and no impact on a disabled trial's
    // tree generation. The same witness exists on all TREE-PLACE preview budgets.
    const treeFrameTimes:number[]=[];
    const treeFrameStart=performance.now();
    let treeSampleCursor=0;
    scene.onAfterRenderObservable.add(()=>{
      if(performance.now()-treeFrameStart<15000)return;
      const ms=engine.getDeltaTime();
      if(!Number.isFinite(ms)||ms<=0)return;
      if(treeFrameTimes.length<3600)treeFrameTimes.push(ms);
      else treeFrameTimes[treeSampleCursor%3600]=ms;
      treeSampleCursor++;
    });
    const treeFramePercentile=(sorted:readonly number[],p:number)=>
      sorted.length?sorted[Math.min(sorted.length-1,
        Math.floor((sorted.length-1)*p))]??null:null;
    (window as Window & {__GTD_TREE_PLACE_REPORT__?:()=>unknown})
      .__GTD_TREE_PLACE_REPORT__=()=>{
        const sorted=[...treeFrameTimes].sort((a,b)=>a-b);
        return {
          schema:"gtd.tree-place-001.accepted.v3",
          enabled:acceptedSouthWard.enableTreePlace001,
          budget:acceptedSouthWard.treeBudget,
          density:acceptedSouthWard.treeDensityFocus,
          forest:firstLight.forestryReport??null,
          scene:{meshes:scene.meshes.length,activeMeshes:scene.getActiveMeshes().length,
            materials:scene.materials.length,textures:scene.textures.length,
            activeFoliageCards:scene.meshes.filter(m=>m.name.startsWith("generated-tree-foliage:")).length,
            currentFps:engine.getFps(),width:engine.getRenderWidth(),height:engine.getRenderHeight()},
          frameTimes:{warmupSeconds:15,framesSampled:treeSampleCursor,
            medianMs:treeFramePercentile(sorted,0.50),
            p95Ms:treeFramePercentile(sorted,0.95),
            peakMs:treeFramePercentile(sorted,1)},
          note:"Observed local frame times after warm-up; run the same walk/flight itinerary and quality preset on each budget. These are NOT GPU-only timings.",
        };
      };
    // GROUND-001: local-only visual witness. Coverage counts do not prove GPU pixels.
    (window as Window & {__GTD_GROUND_REPORT__?: () => unknown})
      .__GTD_GROUND_REPORT__ = () => {
        const groundMesh = scene.getMeshByName("generated-first-light-ground");
        return {
          schema: "gtd.ground001.preview.v1",
          enabled: diagnosticParams.get("gtdGround001") === "1",
          ground: groundMesh?.name ?? null,
          coverage: groundMesh?.metadata?.landUseCoverage ?? null,
          meshEnabled: groundMesh?.isEnabled() ?? false,
          material: groundMesh?.material?.name ?? null,
          note: "Semantic map allocation and draw eligibility only; visually inspect actual game pixels.",
        };
      };
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
        (window as Window & { __GTD_VEH_SEAT_001_REPORT__?: () => unknown })
          .__GTD_VEH_SEAT_001_REPORT__ = () => ({
            schema:"gtd.veh-seat-001.ual-driving-loop.v1",
            enabled:this.seatTrialEnabled,
            drivingClipAvailable:this.characterTrial?.report().drivingClipAvailable ?? false,
            seatedDriverActive:this.seatedDriverActive,
            activeAnimation:this.characterTrial?.report().activeAnimation ?? null,
            driving:this.context==="driving",
            vehicle:this.drivingTrial?.status ?? null,
            note:"Presentation-only trial; car steering, speed and collision are identical to main.",
          });
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
        this.importedCarProbe !== null,isGeneratedFirstLightWorld(firstLight),
      ) && this.importedCarProbe && isGeneratedFirstLightWorld(firstLight)) {
        for(const slot of this.importedCarProbe.report().slots.filter(slot=>
          slot.source==="sports"&&slot.status==="imported"&&slot.finalVisualMetres)) {
          const anchor=scene.getTransformNodeByName("vehicle-probe-anchor:"+slot.id);
          if(!anchor||!slot.finalVisualMetres)continue;
          let car:FirstDriveTrial|null=null;
          try {
            car=new FirstDriveTrial(physics,anchor,{
              x:slot.finalVisualMetres.width,y:slot.finalVisualMetres.height,
              z:slot.finalVisualMetres.length,
            });
            firstLight.releaseParkedCarCollider(slot.id);
            this.sportsCars.set(slot.id,car);
          }catch(error){
            car?.dispose();
            console.error("[VEH-003] Car unavailable",slot.id,error);
          }
        }
        (window as Window & {__GTD_DRIVE_TRIAL_REPORT__?:()=>unknown})
          .__GTD_DRIVE_TRIAL_REPORT__=()=>({
            experiment:"VEH-003",
            current:[...this.sportsCars.entries()].find(([,v])=>v===this.drivingTrial)?.[0]??null,
            cars:[...this.sportsCars.entries()].map(([id,v])=>({id,pose:v.pose,status:v.status})),
          });
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
    if(this.seatedDriverActive)this.characterTrial?.exitDrivingPose();
    this.seatedDriverActive=false;
    for(const car of this.sportsCars.values())car.dispose();
    this.sportsCars.clear();
    this.drivingTrial=null;
    this.enteredAt=null;
    this.carEnteredAt=null;
    delete (window as Window & { __GTD_DRIVE_TRIAL_REPORT__?: unknown }).__GTD_DRIVE_TRIAL_REPORT__;
    delete (window as Window & { __GTD_VEH_SEAT_001_REPORT__?: unknown }).__GTD_VEH_SEAT_001_REPORT__;
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
    this.flightEnabled = false;
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
      if (command.action === "fly") {
        if (command.pressed && this.lifecycle === "running") {
          const next = toggleInspectionFlight(
            {enabled:this.flightEnabled,verticalSpeed:0}, this.context);
          if (next.enabled !== this.flightEnabled) {
            this.flightEnabled = next.enabled;
            this.verticalVelocity = 0;
            this.grounded = false;
            this.actions.delete("jump"); // no stale held ascent on transition
            this.actions.delete("descend");
            this.emit({type:"interaction",label:next.enabled
              ? "FLIGHT INSPECTION · WASD move · SPACE ascend · CTRL descend · SHIFT faster · G land"
              : "Flight disabled · gravity and grounded movement restored"});
            this.publishSnapshot(0);
          }
        }
        return; // a toggle, never a held action
      }
      if (command.action === "vehicle" && command.pressed && this.flightEnabled) {
        this.emit({type:"interaction",label:"Disable flight (G) before entering a vehicle"});
        return;
      }
      if (command.action === "vehicle" && command.pressed &&
          (this.context==="driving"||this.sportsCars.size>0)) {
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

  /** VEH-003: boarding cannot remotely teleport the actor across South Ward. */
  private toggleFerrariDriving() {
    const physics=this.physics, voight=this.voight;
    if(!physics||!voight)return;
    if(this.context==="driving") {
      const car=this.drivingTrial;
      if(!car)return;
      if(Math.abs(car.speedMps)>0.25){
        this.emit({type:"interaction",label:"Stop the Ferrari before exiting"});
        return;
      }
      const position=stationaryDisembark(this.enteredAt,this.carEnteredAt,car.pose)
        ??car.findSafeExitPosition();
      if(!position){
        this.emit({type:"interaction",label:"No clear exit beside stopped vehicle"});
        return;
      }
      physics.setPlayerPosition(position);
      if(this.seatedDriverActive)this.characterTrial?.exitDrivingPose();
      this.seatedDriverActive=false;
      voight.root.position.set(position.x,position.y,position.z);
      this.camera?.target.set(position.x,position.y+0.55,position.z);
      this.context="walking";
      this.drivingTrial=null;
      this.enteredAt=null;this.carEnteredAt=null;
      voight.root.setEnabled(true);
      this.move={x:0,y:0};
      this.preferredCameraRadius=6.2;
      this.publishSnapshot(0);
      this.emit({type:"interaction",label:"Exited Ferrari at its actual world position"});
      return;
    }
    const actor=physics.playerPosition();
    const nearest=nearestSportsCar(actor,
      [...this.sportsCars.entries()].map(([id,car])=>({id,pose:car.pose})));
    if(!nearest){
      this.emit({type:"interaction",label:"Approach a nearby Ferrari before pressing F"});
      return;
    }
    const car=this.sportsCars.get(nearest.id);
    if(!car)return;
    this.enteredAt={...actor};this.carEnteredAt={...car.pose};
    this.drivingTrial=car;this.context="driving";
    // Only this isolated experiment attempts a visible seated driver.
    // A missing binary animation falls back to the EXACT L0 hidden-driver
    // presentation; it never applies an improvised pose to the live character.
    this.seatedDriverActive=this.seatTrialEnabled &&
      (this.characterTrial?.enterDrivingPose() ?? false);
    voight.root.setEnabled(this.seatedDriverActive);
    if(this.seatedDriverActive)this.syncFerrariDriverSeat(car);
    this.move={x:0,y:0};
    this.preferredCameraRadius=FERRARI_REAR_CAMERA_RADIUS;
    const p=car.pose;
    if(this.camera){
      this.camera.alpha=ferrariRearCameraAlpha(car.headingYaw);
      this.camera.beta=FERRARI_REAR_CAMERA_BETA;
      this.camera.radius=FERRARI_REAR_CAMERA_RADIUS;
      this.camera.target.set(p.x,p.y+0.7,p.z);
    }
    this.publishSnapshot(0);
    this.emit({type:"interaction",label:"Ferrari driving · WASD / arrows · F exit when stopped"});
  }

  /** Pure vehicle-relative presentation. Physics remains the unchanged L0
   * Rapier actor; there is no second collider or velocity source for Voight. */
  private syncFerrariDriverSeat(car:FirstDriveTrial) {
    const voight=this.voight;
    if(!voight)return;
    const seat=ferrariSeatWorldPose({
      x:car.anchor.position.x,y:car.anchor.position.y,
      z:car.anchor.position.z,yaw:car.headingYaw,
    },car.dimensions);
    voight.root.position.set(seat.x,seat.y,seat.z);
    voight.root.rotation.y=seat.yaw;
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
      if(this.seatedDriverActive){
        this.syncFerrariDriverSeat(trial);
        this.characterTrial?.updateDrivingPose(dt);
      }
      const position = trial.pose;
      this.world?.update(dt, position);
      camera.target.set(position.x, position.y + 0.7, position.z);
      // Follow the CAR'S heading delta, not a hard-coded target bearing.
      // The user's pointer/touch look updates above are preserved, rather
      // than auto-overridden on every simulation frame.
      camera.alpha = advanceFerrariCameraAlpha(
        camera.alpha, previousYaw, trial.headingYaw,
      );
      this.preferredCameraRadius=FERRARI_REAR_CAMERA_RADIUS;
      this.resolveCameraObstruction(camera,position,dt);
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
    if (this.flightEnabled) {
      const current = physics.playerPosition();
      const flight = flightDisplacement({
        horizontalX:desired.x, horizontalZ:desired.z,
        ascend:this.actions.has("jump"), descend:this.actions.has("descend"),
        sprint:this.actions.has("sprint"),
      },dt,current.y);
      const movement = physics.movePlayer(flight);
      const position = physics.playerPosition();
      this.world?.update(dt,position);
      this.verticalVelocity = 0;
      this.grounded = false;
      this.curbStepSeconds = 0;
      voight.root.position.set(position.x,position.y,position.z);
      const flyingForward=this.move.y < -0.05;
      const flyingBackward=this.move.y > 0.05;
      const accelerated=this.actions.has("sprint");
      const provisionalFacing=flightFacingPolicy({
        forward:flyingForward,backward:flyingBackward,accelerated,
      },Infinity);
      let remainingYawError=Infinity;
      // Normal S: preserve orientation and play modest backward lean.
      // Shift+S: turn around toward motion before entering prone fast flight.
      if(desired.lengthSquared()>0.001&&provisionalFacing.turnTowardTravel){
        const yaw=stepTravelHeading(voight.root.rotation.y,
          desired.x,desired.z,dt,this.headingSettings,this.headingTurnSign);
        voight.root.rotation.y=yaw.yaw;
        this.headingTurnSign=yaw.turnSign;
        remainingYawError=yaw.remainingErrorRad;
      }
      const facing=flightFacingPolicy({
        forward:flyingForward,backward:flyingBackward,accelerated,
      },remainingYawError);
      this.characterTrial?.updateFlightAnimation({
        dt,
        forward:flyingForward,
        backward:flyingBackward,
        left:this.move.x < -0.05,
        right:this.move.x > 0.05,
        ascending:movement.movement.y > 0.001,
        descending:movement.movement.y < -0.001,
        // A reversing pilot must face travel BEFORE the horizontal/prone
        // animation activates; do not "sleep" facing backward.
        accelerated:accelerated&&(!flyingBackward||facing.playFastReverse),
      });
      camera.target.set(position.x,position.y+0.55,position.z);
      this.preferredCameraRadius = 8;
      this.resolveCameraObstruction(camera,position,dt);
      this.snapshotAccumulator+=dt;
      if (this.snapshotAccumulator>=SNAPSHOT_INTERVAL) {
        this.snapshotAccumulator=0;
        this.publishSnapshot(Math.hypot(movement.movement.x,movement.movement.y,
          movement.movement.z)/Math.max(dt,0.0001));
      }
      return;
    }
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
    // Autostep is already physics-authorized by Rapier. Briefly play the
    // imported character's existing jump/step clip on a real curb ascent,
    // rather than letting running feet slide through a raised curb face.
    if (isCurbAscent(movement.movement.y, correctedPlanarMps, this.grounded)) {
      this.curbStepSeconds = 0.16;
    } else {
      this.curbStepSeconds = Math.max(0, this.curbStepSeconds - dt);
    }
    const gaitDecision = this.characterTrial?.updateAnimation({
      correctedPlanarSpeed: correctedPlanarMps,
      rawGrounded: this.grounded,
      intentMagnitude: desired.length(),
      sprintRequested: this.actions.has("sprint"),
      jumpAscending: (!this.grounded && this.verticalVelocity > 0.2) ||
        this.curbStepSeconds > 0,
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
      objective: this.flightEnabled
        ? "FLIGHT INSPECTION · G land · WASD move · SPACE up · CTRL down · SHIFT fast"
        : this.sportsCars.size > 0
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
      flying: this.flightEnabled,
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
