import type {CitySpec, BuildingSpec, WorldPosition} from "./schema";

export const LAND_FINISHES = ["PAV-01","PAV-02","PAV-03","PAV-04","PRK-01","PRK-02","SRV-01",
  "GRN-01","GRN-02","GRN-03","GRD-01","WTR-01","WTR-02"] as const;
export type LandFinish = typeof LAND_FINISHES[number];
export interface LandBounds { left:number; right:number; north:number; south:number }
export interface GroundLandPlan { bounds:LandBounds; width:number; height:number; kinds:Uint8Array;
  counts:Record<LandFinish,number>; sample(x:number,z:number):LandFinish|null }
type Road = {a:WorldPosition;b:WorldPosition;width:number;sidewalk:number};
type Lot={b:BuildingSpec;width:number;depth:number;kind:string};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
function hash(s:string){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
const variant=(x:number,z:number,scale:number,version:number)=>
  hash(version+":"+Math.floor(x/scale)+":"+Math.floor(z/scale))/4294967296;
function roadDistance(x:number,z:number,r:Road):number{
  const dx=r.b.x-r.a.x,dz=r.b.z-r.a.z,t=(dx*dx+dz*dz);
  const a=t>0?clamp(((x-r.a.x)*dx+(z-r.a.z)*dz)/t,0,1):0;
  return Math.hypot(x-(r.a.x+a*dx),z-(r.a.z+a*dz));
}
function local(l:Lot,x:number,z:number){
  const dx=x-l.b.position.x,dz=z-l.b.position.z;
  const c=Math.cos(l.b.yawRadians),s=Math.sin(l.b.yawRadians);
  return {x:dx*c-dz*s,z:dx*s+dz*c};
}
function buildingDistance(l:Lot,x:number,z:number){
  const q=local(l,x,z);
  return Math.hypot(Math.max(0,Math.abs(q.x)-l.width/2),
    Math.max(0,Math.abs(q.z)-l.depth/2));
}
/** Semantic land occupancy on the real finite First Light ground, not new city geography. */
export function planGroundLandUse(city:CitySpec,bounds:LandBounds):GroundLandPlan{
  const width=Math.ceil(bounds.right-bounds.left),height=Math.ceil(bounds.south-bounds.north);
  if(!Object.values(bounds).every(Number.isFinite)||width<=0||height<=0||width*height>750000)
    throw Error("GROUND-001: invalid or excessive ground bounds");
  const nodes=new Map(city.roads.nodes.map(n=>[n.id,n.position] as const));
  const roads:Road[]=city.roads.segments.flatMap(s=>{
    const a=nodes.get(s.startNodeId),b=nodes.get(s.endNodeId);
    return a&&b?[{a,b,width:s.width,sidewalk:s.sidewalkWidth}]:[];
  });
  const blocks=city.districts.flatMap(d=>d.neighborhoods.flatMap(n=>n.blocks));
  const lots:Lot[]=blocks.flatMap(bl=>bl.lots.flatMap(l=>{
    if(!l.building)return [];
    const b=l.building;
    return [{b,width:b.overrides?.width??l.width-2,depth:b.overrides?.depth??l.depth-2,kind:b.archetype}];
  }));
  const parks=blocks.flatMap(b=>b.publicSpaces??[]);
  const kinds=new Uint8Array(width*height);
  const extra: Array<{x:number;z:number;bd:number;rd:number;park:boolean}> = [];
  const index=(k:LandFinish)=>LAND_FINISHES.indexOf(k);
  for(let iz=0;iz<height;iz++)for(let ix=0;ix<width;ix++){
    const x=bounds.left+ix+.5,z=bounds.north+iz+.5;
    let rd=Infinity,road:Road|null=null,bd=Infinity,lot:Lot|null=null;
    for(const r of roads){const d=roadDistance(x,z,r);if(d<rd){rd=d;road=r}}
    for(const l of lots){const d=buildingDistance(l,x,z);if(d<bd){bd=d;lot=l}}
    const park=parks.some(p=>Math.abs(x-p.position.x)<=p.width/2+.3 &&
      Math.abs(z-p.position.z)<=p.depth/2+.3);
    const n=variant(x,z,13,city.generatorVersion),m=variant(x,z,27,city.generatorVersion);
    const q=lot?local(lot,x,z):null,edge=road?rd-road.width/2-road.sidewalk:Infinity;
    let kind:LandFinish="GRN-01";
    if(park)kind="GRN-01";
    else if(edge<0||bd<.3)kind="PAV-01"; // Protected road and building tops drawn separately.
    else if(lot&&q&&q.z>lot.depth/2-1&&q.z<lot.depth/2+12&&Math.abs(q.x)<2.5)
      kind=lot.kind==="garage"||lot.kind==="industrial"?"PAV-04":bd<3?"PAV-03":"PAV-02";
    else if(edge<1.6)kind=n<.45?"GRN-02":"PAV-01";
    else if(lot&&["industrial","garage","warehouse"].includes(lot.kind)&&bd<15&&q&&q.z>lot.depth/2)
      kind=bd<6?"SRV-01":m<.55?"GRD-01":"SRV-01";
    else if(lot&&["commercial","office","mixed-use"].includes(lot.kind)&&bd<18&&q&&q.z>lot.depth/2)
      kind=bd<4?"PAV-03":m<.24?"PRK-02":"PRK-01";
    else if(lot&&lot.kind==="residential"&&bd<17)
      kind=n<.18?"GRN-03":m<.16?"PAV-01":"GRN-01";
    else if(lot&&bd<22&&edge<7&&m<.22)kind="PRK-02";
    else kind=n<.12?"GRN-03":m<.18?"PAV-01":m<.3?"GRD-01":"GRN-01";
    const i=iz*width+ix;kinds[i]=index(kind);extra[i]={x,z,bd,rd,park};
  }
  // Select controlled retention basins from clear unoccupied land, not random roadside puddles.
  const water:readonly [LandFinish,number,number,number,number][]=[
    ["WTR-01",6,4,19,16],["WTR-02",11,1.4,14,12]];
  for(const [kind,rx,rz,minB,minR] of water){
    let choice=-1,score=-Infinity;
    for(let z=6;z<height-6;z+=3)for(let x=6;x<width-6;x+=3){
      const i=z*width+x,f=extra[i]!;
      if(f.park||f.bd<minB||f.rd<minR)continue;
      const rating=kind==="WTR-01"?(1-x/width)+(1-z/height):x/width+z/height;
      if(rating>score){score=rating;choice=i}
    }
    if(choice<0)continue;
    const cx=choice%width,cz=Math.floor(choice/width);
    for(let z=Math.max(0,Math.floor(cz-rz-1));z<Math.min(height,cz+rz+2);z++)
      for(let x=Math.max(0,Math.floor(cx-rx-1));x<Math.min(width,cx+rx+2);x++){
        const ring=((x-cx)/rx)**2+((z-cz)/rz)**2,i=z*width+x,f=extra[i]!;
        if(ring>1||f.park||f.bd<minB/2||f.rd<minR/2)continue;
        kinds[i]=index(ring>.7?"GRN-02":kind);
      }
  }
  const counts=Object.fromEntries(LAND_FINISHES.map(k=>[k,0])) as Record<LandFinish,number>;
  for(const kind of kinds)counts[LAND_FINISHES[kind]!]++;
  return {bounds,width,height,kinds,counts,sample(x,z){
    const ix=Math.floor(x-bounds.left),iz=Math.floor(z-bounds.north);
    if(ix<0||iz<0||ix>=width||iz>=height)return null;
    return LAND_FINISHES[kinds[iz*width+ix]!]??null;
  }};
}
