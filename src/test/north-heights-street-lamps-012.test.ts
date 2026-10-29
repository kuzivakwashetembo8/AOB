import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {NORTH_HEIGHTS_COORDS} from "../game/world-generation/north-heights-location-009";
import {planNorthHeightsStreetLamps012} from "../game/experiments/north-heights-street-lamps-012";

const source=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");
describe("NH-LAMP-012 owner GLB citywide streetlight infrastructure",()=>{
  const placements=planNorthHeightsStreetLamps012();
  it("covers all 22 road axes with 359 stable unique physical positions",()=>{
    expect(NORTH_HEIGHTS_COORDS).toHaveLength(11);
    expect(placements).toHaveLength(359);
    expect(new Set(placements.map(p=>p.id)).size).toBe(359);
    expect(placements.filter(p=>p.context==="road")).toHaveLength(330);
    expect(placements.filter(p=>p.context==="junction")).toHaveLength(11);
    expect(placements.filter(p=>p.context==="parking")).toHaveLength(8);
    expect(placements.filter(p=>p.context==="park")).toHaveLength(10);
    expect(new Set(placements.map(p=>p.kind))).toEqual(new Set(["modern","medellin"]));
  });
  it("has no near-duplicate poles and no main-lane or sidewalk poles",()=>{
    for(let i=0;i<placements.length;i++){
      const a=placements[i]!;
      expect(a.x).toBeGreaterThanOrEqual(-320);
      expect(a.x).toBeLessThanOrEqual(320);
      expect(a.z).toBeGreaterThanOrEqual(-320);
      expect(a.z).toBeLessThanOrEqual(320);
      if(a.context==="road"||a.context==="junction"){
        const nearestRoadAxis=Math.min(...NORTH_HEIGHTS_COORDS.map(c=>
          Math.min(Math.abs(a.x-c),Math.abs(a.z-c))));
        expect(nearestRoadAxis).toBeGreaterThan(7.75);
      }
      for(let j=0;j<i;j++){
        const b=placements[j]!;
        expect((a.x-b.x)**2+(a.z-b.z)**2).toBeGreaterThanOrEqual(8.5**2);
      }
    }
  });
  it("adjusts selected roadside positions away from existing trees",()=>{
    const tree={x:-310.7,z:-302};
    const altered=planNorthHeightsStreetLamps012([tree]);
    expect(altered).toHaveLength(359);
    const nearest=Math.min(...altered.map(p=>Math.hypot(p.x-tree.x,p.z-tree.z)));
    expect(nearest).toBeGreaterThanOrEqual(3.5);
  });
  it("removes old procedural poles while retaining North Heights driving and NPCs",()=>{
    const reconstruction=source("src/game/experiments/north-heights-reconstruction-001.ts");
    const scene=source("src/game/experiments/north-heights-city-8.ts");
    const lamps=source("src/game/experiments/north-heights-street-lamps-012.ts");
    expect(reconstruction).not.toContain("addStreetFurniture(city)");
    expect(reconstruction).not.toContain('city.box("metal",poleX');
    expect(scene).toContain("loadNorthHeightsStreetLamps012");
    expect(scene).toContain("lampHandle?.update(camera.position,dt)");
    expect(scene).toContain("NH012TrafficSimulator");
    expect(scene).toContain("NorthHeightsPedestrianSimulator001");
    expect(lamps).toContain('modern:"Modern Street Lamp.glb"');
    expect(lamps).toContain('medellin:"Medellin Street Lamp Optimized.glb"');
    expect(lamps).toContain('thinInstanceSetBuffer("matrix"');
    expect(lamps).toContain("length:mobile?2:3");
    expect(lamps).not.toContain("addStaticBox(");
  });
});
