import {describe,it,expect} from "vitest";
import {Document,NodeIO} from "@gltf-transform/core";
import {identify,islands,isolatedPrimitive} from "../../scripts/wheel001_extract_wheels.mjs";

describe("WHEEL-002 source material and wheel integrity",()=>{
  it("preserves normalized integer COLOR_0 (Dodge-style color fidelity) across the exported GLB",async()=>{
    const doc=new Document(),buf=doc.createBuffer();
    const primitive=doc.createPrimitive()
      .setAttribute("POSITION",doc.createAccessor().setBuffer(buf)
        .setType("VEC3").setArray(new Float32Array([
          0,0,0, 1,0,0, 0,1,0,
        ])))
      .setAttribute("COLOR_0",doc.createAccessor().setBuffer(buf)
        .setType("VEC4").setNormalized(true)
        .setArray(new Uint8Array([
          32,58,100,255, 70,80,120,255, 90,95,105,255,
        ])))
      .setAttribute("TEXCOORD_0",doc.createAccessor().setBuffer(buf)
        .setType("VEC2").setNormalized(true)
        .setArray(new Uint16Array([0,0,65535,0,0,65535])))
      .setIndices(doc.createAccessor().setBuffer(buf)
        .setType("SCALAR").setArray(new Uint16Array([0,1,2])));
    const extracted=isolatedPrimitive(doc,primitive,[0,1,2],[0,0,0]);
    expect(extracted.getAttribute("COLOR_0")?.getNormalized()).toBe(true);
    expect(extracted.getAttribute("TEXCOORD_0")?.getNormalized()).toBe(true);
    expect(extracted.getAttribute("COLOR_0")?.getArray()).toEqual(
      new Uint8Array([32,58,100,255,70,80,120,255,90,95,105,255]));
    const mesh=doc.createMesh("source-wheel").addPrimitive(extracted);
    doc.createScene().addChild(doc.createNode("wheel").setMesh(mesh));
    const io=new NodeIO();
    const reopened=await io.readBinary(await io.writeBinary(doc));
    const actual=reopened.getRoot().listMeshes()[0]!.listPrimitives()[0]!;
    expect(actual.getAttribute("COLOR_0")?.getNormalized()).toBe(true);
    expect(actual.getAttribute("TEXCOORD_0")?.getNormalized()).toBe(true);
    expect(actual.getAttribute("COLOR_0")?.getArray()).toEqual(
      new Uint8Array([32,58,100,255,70,80,120,255,90,95,105,255]));
  });

  it("moves complete source-backed wheel islands, including small rim and hub details",()=>{
    const positions:number[]=[],indices:number[]=[];
    function vert(x:number,y:number,z:number){
      const id=positions.length/3;positions.push(x,y,z);return id;
    }
    // Chassis deliberately connected separately and outside the wheel
    // cylinder, so the tire selector cannot invent body geometry.
    const body=[
      vert(-.90,.23,-2.5),vert(.90,.23,-2.5),
      vert(-.90,1.90,2.5),vert(.90,1.90,2.5),
    ];
    indices.push(body[0]!,body[1]!,body[2]!,body[1]!,body[3]!,body[2]!);
    let smallParts=0;
    for(const [x,z] of [[1,1.7],[-1,1.7],[1,-1.7],[-1,-1.7]]){
      const rings=[[],[]] as number[][];
      for(let t=0;t<64;t++){
        const a=t/64*2*Math.PI;
        rings[0]!.push(vert(x-.13,.43+.40*Math.sin(a),z+.40*Math.cos(a)));
        rings[1]!.push(vert(x+.13,.43+.40*Math.sin(a),z+.40*Math.cos(a)));
      }
      for(let t=0;t<64;t++){
        const n=(t+1)%64;
        indices.push(rings[0]![t]!,rings[1]![t]!,rings[0]![n]!,
          rings[1]![t]!,rings[1]![n]!,rings[0]![n]!);
      }
      // Small original wheel cap with too few triangles for the old script.
      const middle=vert(x+.145,.43,z),perimeter:number[]=[];
      for(let t=0;t<12;t++){
        const a=t/12*Math.PI*2;
        perimeter.push(vert(x+.145,.43+.11*Math.sin(a),z+.11*Math.cos(a)));
      }
      for(let t=0;t<12;t++)
        indices.push(middle,perimeter[t]!,perimeter[(t+1)%12]!);
      smallParts++;
    }
    const matrix=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
    const result=identify(islands(
      new Float32Array(positions),new Uint32Array(indices),matrix));
    expect(Object.keys(result.selected)).toHaveLength(4);
    expect(result.removed.size).toBeGreaterThan(4);
    expect(result.selected.frontLeft.parts.length).toBeGreaterThan(1);
    const original=indices.length/3;
    const moved=Object.values(result.selected)
      .reduce((n,w)=>n+w.parts.reduce((total,p)=>total+p.tris.length/3,0),0);
    const remaining=indices.length/3-moved;
    expect(remaining+moved).toBe(original);
    expect(remaining).toBe(2); // exactly the two original chassis triangles
    expect(smallParts).toBe(4);
  });
});
