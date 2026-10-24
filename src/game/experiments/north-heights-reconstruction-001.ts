/**
 * NH-REBUILD-001 — deterministic, entirely native North Heights visual geometry.
 * The rejected City Pack 8 contributes only design cues (density, skyline variation,
 * and block rhythm). No mesh, material, texture or runtime fetch comes from that GLB.
 * This preview-only procedural grammar is intended for later migration into the
 * canonical CitySpec + BuildingGenerator after owner layout review.
 */
import {
  Color3, Matrix, Mesh, MeshBuilder, Quaternion, Scene, StandardMaterial, Vector3, VertexData,
} from "@babylonjs/core";
import type { BuildingArchetype, BuildingSpec } from "@/game/world-generation/schema";
import { MATERIAL_FAMILIES, type MaterialFamilyId } from "@/game/world-generation/representation-materials";
import { createSurfaceTexture } from "@/game/world-generation/surface-textures";

export interface NorthHeightsGenerated {
  readonly count: number;
  readonly blocks: number;
  readonly instanceCount: number;
  readonly streetCount: number;
  readonly lotSpecs: readonly BuildingSpec[];
  readonly focus: Vector3;
  readonly overview: Vector3;
  readonly dimensions: { width: number; height: number };
}

type Family = "glass" | "office" | "loft" | "residential" | "estate" | "civic";
type Lot = { id: string; x: number; z: number; width: number; depth: number;
  floors: number; floorHeight: number; family: Family; accent: number; block: string; };
