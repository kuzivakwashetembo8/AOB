import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  Ray,
  Scene,
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
import { FL4Diagnostics } from "../debug/fl4-diagnostics";
import {
  ACTIVE_FIRST_LIGHT_WORLD_SOURCE,
  createFirstLightRuntimeWorld,
  type RuntimeFirstLightWorld,
} from "../world/first-light-runtime-source";
import { createVoightPrototype, type VoightPrototype } from "../character/voight";

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
  private scene: Scene | null = null;
  private camera: ArcRotateCamera | null = null;
  private physics: MeridianPhysics | null = null;
  private voight: VoightPrototype | null = null;
  private world: RuntimeFirstLightWorld | null = null;
  private lifecycle: Lifecycle = "idle";
  private context: HudContext = "walking";
  private inputMode: InputMode = "keyboard";
  private move = { x: 0, y: 0 };
  private look = { x: 0, y: 0 };
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
  private resize = () => this.engine?.resize();
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
    this.lifecycle = "bootstrapping";
    this.publishSnapshot();
    this.emit({ type: "progress", progress: 8, detail: "Initializing renderer" });
    this.host = host;
    const engine = new Engine(
      host,
      true,
      { preserveDrawingBuffer: false, stencil: true },
      true,
    );
    const baselineScaling = Math.max(1, window.devicePixelRatio / 1.5);
    // Controlled FL-4 A/B experiment only. The ordinary game retains its
    // accepted baseline scale; trial values must be explicitly requested.
    const diagnosticParams = new URLSearchParams(window.location.search);
    const requestedScale = diagnosticParams.get("fl4Scale");
    const trialScale =
      diagnosticParams.get("fl4Diagnostics") === "1" && requestedScale !== null
        ? Number(requestedScale)
        : Number.NaN;
    const hardwareScale =
      Number.isFinite(trialScale) && trialScale >= 0.75 && trialScale <= 2
        ? trialScale
        : baselineScaling;
    engine.setHardwareScalingLevel(hardwareScale);
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.055, 0.075, 0.09, 1);
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.006;
    scene.fogColor = new Color3(0.09, 0.12, 0.14);

    this.emit({ type: "progress", progress: 28, detail: "Initializing Rapier" });
    const physics = await MeridianPhysics.create();
    this.emit({
      type: "progress",
      progress: 52,
      detail: "Generating South Ward First Light",
    });
    const firstLight = createFirstLightRuntimeWorld(
      scene,
      physics,
      ACTIVE_FIRST_LIGHT_WORLD_SOURCE,
    );
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

    this.emit({ type: "progress", progress: 76, detail: "Placing Voight in South Ward" });
    const voight = createVoightPrototype(scene);
    const spawn = physics.playerPosition();
    voight.root.position.set(spawn.x, spawn.y, spawn.z);

    this.engine = engine;
    this.scene = scene;
    // FL-4 is opt-in: production players incur no instrumentation cost.
    if (new URLSearchParams(window.location.search).get("fl4Diagnostics") === "1") {
      const diagnostics = new FL4Diagnostics(engine, scene, host);
      this.fl4Diagnostics = diagnostics;
      (window as Window & { __GTD_FL4_REPORT__?: () => ReturnType<FL4Diagnostics["report"]> })
        .__GTD_FL4_REPORT__ = () => diagnostics.report();
    }
    this.physics = physics;
    this.camera = camera;
    this.voight = voight;
    this.world = firstLight;
    window.addEventListener("resize", this.resize);
    this.lifecycle = "ready";
    this.emit({ type: "progress", progress: 100, detail: "First Light ready" });
    this.publishSnapshot();
    scene.render();
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
    this.lifecycle = "destroyed";
    this.publishSnapshot();
    this.snapshotListeners.clear();
    this.eventListeners.clear();
  }

  command(command: GameCommand): void {
    if (command.type === "move") {
      const length = Math.hypot(command.x, command.y);
      this.move = length > 1 ? { x: command.x / length, y: command.y / length } : { x: command.x, y: command.y };
      return;
    }
    if (command.type === "look") {
      this.look = { x: command.x, y: command.y };
      return;
    }
    if (command.type === "action") {
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

    camera.alpha -= this.look.x * (this.inputMode === "touch" ? 1.8 : 0.035) * dt * 60;
    camera.beta = Math.max(
      0.38,
      Math.min(
        2.22,
        camera.beta + this.look.y * (this.inputMode === "touch" ? 1.25 : 0.028) * dt * 60,
      ),
    );

    const forward = new Vector3(-Math.cos(camera.alpha), 0, -Math.sin(camera.alpha));
    const right = new Vector3(-Math.sin(camera.alpha), 0, Math.cos(camera.alpha));
    const desired = forward.scale(-this.move.y).add(right.scale(this.move.x));
    if (desired.lengthSquared() > 1) desired.normalize();
    const speed = this.actions.has("sprint") ? SPRINT_SPEED : WALK_SPEED;
    const horizontal = desired.scale(speed * dt);

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
    const interiorState = this.world?.interiorState ?? "outside";
    this.preferredCameraRadius =
      interiorState === "inside" ? 3.35 : interiorState === "threshold" ? 4.5 : 6.2;

    voight.root.position.set(position.x, position.y, position.z);
    if (desired.lengthSquared() > 0.001) {
      voight.root.rotation.y = Math.atan2(desired.x, desired.z);
    }
    camera.target.set(position.x, position.y + 0.55, position.z);
    this.resolveCameraObstruction(camera, position, dt);

    this.snapshotAccumulator += dt;
    if (this.snapshotAccumulator >= SNAPSHOT_INTERVAL) {
      this.snapshotAccumulator = 0;
      this.publishSnapshot(desired.length() * speed);
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
      location: this.world?.location ?? "South Ward // First Light",
      objective:
        this.world?.objective ?? "Walk the generated South Ward garage corner",
      health: 100,
      reputation: 0,
      heat: 0,
      speed: Math.round(speed * 3.6),
      vehicle: null,
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
