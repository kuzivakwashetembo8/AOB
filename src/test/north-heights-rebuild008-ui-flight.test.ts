import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const read=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");
describe("NH-008 district UI parity and third-person flight",()=>{
  it("mounts the existing South Ward GameHud and exact shared settings frame",()=>{
    const route=read("src/routes/north-heights-preview.tsx");
    const session=read("src/ui/game-session.tsx");
    const hud=read("src/ui/hud/game-hud.tsx");
    expect(route).toContain("<GameHud snapshot={snapshot}");
    expect(route).toContain("<GTDSettingsOverlay");
    expect(session).toContain("<GTDSettingsOverlay");
    expect(session).toContain("<GTDSessionPauseActions");
    expect(route).toContain("<GTDSessionPauseActions");
    expect(hud).toContain("Current Meridian location");
    expect(route).not.toContain("nh-top-button");
  });
  it("keeps one shared Rapier capsule driving both flight and walking visuals",()=>{
    const flight=read("src/game/experiments/north-heights-city-8.ts");
    expect(flight).toContain("walk.physics.movePlayer({x:desired.x,y:desired.y,z:desired.z})");
    expect(flight).toContain("actor.updateControlledFlight(position,headingYaw,animation)");
    expect(flight).toContain("humanoid.updateFlightAnimation(animation)");
    // NH-009 applies one terrain-aware chase camera to walking and flight.
    expect(flight).toContain("setCameraAt(position)");
    expect(flight).toContain("resolveNorthHeightsThirdPersonCamera(");
    expect(flight).not.toContain("camera.position.addInPlace(move.normalize()");
    expect(flight).not.toContain("camera.position.copyFrom(anchor)");
  });
  it("uses real park/concrete land-cover and sidewalks without the old paving seams",()=>{
    const world=read("src/game/experiments/north-heights-reconstruction-001.ts");
    const roads=read("src/game/experiments/north-heights-roads-003.ts");
    expect(world).toContain("createNorthHeightsBlockSurfaces008");
    expect(world).not.toContain('["pavement","sidewalk-paving"]');
    // VIS-027-001: the pavement has a genuine underside and sidewalls.
    // The old "no curb strip" assertion prohibited solid curb volume.
    expect(roads).toContain("runStrip(batch.curb");
    expect(roads).toContain("solidSide(wall");
    expect(roads).toContain("roundedJunctionPavement");
    expect(roads).toContain("curbFace(batch.curb");
  });
});
