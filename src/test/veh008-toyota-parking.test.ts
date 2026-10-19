import {describe,it,expect} from "vitest";
import {FIRST_LIGHT_CITY_SPEC} from "../game/world-generation/first-light-spec";
import {planStreetContext} from "../game/world-generation/street-context";
import {
  MERCER_EXTRA_GLB_SPECS,validateMercerExtraPlacements,resolveMercerGLBFit,
} from "../game/vehicles/mercer-additional-parked-glbs-006";
describe("VEH-011 authentic five-model driving on Mercer",()=>{
  it("keeps Rover and makes the original Hilux drive eligible",()=>{
    const rover=MERCER_EXTRA_GLB_SPECS.find(p=>p.id==="gtd-veh006-mercer-range-rover");
    const toyota=MERCER_EXTRA_GLB_SPECS.find(p=>p.id==="gtd-veh008-mercer-toyota-hilux");
    expect(rover).toBeTruthy();
    expect(rover?.visualOnly).not.toBe(true);
    expect(toyota?.visualOnly).toBe(false);
    expect(toyota?.url).toBe("/toyota%20hilux%20002.glb");
    expect(MERCER_EXTRA_GLB_SPECS).toHaveLength(6);
  });
  it("keeps both new original GLBs drive eligible",()=>{
    const defender=MERCER_EXTRA_GLB_SPECS.find(p=>p.id==="gtd-veh009-mercer-land-rover-defender");
    const dodge=MERCER_EXTRA_GLB_SPECS.find(p=>p.id==="gtd-veh010-mercer-dodge-hp");
    expect(defender).toMatchObject({
      url:"/Land%20rover%20defender%20001.glb",
      sourceBytesKnown:426228,visualOnly:false,
    });
    expect(dodge).toMatchObject({
      url:"/dodge_HP.glb",sourceBytesKnown:1954504,visualOnly:false,
    });
    expect(new Set(MERCER_EXTRA_GLB_SPECS.map(p=>p.id)).size).toBe(6);
    expect(MERCER_EXTRA_GLB_SPECS.filter(p=>p.visualOnly!==true)).toHaveLength(4);
  });
  it("preserves the four existing parked originals and keeps the two new models parked-only",()=>{
    const expectedExisting=[
      ["gtd-veh006-mercer-range-rover",-5.45],
      ["gtd-veh008-mercer-toyota-hilux",-13.45],
      ["gtd-veh009-mercer-land-rover-defender",-31.9],
      ["gtd-veh010-mercer-dodge-hp",-39.7],
    ] as const;
    for(const [id,x] of expectedExisting){
      const original=MERCER_EXTRA_GLB_SPECS.find(p=>p.id===id);
      expect(original).toMatchObject({x,z:10.55,yaw:Math.PI/2});
      expect(original?.visualOnly).not.toBe(true);
    }
    const bmw=MERCER_EXTRA_GLB_SPECS.find(p=>p.id==="gtd-veh014-mercer-bmw-m4");
    const lamborghini=MERCER_EXTRA_GLB_SPECS.find(p=>p.id==="gtd-veh014-mercer-lamborghini-temerario");
    expect(bmw).toMatchObject({
      url:"/bmw_m4_competition_m_package%20(1).glb",
      x:-25.95,z:10.55,visualOnly:true,sourceBytesKnown:1928276,
    });
    expect(lamborghini).toMatchObject({
      url:"/Lamborghini%2BTemerario.glb",
      x:-47.55,z:10.55,visualOnly:true,sourceBytesKnown:4499268,
    });
    const existingCar=planStreetContext(FIRST_LIGHT_CITY_SPEC).items.find(p=>
      p.id==="sw-fl-mercer-west:parked-car:44.5");
    expect(existingCar?.position.x).toBe(-20.5);
    expect(existingCar?.position.z).toBeCloseTo(10.88);
  });
  it("checks all six imported specimens against Mercer road/props and mutual clearances",()=>{
    const plan=planStreetContext(FIRST_LIGHT_CITY_SPEC);
    const slots=validateMercerExtraPlacements(plan.items);
    expect(slots).toHaveLength(6);
    for(const p of slots)expect(p.z).toBe(10.55);
  });
  it("checks actual generated Mercer road/props and a non-overlapping Rover gap",()=>{
    const plan=planStreetContext(FIRST_LIGHT_CITY_SPEC);
    expect(validateMercerExtraPlacements(plan.items)).toEqual(MERCER_EXTRA_GLB_SPECS);
  });
  it("sizes actual Toyota GLB geometry proportionally without procedural car substitution",()=>{
    const p=MERCER_EXTRA_GLB_SPECS[1]!;
    const fit=resolveMercerGLBFit({minX:-2,maxX:2,minY:0,maxY:1.9,minZ:-.95,maxZ:.95},p);
    expect(fit.turn).toBeCloseTo(Math.PI/2);
    expect(fit.scale).toBeGreaterThan(0);
    expect(fit.dimensions.width).toBeLessThanOrEqual(p.width+1e-6);
    expect(fit.dimensions.length).toBeLessThanOrEqual(p.length+1e-6);
  });
});