type BoxSpec = { x: number; y: number; z: number; w: number; h: number; d: number; rot?: number };
const EXTENT = 320;
const ROAD = 8;
const WALK = 3.75;
const CURB = 0.20;
const STEP = 64;
const STREETS = Array.from({length: 11}, (_, i) => -320 + i * 64);
const MIDPOINTS = Array.from({length: 10}, (_, i) => -288 + i * 64);
const palette: Record<string, string> = {
  "stone-a": "#858681", "stone-b": "#a5a597", "stone-c": "#4e595d",
  "office-a": "#697983", "office-b": "#40565f", "office-c": "#7d8e92",
  "brick-a": "#87695b", "brick-b": "#a47d69", "brick-c": "#c4a58b",
  "res-a": "#d1c4b0", "res-b": "#aba28f", "res-c": "#c3b7a9",
  "roof": "#303c43", "roof-light": "#5c6971", "metal": "#74848b", "mullion": "#344a55",
  "glass": "#31566c", "glass-mid": "#537587", "glass-warm": "#445961",
  "glass-lit": "#9a9071", "glass-dark": "#1d3948",
  "road": "#303536", "pavement": "#696964", "curb": "#85837b",
  "lane": "#b9a069", "concrete": "#9fa4a0",
  "grass": "#36573e", "grass-light": "#587858",
  "trunk": "#675346", "leaf-a": "#3c684f", "leaf-b": "#568462", "leaf-c": "#78946a",
  "door": "#243139", "lamp": "#e7ddb8",
};
const random = (seed: number) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const rnd = random(503021);
const snap = (n: number) => Math.round(n * 1000) / 1000;
const low = (a: number, b: number, c: number) => Math.max(a, Math.min(b, c));
export function northHeightsGround(x: number, z: number) {
  // Lower urban terraces fall toward Meridian Central; northern ridge rises 44m.
  const rise = Math.max(0, (z + 120) / 440);
  return 3.5 + 44 * rise * rise + 0.018 * (x + EXTENT) +
    1.1 * Math.sin(x / 84) + 0.9 * Math.cos(z / 91);
}
function familyAt(ix: number, iz: number, rand: number): Family {
  const x = MIDPOINTS[ix]!, z = MIDPOINTS[iz]!;
  const core = Math.abs(x - 12) / 210 + Math.abs(z + 95) / 270;
  if (z > 145) return rand > 0.25 ? "estate" : "residential";
  if (core < 0.80) return rand < 0.40 ? "glass" : rand < 0.74 ? "office" : "civic";
  if (z < 78 && core < 1.45) return rand < 0.50 ? "loft" : rand < 0.83 ? "office" : "residential";
  return rand < 0.30 ? "loft" : rand < 0.85 ? "residential" : "estate";
}
function floorsFor(family: Family, x: number, z: number, r: number) {
  const landmark = Math.max(0, 1 - (Math.abs(x) + Math.abs(z + 95)) / 310);
  if (family === "glass") return Math.round(15 + r * 19 + landmark * 15);
  if (family === "office") return Math.round(10 + r * 13 + landmark * 7);
  if (family === "civic") return Math.round(7 + r * 9);
  if (family === "loft") return Math.round(4 + r * 7);
  if (family === "residential") return Math.round(4 + r * 7);
  return 2 + Math.floor(r * 3);
}
function planLots(): Lot[] {
  const planned: Lot[] = [];
  for (let iz = 0; iz < MIDPOINTS.length; iz++) {
    for (let ix = 0; ix < MIDPOINTS.length; ix++) {
      const x = MIDPOINTS[ix]!, z = MIDPOINTS[iz]!;
      const block = "NH-" + String(iz + 1).padStart(2,"0") + "-" + String(ix + 1).padStart(2,"0");
      // Intentionally leave overlooks and parks: blocks are not a uniform wall.
      if ((ix * 5 + iz * 7) % 17 === 0 || (iz === 7 && ix === 4)) continue;
      const family = familyAt(ix, iz, rnd());
      const two = family === "estate" || (family !== "glass" && rnd() < 0.45);
      for (let n = 0; n < (two ? 2 : 1); n++) {
        const row = n === 0 ? -1 : 1;
        const footprint = family === "glass" ? 38 : family === "estate" ? 22 : 35;
        const w = (two ? 20 : footprint) + rnd() * (two ? 4 : 6);
        const d = (two ? 31 : footprint) + rnd() * 6;
        const bx = x + (two ? row * 13.5 : 0) + (rnd() - 0.5) * 3.6;
        const bz = z + (rnd() - 0.5) * 4.5;
        const actualFamily = two && family === "office" && rnd() < 0.3 ? "loft" : family;
        planned.push({
          id: block + "-L" + (n + 1), block, x: snap(bx), z: snap(bz),
          width: snap(w), depth: snap(d),
          floors: floorsFor(actualFamily, bx, bz, rnd()),
          floorHeight: actualFamily === "glass" || actualFamily === "office" ? 3.35 : 3.10,
          family: actualFamily, accent: Math.floor(rnd() * 3),
        });
      }
    }
  }
  // Distinct skyline anchors intentionally occupy three civic/core lots.
  for (const lot of planned) {
    if (lot.block === "NH-04-06") { lot.family = "glass"; lot.floors = 53; }
    if (lot.block === "NH-05-05") { lot.family = "office"; lot.floors = 43; }
    if (lot.block === "NH-03-08") { lot.family = "glass"; lot.floors = 39; }
  }
  return planned;
}
function paint(scene: Scene, name: string, hex: string) {
  const mat = new StandardMaterial("nh-rebuild:" + name, scene);
  mat.diffuseColor = Color3.FromHexString(hex);
  mat.specularColor = name.includes("glass") ? new Color3(0.33,0.37,0.39) : new Color3(0.07,0.08,0.08);
  mat.specularPower = name.includes("glass") ? 85 : 22;
  if (name === "glass-lit" || name === "lamp") mat.emissiveColor = mat.diffuseColor.scale(0.2);
  mat.backFaceCulling = false;
  return mat;
}
function terrain(scene: Scene, mat: StandardMaterial) {
  const n = 46, positions: number[] = [], indices: number[] = [], normals: number[] = [];
  const span = EXTENT * 2 + 25;
  for (let row = 0; row <= n; row++) for (let col = 0; col <= n; col++) {
    const x = -span/2 + col * span/n, z = -span/2 + row * span/n;
    positions.push(x, northHeightsGround(x,z) - 0.04, z);
  }
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
    const a = row * (n+1)+col, b = a+1, c = a+n+1, d = c+1;
    indices.push(a,c,b,b,c,d);
  }
  const mesh = new Mesh("nh-ridge-terrain", scene);
  VertexData.ComputeNormals(positions,indices,normals);
  const data = new VertexData();
  data.positions = positions; data.indices = indices; data.normals = normals;
  data.applyToMesh(mesh);
  mesh.material = mat;
  mesh.isPickable = false;
}
function strip(scene: Scene, material: StandardMaterial, name: string, axis: "x"|"z",
  center: number, offset: number, start: number, end: number, width: number, elevation: number) {
  const first: Vector3[] = [], second: Vector3[] = [];
  const count = 56;
  for (let i=0;i<=count;i++) {
    const along = start + (end-start) * i / count;
    const x = axis === "x" ? along : center + offset;
    const z = axis === "x" ? center + offset : along;
    const x2 = axis === "x" ? along : x + width;
    const z2 = axis === "x" ? z + width : along;
    first.push(new Vector3(x, northHeightsGround(x,z)+elevation, z));
    second.push(new Vector3(x2, northHeightsGround(x2,z2)+elevation,z2));
  }
  const mesh = MeshBuilder.CreateRibbon(name, {pathArray:[first,second], sideOrientation:Mesh.DOUBLESIDE}, scene);
  // Use repeatable world-metre UVs, not stretched 0..1 UVs over 640m of road.
  // This shares the exact South Ward procedural asphalt/paving texture grammar.
  const points=mesh.getVerticesData("position")??[];
  const uvs:number[]=[];
  for(let i=0;i<points.length;i+=3) uvs.push(points[i]!/8,points[i+2]!/8);
  mesh.setVerticesData("uv",uvs);
  mesh.material = material;
  mesh.isPickable = false;
}
type Bucket = { material: StandardMaterial; boxes: BoxSpec[] };
class InstancedCity {
  private buckets = new Map<string,Bucket>();
  constructor(private readonly scene: Scene) {
    for (const [name,hex] of Object.entries(palette)) this.buckets.set(name,{material:paint(scene,name,hex),boxes:[]});
    for(const [key,familyId] of [["road","asphalt"],["pavement","sidewalk-paving"]] as const) {
      const family=MATERIAL_FAMILIES[familyId as MaterialFamilyId];
      const mat=this.mat(key);
      mat.diffuseTexture=createSurfaceTexture(scene,{
        key:"nh-rebuild-002:"+key,
        familyId,
        role:"trim",
        color:family.color,
        roughness:family.roughness,
        metalness:family.metalness,
        alpha:family.alpha,
        textureKind:family.textureKind,
        textureScale:{u:1,v:1},
        variation:{tintBucket:0,weathering:.64,grime:.58,patching:.48,uvOffset:{u:.17,v:.39}},
      });
      mat.diffuseColor=Color3.White();
      mat.specularColor=new Color3(.025,.025,.025);
      mat.specularPower=8;
    }
  }
  mat(name: string) { return this.buckets.get(name)!.material; }
  box(name: string, x: number,y:number,z:number, w:number,h:number,d:number, rot=0) {
    if (w < 0.005 || h < 0.005 || d < 0.005) return;
    this.buckets.get(name)!.boxes.push({x,y,z,w,h,d,rot});
  }
  commit() {
    let instances = 0;
    for (const [name,entry] of this.buckets) {
      if (!entry.boxes.length) continue;
      const template = MeshBuilder.CreateBox("nh-instanced:" + name, {size:1},this.scene);
      template.material = entry.material; template.isPickable = false;
      template.receiveShadows = false;
      template.alwaysSelectAsActiveMesh = true;
      const arr = new Float32Array(entry.boxes.length * 16);
      for (let i=0;i<entry.boxes.length;i++) {
        const b=entry.boxes[i]!;
        const matrix = Matrix.Compose(
          new Vector3(b.w,b.h,b.d),
          Quaternion.RotationAxis(Vector3.Up(),b.rot ?? 0),
          new Vector3(b.x,b.y,b.z),
        );
        matrix.copyToArray(arr,i*16);
      }
      template.thinInstanceSetBuffer("matrix",arr,16,true);
      template.thinInstanceRefreshBoundingInfo();
      instances += entry.boxes.length;
      entry.boxes.length=0;
    }
    return instances;
  }
}
// South Ward WORLD-018 road section, adapted to North Heights slope:
// 8m local asphalt, 3.75m raised sidewalks, .2m curb, .14m dashed centre lines.
// Curbs and sidewalks use surface ribbons rather than per-metre meshes.
function buildRoads(scene: Scene, city: InstancedCity) {
  for(const x of STREETS) {
    strip(scene,city.mat("road"),"nh-road-north-south-"+x,"z",x,-ROAD/2,-EXTENT,EXTENT,ROAD,.055);
    strip(scene,city.mat("pavement"),"nh-walk-west-"+x,"z",x,-ROAD/2-WALK,-EXTENT,EXTENT,WALK,.11);
    strip(scene,city.mat("pavement"),"nh-walk-east-"+x,"z",x,ROAD/2+.02,-EXTENT,EXTENT,WALK,.11);
    strip(scene,city.mat("curb"),"nh-curb-west-"+x,"z",x,-ROAD/2-CURB/2,-EXTENT,EXTENT,CURB,.21);
    strip(scene,city.mat("curb"),"nh-curb-east-"+x,"z",x,ROAD/2-CURB/2,-EXTENT,EXTENT,CURB,.21);
    for(let z=-EXTENT+5;z<EXTENT-5;z+=9) {
      if(STREETS.some(v=>Math.abs(z-v)<9))continue;
      city.box("lane",x,northHeightsGround(x,z)+.08,z,.14,.012,3.2);
    }
  }
  for(const z of STREETS) {
    strip(scene,city.mat("road"),"nh-road-east-west-"+z,"x",z,-ROAD/2,-EXTENT,EXTENT,ROAD,.062);
    strip(scene,city.mat("pavement"),"nh-walk-north-"+z,"x",z,-ROAD/2-WALK,-EXTENT,EXTENT,WALK,.11);
    strip(scene,city.mat("pavement"),"nh-walk-south-"+z,"x",z,ROAD/2+.02,-EXTENT,EXTENT,WALK,.11);
    strip(scene,city.mat("curb"),"nh-curb-north-"+z,"x",z,-ROAD/2-CURB/2,-EXTENT,EXTENT,CURB,.21);
    strip(scene,city.mat("curb"),"nh-curb-south-"+z,"x",z,ROAD/2-CURB/2,-EXTENT,EXTENT,CURB,.21);
    for(let x=-EXTENT+5;x<EXTENT-5;x+=9) {
      if(STREETS.some(v=>Math.abs(x-v)<9))continue;
      city.box("lane",x,northHeightsGround(x,z)+.085,z,3.2,.012,.14);
    }
  }
}
/**
 * Window ribbons, not pale per-pane cubes. SOUTH WARD has accepted actual
 * framed glass planes; the nearest hero pass can later add those detailed
 * meshes. For visual skyline inspection a building-scale ribbon yields far
 * fewer draws/instances than the rejected repeated tile grid.
 */
