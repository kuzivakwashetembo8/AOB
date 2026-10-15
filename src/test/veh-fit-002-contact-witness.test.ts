import { describe, expect, it } from "vitest";
import { MeshBuilder, NullEngine, Scene, TransformNode } from "@babylonjs/core";
import { MeridianPhysics } from "../game/physics/rapier-world";
import { FirstDriveTrial } from "../game/vehicles/first-drive-trial";
import { FERRARI_STREET_PROFILE } from "../game/vehicles/street-vehicle-physics";
import { FERRARI_WHEEL_MAPPING } from "../game/vehicles/street-vehicle-wheels";
import { measureVehicleFit002 } from "../game/vehicles/vehicle-fit-diagnostics";

describe("VEH-FIT-002 G0 actual world contact witnesses", () => {
  it("keeps the G0 report strictly disabled unless explicitly requested", () => {
    const scene = new Scene(new NullEngine());
    try {
      const report = measureVehicleFit002(scene, null, null, false);
      expect(report.enabled).toBe(false);
      expect(report.available).toBe(false);
    } finally { scene.getEngine().dispose(); scene.dispose(); }
  });
  it("measures signed tread-to-visual asphalt gap separately from Rapier floor", async () => {
    const engine = new NullEngine(), scene = new Scene(engine);
    const physics = await MeridianPhysics.create();
    physics.setPlayerPosition({ x: 30, y: 0.92, z: 30 });
    const ground = physics.addStaticBox({ x: 0, y: -0.12, z: 0 },
      { x: 20, y: 0.12, z: 20 });
    const road = MeshBuilder.CreateBox("generated-parity-main-road",
      { width: 20, height: 0.03, depth: 10 }, scene);
    road.position.y = 0.015;
    const anchor = new TransformNode("ferrari", scene);
    for (const [i, name] of ["wheel_fl", "wheel_fr", "wheel_rl", "wheel_rr"].entries()) {
      const pivot = new TransformNode("vehicle-probe:ferrari:" + name, scene);
      pivot.parent = anchor;
      pivot.position.set(i % 2 ? -0.7 : 0.7, 0.32, i < 2 ? -1.5 : 1.5);
      const tire = MeshBuilder.CreateCylinder("tire:" + name,
        { diameter: 0.64, height: 0.18 }, scene);
      tire.parent = pivot;
      tire.rotation.x = Math.PI / 2;
    }
    const car = new FirstDriveTrial(physics, anchor, { x: 2, y: 1.5, z: 4.53 });
    // Rapier 0.21 updates broad-phase/query state on a physics tick.
    physics.movePlayer({ x: 0, y: 0, z: 0 });
    try {
      const actual = measureVehicleFit002(scene, car, null, true);
      expect(actual.available).toBe(true);
      if (!("wheelContact" in actual)) throw new Error("Expected wheel witness");
      expect(actual.wheelContact).toHaveLength(4);
      for (const wheel of actual.wheelContact) {
        expect(wheel.supportStatus).toBe("measured");
        expect(wheel.roadVisualTopY).toBeCloseTo(0.03, 5);
        expect(wheel.collisionTopY).toBeCloseTo(0, 5);
        expect(wheel.colliderRoadDeltaMetres).toBeCloseTo(0.03, 5);
        expect(wheel.visualTreadGapMetres).toBeCloseTo(-0.03, 5);
      }
    } finally {
      car.dispose(); ground.dispose(); physics.destroy();
      scene.dispose(); engine.dispose();
    }
  }, 30000);
  it("aligns real-wheel chassis origin only when G3 is enabled",async()=>{
    const engine=new NullEngine(),scene=new Scene(engine);
    const physics=await MeridianPhysics.create();
    physics.setPlayerPosition({x:30,y:0.92,z:30});
    const floor=physics.addStaticBox({x:0,y:-0.12,z:0},{x:30,y:0.12,z:30});
    const anchor=new TransformNode("real-wheels",scene);
    for(const name of ["wheel_fl","wheel_fr","wheel_rl","wheel_rr"]){
      const pivot=new TransformNode("real:"+name,scene);
      pivot.parent=anchor;
      pivot.position.set(name.endsWith("l")?-0.7:0.7,0.35,
        name.startsWith("wheel_f")?-1.3:1.3);
      const mesh=MeshBuilder.CreateCylinder("tire-"+name,
        {diameter:0.64,height:0.18},scene);
      mesh.parent=pivot;mesh.rotation.x=Math.PI/2;
    }
    const car=new FirstDriveTrial(physics,anchor,{x:2,y:1.5,z:4.53},
      FERRARI_STREET_PROFILE,FERRARI_WHEEL_MAPPING,true,true);
    try{
      expect(car.status.treadAligned).toBe(true);
      expect(car.status.chassisFloorOffsetMetres).toBeCloseTo(0.03,2);
      expect(car.status.visualWheelSupportEnabled).toBe(true);
      expect(car.status.wheelCount).toBe(4);
      expect(car.pose.y).toBeCloseTo(0.75+0.03,2);
    }finally{
      car.dispose();floor.dispose();physics.destroy();scene.dispose();engine.dispose();
    }
  },30000);
});
