/**
 * TREE-PLACE-001: deterministic urban forestry for the First Light ground slice.
 * Pure plan: no Babylon/Rapier, no asset loading, no global random state.
 */
import type { CitySpec, ResolvedBuildingSpec, WorldPosition } from "./schema";
import type { StreetContextItem } from "./street-context";
import { resolveCityBuildings } from "./defaults";
import { featureRandom } from "./seeded-variation";
import { planTreeCanopy } from "./tree-canopy";

export type ForestryZoneKind = "architecture" | "woodland" | "corridor";
export type ForestryBudget = 0 | 6 | 12 | 18 | 24 | 30 | 36;
export const FORESTRY_BUDGETS = [0, 6, 12, 18, 24, 30, 36] as const;
export type ForestryDensityFocus = "balanced" | "mercer-open-side";
export const FIRST_LIGHT_FORESTRY_BOUNDS = {
  left: -80, right: 80, north: -45, south: 85,
} as const;

export interface ForestryTree {
  readonly item: StreetContextItem;
  readonly zoneId: string;
  readonly zoneKind: ForestryZoneKind;
  readonly canopyRadius: number;
}
export interface ForestryRoute {
  readonly id: string;
  readonly from: WorldPosition;
  readonly to: WorldPosition;
  readonly status: "connected" | "unresolved";
  readonly reason: string;
}
export interface ForestryPlan {
  readonly generated: readonly ForestryTree[];
  readonly allAccepted: readonly ForestryTree[];
  readonly authoredTreeCount: number;
  readonly attempted: number;
  readonly rejected: Readonly<Record<string, number>>;
  readonly perZone: Readonly<Record<ForestryZoneKind, number>>;
  readonly routes: readonly ForestryRoute[];
  readonly budget: ForestryBudget;
  readonly estimate: {readonly meshes:number;readonly cards:number;readonly colliders:number};
  readonly focus:ForestryDensityFocus;
  readonly selectedOpenSideCount:number;
  readonly selectedOtherCount:number;
}
type Point = Pick<WorldPosition, "x" | "z">;
type Bounds = {readonly left:number;readonly right:number;readonly north:number;readonly south:number};
type Candidate = {
  readonly zoneId: string; readonly zoneKind: ForestryZoneKind;
  readonly index: number; readonly position: WorldPosition;
  readonly rating: number;
};
type Road = { readonly a:Point;readonly b:Point;readonly radius:number };
type Blocker = {readonly position:Point;readonly radius:number; readonly kind:string};
type Terrain = {
  readonly buildings:readonly ResolvedBuildingSpec[];
  readonly roads:readonly Road[];
  readonly intersections:readonly Blocker[];
  readonly items:readonly StreetContextItem[];
  readonly bounds:Bounds;
};

