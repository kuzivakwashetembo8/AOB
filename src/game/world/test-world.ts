import {
  Color3,
  DirectionalLight,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import type { MeridianPhysics } from "../physics/rapier-world";

export function createMeridiaTestWorld(scene: Scene, physics: MeridianPhysics) {
  const hemi = new HemisphericLight("meridia-sky-light", new Vector3(0.2, 1, 0.1), scene);
  hemi.intensity = 0.72;
  hemi.diffuse = new Color3(0.72, 0.8, 0.86);
  hemi.groundColor = new Color3(0.12, 0.14, 0.15);

  const sun = new DirectionalLight("meridia-sun", new Vector3(-0.45, -1, 0.35), scene);
  sun.position = new Vector3(20, 32, -20);
  sun.intensity = 1.15;
  sun.diffuse = new Color3(1, 0.82, 0.61);

  const ground = MeshBuilder.CreateGround("meridia-test-ground", { width: 120, height: 120 }, scene);
  const groundMat = new StandardMaterial("meridia-ground-material", scene);
  groundMat.diffuseColor = new Color3(0.17, 0.19, 0.18);
  groundMat.specularColor = new Color3(0.04, 0.04, 0.04);
  ground.material = groundMat;
  physics.addStaticBox({ x: 0, y: -0.25, z: 0 }, { x: 60, y: 0.25, z: 60 });

  const markerMat = new StandardMaterial("meridia-marker-material", scene);
  markerMat.diffuseColor = new Color3(0.47, 0.34, 0.12);
  markerMat.specularColor = new Color3(0.08, 0.06, 0.02);

  const markers = [
    { p: { x: 5, y: 1, z: 3 }, h: { x: 1.2, y: 1, z: 1.2 } },
    { p: { x: -6, y: 1.5, z: -4 }, h: { x: 1.5, y: 1.5, z: 1 } },
    { p: { x: 1, y: 0.75, z: -8 }, h: { x: 2.5, y: 0.75, z: 0.6 } },
  ];
  markers.forEach(({ p, h }, index) => {
    const mesh = MeshBuilder.CreateBox(
      `meridia-marker-${index}`,
      { width: h.x * 2, height: h.y * 2, depth: h.z * 2 },
      scene,
    );
    mesh.position.set(p.x, p.y, p.z);
    mesh.material = markerMat;
    physics.addStaticBox(p, h);
  });
}
