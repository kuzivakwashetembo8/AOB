// @vitest-environment jsdom
import {afterEach,describe,expect,it} from "vitest";
import {act,cleanup,renderHook} from "@testing-library/react";
import {readFileSync} from "node:fs";
import {defaults,useSettings} from "@/ui/menus/settings-state";
afterEach(()=>{cleanup();localStorage.clear();});
describe("NH-OPT2 pre-merge default Voight and uniform info button",()=>{
 it("defaults to Voight rather than the yellow UAL developer model",()=>{
   expect(defaults.enableCharacter).toBe(true);
   const {result}=renderHook(()=>useSettings());
   expect(result.current.settings.enableCharacter).toBe(true);
 });
 it("migrates legacy stored OFF once and respects explicitly selected UAL afterward",()=>{
   const old={...defaults,enableCharacter:false,quality:"High"};
   localStorage.setItem("gtd-interface-settings",JSON.stringify(old));
   const session=renderHook(()=>useSettings());
   expect(session.result.current.settings.enableCharacter).toBe(true);
   expect(localStorage.getItem("gtd-voight-default-v1")).toBe("1");
   expect(JSON.parse(localStorage.getItem("gtd-interface-settings")!).enableCharacter).toBe(true);
   act(()=>session.result.current.save({...session.result.current.settings,enableCharacter:false}));
   session.unmount();
   const next=renderHook(()=>useSettings());
   expect(next.result.current.settings.enableCharacter).toBe(false);
 });
 it("renders an info glyph with the exact same button variant as Pause, not text labels",()=>{
   const hud=readFileSync("src/ui/hud/game-hud.tsx","utf8");
   const css=readFileSync("src/styles.css","utf8");
   expect(hud).toContain('import { Info, Pause } from "lucide-react"');
   expect(hud).toContain('variant="control" className="gtd-header-reveal"');
   expect(hud).toContain('<Info size={18} aria-hidden="true" />');
   expect(hud).not.toContain('{headerVisible ? "HIDE INFO" : "INFO"}');
   expect(hud).toContain('variant="control" className="gtd-pause-always"');
   const rule=css.match(/\.gtd-header-reveal \{[^}]*\}/)?.[0]??"";
   expect(rule).not.toMatch(/background:|border:|padding:|font:/);
 });
 it("allocates a non-overlapping top-right control row and stacks it on narrow screens",()=>{
   const css=readFileSync("src/styles.css","utf8");
   expect(css).toContain("right:calc(max(12px,env(safe-area-inset-right)) + 65px)");
   expect(css).toContain("right:calc(max(12px,env(safe-area-inset-right)) + 118px)");
   expect(css).toContain("right:calc(max(12px,env(safe-area-inset-right)) + 171px)");
   expect(css).toContain("right:calc(max(12px,env(safe-area-inset-right)) + 224px)");
   expect(css).toContain(".gtd-first-person-always{top:calc(max(8px,env(safe-area-inset-top)) + 53px)");
   expect(css).toContain(".gtd-header-reveal{top:calc(max(8px,env(safe-area-inset-top)) + 106px)");
   expect(css).toContain(".gtd-hand-always{top:calc(max(8px,env(safe-area-inset-top)) + 159px)");
   expect(css).toContain(".gtd-machine-camera-always{top:calc(max(8px,env(safe-area-inset-top)) + 212px)");
   expect(css).toContain(".poi010-camera-status{top:calc(max(8px,env(safe-area-inset-top)) + 265px)");
   expect(css).toContain("@media(max-width:740px) and (max-height:440px)");
   expect(css).toContain(".gtd-map-always");
 });
});
