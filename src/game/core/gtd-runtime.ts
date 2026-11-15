import {normalizeThirdPersonCameraDistance,CAMERA_DISTANCE_DEFAULT} from "@/ui/menus/settings-state";
import {HUMAN_WALK_SPEED_119} from "../character/retargeted-walk-110";
import {stepHumanTravelSpeed120} from "../character/retargeted-sprint-120";
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
import { configureLocalGameDecoders } from "./local-decoders";
import { FirstDriveTrial } from "../vehicles/first-drive-trial";
import { measureVehicleFit002 } from "../vehicles/vehicle-fit-diagnostics";
import {
  RANGE_ROVER_STREET_PROFILE,prepareRangeRoverWheelRig,
  rangeRoverDriveEnabled,
  rangeRoverDriverSeatWorldPose,rangeRoverRearCameraAlpha,
} from "../vehicles/range-rover-drive-007";
import {extraDriveName,extraDriveProfile,prepareNativeFleetWheelRig,
  type FiveModelName} from "../vehicles/ambient-fleet-driving-011";
import {splitOriginalMergedWheelGeometry}
  from "../vehicles/merged-original-wheel-extraction-012";
import {evaluateWheelRigAdmission} from "../vehicles/mvrs-wheel-admission-001";
function productionHostnameForFit002(name: string) {
  return name === "grand-theft-division.vercel.app";
}
import { ferrariRearCameraAlpha, advanceFerrariCameraAlpha, FERRARI_REAR_CAMERA_BETA, FERRARI_REAR_CAMERA_RADIUS } from "../vehicles/ferrari-camera";
import { nearestAccessiblePlanarCar, currentVehicleDisembark, VEHICLE_BOARD_RADIUS } from "../vehicles/local-boarding";
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
  ACTIVE_FIRST_LIGHT_WORLD_SOURCE,
  createFirstLightRuntimeWorld,
  isGeneratedFirstLightWorld,
  type RuntimeFirstLightWorld,
} from "../world/first-light-runtime-source";
import type { VoightPrototype } from "../character/voight";
import {MERCER_STATIC_CHARACTER_POSE} from "../world/mercer-static-character-103";
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

