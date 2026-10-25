/** NH-008: park lawns and building-lot paving follow the existing terrain.
 * Draw one batched mesh per material, avoiding 100 standalone mesh calls.
 * Only designated parks and actual tree wells receive South Ward grass.
 * Every occupied urban block is flat-looking concrete, not a black void.
 */
import {Mesh,Scene,StandardMaterial,VertexData} from "@babylonjs/core";
import type {TreeLocation} from "./north-heights-trees-004";
type Ground=(x:number,z:number)=>number;
type Geometry={points:number[];indices:number[];uvs:number[]};
const newBatch=():Geometry=>({points:[],indices:[],uvs:[]});
const parkCode=(i:number,j:number)=>"NH-"+String(j+1).padStart(2,"0")+"-"+String(i+1).padStart(2,"0");
export function planNorthHeightsBlockSurfaces008(
  middle:readonly number[],occupied:ReadonlySet<string>,
  trees:readonly TreeLocation[],
):{parks:number;concreteBlocks:number;treeWells:number}{
  let parks=0,concreteBlocks=0,treeWells=0;
  for(let j=0;j<middle.length;j++)for(let i=0;i<middle.length;i++)
    if(occupied.has(parkCode(i,j)))concreteBlocks++;
    else parks++;
  for(const tree of trees){
    const ix=middle.findIndex(v=>Math.abs(tree.x-v)<=24);
    const iz=middle.findIndex(v=>Math.abs(tree.z-v)<=24);
    if(ix>=0&&iz>=0&&occupied.has(parkCode(ix,iz)))treeWells++;
  }
  return {parks,concreteBlocks,treeWells};
}
function cap(batch:Geometry,x:number,z:number,halfX:number,halfZ:number,ground:Ground,up:number){
  // Four subdivisions prevent a floating slab on sloped terrain; all
  // vertices are at true landscape altitude, with upward-facing normals.
  const nx=4,nz=4;
  const origin=batch.points.length/3;
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
    const px=x-halfX+2*halfX*i/nx,pz=z-halfZ+2*halfZ*j/nz;
    batch.points.push(px,ground(px,pz)+up,pz);
    batch.uvs.push(px/8,pz/8);
  }
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
    const n=origin+j*(nx+1)+i;
    batch.indices.push(n,n+nx+2,n+1,n,n+nx+1,n+nx+2);
  }
}
function mesh(scene:Scene,name:string,geometry:Geometry,material:StandardMaterial){
  if(!geometry.indices.length)return;
  const normals:number[]=[];
  for(let i=0;i<geometry.points.length;i+=3)normals.push(0,1,0);
  const data=new VertexData();
  data.positions=geometry.points;data.indices=geometry.indices;
  data.uvs=geometry.uvs;data.normals=normals;
  const surface=new Mesh("nh008-block:"+name,scene);
  data.applyToMesh(surface);
  surface.material=material;
  surface.isPickable=false;
  surface.freezeWorldMatrix();
}
export function createNorthHeightsBlockSurfaces008(
  scene:Scene,options:{
    middle:readonly number[];occupied:ReadonlySet<string>;ground:Ground;
    trees:readonly TreeLocation[];grass:StandardMaterial;concrete:StandardMaterial;
  },
){
  const lawn=newBatch(),paved=newBatch();
  let parks=0,pavements=0,wells=0;
  const {middle,occupied,ground,trees}=options;
  for(let j=0;j<middle.length;j++)for(let i=0;i<middle.length;i++){
    const x=middle[i]!,z=middle[j]!;
    if(occupied.has(parkCode(i,j))){
      cap(paved,x,z,24.15,24.15,ground,.058);pavements++;
    }else{
      cap(lawn,x,z,24.15,24.15,ground,.065);parks++;
    }
  }
  for(const tree of trees){
    const ix=middle.findIndex(v=>Math.abs(tree.x-v)<=24);
    const iz=middle.findIndex(v=>Math.abs(tree.z-v)<=24);
    if(ix<0||iz<0||!occupied.has(parkCode(ix,iz)))continue;
    // A small planting well directly beneath each setback tree.
    const centerX=middle[ix]!,centerZ=middle[iz]!;
    const x=Math.max(centerX-21.7,Math.min(centerX+21.7,tree.x));
    const z=Math.max(centerZ-21.7,Math.min(centerZ+21.7,tree.z));
    cap(lawn,x,z,2.1,2.1,ground,.075);wells++;
  }
  mesh(scene,"concrete",paved,options.concrete);
  mesh(scene,"grass",lawn,options.grass);
  return {parks,pavements,wells};
}
