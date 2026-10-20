/** OBS-103: inspect the actual optimized Rover GLB; do not demand
 * pivots from the 24 MB predecessor, which has been removed.
 * Optimizers can flatten wheel meshes. Runtime wheel readiness must be
 * evaluated independently; GLB validity is not proof of driving readiness.
 */
import {describe,it,expect} from "vitest";
import {readFileSync,existsSync} from "node:fs";
import {resolve} from "node:path";
describe("VEH007 optimized Range Rover source admission",()=>{
  it("retains a valid GLB and no unoptimized Rover copy",()=>{
    const folder=resolve(process.cwd(),"public/GLBs/Cars");
    const binary=readFileSync(resolve(folder,"Range Rover Sports 2018 (.GLB).glb"));
    expect(binary.byteLength).toBe(1605108);
    expect(binary.toString("ascii",0,4)).toBe("glTF");
    expect(binary.readUInt32LE(8)).toBe(binary.length);
    const len=binary.readUInt32LE(12);
    expect(binary.toString("ascii",16,20)).toBe("JSON");
    expect(len).toBeGreaterThan(2);
    const doc=JSON.parse(binary.subarray(20,20+len).toString("utf8")) as {
      nodes?:{name?:string}[];meshes?:unknown[];materials?:unknown[];
    };
    expect(doc.meshes?.length??0).toBeGreaterThan(0);
    expect(doc.nodes?.length??0).toBeGreaterThan(0);
    expect(existsSync(resolve(folder,"Range Rover Sports 2018 (.GLB) (1).glb"))).toBe(false);
  });
});