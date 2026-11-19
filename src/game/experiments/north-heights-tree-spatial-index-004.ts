/**
 * NH-012 Stage 3 — deterministic spatial index for immutable tree placements.
 * The index is built once; player movement queries only nearby grid cells.
 * Cell residency is geographic and must never be driven by camera position.
 */
import type {TreeLocation} from "./north-heights-trees-004";

export type NorthHeightsTreeCell004 = {
  readonly key:string;
  readonly x:number;
  readonly z:number;
  readonly indices:readonly number[];
};
export type NorthHeightsTreeCellDelta004 = {
  readonly changed:boolean;
  readonly queriedCells:number;
  readonly entered:readonly NorthHeightsTreeCell004[];
  readonly exited:readonly string[];
  readonly resident:readonly NorthHeightsTreeCell004[];
  readonly residentInstances:number;
};
const finite=(n:number)=>Number.isFinite(n);
const keyOf=(x:number,z:number)=>x+","+z;
const closestDistanceSquared=(x:number,z:number,cx:number,cz:number,size:number)=>{
  const half=size/2;
  const dx=Math.max(Math.abs(x-cx)-half,0);
  const dz=Math.max(Math.abs(z-cz)-half,0);
  return dx*dx+dz*dz;
};

/**
 * Cell size is a measured tuning parameter. 48m is the initial candidate:
 * it bounds the number of cells queried without changing authored placements.
 */
export class NorthHeightsTreeSpatialIndex004 {
  readonly cellSize:number;
  readonly totalPlacements:number;
  private readonly cells=new Map<string,NorthHeightsTreeCell004>();
  private readonly residentKeys=new Set<string>();
  private lastX=NaN;
  private lastZ=NaN;
  private lastCellX=NaN;
  private lastCellZ=NaN;

  constructor(placements:readonly TreeLocation[],cellSize=48){
    if(!finite(cellSize)||cellSize<=0)throw new Error("Invalid tree cell size");
    this.cellSize=cellSize;
    this.totalPlacements=placements.length;
    const buckets=new Map<string,{x:number;z:number;indices:number[]}>();
    for(let i=0;i<placements.length;i++){
      const p=placements[i]!;
      if(!finite(p.x)||!finite(p.z))throw new Error("Tree placement has invalid X/Z");
      const x=Math.floor(p.x/cellSize),z=Math.floor(p.z/cellSize),key=keyOf(x,z);
      let bucket=buckets.get(key);
      if(!bucket){bucket={x,z,indices:[]};buckets.set(key,bucket);}
      bucket.indices.push(i);
    }
    for(const [key,bucket] of buckets){
      this.cells.set(key,{key,x:bucket.x,z:bucket.z,indices:bucket.indices});
    }
  }

  get cellCount(){return this.cells.size;}
  get residentCellCount(){return this.residentKeys.size;}

  update(center:{x:number;z:number},enterRadius:number,exitRadius:number,prefetchDistance=24):NorthHeightsTreeCellDelta004{
    if(!finite(center.x)||!finite(center.z))return this.snapshot(false,0,[],[]);
    if(!finite(enterRadius)||enterRadius<=0||!finite(exitRadius)||exitRadius<enterRadius||
       !finite(prefetchDistance)||prefetchDistance<0)
      throw new Error("Invalid tree residency radii");
    const cellX=Math.floor(center.x/this.cellSize),cellZ=Math.floor(center.z/this.cellSize);
    const moved=Math.hypot(center.x-this.lastX,center.z-this.lastZ);
    if(finite(this.lastX)&&cellX===this.lastCellX&&cellZ===this.lastCellZ&&moved<8)
      return this.snapshot(false,0,[],[]);
    const dx=finite(this.lastX)?center.x-this.lastX:0;
    const dz=finite(this.lastZ)?center.z-this.lastZ:0;
    const length=Math.hypot(dx,dz);
    const dirX=length>.1?dx/length:0,dirZ=length>.1?dz/length:0;
    const reach=exitRadius+prefetchDistance+this.cellSize;
    const minX=Math.floor((center.x-reach)/this.cellSize);
    const maxX=Math.floor((center.x+reach)/this.cellSize);
    const minZ=Math.floor((center.z-reach)/this.cellSize);
    const maxZ=Math.floor((center.z+reach)/this.cellSize);
    const entered:NorthHeightsTreeCell004[]=[];
    const exited:string[]=[];
    let queriedCells=0;
    for(let z=minZ;z<=maxZ;z++)for(let x=minX;x<=maxX;x++){
      queriedCells++;
      const key=keyOf(x,z),cell=this.cells.get(key);
      if(!cell)continue;
      const cx=(x+.5)*this.cellSize,cz=(z+.5)*this.cellSize;
      const distanceSq=closestDistanceSquared(center.x,center.z,cx,cz,this.cellSize);
      const forward=(cx-center.x)*dirX+(cz-center.z)*dirZ;
      const threshold=this.residentKeys.has(key)
        ?exitRadius+(forward>0?prefetchDistance:0)
        :enterRadius+(forward>0?prefetchDistance:0);
      if(distanceSq<=threshold*threshold){
        if(!this.residentKeys.has(key)){this.residentKeys.add(key);entered.push(cell);}
      }else if(this.residentKeys.delete(key))exited.push(key);
    }
    // Existing cells beyond the candidate square are released without scanning
    // the full placement population; resident cell count is bounded by radius.
    for(const key of [...this.residentKeys]){
      const cell=this.cells.get(key)!;
      const cx=(cell.x+.5)*this.cellSize,cz=(cell.z+.5)*this.cellSize;
      const distanceSq=closestDistanceSquared(center.x,center.z,cx,cz,this.cellSize);
      if(distanceSq>(exitRadius+prefetchDistance)*(exitRadius+prefetchDistance)){
        this.residentKeys.delete(key);exited.push(key);
      }
    }
    this.lastX=center.x;this.lastZ=center.z;this.lastCellX=cellX;this.lastCellZ=cellZ;
    return this.snapshot(entered.length>0||exited.length>0,queriedCells,entered,exited);
  }

  private snapshot(changed:boolean,queriedCells:number,entered:NorthHeightsTreeCell004[],exited:string[]):NorthHeightsTreeCellDelta004{
    const resident:NorthHeightsTreeCell004[]=[];
    let residentInstances=0;
    for(const key of this.residentKeys){
      const cell=this.cells.get(key);
      if(!cell)continue;
      resident.push(cell);residentInstances+=cell.indices.length;
    }
    return {changed,queriedCells,entered,exited,resident,residentInstances};
  }
}
