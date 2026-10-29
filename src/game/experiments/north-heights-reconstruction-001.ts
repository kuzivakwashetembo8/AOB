/**
 * NH-REBUILD-001 — deterministic, entirely native North Heights visual geometry.
 * The rejected City Pack 8 contributes only design cues (density, skyline variation,
 * and block rhythm). No mesh, material, texture or runtime fetch comes from that GLB.
 * This preview-only procedural grammar is intended for later migration into the
 * canonical CitySpec + BuildingGenerator after owner layout review.
 */
import {
  Color3, DynamicTexture, FresnelParameters, Material, Matrix, Mesh, MeshBuilder, Quaternion, Scene, StandardMaterial, Texture, Vector3, VertexData,
} from "@babylonjs/core";
import type { BuildingArchetype, BuildingSpec } from "@/game/world-generation/schema";
import { MATERIAL_FAMILIES, type MaterialFamilyId } from "@/game/world-generation/representation-materials";
import { createSurfaceTexture } from "@/game/world-generation/surface-textures";
import { createNorthHeightsRoads003 } from "./north-heights-roads-003";
import { attachNorthHeightsGrass004, planNorthHeightsTrees004, type TreeLocation } from "./north-heights-trees-004";
import {createNorthHeightsBlockSurfaces008} from "./north-heights-block-surfaces-008";
import {NORTH_HEIGHTS_PARKING_LOTS_010,NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010,
 NORTH_HEIGHTS_PORTAL_WIDTH_010,NORTH_HEIGHTS_PORTAL_HEIGHT_010} from "./north-heights-spatial-plan-010";

