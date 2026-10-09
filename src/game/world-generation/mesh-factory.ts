import { MeshBuilder, Scene } from "@babylonjs/core";
export function box(scene: Scene) { return MeshBuilder.CreateBox("box", {}, scene); }
