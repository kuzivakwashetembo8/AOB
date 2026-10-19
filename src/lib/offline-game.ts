/**
 * OFFLINE-003: one complete offline download. Click Install once; the native
 * PWA prompt remains a synchronous user gesture while this fetch proceeds.
 * Nothing is labelled offline-ready before ALL declared assets are verified.
 */
declare const __GTD_RELEASE_ID__: string;

export type OfflinePhase = "idle" | "checking" | "downloading" | "ready" | "error";
export const OFFLINE_CATEGORIES = [
  { id:"app", label:"Application files", detail:"Launcher, settings and controls" },
  { id:"engine", label:"Game engine & physics", detail:"Babylon, Rapier and decoders" },
  { id:"world", label:"Meridian City & surfaces", detail:"World graphics and environments" },
  { id:"character", label:"Voight & animations", detail:"Character model and movement" },
  { id:"vehicles", label:"Vehicle models", detail:"Cars and wheel resources" },
] as const;
export type OfflineCategoryId = typeof OFFLINE_CATEGORIES[number]["id"];
export interface OfflineCategoryStatus {
  id:OfflineCategoryId;
  installed:number;
  total:number;
  bytesInstalled:number;
  bytesTotal:number;
}
export interface OfflineProgress {
  phase: OfflinePhase;
  done: number;
  total: number;
  bytesDone: number;
  bytesTotal: number;
  message: string;
  categories: OfflineCategoryStatus[];
}
interface Resource { url: string; bytes: number; sha256: string; group: OfflineCategoryId }
interface Manifest {
  schema: "gtd-offline003-v1";
  releaseId: string;
  fileCount: number;
  totalBytes: number;
  resources: Resource[];
}
const MANIFEST_URL="/offline003-game-manifest.json";
// Separate partial install index; the READY completion marker remains untouched
// until every required resource is present and verified.
const INDEX_URL="/offline003-game-index.json";
const CACHE_PREFIX="gtd-offline-game-";
const currentRelease=():string=>__GTD_RELEASE_ID__;
const packCacheName=():string=>CACHE_PREFIX+currentRelease();
const listeners=new Set<(status:OfflineProgress)=>void>();
const empty:OfflineProgress={
  phase:"idle",done:0,total:0,bytesDone:0,bytesTotal:0,message:"",
  categories:OFFLINE_CATEGORIES.map(item=>({
    id:item.id,installed:0,total:0,bytesInstalled:0,bytesTotal:0,
  })),
};
let state:OfflineProgress=empty;
let active:Promise<void>|null=null;
export const getOfflineProgress=()=>state;
export function subscribeOfflineProgress(listener:(p:OfflineProgress)=>void):()=>void {
  listeners.add(listener);
  listener(state);
  return ()=>{listeners.delete(listener);};
}
function update(patch:Partial<OfflineProgress>) {
  state={...state,...patch};
  for(const listener of listeners)listener(state);
}
const validRelease=(s:unknown):s is string=>
  typeof s==="string" && /^[0-9a-f]{40}$/.test(s);

