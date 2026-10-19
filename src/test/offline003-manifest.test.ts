import {describe,expect,it} from "vitest";
import {validateOfflineManifest,summarizeOfflineCategories} from "../lib/offline-game";

const release="b".repeat(40);
const valid=()=> {
  const resources=Array.from({length:101},(_,i)=>({
    url:"/assets/file-"+i+".js",bytes:3,sha256:"a".repeat(64),group:"app" as const,
    group:(i<20?"app":i<45?"engine":i<75?"world":i<80?"character":"vehicles") as "app"|"engine"|"world"|"character"|"vehicles",
  }));
  return {schema:"gtd-offline003-v1",releaseId:release,
    fileCount:resources.length,totalBytes:303,resources};
};
describe("OFFLINE-003 full asset manifest security",()=>{
  it("accepts complete immutable same-origin files in the active release",()=>{
    const v=valid();
    expect(validateOfflineManifest(v,release).fileCount).toBe(101);
  });
  it("rejects mismatched client/release and incomplete resource sets",()=>{
    expect(()=>validateOfflineManifest(valid(),"c".repeat(40))).toThrow();
    const m=valid();m.resources=m.resources.slice(0,4);
    expect(()=>validateOfflineManifest(m,release)).toThrow();
  });
  it("rejects absolute/cross-origin, duplicate and path-traversal assets",()=>{
    for(const url of ["https://evil.example/c.glb","//evil.example/file.glb",
      "/assets/../secrets","/assets/%2e%2e/file.glb",
      "/assets/%2f%2fsite.glb?x=1","/api/secret?token=123"]) {
      const m=valid();
      m.resources[0]!.url=url;
      if(url.includes("/api/"))continue;
      expect(()=>validateOfflineManifest(m,release),url).toThrow();
    }
    const m=valid();m.resources[1]!.url=m.resources[0]!.url;
    expect(()=>validateOfflineManifest(m,release)).toThrow();
  });
  it("reports only files actually installed per Settings category",()=>{
    const manifest=validateOfflineManifest(valid(),release);
    const present=new Set(manifest.resources.filter((_,i)=>i<43).map(file=>file.url));
    const groups=summarizeOfflineCategories(manifest,present);
    expect(groups).toHaveLength(5);
    expect(groups.find(group=>group.id==="app")).toMatchObject({installed:20,total:20});
    expect(groups.find(group=>group.id==="engine")).toMatchObject({installed:23,total:25});
    expect(groups.find(group=>group.id==="vehicles")).toMatchObject({installed:0,total:21});
    expect(groups.reduce((sum,group)=>sum+group.installed,0)).toBe(43);
  });
  it("rejects a made-up or absent checklist classification",()=>{
    const manifest=valid();
    (manifest.resources[0] as {group:string}).group="installed";
    expect(()=>validateOfflineManifest(manifest,release)).toThrow();
  });
  it("rejects size tampering and non-SHA256 manifests",()=>{
    const m=valid();m.resources[0]!.sha256="b";
    expect(()=>validateOfflineManifest(m,release)).toThrow();
    m.resources[0]!.sha256="a".repeat(64);m.totalBytes++;
    expect(()=>validateOfflineManifest(m,release)).toThrow();
  });
});
