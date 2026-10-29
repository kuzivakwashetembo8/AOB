/** NH-LAMP-012 — deterministic, non-physical owner-GLB lighting for North Heights.
 * Both source GLBs are imported once, normalized from their authored units and
 * instanced as ONE draw per source mesh, not cloned per street corner.
 */
import {
  Color3, Matrix, Mesh, MeshBuilder, PointLight, Quaternion, Scene,
  SceneLoader, StandardMaterial, Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { NORTH_HEIGHTS_COORDS } from "@/game/world-generation/north-heights-location-009";
import { NORTH_HEIGHTS_PARKING_LOTS_010 } from "./north-heights-spatial-plan-010";
import type { NorthHeightsTime } from "./north-heights-sky-002";

export type NorthHeightsLampKind012 = "modern" | "medellin";
export interface NorthHeightsLampPlacement012 {
  id: string;
  kind: NorthHeightsLampKind012;
  x: number;
  z: number;
  towardX: number;
  towardZ: number;
  context: "road" | "junction" | "parking" | "park";
}
type Tree = {x:number;z:number};
const AXES = NORTH_HEIGHTS_COORDS;
const SOURCE:Record<NorthHeightsLampKind012,string> = {
  modern:"Modern Street Lamp.glb",
  medellin:"Medellin Street Lamp Optimized.glb",
};
const HEIGHT:Record<NorthHeightsLampKind012,number> = {
  modern:8.5, medellin:7.4,
};
const NO_TREES:readonly Tree[] = [];
/** Placement count: 220 NS + 110 EW + 11 corner + 6 parking + 12 park = 359. */
export function planNorthHeightsStreetLamps012(
  trees:readonly Tree[] = NO_TREES,
):readonly NorthHeightsLampPlacement012[] {
  const placements:NorthHeightsLampPlacement012[] = [];
  const closestTreeSquared=(x:number,z:number)=>{
    let distance=Number.POSITIVE_INFINITY;
    for(const tree of trees){
      const d=(tree.x-x)**2+(tree.z-z)**2;
      if(d<distance)distance=d;
    }
    return distance;
  };
  const add=(id:string,kind:NorthHeightsLampKind012,x:number,z:number,
    towardX:number,towardZ:number,context:NorthHeightsLampPlacement012["context"])=>{
    if(placements.some(other=>(other.x-x)**2+(other.z-z)**2<8.5**2))
      throw Error("NH-LAMP-012 conflicting placement: "+id);
    placements.push({id,kind,x,z,towardX,towardZ,context});
  };
  // Every north-south lane span gets two alternated verge lights, away from
  // crosswalk paint and from both 7.75m-wide paved curb envelopes.
  for(let xi=0;xi<11;xi++)for(let zi=0;zi<10;zi++)for(let lane=0;lane<2;lane++){
    const streetX=AXES[xi]!,segmentZ=AXES[zi]!;
    const startZ=segmentZ+(lane===0?18:46);
    const nominalSide=(xi+zi+lane)%2===0?1:-1;
    const candidates=[] as {x:number;z:number;side:number;tree:number}[];
    for(const side of [nominalSide,-nominalSide]){
      for(const shift of [0,-5,5,-8,8]){
        const x=streetX+side*9.3,z=startZ+shift;
        candidates.push({x,z,side,tree:closestTreeSquared(x,z)});
      }
    }
    const choice=candidates.find(c=>c.tree>=3.5**2) ??
      candidates.sort((a,b)=>b.tree-a.tree)[0]!;
    add("NH-L-N"+xi+"-"+zi+"-"+lane,
      xi>=4&&xi<=6?"modern":"medellin",choice.x,choice.z,
      -choice.side,0,"road");
  }
  // Mid-span lights cover all east-west roads without doubling their
  // crossroad density (the adjacent N/S lights also illuminate junctions).
  for(let zi=0;zi<11;zi++)for(let xi=0;xi<10;xi++){
    const x=AXES[xi]!+32,streetZ=AXES[zi]!;
    const nominal=(xi+zi)%2===0?1:-1;
    const options=[nominal,-nominal].flatMap(side=>
      [0,-6,6].map(shift=>({x:x+shift,z:streetZ+side*9.3,side})));
    const choice=options.find(c=>closestTreeSquared(c.x,c.z)>=3.5**2)??options[0]!;
    add("NH-L-E"+zi+"-"+xi,zi>=3&&zi<=7?"modern":"medellin",
      choice.x,choice.z,0,-choice.side,"road");
  }
  // The central avenue receives one dedicated lamp at each road junction,
  // with poles set beyond BOTH pavement edges; no pole sits on zebra paint.
  for(let zi=0;zi<11;zi++){
    const z=AXES[zi]!+(zi===10?-9.3:9.3);
    const options=[9.3,-9.3].flatMap(x=>[z,
      AXES[zi]!+(zi===0?9.3:-9.3)].map(zCandidate=>({x,z:zCandidate})));
    const selected=options.find(p=>!placements.some(other=>
      (other.x-p.x)**2+(other.z-p.z)**2<8.5**2));
    if(!selected)throw Error("NH-LAMP-012 junction lacks clearance "+zi);
    add("NH-L-J"+zi,"modern",selected.x,selected.z,
      selected.x>0?-1:1,0,"junction");
  }
  // Three additional lights per parking lot, on its boundary rather than
  // in the traffic drive aisle or an occupied parking stall.
  for(let i=0;i<NORTH_HEIGHTS_PARKING_LOTS_010.length;i++){
    const lot=NORTH_HEIGHTS_PARKING_LOTS_010[i]!;
    const offsets=[[-18,-22],[-18,22],[20,-5]] as const;
    for(let j=0;j<offsets.length;j++){
      const [dx,dz]=offsets[j]!;
      add("NH-L-P"+i+"-"+j,"modern",lot.x+dx,lot.z+dz,
        dx>0?-1:1,0,"parking");
    }
  }
  // Six spatially spread open-park parcels, with two perimeter lamps each.
  // Same deterministic vacant-block formula as the real reconstruction.
  const parks:{x:number;z:number}[]=[];
  for(let zi=0;zi<10;zi++)for(let xi=0;xi<10;xi++){
    if((xi*5+zi*7)%17===0||(zi===7&&xi===4)){
      const x=-288+64*xi,z=-288+64*zi;
      if(!NORTH_HEIGHTS_PARKING_LOTS_010.some(l=>Math.abs(l.x-x)<30&&Math.abs(l.z-z)<30))
        parks.push({x,z});
    }
  }
  if(parks.length<6)throw Error("NH-LAMP-012 missing park parcels");
  for(let i=0;i<6;i++)for(let j=0;j<2;j++){
    const park=parks[i]!;
    const candidates=(j===0
      ?[[-12,-12],[-12,12],[-10,-15],[-10,15]]
      :[[12,12],[12,-12],[10,15],[10,-15]]);
    const option=candidates.map(([dx,dz])=>({
      x:park.x+dx!,z:park.z+dz!,distance:closestTreeSquared(park.x+dx!,park.z+dz!),
    })).sort((a,b)=>b.distance-a.distance)[0]!;
    add("NH-L-G"+i+"-"+j,"medellin",option.x,option.z,
      j===0?-1:1,0,"park");
  }
  if(placements.length!==359)throw Error("NH-LAMP-012 incomplete city grid");
  return placements;
}

type Group = { kind:NorthHeightsLampKind012; templates:Mesh[]; placement:readonly NorthHeightsLampPlacement012[];
  localHead:{x:number;z:number}; height:number; };
export interface NorthHeightsLampRenderer012 {
  readonly total:number;
  readonly sources:number;
  update:(camera:Vector3,dt:number)=>void;
  setTime:(time:NorthHeightsTime)=>void;
  dispose:()=>void;
}

async function sourceGroup(scene:Scene,kind:NorthHeightsLampKind012,
  placements:readonly NorthHeightsLampPlacement012[]):Promise<Group> {
  // source GLBs use different native units and coordinate frames. Normalize
  // actual Babylon world vertices, not guessed root-node scale constants.
  const result=await SceneLoader.ImportMeshAsync("","/GLBs/Infrastructure/",SOURCE[kind],scene);
  const templates=result.meshes.filter(m=>m instanceof Mesh&&m.getTotalVertices()>0) as Mesh[];
  if(!templates.length)throw Error("NH-LAMP-012 GLB has no source geometry: "+SOURCE[kind]);
  let minY=Infinity,maxY=-Infinity;
  const vertices:{mesh:Mesh;data:ArrayLike<number>}[]=[];
  for(const mesh of templates){
    const world=mesh.computeWorldMatrix(true).clone();
    mesh.bakeTransformIntoVertices(world);
    mesh.parent=null;
    mesh.position.set(0,0,0);
    mesh.rotationQuaternion=null;
    mesh.rotation.set(0,0,0);
    mesh.scaling.set(1,1,1);
    const data=mesh.getVerticesData("position");
    if(!data)throw Error("NH-LAMP-012 missing source positions: "+SOURCE[kind]);
    vertices.push({mesh,data});
    for(let p=0;p<data.length;p+=3){
      minY=Math.min(minY,data[p+1]!);
      maxY=Math.max(maxY,data[p+1]!);
    }
  }
  const nativeHeight=maxY-minY;
  if(!(nativeHeight>.01))throw Error("NH-LAMP-012 zero-height source: "+SOURCE[kind]);
  let baseX=0,baseZ=0,baseCount=0,topX=0,topZ=0,topCount=0;
  for(const {data} of vertices)for(let p=0;p<data.length;p+=3){
    if(data[p+1]!<minY+nativeHeight*.07){
      baseX+=data[p]!;baseZ+=data[p+2]!;baseCount++;
    }
    if(data[p+1]!>maxY-nativeHeight*.15){
      topX+=data[p]!;topZ+=data[p+2]!;topCount++;
    }
  }
  if(!baseCount||!topCount)throw Error("NH-LAMP-012 unmeasurable lamp base/head");
  baseX/=baseCount;baseZ/=baseCount;topX/=topCount;topZ/=topCount;
  const scale=HEIGHT[kind]/nativeHeight;
  const norm=Matrix.Compose(new Vector3(scale,scale,scale),Quaternion.Identity(),
    new Vector3(-baseX*scale,-minY*scale,-baseZ*scale));
  for(const {mesh} of vertices){
    mesh.bakeTransformIntoVertices(norm);
    mesh.isPickable=false;
    mesh.receiveShadows=false;
    mesh.thinInstanceSetBuffer("matrix",new Float32Array(0),16,true);
  }
  // Determine arm orientation from the real top-vs-foot vertices; useful for
  // models authored with unconventional Sketchfab rotations.
  const dx=topX-baseX,dz=topZ-baseZ;
  const length=Math.hypot(dx,dz);
  const localHead=length>.001?{x:dx/length,z:dz/length}:{x:0,z:-1};
  console.info("[NH-LAMP-012] GLB normalized",{
    model:SOURCE[kind],sourceMeshes:templates.length,sourceHeight:nativeHeight,
    gameHeight:HEIGHT[kind],instances:placements.length,
  });
  return {kind,templates,placement:placements,localHead,height:HEIGHT[kind]};
}

export async function loadNorthHeightsStreetLamps012(
  scene:Scene,ground:(x:number,z:number)=>number,mobile:boolean,
  trees:readonly Tree[]=NO_TREES,
):Promise<NorthHeightsLampRenderer012>{
  const locations=planNorthHeightsStreetLamps012(trees);
  const groups:Group[]=[];
  try {
    for(const kind of ["modern","medellin"] as const)
      groups.push(await sourceGroup(scene,kind,locations.filter(p=>p.kind===kind)));
  } catch(error) {
    // A half-imported model must not leave behind hundreds of placeholders.
    for(const group of groups)for(const mesh of group.templates)mesh.dispose(false,true);
    throw error;
  }
  const glowMaterial=new StandardMaterial("nh012-lamp-bulb-emissive",scene);
  glowMaterial.disableLighting=true;
  glowMaterial.diffuseColor=new Color3(.94,.76,.40);
  glowMaterial.emissiveColor=new Color3(1,.74,.35);
  glowMaterial.specularColor=Color3.Black();
  const bulb=MeshBuilder.CreateSphere("nh012-glb-light-bulbs",{diameter:.35,segments:6},scene);
  bulb.material=glowMaterial;
  bulb.isPickable=false;
  bulb.thinInstanceSetBuffer("matrix",new Float32Array(0),16,true);
  const activeLights=Array.from({length:mobile?2:3},(_,i)=>{
    const light=new PointLight("nh012-local-streetlight-"+i,Vector3.Zero(),scene);
    light.diffuse=new Color3(1,.75,.43);
    light.specular=new Color3(.12,.10,.07);
    light.intensity=.95;
    light.range=18;
    light.setEnabled(false);
    return light;
  });
  let time:NorthHeightsTime="dusk",elapsed=999,disposed=false;
  const maxRadius=mobile?128:172;
  const refresh=(camera:Vector3)=>{
    if(disposed)return;
    const maxSquared=maxRadius**2;
    const visible:{pose:NorthHeightsLampPlacement012;height:number;distance:number}[]=[];
    for(const group of groups){
      const matrices:number[]=[];
      for(const p of group.placement){
        const d=(p.x-camera.x)**2+(p.z-camera.z)**2;
        if(d>maxSquared)continue;
        // Rotation maps the authored lamp arm towards its adjacent roadway.
        const authoredAngle=Math.atan2(group.localHead.x,group.localHead.z);
        const targetAngle=Math.atan2(p.towardX,p.towardZ);
        const yaw=targetAngle-authoredAngle;
        const m=Matrix.Compose(Vector3.One(),Quaternion.RotationAxis(Vector3.Up(),yaw),
          new Vector3(p.x,ground(p.x,p.z),p.z));
        matrices.push(...m.toArray());
        visible.push({pose:p,height:group.height,distance:d});
      }
      const buffer=new Float32Array(matrices);
      for(const mesh of group.templates){
        mesh.thinInstanceSetBuffer("matrix",buffer,16,true);
        mesh.thinInstanceRefreshBoundingInfo();
      }
    }
    const lighted=time!=="day";
    const bulbs:number[]=[];
    if(lighted){
      for(const {pose,height} of visible){
        const m=Matrix.Translation(pose.x,ground(pose.x,pose.z)+height-.28,pose.z);
        bulbs.push(...m.toArray());
      }
    }
    bulb.thinInstanceSetBuffer("matrix",new Float32Array(bulbs),16,true);
    bulb.thinInstanceRefreshBoundingInfo();
    visible.sort((a,b)=>a.distance-b.distance);
    for(let i=0;i<activeLights.length;i++){
      const light=activeLights[i]!,p=visible[i];
      light.setEnabled(lighted&&!!p);
      if(p)light.position.set(p.pose.x,ground(p.pose.x,p.pose.z)+p.height-.5,p.pose.z);
    }
  };
  return {
    total:locations.length,
    sources:groups.reduce((n,g)=>n+g.templates.length,0),
    update(camera,dt){
      elapsed+=dt;
      if(elapsed<.38)return;
      elapsed=0;
      refresh(camera);
    },
    setTime(next){time=next;elapsed=999;},
    dispose(){
      if(disposed)return;
      disposed=true;
      activeLights.forEach(light=>light.dispose());
      bulb.dispose(false,true);
      glowMaterial.dispose();
      for(const group of groups)for(const mesh of group.templates)mesh.dispose(false,true);
    },
  };
}
