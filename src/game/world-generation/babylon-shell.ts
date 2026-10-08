import { MeshBuilder, Scene } from "@babylonjs/core";
export const createVisualBox = (scene: Scene) => MeshBuilder.CreateBox("box", {}, scene);
