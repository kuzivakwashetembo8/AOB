/**
 * OFFLINE-001 inventory: content hashes and explicit required-resource evidence.
 * This is an AUDIT, not an OFFLINE-003 installation-ready manifest.
 * It intentionally does not assert that offline navigation, all lazy chunks,
 * licenses or texture/decoder branches have been fully qualified.
 */
import {createHash} from "node:crypto";
import {existsSync,mkdirSync,readdirSync,readFileSync,statSync,writeFileSync} from "node:fs";
import {resolve,join,relative,dirname,sep} from "node:path";

const root=resolve(process.cwd());
const candidates=[
  join(root,".vercel","output","static"),
  join(root,"dist"),
].filter(existsSync);
if(!candidates.length)throw Error("OFFLINE-001 audit: no built output to inspect");
const deploy=candidates[0];
const OUT="offline001-asset-inventory.json";
const REQUIRED=[
  "offline001/character/ual.glb",
  "offline001/draco/draco_wasm_wrapper_gltf.js",
  "offline001/draco/draco_decoder_gltf.wasm",
  "offline001/draco/draco_decoder_gltf.js",
  "Range Rover Sports 2018 (.GLB).glb",
  "toyota hilux 002.glb",
  "Land rover defender 001.glb",
  "dodge_HP.glb",
  "bmw_m4_competition_m_package (1).glb",
  "Lamborghini+Temerario.glb",
  "offline001/fonts/barlow/Barlow-Regular.ttf",
  "offline001/fonts/barlow/Barlow-Medium.ttf",
  "offline001/fonts/barlow/Barlow-SemiBold.ttf",
  "offline001/fonts/barlow/Barlow-Bold.ttf",
  "offline001/fonts/barlowcondensed/BarlowCondensed-Medium.ttf",
  "offline001/fonts/barlowcondensed/BarlowCondensed-SemiBold.ttf",
  "offline001/fonts/barlowcondensed/BarlowCondensed-Bold.ttf",
  "offline001/fonts/barlowcondensed/BarlowCondensed-ExtraBold.ttf",
  "offline001/fonts/ibmplexmono/IBMPlexMono-Regular.ttf",
  "offline001/fonts/ibmplexmono/IBMPlexMono-Medium.ttf",
  "manifest.webmanifest",
];
function visit(dir){
  let results=[];
  for(const name of readdirSync(dir)){
    const full=join(dir,name);
    const stats=statSync(full);
    if(stats.isDirectory())results.push(...visit(full));
    else if(stats.isFile())results.push(full);
  }
  return results;
}
const hashes=new Map();
const files=visit(deploy).filter(p=>relative(deploy,p).replaceAll(sep,"/")!==OUT).map(full=>{
  const bytes=readFileSync(full);
  const path=relative(deploy,full).split(sep).join("/");
  const sha256=createHash("sha256").update(bytes).digest("hex");
  const item={path,bytes:bytes.length,sha256,
    requiredAtBaseline:REQUIRED.includes(path)};
  hashes.set(path,item);
  return item;
}).sort((a,b)=>a.path.localeCompare(b.path));
const vehicleSources=[
  ["Range Rover Sport 2018","Range Rover Sports 2018 (.GLB).glb"],
  ["Toyota Hilux","toyota hilux 002.glb"],
  ["Land Rover Defender","Land rover defender 001.glb"],
  ["Dodge HP","dodge_HP.glb"],
  ["BMW M4","bmw_m4_competition_m_package (1).glb"],
  ["Lamborghini Temerario","Lamborghini+Temerario.glb"],
];
const vehicleSizes=vehicleSources.map(([name,path])=>({
  name,path,bytes:hashes.get(path)?.bytes??null,
  targetBytes:["Range Rover Sport 2018","Lamborghini Temerario"].includes(name)?5_000_000:null,
  // Source size alone is not a measure of material fidelity or actual render memory.
}));
const missing=REQUIRED.filter(path=>!hashes.has(path));
const checksumByHash=new Map();
for(const file of files) {
  const same=checksumByHash.get(file.sha256)??[];
  same.push(file.path);
  checksumByHash.set(file.sha256,same);
}
const duplicates=[...checksumByHash.values()].filter(g=>g.length>1);
const summary={
  schema:"gtd-offline001-inventory-v1",
  source:"verified-build-output",
  builtRoot:relative(root,deploy).split(sep).join("/"),
  generatedAt:new Date().toISOString(),
  fileCount:files.length,
  bytes:files.reduce((total,file)=>total+file.bytes,0),
  requiredCount:REQUIRED.length,
  missing,
  duplicates,
  vehicleSizes,
  futureVehicleSlots:["sedan-a","sedan-b","city-bus","police-car"],
  caveats:[
    "Not an OFFLINE-003 full offline-pack manifest or readiness proof",
    "Static asset hashes do not establish glTF subresource or dynamic chunk runtime closure",
    "Potentially inactive original GLBs and duplicated surface assets are still retained",
    "Potential third-party decoder branches and optional online services require independent runtime Network-trace audit",
  ],
};
const report={...summary,files};
const target=join(deploy,OUT);
writeFileSync(target,JSON.stringify(report,null,2)+"\n");
// Local CI copy: ignored diagnostic state, not an installed resource.
const audit=join(root,".offline001","last-audit.json");
mkdirSync(dirname(audit),{recursive:true});
writeFileSync(audit,JSON.stringify(report,null,2)+"\n");
console.info("[OFFLINE-001] Built inventory: "+files.length+" resources / "+summary.bytes+
  " bytes; missing mandatory="+missing.length+"; duplicate hash groups="+duplicates.length);
if(missing.length)throw Error("OFFLINE-001 build missing: "+missing.join(", "));
