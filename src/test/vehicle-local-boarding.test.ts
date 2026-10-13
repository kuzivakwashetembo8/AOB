import {describe,it,expect} from "vitest";
import {nearestSportsCar,stationaryDisembark} from "../game/vehicles/local-boarding";
import {FERRARI_REAR_CAMERA_BETA,FERRARI_REAR_CAMERA_RADIUS} from "../game/vehicles/ferrari-camera";
const actor={x:0,y:0.92,z:0},mercer={id:"Mercer",pose:{x:2,y:0.9,z:0}},foundry={id:"Foundry",pose:{x:12,y:0.9,z:46}};
describe("VEH-003 local boarding",()=>{
it("selects visible nearby car instead of remote sports car",()=>expect(nearestSportsCar(actor,[foundry,mercer])?.id).toBe("Mercer"));
it("blocks boarding when only remote car exists",()=>expect(nearestSportsCar(actor,[foundry])).toBeNull());
it("returns exact boarding point when car never moved",()=>expect(stationaryDisembark(actor,mercer.pose,{...mercer.pose})).toEqual(actor));
it("does not return previous street after the car travelled",()=>expect(stationaryDisembark(actor,mercer.pose,foundry.pose)).toBeNull());
it("sets lower rear-follow camera pitch and distance",()=>{expect(FERRARI_REAR_CAMERA_BETA).toBeGreaterThan(1.3);expect(FERRARI_REAR_CAMERA_RADIUS).toBeGreaterThan(6)});
});