export function parseForestryBudget(value:string|null): ForestryBudget {
  return value==="6"?6:value==="12"?12:value==="18"?18:value==="24"?24:value==="30"?30:value==="36"?36:6;
}
const xz=(x:number,z:number):WorldPosition=>({x,y:0,z});
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
const rng=(city:CitySpec,key:string)=>featureRandom(city.id,city.generatorVersion,"tree-place-001:"+key);
function distanceToSegment(p:Point,a:Point,b:Point,extra=0):number {
  const dx=b.x-a.x,dz=b.z-a.z, len=Math.hypot(dx,dz);
  if(len<1e-8)return distance(p,a);
  const t=Math.max(-extra/len,Math.min(1+extra/len,
    ((p.x-a.x)*dx+(p.z-a.z)*dz)/(len*len)));
  return distance(p,{x:a.x+t*dx,z:a.z+t*dz});
}
function distanceToBuilding(p:Point,b:ResolvedBuildingSpec):number {
  const dx=p.x-b.position.x,dz=p.z-b.position.z;
  const c=Math.cos(b.yawRadians),s=Math.sin(b.yawRadians);
  const localX=c*dx+s*dz,localZ=-s*dx+c*dz;
  return Math.hypot(
    Math.max(0,Math.abs(localX)-b.parameters.width/2),
    Math.max(0,Math.abs(localZ)-b.parameters.depth/2),
  );
}
function createTerrain(city:CitySpec,items:readonly StreetContextItem[],bounds:Bounds):Terrain {
  const nodes=new Map(city.roads.nodes.map(n=>[n.id,n.position] as const));
  const roads:Road[]=[];
  for(const road of city.roads.segments){
    const a=nodes.get(road.startNodeId),b=nodes.get(road.endNodeId);
    if(!a||!b)continue;
    // The sidewalk is a protected circulation surface, not plantable grass.
    roads.push({a,b,radius:road.width/2+road.sidewalkWidth+0.8});
  }
  const intersections:Blocker[]=city.roads.intersections.flatMap(i=>{
    const center=nodes.get(i.nodeId);
    const widest=Math.max(0,...city.roads.segments.filter(s=>i.connectedSegmentIds.includes(s.id))
      .map(s=>s.width/2+s.sidewalkWidth));
    return center?[{position:center,radius:widest+1.5,kind:"intersection"}]:[];
  });
  return {roads,intersections,buildings:resolveCityBuildings(city),items,bounds};
}
export interface ForestryClearance {
  readonly accepted:boolean; readonly reason:string; readonly freeDistance:number;
}
/** Broad-phase rejection and exact rotated-building / segment clearances. */
function clearPosition(p:Point,canopyRadius:number,terrain:Terrain,
  accepted:readonly ForestryTree[],ignoreTrees=false): ForestryClearance {
  const b=terrain.bounds;
  if(p.x<b.left+canopyRadius+0.6||p.x>b.right-canopyRadius-0.6||
     p.z<b.north+canopyRadius+0.6||p.z>b.south-canopyRadius-0.6)
    return {accepted:false,reason:"world-boundary",freeDistance:0};
  let free=100;
  for(const road of terrain.roads){
    const d=distanceToSegment(p,road.a,road.b,12)-road.radius;
    if(d<0.55)return {accepted:false,reason:"road-or-sidewalk",freeDistance:d};
    free=Math.min(free,d);
  }
  for(const junction of terrain.intersections){
    const d=distance(p,junction.position)-junction.radius;
    if(d<0.55)return {accepted:false,reason:"junction",freeDistance:d};
    free=Math.min(free,d);
  }
  for(const building of terrain.buildings){
    const d=distanceToBuilding(p,building);
    // Do not embed the canopy in a wall or podium; conservatively leave a
    // small air gap around actual facade and massing.
    if(d<canopyRadius+0.65)
      return {accepted:false,reason:"facade-canopy",freeDistance:d};
    free=Math.min(free,d-canopyRadius);
    for(const anchor of building.anchors??[]){
      // Garage/door approach must remain open even if the trunk itself clears.
      const dA=distance(p,anchor.position);
      const r=anchor.kind==="garage-entrance"?8.5:4;
      if(dA<r+0.65)return {accepted:false,reason:"portal-access",freeDistance:dA};
    }
  }
  // Protect First Light player/garage-spawn circulation without inventing paths.
  if(distance(p,{x:-7.5,z:2.45})<6.5)
    return {accepted:false,reason:"spawn-clearance",freeDistance:0};
  for(const item of terrain.items){
    const d=distance(p,item.position);
    const r=item.kind==="tree"?canopyRadius+2.6:
      item.kind==="parked-car"?4.0:item.kind==="streetlight"?3.0:
      item.kind==="bench"||item.kind==="bin"?2.5:2.0;
    if(d<r)return {accepted:false,reason:"authored-"+item.kind,freeDistance:d};
  }
  if(!ignoreTrees)for(const other of accepted){
    const d=distance(p,other.item.position);
    // Moderate gaps: silhouettes can coexist, trunks stay separated.
    if(d<Math.max(6.2,(canopyRadius+other.canopyRadius)*0.76))
      return {accepted:false,reason:"generated-tree-spacing",freeDistance:d};
  }
  return {accepted:true,reason:"clear",freeDistance:free};
}
function makeCandidate(city:CitySpec,c:Candidate):ForestryTree {
  const id="tree-place-001:"+c.zoneId+":"+c.index.toString().padStart(2,"0");
  const scale=0.94+rng(city,id+":scale")*0.16;
  const canopyScale=1.08+rng(city,id+":canopy")*0.20;
  const item:StreetContextItem={
    id,kind:"tree",seed:id,position:c.position,
    yawRadians:rng(city,id+":yaw")*Math.PI*2,scale,canopyScale,
  };
  return {item,zoneId:c.zoneId,zoneKind:c.zoneKind,
    canopyRadius:planTreeCanopy(item,city.generatorVersion).radius};
}
function architectureCandidates(city:CitySpec,terrain:Terrain):Candidate[]{
  const result:Candidate[]=[];
  for(const building of [...terrain.buildings].sort((a,b)=>a.id.localeCompare(b.id))){
    const w=building.parameters.width/2,d=building.parameters.depth/2;
    const yaw=building.yawRadians,c=Math.cos(yaw),s=Math.sin(yaw);
    const tower=building.parameters.floors>=6;
    const sides=[
      {key:"west",nx:-1,nz:0},{key:"east",nx:1,nz:0},
      {key:"north",nx:0,nz:-1},{key:"south",nx:0,nz:1},
    ];
    for(const side of sides)for(let i=0;i<3;i++){
      const key=building.id+":"+side.key+":"+i;
      const offset=(i-1)*0.32+(rng(city,key+":along")-0.5)*0.13;
      const outward=4.9+(rng(city,key+":radial")-0.5)*1.3;
      const lx=side.nx?(w+outward)*side.nx:offset*w*1.7;
      const lz=side.nz?(d+outward)*side.nz:offset*d*1.7;
      result.push({zoneId:"architecture:"+building.id+":"+side.key,
        zoneKind:"architecture",index:i,
        position:xz(building.position.x+c*lx-s*lz,building.position.z+s*lx+c*lz),
        rating:(tower?4:2)+rng(city,key+":rank")});
    }
  }
  return result.sort((a,b)=>b.rating-a.rating||a.zoneId.localeCompare(b.zoneId)||a.index-b.index);
}
function woodlandCandidates(city:CitySpec,terrain:Terrain,routes:readonly ForestryRoute[]):Candidate[]{
  // Inspect a fixed-size spatial lattice; infer the four broad planting zones
  // from vacant ground, never from painted screenshot positions.
  const quadrants=new Map<string,{point:Point;rating:number}>();
  const middleX=(terrain.bounds.left+terrain.bounds.right)/2;
  const middleZ=(terrain.bounds.north+terrain.bounds.south)/2;
  for(let x=terrain.bounds.left+7;x<=terrain.bounds.right-7;x+=4){
    for(let z=terrain.bounds.north+7;z<=terrain.bounds.south-7;z+=4){
      const point={x:x+(rng(city,"grid:"+x+":"+z+":x")-0.5)*1.4,
        z:z+(rng(city,"grid:"+x+":"+z+":z")-0.5)*1.4};
      const status=clearPosition(point,4.1,terrain,[],true);
      if(!status.accepted)continue;
      const distanceToUrban=Math.min(70,...terrain.buildings.map(b=>distanceToBuilding(point,b)));
      // Prefer park-sized spaces near the urban footprint, with sufficient
      // open radius and varied regional coverage.
      const rating=Math.min(18,status.freeDistance)+
        Math.max(0,15-Math.abs(distanceToUrban-19))*0.28+
        rng(city,"grid:"+x+":"+z+":rank")*1.5;
      const quadrant=(x<middleX?"west":"east")+":"+(z<middleZ?"front":"rear");
      const current=quadrants.get(quadrant);
      if(!current||rating>current.rating)quadrants.set(quadrant,{point,rating});
    }
  }
  const results:Candidate[]=[];
  for(const [name,anchor]of [...quadrants].sort((a,b)=>a[0].localeCompare(b[0]))){
    const seed="woodland:"+name;
    for(let i=0;i<16;i++){
      // First two candidates close to the anchor, later candidates generate
      // irregular woodland groupings without mandatory dense fill.
      const angle=(i*2.39996323)+rng(city,seed+":angle")*1.8;
      const radius= i===0?0: i<5?4.1+1.5*rng(city,seed+":inner:"+i):
        5.9+7*rng(city,seed+":outer:"+i);
      results.push({zoneKind:"woodland",zoneId:seed,index:i,
        position:xz(anchor.point.x+Math.cos(angle)*radius,
          anchor.point.z+Math.sin(angle)*radius),
        rating:anchor.rating-(i*0.06)});
    }
  }
  results.sort((a,b)=>a.index-b.index||a.zoneId.localeCompare(b.zoneId));
  // Each feasible outward tower connector can end at an organically formed
  // woodland pocket; the pocket position is derived from the route geometry,
  // never traced from an annotated screenshot.
  const outlets:Candidate[]=[];
  for(const route of routes.filter(r=>r.status==="connected")){
    const inward=route.to.x<route.from.x?1:-1;
    const angles=[-8,8,-4,4,-11,11];
    angles.forEach((zOffset,i)=>{
      outlets.push({zoneKind:"woodland",zoneId:"woodland:outlet:"+route.id,
        index:i,position:xz(
          route.to.x+inward*(1.1+rng(city,route.id+":inward:"+i)*1.2),
          route.to.z+zOffset+(rng(city,route.id+":z:"+i)-0.5)*0.9),
        rating:8-i*0.1});
    });
  }
  // Give the user's foreground open lawn a visible grove before filling both
  // connector endpoints; then continue with other geometrically found pockets.
  return [
    ...results.slice(0,2),
    ...outlets.filter(x=>x.index===0),
    ...outlets.filter(x=>x.index===1),
    ...results.slice(2),
    ...outlets.filter(x=>x.index>1),
  ];
}
function corridorCandidates(city:CitySpec,terrain:Terrain):
  {candidates:Candidate[];routes:ForestryRoute[]}{
  const candidates:Candidate[]=[];const routes:ForestryRoute[]=[];
  const mid=(terrain.bounds.left+terrain.bounds.right)/2;
  for(const tower of [...terrain.buildings].filter(b=>b.parameters.floors>=6)
    .sort((a,b)=>a.id.localeCompare(b.id))){
    // The towers stand by horizontal city roads. Side/rear corridors should
    // lead laterally outward, preserving road mouths and an open central lane.
    const side=tower.position.x<mid?-1:1;
    const endpointX=side<0?terrain.bounds.left+7:terrain.bounds.right-7;
    const startX=tower.position.x+side*(tower.parameters.width/2+4.3);
    const from=xz(startX,tower.position.z),to=xz(endpointX,tower.position.z);
    const routeId="corridor:"+tower.id+":outer";
    const length=distance(from,to),steps=Math.max(1,Math.ceil(length/2));
    let feasible=length>=4;
    for(let i=0;i<=steps&&feasible;i++){
      const alpha=i/steps,p={x:from.x+(to.x-from.x)*alpha,z:from.z};
      // A route's central 2.5-metre pedestrian strip is protected; canopy
      // may overhang it, but trunks cannot occupy its center.
      feasible=clearPosition(p,1.25,terrain,[],true).accepted;
    }
    routes.push({id:routeId,from,to,status:feasible?"connected":"unresolved",
      reason:feasible?"protected grass route to outward pocket":
        "insufficient unobstructed grass route, corridor candidates skipped"});
    if(!feasible)continue;
    for(let i=0;i<6;i++){
      const alpha=(i+0.65)/6;
      const x=from.x+(to.x-from.x)*alpha;
      const z=from.z+(i%2===0?1:-1)*(3.8+rng(city,routeId+":side:"+i)*2);
      candidates.push({zoneKind:"corridor",zoneId:routeId,index:i,
        position:xz(x,z),rating:5-i*0.1});
    }
  }
  return {candidates,routes};
}

