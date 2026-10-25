import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {normalizeThirdPersonCameraDistance,CAMERA_DISTANCE_DEFAULT} from "../ui/menus/settings-state";
import {resolveNorthHeightsThirdPersonCamera,clampNorthHeightsPitch,clampNorthHeightsActorXZ} from "../game/camera/third-person-camera-constraints";
import {NORTH_HEIGHTS_COORDS,NORTH_HEIGHTS_X_STREETS,NORTH_HEIGHTS_Z_STREETS,northHeightsLocationAt,northHeightsAreaAt} from "../game/world-generation/north-heights-location-009";
import {MERCER_EXTRA_GLB_SPECS} from "../game/vehicles/mercer-additional-parked-glbs-006";
const source=(p:string)=>readFileSync(resolve(process.cwd(),p),"utf8");
describe("NH-009 approval / pure geometry and integration contracts",()=>{
  it("preserves the exactly accepted main reflection code, not GLASS-001/002",()=>{
    const world=source("src/game/experiments/north-heights-reconstruction-001.ts");
    const rejected=["MeridianGlassSystem","glass-day-v2.svg","selectMeridianGlassVariant"];
    for(const marker of rejected)expect(world).not.toContain(marker);
    expect(world).toContain("function createGlassReflection005(scene:Scene):DynamicTexture");
    expect(world).toContain("width:256,height:128");
    expect(world).toContain("mat.alpha = 0.74");
    expect(world).toContain("tex.level=.24");
    expect(world).toContain("fresnel.bias=.08;fresnel.power=2.7");
    expect(world).toContain('material.reflectionTexture=environment');
  });
  it("global camera preference normalizes invalid and legacy values",()=>{
    expect(CAMERA_DISTANCE_DEFAULT).toBe(4.5);
    expect(normalizeThirdPersonCameraDistance(undefined)).toBe(4.5);
    expect(normalizeThirdPersonCameraDistance(Number.NaN)).toBe(4.5);
    expect(normalizeThirdPersonCameraDistance(-5)).toBe(3);
    expect(normalizeThirdPersonCameraDistance(20)).toBe(8);
    expect(normalizeThirdPersonCameraDistance(3.75)).toBe(3.75);
    const editor=source("src/ui/menus/settings-editor.tsx");
    const session=source("src/ui/game-session.tsx");
    expect(editor).toContain('"Camera Distance", 8, 3, " m", .25');
    expect(session).toContain("distanceMeters: settings.thirdPersonCameraDistanceMeters");
  });
  it("never puts camera below actual graded ground or outside city when walking/flying",()=>{
    const terrain=(x:number,z:number)=>4+42*Math.max(0,(z+120)/440)**2+0.02*x;
    for(const yaw of [0,.4,1.6,3.8,5.5])for(const pitch of [-99,-1,0,1,99]){
      const actor={x:27,y:terrain(27,135)+1.12,z:135};
      const camera=resolveNorthHeightsThirdPersonCamera(actor,yaw,pitch,4.5,terrain);
      expect(camera.position.y).toBeGreaterThanOrEqual(terrain(camera.position.x,camera.position.z)+.849);
      expect(camera.position.x).toBeGreaterThanOrEqual(-309);
      expect(camera.position.x).toBeLessThanOrEqual(309);
      expect(camera.position.z).toBeGreaterThanOrEqual(-309);
      expect(camera.position.z).toBeLessThanOrEqual(309);
      expect(Number.isFinite(camera.position.y)).toBe(true);
    }
    expect(clampNorthHeightsPitch(2)).toBe(.46);
    expect(clampNorthHeightsPitch(-2)).toBe(-.57);
    expect(clampNorthHeightsActorXZ(800,-900)).toEqual({x:309,z:-309});
    const blocking=resolveNorthHeightsThirdPersonCamera({x:0,y:2,z:0},0,0,8,()=>0,[
      {x:0,y:2,z:-4,halfX:3,halfY:3,halfZ:1},
    ]);
    expect(blocking.radius).toBeLessThan(8);
  });
  it("covers all 22 unique named axes and all 100 named blocks",()=>{
    expect(NORTH_HEIGHTS_COORDS).toHaveLength(11);
    expect(new Set([...NORTH_HEIGHTS_X_STREETS,...NORTH_HEIGHTS_Z_STREETS]).size).toBe(22);
    const areas=new Set<string>(),blocks=new Set<string>();
    for(let row=1;row<=10;row++)for(let col=1;col<=10;col++){
      const pos={x:-320+(col-.5)*64,z:-320+(row-.5)*64};
      const loc=northHeightsLocationAt(pos);
      expect(loc.blockId).toBe("NH-"+String(row).padStart(2,"0")+"-"+String(col).padStart(2,"0"));
      expect(loc.area).toBe(northHeightsAreaAt(row,col));
      areas.add(loc.area);blocks.add(loc.blockId);
    }
    expect(areas.size).toBe(6);
    expect(blocks.size).toBe(100);
    for(let i=0;i<11;i++){
      const x=northHeightsLocationAt({x:NORTH_HEIGHTS_COORDS[i]!,z:-99});
      const z=northHeightsLocationAt({x:-99,z:NORTH_HEIGHTS_COORDS[i]!});
      expect(x.streetId).toBe("nh-road-x-"+i);
      expect(z.streetId).toBe("nh-road-z-"+i);
    }
  });
  it("loads exactly the six authentic South Ward assets on a single North Heights corridor",()=>{
    expect(MERCER_EXTRA_GLB_SPECS).toHaveLength(6);
    expect(new Set(MERCER_EXTRA_GLB_SPECS.map(spec=>spec.id)).size).toBe(6);
    const city=source("src/game/experiments/north-heights-city-8.ts");
    expect(city).toContain("MERCER_EXTRA_GLB_SPECS.map((spec,index)");
    expect(city).toContain("createMercerExtraParkedGLBs(scene,walk.physics");
    expect(city).toContain("heightAt:(x,z)=>northHeightsGround(x,z)+.075");
    expect(city).toContain("maxConcurrent:mobile?2:3");
    const z=[-119,-110,-101,-92,-83,-74];
    for(let i=1;i<z.length;i++)expect(z[i]! - z[i-1]!).toBeGreaterThan(6);
    const edge=9.65-Math.max(...MERCER_EXTRA_GLB_SPECS.map(s=>s.width))/2;
    expect(edge).toBeGreaterThan(7.75);
    const renderer=source("src/game/experiments/north-heights-reconstruction-001.ts");
    expect(renderer).toContain(".filter(tree=>!(tree.x>7.5");
  });
});
