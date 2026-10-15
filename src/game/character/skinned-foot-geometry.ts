/** Actual CPU-skinned UAL shoe-sole vertices, rather than joint positions.
 * Only used by the opt-in cabin-fit experiment and on-demand diagnostics.
 * Cache influence indices; GPU vertex buffers and skinned meshes are unchanged.
 */
import { Mesh, Skeleton, Vector3 } from "@babylonjs/core";
export type FootSide="left"|"right";
export type FootSolePoint={
  side:FootSide;world:Vector3;sourceMesh:string;
  vertices:number;boneNames:string[];
};
type SubmeshWitness={mesh:Mesh;left:number[];right:number[]};
const SKIN_IDS="matricesIndices",SKIN_WEIGHTS="matricesWeights";
export class SkinnedFootGeometry {
  readonly available:boolean;
  private readonly sources:SubmeshWitness[];
  constructor(readonly skeleton:Skeleton,meshes:readonly Mesh[]){
    const ids=skeleton.bones.map((b,i)=>({name:b.name.toLowerCase(),id:i}));
    const left=new Set(ids.filter(b=>/^(foot_l|ball_l|ball_leaf_l|leftfoot|lefttoebase)$/.test(b.name))
      .map(b=>b.id));
    const right=new Set(ids.filter(b=>/^(foot_r|ball_r|ball_leaf_r|rightfoot|righttoebase)$/.test(b.name))
      .map(b=>b.id));
    this.sources=[];
    if(left.size===0||right.size===0){this.available=false;return;}
    for(const mesh of meshes){
      if(mesh.skeleton!==skeleton||mesh.getTotalVertices()===0)continue;
      const matrices=mesh.getVerticesData(SKIN_IDS);
      const weights=mesh.getVerticesData(SKIN_WEIGHTS);
      if(!matrices||!weights)continue;
      const leftVerts:number[]=[],rightVerts:number[]=[];
      for(let i=0;i<mesh.getTotalVertices();i++){
        let l=0,r=0;
        for(let k=0;k<4;k++){
          const index=matrices[i*4+k]!;
          const w=weights[i*4+k]!;
          if(left.has(index))l+=w;
          if(right.has(index))r+=w;
        }
        if(l>=0.55)leftVerts.push(i);
        if(r>=0.55)rightVerts.push(i);
      }
      if(leftVerts.length||rightVerts.length)
        this.sources.push({mesh,left:leftVerts,right:rightVerts});
    }
    this.available=this.sources.some(s=>s.left.length>10)&&
      this.sources.some(s=>s.right.length>10);
  }
  /** Recompute the ACTUAL current deforming shoe vertices after Driving_Loop
   * and IK; call sparingly (once per sampled interval, not every render).
   */
  measure():{left:FootSolePoint|null;right:FootSolePoint|null}{
    if(!this.available)return {left:null,right:null};
    this.skeleton.prepare(true);
    const winner:{left:FootSolePoint|null;right:FootSolePoint|null}=
      {left:null,right:null};
    const total={left:0,right:0};
    for(const entry of this.sources){
      const {mesh}=entry;
      mesh.computeWorldMatrix(true);
      const positions=mesh.getPositionData(true,false);
      if(!positions)continue;
      const matrix=mesh.getWorldMatrix();
      for(const side of ["left","right"] as const){
        const indices=entry[side];
        total[side]+=indices.length;
        for(const i of indices){
          const n=i*3;
          if(n+2>=positions.length)continue;
          const point=Vector3.TransformCoordinates(
            new Vector3(positions[n]!,positions[n+1]!,positions[n+2]!),matrix);
          if(![point.x,point.y,point.z].every(Number.isFinite))continue;
          if(!winner[side]||point.y<winner[side].world.y)
            winner[side]={side,world:point,sourceMesh:mesh.name,
              vertices:0,boneNames:side==="left"?["foot_l","ball_l"]:["foot_r","ball_r"]};
        }
      }
    }
    for(const side of ["left","right"] as const)
      if(winner[side])winner[side].vertices=total[side];
    return winner;
  }
  evidence(){return {available:this.available,
    meshes:this.sources.map(x=>({name:x.mesh.name,
      leftVertices:x.left.length,rightVertices:x.right.length}))};}
}