/** Determine the exposed direction from the garage and its closest street,
 * rather than baking camera-relative tree coordinates into the algorithm.
 * For the current First Light data this resolves to the open northern lawn.
 */
function mercerOpenSide(city:CitySpec,terrain:Terrain):{
  garage:Point; normal:Point; tangent:Point; minAlong:number; maxAlong:number
}|null{
  const garage=terrain.buildings.find(b=>b.id==="sw-fl-garage");
  if(!garage)return null;
  const streets=city.roads.segments.filter(x=>/Mercer Street/i.test(x.name));
  const nodes=new Map(city.roads.nodes.map(x=>[x.id,x.position] as const));
  const segments=streets.flatMap(street=>{
    const a=nodes.get(street.startNodeId),b=nodes.get(street.endNodeId);
    return a&&b?[{a,b,dist:distanceToSegment(garage.position,a,b)}]:[];
  }).sort((a,b)=>a.dist-b.dist);
  const street=segments[0];
  if(!street)return null;
  const dx=street.b.x-street.a.x,dz=street.b.z-street.a.z;
  const len=Math.hypot(dx,dz);
  if(len<1)return null;
  const tangent={x:dx/len,z:dz/len};
  const a=street.a;
  const t=Math.max(0,Math.min(1,
    ((garage.position.x-a.x)*dx+(garage.position.z-a.z)*dz)/(len*len)));
  const nearest={x:a.x+t*dx,z:a.z+t*dz};
  const side={x:garage.position.x-nearest.x,z:garage.position.z-nearest.z};
  const sideLen=Math.hypot(side.x,side.z);
  if(sideLen<0.01)return null;
  const normal={x:side.x/sideLen,z:side.z/sideLen};
  const corners=[
    {x:terrain.bounds.left,z:terrain.bounds.north},
    {x:terrain.bounds.right,z:terrain.bounds.north},
    {x:terrain.bounds.left,z:terrain.bounds.south},
    {x:terrain.bounds.right,z:terrain.bounds.south},
  ];
  const projections=corners.map(p=>
    (p.x-garage.position.x)*tangent.x+(p.z-garage.position.z)*tangent.z);
  return {garage:garage.position,normal,tangent,
    minAlong:Math.min(...projections),maxAlong:Math.max(...projections)};
}
function openSideDepth(p:Point,frame:NonNullable<ReturnType<typeof mercerOpenSide>>):number{
  return (p.x-frame.garage.x)*frame.normal.x+
    (p.z-frame.garage.z)*frame.normal.z;
}
function onOpenSide(p:Point,frame:NonNullable<ReturnType<typeof mercerOpenSide>>):boolean{
  return openSideDepth(p,frame)>=8.0;
}
/** Cluster centres are selected dynamically from clear open grass in five
 * longitudinal bands, then scattered with stable spiral + jitter samples.
 * No coordinates are copied from screenshots and no new 3D model is used.
 */
