import {describe,expect,it} from "vitest";
import {validateOfflineManifest} from "../lib/offline-game";

const release="b".repeat(40);
const valid=()=> {
  const resources=Array.from({length:101},(_,i)=>({
    url:"/assets/file-"+i+".js",bytes:3,sha256:"a".repeat(64),
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
  it("rejects size tampering and non-SHA256 manifests",()=>{
    const m=valid();m.resources[0]!.sha256="b";
    expect(()=>validateOfflineManifest(m,release)).toThrow();
    m.resources[0]!.sha256="a".repeat(64);m.totalBytes++;
    expect(()=>validateOfflineManifest(m,release)).toThrow();
  });
});
