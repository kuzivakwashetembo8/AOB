import {
  Color3,
  Material,
  Mesh,
  MeshBuilder,
  RawTexture,
  StandardMaterial,
  Texture,
  TransformNode,
  VertexData,
} from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";
import type { CitySpec, PublicSpaceSpec } from "./schema";
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
  let value =
    seed ^ Math.imul(x + 3, 374761393) ^ Math.imul(y + 5, 668265263);
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
      const ellipse = nx * nx / 1.08 + ny * ny / 0.68;
      const n = sample(seed, x, y);
      const alpha = ellipse < 0.94 + (n - 0.5) * 0.28 ? 255 : 0;
      const green = 88 + Math.round(n * 60);
      pixels[index] = 38 + Math.round(n * 28);
      pixels[index + 1] = green;
      pixels[index + 2] = 40 + Math.round(n * 26);
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

function grassTexture(scene: Scene): RawTexture {
  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  const seed = seedHash("first-light-grass");
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const n = sample(seed, x, y);
      const broad = sample(seed ^ 0x51ed270b, Math.floor(x / 8), Math.floor(y / 8));
      pixels[index] = 45 + Math.round(n * 18 + broad * 10);
      pixels[index + 1] = 78 + Math.round(n * 28 + broad * 18);
      pixels[index + 2] = 42 + Math.round(n * 16);
      pixels[index + 3] = 255;
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
  texture.name = "generated-first-light-grass";
  texture.wrapU = Texture.WRAP_ADDRESSMODE;
  texture.wrapV = Texture.WRAP_ADDRESSMODE;
  texture.uScale = 3.2;
  texture.vScale = 2.4;
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
  nodes: TransformNode[],
  trunkMaterial: Material,
  foliageMaterial: Material,
): void {
  const root = new TransformNode("generated-tree:" + item.id, scene);
  nodes.push(root);
  root.position.set(item.position.x, item.position.y, item.position.z);
  root.rotation.y = item.yawRadians;
  root.scaling.setAll(item.scale);

  const lowerTrunk = MeshBuilder.CreateCylinder(
    "generated-tree-trunk-lower:" + item.id,
    {
      height: 3.15,
      diameterTop: 0.5,
      diameterBottom: 0.76,
      tessellation: 8,
    },
    scene,
  );
  lowerTrunk.position.y = 1.56;
  lowerTrunk.parent = root;
  lowerTrunk.material = trunkMaterial;
  lowerTrunk.receiveShadows = true;
  meshes.push(lowerTrunk);

  const upperTrunk = MeshBuilder.CreateCylinder(
    "generated-tree-trunk-upper:" + item.id,
    {
      height: 2.2,
      diameterTop: 0.3,
      diameterBottom: 0.5,
      tessellation: 8,
    },
    scene,
  );
  upperTrunk.position.set(0.08, 3.86, 0.02);
  upperTrunk.rotation.z = 0.075;
  upperTrunk.rotation.x = -0.025;
  upperTrunk.parent = root;
  upperTrunk.material = trunkMaterial;
  upperTrunk.receiveShadows = true;
  meshes.push(upperTrunk);

  const flareData = [
    { x: -0.28, z: 0, rz: -0.38 },
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

  const baseClusters = [
    [0, 5.45, 0],
    [-1.75, 5.15, 0.05],
    [1.8, 5.12, 0.1],
    [-1.15, 5.85, -0.55],
    [1.2, 5.82, -0.48],
    [-0.75, 5.35, 1.15],
    [0.8, 5.28, 1.12],
    [0, 6.15, 0.12],
    [-2.05, 5.0, -0.85],
    [2.05, 5.0, -0.75],
  ] as const;
  const canopyScale = item.canopyScale ?? 1.12;
  const seed = seedHash(item.seed);

  baseClusters.forEach(([baseX, baseY, baseZ], clusterIndex) => {
    const jitterX = (sample(seed, clusterIndex, 1) - 0.5) * 0.42;
    const jitterY = (sample(seed, clusterIndex, 2) - 0.5) * 0.18;
    const jitterZ = (sample(seed, clusterIndex, 3) - 0.5) * 0.42;
    const clusterScale =
      canopyScale * (0.96 + sample(seed, clusterIndex, 4) * 0.1);
    const width = 3.45 * clusterScale;
    const height = 1.78 * clusterScale;

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
      card.position.set(
        baseX * canopyScale + jitterX,
        baseY + jitterY,
        baseZ * canopyScale + jitterZ,
      );
      card.rotation.y =
        yaw +
        (sample(seed, clusterIndex, planeIndex + 10) - 0.5) * 0.16;
      card.rotation.x = planeIndex === 1 ? 0.08 : -0.04;
      card.parent = root;
      card.material = foliageMaterial;
      card.isPickable = false;
      meshes.push(card);
    });
  });
}

