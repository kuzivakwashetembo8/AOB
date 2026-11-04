/** POI-011 pilot: deterministic 20Hz signal logic without Babylon, React, or wall time.
 * Never grants physical permission by itself: NH012 admission and collision remain authoritative. */
import {FINCH_SIGNAL_PLAN_021,type JunctionSignalPlan021} from "./nh021-traffic-signal-plan";
import {signalApproachAllowed021} from "./nh021-movement-conflict-matrix";
export type SignalPhase021=
 "NS_GREEN"|"NS_AMBER"|"NS_CLEARANCE"|
 "EW_GREEN"|"EW_AMBER"|"EW_CLEARANCE"|
 "PED_WALK"|"PED_CLEARANCE"|"PED_ALL_RED";
export type SignalColour021="red"|"amber"|"green";
export type SignalSnapshot021=Readonly<{
 nodeId:string;tick:number;phase:SignalPhase021;ticksRemaining:number;
 pedestrianDemand:boolean;crossingOccupied:number;vehicleOccupied:boolean;
}>;
export class TrafficSignalController021{
 readonly plan:JunctionSignalPlan021;
 tick=0;
 phase:SignalPhase021="NS_GREEN";
 private phaseTicks=0;
 private pendingPedestrian=false;
 private occupiedPedestrians:()=>number=()=>0;
 private lastVehicleOccupied=false;
 constructor(plan:JunctionSignalPlan021=FINCH_SIGNAL_PLAN_021){this.plan=plan;}
 setPedestrianOccupancy021(provider:()=>number):void{this.occupiedPedestrians=provider;}
 requestPedestrian021():void{this.pendingPedestrian=true;}
 get crossingOccupied021():number{return Math.max(0,this.occupiedPedestrians()|0);}
 get pedestrianMayEnter021():boolean{return this.phase==="PED_WALK";}
 colour021(dx:number,dz:number):SignalColour021{
  if(signalApproachAllowed021(this.phase,dx,dz))return "green";
  const axis=dz!==0?"NS":"EW";
  if(this.phase===axis+"_AMBER")return "amber";
  return "red";
 }
 mayEnter021(dx:number,dz:number):boolean{
  return signalApproachAllowed021(this.phase,dx,dz)&&this.crossingOccupied021===0;
 }
 private duration(phase:SignalPhase021):number{
  switch(phase){
   case "NS_GREEN":case "EW_GREEN":return this.plan.greenTicks;
   case "NS_AMBER":case "EW_AMBER":return this.plan.amberTicks;
   case "NS_CLEARANCE":case "EW_CLEARANCE":case "PED_ALL_RED":return this.plan.clearanceTicks;
   case "PED_WALK":return this.plan.walkTicks;
   case "PED_CLEARANCE":return this.plan.pedestrianClearanceTicks;
  }
 }
 advance021(vehicleOccupied:boolean):void{
  if(!this.plan.enabled)return;
  this.tick++;this.phaseTicks++;
  this.lastVehicleOccupied=vehicleOccupied;
  if(this.phaseTicks<this.duration(this.phase))return;
  // Safety wins over a nominal timer. No conflicting entry while
  // the last legally admitted vehicle or pedestrian occupies the junction.
  if((this.phase==="NS_CLEARANCE"||this.phase==="EW_CLEARANCE")&&vehicleOccupied)return;
  if((this.phase==="PED_CLEARANCE"||this.phase==="PED_ALL_RED")&&this.crossingOccupied021>0)return;
  let next:SignalPhase021;
  switch(this.phase){
   case "NS_GREEN":next="NS_AMBER";break;
   case "NS_AMBER":next="NS_CLEARANCE";break;
   case "NS_CLEARANCE":next="EW_GREEN";break;
   case "EW_GREEN":next="EW_AMBER";break;
   case "EW_AMBER":next="EW_CLEARANCE";break;
   case "EW_CLEARANCE":next=this.pendingPedestrian?"PED_WALK":"NS_GREEN";break;
   case "PED_WALK":next="PED_CLEARANCE";break;
   case "PED_CLEARANCE":next="PED_ALL_RED";break;
   case "PED_ALL_RED":next="NS_GREEN";break;
  }
  if(next==="PED_WALK")this.pendingPedestrian=false;
  this.phase=next;this.phaseTicks=0;
 }
 snapshot021():SignalSnapshot021{
  return {nodeId:this.plan.nodeId,tick:this.tick,phase:this.phase,
   ticksRemaining:Math.max(0,this.duration(this.phase)-this.phaseTicks),
   pedestrianDemand:this.pendingPedestrian,
   crossingOccupied:this.crossingOccupied021,vehicleOccupied:this.lastVehicleOccupied};
 }
}
