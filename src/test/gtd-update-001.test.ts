import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {
 GTD_VERSION_ENDPOINT_001,GTD_SHELL_MANIFEST_001,
 isGtdRelease001,isGtdShellManifest001,outdatedGtdCaches001,
 gtdReloadUrl001
} from "../lib/gtd-update-001";
const source=(path:string)=>readFileSync(resolve(process.cwd(),path),"utf8");
const sha="a".repeat(40);
const validRelease={schema:"gtd-release-v1",releaseId:sha,
 environment:"production",builtAt:"2026-11-02T21:00:00.000Z"};
const validShell={schema:"gtd-offline002-shell-v1",releaseId:sha,
 resources:[{url:"/_shell.html",bytes:512,sha256:"b".repeat(64)}],
 totalBytes:512,scope:"shell-only"};
describe("GTD-UPDATE-001 settings-triggered release refresh",()=>{
 it("validates deployed release identity, not a GitHub working tree or arbitrary JSON",()=>{
  expect(GTD_VERSION_ENDPOINT_001).toBe("/build-version.json");
  expect(GTD_SHELL_MANIFEST_001).toBe("/offline002-shell-resources.json");
  expect(isGtdRelease001(validRelease)).toBe(true);
  expect(isGtdRelease001({...validRelease,releaseId:"latest"})).toBe(false);
  expect(isGtdRelease001({...validRelease,schema:"unknown"})).toBe(false);
  expect(isGtdRelease001(null)).toBe(false);
 });
 it("validates bounded same-release shell resource manifest",()=>{
  expect(isGtdShellManifest001(validShell)).toBe(true);
  expect(isGtdShellManifest001({...validShell,totalBytes:30_000_000})).toBe(false);
  expect(isGtdShellManifest001({...validShell,resources:[{url:"//external",bytes:1,sha256:""}]})).toBe(false);
  expect(isGtdShellManifest001({...validShell,resources:[]})).toBe(false);
 });
 it("cleans obsolete G.T.D caches while preserving the new release and foreign caches",()=>{
  const keys=["gtd-offline-shell-old","gtd-offline-game-old",
   "gtd-offline-shell-"+sha,"gtd-offline-game-"+sha,
   "gtd-shell-static","workbox-precache-v2-old","other-website-cache"];
  expect(outdatedGtdCaches001(keys,sha)).toEqual([
   "gtd-offline-shell-old","gtd-offline-game-old",
   "gtd-shell-static","workbox-precache-v2-old"
  ]);
 });
 it("preserves navigation path, old query constraints and adds a cache bust for fresh HTML",()=>{
  const url=gtdReloadUrl001("https://grand-theft-division.vercel.app/north-heights-preview?foo=1",sha,"1234");
  const parsed=new URL(url);
  expect(parsed.pathname).toBe("/north-heights-preview");
  expect(parsed.searchParams.get("foo")).toBe("1");
  expect(parsed.searchParams.get("gtd_update")).toBe("aaaaaaaaaaaa-1234");
 });
 it("only activates the waiting release after checking release and manifest, never clears saves",()=>{
  const logic=source("src/lib/gtd-update-001.ts");
  expect(logic.indexOf("isGtdRelease001(metadata)")).toBeLessThan(logic.indexOf("outdatedGtdCaches001(await caches.keys()"));
  expect(logic).toContain("workerRelease001(waiting)");
  expect(logic).toContain('type:"GTD_OFFLINE_ACTIVATE_UPDATE"');
  expect(logic).toContain('cache:"no-store"');
  expect(logic).toContain("window.location.replace");
  expect(logic).not.toMatch(/localStorage\.clear\(|indexedDB\.deleteDatabase\(|sessionStorage\.clear\(/);
 });
 it("reuses release-scoped offline shell and exposes Update in all shared settings pages",()=>{
  const worker=source("src/workers/gtd-offline-shell-sw.js");
  expect(worker).toContain('GTD_OFFLINE_ACTIVATE_UPDATE');
  expect(worker).toContain("self.skipWaiting()");
  const settings=source("src/ui/menus/settings-editor.tsx");
  expect(settings).toContain('"System"');
  expect(settings).toContain('data-testid="gtd-update-button"');
  const pause=source("src/ui/menus/session-overlays.tsx");
  const menu=source("src/routes/settings.tsx");
  expect(pause).toContain("SettingsEditor");
  expect(menu).toContain("SettingsEditor");
 });
});
