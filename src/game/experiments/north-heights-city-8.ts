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
import { createNorthHeightsWalk005,northHeightsBuildingCollision005, type NorthHeightsWalk005 } from "./north-heights-physics-005";
import {resolveNorthHeightsThirdPersonCamera,clampNorthHeightsPitch,clampNorthHeightsActorXZ,type CameraBox} from "@/game/camera/third-person-camera-constraints";
import {northHeightsLocationAt} from "@/game/world-generation/north-heights-location-009";
import {MERCER_EXTRA_GLB_SPECS,createMercerExtraParkedGLBs} from "@/game/vehicles/mercer-additional-parked-glbs-006";
import {FirstDriveTrial} from "@/game/vehicles/first-drive-trial";
import {FERRARI_WHEEL_MAPPING} from "@/game/vehicles/street-vehicle-wheels";
import {nearestSportsCar,currentVehicleDisembark} from "@/game/vehicles/local-boarding";
import {extraDriveName,extraDriveProfile,prepareNativeFleetWheelRig} from "@/game/vehicles/ambient-fleet-driving-011";
import {RANGE_ROVER_STREET_PROFILE,prepareRangeRoverWheelRig} from "@/game/vehicles/range-rover-drive-007";
import {validateNorthHeightsParking010} from "./north-heights-spatial-plan-010";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {NH012_SIMULATION_DT} from "@/game/traffic/nh012-lane-network";
import {createNorthHeightsTraffic3D016,type NH016Traffic3D} from "./north-heights-traffic-3d-016";
import {createNorthHeightsAuthenticFleet016,type NH016AuthenticFleet} from "./north-heights-authentic-fleet-016";
import {verifyCompleteFleet016} from "@/game/traffic/nh016-fleet-manifest";
import {assignNH013SedanPilot} from "@/game/traffic/nh013-sedan-pilot";
import {createNorthHeightsSedanVisuals013,type NH013SedanVisuals} from "./north-heights-sedan-visuals-013";
import {assignNH013HatchbackPilot} from "@/game/traffic/nh013-hatchback-pilot";
import {createNorthHeightsHatchbackVisuals013,type NH013HatchbackVisuals} from "./north-heights-hatchback-visuals-013";
import {assignNH014TaxiPilot,NH014_TAXI_COUNT} from "@/game/traffic/nh014-taxi-pilot";
import {createNorthHeightsTaxiVisuals014,type NH014TaxiVisuals} from "./north-heights-taxi-visuals-014";
import {assignNH015KangoPilot,NH015_KANGO_COUNT} from "@/game/traffic/nh015-kango-pilot";
import {createNorthHeightsKangoVisuals015,type NH015KangoVisuals} from "./north-heights-kango-visuals-015";
import {normalizeThirdPersonCameraDistance} from "@/ui/menus/settings-state";
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
  onLocationChange?: (location:string)=>void,
  onPoseChange?: (pose:{x:number;z:number})=>void,
  onVehicleChange?: (vehicle:string|null,speed:number)=>void,
  onInteriorChange?: (inside:boolean)=>void,
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
  let cameraBlockers:CameraBox[]=[];
  let fleet:ReturnType<typeof createMercerExtraParkedGLBs>|null=null;
  let traffic:NH012TrafficSimulator|null=null;
  let traffic3D:NH016Traffic3D|null=null;
  let authenticFleet:NH016AuthenticFleet|null=null;
  let sedanVisuals:NH013SedanVisuals|null=null;
  let taxiVisuals:NH014TaxiVisuals|null=null;
  let kangoVisuals:NH015KangoVisuals|null=null;
  let hatchbackVisuals:NH013HatchbackVisuals|null=null;
  let trafficAccumulator=0,visibleTrafficCars=0,visibleAuthenticCars=0;
  const cars=new Map<string,FirstDriveTrial>();
  const carNames=new Map<string,string>();
  let driving:FirstDriveTrial|null=null;
  let activeCarName:string|null=null;
  let interiorId:string|null=null;
  let buildingInteriors:readonly {id:string;position:{x:number;z:number};
    overrides?:{width?:number;depth?:number;floors?:number;floorHeight?:number}}[]=[];
  let lastLocationStreet:string|undefined;
  let lastLocationText="";
  let locationTick=0;
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
    if(event.code==="KeyF"||event.code==="KeyE"){
      if(!event.repeat)toggleVehicle();
      return;
    }
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
    pitch=clampNorthHeightsPitch(pitch + dy*gain*(settings.invertY?-1:1));
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
  const updateLocation=(force=false)=>{
    if(!walk)return;
    const player=driving?.pose??walk.physics.playerPosition();
    onPoseChange?.({x:player.x,z:player.z});
    const inside= !driving&&mode==="walk"
      ?buildingInteriors.find(lot=>{
        const w=lot.overrides?.width??12,d=lot.overrides?.depth??12;
        return Math.abs(player.x-lot.position.x)<w/2-.35&&
          Math.abs(player.z-lot.position.z)<d/2-.35;
      })?.id??null:null;
    if(inside!==interiorId){interiorId=inside;onInteriorChange?.(inside!==null);}
    const location=northHeightsLocationAt(player,lastLocationStreet);
    lastLocationStreet=location.streetId;
    if(force||lastLocationText!==location.text){
      lastLocationText=location.text;
      onLocationChange?.(location.text);
    }
  };
  const setCameraAt=(player:{x:number;y:number;z:number})=>{
    const computed=resolveNorthHeightsThirdPersonCamera(
      player,yaw,pitch,normalizeThirdPersonCameraDistance(settings.thirdPersonCameraDistanceMeters),
      northHeightsGround,cameraBlockers,
    );
    camera.position.set(computed.position.x,computed.position.y,computed.position.z);
    camera.setTarget(new Vector3(computed.target.x,computed.target.y,computed.target.z));
  };
  const boundActor=()=>{
    if(!walk)return;
    const point=walk.physics.playerPosition();
    const limited=clampNorthHeightsActorXZ(point.x,point.z);
    // Player capsule centre is .92m above foot support; never put flight
    // beneath the local ridge, even on boundary transitions.
    const minY=northHeightsGround(limited.x,limited.z)+.92+.12;
    if(limited.x!==point.x||limited.z!==point.z||point.y<minY){
      walk.physics.setPlayerPosition({x:limited.x,y:Math.max(minY,point.y),z:limited.z});
    }
  };
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
    if(traffic&&traffic3D){
      trafficAccumulator=Math.min(.15,trafficAccumulator+dt);
      let steps=0;
      while(trafficAccumulator>=NH012_SIMULATION_DT-1e-7&&steps<3){
        traffic.step();
        trafficAccumulator-=NH012_SIMULATION_DT;
        steps++;
      }
      const snapshot=traffic.snapshot();
      // NH-016: exactly 125 real traffic identities. Close-up owner GLBs take
      // priority; every other agent has a batched 3D car instead of a dot.
      const sedanCars=sedanVisuals?.update(snapshot,camera.position);
      const hatchCars=hatchbackVisuals?.update(snapshot,camera.position);
      const taxiCars=taxiVisuals?.update(snapshot,camera.position);
      const kangoCars=kangoVisuals?.update(snapshot,camera.position);
      const originalCars=authenticFleet?.update(snapshot,camera.position);
      const carsShowing=new Set([...(sedanCars??[]),...(hatchCars??[]),...(taxiCars??[]),...(kangoCars??[]),...(originalCars??[])]);
      const views=traffic3D.update(snapshot,carsShowing);
      visibleAuthenticCars=views.sourceGLBs;
      visibleTrafficCars=views.vehicles3D;
    }
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
    if(driving&&walk){
      physicsAccumulator=Math.min(.1,physicsAccumulator+dt);
      while(physicsAccumulator>=1/60){
        const previousYaw=driving.headingYaw;
        driving.prepare(1/60,x,-z);
        walk.physics.movePlayer({x:0,y:0,z:0});
        driving.finish(1/60);
        // Keep camera behind the actual car using the existing third-person
        // terrain-clamp helper; dragging the view is still possible.
        if(!dragPointer)yaw+=Math.atan2(
          Math.sin(driving.headingYaw-previousYaw),
          Math.cos(driving.headingYaw-previousYaw));
        physicsAccumulator-=1/60;
      }
      const pose=driving.pose;
      setCameraAt({x:pose.x,y:pose.y,z:pose.z});
    }else if(mode==="walk"&&walk&&actor&&humanoid){
      // A fixed-step Rapier simulation, not naive camera clipping.
      physicsAccumulator=Math.min(.1,physicsAccumulator+dt);
      let last=walk.physics.playerPosition();
      while(physicsAccumulator>=1/60){
        const forward=heading.scale(z).add(side.scale(x));
        const result=walk.step({
          x:forward.x,z:forward.z,
          speed:fast?7.5:3.4,dt:1/60,jump:ascend,
        });
        boundActor();
        last=walk.physics.playerPosition();
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
      // Same South Ward-style bounded third-person framing for walking.
      setCameraAt(last);
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
        boundActor();
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
      // Same radius/ground constraint on flight; no freely detached camera.
      setCameraAt(position);
    }
    locationTick+=dt;
    if(locationTick>=.33){
      locationTick=0;updateLocation();
      if(driving)onVehicleChange?.(activeCarName,Math.abs(driving.speedMps));
    }
    if(++frames%40===0){
      const sedanReport=sedanVisuals?.report;
      const pilots=traffic?.agents.filter(a=>a.modelId==="gtd-traffic-sedan-013")??[];
      const closest=pilots.map(a=>({
        distance:Math.hypot(a.x-camera.position.x,a.z-camera.position.z),
        dx:a.x-camera.position.x,dz:a.z-camera.position.z,
      })).sort((a,b)=>a.distance-b.distance)[0];
      const sedanInfo=sedanReport
        ?"SEDAN "+sedanReport.active+"/"+pilots.length+
         " NEAREST "+(closest?closest.distance.toFixed(0)+"m":"NONE")+
         " (E "+(closest?closest.dx.toFixed(0):"?")+
         " / N "+(closest?closest.dz.toFixed(0):"?")+")"+
         " LOD "+sedanReport.loaded+"/3"+
         (sedanReport.failed.length?" ERROR "+sedanReport.failed[0]:"")
        :"SEDAN PILOT INITIALIZING";
      const hatchReport=hatchbackVisuals?.report;
      const hatchInfo=hatchReport
        ?" HATCH "+hatchReport.active+"/12 LOD "+hatchReport.loaded+"/3"+
        (hatchReport.failed.length?" ERROR "+hatchReport.failed[0]:""):"";
      const taxiReport=taxiVisuals?.report;
      const taxiInfo=taxiReport
        ?" TAXI "+taxiReport.active+"/"+NH014_TAXI_COUNT+" SRC "+taxiReport.loaded+"/1"+
        (taxiReport.failed.length?" ERROR "+taxiReport.failed[0]:""):"";
      const kangoReport=kangoVisuals?.report;
      const kangoInfo=kangoReport
        ?" KANGO "+kangoReport.active+"/"+NH015_KANGO_COUNT+" SRC "+kangoReport.loaded+"/1"+
        (kangoReport.failed.length?" ERROR "+kangoReport.failed[0]:""):"";
      const originalReport=authenticFleet?.report;
      const originalInfo=originalReport
        ?" ORIGINAL "+originalReport.active+"/6 TYPES "+originalReport.sources+"/6"+
        (originalReport.failed.length?" ERROR "+originalReport.failed[0]:""):"";
      statistics(
        "FPS "+Math.round(engine.getFps())+" · "+
        "MODE "+mode.toUpperCase()+" · "+
        (traffic?"TRAFFIC "+traffic.population+" 3D "+visibleTrafficCars+
         " GLB "+visibleAuthenticCars+" DOTS 0 SIM "+traffic.tick+" · ":"")+
        sedanInfo+hatchInfo+taxiInfo+kangoInfo+originalInfo+" · "+
        (mode==="walk"?"GROUNDED "+lastGrounded+" · SPEED "+lastTravelSpeed.toFixed(1)+" m/s · ":"")+
        "CAM "+camera.position.x.toFixed(1)+", "+camera.position.y.toFixed(1)+", "+camera.position.z.toFixed(1));
    }
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
    if(driving){
      actor.anchor.setEnabled(false);
      humanoid.root.setEnabled(false);
      return;
    }
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
  const toggleVehicle=()=>{
    if(!walk||!actor||!humanoid)return;
    if(driving){
      if(Math.abs(driving.speedMps)>.25){
        onFeedback?.("Stop the "+activeCarName+" before exiting");return;
      }
      const exit=currentVehicleDisembark(driving);
      if(!exit){onFeedback?.("No safe exit beside this vehicle");return;}
      walk.physics.setPlayerPosition(exit);
      driving=null;
      activeCarName=null;
      mode="walk";
      setActiveCharacter(settings.enableCharacter);
      onModeChange?.("walk");
      onVehicleChange?.(null,0);
      clearKeys();physicsAccumulator=0;
      updateLocation(true);
      onFeedback?.("Exited vehicle");
      return;
    }
    const player=walk.physics.playerPosition();
    const near=nearestSportsCar(player,[...cars].map(([id,car])=>({id,pose:car.pose})));
    if(!near){onFeedback?.("Approach a parked vehicle to drive");return;}
    const car=cars.get(near.id);
    if(!car)return;
    driving=car;
    activeCarName=carNames.get(near.id)??"Vehicle";
    actor.anchor.setEnabled(false);
    humanoid.root.setEnabled(false);
    mode="walk";
    yaw=car.headingYaw;
    physicsAccumulator=0;clearKeys();
    onVehicleChange?.(activeCarName,0);
    updateLocation(true);
    onFeedback?.("Driving "+activeCarName+" · arrows to steer · F to exit");
  };
  const controller: NorthHeightsInspection = {
    press(control,down){if(paused)return;if(down)held.add(control);else held.delete(control);},
    move(x,y){if(paused)return;analog={x:Math.max(-1,Math.min(1,x)),y:Math.max(-1,Math.min(1,y))};},
    action(action,pressed){
      if(paused)return;
      if(pressed&&(action==="vehicle"||action==="interact")){
        toggleVehicle();return;
      }
      const control=northHeightsActionControl007(action);
      if(control){controller.press(control,pressed);return;}
      if(action==="fly"){
        if(pressed&&!driving)controller.setMode(mode==="walk"?"fly":"walk");
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
      if(value){clearKeys();trafficAccumulator=0;}
      else {renderLast=0;trafficAccumulator=0;engine.resize();}
    },
    reset() {
      if(driving)toggleVehicle();
      walk?.reset(footSpawn.x,footSpawn.z);
      yaw=initialYaw;pitch=initialPitch;headingYaw=0;
      updateLocation(true);
      physicsAccumulator=0;clearKeys();
    },
    setTime(time) { sky.setTime(time); },
    setMode(next){
      if(driving)return false;
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
      for(const car of cars.values())car.dispose();
      cars.clear();
      authenticFleet?.dispose();authenticFleet=null;
      traffic3D?.dispose();traffic3D=null;
      kangoVisuals?.dispose();kangoVisuals=null;
      taxiVisuals?.dispose();taxiVisuals=null;
      hatchbackVisuals?.dispose();hatchbackVisuals=null;
      sedanVisuals?.dispose();sedanVisuals=null;
      traffic=null;
      fleet?.dispose();
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
    cameraBlockers=northHeightsBuildingCollision005(world.lotSpecs).map(box=>({
      x:box.position.x,y:box.position.y,z:box.position.z,
      halfX:box.halfExtents.x,halfY:box.halfExtents.y,halfZ:box.halfExtents.z,
    }));
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
    // NH-016: retain NH-012's single deterministic 125-car circuit. A batched
    // 3D LOD represents every car; authenticated source GLBs are camera-near
    // replacements rather than 91 additional agents or Rapier bodies.
    traffic=new NH012TrafficSimulator(125,120125);
    const pilotIds=assignNH013SedanPilot(traffic,8);
    const hatchIds=assignNH013HatchbackPilot(traffic,12);
    const taxiIds=assignNH014TaxiPilot(traffic,NH014_TAXI_COUNT);
    const kangoIds=assignNH015KangoPilot(traffic,NH015_KANGO_COUNT);
    sedanVisuals=createNorthHeightsSedanVisuals013(scene,traffic.graph);
    hatchbackVisuals=createNorthHeightsHatchbackVisuals013(scene,traffic.graph);
    taxiVisuals=createNorthHeightsTaxiVisuals014(scene,traffic.graph);
    kangoVisuals=createNorthHeightsKangoVisuals015(scene,traffic.graph);
    const circuit=verifyCompleteFleet016(traffic.snapshot());
    authenticFleet=createNorthHeightsAuthenticFleet016(scene,traffic.graph,mobile);
    traffic3D=createNorthHeightsTraffic3D016(scene,traffic.graph);
    console.info("[NH-016] Full six-model circuit, no colored diagnostic dots",{
       sedans:pilotIds.size,hatchbacks:hatchIds.size,taxis:taxiIds.size,kango:kangoIds.size,
       defaultVehicleModels:circuit.models,defaultVehicles:circuit.original,
       vehicleViews:traffic.population,dots:0,
    });
    traffic3D.update(traffic.snapshot(),new Set());
    console.info("[NH-012] directed lane traffic initialized",{
      nodes:traffic.graph.nodes.size,directedLanes:traffic.graph.edges.size,
      turns:traffic.graph.connectors.size,agents:traffic.population,
    });
    // NH-010: reserve NH-03-05 before buildings/trees. Genuine six GLBs
    // are inside a dedicated empty 48m square with collision-checked bays.
    validateNorthHeightsParking010(world.lotSpecs,
      MERCER_EXTRA_GLB_SPECS.map(spec=>({width:spec.width,length:spec.length})));
    const parking=world.parkingLots[0]!;
    const nhParking=MERCER_EXTRA_GLB_SPECS.map((spec,index)=>({
      ...spec,x:parking.stalls[index]!.x,z:parking.stalls[index]!.z,
      yaw:parking.stalls[index]!.yaw,
    }));
    buildingInteriors=world.lotSpecs;
    fleet=createMercerExtraParkedGLBs(scene,walk.physics,[],undefined,{
      placements:nhParking,
      heightAt:(x,z)=>northHeightsGround(x,z)+.075,
      maxConcurrent:mobile?2:3,
    });
    // Let assets stream while Voight and UAL initialize. All models must
    // be genuinely loaded before issuing the final physics-ready signal.
    const fleetReady=fleet.ready.catch(error=>{
      const message=error instanceof Error?error.message:String(error);
      console.error("[NH-009] Six-car GLB load failed",error);
      return message;
    });
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
    setCameraAt(spawn);
    updateLocation(true);
    const vehicleError=await fleetReady;
    if(closed)return controller;
    if(vehicleError)onFeedback?.("Vehicle import issue: "+vehicleError);
    // Reuse exactly South Ward's vehicle class + wheel mapping. A vehicle
    // remains drivable even if its source has no four independent wheel
    // meshes; the physical car still moves, missing wheel animation is
    // correctly reported by the existing StreetVehicleWheelRig.
    for(const parked of fleet?.instances??[]){
      if(!parked.drivingDimensions||parked.spec.visualOnly)continue;
      const rover=parked.spec.id==="gtd-veh006-mercer-range-rover";
      const extra=rover?null:extraDriveName(parked.spec.id);
      if(!rover&&!extra)continue;
      try{
        // Native wheel discovery may fail on a combined author GLB. It must
        // not disable legitimate Rapier driving: physical steering/translation
        // work without isolated wheel pivots (no fake tires are generated).
        let wheelMapping=FERRARI_WHEEL_MAPPING;
        try{
          const wheel=rover?prepareRangeRoverWheelRig(parked.anchor):
            prepareNativeFleetWheelRig(parked.anchor,extra!);
          wheelMapping=wheel.mapping;
        }catch(wheelIssue){
          console.warn("[NH-010] Wheel mesh unavailable; driving without rig",
            parked.spec.id,wheelIssue);
        }
        const car=new FirstDriveTrial(walk.physics,parked.anchor,
          parked.drivingDimensions,
          rover?RANGE_ROVER_STREET_PROFILE:extraDriveProfile(extra!),
          wheelMapping,false,false);
        parked.releaseStaticCollider();
        cars.set(parked.spec.id,car);
        carNames.set(parked.spec.id,rover?"Range Rover":extra!);
      }catch(error){
        console.error("[NH-010] Driving initialization failed",parked.spec.id,error);
      }
    }
    const fleetCount=cars.size;
    status("North Heights WALK physics ready · "+world.count+
      " original buildings · "+world.streetCount+" connected street axes · "+
      (world.instanceCount+treeInstances).toLocaleString()+" geometry instances · "+
      treeCount+" GLB trees · "+(traffic?.population??0)+ " logical traffic agents / 8 sedans + 12 hatchbacks + 8 taxis + 6 Kangoo · dots + authentic source views · "+fleetCount+"/6 drivable native cars · "+actorCount+" character meshes · "+walk.buildingCount+" solid buildings · "+walk.surfaceCount+" walkable ground layers"+(treeError?" · TREE IMPORT FAILED: "+treeError:"")+
      " · "+Math.round(performance.now()-started)+" ms");
  } catch (error) {
    status("North Heights reconstruction failed: "+(error instanceof Error?error.message:String(error)));
    console.error("[NH-REBUILD-001] procedural generation failed",error);
  }
  return controller;
}
