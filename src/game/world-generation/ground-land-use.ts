import type {CitySpec, BuildingSpec, WorldPosition} from "./schema";

export const LAND_FINISHES = ["PAV-01","PAV-02","PAV-03","PAV-04","PRK-01","PRK-02","SRV-01",
  "GRN-01","GRN-02","GRN-03","GRD-01","WTR-01","WTR-02"] as const;
export type LandFinish = typeof LAND_FINISHES[number];
export interface LandBounds { readonly left:number; readonly right:number; readonly north:number; readonly south:number }
export interface WaterBasin { readonly kind:"WTR-01"|"WTR-02"; readonly x:number; readonly z:number;
  readonly rx:number; readonly rz:number; readonly depth:number; readonly waterY:number }
export interface GroundLandPlan {
  readonly bounds:LandBounds;
  readonly width:number;
  readonly height:number;
  readonly kinds:Uint8Array;
  readonly counts:Record<LandFinish,number>;
  readonly basins:readonly WaterBasin[];
  sample(x:number,z:number):LandFinish|null;
}
type Road = {a:WorldPosition;b:WorldPosition;width:number;sidewalk:number};
type Lot={b:BuildingSpec;width:number;depth:number;kind:string};
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
function hash(s:string){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
const variant=(x:number,z:number,scale:number,version:number)=>
  hash(version+":"+Math.floor(x/scale)+":"+Math.floor(z/scale))/4294967296;
function closestPoint(x:number,z:number,r:Road):number{
  const dx=r.b.x-r.a.x,dz=r.b.z-r.a.z,d=dx*dx+dz*dz;
  const t=d>0?clamp(((x-r.a.x)*dx+(z-r.a.z)*dz)/d,0,1):0;
  return Math.hypot(x-(r.a.x+t*dx),z-(r.a.z+t*dz));
}
function local(l:Lot,x:number,z:number){
  const dx=x-l.b.position.x,dz=z-l.b.position.z,c=Math.cos(l.b.yawRadians),s=Math.sin(l.b.yawRadians);
  return {x:dx*c-dz*s,z:dx*s+dz*c};
}
function distanceToBuilding(l:Lot,x:number,z:number):number{
  const q=local(l,x,z);
  return Math.hypot(Math.max(0,Math.abs(q.x)-l.width/2),Math.max(0,Math.abs(q.z)-l.depth/2));
}
function toEdge(p:WorldPosition,dx:number,dz:number,b:LandBounds):WorldPosition{
  const tests=[
    dx>0?(b.right-p.x)/dx:dx<0?(b.left-p.x)/dx:Infinity,
    dz>0?(b.south-p.z)/dz:dz<0?(b.north-p.z)/dz:Infinity,
  ].filter(t=>t>0&&Number.isFinite(t));
  const t=Math.min(...tests);
  return Number.isFinite(t)?{x:p.x+dx*t,z:p.z+dz*t,y:p.y}:p;
}
/** Open terminal road nodes are projected to the physical slice boundary.
 * Junction nodes (degree >1) never move. Planning projection is visual only.
 */
function roadSegments(city:CitySpec,bounds:LandBounds):Road[]{
  const nodes=new Map(city.roads.nodes.map(n=>[n.id,n.position] as const));
  const degree=new Map<string,number>();
  for(const s of city.roads.segments){
    degree.set(s.startNodeId,(degree.get(s.startNodeId)??0)+1);
    degree.set(s.endNodeId,(degree.get(s.endNodeId)??0)+1);
  }
  return city.roads.segments.flatMap(s=>{
    const a=nodes.get(s.startNodeId),b=nodes.get(s.endNodeId);
    if(!a||!b)return [];
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);
    if(len<0.01)return [];
    return [{a:(degree.get(s.startNodeId)===1?toEdge(a,-dx/len,-dz/len,bounds):a),
      b:(degree.get(s.endNodeId)===1?toEdge(b,dx/len,dz/len,bounds):b),
      width:s.width,sidewalk:s.sidewalkWidth}];
  });
}
const WATER_SITES = [
  {kind:"WTR-01" as const,rx:6.8,rz:4.8,depth:1.55,waterY:-0.13,targetX:-56,targetZ:-27,minRoad:14,minBuilding:17},
  {kind:"WTR-02" as const,rx:10.5,rz:2.0,depth:0,waterY:0,targetX:58,targetZ:72,minRoad:10,minBuilding:10},
] as const;
export function pondHeight(basin:WaterBasin,x:number,z:number):number{
  if(basin.depth<=0)return 0;
  const radius=Math.hypot((x-basin.x)/basin.rx,(z-basin.z)/basin.rz);
  // Sloped bank starts before the visible waterline; center reaches 1.55m.
  const t=clamp((1-radius)/0.54,0,1);
  return -basin.depth*(t*t*(3-2*t));
}
export function planGroundLandUse(city:CitySpec,bounds:LandBounds):GroundLandPlan{
  const width=Math.ceil(bounds.right-bounds.left),height=Math.ceil(bounds.south-bounds.north);
  if(!Object.values(bounds).every(Number.isFinite)||width<=0||height<=0||width*height>750000)
    throw Error("GROUND-003: invalid or excessive ground bounds");
  const roads=roadSegments(city,bounds);
  const blocks=city.districts.flatMap(d=>d.neighborhoods.flatMap(n=>n.blocks));
  const lots:Lot[]=blocks.flatMap(block=>block.lots.flatMap(l=>{
    if(!l.building)return [];
    const b=l.building;
    return [{b,width:b.overrides?.width??l.width-2,depth:b.overrides?.depth??l.depth-2,kind:b.archetype}];
  }));
  const parks=blocks.flatMap(b=>b.publicSpaces??[]);
  const kinds=new Uint8Array(width*height),index=(k:LandFinish)=>LAND_FINISHES.indexOf(k);
  const field: {x:number;z:number;rd:number;bd:number;park:boolean}[]=[];
  const measures=(x:number,z:number)=>{
    let rd=Infinity,bd=Infinity,nearest:Lot|null=null,nearestRoad:Road|null=null;
    for(const r of roads){const d=closestPoint(x,z,r);if(d<rd){rd=d;nearestRoad=r;}}
    for(const l of lots){const d=distanceToBuilding(l,x,z);if(d<bd){bd=d;nearest=l;}}
    const park=parks.some(p=>Math.abs(x-p.position.x)<=p.width/2+0.3&&
      Math.abs(z-p.position.z)<=p.depth/2+0.3);
    const edge=nearestRoad?rd-nearestRoad.width/2-nearestRoad.sidewalk:Infinity;
    return {rd,bd,nearest,park,edge};
  };
  for(let j=0;j<height;j++)for(let i=0;i<width;i++){
    const x=bounds.left+i+.5,z=bounds.north+j+.5,m=measures(x,z);
    const n=variant(x,z,10,city.generatorVersion),patch=variant(x,z,24,city.generatorVersion);
    const lot=m.nearest,q=lot?local(lot,x,z):null;
    const service=lot&&["industrial","garage","warehouse"].includes(lot.kind);
    const business=lot&&["commercial","office","mixed-use","podium-tower"].includes(lot.kind);
    const residential=lot&&lot.kind==="residential";
    let kind:LandFinish="PAV-01";
    // Strict priority: active road envelope, occupied footprint, real entrance,
    // drivable forecourt, parking/service > landscaped residual.
    if(m.edge<0||m.bd<0.3)kind="PAV-01";
    else if(lot&&q&&q.z>lot.depth/2-1&&q.z<lot.depth/2+13&&Math.abs(q.x)<3)
      kind=service?"PAV-04":m.bd<4?"PAV-03":"PAV-02";
    else if(service&&m.bd<18&&q&&q.z>lot.depth/2-2)
      kind=m.bd<9?"SRV-01":patch<0.2?"GRD-01":"SRV-01";
    else if(business&&m.bd<23&&q&&q.z>lot.depth/2-2&&m.edge>1.5)
      kind=m.bd<4?"PAV-03":m.bd<17?(patch<0.15?"PRK-02":"PRK-01"):"PAV-01";
    else if(lot&&m.bd<20&&m.edge>=2&&patch<0.21)
      kind="PRK-02";
    else if(m.park)kind=n<0.15?"GRN-03":"GRN-01";
    else if(m.edge<2.1)kind="PAV-01";
    else if(residential&&m.bd<16)
      kind=n<0.34?"GRN-01":n<0.43?"GRN-03":"PAV-01";
    else if(lot&&m.bd<23)
      kind=n<0.24?"GRN-01":n<0.3?"GRN-03":n<0.37?"GRD-01":"PAV-01";
    else kind=n<0.34?"GRN-01":n<0.40?"GRN-03":n<0.47?"GRD-01":"PAV-01";
    kinds[j*width+i]=index(kind);
    field.push({x,z,rd:m.rd,bd:m.bd,park:m.park});
  }
  const basins:WaterBasin[]=[];
  for(const site of WATER_SITES){
    let chosen:{x:number;z:number}|null=null,score=Infinity;
    // Candidate basin must fit in physical ground and remain clear *across* the
    // perimeter. No pond center chosen merely because one point is clear.
    for(let z=Math.ceil(bounds.north+site.rz+3);z<bounds.south-site.rz-3;z+=2)
      for(let x=Math.ceil(bounds.left+site.rx+3);x<bounds.right-site.rx-3;x+=2){
        const center=measures(x,z);
        if(center.park||center.bd<site.minBuilding||center.rd<site.minRoad)continue;
        let clear=true;
        for(let k=0;k<16;k++){
          const a=k*Math.PI/8,m=measures(x+site.rx*Math.cos(a),z+site.rz*Math.sin(a));
          if(m.park||m.bd<6||m.rd<6){clear=false;break;}
        }
        if(!clear)continue;
        const rank=Math.hypot(x-site.targetX,z-site.targetZ);
        if(rank<score){score=rank;chosen={x,z};}
      }
    if(!chosen)continue;
    const basin:WaterBasin={kind:site.kind,x:chosen.x,z:chosen.z,rx:site.rx,rz:site.rz,
      depth:site.depth,waterY:site.waterY};
    // A retention garden is low wetland, not a torso-deep lake.
    if(site.kind==="WTR-01")basins.push(basin);
    for(let j=0;j<height;j++)for(let i=0;i<width;i++){
      const x=bounds.left+i+.5,z=bounds.north+j+.5;
      const r=Math.hypot((x-basin.x)/basin.rx,(z-basin.z)/basin.rz);
      if(r>=1)continue;
      const k=j*width+i;
      kinds[k]=index(r>0.85?"GRN-02":site.kind);
    }
  }
  const counts=Object.fromEntries(LAND_FINISHES.map(k=>[k,0])) as Record<LandFinish,number>;
  for(const value of kinds)counts[LAND_FINISHES[value]!]++;
  return {bounds,width,height,kinds,counts,basins,sample(x,z){
    const i=Math.floor(x-bounds.left),j=Math.floor(z-bounds.north);
    if(i<0||j<0||i>=width||j>=height)return null;
    return LAND_FINISHES[kinds[j*width+i]!]??null;
  }};
}
