import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
} from "@babylonjs/core";

export type VoightPrototype = {
  root: TransformNode;
};

export function createVoightPrototype(scene: Scene): VoightPrototype {
  const root = new TransformNode("voight-root", scene);

  const coat = new StandardMaterial("voight-coat", scene);
  coat.diffuseColor = new Color3(0.075, 0.085, 0.095);
  coat.specularColor = new Color3(0.08, 0.08, 0.08);

  const skin = new StandardMaterial("voight-skin", scene);
  skin.diffuseColor = new Color3(0.58, 0.43, 0.34);

  const body = MeshBuilder.CreateCapsule(
    "voight-prototype-body",
    { height: 1.42, radius: 0.31, tessellation: 12 },
    scene,
  );
  body.parent = root;
  body.position.y = -0.04;
  body.material = coat;

  const head = MeshBuilder.CreateSphere(
    "voight-prototype-head",
    { diameter: 0.42, segments: 12 },
    scene,
  );
  head.parent = root;
  head.position.y = 0.82;
  head.material = skin;

  const direction = MeshBuilder.CreateBox(
    "voight-forward-marker",
    { width: 0.09, height: 0.08, depth: 0.42 },
    scene,
  );
  direction.parent = root;
  direction.position.set(0, 0.25, 0.38);
  const marker = new StandardMaterial("voight-forward-material", scene);
  marker.diffuseColor = new Color3(0.94, 0.63, 0.13);
  direction.material = marker;

  return { root };
}
