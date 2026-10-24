/**
 * NH-REBUILD-001 — deterministic, entirely native North Heights visual geometry.
 * The rejected City Pack 8 contributes only design cues (density, skyline variation,
 * and block rhythm). No mesh, material, texture or runtime fetch comes from that GLB.
 * This preview-only procedural grammar is intended for later migration into the
 * canonical CitySpec + BuildingGenerator after owner layout review.
 */
import {
  Color3, Material, Matrix, Mesh, MeshBuilder, Quaternion, Scene, StandardMaterial, Vector3, VertexData,
} from "@babylonjs/core";
import type { BuildingArchetype, BuildingSpec } from "@/game/world-generation/schema";
import { MATERIAL_FAMILIES, type MaterialFamilyId } from "@/game/world-generation/representation-materials";
import { createSurfaceTexture } from "@/game/world-generation/surface-textures";
import { createNorthHeightsRoads003 } from "./north-heights-roads-003";
import { attachNorthHeightsGrass004, planNorthHeightsTrees004, type TreeLocation } from "./north-heights-trees-004";

export interface NorthHeightsGenerated {
  readonly count: number;
  readonly blocks: number;
  readonly instanceCount: number;
  readonly treeLocations: readonly TreeLocation[];
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
  "door": "#243139", "lamp": "#e7ddb8", "interior": "#151b22", "crosswalk": "#deded8",
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
function planLots(rnd: () => number): Lot[] {
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
  if (name === "glass" || name === "glass-mid" || name === "glass-dark" || name === "glass-warm") {
    mat.alpha = 0.74;
    mat.transparencyMode = Material.MATERIAL_ALPHABLEND;
    mat.disableDepthWrite = true;
  }
  mat.backFaceCulling = false;
  return mat;
}
function terrain(scene: Scene, mat: StandardMaterial) {
  const n = 46, positions: number[] = [], indices: number[] = [], normals: number[] = [], uvs: number[] = [];
  const span = EXTENT * 2 + 25;
  for (let row = 0; row <= n; row++) for (let col = 0; col <= n; col++) {
    const x = -span/2 + col * span/n, z = -span/2 + row * span/n;
    positions.push(x, northHeightsGround(x,z) - 0.04, z);
    uvs.push(x/5,z/5);
  }
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
    const a = row * (n+1)+col, b = a+1, c = a+n+1, d = c+1;
    indices.push(a,c,b,b,c,d);
  }
  const mesh = new Mesh("nh-ridge-terrain", scene);
  VertexData.ComputeNormals(positions,indices,normals);
  const data = new VertexData();
  data.positions = positions; data.indices = indices; data.normals = normals; data.uvs = uvs;
  data.applyToMesh(mesh);
  mesh.material = mat;
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
/**
 * REBUILD-003 square 3.0m module. The original solid exterior box has been
 * removed. Instead these are actual wall piers and spandrel strips bordering
 * square clear openings. A continuous *transparent* glazing plane is placed
 * behind the openings, with a dark inset interior core further behind.
 *
 * One tint per building; no randomly lit white windows. Glass towers use
 * narrow dark mullions; residential/brick uses wider solid spandrels.
 */
function addFacade(city: InstancedCity, lot:Lot, x:number,z:number,base:number,
  height:number,w:number,d:number,mode:Family,accent:number,mobile:boolean,wall:string){
  const isHigh=mode==="glass"||mode==="office";
  const pane=(isHigh?["glass","glass-mid","glass-dark"]:["glass-warm","glass-dark","glass-mid"])[accent]!;
  const frame=isHigh?"mullion":wall;
  const floors=Math.max(2,lot.floors);
  const sill=isHigh?.38:.62;
  const bayTarget=3.15;
  const facade=(side:"x"|"z",sign:number)=>{
    const length=side==="z"?w:d;
    const bays=Math.max(2,Math.round(length/bayTarget));
    const bay=length/bays;
    // The glazed sheet is an actual transmissive surface; no opaque exterior
    // geometry is generated over or behind individual square apertures.
    const xg=side==="z"?x:x+sign*(w/2-.20);
    const zg=side==="z"?z+sign*(d/2-.20):z;
    city.box(pane,xg,base+height/2,zg,
      side==="z"?length-.5:.055,height-.50,side==="z"?.055:length-.5);
    const xf=(at:number)=>side==="z"?x+at:x+sign*(w/2+.06);
    const zf=(at:number)=>side==="z"?z+sign*(d/2+.06):z+at;
    // Vertical piers (true facade solids) terminate at each window edge.
    for(let col=0;col<=bays;col++){
      const at=-length/2+col*bay;
      city.box(frame,xf(at),base+height/2,zf(at),
        side==="z"?isHigh?.16:.44:.16,height,side==="z"?.16:isHigh?.16:.44);
    }
    // Continuous physical sills/spandrels with apertures between; horizontal
    // grid level remains 1:1-ish with 3.35/3.10m storey heights.
    const stride=mobile&&floors>20?2:1;
    for(let floor=0;floor<=floors;floor+=stride){
      const y=base+Math.min(floor,floors)*lot.floorHeight+.13;
      if(y>base+height+.2)break;
      city.box(frame,xf(0),y,zf(0),
        side==="z"?length:.20,sill,side==="z"?.20:length);
    }
    if(floors%stride!==0)
      city.box(frame,xf(0),base+height-.02,zf(0),side==="z"?length:.20,sill,side==="z"?.20:length);
  };
  facade("z",1);facade("z",-1);facade("x",1);facade("x",-1);
  const entrances=(mode==="estate"||mode==="residential")?1:2;
  for(let i=0;i<entrances;i++){
    const offset=(i-(entrances-1)/2)*Math.min(6,w*.23);
    city.box("door",x+offset,base+1.45,z+d/2+.35,2.3,2.8,.13);
    city.box("metal",x+offset,base+2.93,z+d/2+.39,2.75,.12,.17);
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
  // No exterior solid wall behind the windows. Inset service core reads as
  // dark interior depth through 0.74-alpha glass rather than a painted cube.
  const interiorMargin=Math.min(4,Math.min(w,d)*.13);
  city.box("interior",x,y+height/2+.8,z,w-2*interiorMargin,height-.15,d-2*interiorMargin);
  // Interior floor slabs at selected levels create parallax behind glazing,
  // without loading dozens of fully modeled rooms in a distant tower.
  for(let f=3;f<lot.floors;f+=Math.max(3,mobile?7:5))
    city.box("roof",x,y+f*lot.floorHeight+.8,z,w-1.4,.16,d-1.4);
  if(podium) {
    // Open-sided podium: structural corner piers, not an opaque box hiding glass.
    for(const sx of [-1,1])for(const sz of [-1,1])
      city.box("stone-c",x+sx*(w/2+.7),y+podiumH/2+.9,z+sz*(d/2+.7),1.1,podiumH,1.1);
    city.box("stone-c",x,y+podiumH+.9,z,w+2.4,.55,d+2.4);
    for(let c=0;c<Math.floor(w/4);c++) {
      const px=x-w/2+(c+.5)*w/Math.floor(w/4);
      city.box("glass-mid",px,y+3.1,z+d/2+1.27,2.7,3.9,.08);
    }
  }
  addFacade(city,lot,x,z,y+.8,height,w,d,style,lot.accent,mobile,wall);
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
  attachNorthHeightsGrass004(scene,city.mat("grass"));
  terrain(scene,city.mat("grass"));
  const roads=createNorthHeightsRoads003(scene,STREETS,northHeightsGround,{
    asphalt:city.mat("road"),pavement:city.mat("pavement"),
    curb:city.mat("curb"),crossing:city.mat("crosswalk"),
  });
  console.info("[NH-REBUILD-003] South Ward road batch",roads);
  const rnd=random(503021);
  const lots=planLots(rnd);
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
  const lamps=addStreetFurniture(city);
  const instances=city.commit();
  const treeLocations=planNorthHeightsTrees004(
    MIDPOINTS,new Set(lots.map(l=>l.block)),northHeightsGround,mobile,
  );
  const trees=treeLocations.length;
  console.info("[NH-REBUILD-004] owner tree positions planned",{
    trees,asset:"tree_low_poly_lowpoly.glb",generatedCanopyCards:0,
  });
  console.info("[NH-REBUILD-001] procedural world",{
    buildings:lots.length,trees,lamps,instances,modelsFromRejectedPack:0,
    mobile,layout:"10x10 city blocks with terrain ridge; deterministic NH-001",
  });
  return {
    count:lots.length,blocks:100,streetCount:STREETS.length*2,instanceCount:instances,
    treeLocations,
    lotSpecs,dimensions:{width:EXTENT*2,height:tall},
    focus:new Vector3(-30,northHeightsGround(-30,-35)+1.5,-35),
    overview:new Vector3(142,103,-251),
  };
}
