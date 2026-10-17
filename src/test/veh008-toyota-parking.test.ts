import {describe,it,expect} from "vitest";
import {FIRST_LIGHT_CITY_SPEC} from "../game/world-generation/first-light-spec";
import {planStreetContext} from "../game/world-generation/street-context";
import {
  MERCER_EXTRA_GLB_SPECS,validateMercerExtraPlacements,resolveMercerGLBFit,
} from "../game/vehicles/mercer-additional-parked-glbs-006";
describe("VEH-008 Toyota Hilux static visual parking on Mercer",()=>{
  it("keeps the Range Rover drivable and Toyota solely a visual specimen",()=>{
    const rover=MERCER_EXTRA_GLB_SPECS.find(p=>p.id==="gtd-veh006-mercer-range-rover");
    const toyota=MERCER_EXTRA_GLB_SPECS.find(p=>p.id==="gtd-veh008-mercer-toyota-hilux");
    expect(rover).toBeTruthy();
    expect(rover?.visualOnly).not.toBe(true);
    expect(toyota?.visualOnly).toBe(true);
    expect(toyota?.url).toBe("/toyota%20hilux%20002.glb");
    expect(MERCER_EXTRA_GLB_SPECS).toHaveLength(4);
  });
  it("preserves both new original GLBs without enabling driving",()=>{
    const defender=MERCER_EXTRA_GLB_SPECS.find(p=>p.id==="gtd-veh009-mercer-land-rover-defender");
    const dodge=MERCER_EXTRA_GLB_SPECS.find(p=>p.id==="gtd-veh010-mercer-dodge-hp");
    expect(defender).toMatchObject({
      url:"/Land%20rover%20defender%20001.glb",
      sourceBytesKnown:426228,visualOnly:true,
    });
    expect(dodge).toMatchObject({
      url:"/dodge_HP.glb",sourceBytesKnown:1954504,visualOnly:true,
    });
    expect(new Set(MERCER_EXTRA_GLB_SPECS.map(p=>p.id)).size).toBe(4);
    expect(MERCER_EXTRA_GLB_SPECS.filter(p=>p.visualOnly!==true)).toHaveLength(1);
  });
  it("checks all four imported specimens against Mercer road/props and mutual clearances",()=>{
    const plan=planStreetContext(FIRST_LIGHT_CITY_SPEC);
    const slots=validateMercerExtraPlacements(plan.items);
    expect(slots).toHaveLength(4);
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
