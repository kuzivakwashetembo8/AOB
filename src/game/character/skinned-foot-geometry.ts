/** Actual CPU-skinned UAL shoe-sole vertices, rather than joint positions.
 * Only used by the opt-in cabin-fit experiment and on-demand diagnostics.
 * Cache influence indices; GPU vertex buffers and skinned meshes are unchanged.
 */
import { Mesh, Skeleton, Vector3 } from "@babylonjs/core";
import type { VehicleCabinFloor } from "../vehicles/vehicle-cabin-envelope";
export type FootSide="left"|"right";
export type FootSolePoint={
  side:FootSide;world:Vector3;sourceMesh:string;
  vertices:number;boneNames:string[];
};
type SubmeshWitness={mesh:Mesh;left:number[];right:number[];
 leftCalf:number[];rightCalf:number[]};
export type LowerLegClearance={
  side:FootSide;
  state:"clear"|"penetrating"|"missing-shoe"|"incomplete-floor";
  worstPenetrationMetres:number;
  footVertices:number;calfVertices:number;
  testedFootVertices:number;testedCalfVertices:number;
  unmeasuredFootVertices:number;unmeasuredCalfVertices:number;
  penetratingFootVertices:number;penetratingCalfVertices:number;
  witnessMesh:string|null;
};
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
    const leftCalf=new Set(ids.filter(b=>/^(calf_l|leftleg|leftcalf)$/.test(b.name)).map(b=>b.id));
    const rightCalf=new Set(ids.filter(b=>/^(calf_r|rightleg|rightcalf)$/.test(b.name)).map(b=>b.id));
    this.sources=[];
    if(left.size===0||right.size===0){this.available=false;return;}
    for(const mesh of meshes){
      if(mesh.skeleton!==skeleton||mesh.getTotalVertices()===0)continue;
      const matrices=mesh.getVerticesData(SKIN_IDS);
      const weights=mesh.getVerticesData(SKIN_WEIGHTS);
      if(!matrices||!weights)continue;
      const leftVerts:number[]=[],rightVerts:number[]=[];
      const leftCalfVerts:number[]=[],rightCalfVerts:number[]=[];
      for(let i=0;i<mesh.getTotalVertices();i++){
        let l=0,r=0,lc=0,rc=0;
        for(let k=0;k<4;k++){
          const index=matrices[i*4+k]!;
          const w=weights[i*4+k]!;
          if(left.has(index))l+=w;
          if(right.has(index))r+=w;
          if(leftCalf.has(index))lc+=w;
          if(rightCalf.has(index))rc+=w;
        }
        if(l>=0.55)leftVerts.push(i);
        if(r>=0.55)rightVerts.push(i);
        if(lc>=0.55)leftCalfVerts.push(i);
        if(rc>=0.55)rightCalfVerts.push(i);
      }
      if(leftVerts.length||rightVerts.length||leftCalfVerts.length||rightCalfVerts.length)
        this.sources.push({mesh,left:leftVerts,right:rightVerts,
          leftCalf:leftCalfVerts,rightCalf:rightCalfVerts});
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

  /** VEH-CABIN-FIT-004: evaluate all actual shoe AND calf-dominated skinned
   * vertices against real Ferrari floor triangles. A missing foot-support
   * triangle is not accepted as clearance. Vertices outside the carpet's
   * calf footprint are counted as unmeasured, never invented as valid.
   * This is a lower-limb floor clearance gate, NOT a complete sealed cabin.
   */
  measureLowerLeg(floor:VehicleCabinFloor):Record<FootSide,LowerLegClearance>{
    const result={} as Record<FootSide,LowerLegClearance>;
    this.skeleton.prepare(true);
    const verts=this.sources.map(s=>({
      witness:s,
      positions:s.mesh.getPositionData(true,false),
      matrix:s.mesh.getWorldMatrix().clone(),
    }));
    for(const side of ["left","right"] as const){
      let feet=0,calves=0,footChecked=0,calfChecked=0;
      let footBad=0,calfBad=0,worst=0,witnessMesh:string|null=null;
      for(const {witness,positions,matrix} of verts){
        if(!positions)continue;
        for(const part of ["foot","calf"] as const){
          const indices=part==="foot"?witness[side]:
            witness[side==="left"?"leftCalf":"rightCalf"];
          if(part==="foot")feet+=indices.length;else calves+=indices.length;
          for(const i of indices){
            const j=i*3;
            if(j+2>=positions.length)continue;
            const world=Vector3.TransformCoordinates(
              new Vector3(positions[j]!,positions[j+1]!,positions[j+2]!),matrix);
            if(![world.x,world.y,world.z].every(Number.isFinite))continue;
            const sample=floor.sample(world);
            if(sample.evidence!=="verified-floor-mesh"||sample.floorY===null)continue;
            if(part==="foot")footChecked++;else calfChecked++;
            const penetration=sample.floorY+floor.definition.clearanceMetres-world.y;
            if(penetration>0.003){
              if(part==="foot")footBad++;else calfBad++;
              if(penetration>worst){worst=penetration;witnessMesh=witness.mesh.name;}
            }
          }
        }
      }
      const state:LowerLegClearance["state"]=feet===0?"missing-shoe":
        footChecked!==feet || calfChecked===0?"incomplete-floor":
        footBad+calfBad>0?"penetrating":"clear";
      result[side]={side,state,worstPenetrationMetres:worst,
        footVertices:feet,calfVertices:calves,
        testedFootVertices:footChecked,testedCalfVertices:calfChecked,
        unmeasuredFootVertices:feet-footChecked,
        unmeasuredCalfVertices:calves-calfChecked,
        penetratingFootVertices:footBad,penetratingCalfVertices:calfBad,
        witnessMesh};
    }
    return result;
  }
  evidence(){return {available:this.available,
    meshes:this.sources.map(x=>({name:x.mesh.name,
      leftVertices:x.left.length,rightVertices:x.right.length,
      leftCalfVertices:x.leftCalf.length,rightCalfVertices:x.rightCalf.length}))};}
}
