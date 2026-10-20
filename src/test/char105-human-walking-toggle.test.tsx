// @vitest-environment jsdom
import {describe,it,expect,afterEach,vi} from "vitest";
import {cleanup,render,screen,fireEvent} from "@testing-library/react";
import {defaults,normalizeDrivingTouchLayout} from "../ui/menus/settings-state";
import {SettingsEditor} from "../ui/menus/settings-editor";
import {posturePoint105,humanVisualYaw105} from "../game/character/human-walking-105";
import {stepTravelHeading,DEFAULT_TRAVEL_HEADING} from "../game/character/locomotion/travel-heading";
afterEach(cleanup);
describe("CHAR-105 imported-human walking gate",()=>{
 it("keeps the accepted humanoid as the safe default",()=>{
   expect(defaults.enableCharacter).toBe(false);
   expect(normalizeDrivingTouchLayout("arrows")).toBe("arrows");
 });
 it("exposes Enable Character in Controls, with Apply not an immediate switch",()=>{
   const apply=vi.fn();
   render(<SettingsEditor initialSettings={defaults} onApply={apply} inGame/>);
   fireEvent.click(screen.getByRole("button",{name:/^Controls$/i}));
   const toggle=screen.getByRole("checkbox",{name:"Enable Character"});
   expect((toggle as HTMLInputElement).checked).toBe(false);
   fireEvent.click(toggle);
   expect(apply).not.toHaveBeenCalled();
   fireEvent.click(screen.getByRole("button",{name:/APPLY & RESUME/}));
   expect(apply).toHaveBeenCalledWith(expect.objectContaining({enableCharacter:true}));
 });
 it("lowers T-posed left and right hands but does not deform torso",()=>{
   const bounds={cx:0,bottom:0,height:2};
   const l=posturePoint105({x:-.88,y:1.56,z:0},bounds,"idle");
   const r=posturePoint105({x:.88,y:1.56,z:0},bounds,"idle");
   const chest=posturePoint105({x:0,y:1.3,z:0},bounds,"idle");
   expect(l.y).toBeLessThan(1.2);
   expect(r.y).toBeLessThan(1.2);
   expect(chest).toEqual({x:0,y:1.3,z:0});
 });
 it("lowers the UPPER arms with elbows and wrists instead of bending at the elbow",()=>{
   const b={cx:0,bottom:0,height:2};
   for(const side of [-1,1]){
     const shoulder={x:side*.34,y:1.58,z:0};
     const upperArm={x:side*.48,y:1.55,z:0};
     const wrist={x:side*.86,y:1.53,z:0};
     const top=posturePoint105(shoulder,b,"idle");
     const elbow=posturePoint105(upperArm,b,"idle");
     const hand=posturePoint105(wrist,b,"idle");
     // Upper arm must follow the arm downward, not remain in T-pose.
     expect(elbow.y).toBeLessThan(1.41);
     expect(hand.y).toBeLessThan(1.03);
     expect(Math.abs(elbow.x)).toBeLessThan(Math.abs(upperArm.x));
     expect(Math.abs(top.x)).toBeLessThan(.42);
   }
 });
 it("applies static-only PI orientation; playable facing matches travel",()=>{
   expect(humanVisualYaw105(false)).toBeCloseTo(Math.PI);
   expect(humanVisualYaw105(true)).toBe(0);
   for(const [dx,dz] of [[0,1],[1,0],[0,-1],[-1,0]]){
     const travel=stepTravelHeading(Math.atan2(dx,dz),dx,dz,1/60,DEFAULT_TRAVEL_HEADING);
     const yaw=travel.yaw+humanVisualYaw105(true);
     expect(Math.sin(yaw)).toBeCloseTo(dx,5);
     expect(Math.cos(yaw)).toBeCloseTo(dz,5);
     expect(travel.travelX).toBeCloseTo(dx,5);
     expect(travel.travelZ).toBeCloseTo(dz,5);
   }
 });
 it("moves opposite legs through distinct reversible walking poses",()=>{
   const bounds={cx:0,bottom:0,height:2};
   const source={x:-.14,y:.25,z:0};
   const a=posturePoint105(source,bounds,"left");
   const b=posturePoint105(source,bounds,"right");
   expect(a.z).not.toBeCloseTo(b.z);
   expect(posturePoint105(source,bounds,"idle")).toEqual(source);
 });
});
