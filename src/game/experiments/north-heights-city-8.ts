/**
 * GTD-NH-REBUILD-001 — isolated, non-production, procedural North Heights.
 * Rejected City Pack 8 remains a reference image only; ZERO runtime model imports.
 * No generated South Ward, Rapier colliders, traffic, or game-session runtime.
 */
import {
  Color3, Color4, DirectionalLight, Engine, FreeCamera,
  HemisphericLight, Scene, Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { configureLocalGameDecoders } from "@/game/core/local-decoders";
import { buildNorthHeightsReconstruction, northHeightsGround } from "./north-heights-reconstruction-001";
import { placeNorthHeightsTrees004 } from "./north-heights-trees-004";
import { createNorthHeightsSky, type NorthHeightsTime } from "./north-heights-sky-002";
import { createMercerStaticCharacter } from "@/game/world/mercer-static-character-103";
import {loadMeridiaCharacterTrial,type LoadedMeridiaCharacter} from "@/game/character/voight-humanoid-trial";
import type {GameAction} from "@/game/core/types";
import {northHeightsActionControl007,northHeightsUnavailableAction007} from "./north-heights-controls-007";
import { createNorthHeightsWalk005, type NorthHeightsWalk005 } from "./north-heights-physics-005";
import {northHeightsHardwareScale006,northHeightsFrameLimit006} from "./north-heights-presentation-006";
import {touchCameraRadiansPerPixel} from "@/game/input/touch-camera-sensitivity";
import {defaults,type Settings} from "@/ui/menus/settings-state";

type Control = "forward" | "back" | "left" | "right" | "up" | "down" | "fast";
export interface NorthHeightsInspection {
  press: (control: Control, down: boolean) => void;
  move: (x:number,y:number) => void;
  action: (action:GameAction,pressed:boolean) => void;
  applySettings: (settings:Settings) => void;
  setPaused: (paused:boolean) => void;
  reset: () => void;
  setTime: (time: NorthHeightsTime) => void;
  setMode: (mode: "walk" | "fly") => boolean;
  dispose: () => void;
}
export async function createNorthHeightsCity8(
  canvas: HTMLCanvasElement,
  status: (message: string) => void,
  statistics: (message: string) => void,
  onModeChange?: (mode:"walk"|"fly")=>void,
  onFeedback?: (message:string)=>void,
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
  let yaw = 0, pitch = 0, closed = false;
  let treeHandle: {dispose:()=>void} | null = null;
  let walk:NorthHeightsWalk005|null=null;
  let actor:ReturnType<typeof createMercerStaticCharacter>|null=null;
  let humanoid:LoadedMeridiaCharacter|null=null;
  let mode:"walk"|"fly"="fly";
  let headingYaw=0;
  let physicsAccumulator=0;
  const footSpawn={x:0,z:-31};
  let lastGrounded=false;
  let lastTravelSpeed=0;
  const initialYaw = 0, initialPitch = 0;
  let dragPointer: number | null = null, lastX = 0, lastY = 0;
  let frames = 0;
  const keyDown = (event: KeyboardEvent) => {
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(event.code)) event.preventDefault();
    if(paused)return;
    keyboardUsed=true;
    if(event.code==="KeyG"){
      if(!event.repeat)controller.setMode(mode==="walk"?"fly":"walk");
      return;
    }
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
    const ascend=active("up")||key("Space");
    const fast=active("fast")||key("ShiftLeft")||key("ShiftRight");
    const heading=new Vector3(Math.sin(yaw),0,Math.cos(yaw));
    const side=new Vector3(Math.cos(yaw),0,-Math.sin(yaw));
    if(mode==="walk"&&walk&&actor&&humanoid){
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
        if(settings.enableCharacter){
          actor.updateControlled(last,headingYaw,result.speed,1/60,
            fast,result.grounded,result.verticalVelocity);
        }else{
          humanoid.root.position.set(last.x,last.y,last.z);
          humanoid.root.rotation.y=headingYaw;
          humanoid.updateAnimation({
            correctedPlanarSpeed:result.speed,
            rawGrounded:result.grounded,
            intentMagnitude:Math.hypot(x,z),
            sprintRequested:fast,
            jumpAscending:!result.grounded&&result.verticalVelocity>.2,
            dt:1/60,
          });
        }
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
    } else if(mode==="fly"&&walk&&actor&&humanoid){
      // Flight is still third person. Move the SAME Rapier capsule, not
      // the camera in isolation; render exactly one selected visual actor.
      const up=Number(active("up")||key("Space"))-
        Number(active("down")||key("ControlLeft")||key("ControlRight"));
      const travel=heading.scale(z).add(side.scale(x)).add(new Vector3(0,up,0));
      const length=Math.sqrt(travel.lengthSquared());
      if(length>1)travel.scaleInPlace(1/length);
      const flightSpeed=fast?25:9;
      physicsAccumulator=Math.min(.1,physicsAccumulator+dt);
      let position=walk.physics.playerPosition();
      while(physicsAccumulator>=1/60){
        const desired=travel.scale(flightSpeed/60);
        walk.physics.movePlayer({x:desired.x,y:desired.y,z:desired.z});
        position=walk.physics.playerPosition();
        if(Math.hypot(desired.x,desired.z)>.005)
          headingYaw=Math.atan2(desired.x,desired.z);
        const animation={
          dt:1/60,forward:z>.08,backward:z<-.08,left:x<-.08,right:x>.08,
          ascending:up>.08,descending:up<-.08,accelerated:fast,
        };
        if(settings.enableCharacter){
          actor.updateControlledFlight(position,headingYaw,animation);
        }else{
          humanoid.root.position.set(position.x,position.y,position.z);
          humanoid.root.rotation.y=headingYaw;
          humanoid.updateFlightAnimation(animation);
        }
        physicsAccumulator-=1/60;
      }
      const orbit=Math.max(-.65,Math.min(.65,pitch));
      const target=new Vector3(position.x,position.y+.55,position.z);
      const follow=new Vector3(
        position.x-Math.sin(yaw)*Math.cos(orbit)*9,
        position.y+2.8-Math.sin(orbit)*6.3,
        position.z-Math.cos(yaw)*Math.cos(orbit)*9,
      );
      camera.position.copyFrom(follow);
      camera.setTarget(target);
    }
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
  const setActiveCharacter=(enabled:boolean)=>{
    if(!actor||!humanoid||!walk)return;
    // The physics capsule, ground contact, heading and camera never change.
    actor.setControlled(enabled);
    actor.anchor.setEnabled(enabled);
    humanoid.root.setEnabled(!enabled);
    const position=walk.physics.playerPosition();
    if(enabled)actor.updateControlled(position,headingYaw,0,1/60,false,lastGrounded,0);
    else{
      humanoid.root.position.set(position.x,position.y,position.z);
      humanoid.root.rotation.y=headingYaw;
      humanoid.updateAnimation({correctedPlanarSpeed:0,rawGrounded:true,
        intentMagnitude:0,sprintRequested:false,jumpAscending:false,dt:1/60});
    }
  };
  const controller: NorthHeightsInspection = {
    press(control,down){if(paused)return;if(down)held.add(control);else held.delete(control);},
    move(x,y){if(paused)return;analog={x:Math.max(-1,Math.min(1,x)),y:Math.max(-1,Math.min(1,y))};},
    action(action,pressed){
      if(paused)return;
      const control=northHeightsActionControl007(action);
      if(control){controller.press(control,pressed);return;}
      if(action==="fly"){
        if(pressed)controller.setMode(mode==="walk"?"fly":"walk");
        return;
      }
      if(pressed)onFeedback?.(northHeightsUnavailableAction007(action));
    },
    applySettings(next){
      const characterChanged=settings.enableCharacter!==next.enableCharacter;
      settings=next;
      if(characterChanged)setActiveCharacter(next.enableCharacter);
      applyGraphics();
    },
    setPaused(value){
      paused=value;
      if(value)clearKeys();
      else {renderLast=0;engine.resize();}
    },
    reset() {
      walk?.reset(footSpawn.x,footSpawn.z);
      yaw=initialYaw;pitch=initialPitch;headingYaw=0;
      physicsAccumulator=0;clearKeys();
    },
    setTime(time) { sky.setTime(time); },
    setMode(next){
      if(next==="walk"&&(!walk||!actor||!humanoid))return false;
      mode=next;clearKeys();physicsAccumulator=0;
      // Preserve the capsule position and third-person orbit on mode changes.
      onModeChange?.(next);
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
      humanoid?.disposeDriverContact();
      humanoid?.root.dispose(false,true);
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
    // The existing GTD humanoid is an actual playable alternative, not a
    // spectator. The same physical capsule and world coordinates drive either model.
    status("Loading the accepted GTD UAL humanoid and locomotion clips");
    humanoid=await loadMeridiaCharacterTrial(scene);
    if(closed)return controller;
    const actorCount=actor.poseReport.meshCount+humanoid.report().meshCount;
    setActiveCharacter(settings.enableCharacter);
    if(closed)return controller;
    mode="walk";
    onModeChange?.("walk");
    physicsAccumulator=0;
    applyGraphics();
    yaw=initialYaw;pitch=initialPitch;
    const spawn=walk.physics.playerPosition();
    camera.position.set(spawn.x,spawn.y+2.5,spawn.z-6.8);
    camera.setTarget(new Vector3(spawn.x,spawn.y+.4,spawn.z));
    status("North Heights WALK physics ready · "+world.count+
      " original buildings · "+world.streetCount+" connected street axes · "+
      (world.instanceCount+treeInstances).toLocaleString()+" geometry instances · "+
      treeCount+" GLB trees · "+actorCount+" character meshes · "+walk.buildingCount+" solid buildings · "+walk.surfaceCount+" walkable ground layers"+(treeError?" · TREE IMPORT FAILED: "+treeError:"")+
      " · "+Math.round(performance.now()-started)+" ms");
  } catch (error) {
    status("North Heights reconstruction failed: "+(error instanceof Error?error.message:String(error)));
    console.error("[NH-REBUILD-001] procedural generation failed",error);
  }
  return controller;
}
