import {describe,it,expect} from "vitest";
import {MeshBuilder,NullEngine,Scene,TransformNode} from "@babylonjs/core";
import {extraDriveName,extraDriveProfile,prepareNativeFleetWheelRig}
  from "../game/vehicles/ambient-fleet-driving-011";
import {MERCER_EXTRA_GLB_SPECS} from "../game/vehicles/mercer-additional-parked-glbs-006";
import {StreetVehicleWheelRig} from "../game/vehicles/street-vehicle-wheels";
import {evaluateWheelRigAdmission} from "../game/vehicles/mvrs-wheel-admission-001";

describe("VEH-015 BMW M4 and original Lamborghini Temerario wheel-qualified drive onboarding",()=>{
  const placements=[
    ["gtd-veh014-mercer-bmw-m4","BMW M4","/bmw_m4_competition_m_package%20(1).glb",-25.95],
    ["gtd-veh014-mercer-lamborghini-temerario","Lamborghini Temerario","/Lamborghini%2BTemerario.glb",-47.55],
  ] as const;
  it("registers both locally supplied originals for the inherited +Z driving actor",()=>{
    for(const [id,name,url,x] of placements){
      const p=MERCER_EXTRA_GLB_SPECS.find(p=>p.id===id);
      expect(p).toMatchObject({url,x,z:10.55,yaw:Math.PI/2,visualOnly:false});
      expect(extraDriveName(id)).toBe(name);
      expect(extraDriveProfile(name).forwardAxisSign).toBe(1);
    }
  });
  it("uses all four actual tagged Lamborghini control hierarchies without creating synthetic wheels",()=>{
    const engine=new NullEngine(),scene=new Scene(engine);
    const root=new TransformNode("temerario",scene);
    try{
      const ctrl=["CTRL_Wheel_FL","CTRL_Wheel_FR","CTRL_Wheel_RL","CTRL_Wheel_RR"];
      for(let i=0;i<ctrl.length;i++){
        const node=new TransformNode("source:"+ctrl[i],scene);
        node.parent=root;
        const tire=MeshBuilder.CreateCylinder("original-tire:"+ctrl[i],
          {diameter:.68,height:.27,tessellation:24},scene);
        tire.parent=node;
        tire.rotation.x=Math.PI/2;
        node.position.set(i<2?-1.18:1.2,.35,i%2===0?.84:-.84);
      }
      const body=MeshBuilder.CreateBox("original-body",{width:1.9,height:1.25,depth:4.8},scene);
      body.parent=root;
      const candidate=prepareNativeFleetWheelRig(root,"Lamborghini Temerario");
      expect(candidate.identified).toBe(4);
      expect(candidate.missing).toEqual([]);
      expect(candidate.mapping.spinAxis).toBe("z");
      expect(candidate.mapping.wheelNames.frontLeft).toBe("CTRL_Wheel_FL");
      expect(root.getDescendants(false).filter(n=>n.name.startsWith("veh011-hub"))).toHaveLength(0);
      expect(evaluateWheelRigAdmission(root,candidate.mapping,null,true))
        .toMatchObject({qualified:true,wheelCount:4});
      const rig=new StreetVehicleWheelRig(root,candidate.mapping);
      expect(rig.ready).toBe(true);
      rig.update(.75,.24);
      const front=root.getDescendants(false).find(n=>n.name==="source:CTRL_Wheel_FL") as TransformNode;
      const rear=root.getDescendants(false).find(n=>n.name==="source:CTRL_Wheel_RL") as TransformNode;
      expect(front.rotationQuaternion).not.toBeNull();
      expect(rear.rotationQuaternion).not.toBeNull();
      expect(front.rotationQuaternion!.equals(rear.rotationQuaternion!)).toBe(false);
      expect(body.rotationQuaternion).toBeNull();
      rig.update(-.4,-.18);
      rig.dispose();
    }finally{root.dispose();scene.dispose();engine.dispose();}
  });
  it("requires all four nonempty source-backed BMW MVRS pivots before drive handoff",()=>{
    const engine=new NullEngine(),scene=new Scene(engine);
    const root=new TransformNode("BMW",scene);
    try{
      const corners=["frontLeft","frontRight","rearLeft","rearRight"] as const;
      const pivots=corners.map((corner,i)=>{
        const node=new TransformNode("source:MVRS_bmw-m4-competition_"+corner+"_PIVOT",scene);
        node.parent=root;
        node.position.set(i%2===0?.82:-.82,.33,i<2?1.28:-1.28);
        MeshBuilder.CreateCylinder("real-source-wheel-"+corner,
          {height:.26,diameter:.68,tessellation:20},scene).parent=node;
        return node;
      });
      const ready=prepareNativeFleetWheelRig(root,"BMW M4");
      expect(ready.identified).toBe(4);
      expect(ready.mapping.spinAxis).toBe("x");
      expect(evaluateWheelRigAdmission(root,ready.mapping,null,true))
        .toMatchObject({qualified:true,wheelCount:4});
      pivots[3]!.getChildMeshes().forEach(m=>m.dispose());
      expect(evaluateWheelRigAdmission(root,ready.mapping,null,true))
        .toMatchObject({qualified:false,code:"wheel-pivot-without-real-mesh"});
    }finally{root.dispose();scene.dispose();engine.dispose();}
  });
  it("rejects unrigged, combined car geometry for either new source",()=>{
    const engine=new NullEngine(),scene=new Scene(engine);
    const root=new TransformNode("bad-asset",scene);
    try{
      MeshBuilder.CreateBox("body-and-static-wheels",{width:2,height:1.5,depth:4.5},scene).parent=root;
      for(const name of ["BMW M4","Lamborghini Temerario"] as const)
        expect(prepareNativeFleetWheelRig(root,name).identified).toBe(0);
    }finally{root.dispose();scene.dispose();engine.dispose();}
  });
});
