/** GTD-TREE-019 — the owner-authored 3D leaves.glb, installed ONCE as a
 * shared GLB container then distributed across the existing deterministic
 * city-tree canopy centres. TREE-021 densely interlocks 54 new crown sprays around ten retained outer sprays.
 * No new trees, trunks, colliders, textures or lots.
 *
 * GLB provenance: public/GLBs/Nature/leaves.glb, Git blob
 * bae1b8731940915e7d55ebb399021058eaa1710c
 * last committed f86f7270d633ea6bcb63b6a6175e270bb307cc22.
 */
import {AbstractMesh,Mesh,TransformNode,loadAssetContainerAsync} from "@babylonjs/core";
import type {Scene,AssetContainer} from "@babylonjs/core";
import {planTreeCanopy} from "./tree-canopy";
import {featureRandom} from "./seeded-variation";
import type {StreetContextItem} from "./street-context";

export const AUTHORED_3D_LEAVES_PATH="/GLBs/Nature/leaves.glb";
export const AUTHORED_3D_LEAVES_GIT_BLOB="bae1b8731940915e7d55ebb399021058eaa1710c";
// TREE-021: 64 overlapping groups of the SAME owner-authored leaves.glb
// per tree. More visible foliage, not extra GLB downloads or new tree trunks.
export const LEAVES_019_OUTER_GROUPS_PER_TREE=10;
export const LEAVES_019_INNER_GROUPS_PER_TREE=54;
export const LEAVES_019_GROUPS_PER_TREE=
  LEAVES_019_OUTER_GROUPS_PER_TREE+LEAVES_019_INNER_GROUPS_PER_TREE;

export interface DenseFoliageGroup020 {
  readonly x:number; readonly y:number; readonly z:number;
  readonly yaw:number; readonly size:number;
}
/** 10 accepted perimeter centres plus 54 interlocking leaf crowns distributed
 * in three radii/heights, eliminating empty spaces near branch/trunk joints.
 * Clusters are deterministic for each tree seed and generator version.
 */
export function planDenseFoliageGroups020(
 tree:Pick<StreetContextItem,"scale"|"canopyScale"|"seed">,
 version:number,
):readonly DenseFoliageGroup020[] {
 const cards=planTreeCanopy(tree,version).cards;
 if(cards.length!==30)throw Error("TREE-021 fallback plan must stay at 30 cards");
 const groups:DenseFoliageGroup020[]=[];
 for(let k=0;k<10;k++){
  const c=cards[k*3]!;
  groups.push({x:c.x,y:c.y,z:c.z,yaw:c.yaw,size:1.12});
 }
 // Lower inner ring fills the formerly disconnected trunk tips, the middle
 // and upper rings provide a thick crown silhouette, not sparse branch tips.
 const bands=[
  {count:18,rMin:.38,rMax:1.22,yMin:4.64,yMax:5.38,size:1.12},
  {count:20,rMin:.87,rMax:1.90,yMin:5.04,yMax:5.91,size:1.20},
  {count:16,rMin:1.12,rMax:2.08,yMin:5.65,yMax:6.28,size:1.12},
 ] as const;
 let index=0;
 for(const band of bands){
  for(let k=0;k<band.count;k++,index++){
   const rnd=(key:string)=>featureRandom(tree.seed,version,"tree021:"+index+":"+key);
   const angle=2*Math.PI*(k+rnd("offset")*.52)/band.count +
     (index%2===0?0:.21);
   const radius=band.rMin+(band.rMax-band.rMin)*rnd("radius");
   groups.push({
    x:Math.cos(angle)*radius,
    y:band.yMin+(band.yMax-band.yMin)*rnd("height"),
    z:Math.sin(angle)*radius,
    yaw:angle+rnd("yaw")*.4,
    size:band.size*(.95+.15*rnd("scale")),
   });
  }
 }
 return groups;
}
export interface TreeFoliageSlot019{
  readonly item:StreetContextItem;
  readonly generatorVersion:number;
  readonly root:TransformNode;
  readonly cards:readonly Mesh[];
}
export interface AppliedFoliage019{
  readonly importedLeaves:number;
  readonly groups:number;
  dispose():void;
}
function includedMeshes(roots:readonly TransformNode[]):AbstractMesh[]{
  const results=new Set<AbstractMesh>();
  for(const root of roots){
    if(root instanceof AbstractMesh)results.add(root);
    for(const mesh of root.getChildMeshes(false))results.add(mesh);
  }
  return [...results].filter(m=>m.getTotalVertices()>0);
}
function modelEnvelope(roots:readonly TransformNode[]):{
  center:{x:number;y:number;z:number};maxDimension:number;vertical:number;
}{
  const meshes=includedMeshes(roots);
  if(!meshes.length)throw Error("TREE-019: leaves.glb has no 3D render geometry");
  let xmin=Infinity,ymin=Infinity,zmin=Infinity,
    xmax=-Infinity,ymax=-Infinity,zmax=-Infinity;
  for(const mesh of meshes){
    mesh.computeWorldMatrix(true);
    const b=mesh.getBoundingInfo().boundingBox;
    xmin=Math.min(xmin,b.minimumWorld.x);
    xmax=Math.max(xmax,b.maximumWorld.x);
    ymin=Math.min(ymin,b.minimumWorld.y);
    ymax=Math.max(ymax,b.maximumWorld.y);
    zmin=Math.min(zmin,b.minimumWorld.z);
    zmax=Math.max(zmax,b.maximumWorld.z);
  }
  const dx=xmax-xmin,dy=ymax-ymin,dz=zmax-zmin;
  if(![dx,dy,dz].every(Number.isFinite)||
     Math.max(dx,dy,dz)<.00001||Math.max(dx,dy,dz)>100000)
    throw Error("TREE-019: invalid original GLB bounds");
  return {
    center:{x:(xmin+xmax)/2,y:(ymin+ymax)/2,z:(zmin+zmax)/2},
    maxDimension:Math.max(dx,dz,.01),vertical:Math.max(.01,dy),
  };
}

