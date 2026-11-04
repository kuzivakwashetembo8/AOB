import {describe,expect,it} from "vitest";
import {readFileSync,statSync} from "node:fs";
/** Pure GLB manifest qualification; no Babylon renderer needed to validate
 * source availability, binary GLB header, version and embedded glTF mesh metadata. */
const ROOT="public/GLBs/Infrastructure/";
const files=[
 {name:"Traffic Light 2e (hanging).glb",size:320520},
 {name:"traffic_light_-_free_low_poly.glb",size:796084},
] as const;
describe("POI-011 source GLB integrity before scene placement",()=>{
 for(const file of files)it("reads and inspects "+file.name,()=>{
  const full=ROOT+file.name;
  const data=readFileSync(full);
  expect(statSync(full).size).toBe(file.size);
  expect(data.readUInt32LE(0)).toBe(0x46546c67);
  expect(data.readUInt32LE(4)).toBe(2);
  expect(data.readUInt32LE(8)).toBe(data.byteLength);
  const jsonLength=data.readUInt32LE(12);
  expect(data.toString("utf8",16,20)).toBe("JSON");
  expect(jsonLength).toBeGreaterThan(50);
  expect(jsonLength).toBeLessThan(data.byteLength);
  const gltf=JSON.parse(data.toString("utf8",20,20+jsonLength));
  expect(gltf.asset?.version).toBe("2.0");
  expect(gltf.meshes?.length??0).toBeGreaterThan(0);
  const externalResources=(gltf.buffers??[]).concat(gltf.images??[])
   .filter((o:{uri?:string})=>typeof o.uri==="string"&&
    !o.uri.startsWith("data:")).map((o:{uri:string})=>o.uri);
  console.info("[POI-011] source qualification",{file:file.name,
   meshes:gltf.meshes?.length,materials:gltf.materials?.map((m:{name?:string})=>m.name),
   nodes:gltf.nodes?.length,externalResources});
 });
});
