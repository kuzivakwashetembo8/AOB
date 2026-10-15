import {describe,expect,it} from "vitest";
import {MeshBuilder,NullEngine,Scene,StandardMaterial,TransformNode,Vector3} from "@babylonjs/core";
import {VehicleCabinFloor,planSoleClearance,FERRARI_CABIN_003} from "../game/vehicles/vehicle-cabin-envelope";

describe("VEH-CABIN-FIT-003 specimen-specific interior floor geometry",()=>{
  it("identifies an actual Ferrari carpet mesh, not exterior bounds",()=>{
    const engine=new NullEngine(),scene=new Scene(engine);
    const car=new TransformNode("car",scene);
    const floor=MeshBuilder.CreateGround("source:carpet",
      {width:1.2,height:1.7},scene);
    floor.parent=car;floor.position.y=0.24;
    const mat=new StandardMaterial("Carpet",scene);floor.material=mat;
    const profile=VehicleCabinFloor.fromVehicle(car,"ferrari");
    expect(profile.status().evidence).toBe("verified-floor-mesh");
    expect(profile.status().triangleCount).toBeGreaterThan(0);
    expect(profile.sample(new Vector3(0,0,-0.2)).floorY).toBeCloseTo(0.24,5);
    car.position.y=2.0;car.rotation.y=0.4;
    expect(profile.sample(new Vector3(0,2,-0.1)).floorY).toBeCloseTo(2.24,5);
    scene.dispose();engine.dispose();
  });
  it("rejects unsupported Buggy rather than inheriting Ferrari's floor",()=>{
    const engine=new NullEngine(),scene=new Scene(engine);
    const car=new TransformNode("buggy",scene);
    const p=VehicleCabinFloor.fromVehicle(car,"buggy");
    expect(p.status().evidence).toBe("uncalibrated-vehicle");
    expect(p.sample(Vector3.Zero()).floorY).toBeNull();
    scene.dispose();engine.dispose();
  });
  it("does not invent a floor outside the imported carpet triangle footprint",()=>{
    const engine=new NullEngine(),scene=new Scene(engine);
    const car=new TransformNode("car",scene);
    const mesh=MeshBuilder.CreateGround("carpet",
      {width:1,height:1},scene);mesh.parent=car;mesh.position.y=0.3;
    mesh.material=new StandardMaterial("Carpet",scene);
    const p=VehicleCabinFloor.fromMesh(car,mesh,FERRARI_CABIN_003);
    expect(p.sample(new Vector3(3,0,0)).evidence).toBe("outside-floor-footprint");
    expect(p.sample(new Vector3(3,0,0)).floorY).toBeNull();
    scene.dispose();engine.dispose();
  });
});

describe("VEH-CABIN-FIT-003 conservative boot clearance policy",()=>{
 it("plans only a small bounded increase from actual sole and floor coordinates",()=>{
   const step=planSoleClearance(0.222,0.249,0.010,0.080,0);
   expect(step.kind).toBe("adjust");
   expect(step.lift).toBeCloseTo(0.037,6);
 });
 it("preserves accepted AR1 when geometry is missing, already clear, or deeply displaced",()=>{
   expect(planSoleClearance(NaN,0.24,0.01,0.08,0).kind).toBe("unverified");
   expect(planSoleClearance(0.28,0.24,0.01,0.08,0).kind).toBe("clear");
   expect(planSoleClearance(0.09,0.24,0.01,0.08,0).kind).toBe("too-deep");
   expect(planSoleClearance(0.22,0.24,0.01,0.08,0.07).kind).toBe("limit-reached");
 });
});
