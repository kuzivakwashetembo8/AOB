/** GTD-WORLD-019: owner's spawn garage is an EMPTY navigable interior.
 * Preserve structural slab/ceiling only; no fixtures, furniture, clutter,
 * light props, shelves, tires or hidden collision proxies.
 */
import {Color3,MeshBuilder,StandardMaterial,TransformNode} from "@babylonjs/core";
import type {Mesh,Scene} from "@babylonjs/core";
import type {GeneratedBuilding} from "../world-generation";

export interface GeneratedGarageInterior {
  readonly root:TransformNode;
  readonly meshes:readonly Mesh[];
  setVisible(visible:boolean):void;
  dispose():void;
}

export function createSouthWardGarageInterior(
  scene:Scene,building:GeneratedBuilding,
):GeneratedGarageInterior|null {
  if(building.buildingId!=="sw-fl-garage"||!building.interior)return null;
  const interior=building.interior;
  const root=new TransformNode("south-ward-garage-interior",scene);
  root.parent=building.root;
  const meshes:Mesh[]=[];
  const concrete=new StandardMaterial("garage-interior-concrete",scene);
  concrete.diffuseColor=new Color3(.26,.27,.25);
  concrete.specularColor=new Color3(.02,.02,.02);
  const ceilingMaterial=new StandardMaterial("garage-interior-ceiling",scene);
  ceilingMaterial.diffuseColor=new Color3(.22,.225,.215);
  ceilingMaterial.specularColor=new Color3(.015,.015,.015);
  const width=interior.localMax.x-interior.localMin.x;
  const depth=interior.localMax.z-interior.localMin.z;
  const cx=(interior.localMin.x+interior.localMax.x)/2;
  const cz=(interior.localMin.z+interior.localMax.z)/2;
  const floor=MeshBuilder.CreateBox("garage-interior-floor",
    {width,height:.08,depth},scene);
  floor.parent=root;
  floor.position.set(cx,interior.localMin.y+.02,cz);
  floor.material=concrete;floor.receiveShadows=true;
  floor.isPickable=false;
  floor.metadata={interior:"south-ward-garage",decorative:false,structural:true};
  meshes.push(floor);
  // Enclosure continues to work with the existing interior camera occlusion.
  const ceiling=MeshBuilder.CreateBox("garage-interior-ceiling",
    {width,height:.12,depth},scene);
  ceiling.parent=root;
  ceiling.position.set(cx,interior.localMax.y-.08,cz);
  ceiling.material=ceilingMaterial;ceiling.receiveShadows=true;
  ceiling.isPickable=false;
  ceiling.metadata={
    interior:"south-ward-garage",decorative:false,
    structural:true,interiorCeiling:true,
  };
  meshes.push(ceiling);
  let disposed=false;
  return {
    root,meshes,
    setVisible(value){root.setEnabled(value);},
    dispose(){
      if(disposed)return;
      disposed=true;
      for(const mesh of meshes)mesh.dispose();
      root.dispose();
      concrete.dispose();ceilingMaterial.dispose();
    },
  };
}
