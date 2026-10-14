import {describe,it,expect} from "vitest";
import {NullEngine,Scene} from "@babylonjs/core";
import {FIRST_LIGHT_CITY_SPEC} from "../game/world-generation/first-light-spec";
import {planGroundLandUse,pondHeight,LAND_FINISHES} from "../game/world-generation/ground-land-use";
import {buildGroundLandPixels} from "../game/world-generation/ground-land-surface";
import {createGeneratedStreetContext} from "../game/world-generation/street-context-renderer";
import {createGeneratedUrbanSurfaces} from "../game/world-generation/urban-surface-renderer";
import {MeridianPhysics} from "../game/physics/rapier-world";
import {createGeneratedFirstLightWorld} from "../game/world/generated-first-light-world";

const area={left:-80,right:80,north:-45,south:85};
const classes=(p:ReturnType<typeof planGroundLandUse>,names:string[])=>
  names.reduce((sum,name)=>sum+p.counts[name as keyof typeof p.counts],0);
describe("GROUND-003 corrective acceptance constraints",()=>{
  it("assigns at least as much hardscape as grass and retains actual parking",()=>{
    const p=planGroundLandUse(FIRST_LIGHT_CITY_SPEC,area);
    const paved=classes(p,["PAV-01","PAV-02","PAV-03","PAV-04","PRK-01","PRK-02","SRV-01"]);
    const grass=classes(p,["GRN-01","GRN-02","GRN-03"]);
    expect(paved).toBeGreaterThan(grass);
    expect(p.counts["PRK-01"]+p.counts["PRK-02"]).toBeGreaterThan(20);
    expect(p.counts["GRN-01"]).toBeGreaterThan(40);
    expect(Object.values(p.counts).reduce((a,b)=>a+b,0)).toBe(160*130);
  });
  it("has a clearance-checked ellipse with real torso-depth terrain, not painted water",()=>{
    const p=planGroundLandUse(FIRST_LIGHT_CITY_SPEC,area);
    const pond=p.basins.find(b=>b.kind==="WTR-01");
    expect(pond).toBeDefined();
    if(!pond)throw Error("pond missing");
    expect(pond.depth).toBeGreaterThanOrEqual(1.45);
    expect(pondHeight(pond,pond.x,pond.z)).toBeCloseTo(-pond.depth,2);
    expect(pondHeight(pond,pond.x+pond.rx,pond.z)).toBeCloseTo(0,2);
    expect(pondHeight(pond,pond.x+pond.rx*0.55,pond.z)).toBeLessThan(-0.05);
    expect(pond.x-pond.rx).toBeGreaterThan(area.left);
    expect(pond.z+pond.rz).toBeLessThan(area.south);
  });
  it("preserves every approved catalogue ID and renders opaque detailed grass",()=>{
    const p=planGroundLandUse(FIRST_LIGHT_CITY_SPEC,area),texture=buildGroundLandPixels(p);
    expect(LAND_FINISHES).toHaveLength(13);
    expect(texture.width).toBe(1280);
    const x=5*8+1,z=20*8+1,base=(z*texture.width+x)*4;
    expect(texture.pixels[base+3]).toBe(255);
    expect(texture.pixels.length).toBe(texture.width*texture.height*4);
  });
  it("omits the old public-green island but retains the same park objects",()=>{
    const engine=new NullEngine(),scene=new Scene(engine);
    try {
      const park=createGeneratedStreetContext(scene,FIRST_LIGHT_CITY_SPEC,{skipPocketParkGround:true});
      expect(park.meshes.some(m=>m.name.startsWith("generated-public-space:"))).toBe(false);
      expect(park.meshes.some(m=>m.name.startsWith("generated-grass-variation:"))).toBe(false);
      expect(park.itemCount).toBeGreaterThan(0);
      park.dispose();
    }finally{scene.dispose();engine.dispose();}
  });
  it("extends both arterials as unblocked mouths of the 160m playable slice",()=>{
    const engine=new NullEngine(),scene=new Scene(engine);
    try{
      const result=createGeneratedUrbanSurfaces(scene,FIRST_LIGHT_CITY_SPEC,
        {skipLegacyParcelInfill:true});
      const names=["generated-parity-main-road","generated-parity-rear-road"];
      for(const name of names){
        const road=result.meshes.find(m=>m.name===name);
        expect(road).toBeDefined();
        if(!road)continue;
        road.computeWorldMatrix(true);
        const bb=road.getBoundingInfo().boundingBox;
        expect(bb.maximumWorld.x-bb.minimumWorld.x).toBeGreaterThanOrEqual(159.8);
      }
      result.dispose();
    }finally{scene.dispose();engine.dispose();}
  });
  it("matches terrain mesh depth and its collider without deleting Voight or garage support",async()=>{
    const engine=new NullEngine(),scene=new Scene(engine);
    const physics=await MeridianPhysics.create();
    try{
      const world=createGeneratedFirstLightWorld(scene,physics,{enableLandUsePreview:true,
        enableShadows:false});
      const mesh=scene.getMeshByName("generated-first-light-ground");
      expect(mesh).toBeDefined();
      expect(mesh?.getTotalVertices()).toBeGreaterThan(10000);
      expect(scene.getMeshByName("ground003-water:WTR-01")).toBeDefined();
      expect(scene.meshes.filter(m=>m.name.startsWith("generated-public-space:"))).toHaveLength(0);
      expect(world.buildings).toHaveLength(10);
      world.dispose();
    }finally{scene.dispose();physics.destroy();engine.dispose();}
  });
});
