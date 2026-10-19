/**
 * GTD-VEH-FIT-002 G1/G2 — compact, driving-only two-link pose adapter.
 * Keeps the accepted torso root and imported Driving_Loop. This modifies
 * actual UAL linked joint transforms after animation evaluation each render;
 * it never creates a replacement character, keyframe or physics collider.
 * For unknown rigs or an absent real steering mesh it fails closed.
 */
import {
  AbstractMesh, Matrix, Quaternion, Scene, TransformNode, Vector3,
} from "@babylonjs/core";
import type { Mesh, Skeleton, Observer } from "@babylonjs/core";
import { findDriverBones, type DriverLimbRole } from "./driver-limb-landmarks";
import { applyAimStep, rotationOf } from "./driver-joint-space";
import { SkinnedFootGeometry, type FootSide } from "./skinned-foot-geometry";
import { planCabinFit004Candidates, FIT004_MAX_FOOT_TARGET_LIFT_METRES } from "./cabin-fit-004-policy";
import { VehicleCabinFloor, planSoleClearance, type VehicleCabinKind } from "../vehicles/vehicle-cabin-envelope";
import {planRangeRoverFootwellTargets,planRangeRoverSoleLift} from "../vehicles/range-rover-drive-007";
import {bmw016FootwellHeight} from "../vehicles/coupe-driver-fit-016";

export type DriverContactState = {
  enabled: boolean;
  status: "disabled" | "missing-rig" | "missing-wheel" | "contact-only-unverified-cabin" | "out-of-tolerance";
  appliedLimbs: string[];
  missing: string[];
  targets: Record<string, {x:number;y:number;z:number}>;
  actual: Record<string, {x:number;y:number;z:number}>;
  errorMetres: Record<string, number>;
};
const point=(v: Vector3)=>({x:v.x,y:v.y,z:v.z});
const clamp=(v:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,v));
/** On the pinned Ferrari, steering_leather is the actual rim (mesh 23);
 * steering_carbon is inner trim, not a valid palm-to-rim contact target. */
function findWheelMesh(anchor:TransformNode):AbstractMesh|null{
  const candidates=anchor.getDescendants(false).filter(n=>
    n instanceof AbstractMesh && n.getTotalVertices()>0) as AbstractMesh[];
  return candidates.find(n=>/steering_leather$/i.test(n.name)) ??
    candidates.find(n=>/steer.{0,12}wheel|steering|volante/i.test(n.name)) ?? null;
}
function wheelLandmark(m:AbstractMesh|null) {
  if(!m)return null;
  m.computeWorldMatrix(true);
  const b=m.getBoundingInfo().boundingBox;
  const radius=Math.max(b.extendSizeWorld.x,b.extendSizeWorld.y,b.extendSizeWorld.z);
  if(!Number.isFinite(radius)||radius<0.08||radius>0.5)return null;
  return {center:b.centerWorld.clone(),radius};
}
/** Real mesh-vertex points on the steering leather, not a horizontal circle
 * created from world axes. Computed once and retained in Ferrari local frame.
 */
