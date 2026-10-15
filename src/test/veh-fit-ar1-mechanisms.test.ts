import {describe,expect,it} from "vitest";
import {Matrix,MeshBuilder,NullEngine,Quaternion,Scene,TransformNode,Vector3} from "@babylonjs/core";
import {parentSpaceAimDelta,applyAimStep} from "../game/character/driver-joint-space";
import {buildTireContactProfile,tireContactBottomY} from "../game/vehicles/wheel-contact-geometry";
import {sampleRenderedVehicleSurface} from "../game/vehicles/vehicle-road-surface";
const v=(x:number,y:number,z:number)=>new Vector3(x,y,z);

describe("AR1 reflected transform and transactional aim regressions",()=>{
  it("correctly aims under reflected parent parity",()=>{
    const reflection=Matrix.Scaling(-1,1,1);
    const delta=parentSpaceAimDelta(Vector3.Up(),Vector3.Right(),reflection,0.19);
    expect(delta).not.toBeNull();
    if(!delta)return;
    const worldInitial=Vector3.Up();
    const localInitial=Vector3.TransformNormal(worldInitial,reflection.clone().invert());
    const moved=Vector3.TransformNormal(localInitial.applyRotationQuaternion(delta),reflection);
    expect(Vector3.Distance(moved,Vector3.Right()))
      .toBeLessThan(Vector3.Distance(worldInitial,Vector3.Right()));
  });
  it("rejects invalid parents, antiparallel ambiguity and nonuniform scale",()=>{
    expect(parentSpaceAimDelta(Vector3.Up(),Vector3.Right(),
      Matrix.Scaling(1,2,1),0.2)).toBeNull();
    expect(parentSpaceAimDelta(Vector3.Up(),Vector3.Down(),
      Matrix.Identity(),0.2)).toBeNull();
    expect(parentSpaceAimDelta(Vector3.Up(),Vector3.Right(),
      Matrix.Scaling(0,1,1),0.2)).toBeNull();
  });
  it("never commits joint movement that worsens endpoint residual",()=>{
    const engine=new NullEngine(),scene=new Scene(engine);
    try{
      const mirror=new TransformNode("mirror",scene);
      mirror.scaling.x=-1;
      const shoulder=new TransformNode("joint",scene);
      shoulder.parent=mirror;
      const tip=new TransformNode("tip",scene);
      tip.parent=shoulder;tip.position.y=1;
      const target=v(1,0,0);
      tip.computeWorldMatrix(true);
      const before=Vector3.Distance(tip.getAbsolutePosition(),target);
      applyAimStep(shoulder,tip,target,0.19);
      tip.computeWorldMatrix(true);
      expect(Vector3.Distance(tip.getAbsolutePosition(),target)).toBeLessThan(before);
    }finally{scene.dispose();engine.dispose();}
  });
});

describe("AR1 tire and real surface witnesses",()=>{
  it("tire envelope is spin invariant and excludes AABB corner inflation",()=>{
    const engine=new NullEngine(),scene=new Scene(engine);
    try{
      const pivot=new TransformNode("wheel",scene);
      const tire=MeshBuilder.CreateCylinder("tire-rubber",
        {diameter:0.64,height:0.18,tessellation:48},scene);
      tire.parent=pivot;tire.rotation.z=Math.PI/2;
      const profile=buildTireContactProfile(pivot,[tire],"x");
      expect(profile?.confidence).toBe("verified-shape");
      expect(profile?.radius).toBeGreaterThan(0.29);
      if(!profile)return;
      const values:number[]=[];
      for(const deg of [0,22.5,45,90,180,270,360]){
        pivot.rotationQuaternion=Quaternion.RotationAxis(Vector3.Right(),deg*Math.PI/180);
        pivot.computeWorldMatrix(true);
        values.push(tireContactBottomY(pivot.getWorldMatrix(),profile,"x")!);
      }
      expect(Math.max(...values)-Math.min(...values)).toBeLessThan(0.002);
    }finally{scene.dispose();engine.dispose();}
  });
  it("does not identify bare Rapier support as rendered asphalt",()=>{
    const engine=new NullEngine(),scene=new Scene(engine);
    try{
      expect(sampleRenderedVehicleSurface(scene,0,0)).toBeNull();
      const road=MeshBuilder.CreateBox("generated-parity-main-road",
        {width:12,height:0.03,depth:8},scene);
      road.position.y=0.015;
      expect(sampleRenderedVehicleSurface(scene,0,0)?.y).toBeCloseTo(0.03,5);
      expect(sampleRenderedVehicleSurface(scene,30,30)).toBeNull();
    }finally{scene.dispose();engine.dispose();}
  });
});