export function validateOfflineManifest(value:unknown, expectedRelease=currentRelease()):Manifest {
  if (!value || typeof value!=="object")throw Error("Invalid download manifest");
  const m=value as Partial<Manifest>;
  if(m.schema!=="gtd-offline003-v1" || !validRelease(m.releaseId) ||
    m.releaseId!==expectedRelease ||
    !Array.isArray(m.resources) || m.resources.length<100 ||
    m.fileCount!==m.resources.length || !Number.isSafeInteger(m.totalBytes) ||
    (m.totalBytes??0)<=0) throw Error("Offline release does not match this game build");
  let size=0;
  const seen=new Set<string>();
  for(const file of m.resources) {
    if(!file || typeof file.url!=="string" ||
      !/^\/(?:[a-zA-Z0-9_+.%()~!$&',;=:@-]|\/)+$/.test(file.url) ||
      file.url.startsWith("//") || file.url.includes("..") ||
      file.url.includes("?") || file.url.includes("#") ||
      !Number.isSafeInteger(file.bytes) || file.bytes<0 ||
      !/^[a-f0-9]{64}$/.test(file.sha256) ||
      !OFFLINE_CATEGORIES.some(category=>category.id===file.group) ||
      seen.has(file.url)) {
      throw Error("Unsafe offline game resource");
    }
    let decoded: string;
    try { decoded=decodeURIComponent(file.url); } catch { throw Error("Invalid asset URL encoding"); }
    if(decoded.split("/").some(part=>part==="."||part==="..") ||
      decoded.includes("\\") || decoded.startsWith("//") ||
      decoded.includes("?") || decoded.includes("#"))
      throw Error("Unsafe decoded game resource path");
    size+=file.bytes;
    seen.add(file.url);
  }
  if(size!==m.totalBytes)throw Error("Offline manifest size mismatch");
  return m as Manifest;
}
export function summarizeOfflineCategories(
  manifest:Manifest, present:ReadonlySet<string>,
):OfflineCategoryStatus[] {
  return OFFLINE_CATEGORIES.map(group=>{
    const files=manifest.resources.filter(file=>file.group===group.id);
    const installed=files.filter(file=>present.has(file.url));
    return {
      id:group.id,installed:installed.length,total:files.length,
      bytesInstalled:installed.reduce((sum,file)=>sum+file.bytes,0),
      bytesTotal:files.reduce((sum,file)=>sum+file.bytes,0),
    };
  });
}
function reportFiles(manifest:Manifest, present:ReadonlySet<string>, phase:OfflinePhase,
  message="") {
  const installed=manifest.resources.filter(item=>present.has(item.url));
  update({
    phase,message,done:installed.length,total:manifest.fileCount,
    bytesDone:installed.reduce((sum,item)=>sum+item.bytes,0),
    bytesTotal:manifest.totalBytes,
    categories:summarizeOfflineCategories(manifest,present),
  });
}
async function presentFiles(cache:Cache,manifest:Manifest):Promise<Set<string>> {
  const found=new Set<string>();
  // No network requests: every row describes local CacheStorage contents.
  for(const file of manifest.resources)
    if(await cache.match(file.url))found.add(file.url);
  return found;
}
function hex(buffer:ArrayBuffer):string {
  return Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,"0")).join("");
}
async function verified(response:Response, item:Resource):Promise<Response|null> {
  if(!response.ok || response.type==="opaque")return null;
  const bytes=await response.arrayBuffer();
  if(bytes.byteLength!==item.bytes)return null;
  const hash=hex(await crypto.subtle.digest("SHA-256",bytes));
  if(hash!==item.sha256)return null;
  const headers=new Headers(response.headers);
  headers.delete("content-encoding");
  headers.set("content-length",String(bytes.byteLength));
  // Important: keep the verified original response body and content-type.
  return new Response(bytes,{status:200,headers});
}
async function manifestFromNetwork():Promise<Manifest> {
  const res=await fetch(MANIFEST_URL,{cache:"no-store"});
  if(!res.ok)throw Error("Game download list unavailable — reconnect to Wi-Fi");
  return validateOfflineManifest(await res.json());
}
async function indexedManifest(cache:Cache):Promise<Manifest|null> {
  const response=await cache.match(INDEX_URL);
  if(!response)return null;
  try{return validateOfflineManifest(await response.json());}
  catch{return null;}
}
async function ensureManifest(cache:Cache):Promise<Manifest> {
  const cached=await indexedManifest(cache);
  if(cached)return cached;
  const manifest=await manifestFromNetwork();
  // Index is for inspection/resume only. It is not a completion receipt.
  await cache.put(INDEX_URL,new Response(JSON.stringify(manifest),{
    headers:{"content-type":"application/json"},
  }));
  return manifest;
}
async function cachedManifest(cache:Cache):Promise<Manifest|null> {
  const response=await cache.match(MANIFEST_URL);
  if(!response)return null;
  try {return validateOfflineManifest(await response.json());}
  catch {return null;}
}
async function activeServiceWorker():Promise<boolean> {
  if(!("serviceWorker" in navigator) ||
    !navigator.serviceWorker.controller || typeof MessageChannel==="undefined")
    return false;
  const controller=navigator.serviceWorker.controller;
  if(new URL(controller.scriptURL).pathname!=="/sw.js")return false;
  return new Promise<boolean>(resolve=>{
    const channel=new MessageChannel();
    let finished=false;
    const finish=(value:boolean)=>{
      if(finished)return;
      finished=true;
      clearTimeout(timeout);
      channel.port1.close();
      resolve(value);
    };
    const timeout=setTimeout(()=>finish(false),1200);
    channel.port1.onmessage=(event:MessageEvent)=>{
      finish(event.data?.type==="GTD_OFFLINE_RELEASE" &&
        event.data?.releaseId===currentRelease());
    };
    try {controller.postMessage({type:"GTD_OFFLINE_RELEASE_QUERY"},[channel.port2]);}
    catch {finish(false);}
  });
}
async function contentPresent(cache:Cache, m:Manifest):Promise<boolean> {
  for(const resource of m.resources) {
    if(!await cache.match(resource.url))return false;
  }
  return true;
}
/** Cheap restart check: all resources must exist and completion manifest must
 * be present; cryptographic verification happened BEFORE each cache.put. */