function steeringRimContacts(m:AbstractMesh,car:TransformNode){
  const verts=m.getVerticesData("position");
  if(!verts||verts.length<24)return null;
  m.computeWorldMatrix(true);car.computeWorldMatrix(true);
  const matrix=m.getWorldMatrix(),inv=car.getWorldMatrix().clone().invert();
  const center=m.getBoundingInfo().boundingBox.centerWorld.clone();
  const right=Vector3.TransformNormal(Vector3.Right(),car.getWorldMatrix()).normalize();
  const worldVerts:Vector3[]=[];
  let lateralExtent=0;
  // Only evaluated on boarding, never per gameplay frame.
  for(let i=0;i<verts.length-2;i+=3){
    const w=Vector3.TransformCoordinates(
      new Vector3(verts[i]!,verts[i+1]!,verts[i+2]!),matrix);
    worldVerts.push(w);
    lateralExtent=Math.max(lateralExtent,Math.abs(Vector3.Dot(w.subtract(center),right)));
  }
  if(lateralExtent<0.07||lateralExtent>0.5)return null;
  const choose=(sign:number)=>{
    const target=center.add(right.scale(sign*lateralExtent*0.74))
      .add(Vector3.Up().scale(lateralExtent*0.28));
    let best:Vector3|null=null,dist=Infinity;
    for(const point of worldVerts){
      const offset=Vector3.Dot(point.subtract(center),right);
      if(sign*offset<0.07)continue;
      const d=Vector3.DistanceSquared(target,point);
      if(d<dist){best=point;dist=d;}
    }
    return best?Vector3.TransformCoordinates(best,inv):null;
  };
  const left=choose(-1),rightGrip=choose(1);
  return left&&rightGrip?{left,right:rightGrip,sourceMesh:m.name}:null;
}
/** Deterministic, testable target geometry from the live UAL hip/wrist
 * positions and the real Ferrari rim. Never extend feet past the wheel.
 */
export function planDriverContactTargets(args:{
  leftHip:Vector3;rightHip:Vector3;leftHand:Vector3;rightHand:Vector3;
  wheelCenter:Vector3;wheelRadius:number;vehicleFloorY:number;
}) {
  const {leftHip,rightHip,leftHand,rightHand,wheelCenter,wheelRadius,vehicleFloorY}=args;
  const midpoint=leftHip.add(rightHip).scale(0.5);
  const forward=wheelCenter.subtract(midpoint);forward.y=0;
  if(forward.lengthSquared()<0.01||!Number.isFinite(wheelRadius)||wheelRadius<=0)
    return null;
  forward.normalize();
  const footY=Math.max(vehicleFloorY+0.22,midpoint.y-0.22);
  const leftFoot=leftHip.add(forward.scale(0.37));
  const rightFoot=rightHip.add(forward.scale(0.37));
  leftFoot.y=footY;
  rightFoot.y=footY;
  function nearestRim(hand:Vector3,hip:Vector3) {
    const toward=hand.subtract(wheelCenter);toward.y=0;
    if(toward.lengthSquared()<0.003){
      toward.copyFrom(hip.subtract(wheelCenter));toward.y=0;
    }
    if(toward.lengthSquared()<0.003) toward.copyFrom(forward.negate());
    toward.normalize();
    const target=wheelCenter.add(toward.scale(wheelRadius*0.92));
    target.y=wheelCenter.y-0.045;
    return target;
  }
  return {
    leftFoot,rightFoot,
    leftHand:nearestRim(leftHand,leftHip),
    rightHand:nearestRim(rightHand,rightHip),
  };
}

type PositionedBone = {name:string; getTransformNode():TransformNode|null};
function boneWorld(b:PositionedBone):Vector3|null {
  const node=b.getTransformNode();
  if(!node)return null;
  node.computeWorldMatrix(true);
  return node.getAbsolutePosition().clone();
}
type JointChain = [DriverLimbRole,DriverLimbRole,DriverLimbRole];
/** Return true only on a converged, finite candidate. Any failed chain is
 * rolled back to its animation-only baseline; no outward limb deformation. */
