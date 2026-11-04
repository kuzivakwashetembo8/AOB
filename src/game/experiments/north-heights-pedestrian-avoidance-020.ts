/** PED-020: local obstacle bypass on the established pedestrian route.
 * Sideways detours remain continuous and swept-collision checked. */
import type {PedEdgeKind001,PedPoint001} from "./north-heights-pedestrian-graph-001";
export type PedMotion020={x:number;z:number;progress:number;avoidOffset:number;avoidTarget:number};
export type PedMotionResult020=PedMotion020&{traveled:number;blocked:boolean};
const EPS=.00001;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const candidates:Record<PedEdgeKind001,readonly number[]>={
 sidewalk:[1.35,1.65],entrance:[.75,1.20],park:[1.1,1.65],
 crossing:[1.45,2.25,2.85],
};
export function pedestrianObstacleStep020(
 state:PedMotion020,p:PedPoint001,q:PedPoint001,kind:PedEdgeKind001,
 budget:number,clear:(x:number,z:number)=>boolean,preferredSide:1|-1=1,
):PedMotionResult020{
 const length=Math.hypot(q.x-p.x,q.z-p.z);
 if(length<EPS||budget<=0)return {...state,traveled:0,blocked:true};
 const dx=(q.x-p.x)/length,dz=(q.z-p.z)/length;
 const pos=(progress:number,offset:number)=>({
  x:p.x+dx*progress-dz*offset,z:p.z+dz*progress+dx*offset,
 });
 // Radius is included by the occupancy callback; sample all swept positions.
 const swept=(a:PedPoint001,b:PedPoint001)=>{
  const samples=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.15));
  for(let i=1;i<=samples;i++){
   const t=i/samples;
   if(!clear(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;
  }
  return true;
 };
 const current={x:state.x,z:state.z};
 const targetProgress=clamp(state.progress+Math.min(budget,Math.max(0,length-state.progress)),0,length);
 const safeCenterAhead=()=>{
  const center=pos(state.progress,0);
  return swept(current,center)&&swept(center,pos(Math.min(length,state.progress+2.6),0));
 };
 let target=state.avoidTarget;
 if(Math.abs(state.avoidOffset-target)<=.015){
  if(Math.abs(state.avoidOffset)>.015&&safeCenterAhead())target=0;
  else {
   const look=pos(Math.min(length,state.progress+1.15),state.avoidOffset);
   if(!swept(current,look)){
    // Stable left/right preference avoids oscillating around an obstacle.
    const offsets=candidates[kind].flatMap(width=>[preferredSide*width,-preferredSide*width]);
    const chosen=offsets.find(offset=>{
     const side=pos(state.progress,offset);
     const ahead=pos(Math.min(length,state.progress+2.2),offset);
     return swept(current,side)&&swept(side,ahead);
    });
    if(chosen===undefined)return {...state,traveled:0,blocked:true};
    target=chosen;
   }
  }
 }
 if(Math.abs(state.avoidOffset-target)>.015){
  const offset=state.avoidOffset+Math.sign(target-state.avoidOffset)*
   Math.min(budget,Math.abs(target-state.avoidOffset));
  const next=pos(state.progress,offset);
  if(!swept(current,next))return {...state,traveled:0,blocked:true};
  const arrived=Math.abs(offset-target)<.015;
  return {...state,...next,avoidOffset:arrived?target:offset,avoidTarget:target,
   traveled:Math.hypot(next.x-current.x,next.z-current.z),blocked:false};
 }
 if(state.progress>=length-EPS){
  if(Math.abs(state.avoidOffset)>.015){
   const center=pos(length,0);
   if(!swept(current,center))return {...state,traveled:0,blocked:true};
   const offset=state.avoidOffset-Math.sign(state.avoidOffset)*
    Math.min(budget,Math.abs(state.avoidOffset));
   const next=pos(length,offset);
   return {...state,...next,avoidOffset:Math.abs(offset)<.015?0:offset,
    avoidTarget:0,traveled:Math.hypot(next.x-current.x,next.z-current.z),blocked:false};
  }
  return {...state,traveled:0,blocked:false};
 }
 const next=pos(targetProgress,state.avoidOffset);
 if(!swept(current,next))return {...state,traveled:0,blocked:true};
 return {...state,...next,progress:targetProgress,avoidTarget:target,
  traveled:Math.hypot(next.x-current.x,next.z-current.z),blocked:false};
}
