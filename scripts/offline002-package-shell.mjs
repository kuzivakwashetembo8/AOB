/**
 * OFFLINE-002: Nitro emits static client assets after VitePWA generates sw.js.
 * Build a deliberately small release-scoped shell worker from the REAL
 * .vercel/output/static files, retaining only UI JS/CSS, fonts, navigation
 * document and small branded images. Large world/vehicle files are excluded.
 *
 * This modifies only preview/build output, not source assets or player data.
 */
import {createHash} from "node:crypto";
import {existsSync, readFileSync, readdirSync, statSync, writeFileSync} from "node:fs";
import {join, relative, resolve, sep} from "node:path";

const root=resolve(process.cwd());
const staticDir=join(root, ".vercel","output","static");
const template=join(root,"src","workers","gtd-offline-shell-sw.js");
const shell=join(staticDir,"_shell.html");
const releaseFile=join(staticDir,"build-version.json");
const allowJsCss=path => /^\/assets\/[^?#]+\.(?:js|css)$/.test(path);
const allowImage=path => /^\/assets\/[^?#]+\.(?:jpg|jpeg|svg)$/.test(path);
const allowFont=path => /^\/offline001\/fonts\/[^?#]+\.(?:ttf|woff2?)$/.test(path);
const allowIcon=path => /^\/icons\/[^?#]+\.png$/.test(path);
const allowed=path => path==="/_shell.html" || path==="/manifest.webmanifest" ||
  allowJsCss(path) || allowImage(path) || allowFont(path) || allowIcon(path);
const sha=bytes=>createHash("sha256").update(bytes).digest("hex");

function walk(dir) {
  let files=[];
  for(const name of readdirSync(dir)){
    const full=join(dir,name);
    const state=statSync(full);
    if(state.isDirectory())files.push(...walk(full));
    else if(state.isFile())files.push(full);
  }
  return files;
}
function output(requestedRoot=staticDir) {
  const doc=join(requestedRoot, "_shell.html");
  const meta=join(requestedRoot, "build-version.json");
  if(!existsSync(doc) || !existsSync(meta))
    throw Error("OFFLINE-002 requires TanStack SPA /_shell.html and REL-010 release metadata in Nitro static");
  const html=readFileSync(doc,"utf8");
  if(!html.includes("<html") || !html.includes("<script") ||
    !html.includes("</html>"))
    throw Error("OFFLINE-002 shell is not a valid hydratable HTML document");
  const metaData=JSON.parse(readFileSync(meta,"utf8"));
  if(metaData.schema!=="gtd-release-v1" ||
    !/^[a-f0-9]{40}$/.test(metaData.releaseId))
    throw Error("OFFLINE-002 rejects non-immutable release ID");
  const all=walk(requestedRoot).map(file=>{
    const url="/"+relative(requestedRoot,file).split(sep).join("/");
    return {file,url,bytes:statSync(file).size};
  });
  const paths=new Set(all.map(x=>x.url));
  const shellAssets=all.filter(x=>allowed(x.url) &&
    // No GLB, 3D runtime WASM, large texture packs or unbounded JS bundles.
    ((allowJsCss(x.url) && x.bytes<=2_000_000) ||
      (allowImage(x.url) && x.bytes<=4_000_000) ||
      allowFont(x.url) || allowIcon(x.url) ||
      x.url==="/manifest.webmanifest" || x.url==="/_shell.html"));
  // Cache all small public route chunk candidates. Lazy 3D and environment
  // chunks larger than 2 MB deliberately remain outside OFFLINE-002.
  const mandatory=["/_shell.html","/manifest.webmanifest"];
  for(const url of mandatory)if(!paths.has(url))
    throw Error("OFFLINE-002 missing mandated shell resource: "+url);
  if(!shellAssets.some(x=>x.url.endsWith(".js")) ||
    !shellAssets.some(x=>x.url.endsWith(".css")))
    throw Error("OFFLINE-002 shell has no compiled client JS or CSS");
  // SPA shell must not refer to an asset that the packaged build doesn't have.
  const referenced=[...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)]
    .map(x=>x[1].split("?")[0]);
  for(const url of referenced){
    if(!paths.has(url))throw Error("OFFLINE-002 shell references absent file "+url);
    if(!shellAssets.some(x=>x.url===url))
      throw Error("OFFLINE-002 boot asset not precached: "+url);
  }
  // Keep total shell-install transfer small, not a second all-world download.
  const bytes=shellAssets.reduce((n,x)=>n+x.bytes,0);
  if(bytes>24_000_000)
    throw Error("OFFLINE-002 shell exceeds 24MB budget ("+bytes+"). Inspect chunks");
  const resources=shellAssets.map(x=>x.url).sort();
  const record={
    schema:"gtd-offline002-shell-v1",releaseId:metaData.releaseId,
    mandatory,resources:shellAssets.map(x=>({url:x.url,bytes:x.bytes,
      sha256:sha(readFileSync(x.file))})).sort((a,b)=>a.url.localeCompare(b.url)),
    totalBytes:bytes, scope:"shell-only", offlineGameReady:false,
    limitations:[
      "A browser must complete worker installation before first offline navigation",
      "Full 3D game assets and Rapier WASM are not guaranteed by this shell",
      "Only OFFLINE-003 may claim the full game is installed for offline play"
    ],
  };
  writeFileSync(join(requestedRoot,"offline002-shell-resources.json"),
    JSON.stringify(record,null,2)+"\n");
  const source=readFileSync(template,"utf8");
  const marker="__GTD_OFFLINE_SHELL_CONFIG__";
  if(source.split(marker).length!==2)throw Error("OFFLINE-002 worker marker invalid");
  const worker=source.replace(marker,JSON.stringify({releaseId:metaData.releaseId,resources}));
  // Last step atomically commits the worker content only after all checks.
  writeFileSync(join(requestedRoot,"sw.js"),worker);
  console.info("[OFFLINE-002] Packaged shell "+resources.length+
    " resources / "+bytes+" bytes for "+metaData.releaseId);
}
output();