function mercerWoodlandCandidates(
  city:CitySpec,terrain:Terrain,frame:NonNullable<ReturnType<typeof mercerOpenSide>>,
):Candidate[]{
  const bands=5;
  const best=new Map<number,{p:Point;score:number}>();
  const total=frame.maxAlong-frame.minAlong;
  for(let x=terrain.bounds.left+7;x<=terrain.bounds.right-7;x+=3.7){
    for(let z=terrain.bounds.north+7;z<=terrain.bounds.south-7;z+=3.7){
      const key="mercer-open-grid:"+x.toFixed(2)+":"+z.toFixed(2);
      const p={x:x+(rng(city,key+":x")-0.5)*2.0,
        z:z+(rng(city,key+":z")-0.5)*2.0};
      const depth=openSideDepth(p,frame);
      if(depth<14||depth>32)continue;
      const clear=clearPosition(p,4.2,terrain,[],true);
      if(!clear.accepted)continue;
      const along=(p.x-frame.garage.x)*frame.tangent.x+
        (p.z-frame.garage.z)*frame.tangent.z;
      const band=Math.max(0,Math.min(bands-1,
        Math.floor((along-frame.minAlong)/total*bands)));
      // Open grass near the built environment grades into a woodland edge.
      // Mid-depth centroids keep room for trees both toward and away from it.
      const score=9-Math.abs(depth-23)*0.85+
        Math.min(12,clear.freeDistance)*0.18+rng(city,key+":rank");
      const old=best.get(band);
      if(!old||score>old.score)best.set(band,{p,score});
    }
  }
  const result:Candidate[]=[];
  for(const [band,anchor]of [...best].sort((a,b)=>a[0]-b[0])){
    const zoneId="woodland:mercer-open-side:"+band;
    for(let i=0;i<25;i++){
      const key=zoneId+":"+i;
      const theta=i*2.399963229728653+
        rng(city,key+":theta")*0.68;
      const radius=i===0?0:5.05*Math.sqrt(i)*(0.82+rng(city,key+":radial")*0.25);
      const p={x:anchor.p.x+Math.cos(theta)*radius,
        z:anchor.p.z+Math.sin(theta)*radius};
      // Exclude all of Mercer Street's opposite side from this grove.
      if(!onOpenSide(p,frame))continue;
      result.push({
        zoneId,zoneKind:"woodland",index:i,
        position:xz(p.x,p.z),rating:anchor.score-i*0.07,
      });
    }
  }
  // Round-robin bands maintains irregular woodland mass across the
  // entire open side rather than saturating a single endpoint.
  const grouped=[...best.keys()].sort((a,b)=>a-b).map(band=>
    result.filter(x=>x.zoneId==="woodland:mercer-open-side:"+band));
  const interleaved:Candidate[]=[];
  for(let i=0;i<25;i++)for(const group of grouped){
    const c=group.find(x=>x.index===i);
    if(c)interleaved.push(c);
  }
  return interleaved;
}
function balancedSupplementCandidates(
  city:CitySpec,terrain:Terrain,routes:readonly ForestryRoute[],
  frame:NonNullable<ReturnType<typeof mercerOpenSide>>,
):Candidate[]{
  const all=[
    ...architectureCandidates(city,terrain),
    ...woodlandCandidates(city,terrain,routes),
  ];
  // Only occasional integration away from the featured lawn. Reject
  // candidates that would turn the rest of the ward into a perimeter forest.
  return all.filter(c=>!onOpenSide(c.position,frame));
}
function focusedDensityCandidates(
  city:CitySpec,terrain:Terrain,routes:readonly ForestryRoute[],
):Candidate[]{
  const frame=mercerOpenSide(city,terrain);
  if(!frame)return [];
  const open=mercerWoodlandCandidates(city,terrain,frame);
  const side=balancedSupplementCandidates(city,terrain,routes,frame);
  // Four front-grove candidates per one occasional urban tree. This ratio
  // is tested on accepted positions as well, not assumed from candidate mix.
  const result:Candidate[]=[];
  let a=0,b=0;
  while(a<open.length||b<side.length){
    for(let j=0;j<4&&a<open.length;j++)result.push(open[a++]!);
    if(b<side.length)result.push(side[b++]!);
  }
  return result;
}

