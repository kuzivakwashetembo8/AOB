// @vitest-environment jsdom
import {describe,it,expect,afterEach,vi} from "vitest";
import {cleanup,render,screen,fireEvent} from "@testing-library/react";
import {defaults,normalizeDrivingTouchLayout} from "../ui/menus/settings-state";
import {SettingsEditor} from "../ui/menus/settings-editor";
import {posturePoint105,humanVisualYaw105} from "../game/character/human-walking-105";
import {stepTravelHeading,DEFAULT_TRAVEL_HEADING} from "../game/character/locomotion/travel-heading";
afterEach(cleanup);
describe("CHAR-105 imported-human walking gate",()=>{
 it("loads the accepted Voight character by default",()=>{
   expect(defaults.enableCharacter).toBe(true);
   expect(normalizeDrivingTouchLayout("arrows")).toBe("arrows");
 });
 it("exposes Enable Character in Controls, with Apply not an immediate switch",()=>{
   const apply=vi.fn();
   render(<SettingsEditor initialSettings={defaults} onApply={apply} inGame/>);
   fireEvent.click(screen.getByRole("button",{name:/^Controls$/i}));
   const toggle=screen.getByRole("checkbox",{name:"Enable Character"});
   expect((toggle as HTMLInputElement).checked).toBe(true);
   fireEvent.click(toggle);
   expect(apply).not.toHaveBeenCalled();
   fireEvent.click(screen.getByRole("button",{name:/APPLY & RESUME/}));
   expect(apply).toHaveBeenCalledWith(expect.objectContaining({enableCharacter:false}));
 });
 it("never reshapes upper-arm, shoulders, jacket or hands by x/y heuristics",()=>{
   const bounds={cx:0,bottom:0,height:2};
   const locations=[
     {x:-.6,y:1.57,z:.03},{x:.6,y:1.57,z:.03},
     {x:-1.2,y:1.54,z:.05},{x:1.2,y:1.54,z:.05},
     {x:-.25,y:1.67,z:0},{x:.25,y:1.67,z:0},
     {x:0,y:1.3,z:.1}
   ];
   for(const p of locations){
     for(const phase of ["idle","left","right"] as const)
       expect(posturePoint105(p,bounds,phase)).toEqual(p);
   }
 });
 it("applies static-only PI orientation; playable facing matches travel",()=>{
   expect(humanVisualYaw105(false)).toBeCloseTo(Math.PI);
   expect(humanVisualYaw105(true)).toBe(0);
   for(const [dx,dz] of [[0,1],[1,0],[0,-1],[-1,0]] as const){
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