export async function checkOfflineReadiness():Promise<boolean> {
  if(!("caches" in window)|| !validRelease(currentRelease()))return false;
  const cache=await caches.open(packCacheName());
  const complete=await cachedManifest(cache);
  const manifest=complete ?? await indexedManifest(cache);
  if(!manifest)return false;
  const found=await presentFiles(cache,manifest);
  const ready=!!complete && found.size===manifest.fileCount && await activeServiceWorker();
  reportFiles(manifest,found,ready?"ready":"idle",
    ready?"READY FOR OFFLINE PLAY — you can turn off Wi-Fi":"");
  return ready;
}
export async function inspectOfflineReadiness():Promise<void> {
  if(active)return;
  update({phase:"checking",message:"Checking installed game"});
  try {
    const cache=await caches.open(packCacheName());
    if(await checkOfflineReadiness())return;
    let manifest=await indexedManifest(cache);
    if(!manifest)manifest=await ensureManifest(cache);
    reportFiles(manifest,await presentFiles(cache,manifest),"idle");
  } catch {
    update({phase:"idle",message:""});
  }
}
async function installGame():Promise<void> {
  if(!("caches" in window)||!crypto?.subtle)
    throw Error("This browser cannot save the offline game");
  if(!validRelease(currentRelease()))
    throw Error("Use a published GTD build to install offline");
  const cache=await caches.open(packCacheName());
  if(await checkOfflineReadiness())return;
  const manifest=await ensureManifest(cache);
  const existingManifest=await cachedManifest(cache);
  // Different releases are stored in separate cache namespaces.
  // Broken/partial same-release caches are repaired file by file.
  if(existingManifest && existingManifest.releaseId!==manifest.releaseId)
    throw Error("Installed content belongs to another game release");
  try {await navigator.storage?.persist?.();} catch { /* optional on browsers */ }
  const present=await presentFiles(cache,manifest);
  reportFiles(manifest,present,"downloading","Downloading game for offline play");
  let next=0;
  const workers=Array.from({length:3},async()=>{
    while(next<manifest.resources.length) {
      const item=manifest.resources[next++];
      if(!item)break;
      let candidate=await cache.match(item.url);
      let verifiedResponse:Response|null=null;
      if(candidate)verifiedResponse=await verified(candidate,item);
      if(!verifiedResponse) {
        if(candidate)await cache.delete(item.url);
        const response=await fetch(item.url,{cache:"no-store"});
        verifiedResponse=await verified(response,item);
        if(!verifiedResponse)throw Error("Game asset failed integrity check: "+item.url);
        await cache.put(item.url,verifiedResponse);
      }
      present.add(item.url);
      reportFiles(manifest,present,"downloading","Downloading game for offline play");
    }
  });
  await Promise.all(workers);
  if(!await activeServiceWorker()) {
    throw Error("Open the installed GTD app and tap Retry to finish verifying the installation.");
  }
  // Write completion marker LAST. No early or partial READY state.
  await cache.put(MANIFEST_URL,new Response(JSON.stringify(manifest),{
    headers:{"content-type":"application/json"},
  }));
  if(!await contentPresent(cache,manifest)) {
    await cache.delete(MANIFEST_URL);
    throw Error("One or more game resources were removed during installation");
  }
  reportFiles(manifest,present,"ready",
    "READY FOR OFFLINE PLAY — you can turn off Wi-Fi");
}
/** This call is deliberately separate from the native prompt; the caller
 * must invoke the native browser prompt immediately within the same click. */
export function startOfflineDownload():Promise<void> {
  if(active)return active;
  active=installGame().catch(err=>{
    update({phase:"error",message:err instanceof Error?err.message:"Offline download failed"});
  }).finally(()=>{active=null;});
  return active;
}