function interleave(groups:Readonly<Record<ForestryZoneKind,readonly Candidate[]>>):Candidate[]{
  const result:Candidate[]=[],indexes={architecture:0,woodland:0,corridor:0};
  // A stable composition rhythm: pockets, architecture and connectors each
  // contribute before further density is allowed, if feasible.
  const rhythm:ForestryZoneKind[]=[
    "woodland","architecture","corridor","woodland","architecture","corridor",
  ];
  let exhausted=0;
  while(result.length<220&&exhausted<rhythm.length){
    for(const kind of rhythm){
      const next=groups[kind][indexes[kind]++];
      if(next){result.push(next);exhausted=0;}
      else exhausted++;
    }
  }
  return result;
}

export function planUrbanForestry(
  city:CitySpec,
  existingItems:readonly StreetContextItem[],
  budget:ForestryBudget=6,
  bounds:Bounds=FIRST_LIGHT_FORESTRY_BOUNDS,
  focus:ForestryDensityFocus="balanced",
):ForestryPlan {
  if(!FORESTRY_BUDGETS.includes(budget))throw new Error("Unrecognized TREE-PLACE-001 budget");
  const terrain=createTerrain(city,existingItems,bounds);
  const {candidates:connectors,routes}=corridorCandidates(city,terrain);
  const candidates=focus==="mercer-open-side"
    ?focusedDensityCandidates(city,terrain,routes)
    :interleave({
      woodland:woodlandCandidates(city,terrain,routes),
      architecture:architectureCandidates(city,terrain),
      corridor:connectors,
    });
  const accepted:ForestryTree[]=[],rejected:Record<string,number>={};
  const perZone:Record<ForestryZoneKind,number>={
    architecture:0,woodland:0,corridor:0,
  };
  let attempted=0;
  for(const candidate of candidates){
    if(accepted.length>= (focus==="mercer-open-side"?36:24))break;
    const tree=makeCandidate(city,candidate);
    const status=clearPosition(tree.item.position,tree.canopyRadius,terrain,accepted);
    attempted++;
    if(!status.accepted){
      rejected[status.reason]=(rejected[status.reason]??0)+1;
      continue;
    }
    // Hard category limit protects open grass and avoids any one zone becoming
    // an uninterrupted thicket.
    const cap=focus==="mercer-open-side"
      ?candidate.zoneKind==="woodland"?33:4
      :candidate.zoneKind==="woodland"?12:
        candidate.zoneKind==="architecture"?10:7;
    if(perZone[candidate.zoneKind]>=cap){
      rejected["zone-cap"]=(rejected["zone-cap"]??0)+1;
      continue;
    }
    accepted.push(tree);
    perZone[candidate.zoneKind]++;
  }
  const selected=accepted.slice(0,budget);
  const selectedPerZone:Record<ForestryZoneKind,number>={
    architecture:0,woodland:0,corridor:0,
  };
  for(const tree of selected)selectedPerZone[tree.zoneKind]++;
  const focusFrame=focus==="mercer-open-side"?mercerOpenSide(city,terrain):null;
  const focusCount=focusFrame?selected.filter(t=>onOpenSide(t.item.position,focusFrame)).length:0;
  return {
    generated:selected,allAccepted:accepted,
    authoredTreeCount:existingItems.filter(x=>x.kind==="tree").length,
    attempted,rejected,perZone:selectedPerZone,routes,budget,
    estimate:{meshes:selected.length*35,cards:selected.length*30,colliders:selected.length},
    focus,selectedOpenSideCount:focusCount,selectedOtherCount:selected.length-focusCount,
  };
}