export interface NorthHeightsGenerated {
  readonly count: number;
  readonly blocks: number;
  readonly instanceCount: number;
  readonly treeLocations: readonly TreeLocation[];
  readonly streetCount: number;
  readonly lotSpecs: readonly BuildingSpec[];
  readonly parkingLots: typeof NORTH_HEIGHTS_PARKING_LOTS_010;
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
  "interior-white": "#ffffff",
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
/**
 * Cheap static, skyline/sky reflection panorama. Babylon's SPHERICAL mapping
 * keeps the accepted semi-transparent square apertures, adding sky/sun glints
 * without a costly real-time reflection probe per building.
 */
function createGlassReflection005(scene:Scene):DynamicTexture{
  const tex=new DynamicTexture("nh005-glass-urban-sky-reflection",{
    width:256,height:128,
  },scene,false);
  const ctx=tex.getContext() as CanvasRenderingContext2D;
  const gradient=ctx.createLinearGradient(0,0,0,128);
  gradient.addColorStop(0,"#b8d5e5");
  gradient.addColorStop(.32,"#84a8c3");
  gradient.addColorStop(.53,"#d8dbd0");
  gradient.addColorStop(.56,"#566f80");
  gradient.addColorStop(1,"#2f4855");
  ctx.fillStyle=gradient;ctx.fillRect(0,0,256,128);
  const random=randomReflection005(4598);
  for(let i=0;i<48;i++){
    const x=random()*256,w=2+random()*10,h=6+random()*34;
    ctx.fillStyle=i%3===0?"rgba(27,47,63,.29)":"rgba(48,70,79,.18)";
    ctx.fillRect(x,72-h,w,h);
  }
  ctx.fillStyle="rgba(252,247,225,.45)";
  ctx.fillRect(174,8,3,100);
  ctx.fillRect(180,15,1,88);
  tex.update(false);
  tex.coordinatesMode=Texture.SPHERICAL_MODE;
  tex.level=.24;
  return tex;
}
function randomReflection005(seed:number){
  let v=seed>>>0;return()=>{v=(Math.imul(v,1664525)+1013904223)>>>0;return v/4294967296;};
}
type Bucket = { material: StandardMaterial; boxes: BoxSpec[] };
class InstancedCity {
  private buckets = new Map<string,Bucket>();
  constructor(private readonly scene: Scene) {
    for (const [name,hex] of Object.entries(palette)) this.buckets.set(name,{material:paint(scene,name,hex),boxes:[]});
    const environment=createGlassReflection005(scene);
    for(const name of ["glass","glass-mid","glass-warm","glass-dark"]){
      const material=this.mat(name);
      material.reflectionTexture=environment;
      material.specularColor=new Color3(.63,.70,.76);
      material.specularPower=125;
      const fresnel=new FresnelParameters();
      fresnel.bias=.08;fresnel.power=2.7;
      fresnel.leftColor=Color3.White();
      fresnel.rightColor=Color3.Black();
      material.reflectionFresnelParameters=fresnel;
    }
    for(const [key,familyId] of [["road","asphalt"]] as const) {
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
    const entranceFace=side==="z"&&sign===1;
    const openingWidth=Math.min(NORTH_HEIGHTS_PORTAL_WIDTH_010,w*.45);
    if(entranceFace){
      // GLASS MAIN PRESERVED: identical pane material, only remove the real
      // physical window surface from the doorway rectangle at ground level.
      const panelSpan=(length-.5-openingWidth)/2;
      for(const direction of [-1,1])
        city.box(pane,x+direction*(openingWidth/2+panelSpan/2),base+height/2,zg,
          panelSpan,height-.50,.055);
      if(height>NORTH_HEIGHTS_PORTAL_HEIGHT_010+.6)
        city.box(pane,x,base+NORTH_HEIGHTS_PORTAL_HEIGHT_010+
          (height-.50-NORTH_HEIGHTS_PORTAL_HEIGHT_010)/2,zg,
          openingWidth,height-.50-NORTH_HEIGHTS_PORTAL_HEIGHT_010,.055);
    }else city.box(pane,xg,base+height/2,zg,
      side==="z"?length-.5:.055,height-.50,side==="z"?.055:length-.5);
    const xf=(at:number)=>side==="z"?x+at:x+sign*(w/2+.06);
    const zf=(at:number)=>side==="z"?z+sign*(d/2+.06):z+at;
    // Vertical piers (true facade solids) terminate at each window edge.
    for(let col=0;col<=bays;col++){
      const at=-length/2+col*bay;
      if(entranceFace&&Math.abs(at)<openingWidth/2+.16){
        if(height>NORTH_HEIGHTS_PORTAL_HEIGHT_010)
          city.box(frame,xf(at),base+NORTH_HEIGHTS_PORTAL_HEIGHT_010+
            (height-NORTH_HEIGHTS_PORTAL_HEIGHT_010)/2,zf(at),
            isHigh?.16:.44,height-NORTH_HEIGHTS_PORTAL_HEIGHT_010,isHigh?.16:.44);
      }else city.box(frame,xf(at),base+height/2,zf(at),
        side==="z"?isHigh?.16:.44:.16,height,side==="z"?.16:isHigh?.16:.44);
    }
    // Continuous physical sills/spandrels with apertures between; horizontal
    // grid level remains 1:1-ish with 3.35/3.10m storey heights.
    const stride=mobile&&floors>20?2:1;
    for(let floor=0;floor<=floors;floor+=stride){
      const y=base+Math.min(floor,floors)*lot.floorHeight+.13;
      if(y>base+height+.2)break;
      if(entranceFace&&floor===0){
        const remaining=(length-openingWidth)/2;
        for(const direction of [-1,1])
          city.box(frame,xf(direction*(openingWidth/2+remaining/2)),y,zf(0),
            remaining,sill,.20);
      }else city.box(frame,xf(0),y,zf(0),
        side==="z"?length:.20,sill,side==="z"?.20:length);
    }
    if(floors%stride!==0)
      city.box(frame,xf(0),base+height-.02,zf(0),side==="z"?length:.20,sill,side==="z"?.20:length);
  };
  facade("z",1);facade("z",-1);facade("x",1);facade("x",-1);
  // NH-010: deliberately NO door mesh. The centered +Z opening passes
  // through the glass, mullions and physical perimeter, all sharing a portal.
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
  // NH-010: original podium's ~0.9m-high solid plinth made even an open
  // portal impossible to step through. Keep a shallow 0.19m foundation:
  // accessible from normal terrain/sidewalk by the existing Rapier autostep.
  city.box("concrete",x,y+.095,z,w+1.8,.19,d+1.8);
  // Physically empty rooms, no dark central cuboid, no furniture. One shared
  // PURE WHITE slab family for floor surfaces and interior roof undersides.
  city.box("interior-white",x,y+.22,z,w-.6,.10,d-.6);
  for(let f=1;f<lot.floors;f++)
    city.box("interior-white",x,y+.80+f*lot.floorHeight,z,w-.6,.14,d-.6);
  city.box("interior-white",x,y+height+.63,z,w-.6,.14,d-.6);
  // A low structural skirting makes solid walls meet the shallow foundation
  // without filling the one real open entry slot. Window pattern stays intact.
  const skirt=.62,skirtY=y+.18+skirt/2;
  const opening=Math.min(NORTH_HEIGHTS_PORTAL_WIDTH_010,w*.45);
  const side=(w-opening)/2;
  city.box("concrete",x,skirtY,z-d/2,w,skirt,.22);
  for(const direction of [-1,1]){
    city.box("concrete",x+direction*w/2,skirtY,z,.22,skirt,d);
    city.box("concrete",x+direction*(opening+side)/2,skirtY,z+d/2,
      side,skirt,.22);
  }
  if(podium) {
    // Open-sided podium: structural corner piers, not an opaque box hiding glass.
    for(const sx of [-1,1])for(const sz of [-1,1])
      city.box("stone-c",x+sx*(w/2+.7),y+podiumH/2+.18,z+sz*(d/2+.7),1.1,podiumH,1.1);
    city.box("stone-c",x,y+podiumH+.9,z,w+2.4,.55,d+2.4);
    for(let c=0;c<Math.floor(w/4);c++) {
      const px=x-w/2+(c+.5)*w/Math.floor(w/4);
      if(Math.abs(px-x)>NORTH_HEIGHTS_PORTAL_WIDTH_010/2+1.4)
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
/** South Ward's two-lane centre dash: one mark per road span, never over junctions. */
function addTwoLaneMarkings005(city:InstancedCity){
  let count=0;
  for(const axis of ["x","z"] as const)for(const fixed of STREETS){
    for(let s=0;s<STREETS.length-1;s++){
      const from=STREETS[s]!+7,to=STREETS[s+1]!-7;
      for(let at=from+3;at+3<to;at+=9){
        if(axis==="z"){
          city.box("lane",fixed,northHeightsGround(fixed,at)+.108,at,.13,.013,3.4);
        } else {
          city.box("lane",at,northHeightsGround(at,fixed)+.108,fixed,3.4,.013,.13);
        }
        count++;
      }
    }
  }
  return count;
}
// NH-LAMP-012: generated box streetlights retired. Owner GLBs are streamed
// and thin-instanced after the first playable frame, outside scene build.
export function buildNorthHeightsReconstruction(scene:Scene, mobile:boolean):NorthHeightsGenerated {
  const city=new InstancedCity(scene);
  attachNorthHeightsGrass004(scene,city.mat("grass"));
  terrain(scene,city.mat("grass"));
  // Sidewalk top and fascia now share one lit concrete material and upward
  // shading normals (NH003). No independent unlit curb tint is permitted.
  const roads=createNorthHeightsRoads003(scene,STREETS,northHeightsGround,{
    asphalt:city.mat("road"),pavement:city.mat("pavement"),
    curb:city.mat("curb"),crossing:city.mat("crosswalk"),marking:city.mat("lane"),
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
  // NH-010: reserved land was not built on by the deterministic seeded
  // generator; marking it occupied converts only this vacant lawn to pavement.
  const occupied=new Set([...lots.map(l=>l.block),...NORTH_HEIGHTS_RESERVED_PARKING_BLOCKS_010]);
  // NH-009: reserve the compact curbside forecourt beside Meridian Boulevard
  // for the genuine six-car fleet. No road, window or main glass material edits.
  const parkPlan=planNorthHeightsTrees004(MIDPOINTS,occupied,northHeightsGround,mobile)
    .filter(tree=>!NORTH_HEIGHTS_PARKING_LOTS_010.some(lot=>
      Math.abs(tree.x-lot.x)<=lot.width/2+1.5&&
      Math.abs(tree.z-lot.z)<=lot.depth/2+1.5));
  createNorthHeightsBlockSurfaces008(scene,{
    middle:MIDPOINTS,occupied,ground:northHeightsGround,trees:parkPlan,
    grass:city.mat("grass"),concrete:city.mat("concrete"),
  });
  // Economical shared lines denote six park bays, with a broad empty drive
  // aisle. Preserve the building-free planned block and original road grid.
  for(const lot of NORTH_HEIGHTS_PARKING_LOTS_010){
    for(const stall of lot.stalls){
      const elevation=northHeightsGround(stall.x,stall.z)+.085;
      city.box("crosswalk",stall.x-4,elevation,stall.z, .12,.015,7.0);
      city.box("crosswalk",stall.x+4,elevation,stall.z, .12,.015,7.0);
      city.box("crosswalk",stall.x,elevation,stall.z-3.55, 8,.015,.12);
    }
  }
  const laneDashes=roads.markings;
  const lamps=0; // Live owner-sourced GLBs attach after the first playable frame.
  const instances=city.commit();
  const treeLocations=parkPlan;
  const trees=treeLocations.length;
  console.info("[NH-REBUILD-004] owner tree positions planned",{
    trees,asset:"tree_low_poly_lowpoly.glb",generatedCanopyCards:0,
  });
  console.info("[NH-REBUILD-001] procedural world",{
    buildings:lots.length,trees,lamps,laneDashes,instances,modelsFromRejectedPack:0,
    mobile,layout:"10x10 city blocks with terrain ridge; deterministic NH-001",
  });
  return {
    count:lots.length,blocks:100,streetCount:STREETS.length*2,instanceCount:instances,
    treeLocations,
    lotSpecs,parkingLots:NORTH_HEIGHTS_PARKING_LOTS_010,dimensions:{width:EXTENT*2,height:tall},
    focus:new Vector3(-30,northHeightsGround(-30,-35)+1.5,-35),
    overview:new Vector3(142,103,-251),
  };
}
