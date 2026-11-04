/** NH-SOLID-017 — geometry-only contact field for North Heights.
 * All 125 Sedans keep their NH012 simulation identity and existing visuals.
 * The contact solver is independent of the render LOD and Rapier character bodies.
 */
import {
  stage6BuildingBlockers,stage6SolidBuildingCheck,
  type SedanStage6Pose,
} from "./nh-opt2-sedan-free-steering-stage6";
import type {BuildingSpec} from "@/game/world-generation/schema";

export const NH017_SEDAN_LENGTH=4.75;
export const NH017_SEDAN_WIDTH=1.85;
export type NH017Car=Readonly<{id:string;x:number;z:number;heading:number}>;
export type NH017Pole=Readonly<{x:number;z:number;radius:number}>;
export type NH017Point=Readonly<{x:number;z:number}>;
/** Narrow-phase SAT uses the actual local Sedan silhouette. Unlike a simple
 * box, its corners follow the bumper, bonnet and rear body outline. */
const rectangularHull=(length:number,width:number):readonly NH017Point[]=>[
 {x:-width/2,z:-length/2},{x:width/2,z:-length/2},
 {x:width/2,z:length/2},{x:-width/2,z:length/2},
];
export function nh018WorldHull(localHull:readonly NH017Point[],p:SedanStage6Pose):NH017Point[]{
 const c=Math.cos(p.heading),s=Math.sin(p.heading);
 return localHull.map(q=>({x:p.x+c*q.x+s*q.z,z:p.z-s*q.x+c*q.z}));
}
export function nh018PolygonsOverlap(a:readonly NH017Point[],b:readonly NH017Point[]):boolean{
 for(const polygon of [a,b]){
   for(let i=0;i<polygon.length;i++){
     const p=polygon[i]!,q=polygon[(i+1)%polygon.length]!;
     const nx=-(q.z-p.z),nz=q.x-p.x;
     let amin=Infinity,amax=-Infinity,bmin=Infinity,bmax=-Infinity;
     for(const v of a){const dot=v.x*nx+v.z*nz;amin=Math.min(amin,dot);amax=Math.max(amax,dot);}
     for(const v of b){const dot=v.x*nx+v.z*nz;bmin=Math.min(bmin,dot);bmax=Math.max(bmax,dot);}
     if(amax<=bmin||bmax<=amin)return false;
   }
 }
 return true;
}
export function nh018CircleOverlapsHull(
 p:NH017Point,radius:number,polygon:readonly NH017Point[],
):boolean{
 // Ray casting for the interior, edge-distance for the curved contact surface.
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
   const a=polygon[j]!,b=polygon[i]!;
   if((a.z>p.z)!==(b.z>p.z)&&
     p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)inside=!inside;
 }
 if(inside)return true;
 for(let i=0;i<polygon.length;i++){
   const a=polygon[i]!,b=polygon[(i+1)%polygon.length]!;
   const dx=b.x-a.x,dz=b.z-a.z;
   const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));
   if(Math.hypot(p.x-(a.x+dx*t),p.z-(a.z+dz*t))<radius)return true;
 }
 return false;
}
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
  player?:()=>NH017Point|null;
  sedanHull?:readonly NH017Point[];
}){
  const buildingClear=stage6SolidBuildingCheck(stage6BuildingBlockers(args.buildings));
  const carHull=args.sedanHull??rectangularHull(NH017_SEDAN_LENGTH,NH017_SEDAN_WIDTH);
  const actualRadius=Math.max(...carHull.map(p=>Math.hypot(p.x,p.z)));
  const carWorld=(p:SedanStage6Pose)=>nh018WorldHull(carHull,p);
  const staticGrid=new Map<string,NH017Pole[]>();
  const register=(p:NH017Pole)=>{
    const bucket=staticGrid.get(key(p.x,p.z))??[];
    bucket.push(p);staticGrid.set(key(p.x,p.z),bucket);
  };
  // Trunks, not canopies; poles, not light cones.
  for(const tree of args.trees)register({x:tree.x,z:tree.z,
    radius:Math.max(.20,Math.min(.43,tree.size*.31))});
  let lampPolesActive=false;
  // Lighting assets load after the first playable frame. Do not install
  // invisible vehicle barriers for poles whose GLBs failed to load.
  function activateLampPoles(){
    if(lampPolesActive)return;
    lampPolesActive=true;
    for(const lamp of args.lamps)register({x:lamp.x,z:lamp.z,radius:.20});
  }
  function isCarClear(pose:SedanStage6Pose,length:number,width:number,excludeId:string):boolean{
    if(!buildingClear(pose,length,width))return false;
    const outline=carWorld(pose);
    const extent=Math.max(Math.hypot(length/2,width/2),actualRadius)+.6;
    const lowX=Math.floor((pose.x-extent)/CELL),highX=Math.floor((pose.x+extent)/CELL);
    const lowZ=Math.floor((pose.z-extent)/CELL),highZ=Math.floor((pose.z+extent)/CELL);
    for(let ix=lowX;ix<=highX;ix++)for(let iz=lowZ;iz<=highZ;iz++){
      for(const obstacle of staticGrid.get(ix+":"+iz)??[]){
        if(nh018CircleOverlapsHull(obstacle,obstacle.radius,outline))return false;
      }
    }
    for(const other of args.cars()){
      if(other.id===excludeId)continue;
      if(Math.hypot(other.x-pose.x,other.z-pose.z)>extent+actualRadius)continue;
      if(nh018PolygonsOverlap(outline,carWorld(other)))return false;
    }
    // The same solid chassis must not be driven ONTO a stationary Voight.
    // Kinematic Rapier actors alone cannot push two kinematic bodies apart.
    const player=args.player?.();
    if(player&&Math.hypot(player.x-pose.x,player.z-pose.z)<extent+.5&&
      nh018CircleOverlapsHull(player,.38,outline))return false;
    // Pedestrians standing at crosswalks occupy real space too. A vehicle
    // must not move onto an NPC whose scripted route has yielded.
    for(const person of args.people?.()??[]){
      if(person.state==="inside")continue;
      if(Math.hypot(person.x-pose.x,person.z-pose.z)>extent+.5)continue;
      if(nh018CircleOverlapsHull(person,.34,outline))return false;
    }
    return true;
  }
  function personClear(p:NH017Point,radius=.35):boolean{
    // The visible solid tree trunks and loaded streetlamp poles are obstacles.
    for(let ix=Math.floor((p.x-radius-1)/CELL);ix<=Math.floor((p.x+radius+1)/CELL);ix++)
      for(let iz=Math.floor((p.z-radius-1)/CELL);iz<=Math.floor((p.z+radius+1)/CELL);iz++)
        for(const pole of staticGrid.get(ix+":"+iz)??[])
          if(Math.hypot(p.x-pole.x,p.z-pole.z)<radius+pole.radius)return false;
    for(const car of args.cars()){
      if(Math.hypot(car.x-p.x,car.z-p.z)>NH017_SEDAN_LENGTH/2+radius+1)continue;
      if(nh018CircleOverlapsHull(p,radius,carWorld(car)))return false;
    }
    return true;
  }
  /** Minimum-penetration separating axis; points from the moving car toward
   * the struck car. Enables a mass/restitution impulse, not a visual shake. */
  function impactNormal(a:readonly NH017Point[],b:readonly NH017Point[],
    dx:number,dz:number):{nx:number;nz:number}{
    let depth=Infinity,nx=0,nz=1;
    for(const polygon of [a,b])for(let i=0;i<polygon.length;i++){
      const p=polygon[i]!,q=polygon[(i+1)%polygon.length]!;
      const ex=q.x-p.x,ez=q.z-p.z,l=Math.hypot(ex,ez)||1;
      const tx=-ez/l,tz=ex/l;
      let amin=Infinity,amax=-Infinity,bmin=Infinity,bmax=-Infinity;
      for(const v of a){const d=v.x*tx+v.z*tz;amin=Math.min(amin,d);amax=Math.max(amax,d);}
      for(const v of b){const d=v.x*tx+v.z*tz;bmin=Math.min(bmin,d);bmax=Math.max(bmax,d);}
      const overlap=Math.min(amax,bmax)-Math.max(amin,bmin);
      if(overlap<depth){depth=overlap;const sign=tx*dx+tz*dz>=0?1:-1;nx=tx*sign;nz=tz*sign;}
    }
    return {nx,nz};
  }
  /** Identify impacted traffic, leaving tree, lamp and wall contact static. */
  function carImpactAt(pose:SedanStage6Pose,excludeId:string):(NH017Car&{nx:number;nz:number})|null{
    const outline=carWorld(pose);
    for(const other of args.cars()){
      if(other.id===excludeId)continue;
      if(Math.hypot(other.x-pose.x,other.z-pose.z)>actualRadius*2)continue;
      const otherHull=carWorld(other);
      if(nh018PolygonsOverlap(outline,otherHull)){
        const normal=impactNormal(outline,otherHull,other.x-pose.x,other.z-pose.z);
        return {...other,...normal};
      }
    }
    return null;
  }
  return {isCarClear,carImpactAt,personClear,activateLampPoles,
    get staticCount(){return args.trees.length+(lampPolesActive?args.lamps.length:0);}};
}
