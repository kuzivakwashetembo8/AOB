/** GTD-UPDATE-001 — explicit player-triggered release refresh.
 *
 * Fetch authoritative metadata from the CURRENT host (production domain or
 * pinned preview), stage the release's bounded shell in a waiting worker,
 * activate only at the player's request, delete only obsolete GTD caches,
 * and navigate with a unique URL so HTTP cache cannot reuse the old HTML.
 *
 * Deliberately never clears localStorage, sessionStorage, IndexedDB or saves.
 * Full 3D offline pack must be reverified after updating; no fake 300MB
 * instant download. The normal game loader fetches new hashed world assets.
 */
export const GTD_VERSION_ENDPOINT_001="/build-version.json";
export const GTD_SHELL_MANIFEST_001="/offline002-shell-resources.json";
export const GTD_UPDATE_QUERY_001="gtd_update";
export const GTD_SHA_001=/^[a-f\d]{40}$/;
export type GtdRelease001={
 schema:"gtd-release-v1";releaseId:string;environment:string;builtAt:string;
};
export type GtdShellManifest001={
 schema:"gtd-offline002-shell-v1";releaseId:string;
 resources:readonly {url:string;bytes:number;sha256:string}[];
 totalBytes:number;scope:"shell-only";
};
export type GtdUpdateStage001="checking"|"downloading"|"activating"|"cleaning"|"reloading";
export function isGtdRelease001(value:unknown):value is GtdRelease001{
 if(!value||typeof value!=="object")return false;
 const r=value as Partial<GtdRelease001>;
 return r.schema==="gtd-release-v1"&&typeof r.releaseId==="string"&&
  GTD_SHA_001.test(r.releaseId)&&typeof r.environment==="string"&&
  typeof r.builtAt==="string";
}
export function isGtdShellManifest001(value:unknown):value is GtdShellManifest001{
 if(!value||typeof value!=="object")return false;
 const r=value as Partial<GtdShellManifest001>;
 return r.schema==="gtd-offline002-shell-v1"&&
  typeof r.releaseId==="string"&&GTD_SHA_001.test(r.releaseId)&&
  r.scope==="shell-only"&&Array.isArray(r.resources)&&r.resources.length>0&&
  typeof r.totalBytes==="number"&&r.totalBytes<=24_000_000&&
  r.resources.every(x=>typeof x.url==="string"&&x.url.startsWith("/")&&
    !x.url.startsWith("//")&&typeof x.bytes==="number"&&x.bytes>=0);
}
export function outdatedGtdCaches001(keys:readonly string[],releaseId:string):string[]{
 return keys.filter(key=>{
  if(key.startsWith("gtd-offline-shell-"))
   return key!=="gtd-offline-shell-"+releaseId;
  if(key.startsWith("gtd-offline-game-"))
   return key!=="gtd-offline-game-"+releaseId;
  // Predecessor runtime caches from VitePWA (not the player's saved data).
  return key.startsWith("gtd-shell-")||key.startsWith("workbox-precache-");
 });
}
function fail(message:string):never{throw Error(message);}
async function getReleaseFile001(path:string,nonce:string):Promise<unknown>{
 const url=path+"?gtd_release_check="+encodeURIComponent(nonce);
 const response=await fetch(url,{cache:"no-store",credentials:"same-origin",
  headers:{"Cache-Control":"no-cache"}});
 if(!response.ok)fail("Release server unavailable ("+response.status+"). Your installed game was preserved.");
 return response.json() as Promise<unknown>;
}
function workerRelease001(worker:ServiceWorker):Promise<string>{
 return new Promise((resolve,reject)=>{
  const channel=new MessageChannel();
  const timeout=window.setTimeout(()=>{
   channel.port1.close();reject(Error("Could not verify the staged update worker."));
  },5000);
  channel.port1.onmessage=(event:MessageEvent)=>{
   window.clearTimeout(timeout);channel.port1.close();
   const payload=event.data as {type?:string;releaseId?:string};
   if(payload?.type==="GTD_OFFLINE_RELEASE"&&typeof payload.releaseId==="string")
    resolve(payload.releaseId);
   else reject(Error("Update worker returned an invalid release."));
  };
  worker.postMessage({type:"GTD_OFFLINE_RELEASE_QUERY"},[channel.port2]);
 });
}
function waitForInstalled001(registration:ServiceWorkerRegistration):Promise<ServiceWorker>{
 const candidate=registration.waiting??registration.installing??registration.active;
 if(!candidate) return Promise.reject(Error("Update worker could not be started."));
 if(candidate.state==="installed"||candidate.state==="activated")
  return Promise.resolve(candidate);
 return new Promise((resolve,reject)=>{
  const timeout=window.setTimeout(()=>{
   candidate.removeEventListener("statechange",onState);
   reject(Error("Update download timed out. Existing files were not removed."));
  },120000);
  const onState=()=>{
   if(candidate.state==="installed"||candidate.state==="activated"){
    window.clearTimeout(timeout);candidate.removeEventListener("statechange",onState);
    resolve(candidate);
   }else if(candidate.state==="redundant"){
    window.clearTimeout(timeout);candidate.removeEventListener("statechange",onState);
    reject(Error("Update worker installation failed. Existing files were not removed."));
   }
  };
  candidate.addEventListener("statechange",onState);onState();
 });
}
function waitForActivated001(worker:ServiceWorker):Promise<void>{
 if(worker.state==="activated")return Promise.resolve();
 return new Promise((resolve,reject)=>{
  const timeout=window.setTimeout(()=>{
   worker.removeEventListener("statechange",onState);
   reject(Error("Update activation timed out. Please retry."));
  },25000);
  const onState=()=>{
   if(worker.state==="activated"){
    worker.removeEventListener("statechange",onState);
    window.clearTimeout(timeout);resolve();
   }else if(worker.state==="redundant"){
    worker.removeEventListener("statechange",onState);
    window.clearTimeout(timeout);reject(Error("The staged worker was replaced. Retry Update."));
   }
  };
  worker.addEventListener("statechange",onState);onState();
 });
}
export function gtdReloadUrl001(url:string,releaseId:string,nonce:string):string{
 const result=new URL(url);
 result.searchParams.set(GTD_UPDATE_QUERY_001,releaseId.slice(0,12)+"-"+nonce);
 return result.toString();
}
export async function updateGtdToPublishedRelease001(
 onStage:(stage:GtdUpdateStage001,detail:string)=>void,
):Promise<never>{
 if(typeof window==="undefined"||!navigator.onLine)
  fail("Connect to the internet before updating. Your game was not changed.");
 onStage("checking","Checking the published release on this site…");
 const nonce=String(Date.now());
 // Version endpoint bypasses the old PWA worker. Manifest uses a unique query
 // so a previous worker cannot serve its cached same-path JSON.
 const metadata=await getReleaseFile001(GTD_VERSION_ENDPOINT_001,nonce);
 const shell=await getReleaseFile001(GTD_SHELL_MANIFEST_001,nonce);
 if(!isGtdRelease001(metadata)||!isGtdShellManifest001(shell)||
    shell.releaseId!==metadata.releaseId)
  fail("The published release and asset manifest disagree. No cache was removed.");
 const releaseId=metadata.releaseId;
 if("serviceWorker" in navigator){
  onStage("downloading","Downloading the verified app shell ("+
   Math.ceil(shell.totalBytes/1048576)+" MB maximum)…");
  const registration=await navigator.serviceWorker.register("/sw.js",
   {scope:"/",updateViaCache:"none"});
  await registration.update();
  // New worker precaches the entire release-scoped shell on installation.
  const waiting=await waitForInstalled001(registration);
  let actual=await workerRelease001(waiting);
  if(actual!==releaseId&&registration.waiting&&registration.waiting!==waiting){
   actual=await workerRelease001(registration.waiting);
  }
  if(actual!==releaseId)
   fail("The staged worker is from a different release. Old assets were preserved.");
  onStage("activating","Activating release "+releaseId.slice(0,8)+"…");
  if(waiting.state!=="activated"){
   const activated=waitForActivated001(waiting);
   waiting.postMessage({type:"GTD_OFFLINE_ACTIVATE_UPDATE",releaseId});
   await activated;
  }
 }else{
  // Non-PWA browsers still receive the newly published HTML and hashed assets.
  onStage("downloading","Checking the latest app shell…");
  const shellResponse=await fetch("/_shell.html?gtd_release_check="+nonce,
   {cache:"no-store",credentials:"same-origin"});
  if(!shellResponse.ok)fail("New app shell was unavailable. Existing files were preserved.");
 }
 onStage("cleaning","Removing obsolete G.T.D cache entries; saves remain untouched…");
 if("caches" in window){
  const obsolete=outdatedGtdCaches001(await caches.keys(),releaseId);
  await Promise.all(obsolete.map(name=>caches.delete(name)));
 }
 onStage("reloading","Loading the latest game and assets…");
 // No JS API can invoke Ctrl+F5. A new navigation URL, now with the updated
 // active worker and cleared game caches, achieves an equivalent clean boot.
 window.location.replace(gtdReloadUrl001(window.location.href,releaseId,nonce));
 return new Promise<never>(()=>{});
}