function solveChain(
  bones: ReturnType<typeof findDriverBones>["found"],
  chain: JointChain,target:Vector3,
):boolean {
  const [root,mid,end]=chain.map(r=>bones[r]);
  if(!root||!mid||!end)return false;
  const a=root.getTransformNode(),b=mid.getTransformNode(),c=end.getTransformNode();
  if(!a||!b||!c)return false;
  a.computeWorldMatrix(true);b.computeWorldMatrix(true);c.computeWorldMatrix(true);
  const limbLength=Vector3.Distance(a.getAbsolutePosition(),b.getAbsolutePosition())+
    Vector3.Distance(b.getAbsolutePosition(),c.getAbsolutePosition());
  const reach=Vector3.Distance(a.getAbsolutePosition(),target);
  if(!Number.isFinite(reach)||limbLength<0.15||reach>limbLength+0.001)return false;
  const originalA=rotationOf(a),originalB=rotationOf(b);
  const before=Vector3.Distance(c.getAbsolutePosition(),target);
  for(let i=0;i<10;i++){
    if(Vector3.Distance(c.getAbsolutePosition(),target)<=0.02)break;
    applyAimStep(b,c,target,0.15);
    applyAimStep(a,c,target,0.15);
  }
  c.computeWorldMatrix(true);
  const after=Vector3.Distance(c.getAbsolutePosition(),target);
  if(!Number.isFinite(after)||after>0.02||after>before+1e-4){
    a.rotationQuaternion=originalA;
    b.rotationQuaternion=originalB;
    c.computeWorldMatrix(true);
    return false;
  }
  return true;
}
/** Returns driver-only observer with explicit lifetime; no per-frame scene searches. */
export function createDriverCabinPose(scene:Scene,skeleton:Skeleton,witness:Mesh,
  characterRoot:TransformNode, skinnedMeshes:readonly Mesh[]=[witness]) {
  const mapped=findDriverBones(skeleton);
  let cabin:TransformNode|null=null;
  let wheelNode:AbstractMesh|null=null;
  let rimContacts:ReturnType<typeof steeringRimContacts>|null=null;
  let enabled=false;
  let correctionMode: "feet"|"hands"|"both" = "both";
  let cachedLocalTargets:ReturnType<typeof planDriverContactTargets>|null=null;
  let cabinFitEnabled=false;
  let cabinFit004Enabled=false;
  let cabinKind:VehicleCabinKind="unknown";
  let cabinDimensions:{readonly x:number;readonly y:number;readonly z:number}|null=null;
  let floor:VehicleCabinFloor|null=null;
  let shoe:SkinnedFootGeometry|null=null;
  let sampledFrames=0;
  let offsetLift:Record<FootSide,number>={left:0,right:0};
  type FootResult={side:FootSide;state:string;soleY:number|null;floorY:number|null;
    penetrationMetres:number|null;liftAppliedMetres:number;sourceMesh:string|null};
  let footResult:FootResult[]=[];
  let fit004Attempts=0;
  let fit004State="disabled";
  // Separate provisional Rover visual sole sampling from verified FIT004.
  let roverFootSamples=0,roverFootwellState="not-sampled";
  let roverFootLift={left:0,right:0};
  let roverSoleY:{left:number|null;right:number|null}={left:null,right:null};
  let fit004Baseline:ReturnType<SkinnedFootGeometry["measureLowerLeg"]>|null=null;
  let fit004Final:ReturnType<SkinnedFootGeometry["measureLowerLeg"]>|null=null;
  const cachedBaseline=new Map<TransformNode,Quaternion>();
  const zero=():DriverContactState=>({
    enabled,status:enabled?"missing-wheel":"disabled",appliedLimbs:[],
    missing:[...mapped.missing],targets:{},actual:{},errorMetres:{},
  });
  let state=zero();
  const linkedNodes=[...new Set(Object.values(mapped.found).map(b=>b?.getTransformNode())
    .filter((n):n is TransformNode=>n instanceof TransformNode))];
  // Listener is active only when used; no work during walking/flight.
  // Undo the prior frame's procedural pose BEFORE Babylon evaluates Driving_Loop.
  // This also protects tracks which are not keyed every animation frame.
  const beforeAnimation=scene.onBeforeAnimationsObservable.add(()=>{
    if(!enabled)return;
    for(const [node,original] of cachedBaseline)node.rotationQuaternion=original.clone();
    cachedBaseline.clear();
  });
  const observer:Observer<Scene>=scene.onBeforeRenderObservable.add(()=>{
    if(!enabled||!cabin)return;
    if(!mapped.found.leftThigh||!mapped.found.rightThigh||
      !mapped.found.leftHand||!mapped.found.rightHand) {
      state={...zero(),status:"missing-rig"};return;
    }
    if(!Number.isFinite(characterRoot.getAbsolutePosition().y)) {
      state={...zero(),status:"out-of-tolerance"};return;
    }
    const wheel=wheelLandmark(wheelNode);
    const roverFeet=cabinKind==="range-rover"&&cabinDimensions!==null;
    // SUV foot IK must not depend on a Ferrari-specific steering-rim asset.
    if(!wheel&&!roverFeet){state={...zero(),status:"missing-wheel"};return;}
    const hipL=mapped.found.leftThigh?boneWorld(mapped.found.leftThigh):null;
    const hipR=mapped.found.rightThigh?boneWorld(mapped.found.rightThigh):null;
    const handL=mapped.found.leftHand?boneWorld(mapped.found.leftHand):null;
    const handR=mapped.found.rightHand?boneWorld(mapped.found.rightHand):null;
    if(!hipL||!hipR||!handL||!handR) {
      state={...zero(),status:"missing-rig"};return;
    }
    // Driver's actual pelvis, not the standing character root or the wheel,
    // determines where the forward pedals can be reached. The previous
    // wheel + forward*0.18 position was 1.0–1.3 m from the animated feet.
    // Contact targets are captured once in the Ferrari's own local frame.
    // Recomputing from already-corrected hands causes moving-target feedback.
    cabin.computeWorldMatrix(true);
    if(!cachedLocalTargets){
      const initial=roverFeet&&cabinDimensions
        ? {...planRangeRoverFootwellTargets({
            vehicle:{x:cabin.position.x,y:cabin.position.y,z:cabin.position.z,
              yaw:cabin.rotation.y},
            dimensions:cabinDimensions,leftHip:hipL,rightHip:hipR,
          }),leftHand:handL.clone(),rightHand:handR.clone()}
        : wheel?planDriverContactTargets({
            leftHip:hipL,rightHip:hipR,leftHand:handL,rightHand:handR,
            wheelCenter:wheel.center,wheelRadius:wheel.radius,
            vehicleFloorY:cabin.position.y,
          }):null;
      if(initial){
        // VEH-016: the accepted SUV geometry-aware leg IK is still used.
        // A source-specific BMW footwell target keeps calves and feet inside
        // the chassis without globally lifting Voight through its roof.
        if(roverFeet&&cabinDimensions&&
           cabin.name==="mercer-extra-anchor:gtd-veh014-mercer-bmw-m4"){
          const y=bmw016FootwellHeight(cabin.position.y,cabinDimensions.y);
          initial.leftFoot.y=Math.max(initial.leftFoot.y,y);
          initial.rightFoot.y=Math.max(initial.rightFoot.y,y);
        }
        const inverse=cabin.getWorldMatrix().clone().invert();
        cachedLocalTargets={
          leftFoot:Vector3.TransformCoordinates(initial.leftFoot,inverse),
          rightFoot:Vector3.TransformCoordinates(initial.rightFoot,inverse),
          leftHand:rimContacts?.left.clone() ??
            Vector3.TransformCoordinates(initial.leftHand,inverse),
          rightHand:rimContacts?.right.clone() ??
            Vector3.TransformCoordinates(initial.rightHand,inverse),
        };
      }
    }
    const plannedTargets=cachedLocalTargets?{
      leftFoot:Vector3.TransformCoordinates(cachedLocalTargets.leftFoot,cabin.getWorldMatrix()),
      rightFoot:Vector3.TransformCoordinates(cachedLocalTargets.rightFoot,cabin.getWorldMatrix()),
      leftHand:Vector3.TransformCoordinates(cachedLocalTargets.leftHand,cabin.getWorldMatrix()),
      rightHand:Vector3.TransformCoordinates(cachedLocalTargets.rightHand,cabin.getWorldMatrix()),
    }:null;
    if(!plannedTargets) {
      state={...zero(),status:"out-of-tolerance"};return;
    }
    const {leftFoot:leftFootTarget,rightFoot:rightFootTarget,
      leftHand:leftGrip,rightHand:rightGrip}=plannedTargets;
    // Only the opt-in fitting layer changes foot goals; accepted AR1 is the
    // identity path when no verified cabin is available.
    if((cabinFitEnabled||cabinFit004Enabled) && floor?.evidence==="verified-floor-mesh" && shoe?.available){
      leftFootTarget.y+=offsetLift.left;
      rightFootTarget.y+=offsetLift.right;
    }

    // Snapshots allow complete restoration when player leaves vehicle.
    cachedBaseline.clear();
    for(const node of linkedNodes) {
      cachedBaseline.set(node,node.rotationQuaternion?.clone() ??
        Quaternion.FromEulerAngles(node.rotation.x,node.rotation.y,node.rotation.z));
    }
    const desired=[
      {role:"leftFoot",chain:["leftThigh","leftCalf","leftFoot"] as JointChain,to:leftFootTarget},
      {role:"rightFoot",chain:["rightThigh","rightCalf","rightFoot"] as JointChain,to:rightFootTarget},
      {role:"leftHand",chain:["leftUpperArm","leftForearm","leftHand"] as JointChain,to:leftGrip},
      {role:"rightHand",chain:["rightUpperArm","rightForearm","rightHand"] as JointChain,to:rightGrip},
    ];
    const appliedLimbs:string[]=[];
    const targets:DriverContactState["targets"]={};
    const actual:DriverContactState["actual"]={};
    const errorMetres:DriverContactState["errorMetres"]={};
    for(const limb of desired) {
      if(correctionMode==="feet"&&limb.role.endsWith("Hand"))continue;
      if(correctionMode==="hands"&&limb.role.endsWith("Foot"))continue;
      targets[limb.role]=point(limb.to);
      const attempted=solveChain(mapped.found,limb.chain,limb.to);
      const tip=mapped.found[limb.chain[2]];
      const current=tip?boneWorld(tip):null;
      if(current) {
        actual[limb.role]=point(current);
        const error=Vector3.Distance(current,limb.to);
        errorMetres[limb.role]=error;
        // Attempting an IK solve is NOT equivalent to making contact.
        if(attempted && error<=0.02)appliedLimbs.push(limb.role);
      }
    }
    // Sample actual deforming soles AFTER Driving_Loop's joint-space IK.
    // Rover's GLB has no verified separate carpet-floor triangle map, so
    // this target is provisional visual containment, not a floor certificate.
    if(roverFeet && cabinDimensions && shoe?.available &&
       (++sampledFrames % 12===0) && cachedLocalTargets){
      const measured=shoe.measure();roverFootSamples++;
      for(const side of ["left","right"] as const){
        const sole=measured[side]?.world;roverSoleY[side]=sole?.y??null;
        if(!sole)continue;
        const raise=planRangeRoverSoleLift({
          soleY:sole.y,anchorY:cabin.position.y,
          bodyHeight:cabinDimensions.y,appliedLift:roverFootLift[side],
        });
        if(raise<.001)continue;
        const delta=Vector3.TransformNormal(new Vector3(0,raise,0),
          cabin.getWorldMatrix().clone().invert());
        if(side==="left")cachedLocalTargets.leftFoot.addInPlace(delta);
        else cachedLocalTargets.rightFoot.addInPlace(delta);
        roverFootLift[side]+=raise;
      }
      roverFootwellState=(["left","right"] as const).every(side=>
        roverSoleY[side]!==null&&roverSoleY[side]!>=
          cabin!.position.y+cabinDimensions!.y*.43-.005)
        ?"observed-above-provisional-footwell":
        (["left","right"] as const).every(side=>roverSoleY[side]!==null)
          ?"adjusting-or-unverified":"missing-shoe-evidence";
    }
    // VEH-CABIN-FIT-004: search *measured* bounded leg targets against actual
    // deforming footwear AND calf geometry. This is a one-off boarding-phase
    // calibration, not an unbounded per-frame pose or global-character offset.
    if(cabinFit004Enabled && shoe?.available &&
      floor?.evidence==="verified-floor-mesh" && (++sampledFrames % 20===0)){
      const current=shoe.measureLowerLeg(floor);
      if(fit004State==="pending"){
        fit004Attempts++;
        fit004Baseline=current;
        const joints=["leftThigh","leftCalf","rightThigh","rightCalf"] as const;
        const snapshots=joints.map(role=>{
          const n=mapped.found[role]?.getTransformNode();
          return n?{n,q:rotationOf(n)}:null;
        });
        const restore=()=>{for(const saved of snapshots){
          if(saved)saved.n.rotationQuaternion=saved.q.clone();
        }};
        let allPassed=snapshots.every(Boolean);
        const proposed:Record<FootSide,number>={left:0,right:0};
        if(!allPassed)fit004State="missing-leg-bones";
        for(const side of ["left","right"] as const){
          if(!allPassed)break;
          const baseline=current[side];
          if(baseline.state==="clear")continue;
          // Foot vertices must all have real carpet support; a missing
          // footprint is an unknown, not a clearance success.
          const plan=planCabinFit004Candidates({
            worstPenetrationMetres:baseline.worstPenetrationMetres,
            missingFootVertices:baseline.unmeasuredFootVertices,
            measuredCalfVertices:baseline.testedCalfVertices,
          });
          if(plan.status!=="eligible"){
            fit004State=plan.status;allPassed=false;break;
          }
          const chain:JointChain=side==="left"?
            ["leftThigh","leftCalf","leftFoot"]:
            ["rightThigh","rightCalf","rightFoot"];
          const start=side==="left"?leftFootTarget:rightFootTarget;
          // Start near the observed real-shoe deficit. Increment only when
          // the actual final mesh clearance remains unacceptable.
          let accepted=false;
          for(const candidate of plan.candidates){
            restore();
            // Reapply any other side's already verified correction.
            for(const acceptedSide of ["left","right"] as const){
              if(proposed[acceptedSide]<=0)continue;
              const other:JointChain=acceptedSide==="left"?
                ["leftThigh","leftCalf","leftFoot"]:
                ["rightThigh","rightCalf","rightFoot"];
              const t=(acceptedSide==="left"?leftFootTarget:rightFootTarget).clone();
              t.y+=proposed[acceptedSide];
              solveChain(mapped.found,other,t);
            }
            const target=start.clone();target.y+=candidate;
            if(!solveChain(mapped.found,chain,target))continue;
            const verified=shoe.measureLowerLeg(floor)[side];
            if(verified.state==="clear" && verified.worstPenetrationMetres<=0.003){
              proposed[side]=candidate;accepted=true;break;
            }
          }
          if(!accepted){fit004State="candidate-rejected";allPassed=false;}
        }
        if(allPassed){
          const verification=shoe.measureLowerLeg(floor);
          if((["left","right"] as const).every(side=>verification[side].state==="clear")){
            offsetLift=proposed;
            fit004Final=verification;
            fit004State="floor-clear-not-cabin-certified";
          }else{restore();fit004State="post-calibration-rejected";}
        }else restore();
      }else if(fit004State==="floor-clear-not-cabin-certified"){
        const valid=(["left","right"] as const).every(side=>current[side].state==="clear");
        fit004Final=current;
        if(!valid){
          offsetLift={left:0,right:0};
          fit004State="motion-regression-disabled";
        }
      }
    }
    // Sample the visibly deformed shoe geometry *after* AR1 IK; keep this
    // bounded and occasional (never scan both meshes on every render).
    if(cabinFitEnabled && shoe?.available && floor?.evidence==="verified-floor-mesh" &&
      (++sampledFrames % 20 === 0)) {
      const soles=shoe.measure();
      const outcomes:FootResult[]=[];
      for(const side of ["left","right"] as const){
        const sole=soles[side];
        const contact=sole?floor.sample(sole.world):null;
        const row:FootResult={
          side,state:!sole?"missing-shoe":contact?.evidence??"missing-floor",
          soleY:sole?.world.y??null,floorY:contact?.floorY??null,
          penetrationMetres:null,liftAppliedMetres:offsetLift[side],
          sourceMesh:sole?.sourceMesh??null,
        };
        if(sole&&contact?.evidence==="verified-floor-mesh"&&contact.floorY!==null){
          const clearance=floor.definition.clearanceMetres;
          row.penetrationMetres=Math.max(0,contact.floorY+clearance-sole.world.y);
          const plan=planSoleClearance(sole.world.y,contact.floorY,clearance,
            floor.definition.maxSoleLiftMetres,offsetLift[side]);
          row.state=plan.kind;
          if(plan.kind==="adjust"){
            const thigh=mapped.found[side==="left"?"leftThigh":"rightThigh"]?.getTransformNode();
            const calf=mapped.found[side==="left"?"leftCalf":"rightCalf"]?.getTransformNode();
            if(thigh&&calf){
              const beforeThigh=rotationOf(thigh),beforeCalf=rotationOf(calf);
              const oldClearance=row.penetrationMetres;
              const lifted=(side==="left"?leftFootTarget:rightFootTarget).clone();
              lifted.y+=plan.lift;
              const roles:JointChain=side==="left"?
                ["leftThigh","leftCalf","leftFoot"]:
                ["rightThigh","rightCalf","rightFoot"];
              const solved=solveChain(mapped.found,roles,lifted);
              const measured=solved?shoe.measure()[side]:null;
              const post=measured?floor.sample(measured.world):null;
              const newPenetration=measured&&post?.floorY!==null&&post?.floorY!==undefined?
                Math.max(0,post.floorY+clearance-measured.world.y):Infinity;
              if(solved && Number.isFinite(newPenetration) &&
                newPenetration+0.002<oldClearance) {
                offsetLift[side]+=plan.lift;
                row.liftAppliedMetres=offsetLift[side];
                row.state=newPenetration<=0.003?"clear":"improved";
                row.penetrationMetres=newPenetration;
                row.soleY=measured?.world.y??row.soleY;
                row.floorY=post?.floorY??row.floorY;
              } else {
                // One candidate cannot undo the successful head/torso/AR1 fit.
                thigh.rotationQuaternion=beforeThigh;
                calf.rotationQuaternion=beforeCalf;
                row.state="rolled-back";
              }
            }else row.state="missing-bones";
          }
        }
        outcomes.push(row);
      }
      footResult=outcomes;
    }
    const unresolved=Object.entries(errorMetres)
      .some(([,error])=>error>0.02);
    state={enabled:true,status:unresolved?"out-of-tolerance":"contact-only-unverified-cabin",
      appliedLimbs,missing:[...mapped.missing],targets,actual,errorMetres};
  });
  return {
    setCabin(next:TransformNode|null,active:boolean,
      mode:"feet"|"hands"|"both"="both",fitCabin=false,
      kind:VehicleCabinKind="ferrari",fit004=false,
      dimensions?:{readonly x:number;readonly y:number;readonly z:number}){
      if(!active||!next){
        for(const [node,rotation] of cachedBaseline) {
          node.rotationQuaternion=rotation.clone();
        }
        cachedBaseline.clear();
      }
      const changed=cabin!==next||correctionMode!==mode||enabled!==active ||
        cabinFitEnabled!==fitCabin || cabinFit004Enabled!==fit004 || cabinKind!==kind ||
        (kind==="range-rover"&&cabinDimensions!==dimensions);
      if(changed){
        cachedLocalTargets=null;
        cabin=next;
        cabinDimensions=kind==="range-rover"&&dimensions?dimensions:null;
        wheelNode=active&&next?findWheelMesh(next):null;
        rimContacts=wheelNode&&next?steeringRimContacts(wheelNode,next):null;
        cabinFit004Enabled=active&&fit004;
        cabinFitEnabled=active&&fitCabin&&!cabinFit004Enabled;
        cabinKind=kind;
        floor=(cabinFitEnabled||cabinFit004Enabled)&&next?
          VehicleCabinFloor.fromVehicle(next,kind):null;
        shoe=(cabinFitEnabled||cabinFit004Enabled||kind==="range-rover")?
          new SkinnedFootGeometry(skeleton,skinnedMeshes):null;
        sampledFrames=0;offsetLift={left:0,right:0};footResult=[];
        fit004Attempts=0;fit004Baseline=null;fit004Final=null;
        roverFootSamples=0;roverFootLift={left:0,right:0};
        roverSoleY={left:null,right:null};roverFootwellState="not-sampled";
        fit004State=cabinFit004Enabled?"pending":"disabled";
      }
      correctionMode=mode;enabled=active;
      if(changed)state=zero();
    },
    report:()=>({...state,correctionMode,
      roverFootwell:{enabled:enabled&&cabinKind==="range-rover",
        source:"vehicle-dimensions-provisional-footwell",dimensions:cabinDimensions,
        visualOnly:true,floorSurfaceVerified:false,
        sampledFrames:roverFootSamples,liftMetres:{...roverFootLift},
        soleWorldY:{...roverSoleY},status:roverFootwellState},
      cabinFit004:{enabled:cabinFit004Enabled,status:fit004State,
        attempts:fit004Attempts,
        maximumTargetLiftMetres:FIT004_MAX_FOOT_TARGET_LIFT_METRES,
        floor:floor?.status()??null,
        baseline:fit004Baseline,final:fit004Final,
        verifiedTargetLiftsMetres:{...offsetLift},
        note:"Floor and lower-leg clearance evidence only; full cabin hull and driving acceptance pending"},

      cabinFit003:{enabled:cabinFitEnabled,kind:cabinKind,
        floor:floor?.status()??null,skin:shoe?.evidence()??null,
        footResults:footResult.map(row=>({...row})),
        acceptedLiftMetres:{...offsetLift},
        isComplete:footResult.length===2&&footResult.every(r=>
          r.state==="clear"&&r.penetrationMetres!==null&&r.penetrationMetres<=0.003)},

      footwellLandmarksVerified:false,steeringPalmContactVerified:false,
      rimMeshSource:rimContacts?.sourceMesh??null,
      rimVerticesCalibrated:rimContacts!==null,
      actualParentFrames:Object.entries(mapped.found).map(([role,bone])=>{
        const parent=bone?.getTransformNode()?.parent;
        parent?.computeWorldMatrix(true);
        const determinant=parent?parent.getWorldMatrix().determinant():null;
        return {role,sourceBone:bone?.name??null,
          parentName:parent?.name??null,parentDeterminant:determinant,
          reflected:determinant===null?null:determinant<0};
      }),
      sourceBones:Object.entries(mapped.found)
      .map(([role,bone])=>({role,name:bone?.name,linked:!!bone?.getTransformNode()})),
      skeletonName:skeleton.name,witnessName:witness.name}),
    dispose(){
      scene.onBeforeRenderObservable.remove(observer);
      scene.onBeforeAnimationsObservable.remove(beforeAnimation);
      cabin=null;wheelNode=null;rimContacts=null;enabled=false;
      cabinDimensions=null;
      cachedBaseline.clear();cachedLocalTargets=null;floor=null;shoe=null;footResult=[];
      cabinFitEnabled=false;cabinFit004Enabled=false;offsetLift={left:0,right:0};
      fit004State="disabled";
    },
  };
}
