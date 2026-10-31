/** NH-SOLID-017 — geometry-only contact field for North Heights.
 * All 125 Sedans keep their NH012 simulation identity and existing visuals.
 * The contact solver is independent of the render LOD and Rapier character bodies.
 */
import {
  stage6BuildingBlockers,stage6RectanglesOverlap,stage6SolidBuildingCheck,
  type SedanStage6Pose,
} from "./nh-opt2-sedan-free-steering-stage6";
import type {BuildingSpec} from "@/game/world-generation/schema";

export const NH017_SEDAN_LENGTH=4.75;
export const NH017_SEDAN_WIDTH=1.85;
export type NH017Car=Readonly<{id:string;x:number;z:number;heading:number}>;
export type NH017Pole=Readonly<{x:number;z:number;radius:number}>;
export type NH017Point=Readonly<{x:number;z:number}>;
const CELL=12;
const key=(x:number,z:number)=>Math.floor(x/CELL)+":"+Math.floor(z/CELL);
const local=(p:NH017Point,pose:SedanStage6Pose)=>{
  const dx=p.x-pose.x,dz=p.z-pose.z,c=Math.cos(pose.heading),s=Math.sin(pose.heading);
  return {x:dx*c-dz*s,z:dx*s+dz*c};
};
export function nh017CircleOverlapsCar(
  center:NH017Point,radius:number,pose:SedanStage6Pose,
  length=NH017_SEDAN_LENGTH,width=NH017_SEDAN_WIDTH,
):boolean{
  const p=local(center,pose);
  const dx=Math.max(0,Math.abs(p.x)-width/2);
  const dz=Math.max(0,Math.abs(p.z)-length/2);
  return dx*dx+dz*dz<radius*radius;
}
export function nh017PersonInsideCar(
  p:NH017Point,car:NH017Car,radius=.35,
):boolean{return nh017CircleOverlapsCar(p,radius,car);}
export function createNorthHeightsSolidField017(args:{
  buildings:readonly BuildingSpec[];
  trees:readonly {x:number;z:number;size:number}[];
  lamps:readonly {x:number;z:number}[];
  cars:()=>readonly NH017Car[];
  people?:()=>readonly {x:number;z:number;state:string}[];
}){
  const buildingClear=stage6SolidBuildingCheck(stage6BuildingBlockers(args.buildings));
  const staticGrid=new Map<string,NH017Pole[]>();
  const register=(p:NH017Pole)=>{
    const bucket=staticGrid.get(key(p.x,p.z))??[];
    bucket.push(p);staticGrid.set(key(p.x,p.z),bucket);
  };
  // Trunks, not canopies; poles, not light cones.
  for(const tree of args.trees)register({x:tree.x,z:tree.z,
    radius:Math.max(.20,Math.min(.43,tree.size*.31))});
  for(const lamp of args.lamps)register({x:lamp.x,z:lamp.z,radius:.20});
  function isCarClear(pose:SedanStage6Pose,length:number,width:number,excludeId:string):boolean{
    if(!buildingClear(pose,length,width))return false;
    const extent=Math.hypot(length/2,width/2)+.6;
    const lowX=Math.floor((pose.x-extent)/CELL),highX=Math.floor((pose.x+extent)/CELL);
    const lowZ=Math.floor((pose.z-extent)/CELL),highZ=Math.floor((pose.z+extent)/CELL);
    for(let ix=lowX;ix<=highX;ix++)for(let iz=lowZ;iz<=highZ;iz++){
      for(const obstacle of staticGrid.get(ix+":"+iz)??[]){
        if(nh017CircleOverlapsCar(obstacle,obstacle.radius,pose,length,width))return false;
      }
    }
    const car={x:pose.x,z:pose.z,hw:width/2,hl:length/2,heading:pose.heading};
    for(const other of args.cars()){
      if(other.id===excludeId)continue;
      if(Math.hypot(other.x-pose.x,other.z-pose.z)>extent+3)continue;
      if(stage6RectanglesOverlap(car,{x:other.x,z:other.z,
        hw:NH017_SEDAN_WIDTH/2,hl:NH017_SEDAN_LENGTH/2,heading:other.heading}))return false;
    }
    // Pedestrians standing at crosswalks occupy real space too. A vehicle
    // must not move onto an NPC whose scripted route has yielded.
    for(const person of args.people?.()??[]){
      if(person.state==="inside")continue;
      if(Math.hypot(person.x-pose.x,person.z-pose.z)>extent+.5)continue;
      if(nh017CircleOverlapsCar(person,.34,pose,length,width))return false;
    }
    return true;
  }
  function personClear(p:NH017Point,radius=.35):boolean{
    for(const car of args.cars()){
      if(Math.hypot(car.x-p.x,car.z-p.z)>NH017_SEDAN_LENGTH/2+radius+1)continue;
      if(nh017PersonInsideCar(p,car,radius))return false;
    }
    return true;
  }
  return {isCarClear,personClear,staticCount:args.trees.length+args.lamps.length};
}