function addFacade(city: InstancedCity, lot:Lot, x:number,z:number, base:number,
  height:number,w:number,d:number,mode:Family,accent:number,mobile:boolean) {
  const levels=Math.max(2,lot.floors);
  const isHigh=mode==="glass"||mode==="office";
  const isHome=mode==="estate"||mode==="residential";
  const pane=isHigh ? ["glass","glass-mid","glass-dark"][accent]! :
    ["glass-warm","glass-dark","glass-mid"][accent]!;
  const step=isHigh?(mobile?3:2):(mobile?4:3);
  const facade=(side:"z"|"x", sign:number)=>{
    const length=side==="z"?w:d;
    const wx=(offset:number)=>side==="z"?x+offset:x+sign*(w/2+.07);
    const wz=(offset:number)=>side==="z"?z+sign*(d/2+.07):z+offset;
    // One slightly inset pane ribbon per two/three storeys reduces optical
    // tiling noise. The wall material remains visible between ribbons.
    for(let floor=1;floor<levels;floor+=step) {
      const remaining=Math.min(step,levels-floor);
      const y=base+(floor+.46*remaining)*lot.floorHeight;
      if(y>base+height-.7)continue;
      const glassHeight=Math.max(1.20,remaining*lot.floorHeight*.61);
      const chosen=(!mobile && ((floor*13+accent*7+sign*3)%37===0))?"glass-lit":pane;
      city.box(chosen,wx(0),y,wz(0),
        side==="z"?length*.80:.085,glassHeight,side==="z"?.085:length*.80);
      // Grouping into a single ribbon retains a distinct window-to-wall rhythm,
      // while sparse dark mullions avoid the bright white checkerboard defect.
    }
    const mullionCount=isHigh?Math.min(6,Math.floor(length/7.5)):Math.min(3,Math.floor(length/9.5));
    for(let i=1;i<mullionCount;i++) {
      const pos=-length/2+length*i/mullionCount;
      city.box("mullion",wx(pos),base+height/2,wz(pos),
        side==="z"?.10:.11,height,side==="z"?.11:.10);
    }
    if(isHigh && !mobile) {
      for(let f=5;f<levels;f+=8) {
        const y=base+f*lot.floorHeight;
        city.box("mullion",wx(0),y,wz(0),
          side==="z"?length+.1:.12,.10,side==="z"?.12:length+.1);
      }
    }
  };
  facade("z",1);facade("z",-1);facade("x",1);facade("x",-1);
  const entrances=isHome?1:2;
  for(let i=0;i<entrances;i++) {
    const offset=(i-(entrances-1)/2)*Math.min(6,w*.23);
    city.box("door",x+offset,base+1.45,z+d/2+.10,2.25,2.85,.11);
    city.box("metal",x+offset,base+2.94,z+d/2+.15,2.7,.13,.16);
  }
}
function buildBuilding(city:InstancedCity, lot:Lot, mobile:boolean) {
  const x=lot.x,z=lot.z,y=northHeightsGround(x,z),w=lot.width,d=lot.depth;
  const style=lot.family, height=lot.floors*lot.floorHeight;
  const wall=style==="glass" ? ["office-b","office-c","office-a"][lot.accent]! :
    style==="office" ? ["office-a","office-b","office-c"][lot.accent]! :
    style==="loft" ? ["brick-a","brick-b","brick-c"][lot.accent]! :
    style==="residential" ? ["res-a","res-b","res-c"][lot.accent]! :
    style==="estate" ? ["res-c","stone-b","res-a"][lot.accent]! : "stone-b";
  const podium = style==="glass" || style==="office";
  const podiumH = podium ? 6.4 : 0;
  city.box("concrete",x,y+.45,z,w+1.8,.9,d+1.8);
  city.box(wall,x,y+height/2+.8,z,w,height,d);
  if(podium) {
    city.box("stone-c",x,y+podiumH/2+.9,z,w+2.6,podiumH,d+2.3);
    for(let c=0;c<Math.floor(w/4);c++) {
      const px=x-w/2+(c+.5)*w/Math.floor(w/4);
      city.box("glass-mid",px,y+3.1,z+d/2+1.27,2.7,3.9,.08);
    }
  }
  addFacade(city,lot,x,z,y+.8,height,w,d,style,lot.accent,mobile);
  // Distinct roof silhouettes: parapets, crowns, elevator headhouses and
  // rooftop mechanics; not a flat repeated UV texture across whole skyline.
  const top = y+height+.8;
  city.box("roof",x,top+.25,z,w+.25,.5,d+.25);
  city.box("roof-light",x,top+.75,z,w+.6,.8,.40);
  city.box("roof-light",x,top+.75,z-d/2,w+.6,.8,.40);
  city.box("roof-light",x-w/2,top+.75,z,.40,.8,d);
  city.box("roof-light",x+w/2,top+.75,z,.40,.8,d);
  const roofLevel = top+1;
  if(style==="glass" || style==="office") {
    const cw=Math.min(12,w*.5),cd=Math.min(10,d*.4);
    city.box("metal",x-2,roofLevel+2.3,z-1,cw,4.6,cd);
    city.box("roof",x-2,roofLevel+4.8,z-1,cw+.55,.45,cd+.55);
    if(lot.floors>35) {
      city.box("metal",x,roofLevel+7.5,z,.32,11,.32);
      city.box("lamp",x,roofLevel+13,z,.6,.35,.6);
    }
  } else {
    city.box("roof-light",x+2,roofLevel+.9,z-2,Math.min(5,w*.22),1.8,Math.min(7,d*.24));
  }
  if(style==="estate") {
    city.box("grass-light",x,y+.40,z+d*.67,w*.78,.30,5);
    city.box("metal",x, y+2.2,z+d/2+3.1,w*.55,1.7,.13);
  }
  return height;
}
function buildGreens(city: InstancedCity, lots:readonly Lot[]) {
  const occupied = new Set(lots.map(l=>l.block));
  let trees=0;
  for (let iz=0;iz<MIDPOINTS.length;iz++) for(let ix=0;ix<MIDPOINTS.length;ix++) {
    const block="NH-"+String(iz+1).padStart(2,"0")+"-"+String(ix+1).padStart(2,"0");
    if(occupied.has(block))continue;
    const x=MIDPOINTS[ix]!, z=MIDPOINTS[iz]!, y=northHeightsGround(x,z);
    city.box("grass",x,y+.17,z,49,.27,49);
    for(let t=0;t<7;t++){
      const tx=x+(rnd()-.5)*37,tz=z+(rnd()-.5)*37,ty=northHeightsGround(tx,tz);
      city.box("trunk",tx,ty+3.1,tz,.65,6.2,.65);
      city.box(["leaf-a","leaf-b","leaf-c"][t%3]!,tx,ty+7.0,tz,4.8,5.0,4.8);
      city.box(["leaf-b","leaf-a","leaf-c"][(t+1)%3]!,tx+1.3,ty+7.9,tz-.7,3.8,3.3,3.8);
      trees++;
    }
  }
  // Dispersed streetside foliage at the northern residential ridge.
  for(let ix=0;ix<MIDPOINTS.length;ix++) for(let iz=7;iz<MIDPOINTS.length;iz++) {
    const x=MIDPOINTS[ix]!+23, z=MIDPOINTS[iz]!, y=northHeightsGround(x,z);
    city.box("trunk",x,y+2.8,z,.55,5.6,.55);
    city.box("leaf-c",x,y+6.5,z,4.5,4.9,4.5);
    trees++;
  }
  return trees;
}
function addStreetFurniture(city: InstancedCity) {
  let lights=0;
  for(const x of STREETS) for(let i=0;i<STREETS.length;i+=2) {
    const z=STREETS[i]!+28, poleX=x+7.25, y=northHeightsGround(poleX,z);
    city.box("metal",poleX,y+4.2,z,.20,8.4,.20);
    city.box("metal",poleX-1.2,y+8.35,z,2.4,.14,.18);
    city.box("lamp",poleX-2.36,y+8.2,z,.65,.14,.45);
    lights++;
  }
  return lights;
}
export function buildNorthHeightsReconstruction(scene:Scene, mobile:boolean):NorthHeightsGenerated {
  const city=new InstancedCity(scene);
  terrain(scene,city.mat("grass"));
  buildRoads(scene,city);
  const lots=planLots();
  const lotSpecs: BuildingSpec[]=[];
  let tall=0;
  for (const lot of lots) {
    tall=Math.max(tall,buildBuilding(city,lot,mobile)+northHeightsGround(lot.x,lot.z));
    const archetype: BuildingArchetype =
      lot.family==="glass" ? "podium-tower" :
      lot.family==="office" || lot.family==="civic" ? "office" :
      lot.family==="loft" ? "mixed-use" : "residential";
    lotSpecs.push({
      id:lot.id, seed:lot.id, archetype, yawRadians:0,
      position:{x:lot.x,y:northHeightsGround(lot.x,lot.z),z:lot.z},
      overrides:{width:lot.width,depth:lot.depth,
        floors:lot.floors,floorHeight:lot.floorHeight,
        lodProfile:lot.family==="glass"?"skyline":"standard"},
    });
  }
  const trees=buildGreens(city,lots);
  const lamps=addStreetFurniture(city);
  const instances=city.commit();
  console.info("[NH-REBUILD-001] procedural world",{
    buildings:lots.length,trees,lamps,instances,modelsFromRejectedPack:0,
    mobile,layout:"10x10 city blocks with terrain ridge; deterministic NH-001",
  });
  return {
    count:lots.length,blocks:100,streetCount:STREETS.length*2,instanceCount:instances,
    lotSpecs,dimensions:{width:EXTENT*2,height:tall},
    focus:new Vector3(-30,northHeightsGround(-30,-35)+1.5,-35),
    overview:new Vector3(142,103,-251),
  };
}
