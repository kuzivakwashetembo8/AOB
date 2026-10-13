import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const script = resolve(dirname(fileURLToPath(import.meta.url)),
  "../../scripts/publish-pwa-worker.mjs");
const roots: string[] = [];
function workspace() {
  const dir = mkdtempSync(join(tmpdir(), "gtd-pwa-static-"));
  roots.push(dir);
  mkdirSync(join(dir, "dist"), { recursive:true });
  mkdirSync(join(dir, ".vercel/output/static"), { recursive:true });
  return dir;
}
const run = (cwd: string) => spawnSync(process.execPath, [script], {
  cwd, env: { ...process.env, VERCEL: "1" }, encoding: "utf8",
});
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, {recursive:true, force:true});
});

describe("GTD PWA publish gate for Nitro/Vercel", () => {
  it("publishes sw.js and every generated hashed Workbox dependency", () => {
    const root = workspace();
    writeFileSync(join(root, "dist/sw.js"),
      'importScripts("workbox-d0f0e45d.js"); self.skipWaiting();');
    writeFileSync(join(root, "dist/workbox-d0f0e45d.js"),
      "self.__WB_MANIFEST=[];");
    const result = run(root);
    expect(result.status, result.stderr).toBe(0);
    expect(readFileSync(join(root, ".vercel/output/static/sw.js"), "utf8"))
      .toContain("importScripts");
    expect(readFileSync(join(root, ".vercel/output/static/workbox-d0f0e45d.js"), "utf8"))
      .toContain("__WB_MANIFEST");
  });

  it("fails production publishing when the service-worker bundle is missing", () => {
    const root = workspace();
    const result = run(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("dist/sw.js does not exist");
  });

  it("refuses to ship a worker with a missing referenced Workbox module", () => {
    const root = workspace();
    writeFileSync(join(root,"dist/sw.js"),
      'importScripts("workbox-missing123.js");');
    const result=run(root);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("workbox-missing123.js");
  });
});
