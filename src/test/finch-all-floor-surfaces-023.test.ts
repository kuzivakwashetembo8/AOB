import {describe,it,expect} from "vitest";
import {FreeCamera,Mesh,NullEngine,Scene,Vector3} from "@babylonjs/core";
import type {BuildingSpec} from "../game/world-generation/schema";
import {
 createFinchFloorSurfaces023,FINCH_TILE_VARIANTS_023,finchFloorTileVariant023
} from "../game/experiments/north-heights-finch-floor-surfaces-023";

const building={
 id:"NH-04-06-L2",seed:"NH-04-06-L2",archetype:"podium-tower",
 position:{x:46.002,y:11.27,z:-94.18},yawRadians:0,
 overrides:{width:22.669,depth:33.889,floors:53,floorHeight:3.1}
} as BuildingSpec;

describe("FINCH-FLOORS-023 all-floor tile system",()=>{
 it("assigns a deterministic color-only palette to every supported level",()=>{
  expect(finchFloorTileVariant023(53)).toBe(0);
  expect(FINCH_TILE_VARIANTS_023.length).toBe(9);
  for(let floor=1;floor<=53;floor++){
   const index=finchFloorTileVariant023(floor);
   expect(index).toBeGreaterThanOrEqual(0);
   expect(index).toBeLessThan(FINCH_TILE_VARIANTS_023.length);
   if(floor<53)expect(index).not.toBe(finchFloorTileVariant023(floor+1));
  }
  expect(()=>finchFloorTileVariant023(0)).toThrow();
  expect(()=>finchFloorTileVariant023(54)).toThrow();
 });
 it("renders 53 pre-existing slabs using 37 draw templates and no added collider",()=>{
  const engine=new NullEngine();
  const scene=new Scene(engine);
  const floor=createFinchFloorSurfaces023(scene,building,()=>11.27);
  const skinMeshes=scene.meshes.filter(m=>m.name.startsWith("finch023:floor-skin-"));
  expect(skinMeshes).toHaveLength(37); // 9 palettes x 4 shaft rings + lobby
  expect(floor.floorCount).toBe(53);
  expect(floor.variants).toBe(9);
  expect(floor.surfaces).toBe(209); // 52 upper floors x 4 sections + ground lobby
  expect(skinMeshes.reduce((sum,m)=>sum+(m as Mesh).thinInstanceCount,0)).toBe(209);
  const direct=scene.meshes.filter(m=>m.name.startsWith("finch023:occupied-floor-"));
  expect(direct).toHaveLength(4);
  expect(scene.meshes.filter(m=>m.name.startsWith("finch022:floor-skin-"))).toHaveLength(0);
  // Regression: Floor 3 must have a DIRECT visible tile skin above its
  // original physical slab, irrespective of distant thin-instance visibility.
  const supportY=11.27+.8+2*3.1+.07;
  // Lower room camera can be as low as slab + .42m. The old camera-based
  // floor heuristic misclassified this Floor 3 viewpoint as Floor 2.
  const camera=new FreeCamera("test:floor3",new Vector3(
   building.position.x,supportY+.42,building.position.z+10),scene);
  camera.computeWorldMatrix();
  scene.activeCamera=camera;
  floor.setOccupiedFloor(3);
  scene.onBeforeRenderObservable.notifyObservers(scene);
  expect(floor.occupiedFloor()).toBe(3);
  expect(direct.every(m=>m.isEnabled())).toBe(true);
  direct[0]!.computeWorldMatrix(true);
  const worldY=direct[0]!.getAbsolutePosition().y;
  expect(worldY).toBeCloseTo(supportY+.035,3);
  floor.setOccupiedFloor(null);
  expect(floor.occupiedFloor()).toBeNull();
  expect(direct.every(m=>!m.isEnabled())).toBe(true);
  floor.setOccupiedFloor(53);
  expect(floor.occupiedFloor()).toBe(53);
  expect(direct[0]!.isEnabled()).toBe(true);
  expect(()=>floor.setOccupiedFloor(54)).toThrow();
  floor.dispose();
  expect(scene.meshes.filter(m=>m.name.startsWith("finch023:floor-skin-"))).toHaveLength(0);
  scene.dispose();
  engine.dispose();
 });
});
