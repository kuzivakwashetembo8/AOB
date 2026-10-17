import {describe,expect,it} from "vitest";
import {Matrix,MeshBuilder,NullEngine,Scene,TransformNode} from "@babylonjs/core";
import {stepDriveControl} from "../game/vehicles/drive-kinematics";
import {StreetVehicleWheelRig} from "../game/vehicles/street-vehicle-wheels";
import {Vector3} from "@babylonjs/core";
import {streetVehicleForwardVelocity} from "../game/vehicles/street-vehicle-physics";
import {nearestSportsCar,stationaryDisembark} from "../game/vehicles/local-boarding";
import {
  RANGE_ROVER_STREET_PROFILE,rangeRoverDriverSeatWorldPose,
  discoverRangeRoverWheelMapping,rangeRoverRearCameraAlpha,
  planRangeRoverFootwellTargets,planRangeRoverSoleLift,
  prepareRangeRoverWheelRig,RANGE_ROVER_HUB_PIVOTS,
  RANGE_ROVER_SOURCE_WHEEL_NAMES,rangeRoverDriveEnabled,
} from "../game/vehicles/range-rover-drive-007";
import {FERRARI_STREET_PROFILE} from "../game/vehicles/street-vehicle-physics";

describe("VEH007 Range Rover uses shared Ferrari/Buggy driving foundation",()=>{
  const dt=1/60;
  it("loads the owner-approved Rover on plain /game with no URL parameters",()=>{
    expect(rangeRoverDriveEnabled(new URLSearchParams())).toBe(true);
    expect(rangeRoverDriveEnabled(new URLSearchParams("?gtdSedanParked006=0"))).toBe(true);
    expect(rangeRoverDriveEnabled(new URLSearchParams("?utm_source=chatgpt"))).toBe(true);
    expect(rangeRoverDriveEnabled(new URLSearchParams("?gtdRangeRoverDrive=1"))).toBe(true);
    expect(rangeRoverDriveEnabled(new URLSearchParams("?gtdRangeRoverDrive=0"))).toBe(false);
    expect(rangeRoverDriveEnabled(new URLSearchParams("?gtdRangeRoverDrive=0&gtdSeat001=1"))).toBe(false);
  });
  it("provides a real SUV-specific forward axis without modifying Ferrari physics",()=>{
    expect(RANGE_ROVER_STREET_PROFILE.forwardAxisSign).toBe(1);
    expect(FERRARI_STREET_PROFILE.forwardAxisSign).toBe(-1);
    expect(RANGE_ROVER_STREET_PROFILE.classId).toBe("range-rover-sport-2018");
    const forward=streetVehicleForwardVelocity(Math.PI/2,5,RANGE_ROVER_STREET_PROFILE);
    const ferrari=streetVehicleForwardVelocity(Math.PI/2,5,FERRARI_STREET_PROFILE);
    expect(forward.x).toBeCloseTo(5);
    expect(ferrari.x).toBeCloseTo(-5);
  });
  it("inherits accelerating, braking, reversing and turning at 60 Hz",()=>{
    let state={speedMps:0,steeringRadians:0};
    for(let i=0;i<90;i++)
      state=stepDriveControl(state,{throttle:1,steering:1},dt);
    expect(state.speedMps).toBeGreaterThan(6);
    expect(state.steeringRadians).toBeGreaterThan(0);
    for(let i=0;i<120;i++)
      state=stepDriveControl(state,{throttle:-1,steering:0},dt);
    expect(state.speedMps).toBeLessThan(0);
    for(let i=0;i<120;i++)
      state=stepDriveControl(state,{throttle:0,steering:0},dt);
    expect(state.speedMps).toBe(0);
  });
  it("boards only nearby cars; no teleport to a remote Range Rover",()=>{
    const actor={x:-5.1,y:.92,z:7.8};
    const rover={id:"gtd-veh006-mercer-range-rover",
      pose:{x:-5.45,y:.9,z:10.55}};
    const remote={id:"Ferrari Foundry",pose:{x:18,y:.9,z:46}};
    expect(nearestSportsCar(actor,[remote,rover])?.id).toBe(rover.id);
    expect(nearestSportsCar({x:20,y:.92,z:9},[rover])).toBeNull();
    expect(stationaryDisembark(actor,rover.pose,{...rover.pose})).toEqual(actor);
  });
  it("places the follow camera BEHIND the SUV rather than Ferrari's -Z nose",()=>{
    // A standard +Z SUV must orbit from the opposite side of a -Z Ferrari.
    for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
      const rover=rangeRoverRearCameraAlpha(yaw);
      const ferrari=Math.PI/2-yaw;
      expect(Math.cos(rover-ferrari)).toBeCloseTo(-1);
    }
  });
  it("positions the driver inside the SUV, facing its +Z forward axis",()=>{
    const pose={x:-5.45,y:0,z:10.55,yaw:Math.PI/2};
    const seat=rangeRoverDriverSeatWorldPose(pose,{x:2,y:1.8,z:4.8});
    expect(seat.x).toBeGreaterThan(pose.x);
    expect(seat.y).toBeCloseTo(1.8*.57);
    expect(seat.yaw).toBeCloseTo(pose.yaw);
    expect(()=>rangeRoverDriverSeatWorldPose(pose,{x:0,y:1,z:4})).toThrow();
  });
  it("binds all four independently named source GLB wheels to the generic rig",()=>{
    const e=new NullEngine(),scene=new Scene(e),anchor=new TransformNode("SUV",scene);
    try{
      for(const [x,z,name] of [
        [.85,1.45,"FL Wheel"],[-.85,1.45,"FR Wheel"],
        [.85,-1.5,"BL Wheel"],[-.85,-1.5,"BR Wheel"],
      ] as const){
        const wheel=MeshBuilder.CreateCylinder(name,{
          height:.25,diameter:.7,tessellation:20,
        },scene);
        wheel.parent=anchor;wheel.position.set(x,.38,z);
      }
      for(const name of ["FL Brake","FR Brake"]){
        const brake=MeshBuilder.CreateBox(name,{size:.1},scene);
        brake.parent=anchor;
      }
      const body=MeshBuilder.CreateBox("Body",{width:2,height:1,depth:4},scene);
      body.parent=anchor;
      anchor.computeWorldMatrix(true);
      const evidence=discoverRangeRoverWheelMapping(anchor);
      expect(evidence.identified).toBe(4);
      expect(evidence.missing).toEqual([]);
      expect(evidence.mapping.wheelNames).toEqual(RANGE_ROVER_SOURCE_WHEEL_NAMES);
      expect(evidence.mapping.spinAxis).toBe("z");
      expect(evidence.mapping.steerAxis).toBe("y");
      const rig=new StreetVehicleWheelRig(anchor,evidence.mapping);
      expect(rig.ready).toBe(true);
      expect(rig.wheelCount).toBe(4);
      expect(rig.absentNames).toEqual([]);
      const beforeBrake=scene.getMeshByName("FL Brake")!.rotationQuaternion;
      rig.update(.82,.28);
      const fl=scene.getMeshByName("FL Wheel")!,bl=scene.getMeshByName("BL Wheel")!;
      expect(fl.rotationQuaternion).toBeTruthy();
      expect(bl.rotationQuaternion).toBeTruthy();
      expect(fl.rotationQuaternion!.equals(bl.rotationQuaternion!)).toBe(false);
      expect(fl.rotationQuaternion!.z).not.toBe(0);
      expect(bl.rotationQuaternion!.z).not.toBe(0);
      expect(scene.getMeshByName("FL Brake")!.rotationQuaternion).toBe(beforeBrake);
      rig.dispose();
    }finally{anchor.dispose();scene.dispose();e.dispose();}
  });
  it("uses bounded SUV foot targets inside the body above the rocker / road",()=>{
    const vehicle={x:-5.45,y:0,z:10.55,yaw:Math.PI/2};
    const dimensions={x:2.03,y:1.8,z:4.85};
    const poses=[
      {leftHip:new Vector3(-4.85,1.2,10.10),
       rightHip:new Vector3(-4.85,1.2,10.58)},
      {leftHip:new Vector3(-5.10,1.2,10.30),
       rightHip:new Vector3(-5.10,1.2,10.76)},
    ];
    for(const hips of poses){
      const result=planRangeRoverFootwellTargets({
        vehicle,dimensions,...hips,
      });
      expect(result.minFootwellY).toBeCloseTo(dimensions.y*.37);
      for(const t of [result.leftFoot,result.rightFoot]){
        const localX=-(t.z-vehicle.z),localZ=t.x-vehicle.x;
        expect(Math.abs(localX)).toBeLessThanOrEqual(dimensions.x*.32+.001);
        expect(localZ).toBeGreaterThanOrEqual(-dimensions.z*.05-.001);
        expect(localZ).toBeLessThanOrEqual(dimensions.z*.27+.001);
        expect(t.y).toBeGreaterThan(.60);
      }
    }
    expect(()=>planRangeRoverFootwellTargets({
      vehicle:{...vehicle,yaw:NaN},dimensions,
      leftHip:new Vector3(0,1,0),rightHip:new Vector3(0,1,0),
    })).toThrow();
  });
  it("fails closed when source wheels have no independent pivots",()=>{
    const e=new NullEngine(),scene=new Scene(e),anchor=new TransformNode("SUV",scene);
    try{
      MeshBuilder.CreateBox("car-with-baked-wheels",{
        width:2,height:1.5,depth:4.8,
      },scene).parent=anchor;
      const evidence=discoverRangeRoverWheelMapping(anchor);
      expect(evidence.identified).toBe(0);
      expect(evidence.missing).toHaveLength(4);
    }finally{anchor.dispose();scene.dispose();e.dispose();}
  });
  it("reparents all four AUTHENTIC offset-origin wheels around true hubs, retaining geometry",()=>{
    const engine=new NullEngine(),scene=new Scene(engine);
    const anchor=new TransformNode("Rover",scene);
    try{
      const positions=[
        [.82,1.48,"FL Wheel"],[-.82,1.48,"FR Wheel"],
        [.82,-1.47,"BL Wheel"],[-.82,-1.47,"BR Wheel"],
      ] as const;
      const before=new Map<string,Vector3>();
      for(const [x,z,name] of positions){
        const tire=MeshBuilder.CreateCylinder(name,{height:.23,diameter:.75,tessellation:32},scene);
        tire.parent=anchor;
        tire.rotation.x=Math.PI/2;
        tire.position.set(x,.46,z);
        // GLB mesh data may be stored offset from its transform origin.
        // The old strict original-pivot test rejects this real wheel.
        tire.bakeTransformIntoVertices(Matrix.Translation(.42,0,0));
        tire.computeWorldMatrix(true);
        before.set(name,tire.getBoundingInfo().boundingBox.centerWorld.clone());
      }
      const rejected=discoverRangeRoverWheelMapping(anchor);
      expect(rejected.identified).toBeLessThan(4);
      const prepared=prepareRangeRoverWheelRig(anchor);
      expect(prepared.identified).toBe(4);
      expect(prepared.missing).toEqual([]);
      expect(prepared.mapping.wheelNames).toEqual(RANGE_ROVER_HUB_PIVOTS);
      for(const [,,name] of positions){
        const tire=scene.getMeshByName(name)!;
        tire.computeWorldMatrix(true);
        expect(Vector3.Distance(
          tire.getBoundingInfo().boundingBox.centerWorld,before.get(name)!,
        )).toBeLessThan(.0001);
      }
      const rig=new StreetVehicleWheelRig(anchor,prepared.mapping);
      expect(rig.ready).toBe(true);
      expect(rig.wheelCount).toBe(4);
      rig.update(.67,.24);
      const front=anchor.getDescendants(false).find(x=>x.name==="veh007-hub-front-left") as TransformNode;
      const rear=anchor.getDescendants(false).find(x=>x.name==="veh007-hub-rear-left") as TransformNode;
      expect(front.rotationQuaternion).not.toBeNull();
      expect(rear.rotationQuaternion).not.toBeNull();
      expect(front.rotationQuaternion!.equals(rear.rotationQuaternion!)).toBe(false);
      rig.dispose();
    }finally{anchor.dispose();scene.dispose();engine.dispose();}
  });
  it("uses measured sole clearance, bounded to 7.5 cm per sample and 46 cm total",()=>{
    const p={anchorY:0,bodyHeight:1.8,soleY:.10,appliedLift:0};
    expect(planRangeRoverSoleLift(p)).toBeCloseTo(.075);
    expect(planRangeRoverSoleLift({...p,appliedLift:.44})).toBeCloseTo(.02);
    expect(planRangeRoverSoleLift({...p,appliedLift:.46})).toBe(0);
    expect(planRangeRoverSoleLift({...p,soleY:1.04})).toBe(0);
    expect(planRangeRoverSoleLift({...p,soleY:NaN})).toBe(0);
    expect(planRangeRoverSoleLift({...p,bodyHeight:0})).toBe(0);
  });

});
