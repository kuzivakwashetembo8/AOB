/** Runtime adapter for the extracted procedural LMS weapons.
 * Converts the source Three.js geometry into Babylon meshes so the live
 * North Heights scene keeps its single renderer and character rig.
 */
import {
  Color3, Mesh, Quaternion, StandardMaterial, TransformNode, Vector3, VertexData,
  type Scene,
} from "@babylonjs/core";
import type * as THREE from "three";
import { buildRifle } from "./source/models/rifle.js";
import { buildSmg } from "./source/models/smg.js";
import { buildPistol } from "./source/models/pistol.js";

export type ReeseWeaponId001 = "m4a1" | "mpx9" | "p19";
/**
 * Solve weapon-root rotation in the attached hand mount's local frame.
 * Source weapon forward is -Z and its top is +Y. Babylon LH look rotation
 * uses +Z as forward, so aim its +Z toward character-back.
 */
export function solveReeseWeaponMountRotation001(
 mountWorld: import('@babylonjs/core').Matrix, characterForward: Vector3,
): Quaternion {
 const inverseMount = mountWorld.clone();
 inverseMount.invert();
 const localBack = Vector3.TransformNormal(characterForward.scale(-1), inverseMount).normalize();
 const rawUp = Vector3.TransformNormal(Vector3.Up(), inverseMount).normalize();
 const localUp = rawUp.subtract(localBack.scale(Vector3.Dot(rawUp, localBack))).normalize();
 if (localBack.lengthSquared() < 0.99 || localUp.lengthSquared() < 0.99) throw new Error('LMS weapon mount basis is degenerate');
 return Quaternion.FromLookDirectionLH(localBack, localUp);
}

type SourceModel = {
  body: { build: () => Map<string, THREE.BufferGeometry> };
  moving: Record<string, { build: () => Map<string, THREE.BufferGeometry> }>;
  nodes: Record<string, { pos?: number[]; rot?: number[] }>;
};
const BUILDERS: Record<ReeseWeaponId001, () => SourceModel> = {
  m4a1: buildRifle,
  mpx9: buildSmg,
  p19: buildPistol,
};
const COLORS: Record<string, string> = {
  alu: "#727D88", alu_fine: "#AAB4BE", steel: "#343D47",
  steel_bright: "#CBD1D6", steel_black: "#202832", steel_soot: "#171D23",
  polymer: "#252A30", rubber: "#101316", cavity: "#080B0E",
  brass: "#B78A48", copper: "#A85E3E", glass: "#182D3C",
  lens: "#29495A", optic: "#303B45", red: "#A92E2E",
  white: "#D8DDE0", black: "#111418",
};
const NODE_NAMES: Record<string, string> = {
  magazine: "magSeat", charging: "chargeRest", bolt: "boltRest",
  trigger: "triggerPivot", selector: "selectorPivot", slide: "slideRest",
};
function sourceNode(model: SourceModel, key: string) {
  return model.nodes[NODE_NAMES[key] ?? ""] ?? { pos: [0, 0, 0], rot: [0, 0, 0] };
}
function makeMaterial(scene: Scene, key: string) {
  const material = new StandardMaterial("lms-weapon-" + key, scene);
  material.diffuseColor = Color3.FromHexString(COLORS[key] ?? "#59636D");
  material.specularColor = new Color3(0.32, 0.34, 0.37);
  material.specularPower = /alu|steel|brass|copper/.test(key) ? 72 : 28;
  return material;
}
function appendAssembly(
  scene: Scene,
  assembly: SourceModel["body"],
  parent: TransformNode,
  weaponId: string,
  part: string,
) {
  for (const [key, geometry] of assembly.build()) {
    const position = geometry.getAttribute("position");
    const normal = geometry.getAttribute("normal");
    const uv = geometry.getAttribute("uv");
    if (!position || !normal) {
      geometry.dispose();
      throw new Error("LMS weapon geometry is missing position/normal data");
    }
    const vertex = new VertexData();
    vertex.positions = Array.from(position.array as ArrayLike<number>);
    vertex.normals = Array.from(normal.array as ArrayLike<number>);
    if (uv) vertex.uvs = Array.from(uv.array as ArrayLike<number>);
    const index = geometry.getIndex();
    vertex.indices = index
      ? Array.from(index.array as ArrayLike<number>)
      : Array.from({ length: position.count }, (_, i) => i);
    const mesh = new Mesh("lms-" + weaponId + "-" + part + "-" + key, scene);
    vertex.applyToMesh(mesh, false);
    mesh.material = makeMaterial(scene, key);
    mesh.parent = parent;
    mesh.isPickable = false;
    geometry.dispose();
  }
}
export function createReeseWeapon001(scene: Scene, id: ReeseWeaponId001) {
  const model = BUILDERS[id]();
  const root = new TransformNode("reese-lms-weapon-" + id, scene);
  // Source weapon space is +Y up, muzzle -Z, stock +Z. The player adapter
  // solves rotation against the live hand-mount basis after bone attachment.
  root.rotation.set(0, Math.PI, 0);
  const wrist = model.nodes["gripR"]?.pos ?? [0, 0, 0];
  root.position.set(wrist[0] ?? 0, -(wrist[1] ?? 0), wrist[2] ?? 0);
  appendAssembly(scene, model.body, root, id, "body");
  for (const [partName, assembly] of Object.entries(model.moving)) {
    const part = new TransformNode("reese-lms-weapon-" + id + "-" + partName, scene);
    const node = sourceNode(model, partName);
    const pos = node.pos ?? [0, 0, 0];
    const rot = node.rot ?? [0, 0, 0];
    part.position.set(pos[0] ?? 0, pos[1] ?? 0, pos[2] ?? 0);
    part.rotation.set(rot[0] ?? 0, rot[1] ?? 0, rot[2] ?? 0);
    part.parent = root;
    appendAssembly(scene, assembly, part, id, partName);
  }
  root.setEnabled(false);
  return root;
}
