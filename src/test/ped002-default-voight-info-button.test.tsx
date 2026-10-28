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
});
