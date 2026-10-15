import { describe,expect,it } from "vitest";
import { MeshBuilder,NullEngine,Scene,TransformNode } from "@babylonjs/core";
import { FERRARI_WHEEL_MAPPING,StreetVehicleWheelRig } from "../game/vehicles/street-vehicle-wheels";

function fixture(){
  const engine=new NullEngine(),scene=new Scene(engine);
  const anchor=new TransformNode("vehicle",scene);
  for(const [i,name] of ["wheel_fl","wheel_fr","wheel_rl","wheel_rr"].entries()){
    const wheel=new TransformNode("source:"+name,scene);
    wheel.parent=anchor;wheel.position.set(i%2?0.7:-0.7,0.35,i<2?-1.2:1.2);
    const tread=MeshBuilder.CreateCylinder("tread:"+name,
      {diameter:0.64,height:0.18},scene);
    tread.rotation.x=Math.PI/2;tread.parent=wheel;
  }
  const rig=new StreetVehicleWheelRig(anchor,FERRARI_WHEEL_MAPPING);
  return {engine,scene,anchor,rig,dispose(){rig.dispose();scene.dispose();engine.dispose();}};
}
describe("VEH-FIT-002 G3 isolated suspension visual contact",()=>{
  it("calibrates full-car collider against four real tire bottoms",()=>{
    const f=fixture();
    try{
      expect(f.rig.ready).toBe(true);
      expect(f.rig.contactTreadFloorRelativeToAnchor()).toBeCloseTo(0.03,2);
    }finally{f.dispose();}
  });
  it("moves curb-side wheels independently without shifting chassis or other side",()=>{
    const f=fixture();
    try{
      const startY=f.anchor.position.y;
      for(let t=0;t<25;t++)
        f.rig.alignVisualWheelContacts(1/60,(p)=>p.x<0?0.11:0,true);
      const travels=f.rig.visualWheelTravelMetres;
      expect(travels).toHaveLength(4);
      expect(travels[0]!.travel).toBeGreaterThan(0.055);
      expect(travels[1]!.travel).toBeLessThan(travels[0]!.travel);
      expect(Math.max(...travels.map(w=>Math.abs(w.travel)))).toBeLessThanOrEqual(0.13);
      expect(f.anchor.position.y).toBe(startY);
      f.rig.alignVisualWheelContacts(1/60,()=>null,false);
      expect(f.rig.visualWheelTravelMetres[0]!.travel).toBeLessThan(travels[0]!.travel);
    }finally{f.dispose();}
  });
});