export async function applyAuthoredLeaves019(
  scene:Scene,
  slots:readonly TreeFoliageSlot019[],
  options:{
    readonly cancelled?:()=>boolean;
    readonly load?:()=>Promise<AssetContainer>;
  }={},
):Promise<AppliedFoliage019>{
  if(!slots.length)return {importedLeaves:0,groups:0,dispose(){}};
  if(!options.load)await import("@babylonjs/loaders/glTF");
  if(options.cancelled?.())return {importedLeaves:0,groups:0,dispose(){}};
  const asset=await (options.load?options.load():loadAssetContainerAsync(
    AUTHORED_3D_LEAVES_PATH,scene));
  const created:TransformNode[]=[];
  const instances:ReturnType<AssetContainer["instantiateModelsToScene"]>[]=[];
  let installed=0,groups=0,closed=false;
  const clear=()=>{
    if(closed)return;
    closed=true;
    for(const instance of instances)instance.dispose();
    for(const node of created)node.dispose();
    asset.dispose();
  };
  try{
    // Source model is read-only. Instantiations share GLB mesh geometry and
    // imported materials; not one GLB GET per tree or per crown spray.
    let envelope:ReturnType<typeof modelEnvelope>|null=null;
    for(const tree of slots){
      if(options.cancelled?.())break;
      const centres=planDenseFoliageGroups020(tree.item,tree.generatorVersion);
      if(centres.length!==LEAVES_019_GROUPS_PER_TREE)
        throw Error("TREE-020 dense canopy group count mismatch");
      for(let k=0;k<LEAVES_019_GROUPS_PER_TREE;k++){
        if(options.cancelled?.())break;
        const cluster=centres[k]!;
        const instance=asset.instantiateModelsToScene(
          name=>"leaves019:"+tree.item.id+":"+k+":"+name,false);
        instances.push(instance);
        if(!envelope)envelope=modelEnvelope(instance.rootNodes as TransformNode[]);
        const crown=new TransformNode("leaves019-crown:"+tree.item.id+":"+k,scene);
        crown.parent=tree.root;
        crown.position.set(cluster.x,cluster.y,cluster.z);
        crown.rotation.y=cluster.yaw;
        created.push(crown);
        const normalized=new TransformNode(
          "leaves019-source-fit:"+tree.item.id+":"+k,scene);
        normalized.parent=crown;
        created.push(normalized);
        // Ten perimeter sprays, then 54 interlocking inner/upper sprays near the
        // trunk tip. The original source remains 3D and uniformly scaled.
        // No additional downloads, trees, colliders or texture materials.
        const ratio=cluster.size*Math.min(
          2.05/envelope.maxDimension,1.40/envelope.vertical,100);
        normalized.scaling.setAll(ratio);
        normalized.position.set(
          -envelope.center.x*ratio,
          -envelope.center.y*ratio,
          -envelope.center.z*ratio);
        for(const sourceRoot of instance.rootNodes)sourceRoot.parent=normalized;
        for(const mesh of includedMeshes(instance.rootNodes as TransformNode[])){
          mesh.isPickable=false;
          mesh.receiveShadows=true;
        }
        groups++;
      }
      installed++;
    }
    if(options.cancelled?.()){clear();return {importedLeaves:0,groups:0,dispose(){}};}
    // Strict replacement only after every source clone is valid; the 2D cards
    // remain a nonfatal fallback if a network/GLTF asset fails to arrive.
    for(const tree of slots)for(const card of tree.cards)card.setEnabled(false);
    return {importedLeaves:installed,groups,dispose:clear};
  }catch(error){clear();throw error;}
}
