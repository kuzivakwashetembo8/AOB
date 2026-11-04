import {describe,it,expect} from "vitest";
import {nearestAccessibleCar,nearestAccessiblePlanarCar,unobstructedBoardingLine,accessibleAcrossPlan} from "@/game/vehicles/local-boarding";
import {visibleTouchActions} from "@/ui/hud/touch-controls";
import {northHeightsMapPoint010} from "@/game/experiments/north-heights-map-data-010";
const player={x:0,y:1,z:0},car={id:"accepted",pose:{x:2,y:1,z:0}};
describe("GTD-OPT-010 interaction and cartography contracts",()=>{
  it("hides vehicle action unless unobstructed and close",()=>{
    const wall={x:1,y:1.5,z:0,halfX:.2,halfY:2,halfZ:2};
    expect(unobstructedBoardingLine(player,car.pose,[wall])).toBe(false);
    expect(nearestAccessibleCar(player,[car],[wall])).toBeNull();
    expect(nearestAccessibleCar(player,[car],[])).toEqual(car);
    expect(nearestAccessibleCar(player,[{...car,pose:{x:9,y:1,z:0}}],[])).toBeNull();
  });
  it("respects rotated footprint barriers for South Ward boarding",()=>{
    const wall={x:1,z:0,halfX:.2,halfZ:3,yaw:0};
    expect(accessibleAcrossPlan(player,car.pose,[wall])).toBe(false);
    expect(nearestAccessiblePlanarCar(player,[car],[wall])).toBeNull();
    expect(nearestAccessiblePlanarCar(player,[car],[])).toEqual(car);
  });
  it("shows only implemented, state-compatible, priority controls",()=>{
    const names=(driving:boolean,flying:boolean,near:boolean)=>visibleTouchActions(driving,flying,near).map(x=>x.action);
    expect(names(false,false,false)).not.toContain("vehicle");
    expect(names(false,false,true)).toContain("vehicle");
    expect(names(false,true,false)).toEqual(expect.arrayContaining(["sprint","jump","descend"]));
    expect(names(true,false,false)).toEqual(["vehicle"]);
    expect(names(false,false,false)).toEqual(["jump","sprint","combat"]);
    for(const a of visibleTouchActions(false,false,true))expect(["interact","context"]).not.toContain(a.action);
  });
  it("keeps geographic north-up (world positive Z to screen negative Y)",()=>{
    const base=northHeightsMapPoint010({x:0,z:0});
    const north=northHeightsMapPoint010({x:0,z:10});
    const northeast=northHeightsMapPoint010({x:10,z:10});
    expect(north.y).toBeLessThan(base.y);
    expect(northeast.y).toBeLessThan(base.y);
    expect(northeast.x).toBeGreaterThan(base.x);
  });
});
