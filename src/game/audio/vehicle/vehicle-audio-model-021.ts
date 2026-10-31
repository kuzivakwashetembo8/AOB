/** GTD-AUDIO-021: pure, bounded sound-only drivetrain estimates.
 * NH012 remains the sole physical authority. This does NOT assert real
 * combustion RPM, gearbox torque, tire slip or transmission state. */
export interface VehicleAudioTelemetry021 {
  id:string;
  x:number;y:number;z:number;heading:number;
  signedSpeedMps:number;
  throttle:number; braking:number; isPlayer:boolean;
}
export interface VehicleAudioListener021 {
  x:number;y:number;z:number;
  forwardX:number;forwardY:number;forwardZ:number;
}
export interface AcousticState021 {
  rpm:number; gear:number; load:number; firingHz:number;
  roadLevel:number; speedMps:number;
}
export const AUDIO021_IDLE_RPM=850;
export const AUDIO021_MAX_RPM=6200;
const clamp=(v:number,a:number,b:number)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):a;
const gearRatios=[0,790,495,355,270];
/** A gear-like sound transition with hysteresis, never a physics gear shift. */
export function acousticGear021(speed:number,prior=1):number{
  const s=clamp(Math.abs(speed),0,60);
  let gear=Math.round(clamp(prior,1,4));
  // Adjacent transition only: a single large frame cannot jump 1 -> 4.
  const up=[0,2.7,5.7,9.1,Infinity],down=[0,-Infinity,1.8,4.6,7.8];
  if(gear<4&&s>up[gear]!)gear++;
  else if(gear>1&&s<down[gear]!)gear--;
  return gear;
}
export function acousticStep021(
  input:Pick<VehicleAudioTelemetry021,"signedSpeedMps"|"throttle"|"braking">,
  previous:AcousticState021|undefined,dtSeconds:number,
):AcousticState021{
  const dt=clamp(dtSeconds,0,0.15);
  const speed=clamp(Math.abs(input.signedSpeedMps),0,40);
  const throttle=clamp(input.throttle,0,1),braking=clamp(input.braking,0,1);
  const gear=acousticGear021(speed,previous?.gear??1);
  // Reversing does not incorrectly emulate high-speed forward gears.
  const ratio=input.signedSpeedMps<-.05?420:gearRatios[gear]!;
  const load=clamp(.11+throttle*.82-braking*.12,0,1);
  const rawRpm=clamp(AUDIO021_IDLE_RPM+
    speed*ratio+throttle*(speed<.3?900:550),AUDIO021_IDLE_RPM,AUDIO021_MAX_RPM);
  const targetRpm=previous&&gear!==previous.gear?rawRpm*.86:rawRpm;
  const tau=targetRpm>(previous?.rpm??AUDIO021_IDLE_RPM)?0.105:0.22;
  const smoothing=1-Math.exp(-dt/tau);
  const rpm=previous?previous.rpm+(targetRpm-previous.rpm)*smoothing:targetRpm;
  const roadLevel=clamp((speed-.15)/11,0,1);
  return {rpm:clamp(rpm,AUDIO021_IDLE_RPM,AUDIO021_MAX_RPM),
    gear,load,firingHz:clamp(rpm/30,20,AUDIO021_MAX_RPM/30),
    roadLevel,speedMps:speed};
}
/** Pure allocation order; keep player ID single-owned and ignore beyond range. */
export function selectAudibleVehicles021(
  cars:readonly Pick<VehicleAudioTelemetry021,"id"|"x"|"z">[],
  listener:Pick<VehicleAudioListener021,"x"|"z">,
  playerId:string|null,
  maxTraffic:number,
  rangeMeters=62,
):string[]{
  const radius2=rangeMeters*rangeMeters;
  const near=cars.filter(c=>c.id!==playerId&&
      (c.x-listener.x)**2+(c.z-listener.z)**2<=radius2)
    .sort((a,b)=>((a.x-listener.x)**2+(a.z-listener.z)**2)-
       ((b.x-listener.x)**2+(b.z-listener.z)**2))
    .slice(0,Math.max(0,Math.floor(maxTraffic))).map(v=>v.id);
  if(playerId&&cars.some(c=>c.id===playerId))near.unshift(playerId);
  return near;
}
/** Deterministic, tiny in-memory broadband source. No file is requested. */
export function generateAudioNoise021(length:number,seed=7021):Float32Array{
  const n=Math.max(1,Math.min(192000,Math.floor(length)));
  const result=new Float32Array(n);
  let state=seed>>>0;
  let low=0;
  for(let i=0;i<n;i++){
    state=(Math.imul(1664525,state)+1013904223)>>>0;
    const white=(state/2147483648)-1;
    low=(low*.975)+(white*.025);
    result[i]=clamp(white*.54+low*1.7,-1,1);
  }
  return result;
}