function addShrub(
  scene: Scene,
  item: StreetContextItem,
  meshes: Mesh[],
  nodes: TransformNode[],
  foliageMaterial: Material,
): void {
  const root = new TransformNode("generated-shrub:" + item.id, scene);
  nodes.push(root);
  root.position.set(item.position.x, item.position.y, item.position.z);
  root.rotation.y = item.yawRadians;
  root.scaling.setAll(item.scale);

  [0, Math.PI / 3, (2 * Math.PI) / 3].forEach((yaw, index) => {
    const card = MeshBuilder.CreatePlane(
      "generated-shrub-card:" + item.id + ":" + index,
      {
        width: 1.35,
        height: 0.88,
        sideOrientation: Mesh.DOUBLESIDE,
      },
      scene,
    );
    card.position.y = 0.45;
    card.rotation.y = yaw;
    card.parent = root;
    card.material = foliageMaterial;
    card.isPickable = false;
    meshes.push(card);
  });
}

function addStreetlight(
  scene: Scene,
  item: StreetContextItem,
  meshes: Mesh[],
  nodes: TransformNode[],
  metal: Material,
  glow: Material,
): void {
  const root = new TransformNode("generated-streetlight:" + item.id, scene);
  nodes.push(root);
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
  nodes: TransformNode[],
  paint: Material,
  dark: Material,
  glass: Material,
): void {
  const root = new TransformNode("generated-car:" + item.id, scene);
  nodes.push(root);
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
  nodes: TransformNode[],
  materialValue: Material,
): void {
  const root = new TransformNode("generated-bench:" + item.id, scene);
  nodes.push(root);
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

function createPocketParkSurface(
  scene: Scene,
  space: PublicSpaceSpec,
  baseMaterial: Material,
  accentMaterial: Material,
  meshes: Mesh[],
): void {
  const halfWidth = space.width / 2;
  const halfDepth = space.depth / 2;
  const perimeter = [
    [-halfWidth + 0.7, -halfDepth],
    [halfWidth - 0.9, -halfDepth],
    [halfWidth, -halfDepth + 0.75],
    [halfWidth, halfDepth - 0.95],
    [halfWidth - 0.65, halfDepth],
    [-halfWidth + 1.0, halfDepth],
    [-halfWidth, halfDepth - 0.65],
    [-halfWidth, -halfDepth + 0.9],
  ] as const;

  const mesh = new Mesh("generated-public-space:" + space.id, scene);
  const positions: number[] = [space.position.x, 0.065, space.position.z];
  const normals: number[] = [0, 1, 0];
  const uvs: number[] = [0.5, 0.5];
  for (const [x, z] of perimeter) {
    positions.push(space.position.x + x, 0.065, space.position.z + z);
    normals.push(0, 1, 0);
    uvs.push(x / space.width + 0.5, z / space.depth + 0.5);
  }
  const indices: number[] = [];
  for (let index = 0; index < perimeter.length; index += 1) {
    indices.push(0, index + 1, ((index + 1) % perimeter.length) + 1);
  }
  const data = new VertexData();
  data.positions = positions;
  data.normals = normals;
  data.uvs = uvs;
  data.indices = indices;
  data.applyToMesh(mesh);
  mesh.material = baseMaterial;
  mesh.receiveShadows = true;
  mesh.isPickable = false;
  meshes.push(mesh);

  const seed = seedHash(space.id);
  for (let index = 0; index < 5; index += 1) {
    const patch = MeshBuilder.CreateCylinder(
      "generated-grass-variation:" + space.id + ":" + index,
      {
        height: 0.012,
        diameter:
          Math.min(space.width, space.depth) *
          (0.16 + sample(seed, index, 1) * 0.12),
        tessellation: 14,
      },
      scene,
    );
    patch.position.set(
      space.position.x +
        (sample(seed, index, 2) - 0.5) * space.width * 0.65,
      0.074,
      space.position.z +
        (sample(seed, index, 3) - 0.5) * space.depth * 0.6,
    );
    patch.scaling.z = 0.7 + sample(seed, index, 4) * 0.55;
    patch.material = accentMaterial;
    patch.isPickable = false;
    meshes.push(patch);
  }
}

export function createGeneratedStreetContext(
  scene: Scene,
  city: CitySpec,
): GeneratedStreetContext {
  const plan = planStreetContext(city);
  const meshes: Mesh[] = [];
  const nodes: TransformNode[] = [];

  const trunk = material(
    scene,
    "generated-tree-bark",
    new Color3(0.31, 0.22, 0.14),
    0.02,
  );

  const foliage = new StandardMaterial(
    "generated-tree-foliage-material",
    scene,
  );
  const foliageMap = foliageTexture(scene);
  foliage.diffuseTexture = foliageMap;
  foliage.opacityTexture = foliageMap;
  foliage.useAlphaFromDiffuseTexture = true;
  foliage.backFaceCulling = false;
  foliage.transparencyMode = Material.MATERIAL_ALPHATESTANDBLEND;
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
  glow.emissiveColor = new Color3(0.5, 0.31, 0.1);

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

  const grass = material(
    scene,
    "generated-pocket-grass",
    Color3.White(),
    0.02,
  );
  grass.diffuseTexture = grassTexture(scene);
  const grassAccent = material(
    scene,
    "generated-pocket-grass-accent",
    new Color3(0.19, 0.32, 0.17),
    0.01,
  );

  for (const district of city.districts) {
    for (const neighborhood of district.neighborhoods) {
      for (const block of neighborhood.blocks) {
        for (const space of block.publicSpaces ?? []) {
          if (space.kind !== "pocket-park") continue;
          createPocketParkSurface(
            scene,
            space,
            grass,
            grassAccent,
            meshes,
          );
        }
      }
    }
  }

  for (const item of plan.items) {
    if (item.kind === "tree") {
      addTree(scene, item, meshes, nodes, trunk, foliage);
    } else if (item.kind === "shrub") {
      addShrub(scene, item, meshes, nodes, foliage);
    } else if (item.kind === "streetlight") {
      addStreetlight(scene, item, meshes, nodes, metal, glow);
    } else if (item.kind === "parked-car") {
      addParkedCar(scene, item, meshes, nodes, paint, dark, glass);
    } else if (item.kind === "bench") {
      addBench(scene, item, meshes, nodes, wood);
    } else if (item.kind === "bin") {
      addBin(scene, item, meshes, metal);
    }
  }

  const materials = [
    trunk,
    foliage,
    metal,
    glow,
    paint,
    dark,
    glass,
    wood,
    grass,
    grassAccent,
  ];

  let disposed = false;
  return {
    itemCount: plan.items.length,
    meshes,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const mesh of meshes) mesh.dispose();
      for (const node of nodes) node.dispose();
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
