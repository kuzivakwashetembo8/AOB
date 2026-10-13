/** WORLD-003: seeded material land-use infill from ANY CitySpec.
 * One surface-classification policy for South Ward and future generated cities.
 * No manually authored x/z parking or lawn rectangles.
 */
import {featureRandom} from "./seeded-variation";
import type {CitySpec, LotSpec, WorldPosition} from "./schema";

export type ParcelFinish="pavement"|"parking"|"grass";
export interface ParcelInfillCell {
 readonly x:number;readonly z:number;readonly width:number;
 readonly finish:ParcelFinish;readonly seed:string;
}
export const INFILL_CELL_METRES=5;
const distanceToSegment=(x:number,z:number,a:WorldPosition,b:WorldPosition)=>{
 const dx=b.x-a.x,dz=b.z-a.z,len=dx*dx+dz*dz;
 const t=len>1e-8?Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/len)):0;
 return Math.hypot(x-a.x-t*dx,z-a.z-t*dz);
};
function allLots(city:CitySpec):readonly LotSpec[]{
 return city.districts.flatMap(d=>d.neighborhoods.flatMap(n=>
   n.blocks.flatMap(b=>b.lots)));
}
export function planParcelInfill(city:CitySpec):readonly ParcelInfillCell[]{
 const lots=allLots(city);
 const nodes=new Map(city.roads.nodes.map(n=>[n.id,n.position] as const));
 const anchors=[...city.roads.nodes.map(n=>n.position),...lots.map(l=>l.position)];
 if(!anchors.length)return [];
 const left=Math.min(...anchors.map(p=>p.x))-20;
 const right=Math.max(...anchors.map(p=>p.x))+20;
 const near=Math.min(...anchors.map(p=>p.z))-20;
 const far=Math.max(...anchors.map(p=>p.z))+20;
 const cell=INFILL_CELL_METRES;
 const minX=Math.floor(left/cell)*cell;
 const maxX=Math.ceil(right/cell)*cell;
 const minZ=Math.floor(near/cell)*cell;
 const maxZ=Math.ceil(far/cell)*cell;
 const connections=city.roads.segments.flatMap(s=>{
   const a=nodes.get(s.startNodeId),b=nodes.get(s.endNodeId);
   return a&&b?[{a,b,sidewalk:s.sidewalkWidth,road:s.width}]:[];
 });
 const version=city.generatorVersion;
 const cells:ParcelInfillCell[]=[];
 for(let ix=minX;ix<maxX;ix+=cell)for(let iz=minZ;iz<maxZ;iz+=cell){
   const x=ix+cell/2,z=iz+cell/2;
   const nearest=lots.map(lot=>({
     lot, distance:Math.hypot(
       Math.max(0,Math.abs(x-lot.position.x)-lot.width/2),
       Math.max(0,Math.abs(z-lot.position.z)-lot.depth/2),
     ),
   })).sort((a,b)=>a.distance-b.distance)[0];
   const nearbyRoad=connections.some(s=>
     distanceToSegment(x,z,s.a,s.b)<s.road/2+s.sidewalk+cell/2);
   const zoneX=Math.floor(x/15),zoneZ=Math.floor(z/15);
   const key=`${city.id}:parcel:${zoneX}:${zoneZ}`;
   const sample=featureRandom(key,version,"infill:land-use");
   let finish:ParcelFinish="grass";
   if(nearest&&nearest.distance<20){
     const archetype=nearest.lot.building?.archetype??"residential";
     const industrial=archetype==="industrial"||archetype==="garage";
     const commercial=archetype==="commercial"||archetype==="office";
     const parkingThreshold=industrial?0.48:commercial?0.32:0.16;
     const grassThreshold=industrial?0.07:commercial?0.18:0.37;
     finish=sample<parkingThreshold?"parking":
       sample<parkingThreshold+grassThreshold?"grass":"pavement";
     // Door approaches and narrow gaps should not be arbitrary grass.
     if(nearest.distance<2.5&&nearbyRoad)finish="pavement";
   } else finish=sample<0.76?"grass":"pavement";
   cells.push({x,z,width:cell,finish,seed:key});
 }
 return cells;
}
