import {
  Color3,
  Material,
  Mesh,
  MeshBuilder,
  RawTexture,
  StandardMaterial,
  Texture,
  TransformNode,
} from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";
import type { CitySpec } from "./schema";
import { planStreetContext } from "./street-context";
import type { StreetContextItem } from "./street-context";

export interface GeneratedStreetContext {
  readonly itemCount: number;
  readonly meshes: readonly Mesh[];
  dispose(): void;
}

function seedHash(input: string | number): number {
  const text = String(input);
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function sample(seed: number, x: number, y: number): number {
  let value = seed ^ Math.imul(x + 3, 374761393) ^ Math.imul(y + 5, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function foliageTexture(scene: Scene): RawTexture {
  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  const seed = seedHash("first-light-foliage");
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const nx = (x - size / 2) / (size / 2);
      const ny = (y - size / 2) / (size / 2);
      const ellipse = nx * nx / 1.05 + ny * ny / 0.72;
      const n = sample(seed, x, y);
      const alpha = ellipse < 0.9 + (n - 0.5) * 0.25 ? 255 : 0;
      const green = 92 + Math.round(n * 55);
      pixels[index] = 42 + Math.round(n * 24);
      pixels[index + 1] = green;
      pixels[index + 2] = 44 + Math.round(n * 22);
      pixels[index + 3] = alpha;
    }
  }
  const texture = RawTexture.CreateRGBATexture(
    pixels,
    size,
    size,
    scene,
    true,
    false,
    Texture.TRILINEAR_SAMPLINGMODE,
  );
  texture.name = "generated-first-light-foliage";
  texture.hasAlpha = true;
  return texture;
}

function material(
  scene: Scene,
  name: string,
  diffuse: Color3,
  roughSpecular = 0.04,
): StandardMaterial {
  const result = new StandardMaterial(name, scene);
  result.diffuseColor = diffuse;
  result.specularColor = new Color3(
    roughSpecular,
    roughSpecular,
    roughSpecular,
  );
  return result;
}

function addTree(
  scene: Scene,
  item: StreetContextItem,
  meshes: Mesh[],
  trunkMaterial: Material,
  foliageMaterial: Material,
): void {
  const root = new TransformNode("generated-tree:" + item.id, scene);
  root.position.set(item.position.x, item.position.y, item.position.z);
  root.rotation.y = item.yawRadians;
  root.scaling.setAll(item.scale);

  const trunk = MeshBuilder.CreateCylinder(
    "generated-tree-trunk:" + item.id,
    {
      height: 4.5,
      diameterTop: 0.48,
      diameterBottom: 0.74,
      tessellation: 8,
    },
    scene,
  );
  trunk.position.y = 2.15;
  trunk.parent = root;
  trunk.material = trunkMaterial;
  trunk.receiveShadows = true;
  meshes.push(trunk);

  const flareData = [
    { x: -0.28, z: 0.02, rz: -0.38 },
    { x: 0.28, z: 0.04, rz: 0.38 },
    { x: 0, z: -0.26, rx: 0.34 },
    { x: 0.05, z: 0.28, rx: -0.34 },
  ] as const;
  flareData.forEach((flare, index) => {
    const rootFlare = MeshBuilder.CreateCylinder(
      "generated-tree-root:" + item.id + ":" + index,
      {
        height: 0.72,
        diameterTop: 0.22,
        diameterBottom: 0.48,
        tessellation: 7,
      },
      scene,
    );
    rootFlare.position.set(flare.x, 0.3, flare.z);
    rootFlare.rotation.z = "rz" in flare ? flare.rz : 0;
    rootFlare.rotation.x = "rx" in flare ? flare.rx : 0;
    rootFlare.parent = root;
    rootFlare.material = trunkMaterial;
    meshes.push(rootFlare);
  });

  const clusters = [
    [0, 5.45, 0, 3.7, 1.95],
    [-1.72, 5.15, 0.08, 3.2, 1.8],
    [1.76, 5.14, 0.1, 3.2, 1.8],
    [-1.15, 5.82, -0.5, 3.0, 1.7],
    [1.16, 5.8, -0.45, 3.0, 1.7],
    [-0.8, 5.34, 1.12, 3.1, 1.7],
    [0.82, 5.3, 1.08, 3.1, 1.7],
    [0, 6.12, 0.1, 3.4, 1.72],
  ] as const;

  clusters.forEach(([x, y, z, width, height], clusterIndex) => {
    [0, Math.PI / 3, (2 * Math.PI) / 3].forEach((yaw, planeIndex) => {
      const card = MeshBuilder.CreatePlane(
        "generated-tree-foliage:" +
          item.id +
          ":" +
          clusterIndex +
          ":" +
          planeIndex,
        {
          width,
          height,
          sideOrientation: Mesh.DOUBLESIDE,
        },
        scene,
      );
      card.position.set(x, y, z);
      card.rotation.y = yaw;
      card.rotation.x = planeIndex === 1 ? 0.06 : -0.035;
      card.parent = root;
      card.material = foliageMaterial;
      card.isPickable = false;
      meshes.push(card);
    });
  });
}

function addStreetlight(
  scene: Scene,
  item: StreetContextItem,
  meshes: Mesh[],
  metal: Material,
  glow: Material,
): void {
  const root = new TransformNode("generated-streetlight:" + item.id, scene);
  root.position.set(item.position.x, item.position.y, item.position.z);
  root.rotation.y = item.yawRadians;

  const pole = MeshBuilder.CreateCylinder(
    "generated-streetlight-pole:" + item.id,
    { height: 5.3, diameter: 0.12, tessellation: 8 },
    scene,
  );
  pole.position.y = 2.65;
  pole.parent = root;
  pole.material = metal;
  meshes.push(pole);

  const arm = MeshBuilder.CreateBox(
    "generated-streetlight-arm:" + item.id,
    { width: 1.25, height: 0.09, depth: 0.09 },
    scene,
  );
  arm.position.set(0.52, 5.05, 0);
  arm.parent = root;
  arm.material = metal;
  meshes.push(arm);

  const lamp = MeshBuilder.CreateBox(
    "generated-streetlight-lamp:" + item.id,
    { width: 0.5, height: 0.16, depth: 0.28 },
    scene,
  );
  lamp.position.set(1.03, 4.98, 0);
  lamp.parent = root;
  lamp.material = glow;
  meshes.push(lamp);
}

function addParkedCar(
  scene: Scene,
  item: StreetContextItem,
  meshes: Mesh[],
  paint: Material,
  dark: Material,
  glass: Material,
): void {
  const root = new TransformNode("generated-car:" + item.id, scene);
  root.position.set(item.position.x, item.position.y, item.position.z);
  root.rotation.y = item.yawRadians;
  root.scaling.setAll(item.scale);

  const body = MeshBuilder.CreateBox(
    "generated-car-body:" + item.id,
    { width: 1.75, height: 0.62, depth: 4.0 },
    scene,
  );
  body.position.y = 0.62;
  body.parent = root;
  body.material = paint;
  meshes.push(body);

  const cabin = MeshBuilder.CreateBox(
    "generated-car-cabin:" + item.id,
    { width: 1.55, height: 0.68, depth: 1.95 },
    scene,
  );
  cabin.position.set(0, 1.18, -0.15);
  cabin.parent = root;
  cabin.material = glass;
  meshes.push(cabin);

  const wheelPositions: ReadonlyArray<readonly [number, number, number]> = [
    [-0.88, 0.42, -1.25],
    [0.88, 0.42, -1.25],
    [-0.88, 0.42, 1.25],
    [0.88, 0.42, 1.25],
  ];
  wheelPositions.forEach(([x, y, z], index) => {
    const wheel = MeshBuilder.CreateCylinder(
      "generated-car-wheel:" + item.id + ":" + index,
      { height: 0.18, diameter: 0.62, tessellation: 12 },
      scene,
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.parent = root;
    wheel.material = dark;
    meshes.push(wheel);
  });
}

function addBench(
  scene: Scene,
  item: StreetContextItem,
  meshes: Mesh[],
  materialValue: Material,
): void {
  const root = new TransformNode("generated-bench:" + item.id, scene);
  root.position.set(item.position.x, item.position.y, item.position.z);
  root.rotation.y = item.yawRadians;

  const seat = MeshBuilder.CreateBox(
    "generated-bench-seat:" + item.id,
    { width: 2.1, height: 0.12, depth: 0.48 },
    scene,
  );
  seat.position.y = 0.58;
  seat.parent = root;
  seat.material = materialValue;
  meshes.push(seat);

  const back = MeshBuilder.CreateBox(
    "generated-bench-back:" + item.id,
    { width: 2.1, height: 0.7, depth: 0.11 },
    scene,
  );
  back.position.set(0, 0.9, 0.18);
  back.parent = root;
  back.material = materialValue;
  meshes.push(back);

  [-0.78, 0.78].forEach((x, index) => {
    const leg = MeshBuilder.CreateBox(
      "generated-bench-leg:" + item.id + ":" + index,
      { width: 0.12, height: 0.56, depth: 0.12 },
      scene,
    );
    leg.position.set(x, 0.28, 0);
    leg.parent = root;
    leg.material = materialValue;
    meshes.push(leg);
  });
}

function addBin(
  scene: Scene,
  item: StreetContextItem,
  meshes: Mesh[],
  materialValue: Material,
): void {
  const bin = MeshBuilder.CreateCylinder(
    "generated-bin:" + item.id,
    {
      height: 0.95,
      diameterTop: 0.58,
      diameterBottom: 0.5,
      tessellation: 10,
    },
    scene,
  );
  bin.position.set(item.position.x, 0.475, item.position.z);
  bin.rotation.y = item.yawRadians;
  bin.material = materialValue;
  meshes.push(bin);
}

export function createGeneratedStreetContext(
  scene: Scene,
  city: CitySpec,
): GeneratedStreetContext {
  const plan = planStreetContext(city);
  const meshes: Mesh[] = [];

  const trunk = material(
    scene,
    "generated-tree-bark",
    new Color3(0.31, 0.22, 0.14),
    0.02,
  );
  const foliage = new StandardMaterial("generated-tree-foliage-material", scene);
  const foliageMap = foliageTexture(scene);
  foliage.diffuseTexture = foliageMap;
  foliage.opacityTexture = foliageMap;
  foliage.useAlphaFromDiffuseTexture = true;
  foliage.backFaceCulling = false;
  foliage.transparencyMode = StandardMaterial.MATERIAL_ALPHATESTANDBLEND;
  foliage.specularColor = Color3.Black();

  const metal = material(
    scene,
    "generated-street-metal",
    new Color3(0.12, 0.14, 0.14),
    0.1,
  );
  const glow = material(
    scene,
    "generated-streetlight-glow",
    new Color3(0.84, 0.64, 0.3),
    0,
  );
  if (glow instanceof StandardMaterial) {
    glow.emissiveColor = new Color3(0.5, 0.31, 0.1);
  }
  const paint = material(
    scene,
    "generated-car-paint",
    new Color3(0.18, 0.28, 0.24),
    0.14,
  );
  const dark = material(
    scene,
    "generated-car-dark",
    new Color3(0.035, 0.045, 0.045),
    0.03,
  );
  const glass = material(
    scene,
    "generated-car-glass",
    new Color3(0.12, 0.18, 0.2),
    0.2,
  );
  const wood = material(
    scene,
    "generated-bench-material",
    new Color3(0.34, 0.24, 0.16),
    0.04,
  );

  for (const item of plan.items) {
    if (item.kind === "tree") {
      addTree(scene, item, meshes, trunk, foliage);
    } else if (item.kind === "streetlight") {
      addStreetlight(scene, item, meshes, metal, glow);
    } else if (item.kind === "parked-car") {
      addParkedCar(scene, item, meshes, paint, dark, glass);
    } else if (item.kind === "bench") {
      addBench(scene, item, meshes, wood);
    } else if (item.kind === "bin") {
      addBin(scene, item, meshes, metal);
    }
  }

  const materials = [trunk, foliage, metal, glow, paint, dark, glass, wood];
  let disposed = false;
  return {
    itemCount: plan.items.length,
    meshes,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const mesh of meshes) mesh.dispose();
      for (const materialValue of materials) {
        if (materialValue instanceof StandardMaterial) {
          const diffuse = materialValue.diffuseTexture;
          materialValue.diffuseTexture = null;
          if (materialValue.opacityTexture === diffuse) {
            materialValue.opacityTexture = null;
          }
          diffuse?.dispose();
        }
        materialValue.dispose();
      }
    },
  };
}
