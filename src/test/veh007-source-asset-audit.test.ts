/** Temporary, read-only forensic witness of the actual user-supplied Range Rover.
 * Parses the GLB's JSON chunk only; never modifies source bytes.
 */
import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

describe("VEH007 Range Rover source-GLB wheel and cabin hierarchy audit",()=>{
  it("reports original nodes, meshes, wheel geometry, and steering references",()=>{
    const binary=readFileSync(resolve(process.cwd(),
      "public/Range Rover Sports 2018 (.GLB).glb"));
    expect(binary.toString("ascii",0,4)).toBe("glTF");
    const jsonLength=binary.readUInt32LE(12);
    expect(binary.toString("ascii",16,20)).toBe("JSON");
    const gltf=JSON.parse(binary.subarray(20,20+jsonLength).toString("utf8")) as {
      nodes:{name?:string;mesh?:number;children?:number[];translation?:number[];rotation?:number[];scale?:number[]}[];
      meshes:{name?:string;primitives:{attributes:{POSITION:number};material?:number}[]}[];
      accessors:{min?:number[];max?:number[]}[];
      materials?:{name?:string}[];
      scenes?:{nodes?:number[]}[];
    };
    const byName=gltf.nodes.map((node,i)=>({
      i,name:node.name??"",mesh:node.mesh??null,
      children:node.children?.length??0,translation:node.translation,
      scale:node.scale,
    }));
    const wheelFilter=/wheel|tyre|tire|rim|brake|rotor|steering|hub|disc/i;
    const wheelNodes=byName.filter(n=>wheelFilter.test(n.name));
    // Assert the actual committed GLB, not an artist's assumed wheel labels.
    const expected=["FL Wheel","FR Wheel","BL Wheel","BR Wheel"];
    expect(wheelNodes.filter(x=>/wheel/i.test(x.name)).map(x=>x.name).sort())
      .toEqual([...expected].sort());
    expect(gltf.nodes.find(n=>n.name==="Body")?.mesh).toBeDefined();
    expect(gltf.nodes.some(n=>n.name==="FL Brake")).toBe(true);
    expect(gltf.nodes.some(n=>n.name==="FR Brake")).toBe(true);
    const front=gltf.nodes.filter(n=>/^F[LR] Wheel$/.test(n.name??""));
    const rear=gltf.nodes.filter(n=>/^B[LR] Wheel$/.test(n.name??""));
    expect(front).toHaveLength(2);
    expect(rear).toHaveLength(2);
    expect(front.every(n=>n.mesh!==undefined)).toBe(true);
    expect(rear.every(n=>n.mesh!==undefined)).toBe(true);
    const frontAxle=front.reduce((s,n)=>s+n.translation![0]!,0)/2;
    const rearAxle=rear.reduce((s,n)=>s+n.translation![0]!,0)/2;
    expect(frontAxle-rearAxle).toBeGreaterThan(2);
    const firstSide=gltf.nodes.find(n=>n.name==="FL Wheel")!;
    const otherSide=gltf.nodes.find(n=>n.name==="FR Wheel")!;
    expect(Math.abs(firstSide.translation![2]!-otherSide.translation![2]!))
      .toBeGreaterThan(1);
    expect(gltf.meshes.length).toBeGreaterThan(0);
  });
});
