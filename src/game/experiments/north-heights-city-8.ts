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
import {loadNorthHeightsStreetLamps012,planNorthHeightsStreetLamps012,type NorthHeightsLampRenderer012} from "./north-heights-street-lamps-012";
import { createNorthHeightsSky, type NorthHeightsTime } from "./north-heights-sky-002";
import { createReesePlayer001 } from "@/game/character/reese-player-001";
import {loadMeridiaCharacterTrial,type LoadedMeridiaCharacter} from "@/game/character/voight-humanoid-trial";
import type {GameAction} from "@/game/core/types";
import {northHeightsActionControl007,northHeightsUnavailableAction007} from "./north-heights-controls-007";
import { createNorthHeightsWalk005,northHeightsBuildingCollision005, type NorthHeightsWalk005 } from "./north-heights-physics-005";
import {resolveNorthHeightsThirdPersonCamera,clampNorthHeightsPitch,clampNorthHeightsActorXZ,type CameraBox} from "@/game/camera/third-person-camera-constraints";
import {northHeightsLocationAt} from "@/game/world-generation/north-heights-location-009";
import {
  nearestBoardableVehicle,sedanExitCandidates,overlapsAnotherTrafficSedan,
  insideBuildingFootprint,trafficSedanCanExit,trafficHeadingDelta,
} from "@/game/vehicles/nh-opt2-sedan-riding";
import {sampleTrafficVehicleRoadPose013} from "@/game/vehicles/nh013-road-grade-contact";
import {sourceWheelFit007,sedanNativeContactHull007} from "@/game/vehicles/native-seven-vehicle-007";
import type {NH012Agent} from "@/game/traffic/nh012-traffic-simulator";
import {createNorthHeightsSolidField017}
  from "@/game/vehicles/nh-solid-vehicle-collision-017";
import {NH012TrafficSimulator} from "@/game/traffic/nh012-traffic-simulator";
import {NorthHeightsPedestrianSimulator001} from "./north-heights-pedestrian-simulator-001";
import {loadNorthHeightsPedestrianCharacters001,type PedestrianCharacterRenderer001} from "./north-heights-pedestrian-characters-001";
import {PED002_NPC_TOTAL_BYTES} from "./north-heights-pedestrian-asset-manifest-002";
import {NH012_SIMULATION_DT} from "@/game/traffic/nh012-lane-network";
import {createNorthHeightsSedanTraffic009,type NH009SedanTraffic} from "./north-heights-sedan-traffic-009";
import {verifyCompleteFleet016} from "@/game/traffic/nh016-fleet-manifest";
import {assignNH013SedanPilot} from "@/game/traffic/nh013-sedan-pilot";
import {assignNH013HatchbackPilot} from "@/game/traffic/nh013-hatchback-pilot";
import {assignNH014TaxiPilot,NH014_TAXI_COUNT} from "@/game/traffic/nh014-taxi-pilot";
import {assignNH015KangoPilot,NH015_KANGO_COUNT} from "@/game/traffic/nh015-kango-pilot";
import {normalizeThirdPersonCameraDistance} from "@/ui/menus/settings-state";
import {northHeightsHardwareScale006,northHeightsFrameLimit006} from "./north-heights-presentation-006";
import {touchCameraRadiansPerPixel} from "@/game/input/touch-camera-sensitivity";
import {defaults,type Settings} from "@/ui/menus/settings-state";
import {ProceduralVehicleAudio021} from "@/game/audio/vehicle/procedural-vehicle-audio-021";
import {createFinchLobby004,type FinchLobby004,type FinchElevatorState004} from "./north-heights-finch-lobby-004";
import {createFinchSuite005,type FinchSuite005} from "./north-heights-finch-suite-005";
import {FINCH_START_005} from "./north-heights-finch-intro-005";
import {finchLobbyMinimumCapsuleY006} from "./north-heights-finch-elevator-structure-004";
import {constrainFinchCabinCamera006} from "./north-heights-finch-lobby-004";
import {createNorthHeightsBuildingLifts019,type BuildingLiftFrame019,type BuildingLiftState019}
 from "./north-heights-building-lifts-019";
