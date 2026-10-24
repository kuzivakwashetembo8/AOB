/**
 * GTD-NH-REBUILD-001 — isolated, non-production, procedural North Heights.
 * Rejected City Pack 8 remains a reference image only; ZERO runtime model imports.
 * No generated South Ward, Rapier colliders, traffic, or game-session runtime.
 */
import {
  AbstractMesh, Color3, Color4, DirectionalLight, Engine, FreeCamera,
  HemisphericLight, Ray, Scene, SceneLoader, TransformNode, Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { configureLocalGameDecoders } from "@/game/core/local-decoders";
import { buildNorthHeightsReconstruction, northHeightsGround } from "./north-heights-reconstruction-001";
import { placeNorthHeightsTrees004 } from "./north-heights-trees-004";
import { createNorthHeightsSky, type NorthHeightsTime } from "./north-heights-sky-002";
import { createMercerStaticCharacter } from "@/game/world/mercer-static-character-103";
import { createNorthHeightsWalk005, type NorthHeightsWalk005 } from "./north-heights-physics-005";
import {northHeightsHardwareScale006,northHeightsFrameLimit006} from "./north-heights-presentation-006";
import {touchCameraRadiansPerPixel} from "@/game/input/touch-camera-sensitivity";
import {defaults,type Settings} from "@/ui/menus/settings-state";

type Control = "forward" | "back" | "left" | "right" | "up" | "down" | "fast";
export interface NorthHeightsInspection {
  press: (control: Control, down: boolean) => void;
  move: (x:number,y:number) => void;
  applySettings: (settings:Settings) => void;
  setPaused: (paused:boolean) => void;
  reset: () => void;
  setTime: (time: NorthHeightsTime) => void;
  setMode: (mode: "walk" | "fly") => boolean;
  dispose: () => void;
}
type Bounds = { min: Vector3; max: Vector3; size: Vector3; center: Vector3 };

function boundsOf(meshes: readonly AbstractMesh[]): Bounds {
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  let found = 0;
  for (const mesh of meshes) {
    if (mesh.getTotalVertices() < 1) continue;
    mesh.computeWorldMatrix(true);
    const box = mesh.getBoundingInfo().boundingBox;
    if (![box.minimumWorld.x, box.minimumWorld.y, box.minimumWorld.z,
      box.maximumWorld.x, box.maximumWorld.y, box.maximumWorld.z].every(Number.isFinite)) continue;
    min.minimizeInPlace(box.minimumWorld);
    max.maximizeInPlace(box.maximumWorld);
    found += 1;
  }
  if (!found) throw new Error("Asset contains no measurable renderable geometry.");
  const size = max.subtract(min);
  return { min, max, size, center: min.add(max).scale(0.5) };
}
function topLevelNodes(imported: Awaited<ReturnType<typeof SceneLoader.ImportMeshAsync>>) {
  return [...new Set([...imported.transformNodes, ...imported.meshes])]
    .filter(node => !node.parent);
}
async function loadWitness(scene: Scene, file: string, name: string, x: number, y: number, z: number) {
  const imported = await SceneLoader.ImportMeshAsync("", "/GLBs/Characters/", file, scene);
  for (const group of imported.animationGroups) group.stop();
  const meshes = imported.meshes.filter(mesh => mesh.getTotalVertices() > 0);
  const b = boundsOf(meshes);
  const height = Math.max(0.001, b.size.y);
  // Babylon glTF authors use different coordinate systems and root scales.
  // Preserve original hierarchy and fit each model to 1.78m for this visual trial.
  const scale = 1.78 / height;
  const root = new TransformNode("nh001-" + name, scene);
  for (const node of topLevelNodes(imported)) node.parent = root;
  root.scaling.setAll(scale);
  root.position.set(x - b.center.x * scale, y - b.min.y * scale, z - b.center.z * scale);
  for (const mesh of meshes) mesh.isPickable = false;
  if (file === "ual.glb") {
    const idle = imported.animationGroups.find(group => group.name.toLowerCase() === "idle_loop")
      ?? imported.animationGroups.find(group => group.name.toLowerCase().includes("idle"));
    idle?.start(true);
  }
  return meshes.length;
}
export async function createNorthHeightsCity8(
  canvas: HTMLCanvasElement,
  status: (message: string) => void,
  statistics: (message: string) => void,
): Promise<NorthHeightsInspection> {
  configureLocalGameDecoders();
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false }, true);
  const scene = new Scene(engine);
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  scene.clearColor = new Color4(0.68, 0.78, 0.86, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogDensity = 0.00115;
  scene.fogColor = new Color3(0.67,0.76,0.83);
  scene.shadowsEnabled = false;
  scene.skipPointerMovePicking = true;
  scene.ambientColor = new Color3(0.66, 0.68, 0.73);
  const hemi = new HemisphericLight("nh001-hemi", new Vector3(0.3, 1, 0), scene);
  hemi.intensity = 1.15;
  const sun = new DirectionalLight("nh001-daylight", new Vector3(-0.6, -1, 0.4), scene);
  sun.intensity = 1.20;
  const sky = createNorthHeightsSky(scene,sun,hemi,mobile);
  // Start conservatively; shared GTD graphics settings are applied immediately
  // after the route hydrates localStorage (not via a new preferences system).
  engine.setHardwareScalingLevel(mobile ? 1.75 : 1.1);
  const camera = new FreeCamera("nh001-fly-camera", new Vector3(0, 10, -20), scene);
  camera.minZ = 0.1;
  camera.maxZ = 10000;
  camera.fov = 1.05;
  scene.activeCamera = camera;
  const held = new Set<Control>();
  const keys = new Set<string>();
  let settings:Settings=defaults;
  let paused=false,analog={x:0,y:0},keyboardUsed=false;
  let renderLast=0;
  let yaw = 0, pitch = 0, closed = false, anchor = new Vector3(0, 4, -15);
  let treeHandle: {dispose:()=>void} | null = null;
  let walk:NorthHeightsWalk005|null=null;
  let actor:ReturnType<typeof createMercerStaticCharacter>|null=null;
  let mode:"walk"|"fly"="fly";
  let headingYaw=0;
  let physicsAccumulator=0;
  const footSpawn={x:0,z:-31};
  let lastGrounded=false;
  let lastTravelSpeed=0;
  let initialYaw = 0, initialPitch = 0;
  let dragPointer: number | null = null, lastX = 0, lastY = 0;
  let frames = 0;
  const keyDown = (event: KeyboardEvent) => {
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(event.code)) event.preventDefault();
    if(paused)return;
    keyboardUsed=true;
    keys.add(event.code);
  };
  const keyUp = (event: KeyboardEvent) => { keys.delete(event.code); };
  const clearKeys = () => { keys.clear();held.clear();analog={x:0,y:0};dragPointer=null; };
  const pointerDown = (event: PointerEvent) => {
    if(paused||dragPointer !== null) return;
    dragPointer = event.pointerId; lastX = event.clientX; lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: PointerEvent) => {
    if(paused||dragPointer !== event.pointerId) return;
    const dx = event.clientX - lastX, dy = event.clientY - lastY;
    lastX = event.clientX; lastY = event.clientY;
    const touch=event.pointerType==="touch"||event.pointerType==="pen";
    const gain=touch ? touchCameraRadiansPerPixel(settings.touchSensitivity) :
      .004*Math.max(.15,settings.sensitivity/50);
    yaw += dx*gain;
    pitch=Math.max(-1.48,Math.min(1.48,
      pitch + dy*gain*(settings.invertY?-1:1)));
  };
  const pointerUp = (event: PointerEvent) => {
    if (dragPointer === event.pointerId) dragPointer = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  const applyGraphics=()=>{
    if(closed)return;
    const rect=canvas.getBoundingClientRect();
    const dpr=window.devicePixelRatio||1;
    engine.setHardwareScalingLevel(northHeightsHardwareScale006(settings,{
      dpr,coarse:mobile,width:rect.width||innerWidth,height:rect.height||innerHeight,
    }));
    engine.resize();
    // North Heights has no shadow generators yet; preserve South Ward's
    // saved preference for when shadow-casting is implemented.
    scene.shadowsEnabled=settings.shadows;
    scene.fogDensity=settings.quality==="Low"?.0018:.00115;
  };
  const resize=()=>{applyGraphics();};
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);
  window.addEventListener("keydown", keyDown, { passive: false });
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", clearKeys);
  window.addEventListener("resize", resize);
  scene.onBeforeRenderObservable.add(() => {
    const dt=Math.min(.05,engine.getDeltaTime()/1000);
    if(paused)return;
    const key=(code:string)=>keys.has(code),active=(button:Control)=>held.has(button);
    const pad=typeof navigator.getGamepads==="function" ? navigator.getGamepads()[0] : null;
    const stickX=pad&&Math.abs(pad.axes[0]??0)>.18?(pad.axes[0]??0):0;
    const stickY=pad&&Math.abs(pad.axes[1]??0)?-(pad.axes[1]??0):0;
    const x=Math.max(-1,Math.min(1,
      Number(active("right")||key("ArrowRight")||key("KeyD"))-
      Number(active("left")||key("ArrowLeft")||key("KeyA"))+analog.x+stickX));
    const z=Math.max(-1,Math.min(1,
      Number(active("forward")||key("ArrowUp")||key("KeyW"))-
      Number(active("back")||key("ArrowDown")||key("KeyS"))-analog.y+stickY));
    const ascend=active("up")||key("Space")||key("KeyE");
    const fast=active("fast")||key("ShiftLeft")||key("ShiftRight");
    const heading=new Vector3(Math.sin(yaw),0,Math.cos(yaw));
    const side=new Vector3(Math.cos(yaw),0,-Math.sin(yaw));
    if(mode==="walk"&&walk&&actor){
      // A fixed-step Rapier simulation, not naive camera clipping.
      physicsAccumulator=Math.min(.1,physicsAccumulator+dt);
      let last=walk.physics.playerPosition();
      while(physicsAccumulator>=1/60){
        const forward=heading.scale(z).add(side.scale(x));
        const result=walk.step({
          x:forward.x,z:forward.z,
          speed:fast?7.5:3.4,dt:1/60,jump:ascend,
        });
        last=result.position;
        lastGrounded=result.grounded;
        lastTravelSpeed=result.speed;
        if(result.speed>.07)headingYaw=Math.atan2(forward.x,forward.z);
        actor.updateControlled(last,headingYaw,result.speed,1/60,
          fast,result.grounded,result.verticalVelocity);
        physicsAccumulator-=1/60;
      }
      // Third-person chase camera, retaining pointer look. Head clearance
      // follows the real kinematic capsule, not a fake zero-Y floor.
      const target=new Vector3(last.x,last.y+.40,last.z);
      const orbit=Math.max(-.7,Math.min(.65,pitch));
      const follow=new Vector3(
        last.x-Math.sin(yaw)*Math.cos(orbit)*6.8,
        last.y+2.4-Math.sin(orbit)*5.2,
        last.z-Math.cos(yaw)*Math.cos(orbit)*6.8,
      );
      camera.position.copyFrom(follow);
      camera.setTarget(target);
    } else {
      const y=Number(active("up")||key("Space")||key("KeyE"))-
        Number(active("down")||key("ControlLeft")||key("ControlRight")||key("KeyQ"));
      const move=heading.scale(z).add(side.scale(x)).add(new Vector3(0,y,0));
      if(move.lengthSquared()>0)camera.position.addInPlace(move.normalize().scale((fast?87:24)*dt));
      camera.rotation.set(pitch,yaw,0);
    }
    if(++frames%40===0)statistics(
      "FPS "+Math.round(engine.getFps())+" · "+
      "MODE "+mode.toUpperCase()+" · "+
      (mode==="walk"?"GROUNDED "+lastGrounded+" · SPEED "+lastTravelSpeed.toFixed(1)+" m/s · ":"")+
      "CAM "+camera.position.x.toFixed(1)+", "+camera.position.y.toFixed(1)+", "+camera.position.z.toFixed(1));
  });
  engine.runRenderLoop(() => {
    if(closed||paused)return;
    const now=performance.now(),fps=northHeightsFrameLimit006(settings.fps);
    if(Number.isFinite(fps)&&now-renderLast<1000/fps-.5)return;
    renderLast=now;
    scene.render();
  });
  const controller: NorthHeightsInspection = {
    press(control,down){if(paused)return;if(down)held.add(control);else held.delete(control);},
    move(x,y){if(paused)return;analog={x:Math.max(-1,Math.min(1,x)),y:Math.max(-1,Math.min(1,y))};},
    applySettings(next){settings=next;applyGraphics();},
    setPaused(value){
      paused=value;
      if(value)clearKeys();
      else {renderLast=0;engine.resize();}
    },
    reset() {
      if(mode==="walk"&&walk)walk.reset(footSpawn.x,footSpawn.z);
      else {camera.position.copyFrom(anchor);yaw=initialYaw;pitch=initialPitch;}
      physicsAccumulator=0;clearKeys();
    },
    setTime(time) { sky.setTime(time); },
    setMode(next){
      if(next==="walk"&&(!walk||!actor))return false;
      mode=next;clearKeys();physicsAccumulator=0;
      if(next==="fly"){camera.position.copyFrom(anchor);yaw=initialYaw;pitch=initialPitch;}
      return true;
    },
    dispose() {
      if (closed) return;
      closed = true;
      engine.stopRenderLoop();
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", clearKeys);
      window.removeEventListener("resize", resize);
      treeHandle?.dispose();
      actor?.dispose();
      walk?.dispose();
      sky.dispose(); scene.dispose(); engine.dispose();
    },
  };
  const started = performance.now();
  try {
    status("Generating North Heights · native roads, towers, terraces and facades");
    const world = buildNorthHeightsReconstruction(scene,mobile);
    if (closed) return controller;
    status("North Heights roads joined · loading original owner-committed tree GLB");
    let treeCount=0, treeInstances=0, treeError="";
    try {
      const realized=await placeNorthHeightsTrees004(scene,world.treeLocations);
      if(closed){ realized.dispose(); return controller; }
      treeHandle=realized;
      treeCount=realized.trees;
      treeInstances=realized.meshInstances;
      console.info("[NH-REBUILD-004] user tree GLB instancing",{
        trees:treeCount,meshesPerTree:realized.sourceMeshes,
        meshInstances:treeInstances,generatedCanopyMeshes:0,
      });
    } catch(cause){
      treeError=cause instanceof Error?cause.message:String(cause);
      console.error("[NH-REBUILD-004] Tree GLB failed to load",cause);
    }
    status("Building Rapier terrain, pavement and "+world.count+" blocking building colliders");
    walk=await createNorthHeightsWalk005(scene,world.lotSpecs,footSpawn);
    if(closed){walk.dispose();walk=null;return controller;}
    status("Loading Voight's accepted walking animation and physics capsule");
    actor=createMercerStaticCharacter(scene);
    await actor.ready;
    if(closed)return controller;
    actor.setControlled(true);
    const initial=walk.physics.playerPosition();
    actor.updateControlled(initial,0,0,1/60,false,false,0);
    // Retain the UAL model as a passive point of comparison, never as a
    // second playable actor or a second physics controller.
    let actorCount=actor.poseReport.meshCount,failed=0;
    try {
      const px=footSpawn.x+8,pz=footSpawn.z;
      actorCount+=await loadWitness(scene,"ual.glb","ual",px,
        northHeightsGround(px,pz)+.24,pz);
    } catch(error){
      failed++;
      console.warn("[NH-005] optional UAL witness unavailable",error);
    }
    if(closed)return controller;
    mode="walk";
    physicsAccumulator=0;
    applyGraphics();
    anchor=world.overview.clone();
    camera.position.copyFrom(anchor);
    camera.setTarget(new Vector3(0,48,0));
    yaw=0; pitch=.05;
    initialYaw=yaw; initialPitch=pitch;
    status("North Heights WALK physics ready · "+world.count+
      " original buildings · "+world.streetCount+" connected street axes · "+
      (world.instanceCount+treeInstances).toLocaleString()+" geometry instances · "+
      treeCount+" GLB trees · "+actorCount+" character meshes · "+walk.buildingCount+" solid buildings · "+walk.surfaceCount+" walkable ground layers"+(treeError?" · TREE IMPORT FAILED: "+treeError:"")+(failed?" · "+failed+" character imports failed":"")+
      " · "+Math.round(performance.now()-started)+" ms");
  } catch (error) {
    status("North Heights reconstruction failed: "+(error instanceof Error?error.message:String(error)));
    console.error("[NH-REBUILD-001] procedural generation failed",error);
  }
  return controller;
}
