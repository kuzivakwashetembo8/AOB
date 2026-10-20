// @vitest-environment jsdom
import {describe,it,expect,afterEach,vi} from "vitest";
import {cleanup,render,screen,fireEvent} from "@testing-library/react";
import {defaults,normalizeDrivingTouchLayout} from "../ui/menus/settings-state";
import {SettingsEditor} from "../ui/menus/settings-editor";
import {posturePoint105} from "../game/character/human-walking-105";
afterEach(cleanup);
describe("CHAR-105 imported-human walking gate",()=>{
 it("keeps the accepted humanoid as the safe default",()=>{
   expect(defaults.enableCharacter).toBe(false);
   expect(normalizeDrivingTouchLayout("arrows")).toBe("arrows");
 });
 it("exposes Enable Character in Controls, with Apply not an immediate switch",()=>{
   const apply=vi.fn();
   render(<SettingsEditor initialSettings={defaults} onApply={apply} inGame/>);
   fireEvent.click(screen.getByRole("button",{name:/Controls/i}));
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
 it("moves opposite legs through distinct reversible walking poses",()=>{
   const bounds={cx:0,bottom:0,height:2};
   const source={x:-.14,y:.25,z:0};
   const a=posturePoint105(source,bounds,"left");
   const b=posturePoint105(source,bounds,"right");
   expect(a.z).not.toBeCloseTo(b.z);
   expect(posturePoint105(source,bounds,"idle")).toEqual(source);
 });
});
