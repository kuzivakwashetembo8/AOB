/** NH-008 / NH-YARD-013: block surfaces follow the existing hill terrain.
 * All park and building-yard parcels share the same South Ward grass material.
 * The `occupied` parameter means parcels reserved for concrete SURFACING
 * (currently only the two genuine parking pads), not building occupancy.
 * Draw one batched mesh per material, never 100 independent grass meshes.
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
    excludedGrass?:readonly {minX:number;maxX:number;minZ:number;maxZ:number}[];
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
      const ex=(options.excludedGrass??[]).find(r=>
        r.maxX>x-24.15&&r.minX<x+24.15&&r.maxZ>z-24.15&&r.minZ<z+24.15);
      if(!ex)cap(lawn,x,z,24.15,24.15,ground,.065);
      else{
        const boundsX=[x-24.15,Math.max(x-24.15,ex.minX),
          Math.min(x+24.15,ex.maxX),x+24.15];
        const boundsZ=[z-24.15,Math.max(z-24.15,ex.minZ),
          Math.min(z+24.15,ex.maxZ),z+24.15];
        for(let zz=0;zz<3;zz++)for(let xx=0;xx<3;xx++){
          if(xx===1&&zz===1)continue;
          const ax=boundsX[xx]!,bx=boundsX[xx+1]!;
          const az=boundsZ[zz]!,bz=boundsZ[zz+1]!;
          if(bx-ax>.001&&bz-az>.001)
            cap(lawn,(ax+bx)/2,(az+bz)/2,(bx-ax)/2,(bz-az)/2,ground,.065);
        }
      }
      parks++;
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
