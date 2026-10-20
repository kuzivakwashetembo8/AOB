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
const charDir=join(root,"public","GLBs","Characters");
const decoderDir=join(out,"draco");
const fontDir=join(out,"fonts");
// Google Fonts OFL source files are pinned by both expected size and exact Git blob.
const fonts=[
  ["barlow","Barlow-Regular.ttf",104068,"bb3faec4e243e812b288fbfb9235b12ea781eee4"],
  ["barlow","Barlow-Medium.ttf",103536,"d546e7a376da63b119bfbf67bc3e8bdee0172316"],
  ["barlow","Barlow-SemiBold.ttf",108348,"7c974a4aa67c689a4b2a844b48f624cb4eeaa6bd"],
  ["barlow","Barlow-Bold.ttf",108220,"2f20cbe667ca5cd871410dc50dc4b1a30c1d6267"],
  ["barlowcondensed","BarlowCondensed-Medium.ttf",103360,"eee49eb632153608c0bef5809ceab2418dd617a8"],
  ["barlowcondensed","BarlowCondensed-SemiBold.ttf",109428,"9df66576492bee4bd0559066825472808fa98adc"],
  ["barlowcondensed","BarlowCondensed-Bold.ttf",109912,"9e480f467d703009e3abfce290b2ec2b7d24e188"],
  ["barlowcondensed","BarlowCondensed-ExtraBold.ttf",110296,"d5a6c7505459f142b20d65d3579e1b840462b75f"],
  ["ibmplexmono","IBMPlexMono-Regular.ttf",135580,"0c9770d5183ba60dc4350d3e011b782a320761ae"],
  ["ibmplexmono","IBMPlexMono-Medium.ttf",136704,"33c546f68b6007a45a3f10e845523abb2db25399"],
  ["barlow","OFL.txt",4377,"2f22ba6ca4dbc12145ae40b14c3368f387cba0e2"],
  ["barlowcondensed","OFL.txt",4377,"2f22ba6ca4dbc12145ae40b14c3368f387cba0e2"],
  ["ibmplexmono","OFL.txt",4456,"c35c4c618fab33da8695177b3a6cefe0810b7b28"],
];

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
  // CDN responses may be transfer-compressed; Content-Length can describe the
  // encoded wire representation rather than the decoded GLB bytes. Verify
  // the actual response body length, glTF magic and pinned Git blob SHA below.
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

async function stageFonts(){
  const results=[];
  for(const [family,name,bytesExpected,shaExpected] of fonts){
    const file=join(fontDir,family,name);
    mkdirSync(join(fontDir,family),{recursive:true});
    if(existsSync(file)){
      const old=readFileSync(file);
      if(old.length===bytesExpected&&gitBlob(old)===shaExpected){results.push(file);continue;}
    }
    const url="https://raw.githubusercontent.com/google/fonts/main/ofl/"+
      encodeURIComponent(family)+"/"+encodeURIComponent(name);
    const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw Error("OFFLINE-001 font fetch HTTP "+response.status+": "+family+"/"+name);
    const bytes=Buffer.from(await response.arrayBuffer());
    if(bytes.length!==bytesExpected||gitBlob(bytes)!==shaExpected)
      throw Error("OFFLINE-001 pinned OFL font hash/size mismatch: "+family+"/"+name);
    writeFileSync(file,bytes);
    results.push(file);
  }
  return results;
}

const charFile=await stageCharacter();
const decoderFiles=stageDraco();
const fontFiles=await stageFonts();
const inventory=[charFile,...decoderFiles,...fontFiles].map(file=>{
  const bytes=readFileSync(file);
  return {
    path:"/"+file.slice(join(root,"public").length+1).replaceAll("\\","/"),
    bytes:bytes.length,
    sha256:digest(bytes),
    role:file===charFile?"required-character":
      decoderFiles.includes(file)?"required-decoder":"required-font",
  };
});
writeFileSync(join(out,"runtime-resources.json"),
  JSON.stringify({schema:"gtd-offline001-runtime-v1",resources:inventory},null,2)+"\n");
console.info("[OFFLINE-001] Staged and verified "+inventory.length+
  " runtime assets locally; UAL Git blob "+expected.gitBlobSha);
