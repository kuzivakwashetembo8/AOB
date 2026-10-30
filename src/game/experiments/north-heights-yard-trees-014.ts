/** NH-YARD-014 — context-aware owner-GLB tree planting on the accepted lawns.
 * Additive only: preserves the existing NH-004 park and roadside tree sites.
 * Building footprints, entry corridors, parking, roads and streetlamps remain clear.
 */
import type {BuildingSpec} from "@/game/world-generation/schema";
import {NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010} from "./north-heights-spatial-plan-010";
import {planNorthHeightsStreetLamps012} from "./north-heights-street-lamps-012";
import type {TreeLocation} from "./north-heights-trees-004";

type Ground=(x:number,z:number)=>number;
type Positioned={x:number;z:number};
const BLOCK_CENTRES=Array.from({length:10},(_,i)=>-288+64*i);
const code=(ix:number,iz:number)=>
  "NH-"+String(iz+1).padStart(2,"0")+"-"+String(ix+1).padStart(2,"0");
const random=(seed:number)=>{
  let state=seed>>>0;
  return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
};
const squareDistance=(a:Positioned,b:Positioned)=>(a.x-b.x)**2+(a.z-b.z)**2;
function insideBuildingWithBuffer(
  p:Positioned,building:BuildingSpec,clearance:number,
):boolean{
  const w=building.overrides?.width??12,d=building.overrides?.depth??12;
  return Math.abs(p.x-building.position.x)<w/2+clearance &&
    Math.abs(p.z-building.position.z)<d/2+clearance;
}
/** The +Z face of every building contains an open, unobstructed 3.2m doorway.
 * The planting design keeps a straight corridor from doorway to the lawn edge.
 */
function blocksEntrance(p:Positioned,building:BuildingSpec):boolean{
  const d=building.overrides?.depth??12;
  return Math.abs(p.x-building.position.x)<3.7 &&
    p.z>=building.position.z+d/2-.6;
}
export function planNorthHeightsYardTrees014(
  lots:readonly BuildingSpec[],
  existing:readonly TreeLocation[],
  ground:Ground,
  mobile:boolean,
):readonly TreeLocation[]{
  const rand=random(0x4e485931);
  const additions:TreeLocation[]=[];
  const lamps=planNorthHeightsStreetLamps012(existing);
  const buildingByBlock=new Map<string,BuildingSpec[]>();
  for(const lot of lots){
    // Lot identifier starts with the stable NH-XX-YY block code.
    const block=lot.id.slice(0,8);
    const group=buildingByBlock.get(block)??[];
    group.push(lot);buildingByBlock.set(block,group);
  }
  for(let iz=0;iz<10;iz++)for(let ix=0;ix<10;ix++){
    const block=code(ix,iz);
    if(NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010.has(block))continue;
    const buildings=buildingByBlock.get(block)??[];
    const x0=BLOCK_CENTRES[ix]!,z0=BLOCK_CENTRES[iz]!;
    const park=buildings.length===0;
    // More foliage around open parkland; occupied parcels need shorter
    // canopy clearances to leave usable building and doorway setbacks.
    const target=park?(mobile?6:9):mobile?4:7;
    let accepted=0;
    const candidates:Positioned[]=[];
    // Scrambled 7x7 irregular lattice; no brittle equal-spacing rows.
    for(let iz2=-3;iz2<=3;iz2++)for(let ix2=-3;ix2<=3;ix2++){
      const x=x0+ix2*7.1+(rand()-.5)*2.8;
      const z=z0+iz2*7.1+(rand()-.5)*2.8;
      candidates.push({x,z});
    }
    // Deterministic shuffle: visual randomness without a different forest
    // whenever the scene is reloaded on the same device.
    for(let i=candidates.length-1;i>0;i--){
      const j=Math.floor(rand()*(i+1));
      [candidates[i],candidates[j]]=[candidates[j]!,candidates[i]!];
    }
    for(const p of candidates){
      if(accepted>=target)break;
      // The edge of an NH-008 green parcel is 24.15m from its centre;
      // at least 7.85m is always left between the parcel and road centre.
      if(Math.abs(p.x-x0)>22.8||Math.abs(p.z-z0)>22.8)continue;
      // Trees need a clear trunk and crown, not just their 0.1m centre.
      if(buildings.some(b=>insideBuildingWithBuffer(p,b,2.35)||blocksEntrance(p,b)))
        continue;
      if(lamps.some(l=>squareDistance(p,l)<5**2))continue;
      if(existing.some(t=>squareDistance(p,t)<7.4**2))continue;
      if(additions.some(t=>squareDistance(p,t)<7.4**2))continue;
      const size=park?.75+rand()*.30:.68+rand()*.33;
      additions.push({x:p.x,y:ground(p.x,p.z),z:p.z,size,angle:rand()*Math.PI*2});
      accepted++;
    }
  }
  return additions;
}
