/**
 * OFFLINE-003: one complete, immutable offline game pack. The client downloads
 * exactly this deployed resource list and verifies every file before READY.
 * Build inventories final Nitro public artifacts after OFFLINE-002 shell setup.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { resolve, join, relative, sep } from "node:path";

const root=resolve(process.cwd(),".vercel","output","static");
if(!existsSync(root)) throw Error("[OFFLINE-003] Nitro static output missing");
const versionPath=join(root,"build-version.json");
const shellPath=join(root,"offline002-shell-resources.json");
if(!existsSync(versionPath)||!existsSync(shellPath))
  throw Error("[OFFLINE-003] Release metadata and OFFLINE-002 shell are required");
const release=JSON.parse(readFileSync(versionPath,"utf8"));
const shell=JSON.parse(readFileSync(shellPath,"utf8"));
if(!/^[0-9a-f]{40}$/.test(release.releaseId)||release.releaseId!==shell.releaseId)
  throw Error("[OFFLINE-003] Shell/release mismatch");
const reserved=new Set([
  "sw.js","build-version.json","offline001-asset-inventory.json",
  "offline002-shell-resources.json","offline003-game-manifest.json",
]);
function walk(dir) {
  const files=[];
  for (const name of readdirSync(dir)) {
    const file=join(dir,name);
    if(statSync(file).isDirectory()) files.push(...walk(file));
    else if(statSync(file).isFile()) files.push(file);
  }
  return files;
}
const resources=walk(root).map(file=>{
  const path=relative(root,file).split(sep).join("/");
  return {path,file};
}).filter(({path})=>!reserved.has(path)&&
  !/^workbox-[\w-]+\.js$/.test(path)&&
  !path.startsWith("api/")&&!path.startsWith("~oauth/"))
 .map(({path,file})=>{
   const bytes=readFileSync(file);
   return {
     url:"/"+path.split("/").map(encodeURIComponent).join("/"),
     bytes:bytes.length,
     sha256:createHash("sha256").update(bytes).digest("hex"),
   };
 }).sort((a,b)=>a.url.localeCompare(b.url));
if(resources.length<100) throw Error("[OFFLINE-003] Too few game files: "+resources.length);
if(!resources.some(x=>x.url.endsWith(".glb")) ||
   !resources.some(x=>x.url.endsWith(".wasm")) ||
   !resources.some(x=>x.url.includes("/assets/")&&x.url.endsWith(".js")))
   throw Error("[OFFLINE-003] Mandatory 3D/physics/client asset family absent");
const unique=new Set(resources.map(x=>x.url));
if(unique.size!==resources.length)throw Error("[OFFLINE-003] Duplicated URL");
const manifest={
  schema:"gtd-offline003-v1",
  releaseId:release.releaseId,
  fileCount:resources.length,
  totalBytes:resources.reduce((acc,x)=>acc+x.bytes,0),
  resources,
};
writeFileSync(join(root,"offline003-game-manifest.json"),JSON.stringify(manifest)+"\n");
console.log("[OFFLINE-003] Complete game pack: "+manifest.fileCount+
  " files / "+manifest.totalBytes+" bytes; integrity SHA-256 per file");
