import {describe,expect,it} from "vitest";
import {readFileSync,statSync} from "node:fs";
import {isPoi011VehicleSignalMesh021} from "../game/experiments/north-heights-traffic-signal-renderer-021";
/** Pure GLB manifest qualification; no Babylon renderer needed to validate
 * source availability, binary GLB header, version and embedded glTF mesh metadata. */
const ROOT="public/GLBs/Infrastructure/";
// The hanging source is retained as an unreferenced repository asset, but
// the owner rejected it for gameplay. Only the accepted roadside GLB is tested.
const files=[
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
  // The original owner GLB has fifteen geometries. Only seven belong to
  // the road traffic head, arm and supporting rod. Eight auxiliary meshes
  // form the separate passenger head and camera seen floating in the preview.
  const names=(gltf.meshes as {name:string}[]).map(m=>m.name);
  const vehicle=names.filter(isPoi011VehicleSignalMesh021);
  const extra=names.filter(n=>!isPoi011VehicleSignalMesh021(n));
  expect(names).toHaveLength(15);
  expect(vehicle).toHaveLength(7);
  expect(vehicle.some(n=>n.startsWith("rod_"))).toBe(true);
  expect(vehicle.filter(n=>n.startsWith("lightTrafficMain_"))).toHaveLength(4);
  expect(vehicle.filter(n=>n.startsWith("lightTrafficArm_"))).toHaveLength(2);
  expect(extra).toHaveLength(8);
  expect(extra.filter(n=>n.startsWith("lightPassengerArm_"))).toHaveLength(2);
  expect(extra.filter(n=>n.startsWith("lightPassengerMain_"))).toHaveLength(3);
  expect(extra.filter(n=>n.startsWith("camera_"))).toHaveLength(3);
  const renderer=readFileSync("src/game/experiments/north-heights-traffic-signal-renderer-021.ts","utf8");
  expect(renderer).toContain("for(const mesh of excluded)mesh.dispose(false,false)");
  expect(renderer).not.toContain('readSource(scene,"hanging")');
  const externalResources=(gltf.buffers??[]).concat(gltf.images??[])
   .filter((o:{uri?:string})=>typeof o.uri==="string"&&
    !o.uri.startsWith("data:")).map((o:{uri:string})=>o.uri);
  console.info("[POI-011] source qualification",{file:file.name,
   meshes:gltf.meshes?.length,materials:gltf.materials?.map((m:{name?:string})=>m.name),
   nodes:gltf.nodes?.length,externalResources});
 });
});
