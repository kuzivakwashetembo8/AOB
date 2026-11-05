/** GTD-NH-ATM-022: deterministic independent atmosphere, no Babylon/React dependency. */
import {
 CLOUD_GENERA_022,cloudCandidates022,cloudCoverForCondition022,
 isCloudGenus022,isWeatherCondition022,
 type CloudGenus022,type CloudChoice022,type WeatherCondition022,type WeatherMode022,
} from "./nh022-cloud-presets";

const VERSION=1;
const TAU=2*Math.PI;
export function mixSeed022(...values:number[]):number{
 let x=0x9e3779b9;
 for(const v of values){x=(x ^ Math.imul((v|0)^0x85ebca6b,0xc2b2ae35))>>>0;
  x=Math.imul(x^(x>>>16),0x7feb352d)>>>0;x=Math.imul(x^(x>>>15),0x846ca68b)>>>0;}
 return (x^(x>>>16))>>>0;
}
export function random022(seed:number):number{return mixSeed022(seed)/4294967296;}
export type CloudScene022={
 id:number;genus:CloudGenus022;secondary:CloudGenus022|null;condition:WeatherCondition022;
 coverage:number;seed:number;windX:number;windZ:number;
};
export type AtmosphereRender022={
 from:CloudScene022;to:CloudScene022;blend:number;timeOfDay:number;
 cloudSeconds:number;frozen:boolean;
};
export type AtmosphereStatus022={
 weatherMode:WeatherMode022;condition:WeatherCondition022;cloudChoice:CloudChoice022;
 genus:CloudGenus022;secondary:CloudGenus022|null;coverage:number;frozen:boolean;
 dayIndex:number;minuteOfDay:number;worldSeed:number;
};
export type AtmosphereSnapshot022={
 version:1;worldSeed:number;dayIndex:number;minuteOfDay:number;clockSpeed:number;
 weatherMode:WeatherMode022;manualCondition:WeatherCondition022;cloudChoice:CloudChoice022;
 frozen:boolean;cloudSeconds:number;from:CloudScene022;to:CloudScene022;
 blend:number;episode:number;transitionSerial:number;
};
const weightedNext=(previous:WeatherCondition022,roll:number):WeatherCondition022=>{
 const table:Record<WeatherCondition022,readonly [WeatherCondition022,number][]> ={
  "Clear":[["Clear",.31],["Partly Cloudy",.65],["Overcast",.04]],
  "Partly Cloudy":[["Clear",.22],["Partly Cloudy",.39],["Overcast",.29],["Rain",.10]],
  "Overcast":[["Partly Cloudy",.27],["Overcast",.37],["Rain",.31],["Thunderstorm",.05]],
  "Rain":[["Overcast",.47],["Rain",.34],["Thunderstorm",.12],["Partly Cloudy",.07]],
  "Thunderstorm":[["Rain",.44],["Overcast",.42],["Thunderstorm",.14]],
 };
 let total=0;
 for(const [condition,weight] of table[previous]){total+=weight;if(roll<total)return condition;}
 return previous;
};
/** Eight three-hour episodes per day. Selection uses Markov continuity within the day. */
export function scheduledWeather022(seed:number,dayIndex:number,minute:number){
 const episode=Math.min(7,Math.max(0,Math.floor(minute/180)));
 let condition:WeatherCondition022=(
  ["Clear","Partly Cloudy","Overcast"] as const
 )[Math.floor(random022(mixSeed022(seed,dayIndex,12345))*3)]!;
 for(let k=0;k<=episode;k++){
  condition=weightedNext(condition,random022(mixSeed022(seed,dayIndex,k,8121)));
 }
 return {condition,episode};
}
function chooseScene(seed:number,day:number,episode:number,serial:number,
 condition:WeatherCondition022,choice:CloudChoice022):CloudScene022{
 const id=mixSeed022(seed,day,episode,serial,1171);
 const candidates=cloudCandidates022(condition);
 const genus=isCloudGenus022(choice)?choice:
  candidates[Math.floor(random022(id+1)*candidates.length)]!;
 const secondary=choice==="Mixed"||choice==="Auto"&&random022(id+2)>.58?
  candidates[Math.floor(random022(id+3)*candidates.length)]!:null;
 const densityVariance=.80+random022(id+4)*.32;
 const coverage=Math.min(.99,cloudCoverForCondition022(condition)*densityVariance);
 const speedAngle=random022(id+5)*TAU;
 return {id,genus,secondary:secondary===genus?null:secondary,condition,coverage,
  seed:mixSeed022(seed,id,452),windX:Math.cos(speedAngle),windZ:Math.sin(speedAngle)};
}
function validatedScene(value:unknown):value is CloudScene022{
 if(!value||typeof value!=="object")return false;
 const a=value as Partial<CloudScene022>;
 return Number.isFinite(a.id)&&isCloudGenus022(a.genus)&&
  (a.secondary===null||isCloudGenus022(a.secondary))&&isWeatherCondition022(a.condition)&&
  Number.isFinite(a.coverage)&&Number(a.coverage)>=0&&Number(a.coverage)<=1&&
  Number.isFinite(a.seed)&&Number.isFinite(a.windX)&&Number.isFinite(a.windZ);
}
export function validateAtmosphereSnapshot022(value:unknown):value is AtmosphereSnapshot022{
 if(!value||typeof value!=="object")return false;
 const a=value as Partial<AtmosphereSnapshot022>;
 return a.version===VERSION&&
  Number.isInteger(a.worldSeed)&&Number.isInteger(a.dayIndex)&&Number(a.dayIndex)>=0&&
  Number.isFinite(a.minuteOfDay)&&Number(a.minuteOfDay)>=0&&Number(a.minuteOfDay)<1440&&
  Number.isFinite(a.clockSpeed)&&[0,1,2,8].includes(Number(a.clockSpeed))&&
  (a.weatherMode==="Auto"||a.weatherMode==="Manual")&&
  isWeatherCondition022(a.manualCondition)&&
  (a.cloudChoice==="Auto"||a.cloudChoice==="Mixed"||isCloudGenus022(a.cloudChoice))&&
  typeof a.frozen==="boolean"&&Number.isFinite(a.cloudSeconds)&&Number(a.cloudSeconds)>=0&&
  Number.isFinite(a.blend)&&Number(a.blend)>=0&&Number(a.blend)<=1&&
  Number.isInteger(a.episode)&&Number.isInteger(a.transitionSerial)&&
  validatedScene(a.from)&&validatedScene(a.to);
}
export class NorthHeightsAtmosphereModel022{
 private seed:number;
 private day=0;
 private minute=14*60+53;
 private speed=2;
 private weatherMode:WeatherMode022="Auto";
 private manualCondition:WeatherCondition022="Partly Cloudy";
 private cloudChoice:CloudChoice022="Auto";
 private frozen=false;
 private cloudSeconds=0;
 private episode=0;
 private serial=0;
 private from:CloudScene022;
 private to:CloudScene022;
 private blend=1;
 private transitionDuration=32;
 constructor(seed:number){
  this.seed=seed>>>0;
  const condition=scheduledWeather022(this.seed,this.day,this.minute);
  this.episode=condition.episode;
  // Accepted misty cloud starts as representative overcast/soft low coverage;
  // the generated schedule replaces it smoothly after initial review.
  this.from=this.to=chooseScene(this.seed,this.day,this.episode,this.serial,condition.condition,this.cloudChoice);
 }
 private condition():WeatherCondition022{
  return this.weatherMode==="Manual"?this.manualCondition:
   scheduledWeather022(this.seed,this.day,this.minute).condition;
 }
 private reselect(force=false){
  const auto=scheduledWeather022(this.seed,this.day,this.minute);
  const nextCondition=this.condition();
  const episode=this.weatherMode==="Manual"?this.episode:auto.episode;
  if(!force&&this.to.condition===nextCondition&&
   this.episode===episode)return;
  // Keep whichever cloud field currently carries more visual weight.
  this.from=this.blend>=.5?this.to:this.from;
  this.serial++;
  this.episode=episode;
  this.to=chooseScene(this.seed,this.day,episode,this.serial,nextCondition,this.cloudChoice);
  this.blend=0;
 }
 syncClock(minuteOfDay:number,dayIndex:number,clockSpeed:number){
  if(!Number.isFinite(minuteOfDay)||!Number.isFinite(dayIndex))return;
  this.minute=Math.min(1439.999,Math.max(0,minuteOfDay));
  this.day=Math.max(0,Math.floor(dayIndex));
  this.speed=clockSpeed;
  if(!this.frozen&&this.weatherMode==="Auto")this.reselect();
 }
 advance(dt:number){
  if(this.frozen||!Number.isFinite(dt)||dt<=0)return;
  const step=Math.min(.05,dt);
  this.cloudSeconds+=step;
  if(this.blend<1)this.blend=Math.min(1,this.blend+step/this.transitionDuration);
 }
 setWeatherMode(value:WeatherMode022){
  if(this.weatherMode===value)return;
  this.weatherMode=value;if(!this.frozen)this.reselect(true);
 }
 setCondition(value:WeatherCondition022){
  if(!isWeatherCondition022(value))return;
  this.manualCondition=value;this.weatherMode="Manual";
  if(!this.frozen)this.reselect(true);
 }
 setCloudChoice(value:CloudChoice022){
  if(value!=="Auto"&&value!=="Mixed"&&!CLOUD_GENERA_022.includes(value as CloudGenus022))return;
  if(this.cloudChoice===value)return;
  this.cloudChoice=value;if(!this.frozen)this.reselect(true);
 }
 setFrozen(value:boolean){
  if(value===this.frozen)return;
  this.frozen=value;
  if(!value&&this.weatherMode==="Auto")this.reselect();
  if(!value&&this.weatherMode==="Manual"&&
   (this.to.condition!==this.manualCondition||
   (isCloudGenus022(this.cloudChoice)&&this.to.genus!==this.cloudChoice)))this.reselect(true);
 }
 get render():AtmosphereRender022{
  return {from:this.from,to:this.to,blend:this.blend,timeOfDay:this.minute,
   cloudSeconds:this.cloudSeconds,frozen:this.frozen};
 }
 get status():AtmosphereStatus022{
  return {weatherMode:this.weatherMode,condition:this.to.condition,
   cloudChoice:this.cloudChoice,genus:this.to.genus,secondary:this.to.secondary,
   coverage:this.to.coverage,frozen:this.frozen,dayIndex:this.day,
   minuteOfDay:this.minute,worldSeed:this.seed};
 }
 capture():AtmosphereSnapshot022{
  return {version:1,worldSeed:this.seed,dayIndex:this.day,minuteOfDay:this.minute,
   clockSpeed:this.speed,weatherMode:this.weatherMode,manualCondition:this.manualCondition,
   cloudChoice:this.cloudChoice,frozen:this.frozen,cloudSeconds:this.cloudSeconds,
   from:{...this.from},to:{...this.to},blend:this.blend,episode:this.episode,
   transitionSerial:this.serial};
 }
 restore(snapshot:unknown):boolean{
  if(!validateAtmosphereSnapshot022(snapshot))return false;
  this.seed=snapshot.worldSeed;this.day=snapshot.dayIndex;this.minute=snapshot.minuteOfDay;
  this.speed=snapshot.clockSpeed;this.weatherMode=snapshot.weatherMode;
  this.manualCondition=snapshot.manualCondition;this.cloudChoice=snapshot.cloudChoice;
  this.frozen=snapshot.frozen;this.cloudSeconds=snapshot.cloudSeconds;
  this.from={...snapshot.from};this.to={...snapshot.to};this.blend=snapshot.blend;
  this.episode=snapshot.episode;this.serial=snapshot.transitionSerial;
  return true;
 }
}