import {DianeLevel001,readDianeProgress001,type DianeMissionView001} from "./level001-diane-007";
import {createDianeWorldLabel001} from "./level001-diane-label-007";
import {createDianeCarMarker008} from "./level001-diane-car-marker-008";
import type {NorthHeightsMapBuilding011} from "@/ui/hud/north-heights-map-010";

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
  toggleMachineCamera:()=>boolean;
  playMapCue:(kind:"open"|"close")=>void;
  moveMachineCameraTo:(x:number,z:number)=>boolean;
  toggleSedanAutopilot: () => void;
  driveToFinchHQ: () => boolean;
  travelFinchElevator: (floor?:number) => boolean;
  travelBuildingFloor019:(buildingId:string,floor:number)=>boolean;
  startDianeMission: () => boolean;
  reportDianeMission: () => boolean;
  setReeseHandItem:(item:"hand"|"gun")=>void;
  setFinchTalking:(active:boolean)=>void;
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
  onNearbyVehicleChange?: (available:boolean)=>void,
  onFirstPlayableFrame?: ()=>void,
  onElevatorChange?: (state:FinchElevatorState004|null)=>void,
  onFinchProximityChange?: (near:boolean)=>void,
  onDianeMissionChange?: (state:DianeMissionView001)=>void,
  onMapBuildings?: (buildings:readonly NorthHeightsMapBuilding011[])=>void,
  onBuildingLiftChange?: (state:BuildingLiftState019|null)=>void,
  onMachineModeChange?: (active:boolean)=>void,
): Promise<NorthHeightsInspection> {
  configureLocalGameDecoders();
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false }, true);
  const scene = new Scene(engine);
  const mobile = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  // The engine is a lightweight controller until a real input gesture.
  // No AudioContext or audio asset is created during critical world loading.
  const vehicleAudio=new ProceduralVehicleAudio021(mobile);
  let audioAccumulator=0;
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
  let treeHandle: {dispose:()=>void;update:(camera:Vector3,dt:number)=>void} | null = null;
  let lampHandle:NorthHeightsLampRenderer012|null=null;
  let lampTime:NorthHeightsTime="dusk";
  let walk:NorthHeightsWalk005|null=null;
  let cameraBlockers:CameraBox[]=[];
  let traffic:NH012TrafficSimulator|null=null;
  let finchLobby:FinchLobby004|null=null;
  let finchSuite:FinchSuite005|null=null;
  let lastFinchNear=false;
  let starterSedanId:string|null=null;
  let liftFrame:ReturnType<FinchLobby004["update"]>|null=null;
  let buildingLifts:ReturnType<typeof createNorthHeightsBuildingLifts019>|null=null;
  let genericLiftFrame:BuildingLiftFrame019|null=null;
  let liftCollisionDisabled=false;
  let finchArrivedAnnounced=false;
  let traffic3D:NH009SedanTraffic|null=null;
  let trafficAccumulator=0,visibleTrafficCars=0,visibleAuthenticCars=0;
  const solidVehicleHandles=new Map<string,{
    update:(pose:{x:number;y:number;z:number;heading:number})=>void;
    dispose:()=>void;
  }>();
  let pedestrians:NorthHeightsPedestrianSimulator001|null=null;
  let pedestrianAccumulator=0;
  let pedestrianCharacters:PedestrianCharacterRenderer001|null=null;
  let pedestrianLoading=false,pedestrianLoadError="";
  let dianeLevel:DianeLevel001|null=null;
  let dianeLabel:ReturnType<typeof createDianeWorldLabel001>|null=null;
  let dianeCarMarker:ReturnType<typeof createDianeCarMarker008>|null=null;
  /** SDN-001: passenger association with an EXISTING NH-012 agent, not a car actor. */
  let ridingSedanId:string|null=null;
  let rideLastHeading=0;
  let trafficWheelbase=2.8,trafficTrack=1.62;
  const ridingAgent=()=>ridingSedanId
    ?traffic?.agents.find(agent=>agent.id===ridingSedanId)??null:null;
  const sedanRoadPosition=(agent:NH012Agent)=>{
    const road=sampleTrafficVehicleRoadPose013({
      x:agent.x,z:agent.z,heading:agent.heading,
      wheelbase:trafficWheelbase,track:trafficTrack,ground:northHeightsGround,
    });
    return {x:agent.x,y:road.y,z:agent.z};
  };
  const movingCandidates=()=>traffic?.agents.map(agent=>({
    id:agent.id,pose:sedanRoadPosition(agent),
  }))??[];
  let interiorId:string|null=null;
  let buildingInteriors:readonly {id:string;position:{x:number;z:number};
    overrides?:{width?:number;depth?:number;floors?:number;floorHeight?:number}}[]=[];
  let lastLocationStreet:string|undefined;
  let lastLocationText="";
  let locationTick=0;
  let actor:ReturnType<typeof createReesePlayer001>|null=null;
  let humanoid:LoadedMeridiaCharacter|null=null;
  let mode:"walk"|"fly"="walk";
  let machineView=false;
  let savedOrbit={yaw:Math.PI,pitch:0};
  let footstepTravel=0;
  let hornCheck=0;
  let headingYaw=Math.PI;
  let physicsAccumulator=0;
  const footSpawn={...FINCH_START_005.spawn};
  let lastGrounded=false;
  let lastTravelSpeed=0;
  const initialYaw = Math.PI, initialPitch = 0;
  let dragPointer: number | null = null, lastX = 0, lastY = 0;
  let frames = 0;
  const driveToFinchHQ=():boolean=>{
    if(!ridingSedanId||!traffic){onFeedback?.("Enter a traffic vehicle before selecting Finch HQ");return false;}
    if(dianeLevel?.stage==="follow"||dianeLevel?.stage==="observe"){
      onFeedback?.("Finish observing Diane before selecting Finch HQ");return false;
    }
    const result=traffic.beginFinchTargetDrive003(ridingSedanId);
    if(!result.ok){onFeedback?.(result.reason);return false;}
    finchArrivedAnnounced=false;
    onVehicleChange?.("Sedan · Finch route",ridingAgent()?.speed??0);
    onFeedback?.("Driving to Finch HQ · roadside destination selected");
    clearKeys();return true;
  };
  const toggleSedanAutopilot=()=>{
    if(!ridingSedanId||!traffic)return;
    if(traffic.targetDriveStatus003(ridingSedanId)!=="none"){
      traffic.clearTargetDrive003(ridingSedanId);finchArrivedAnnounced=false;
      onFeedback?.("Finch route cancelled · traffic autopilot restored");return;
    }
    if(traffic.isManualDriving(ridingSedanId)){
      if(!traffic.endManualDriving()){
        onFeedback?.("Return to a forward-facing road lane before engaging autopilot");
        return;
      }
      onFeedback?.("Autopilot restored · traffic rules active");
    }else{
      traffic.beginManualDriving(ridingSedanId);
      onFeedback?.("Free steering · off-road enabled · buildings remain solid");
    }
    const agent=ridingAgent();
    if(agent)onVehicleChange?.(traffic.isManualDriving(agent.id)
      ?"Sedan · Manual":"Sedan · Autopilot",agent.speed);
  };
  // Stage 6: directional input is continuous rather than junction-gated.
  // Steering is computed at 20Hz using actual signed velocity.
  const keyDown = (event: KeyboardEvent) => {
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(event.code)) event.preventDefault();
    if(paused)return;
    // Invoke resume() in keyboard gesture context (browser autoplay policy).
    vehicleAudio.unlockFromGesture();
    keyboardUsed=true;
    if(event.code==="KeyF"){
      if(!event.repeat)toggleVehicle();
      return;
    }
    if(event.code==="KeyC"){
      if(!event.repeat)controller.action("combat",true);
      return;
    }
    if(event.code==="KeyG"){
      if(!event.repeat)controller.toggleMachineCamera();
      return;
    }
    if(event.code==="KeyP"&&ridingSedanId){
      if(!event.repeat)toggleSedanAutopilot();
      return;
    }
    keys.add(event.code);
  };
  const keyUp = (event: KeyboardEvent) => { keys.delete(event.code); };
  const clearKeys = () => {
    keys.clear();held.clear();analog={x:0,y:0};dragPointer=null;
    // Lost focus, pause, and exit must clear ALL manual pedal requests.
    traffic?.setDriverBrake(null,false);
    traffic?.setDriverThrottle(null,0);
    if(ridingSedanId)traffic?.setManualPedals(ridingSedanId,0,0);
  };
  const pointerDown = (event: PointerEvent) => {
    if(paused||dragPointer !== null) return;
    vehicleAudio.unlockFromGesture();
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
    const passenger=ridingAgent();
    const player=passenger?sedanRoadPosition(passenger):walk.physics.playerPosition();
    onPoseChange?.({x:player.x,z:player.z});
    const inside= !ridingSedanId&&mode==="walk"
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
      northHeightsGround,
      // Third-person camera cannot collide with its own glass HQ tower AABB.
      Math.abs(player.x-46.002)<12.2&&Math.abs(player.z+94.18)<18.2
        ?cameraBlockers.filter(box=>Math.abs(box.x-46.002)>1||Math.abs(box.z+94.18)>1)
        :cameraBlockers,
    );
    // Camera remains strictly inside glass walls/ceiling while the player
    // occupies the lift, including its closing, travel, opening and idle states.
    const inside=liftFrame?.cameraCabin??genericLiftFrame?.cameraCabin??null;
    let p=inside?constrainFinchCabinCamera006(computed.position,inside):computed.position;
    if(!inside&&!ridingSedanId&&mode==="walk"){
      const room=buildingInteriors.find(lot=>{
        const w=lot.overrides?.width??12,d=lot.overrides?.depth??12;
        const fh=lot.overrides?.floorHeight??3.1, floors=lot.overrides?.floors??1;
        const groundY=northHeightsGround(lot.position.x,lot.position.z);
        const withinHeight=player.y>=groundY-.3&&
          player.y<groundY+fh*floors+.25;
        return withinHeight&&Math.abs(player.x-lot.position.x)<w/2-.4&&
          Math.abs(player.z-lot.position.z)<d/2-.4;
      });
      if(room){
        const w=room.overrides?.width??12,d=room.overrides?.depth??12;
        const fh=room.overrides?.floorHeight??3.1;
        const base=northHeightsGround(room.position.x,room.position.z)+.27;
        // The camera is bounded by the containing room, not by a large
        // external collision sphere, so roof/floor cannot be peeked through.
        const floorIndex=Math.max(0,Math.min((room.overrides?.floors??1)-1,
          Math.round((player.y-.92-base)/fh)));
        // Every upper-level physical slab begins at +.87m, not +.27m.
        // A camera using the ground-floor offset can otherwise see below it.
        const slab=floorIndex===0?base:
          northHeightsGround(room.position.x,room.position.z)+.87+floorIndex*fh;
        const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
        p={
          x:clamp(p.x,room.position.x-w/2+.55,room.position.x+w/2-.55),
          y:clamp(p.y,slab+.42,slab+fh-.36),
          z:clamp(p.z,room.position.z-d/2+.55,room.position.z+d/2-.55),
        };
      }
    }
    camera.position.set(p.x,p.y,p.z);
    camera.setTarget(new Vector3(computed.target.x,computed.target.y,computed.target.z));
  };
  const boundActor=()=>{
    if(!walk)return;
    const point=walk.physics.playerPosition();
    const limited=clampNorthHeightsActorXZ(point.x,point.z);
    // Player capsule centre is .92m above foot support; never put flight
    // beneath the local ridge, even on boundary transitions.
    const minY=finchLobbyMinimumCapsuleY006(limited.x,limited.z,northHeightsGround)
      ??northHeightsGround(limited.x,limited.z)+.92+.12;
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
  const soundVisibility=()=>vehicleAudio.setHidden(document.hidden);
  document.addEventListener("visibilitychange",soundVisibility);
  soundVisibility();
  scene.onBeforeRenderObservable.add(() => {
    const dt=Math.min(.05,engine.getDeltaTime()/1000);
    if(paused)return;
    // Stage 5: the existing NH-012 agent accepts continuous signed manual
    // pedal authority. First movement input engages manual mode; release
    // coasts to a stop instead of reverting to AI. Press P to restore AI.
    const gamepad=typeof navigator.getGamepads==="function"?navigator.getGamepads()[0]:null;
    const gamepadForward=Math.max(0,-(gamepad?.axes[1]??0));
    const gamepadBrake=Math.max(0,gamepad?.axes[1]??0);
    const passengerBrake=!!ridingSedanId&&(
      keys.has("ArrowDown")||keys.has("KeyS")||held.has("back")||analog.y>.45||gamepadBrake>.45
    );
    const passengerThrottle=ridingSedanId?Math.max(
      Number(keys.has("ArrowUp")||keys.has("KeyW")||held.has("forward")),
      Math.max(0,-analog.y),gamepadForward,
    ):0;
    const steerRequest=Math.max(-1,Math.min(1,
      Number(keys.has("ArrowRight")||keys.has("KeyD")||held.has("right"))-
      Number(keys.has("ArrowLeft")||keys.has("KeyA")||held.has("left"))+
      analog.x+(Math.abs(gamepad?.axes[0]??0)>.18?(gamepad?.axes[0]??0):0)));
    if(ridingSedanId&&traffic&&(passengerBrake||passengerThrottle>0||Math.abs(steerRequest)>.12)&&
       !traffic.isManualDriving(ridingSedanId)){
      if(traffic.targetDriveStatus003(ridingSedanId)!=="none")
        onFeedback?.("Finch route cancelled · manual steering engaged");
      traffic.beginManualDriving(ridingSedanId);
    }
    if(ridingSedanId&&traffic?.isManualDriving(ridingSedanId)){
      traffic.setManualPedals(ridingSedanId,passengerThrottle,Number(passengerBrake));
      traffic.setManualSteering(ridingSedanId,steerRequest);
      traffic.setDriverBrake(null,false);
      traffic.setDriverThrottle(null,0);
    }else{
      traffic?.setDriverBrake(ridingSedanId,passengerBrake);
      traffic?.setDriverThrottle(ridingSedanId,passengerThrottle);
    }
    if(traffic&&traffic3D){
      trafficAccumulator=Math.min(.15,trafficAccumulator+dt);
      let steps=0;
      while(trafficAccumulator>=NH012_SIMULATION_DT-1e-7&&steps<3){
        traffic.step();
        trafficAccumulator-=NH012_SIMULATION_DT;
        steps++;
      }
      if(steps&&solidVehicleHandles.size){
        // Physics blockers follow the SAME simulation pose as the LOD meshes.
        for(const agent of traffic.agents){
          const hull=solidVehicleHandles.get(agent.id);
          if(!hull)continue;
          const p=sedanRoadPosition(agent);
          hull.update({x:p.x,y:p.y,z:p.z,heading:agent.heading});
        }
        walk?.physics.commitSolidTrafficPositions();
      }
    }
    const liftPassenger=!ridingSedanId&&mode==="walk"&&walk
      ?walk.physics.playerPosition():null;
    liftFrame=finchLobby?.update(liftPassenger,dt)??null;
    genericLiftFrame=buildingLifts?.update(liftPassenger,dt)??null;
    const liftOverride=liftFrame?.positionOverride??genericLiftFrame?.positionOverride??null;
    const liftTraveling=Boolean(liftFrame?.traveling||genericLiftFrame?.traveling);
    if(liftOverride&&walk){
      if(!liftCollisionDisabled){
        walk.physics.setPlayerCollisionEnabled(false);liftCollisionDisabled=true;
      }
      walk.physics.setPlayerPosition(liftOverride);
    }else if(liftCollisionDisabled&&!liftTraveling&&walk){
      walk.physics.setPlayerCollisionEnabled(true);liftCollisionDisabled=false;
    }
    if(pedestrians){
      pedestrianAccumulator=Math.min(.15,pedestrianAccumulator+dt);
      let pedSteps=0;
      while(pedestrianAccumulator>=.05-1e-7&&pedSteps++<3){
        pedestrians.step(.05);pedestrianAccumulator-=.05;
      }
      // Before Reese's next Rapier movement, register nearby NPC capsules.
      if(walk){
        walk.physics.syncNearbyPedestrians(pedestrians.agents
          .filter(a=>a.state!=="inside")
          .map(a=>({id:a.id,x:a.x,y:northHeightsGround(a.x,a.z)+.92,z:a.z})));
      }
      const driven=ridingAgent();
      const missionPlayer=driven
        ?{x:driven.x,y:northHeightsGround(driven.x,driven.z)+.92,
           z:driven.z,inCar:true,speed:driven.speed}
        :mode==="walk"&&walk
          ?{...walk.physics.playerPosition(),inCar:false,speed:lastTravelSpeed}
          :null;
      dianeLevel?.tick(dt,missionPlayer,yaw,northHeightsGround);
    }
    // Detect a pedestrian in the forward swept corridor of an approaching
    // car; horn only when obstructed, with one burst per car cooldown.
    hornCheck+=dt;
    if(hornCheck>=.30&&traffic&&pedestrians&&vehicleAudio.isUnlocked){
      hornCheck=0;
      const visiblePeople=pedestrians.agents.filter(p=>p.state!=="inside");
      const reese=!ridingSedanId&&walk?walk.physics.playerPosition():null;
      let hornCount=0;
      for(const car of traffic.agents){
        if(car.speed<.25||hornCount>=2)continue;
        if(Math.hypot(car.x-camera.position.x,car.z-camera.position.z)>65)continue;
        const people=reese?[...visiblePeople,{id:"reese",x:reese.x,z:reese.z}]:visiblePeople;
        for(const person of people){
          const dx=person.x-car.x,dz=person.z-car.z;
          const forward=dx*Math.sin(car.heading)+dz*Math.cos(car.heading);
          const side=Math.abs(dx*Math.cos(car.heading)-dz*Math.sin(car.heading));
          if(forward>1.45&&forward<Math.max(4.5,car.speed*1.3+3)&&side<1.55){
            if(vehicleAudio.playHorn(car.id,car.x,northHeightsGround(car.x,car.z),car.z)){
              hornCount++;
              if(person.id!=="reese")pedestrians.signalHorn(person.id);
            }
            break;
          }
        }
      }
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
    if(ridingSedanId&&walk){
      // Accepted Stage 1 passenger view with Stage 2 braking and Stage 3
      // throttle routed to NH-012. No second Sedan actor or replacement wheels.
      const agent=ridingAgent();
      if(agent){
        if(dragPointer===null)yaw+=trafficHeadingDelta(rideLastHeading,agent.heading);
        rideLastHeading=agent.heading;
        const p=sedanRoadPosition(agent);
        setCameraAt({x:p.x,y:p.y+1.0,z:p.z});
      }
    }else if((liftFrame?.traveling||genericLiftFrame?.traveling)&&mode==="walk"&&walk&&actor&&humanoid){
      // Suspend gravity and walking inputs while the glass lift is active.
      physicsAccumulator=0;lastGrounded=true;lastTravelSpeed=0;
      const pose=walk.physics.playerPosition();
      if(settings.enableCharacter)
        actor.updateControlled(pose,headingYaw,0,dt,false,true,0);
      else{
        humanoid.root.position.set(pose.x,pose.y,pose.z);
        humanoid.root.rotation.y=headingYaw;
        humanoid.updateAnimation({correctedPlanarSpeed:0,rawGrounded:true,
          intentMagnitude:0,sprintRequested:false,jumpAscending:false,dt});
      }
      setCameraAt(pose);
    }else if(machineView&&walk&&actor&&humanoid){
      // The Machine navigates a detached first-person camera. Reese's Rapier
      // capsule stays untouched and his idle pose stays grounded at the anchor.
      const player=walk.physics.playerPosition();
      if(settings.enableCharacter)actor.updateControlled(player,headingYaw,0,dt,false,true,0);
      else{
        humanoid.root.position.set(player.x,player.y,player.z);
        humanoid.root.rotation.y=headingYaw;
        humanoid.updateAnimation({correctedPlanarSpeed:0,rawGrounded:true,
          intentMagnitude:0,sprintRequested:false,jumpAscending:false,dt});
      }
      physicsAccumulator=0;lastTravelSpeed=0;footstepTravel=0;
      const up=Number(active("up")||key("Space"))-
        Number(active("down")||key("ControlLeft")||key("ControlRight"));
      const motion=heading.scale(z).add(side.scale(x)).add(new Vector3(0,up,0));
      if(motion.lengthSquared()>1)motion.normalize();
      const speed=fast?25:9;
      const wanted=camera.position.add(motion.scale(speed*dt));
      const bounded=clampNorthHeightsActorXZ(wanted.x,wanted.z);
      camera.position.set(bounded.x,
        Math.min(280,Math.max(northHeightsGround(bounded.x,bounded.z)+1.4,wanted.y)),bounded.z);
      const direction=new Vector3(Math.sin(yaw)*Math.cos(pitch),-Math.sin(pitch),
        Math.cos(yaw)*Math.cos(pitch));
      camera.setTarget(camera.position.add(direction));
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
        // Gait distance, not render FPS, owns each foot-ground contact.
        if(result.grounded&&result.speed>.3){
          footstepTravel+=result.speed/60;
          const stride=fast?.9:.65;
          if(footstepTravel>=stride){
            footstepTravel-=stride;
            vehicleAudio.playFootstep(fast||result.speed>5);
          }
        }else footstepTravel=0;
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
    }
    locationTick+=dt;
    if(locationTick>=.33){
      locationTick=0;updateLocation();
      onElevatorChange?.(liftFrame?.state??null);
       onBuildingLiftChange?.(genericLiftFrame?.state??null);
      const nearFinch=finchSuite?.isNearFinch(!ridingSedanId&&mode==="walk"&&walk
        ?walk.physics.playerPosition():null)??false;
      if(nearFinch!==lastFinchNear){
        lastFinchNear=nearFinch;onFinchProximityChange?.(nearFinch);
      }
      if(ridingSedanId){
        const agent=ridingAgent();
        if(agent){
          const target=traffic?.targetDriveStatus003(agent.id)??"none";
          if(target==="arrived"&&!finchArrivedAnnounced){
            finchArrivedAnnounced=true;
            onFeedback?.("Arrived at Finch HQ · exit and walk to the lobby");
          }
          onVehicleChange?.(traffic?.isManualDriving(agent.id)?"Sedan · Manual":
            target==="arrived"?"Sedan · Finch HQ":
            target==="enroute"?"Sedan · Finch route":"Sedan · Autopilot",agent.speed);
        }
      }
      const near=!ridingSedanId&&mode==="walk"&&walk
        ?nearestBoardableVehicle(walk.physics.playerPosition(),
            [],movingCandidates(),cameraBlockers):null;
      onNearbyVehicleChange?.(!!near);
    }
    // GEN-VEH-001: all traffic generated, zero source-GLB proximity swaps.
    // OPT-02: render LOD after camera and actor have moved in this very frame,
    // avoiding one-frame stale full-detail promotion during rapid flight descent.
    if(traffic&&traffic3D){
      scene.updateTransformMatrix();
      const views=traffic3D.update(traffic.snapshot(),new Set(),camera);
      visibleAuthenticCars=0;
      visibleTrafficCars=views.vehicles3D;
    }
    // PED-002 checklist 01: characters only. Pending/failed GLBs stay absent.
    if(pedestrians&&pedestrianCharacters){
      pedestrianCharacters.update(pedestrians,camera);
    }
    if(dianeLevel&&dianeLabel){
      dianeLabel.update(dianeLevel.npcPosition,
        walk&&!ridingSedanId?walk.physics.playerPosition():null,
        northHeightsGround,dianeLevel.stage,dianeLevel.target.state!=="inside");
    }
    if(dianeLevel&&dianeCarMarker){
      const playerPose=ridingAgent()??(walk&&!ridingSedanId?walk.physics.playerPosition():null);
      dianeCarMarker.update(dianeLevel.carPosition,playerPose,northHeightsGround,
        dianeLevel.stage==="follow"||dianeLevel.stage==="observe");
    }
    // Culling only; no per-frame GLB imports, meshes or physical actors.
    lampHandle?.update(camera.position,dt);
    treeHandle?.update(camera.position,dt);
    // 20Hz sound telemetry, gated behind the actual unlocked AudioContext.
    // Query NH012's authoritative positions; never infer engine load from
    // Babylon wheel animation or spawn another car for positional audio.
    if(traffic&&vehicleAudio.isUnlocked){
      audioAccumulator=Math.min(.15,audioAccumulator+dt);
      if(audioAccumulator>=.05){
        const soundDt=audioAccumulator;audioAccumulator=0;
        const forward=camera.getForwardRay().direction;
        vehicleAudio.sync(traffic.agents.map(agent=>{
          const isPlayer=agent.id===ridingSedanId;
          return {id:agent.id,x:agent.x,
            y:northHeightsGround(agent.x,agent.z),z:agent.z,
            heading:agent.heading,
            signedSpeedMps:isPlayer&&traffic!.isManualDriving(agent.id)
              ?traffic!.manualSignedSpeed(agent.id):agent.speed,
            throttle:isPlayer?passengerThrottle:0,
            braking:isPlayer&&passengerBrake?1:0,
            isPlayer};
        }),{
          x:camera.position.x,y:camera.position.y,z:camera.position.z,
          forwardX:forward.x,forwardY:forward.y,forwardZ:forward.z,
        },soundDt);
      }
    }
    if(++frames%40===0){
      statistics("FPS "+Math.round(engine.getFps())+" · MODE "+mode.toUpperCase()+
        " · TRAFFIC "+(traffic?.population??0)+" NATIVE "+visibleTrafficCars+
        " MOVING GLB "+visibleAuthenticCars+" DOTS 0 SIM "+(traffic?.tick??0)+
        " · PED "+(pedestrians?.population??0)+" LOGICAL · JOURNEYS "+(pedestrians?.completed??0)+" · ROUTE FAIL "+(pedestrians?.routeFailures??0)+
        " · REROUTES "+(pedestrians?.reroutes??0)+" · STRANDED "+(pedestrians?.stranded??0)+
        " · PARK "+(pedestrians?.parkVisits??0)+" · CROSS "+(pedestrians?.crossingsTraversed??0)+
        " · NPC "+(pedestrianCharacters?.active??0)+" ACTIVE / "+(pedestrianCharacters?.pooled??0)+" POOLED / "+(pedestrianCharacters?.loadedAppearances??0)+" OPTIMIZED GLBs"+
        " · NPC PENDING "+(pedestrianCharacters?.pendingAppearances??0)+
        " FAILED "+(pedestrianCharacters?.failedAppearances??0)+
        (pedestrianLoadError?" · NPC LOAD ERROR "+pedestrianLoadError:"")+
        " · AUDIO-021 "+vehicleAudio.statistics.active+"/"+vehicleAudio.statistics.budget+
        " "+vehicleAudio.statistics.context+" · GEN-VEH-009 125 SOURCE SEDANS · "+
        (ridingSedanId?" RIDING "+ridingSedanId+" "+(
          traffic?.isManualDriving(ridingSedanId)
            ?"MANUAL V "+traffic.manualSignedSpeed(ridingSedanId).toFixed(2)
            :"AUTOPILOT")+" · ":"")+
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
    if(ridingSedanId){
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
    if(ridingSedanId){
      const agent=ridingAgent();
      if(!agent||!trafficSedanCanExit(agent.speed)){
        onFeedback?.("Wait until the Sedan stops before exiting");return;
      }
      const footprints=walk.physics.vehicleNoStepFootprintsNear(
        {x:agent.x,y:sedanRoadPosition(agent).y,z:agent.z},7);
      let exit:{x:number;y:number;z:number}|null=null;
      for(const candidate of sedanExitCandidates(agent)){
        if(overlapsAnotherTrafficSedan(candidate,agent.id,traffic?.agents??[]))continue;
        if(insideBuildingFootprint(candidate,footprints))continue;
        const support=walk.physics.probeGround({
          x:candidate.x,y:northHeightsGround(candidate.x,candidate.z)+2.8,z:candidate.z,
        },3.5);
        if(!support||support.normal.y<.65)continue;
        const p={x:candidate.x,y:support.y+.94,z:candidate.z};
        if(!walk.physics.isPlayerPositionClear(p))continue;
        exit=p;break;
      }
      if(!exit){onFeedback?.("No safe exit beside this Sedan");return;}
      // Restore the one accepted player capsule at the current Sedan's stop.
      walk.physics.setPlayerPosition(exit);
      walk.physics.setPlayerCollisionEnabled(true);
      if(traffic?.isManualDriving(ridingSedanId)){
        if(!traffic.endManualDriving())traffic.parkManualOffRoad(ridingSedanId);
      }
      traffic?.clearDriverTurn(ridingSedanId);
      traffic?.clearTargetDrive003(ridingSedanId);
      finchArrivedAnnounced=false;
      ridingSedanId=null;
      mode="walk";
      setActiveCharacter(settings.enableCharacter);
      clearKeys();physicsAccumulator=0;
      onModeChange?.("walk");
      onVehicleChange?.(null,0);
      updateLocation(true);
      onFeedback?.("Exited Sedan · walk to Finch HQ lobby");
      return;
    }
    if(mode!=="walk"){onFeedback?.("Land before entering a vehicle");return;}
    const player=walk.physics.playerPosition();
    const near=nearestBoardableVehicle(player,[],movingCandidates(),cameraBlockers);
    if(!near){onFeedback?.("Approach a nearby vehicle to enter");return;}
    if(near.kind==="traffic-sedan"){
      if(near.id===dianeLevel?.carId){
        onFeedback?.("Diane's car · enter another vehicle to follow her");return;
      }
      const agent=traffic?.agents.find(a=>a.id===near.id);
      if(!agent)return;
      traffic?.clearDriverTurn();
      ridingSedanId=agent.id;
      if(agent.id===starterSedanId)traffic?.beginManualDriving(agent.id);
      rideLastHeading=agent.heading;
      yaw=agent.heading;
      mode="walk";
      walk.physics.setPlayerCollisionEnabled(false);
      actor.anchor.setEnabled(false);
      humanoid.root.setEnabled(false);
      clearKeys();physicsAccumulator=0;
      onModeChange?.("walk");
      if(agent.id===starterSedanId)
        onVehicleChange?.("Sedan · Manual",agent.speed);
      else onVehicleChange?.("Sedan · Autopilot",agent.speed);
      onNearbyVehicleChange?.(false);
      updateLocation(true);
      onFeedback?.(agent.id===starterSedanId
        ?"Yellow starter Sedan · manual driving ready":"Sedan autopilot · ride along · exit when stopped");
      return;
    }
  };
  const controller: NorthHeightsInspection = {
    press(control,down){
      if(paused)return;
      if(down){vehicleAudio.unlockFromGesture();held.add(control);}
      else held.delete(control);
    },
    move(x,y){
      if(paused)return;
      if(Math.abs(x)+Math.abs(y)>.1)vehicleAudio.unlockFromGesture();
      const nextX=Math.max(-1,Math.min(1,x));
      const nextY=Math.max(-1,Math.min(1,y));
      // Stage 6: continuous x-axis controls heading every fixed simulation tick.
      analog={x:nextX,y:nextY};
    },
    action(action,pressed){
      if(paused)return;
      if(pressed)vehicleAudio.unlockFromGesture();
      if(pressed&&action==="vehicle"){
        toggleVehicle();return;
      }
      if(action==="combat"){
        if(!pressed||machineView||ridingSedanId||liftFrame?.traveling||genericLiftFrame?.traveling)return;
        const kind=actor?.triggerCombat();
        if(kind)vehicleAudio.playCombatCue(kind);
        return;
      }
      const control=northHeightsActionControl007(action);
      if(control){controller.press(control,pressed);return;}
      if(action==="fly")return; // No Reese flight; only the detached camera can fly.
      if(action==="descend"&&!machineView)return;
      if(pressed)onFeedback?.(northHeightsUnavailableAction007(action));
    },
    applySettings(next){
      const characterChanged=settings.enableCharacter!==next.enableCharacter;
      settings=next;
      vehicleAudio.setSettings(next);
      if(characterChanged)setActiveCharacter(next.enableCharacter);
      applyGraphics();
    },
    setPaused(value){
      paused=value;
      vehicleAudio.setPaused(value);
      if(value){clearKeys();trafficAccumulator=0;}
      else {renderLast=0;trafficAccumulator=0;engine.resize();}
    },
    reset() {
      machineView=false;onMachineModeChange?.(false);
      if(ridingSedanId){
        if(traffic?.isManualDriving(ridingSedanId)){
          if(!traffic.endManualDriving())traffic.parkManualOffRoad(ridingSedanId);
        }
        traffic?.clearDriverTurn(ridingSedanId);
        traffic?.clearTargetDrive003(ridingSedanId);
        finchArrivedAnnounced=false;
        ridingSedanId=null;
        walk?.physics.setPlayerCollisionEnabled(true);
        onVehicleChange?.(null,0);
        setActiveCharacter(settings.enableCharacter);
      }
      walk?.reset(footSpawn.x,footSpawn.z);
      yaw=initialYaw;pitch=initialPitch;headingYaw=Math.PI;
      updateLocation(true);
      physicsAccumulator=0;clearKeys();
    },
    toggleSedanAutopilot,
    playMapCue(kind){vehicleAudio.playMapCue(kind);},
    toggleMachineCamera(){
      if(paused||!walk||!actor||!humanoid||ridingSedanId)return machineView;
      if(!machineView&&(liftFrame?.traveling||genericLiftFrame?.traveling))return false;
      machineView=!machineView;
      if(machineView){savedOrbit={yaw,pitch};}
      else{
        yaw=savedOrbit.yaw;pitch=savedOrbit.pitch;
        setCameraAt(walk.physics.playerPosition());
      }
      clearKeys();physicsAccumulator=0;footstepTravel=0;
      onMachineModeChange?.(machineView);
      return machineView;
    },
    moveMachineCameraTo(x,z){
      if(!machineView||!Number.isFinite(x)||!Number.isFinite(z))return false;
      const limited=clampNorthHeightsActorXZ(x,z);
      camera.position.set(limited.x,northHeightsGround(limited.x,limited.z)+11,limited.z);
      const direction=new Vector3(Math.sin(yaw)*Math.cos(pitch),-Math.sin(pitch),
        Math.cos(yaw)*Math.cos(pitch));
      camera.setTarget(camera.position.add(direction));
      return true;
    },
    driveToFinchHQ,
    startDianeMission(){return dianeLevel?.assign()??false;},
    reportDianeMission(){return dianeLevel?.report()??false;},
    setReeseHandItem(item){actor?.setHandItem(item);},
    setFinchTalking(active){finchSuite?.setTalking(active);},
    travelFinchElevator(floor){
      if(!finchLobby?.requestTravel(floor)){
        onFeedback?.("Step inside Finch HQ elevator before traveling");return false;
      }
      onFeedback?.("Elevator traveling through the glass shaft");
      clearKeys();physicsAccumulator=0;return true;
    },
    travelBuildingFloor019(buildingId,floor){
      if(!buildingLifts?.requestFloor(buildingId,floor)){
        onFeedback?.("Enter the glass lift before selecting a floor");return false;
      }
      onFeedback?.("Lift traveling to floor "+floor);
      clearKeys();physicsAccumulator=0;return true;
    },
    setTime(time) { lampTime=time;sky.setTime(time);lampHandle?.setTime(time); },
    setMode(next){
      if(ridingSedanId||next!=="walk")return false;
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
      document.removeEventListener("visibilitychange",soundVisibility);
      vehicleAudio.dispose();
      if(ridingSedanId&&traffic?.isManualDriving(ridingSedanId)){
        if(!traffic.endManualDriving())traffic.parkManualOffRoad(ridingSedanId);
      }
      finchSuite?.dispose();finchSuite=null;
      finchLobby?.dispose();finchLobby=null;
      buildingLifts?.dispose();buildingLifts=null;genericLiftFrame=null;
      liftFrame=null;
      if(liftCollisionDisabled)walk?.physics.setPlayerCollisionEnabled(true);
      liftCollisionDisabled=false;
      pedestrianCharacters?.dispose();pedestrianCharacters=null;
      dianeLabel?.dispose();dianeLabel=null;
      dianeCarMarker?.dispose();dianeCarMarker=null;dianeLevel=null;
      pedestrians=null;
      traffic3D?.dispose();traffic3D=null;
      for(const hull of solidVehicleHandles.values())hull.dispose();
      solidVehicleHandles.clear();
      traffic=null;
      lampHandle?.dispose();lampHandle=null;
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
    onMapBuildings?.(world.lotSpecs.map(l=>({
      id:l.id,x:l.position.x,z:l.position.z,
      width:l.overrides?.width??12,depth:l.overrides?.depth??12,
      floors:l.overrides?.floors??1,kind:l.archetype,
    })));
    cameraBlockers=northHeightsBuildingCollision005(world.lotSpecs).map(box=>({
      x:box.position.x,y:box.position.y,z:box.position.z,
      halfX:box.halfExtents.x,halfY:box.halfExtents.y,halfZ:box.halfExtents.z,
    }));
    if (closed) return controller;
    status("North Heights roads joined · loading original owner-committed tree GLB");
    let treeCount=0, treeInstances=0, treeError="";
    try {
      const realized=await placeNorthHeightsTrees004(scene,world.treeLocations,mobile);
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
    finchLobby=createFinchLobby004(scene,world.lotSpecs,northHeightsGround,walk.physics);
    finchSuite=createFinchSuite005(scene,world.lotSpecs,northHeightsGround,walk.physics);
    buildingLifts=createNorthHeightsBuildingLifts019(
      scene,world.lotSpecs,northHeightsGround,walk.physics);
    console.info("[NH-LIFT-019] generic lift shafts",buildingLifts.count);
    // GEN-VEH-009: retain all 125 NH-012 routes/identities, but render every
    // moving traffic agent as the single owner-accepted sedan in varied paint.
    // Other car models remain review-only; no proximity GLB swapping.
    traffic=new NH012TrafficSimulator(125,120125);
    starterSedanId=traffic.parkFinchStarter005();
    // NH-SOLID-017: the same hull for every accepted source Sedan, regardless
    // of original fleet tags, proximity, camera LOD or driver ownership.
    const measuredSedanHull=sedanNativeContactHull007();
    const solidWidth=Math.max(...measuredSedanHull.map(p=>p.x))-Math.min(...measuredSedanHull.map(p=>p.x));
    const solidLength=Math.max(...measuredSedanHull.map(p=>p.z))-Math.min(...measuredSedanHull.map(p=>p.z));
    const solidField=createNorthHeightsSolidField017({
      sedanHull:measuredSedanHull,
      buildings:world.lotSpecs,trees:treeHandle?world.treeLocations:[],
      lamps:planNorthHeightsStreetLamps012(world.treeLocations),
      cars:()=>traffic?.agents??[],
      people:()=>pedestrians?.agents??[],
      player:()=>!ridingSedanId&&mode==="walk"&&walk?walk.physics.playerPosition():null,
    });
    traffic.configureStage6FreeDriving((pose,length,width,id)=>
      solidField.isCarClear(pose,length,width,id));
    traffic.configureSolidTraffic((agent,pose)=>
      solidField.isCarClear(pose,agent.length,agent.width,agent.id));
    traffic.configureContactImpulses((agent,pose)=>
      solidField.carImpactAt(pose,agent.id));
    const pilotIds=assignNH013SedanPilot(traffic,8);
    const hatchIds=assignNH013HatchbackPilot(traffic,12);
    const taxiIds=assignNH014TaxiPilot(traffic,NH014_TAXI_COUNT);
    const kangoIds=assignNH015KangoPilot(traffic,NH015_KANGO_COUNT);
    const circuit=verifyCompleteFleet016(traffic.snapshot());
    // Historical model identity overlay pilots replace agent IDs and geometry
    // tags. Register physical hulls only AFTER identity assignment completes.
    for(let i=0;i<traffic.agents.length;i++){
      const original=traffic.agents[i]!;
      // Dimensions are immutable on each traffic agent: replace its record
      // after visual-ID pilot assignments, retaining its final stable ID.
      const agent={...original,length:solidLength,width:solidWidth};
      traffic.agents[i]=agent;
      const p=sedanRoadPosition(agent);
      solidVehicleHandles.set(agent.id,walk.physics.addSolidTrafficVehicle(
        {x:p.x,y:p.y,z:p.z,heading:agent.heading},
        solidLength,solidWidth));
    }
    walk.physics.commitSolidTrafficPositions();
    console.info("[NH-SOLID-017] solid fleet created",{
      hulls:solidVehicleHandles.size,staticContacts:solidField.staticCount,
      calibratedBody:{length:solidLength,width:solidWidth,hullVertices:measuredSedanHull.length},
      simulationOwner:"NH012",visualOwner:"GEN-VEH-009",
    });
    traffic3D=createNorthHeightsSedanTraffic009(scene,traffic.graph);
    // Use the SAME measured source axles as GEN-VEH-009 for rider camera height.
    const front=sourceWheelFit007("sedan","frontLeft");
    const rear=sourceWheelFit007("sedan","rearLeft");
    const other=sourceWheelFit007("sedan","frontRight");
    trafficWheelbase=Math.abs((front.center[2]??0)-(rear.center[2]??0));
    trafficTrack=Math.abs((front.center[0]??0)-(other.center[0]??0));
    console.info("[GEN-VEH-009] Accepted sedan-only 125-agent native traffic",{
       sedans:pilotIds.size,hatchbacks:hatchIds.size,taxis:taxiIds.size,kango:kangoIds.size,
       defaultVehicleModels:circuit.models,defaultVehicles:circuit.original,
       vehicleViews:traffic.population,renderModel:"sedan",dots:0,movingGLBs:0,
    });
    traffic3D.update(traffic.snapshot(),new Set());
    console.info("[NH-012] directed lane traffic initialized",{
      nodes:traffic.graph.nodes.size,directedLanes:traffic.graph.edges.size,
      turns:traffic.graph.connectors.size,agents:traffic.population,
    });
    // PED-002: preserve 100 logical agents and their original routes.
    // No colored proxies; GLBs appear only when their unique asset is ready.
    // Crossings remain geometric-only until the dedicated yielding stage.
    pedestrians=new NorthHeightsPedestrianSimulator001(world.lotSpecs,world.treeLocations);
    pedestrians.setVehicleOccupancy((x,z)=>solidField.personClear({x,z}));
    pedestrians.setPlayerOccupancy(()=>ridingSedanId||machineView||!walk
      ?null:walk.physics.playerPosition(),northHeightsGround);
    const assignedDianeCar=traffic.agents[110];
    if(!assignedDianeCar)throw Error("LVL-001 car identity missing");
    dianeLevel=new DianeLevel001(pedestrians,traffic,assignedDianeCar.id,
      readDianeProgress001(),view=>onDianeMissionChange?.(view));
    const dianeHull=solidVehicleHandles.get(dianeLevel.carId);
    if(dianeHull){
      const car=dianeLevel.car;
      const carPoint=sedanRoadPosition(car);
      dianeHull.update({x:carPoint.x,y:carPoint.y,z:carPoint.z,heading:car.heading});
      walk.physics.commitSolidTrafficPositions();
    }
    dianeLabel=createDianeWorldLabel001(scene);
    dianeCarMarker=createDianeCarMarker008(scene);
    console.info("[PED-002] pedestrian graph and independent simulator initialized",{
      agents:pedestrians.population,nodes:pedestrians.graph.nodes.size,
      doorways:pedestrians.graph.entrances.size,parks:pedestrians.graph.parks.length,
      crossings:pedestrians.graph.crossings,unreachable:pedestrians.graph.unreachable,
      characterGLBs:0,
    });
    // Stage 6: the six parked GLBs are not imported, preloaded, instantiated
    // or added to Rapier in North Heights. Parking pads may remain empty.
    buildingInteriors=world.lotSpecs;
    status("Loading Agent Reese and his embedded animations");
    actor=createReesePlayer001(scene);
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
    treeHandle?.update(camera.position,1);
    updateLocation(true);
    status("North Heights WALK physics ready · "+world.count+
      " original buildings · "+world.streetCount+" connected street axes · "+
      "PED-001 "+(pedestrians?.population??0)+" logical pedestrians · 100 unique NPC appearances stream after first frame · "+
      (world.instanceCount+treeInstances).toLocaleString()+" geometry instances · "+
      treeCount+" GLB trees · "+(traffic?.population??0)+ " logical traffic agents / 125 accepted source-native sedans, deterministic paint variation, zero dots, no traffic GLB swapping · 0 parked GLB vehicle loads · "+actorCount+" character meshes · "+walk.buildingCount+" solid buildings · "+walk.surfaceCount+" walkable ground layers"+(treeError?" · TREE IMPORT FAILED: "+treeError:"")+
      " · "+Math.round(performance.now()-started)+" ms");
    // Loading completes only after the initialized world actually draws.
    scene.onAfterRenderObservable.addOnce(()=>{
      if(closed)return;
      onFirstPlayableFrame?.();
      void finchLobby?.loadReceptionist();
      void finchSuite?.loadFinch();
      // Never hold the gameplay-ready signal for either GLB. The accepted
      // mobile/desktop simulation starts independently of lighting assets.
      void loadNorthHeightsStreetLamps012(scene,northHeightsGround,mobile,world.treeLocations)
        .then(renderer=>{
          if(closed){renderer.dispose();return;}
          lampHandle=renderer;
          solidField.activateLampPoles();
          renderer.setTime(lampTime);
          renderer.update(camera.position,1);
          console.info("[NH-LAMP-012] Owner GLB streetlight grid active",{
            planned:renderer.total,sourceMeshes:renderer.sources,
            geometryLoading:"complete",instances:"distance culled",
            individualGLBImports:2,physicsActors:0,
          });
        }).catch(error=>{
          if(!closed)console.error("[NH-LAMP-012] Owner GLB streetlights unavailable",error);
        });
      // Do not extend North Heights' critical first-playable load with 100 GLBs.
      // Pedestrians without a loaded valid GLB remain visually absent.
      if(pedestrianLoading||pedestrianCharacters)return;
      pedestrianLoading=true;
      void loadNorthHeightsPedestrianCharacters001(scene,northHeightsGround,mobile,
        message=>console.info("[PED-001 optimized]",message),()=>closed)
        .then(renderer=>{
          if(closed){renderer.dispose();return;}
          pedestrianCharacters=renderer;
          console.info("[PED-002] 100 logical agents each have a unique NPC appearance",{
            available:100,resident:renderer.loadedAppearances,pool:renderer.pooled,
            sourceBytes:PED002_NPC_TOTAL_BYTES,vehicleAgents:traffic?.population,
          });
        }).catch(error=>{
          if(closed)return;
          pedestrianLoadError=error instanceof Error?error.message:String(error);
          console.error("[PED-002] NPC renderer initialization failed",error);
          onFeedback?.("Pedestrian models unavailable; no substitute visuals rendered");
        }).finally(()=>{pedestrianLoading=false;});
    });
  } catch (error) {
    status("North Heights reconstruction failed: "+(error instanceof Error?error.message:String(error)));
    console.error("[NH-REBUILD-001] procedural generation failed",error);
  }
  return controller;
}
