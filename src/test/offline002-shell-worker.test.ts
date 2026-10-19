import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { runInNewContext } from "node:vm";

const source = readFileSync(resolve("src/workers/gtd-offline-shell-sw.js"), "utf8");

function workerHarness(networkWorks = false) {
  const listeners = new Map<string, (event: any) => void>();
  const objects = new Map<string, Response>();
  const cache = {
    addAll: vi.fn(async (resources: string[]) => {
      for (const path of resources) objects.set(path, new Response("<html>GTD offline shell</html>",
        {headers: {"content-type": "text/html"}}));
    }),
    match: vi.fn(async (request: string | {url: string}) => {
      const raw = typeof request === "string" ? request : request.url;
      return objects.get(new URL(raw,"https://gtd.example").pathname)?.clone();
    }),
    put: vi.fn(async (request: string | {url: string}, response: Response) => {
      const raw = typeof request === "string" ? request : request.url;
      objects.set(new URL(raw,"https://gtd.example").pathname,response.clone());
    }),
  };
  const fetcher=vi.fn(async () => {
    if (!networkWorks) throw new TypeError("offline");
    return new Response("<html>online</html>",{headers: {"content-type": "text/html"}});
  });
  const code = source.replace("__GTD_OFFLINE_SHELL_CONFIG__",JSON.stringify({
    releaseId:"a".repeat(40),resources:["/_shell.html","/manifest.webmanifest","/assets/app-hash.js"],
  }));
  runInNewContext(code,{
    self: {
      location:{origin:"https://gtd.example"},
      addEventListener:(name: string, callback:(event:any)=>void)=>{listeners.set(name,callback);},
    },
    caches:{open:async () => cache},
    URL, fetch:fetcher,Response,AbortController, setTimeout, clearTimeout,Set,
  });
  const dispatch = async (pathname: string, mode = "navigate") => {
    let handled: Promise<Response>|undefined;
    listeners.get("fetch")?.({
      request:{url:"https://gtd.example"+pathname,method:"GET",mode},
      respondWith(p:Promise<Response>){handled=p;},
    });
    return handled?await handled:undefined;
  };
  const install=async () => {
    let task: Promise<void>|undefined;
    listeners.get("install")?.({waitUntil(p: Promise<void>){task=p;}});
    await task;
  };
  return {listeners,cache,objects,fetcher,dispatch,install};
}

describe("OFFLINE-002 scoped app shell",()=>{
  it("caches a complete release shell without any vehicle, texture or engine payload",async()=>{
    const s=workerHarness();
    await s.install();
    expect(s.objects.has("/_shell.html")).toBe(true);
    expect([...s.objects.keys()].every(p=>!p.endsWith(".glb")&&!p.endsWith(".wasm"))).toBe(true);
    expect(s.cache.addAll).toHaveBeenCalled();
  });
  it("serves a complete cached SPA shell on disconnected supported app routes",async()=>{
    const s=workerHarness();
    await s.install();
    for(const path of ["/","/world","/settings","/game"]){
      const response=await s.dispatch(path);
      expect(response?.status).toBe(200);
      expect(await response?.text()).toContain("GTD offline shell");
    }
  });
  it("serves a verified offline vehicle GLB without contacting the network",async()=>{
    const s=workerHarness();
    await s.install();
    s.objects.set("/cars/rover.glb",new Response("GLB-BYTES"));
    const response=await s.dispatch("/cars/rover.glb","cors");
    expect(await response?.text()).toBe("GLB-BYTES");
    expect(s.fetcher).not.toHaveBeenCalled();
  });
  it("leaves API, telemetry, version metadata and auth outside worker scope",async()=>{
    const s=workerHarness();
    await s.install();
    for(const path of ["/api/telemetry/startup","/build-version.json","/~oauth/callback","/unknown"]){
      expect(await s.dispatch(path)).toBeUndefined();
    }
  });
  it("does not activate an incomplete release or forcibly replace the active worker",()=>{
    expect(source).not.toContain("self.skipWaiting(");
    expect(source).not.toContain("self.clients.claim(");
    expect(source).toContain("throw Error(\"Missing release shell resource:");
    expect(source).not.toContain("caches.delete(");
  });
});