import { MovementInputArbiter } from "../input/movement-input-arbiter";
import { recordGameplayAnalytics } from "@/lib/gameplay-analytics/client";
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
  private readonly sportsCars=new Map<string,FirstDriveTrial>();
  private readonly movementArbiter = new MovementInputArbiter();
  private readonly driveVehicleNames=new Map<string,FiveModelName>();
  private rangeRoverTrialEnabled=false;
  private drivingTrial: FirstDriveTrial | null = null;
  private seatTrialEnabled = false;
  private fit002Enabled = false;
  private driverPose002Enabled = false;
  private cabinFit003Enabled = false;
  private cabinFit004Enabled = false;
  private driverPose002Mode: "feet"|"hands"|"both" = "both";
  private groundFit002Enabled = false;
  private wheelSupport002Enabled = false;
  private seatedDriverActive = false;
  private worldRenderWarmup: WorldRenderWarmup | null = null;
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;
  private physics: MeridianPhysics | null = null;
  private voight: VoightPrototype | null = null;
  private humanCharacterEnabled=false;
  private humanTravelSpeedMps=HUMAN_WALK_SPEED_119;
  private humanoidSavedPose:{x:number;y:number;z:number;yaw:number}|null=null;
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
  private analyticsSampleAt = 0;
  private preferredCameraRadius = CAMERA_DISTANCE_DEFAULT;
  private onFootCameraRadius = CAMERA_DISTANCE_DEFAULT;
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
    configureLocalGameDecoders();
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
    // VEH-007 owner-authorized release: Range Rover loads on /game, even
    // when the URL has no query string. Explicit =0 remains the rollback.
    this.rangeRoverTrialEnabled=rangeRoverDriveEnabled(diagnosticParams);
    // FIT004 owner acceptance: promote only the seated driver, AR1 joint
    // fitting and measured lower-leg clearance on the canonical production
    // domain. Every accepted layer can be explicitly disabled for rollback.
    // Leave experimental road-ground and wheel-travel mechanisms behind
    // their original non-production flags until independently accepted.
    const releasedDrivingFit=productionHostnameForFit002(window.location.hostname);
    this.seatTrialEnabled=releasedDrivingFit
      ? diagnosticParams.get("gtdSeat001")!=="0"
      : (this.rangeRoverTrialEnabled||diagnosticParams.get("gtdSeat001")==="1");
    this.fit002Enabled=diagnosticParams.get("gtdVehFit002")==="1" &&
      !releasedDrivingFit;
    const fitPoseMode=diagnosticParams.get("gtdFitPose002");
    this.driverPose002Enabled=releasedDrivingFit
      ? fitPoseMode!=="0"
      : fitPoseMode!=="0" &&
        (this.rangeRoverTrialEnabled || ["1","feet","hands"].includes(fitPoseMode??""));
    this.driverPose002Mode=fitPoseMode==="feet"?"feet":
      fitPoseMode==="hands"?"hands":"both";
    this.cabinFit003Enabled=this.driverPose002Enabled &&
      diagnosticParams.get("gtdCabinFit003")==="1" &&
      !releasedDrivingFit;
    this.cabinFit004Enabled=this.driverPose002Enabled && (
      releasedDrivingFit
        ? diagnosticParams.get("gtdCabinFit004")!=="0"
        : diagnosticParams.get("gtdCabinFit004")!=="0" &&
          (this.rangeRoverTrialEnabled || diagnosticParams.get("gtdCabinFit004")==="1"));
    this.groundFit002Enabled = diagnosticParams.get("gtdFitGround002") === "1" && !productionHostnameForFit002(window.location.hostname);
    this.wheelSupport002Enabled = diagnosticParams.get("gtdFitWheel002") === "1" && !productionHostnameForFit002(window.location.hostname);
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
        // VEH-007 released SUV loads by default; never mount delegated Sedan
        // or deferred ergoninane. Opt out with ?gtdRangeRoverDrive=0.
        enableRangeRoverDriveReview: this.rangeRoverTrialEnabled,
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
    // LOAD-062: user-exportable, no-network snapshot from *all* six imports.
    // Survives one failed Promise.all so the user can distinguish a blocked
    // Range Rover from five other completed or still-running vehicles.
    if(isGeneratedFirstLightWorld(firstLight)&&firstLight.rangeRoverReview){
      (window as Window & {__GTD_NATIVE_FLEET_DIAGNOSTICS__?:()=>unknown})
        .__GTD_NATIVE_FLEET_DIAGNOSTICS__=()=>firstLight.rangeRoverReview?.instances.map(parked=>{
          const t=parked.loadTelemetry;
          return {assetId:parked.spec.id,sourceBytes:parked.spec.sourceBytesKnown??null,
            attempts:t.loadAttempts,loaderElapsedMs:t.loaderElapsedMs,
            containerReadyMs:t.containerReadyMs,instantiateMs:t.instantiateMs,
            errorCode:t.errorCode,
            state:t.errorCode?"failed":t.instantiateMs!==null?"loaded":"loading"};
        })??[];
    }
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
        vehicles: [...this.sportsCars.entries()].map(([id,car]) => ({
          id, name: this.driveVehicleNames.get(id) ?? "unknown",
          wheelRigReady: car.status.wheelRigReady,
        })),
        warmup: this.worldRenderWarmup?.snapshot() ?? lastTrialWarmup,
        surfaceIsolation: groundIsolation,
      });
    }
    // VEH-013: retire the remote Ferrari/Buggy importer completely.
    // No HTTP source requests, static placeholders, or hidden parked colliders.
    this.emit({ type: "load-checkpoint", id: "vehicle-offroad", status: "skipped",
      detail: "Retired imported vehicle removed from game" });
    this.emit({ type: "load-checkpoint", id: "vehicle-sports", status: "skipped",
      detail: "Retired imported vehicle removed from game" });
    this.emit({ type: "load-checkpoint", id: "vehicle-loader", status: "running",
      detail: "Awaiting four original locally stored vehicle models" });
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
      CAMERA_DISTANCE_DEFAULT,
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
        if (this.fit002Enabled) {
          (window as Window & { __GTD_VEH_FIT_002_DRIVER__?: () => unknown })
            .__GTD_VEH_FIT_002_DRIVER__ = () => this.characterTrial?.driverContactReport() ?? null;
          (window as Window & { __GTD_VEH_FIT_002_REPORT__?: () => unknown })
            .__GTD_VEH_FIT_002_REPORT__ = () => measureVehicleFit002(
              scene, this.drivingTrial, this.characterTrial, this.fit002Enabled,
            );
        }
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
      // Only the six owner-supplied local traffic-review GLBs
      // are blocking vehicle imports. No remote Buggy/Ferrari dependency.
      if (isGeneratedFirstLightWorld(firstLight) && firstLight.rangeRoverReviewReady) {
        try {
          await firstLight.rangeRoverReviewReady;
        } catch(error) {
          // LOAD-062: capture failed asset even when fleet Promise.all rejects.
          for(const parked of firstLight.rangeRoverReview?.instances??[]){
            const t=parked.loadTelemetry;
            if(t.errorCode===null)continue;
            this.emit({type:"asset-observation",assetId:parked.spec.id,
              sourceKind:"local-glb",sourceBytesKnown:parked.spec.sourceBytesKnown??null,
              containerReadyMs:null,instantiateMs:null,result:"failed",
              errorCode:t.errorCode});
          }
          this.emit({type:"load-checkpoint",id:"vehicle-loader",status:"failed",
            detail:error instanceof Error?error.message:"Native fleet download failed"});
          throw error;
        }
        this.emit({ type: "load-checkpoint", id: "vehicle-loader", status: "done",
          detail: "Six native vehicle GLBs instantiated" });
      } else {
        this.emit({ type: "load-checkpoint", id: "vehicle-loader", status: "skipped",
          detail: "No native vehicle models requested" });
      }
      if (this.host !== host || this.engine !== engine) return;
      if(isGeneratedFirstLightWorld(firstLight)) {
        for(const parked of firstLight.rangeRoverReview?.instances??[]) {
          this.emit({type:"asset-observation",assetId:parked.spec.id,
            sourceKind:"local-glb",sourceBytesKnown:parked.spec.sourceBytesKnown??null,
            containerReadyMs:parked.loadTelemetry.containerReadyMs,
            instantiateMs:parked.loadTelemetry.instantiateMs,result:"loaded",errorCode:null});
        }
      }
      // VEH-011: all imported originals enter the existing, single Rapier
      // drive solver. Move static collider ownership only after the actor is
      // successfully created; never leave duplicate invisible colliders.
      if(this.rangeRoverTrialEnabled&&isGeneratedFirstLightWorld(firstLight)&&
        firstLight.rangeRoverReview) {
        for(const parked of firstLight.rangeRoverReview.instances) {
          if(parked.spec.visualOnly)continue;
          const dims=parked.drivingDimensions;
          if(!dims) {
            console.warn("[VEH011] Original GLB dimensions unavailable",parked.spec.id);
            continue;
          }
          const rover=parked.spec.id==="gtd-veh006-mercer-range-rover";
          const extra=rover?null:extraDriveName(parked.spec.id);
          if(!rover&&!extra)continue;
          const name:FiveModelName=rover?"Range Rover":extra!;
          let actor:FirstDriveTrial|null=null;
          try {
            const discovered=rover?prepareRangeRoverWheelRig(parked.anchor):
              prepareNativeFleetWheelRig(parked.anchor,extra!);
            // The Defender's source has a single Draco mesh. First try exact
            // original independent meshes; only then attempt non-procedural
            // separation of four symmetric tire islands from that source.
            // A failed audit leaves the original geometry completely intact.
            // The BMW is qualified by its offline source rig only; Lamborghini
            // already has original wheel-control nodes. Never do expensive or
            // speculative triangle cutting on either model at runtime.
            const offlineOnly=extra==="BMW M4"||extra==="Lamborghini Temerario";
            const separated=!rover&&!offlineOnly&&discovered.identified!==4
              ?splitOriginalMergedWheelGeometry(parked.anchor,
                extraDriveProfile(extra!).wheelRadiusFallbackMetres)
              :null;
            const mapping=separated?.mapping??discovered.mapping;
            const admission=evaluateWheelRigAdmission(
              parked.anchor,mapping,null,true);
            if(!admission.qualified){
              console.warn("[WHEEL-001] No drivable wheel rig; keeping original parked",
                parked.spec.id,admission.code,{
                  discovery:rover?"accepted-rover-rig":discovered.identified,
                  extraction:separated?.reason??"not-attempted",
                });
              continue;
            }
            const wheelCount=admission.wheelCount;
            actor=new FirstDriveTrial(physics,parked.anchor,dims,
              rover?RANGE_ROVER_STREET_PROFILE:extraDriveProfile(extra!),
              mapping,false,false);
            parked.releaseStaticCollider();
            this.sportsCars.set(parked.spec.id,actor);
            this.driveVehicleNames.set(parked.spec.id,name);
            console.info("[WHEEL-001] Four original-wheel nodes structurally ready",
              parked.spec.id,{source:separated?.reason??"independent-source-nodes",
                extractedSourceTriangles:separated?.separatedTriangles??0,
                qualification:"preview-only; owner visual acceptance pending"});
          }catch(error){
            actor?.dispose();
            console.error("[VEH011] Cannot initialize original driving actor",
              parked.spec.id,error);
            // A single model cannot block other drivable imports.
          }
        }
      }
      if(this.sportsCars.size>0) {
        (window as Window & {__GTD_DRIVE_TRIAL_REPORT__?:()=>unknown})
          .__GTD_DRIVE_TRIAL_REPORT__=()=>({
            experiment:this.rangeRoverTrialEnabled?"VEH-007":"VEH-003",
            current:[...this.sportsCars.entries()].find(([,v])=>v===this.drivingTrial)?.[0]??null,
            cars:[...this.sportsCars.entries()].map(([id,v])=>({
              id,name:this.driveVehicleNames.get(id)??"Ferrari",
              pose:v.pose,status:v.status,
            })),
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
        () => null,
      );
    }
  }

  start(): void {
    if (this.lifecycle !== "ready" && this.lifecycle !== "paused") return;
    this.lifecycle = "running";
    if (this.scene) {
      // Babylon also keeps a wall-clock baseline independently of Rapier.
      // Reset it so an hour in the background cannot skip animation frames.
      this.scene._animationTimeLast = 0;
      this.scene.animationsEnabled = true;
    }
    this.accumulator = 0;
    this.previousTime = performance.now();
    this.publishSnapshot();
    this.schedule();
  }

  pause(): void {
    if (this.lifecycle !== "running" && this.lifecycle !== "ready") return;
    this.lifecycle = "paused";
    this.accumulator = 0;
    this.actions.clear();
    this.movementArbiter.clear();
    this.move = { x: 0, y: 0 };
    this.look = { x: 0, y: 0 };
    this.pendingTouchLook = { x: 0, y: 0 };
    if (this.frameHandle !== null) cancelAnimationFrame(this.frameHandle);
    this.frameHandle = null;
    // Keep the last rendered pose; do not advance animation on pause.
    if (this.scene) this.scene.animationsEnabled = false;
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
    this.driveVehicleNames.clear();
    this.drivingTrial=null;
    delete (window as Window & { __GTD_DRIVE_TRIAL_REPORT__?: unknown }).__GTD_DRIVE_TRIAL_REPORT__;
    delete (window as Window & { __GTD_VEH_SEAT_001_REPORT__?: unknown }).__GTD_VEH_SEAT_001_REPORT__;
    delete (window as Window & { __GTD_VEH_FIT_002_REPORT__?: unknown }).__GTD_VEH_FIT_002_REPORT__;
    delete (window as Window & { __GTD_VEH_FIT_002_DRIVER__?: unknown }).__GTD_VEH_FIT_002_DRIVER__;
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
    this.characterTrial?.disposeDriverContact();
    this.characterTrial = null;
    this.humanCharacterEnabled=false;
    this.humanoidSavedPose=null;
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
    this.movementArbiter.clear();
    this.flightEnabled = false;
    this.pendingTouchLook = { x: 0, y: 0 };
    this.lifecycle = "destroyed";
    this.publishSnapshot();
    this.snapshotListeners.clear();
    this.eventListeners.clear();
  }

  command(command: GameCommand): void {
    // Late pointer/keyboard events must not re-arm input after a pause.
    if (this.lifecycle !== "running" && (command.type === "move" ||
        command.type === "look" || command.type === "look-delta" ||
        (command.type === "action" && command.pressed))) return;
    if(command.type==="enable-character"){
      this.switchHumanCharacter(command.enabled);
      return;
    }
    if (command.type === "move") {
      const next = this.movementArbiter.apply(command);
      if (!next) return;
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
    if(command.type==="physics-foot-debug"){
      this.humanAsset()?.configureFootDebug(command.settings,(point,distance)=>
        this.physics?.probeGround(point,distance)??null);
      return;
    }
    if (command.type === "camera-settings") {
      this.touchCameraSensitivity = normalizeTouchCameraSensitivity(command.touchSensitivity);
      this.invertLookY = command.invertY;
      if(command.distanceMeters!==undefined){
        this.onFootCameraRadius=normalizeThirdPersonCameraDistance(command.distanceMeters);
        if(this.context!=="driving")this.preferredCameraRadius=this.onFootCameraRadius;
      }
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
        this.toggleVehicleDriving();
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

  /** OPT-03: Same wall-aware eligibility for the action button and F boarding.
   * Existing vehicle-only building footprints include walls and sealed corners. */
  private nearestAccessibleVehicle(actor:{x:number;y:number;z:number}){
    const obstacles=this.physics && typeof this.physics.vehicleNoStepFootprintsNear==="function"
      ?this.physics.vehicleNoStepFootprintsNear(actor,VEHICLE_BOARD_RADIUS+2):[];
    return nearestAccessiblePlanarCar(actor,
      [...this.sportsCars.entries()].map(([id,car])=>({id,pose:car.pose})),obstacles);
  }
  /** VEH-BASIC-001: car-only driving. No character seats or cabin poses.
   * Always exit beside the LIVE car, never where F was pressed to board. */
  private toggleVehicleDriving() {
    const physics=this.physics,voight=this.voight;
    if(!physics||!voight)return;
    if(this.context==="driving"){
      const car=this.drivingTrial;
      if(!car)return;
      if(Math.abs(car.speedMps)>0.25){
        this.emit({type:"interaction",label:"Stop the "+this.activeDriveName()+" before exiting"});
        return;
      }
      // Existing Rapier clearance/ground checks on the CURRENT car are
      // authoritative. A blocked exit keeps the hidden driver inside.
      const position=currentVehicleDisembark(car);
      if(!position){
        this.emit({type:"interaction",label:"No clear exit beside stopped vehicle"});
        return;
      }
      const leavingName=this.activeDriveName();
      const yaw=car.headingYaw;
      physics.setPlayerPosition(position);
      voight.root.position.set(position.x,position.y,position.z);
      voight.root.rotation.y=yaw;
      // Teleport the accepted native actor BEFORE enabling its meshes.
      const native=this.humanCharacterEnabled?this.humanAsset():null;
      native?.updateControlled(position,yaw,0,0);
      native?.setDrivingHidden(false);
      voight.root.setEnabled(!this.humanCharacterEnabled);
      this.seatedDriverActive=false;
      this.context="walking";
      this.drivingTrial=null;
      this.move={x:0,y:0};
      this.movementArbiter.clear();
      this.verticalVelocity=0;
      this.camera?.target.set(position.x,position.y+.55,position.z);
      this.preferredCameraRadius=this.onFootCameraRadius;
      this.publishSnapshot(0);
      this.emit({type:"interaction",label:"Exited "+leavingName+" beside its current location"});
      return;
    }
    const actor=physics.playerPosition();
    const nearest=this.nearestAccessibleVehicle(actor);
    if(!nearest){
      this.emit({type:"interaction",label:"Approach a nearby vehicle before pressing F"});
      return;
    }
    const car=this.sportsCars.get(nearest.id);
    if(!car)return;
    const native=this.humanCharacterEnabled?this.humanAsset():null;
    if(this.humanCharacterEnabled&&!native){
      this.emit({type:"interaction",label:"Native character is not ready for boarding"});
      return;
    }
    this.movementArbiter.clear();
    this.move={x:0,y:0};
    this.drivingTrial=car;
    this.context="driving";
    // Explicitly bypass every UAL Driving_Loop and cabin-fit procedure.
    // Vehicle controls, physics and heading continue as they were.
    this.seatedDriverActive=false;
    voight.root.setEnabled(false);
    native?.setDrivingHidden(true);
    const position=car.pose;
    voight.root.position.set(position.x,position.y,position.z);
    voight.root.rotation.y=car.headingYaw;
    native?.syncHiddenDrivingPose(position,car.headingYaw);
    this.preferredCameraRadius=FERRARI_REAR_CAMERA_RADIUS;
    if(this.camera){
      this.camera.alpha=this.activeDriveName()!=="Ferrari"
        ?rangeRoverRearCameraAlpha(car.headingYaw)
        :ferrariRearCameraAlpha(car.headingYaw);
      this.camera.beta=FERRARI_REAR_CAMERA_BETA;
      this.camera.radius=FERRARI_REAR_CAMERA_RADIUS;
      this.camera.target.set(position.x,position.y+.7,position.z);
    }
    this.publishSnapshot(0);
    this.emit({type:"interaction",label:this.activeDriveName()+" driving · WASD / arrows · F exit when stopped"});
  }

  /** Return the active live physics actor's actual vehicle type. */
  private activeDriveName():FiveModelName{
    const id=[...this.sportsCars.entries()].find(([,v])=>v===this.drivingTrial)?.[0];
    return id?this.driveVehicleNames.get(id)??"Ferrari":"Ferrari";
  }

  /** CHAR-105 — one Rapier player and one camera, reversible visual actor. */
  private humanAsset(){
    return this.world&&isGeneratedFirstLightWorld(this.world)
      ? this.world.staticMercerCharacter : null;
  }
  private switchHumanCharacter(enabled:boolean):void{
    if(enabled===this.humanCharacterEnabled)return;
    const actor=this.humanAsset();
    const physics=this.physics,voight=this.voight,camera=this.camera;
    if(!actor||!physics||!voight||!camera||this.lifecycle==="destroyed"){
      this.emit({type:"interaction",label:"Human character asset not ready"});
      return;
    }
    if(this.context!=="walking"||this.flightEnabled){
      this.emit({type:"interaction",label:"Exit vehicle / flight before enabling Character"});
      return;
    }
    this.move={x:0,y:0};this.movementArbiter.clear();this.actions.clear();
    this.verticalVelocity=0;this.grounded=false;
    if(enabled){
      const p=physics.playerPosition();
      this.humanoidSavedPose={...p,yaw:voight.root.rotation.y};
      const next={x:MERCER_STATIC_CHARACTER_POSE.x,y:.92,
        z:MERCER_STATIC_CHARACTER_POSE.z};
      physics.setPlayerPosition(next);
      voight.root.setEnabled(false);
      this.humanCharacterEnabled=true;
      this.humanTravelSpeedMps=HUMAN_WALK_SPEED_119;
      actor.setControlled(true);
      actor.updateControlled(next,0,0,0);
      camera.target.set(next.x,next.y+.55,next.z);
      this.emit({type:"interaction",label:"CHAR-105 human enabled · walking verification"});
    }else{
      const previous=this.humanoidSavedPose??physics.playerPosition();
      physics.setPlayerPosition(previous);
      voight.root.position.set(previous.x,previous.y,previous.z);
      voight.root.rotation.y=this.humanoidSavedPose?.yaw??0;
      voight.root.setEnabled(true);
      actor.setControlled(false);
      this.humanCharacterEnabled=false;this.humanoidSavedPose=null;
      this.humanTravelSpeedMps=HUMAN_WALK_SPEED_119;
      camera.target.set(previous.x,previous.y+.55,previous.z);
      this.emit({type:"interaction",label:"Development humanoid restored"});
    }
    this.publishSnapshot(0);
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
      if (time - this.analyticsSampleAt >= 1000) {
        this.analyticsSampleAt = time;
        const scene = this.scene;
        recordGameplayAnalytics("game.runtime-window", {
          fps: this.engine?.getFps() ?? null,
          sceneMeshCount: scene?.meshes.length ?? null,
          activeMeshCount: scene?.getActiveMeshes().length ?? null,
          hardwareScalingLevel: this.engine?.getHardwareScalingLevel() ?? null,
          lifecycle: this.lifecycle,
          context: this.context,
          vehicle: this.snapshot.vehicle,
          location: this.snapshot.location,
        });
      }
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
      // Arrow touch control ramps like analogue steering (~0.42s to full
      // lock) while accepted joystick, keyboard and controller retain their
      // existing response (0.18s). Both use the same vehicle solver.
      trial.prepare(dt, this.move.x, this.move.y,
        this.movementArbiter.lastSteeringSource === "touch-arrows" ? 1.2 : undefined);
      // Exactly one Rapier step each fixed tick. The existing character
      // controller owns the step until world physics is centrally refactored.
      physics.movePlayer({ x: 0, y: 0, z: 0 });
      trial.finish(dt);
      const position = trial.pose;
      // Keep hidden actor's logical world position aligned with the car.
      voight.root.position.set(position.x,position.y,position.z);
      voight.root.rotation.y=trial.headingYaw;
      if(this.humanCharacterEnabled)
        this.humanAsset()?.syncHiddenDrivingPose(position,trial.headingYaw);
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
    // CHAR-120: sprint on imported Voight is a separate authored gait AND real
    // physical acceleration. Preserve the established walk speed and legacy UAL policy.
    const humanSprintRequested=this.humanCharacterEnabled && this.context==="walking" &&
      this.actions.has("sprint") && desired.lengthSquared()>0.001;
    if(this.humanCharacterEnabled)
      this.humanTravelSpeedMps=stepHumanTravelSpeed120(
        this.humanTravelSpeedMps,humanSprintRequested,dt);
    const speed = this.humanCharacterEnabled ? this.humanTravelSpeedMps :
      this.actions.has("sprint") ? SPRINT_SPEED : WALK_SPEED;
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
      const flightVisual={
        dt,
        forward:flyingForward,
        backward:flyingBackward,
        left:this.move.x < -0.05,
        right:this.move.x > 0.05,
        ascending:movement.movement.y > 0.001,
        descending:movement.movement.y < -0.001,
        accelerated:accelerated&&(!flyingBackward||facing.playFastReverse),
      };
      // CHAR-129: keep Rapier travel and flight policy unchanged. Route
      // visual animation to precisely ONE visible actor. Voight's original
      // GLB uses its accepted native skeleton, never UAL retargeted poses.
      if(this.humanCharacterEnabled)
        this.humanAsset()?.updateControlledFlight(position,voight.root.rotation.y,flightVisual);
      else this.characterTrial?.updateFlightAnimation(flightVisual);
      camera.target.set(position.x,position.y+0.55,position.z);
      this.preferredCameraRadius = this.onFootCameraRadius;
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
    const gaitDecision = !this.humanCharacterEnabled ? this.characterTrial?.updateAnimation({
      correctedPlanarSpeed: correctedPlanarMps,
      rawGrounded: this.grounded,
      intentMagnitude: desired.length(),
      sprintRequested: this.actions.has("sprint"),
      jumpAscending: (!this.grounded && this.verticalVelocity > 0.2) ||
        this.curbStepSeconds > 0,
      dt,
    }) : undefined;
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
      if(this.humanCharacterEnabled)
        this.humanAsset()?.updateControlled(
          position,headingStep.yaw,correctedPlanarMps,dt,
          humanSprintRequested && this.grounded && correctedPlanarMps>.25,
          this.grounded,this.verticalVelocity);
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
          ? this.activeDriveName()+" trial · Drive with WASD / arrows · F to exit when stopped"
          : this.rangeRoverTrialEnabled
            ? "Six-vehicle drive trial · Approach any car and press F to drive"
            : "Ferrari trial · Press F to enter the sports car"
        : this.world?.objective ?? "Walk the generated South Ward garage corner",
      health: 100,
      reputation: 0,
      heat: 0,
      speed: Math.round(speed * 3.6),
      vehicle: this.context === "driving" && this.drivingTrial
        ? this.activeDriveName()+(this.activeDriveName()==="Ferrari"
          ? " · EXP-VEH-002" : " · VEH-011")
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
    recordGameplayAnalytics("game." + event.type, event as unknown as Record<string, unknown>);
    this.eventListeners.forEach((listener) => listener(event));
  }
}

