/**
 * OFFLINE-001: materialize runtime-critical files into public/ BEFORE Vite builds.
 * Remote access occurs ONLY in this controlled build step, never in game boot.
 * Voight remains the existing provisional UAL specimen; this does not confer
 * redistribution rights to unrelated source/model modifications.
 */
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync} from "node:fs";
import {resolve, join} from "node:path";

const root=resolve(process.cwd());
const out=join(root,"public","offline001");
const charDir=join(out,"character");
const decoderDir=join(out,"draco");
const expected={
  source:"https://cdn.jsdelivr.net/gh/interlinkglobal/three-player-controller@ca82bbc76a3b9b0afa80c73b60167adf6123b9b6/example/public/glb/ual.glb",
  gitBlobSha:"e236f349526637a5c829c408d48ce9d8fcde9cff",
  bytes:3749364,
};
const digest=(bytes)=>createHash("sha256").update(bytes).digest("hex");
const gitBlob=(bytes)=>createHash("sha1").update("blob "+bytes.length+"\0").update(bytes).digest("hex");
const validCharacter=(buf)=>buf.length===expected.bytes &&
  buf.subarray(0,4).toString("ascii")==="glTF" &&
  gitBlob(buf)===expected.gitBlobSha;

async function stageCharacter() {
  const file=join(charDir,"ual.glb");
  if(existsSync(file) && validCharacter(readFileSync(file)))return file;
  // No alternate source, silent fallback, or unauthenticated unpinned latest.
  const response=await fetch(expected.source,{signal:AbortSignal.timeout(30000),redirect:"follow"});
  if(!response.ok)throw Error("OFFLINE-001 pinned UAL asset download failed: "+response.status);
  const len=Number(response.headers.get("content-length")??0);
  if(len && len!==expected.bytes)throw Error("OFFLINE-001 UAL content length mismatch");
  const bytes=Buffer.from(await response.arrayBuffer());
  if(!validCharacter(bytes))throw Error("OFFLINE-001 UAL hash/size/glTF magic mismatch");
  mkdirSync(charDir,{recursive:true});
  // A failed checksum never overwrites an approved asset.
  writeFileSync(file,bytes);
  return file;
}

function stageDraco() {
  const decoderRoot=join(root,"node_modules","@babylonjs","core","assets","Draco");
  const files=["draco_wasm_wrapper_gltf.js","draco_decoder_gltf.wasm","draco_decoder_gltf.js"];
  mkdirSync(decoderDir,{recursive:true});
  for(const name of files){
    const src=join(decoderRoot,name);
    if(!existsSync(src))throw Error("OFFLINE-001 Babylon package-local decoder missing: "+src);
    const bytes=readFileSync(src);
    if(bytes.length===0)throw Error("OFFLINE-001 empty decoder: "+name);
    // Preserve upstream bytes exactly; runtime URLs now resolve locally.
    copyFileSync(src,join(decoderDir,name));
  }
  return files.map(name=>join(decoderDir,name));
}

const charFile=await stageCharacter();
const decoderFiles=stageDraco();
const inventory=[charFile,...decoderFiles].map(file=>{
  const bytes=readFileSync(file);
  return {
    path:"/"+file.slice(join(root,"public").length+1).replaceAll("\\","/"),
    bytes:bytes.length,
    sha256:digest(bytes),
    role:file===charFile?"required-character":"required-decoder",
  };
});
writeFileSync(join(out,"runtime-resources.json"),
  JSON.stringify({schema:"gtd-offline001-runtime-v1",resources:inventory},null,2)+"\n");
console.info("[OFFLINE-001] Staged and verified "+inventory.length+
  " runtime assets locally; UAL Git blob "+expected.gitBlobSha);
