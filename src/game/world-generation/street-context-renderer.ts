import {
  Color3,
  DynamicTexture,
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
import { planTreeCanopy } from "./tree-canopy";
import { planVehicleProxyGeometry } from "./vehicle-proxy-geometry";
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

function isHeadlessTextureEnvironment(scene: Scene): boolean {
  const engine = scene.getEngine() as {
    getClassName?: () => string;
    constructor?: { name?: string };
  };
  return (
    engine.getClassName?.() === "NullEngine" ||
    engine.constructor?.name === "NullEngine"
  );
}

function createFallbackBarkTexture(scene: Scene): RawTexture {
  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  const seed = seedHash("first-light-bark-fallback");
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const n = sample(seed, x, y);
      const groove = x % 9 <= 1 ? -34 : 0;
      const scratch =
        sample(seed ^ 0x7f4a7c15, Math.floor(x / 3), y) > 0.91 ? 22 : 0;
      pixels[index] = Math.max(34, Math.min(145, 96 + groove + scratch + n * 22));
      pixels[index + 1] = Math.max(26, Math.min(122, 72 + groove + n * 18));
      pixels[index + 2] = Math.max(18, Math.min(98, 48 + groove + n * 14));
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
  texture.name = "generated-south-ward-bark-fallback";
  texture.wrapU = Texture.WRAP_ADDRESSMODE;
  texture.wrapV = Texture.WRAP_ADDRESSMODE;
  texture.uScale = 1.3;
  texture.vScale = 3.8;
  return texture;
}

function createFallbackFoliageTexture(scene: Scene): RawTexture {
  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  const seed = seedHash("first-light-foliage-fallback");
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const nx = (x - size / 2) / (size / 2);
      const ny = (y - size / 2) / (size / 2);
      const radial = nx * nx / 1.08 + ny * ny / 0.72;
      const n = sample(seed, x, y);
      const spray = sample(seed ^ 0x5bd1e995, Math.floor(x / 4), Math.floor(y / 3));
      pixels[index] = 42 + Math.round(n * 28);
      pixels[index + 1] = 82 + Math.round(n * 56 + spray * 18);
      pixels[index + 2] = 40 + Math.round(n * 26);
      pixels[index + 3] = radial < 0.92 + (spray - 0.5) * 0.28 ? 255 : 0;
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
  texture.name = "generated-first-light-foliage-fallback";
  texture.hasAlpha = true;
  texture.wrapU = Texture.CLAMP_ADDRESSMODE;
  texture.wrapV = Texture.CLAMP_ADDRESSMODE;
  return texture;
}

function createPatternTexture(
  scene: Scene,
  name: string,
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  uScale: number,
  vScale: number,
): DynamicTexture {
  const size = 256;
  const texture = new DynamicTexture(
    name,
    { width: size, height: size },
    scene,
    false,
  );
  const ctx = texture.getContext() as CanvasRenderingContext2D;
  draw(ctx, size);
  texture.wrapU = Texture.WRAP_ADDRESSMODE;
  texture.wrapV = Texture.WRAP_ADDRESSMODE;
  texture.uScale = uScale;
  texture.vScale = vScale;
  texture.update(false);
  return texture;
}

function barkTexture(scene: Scene): Texture {
  if (isHeadlessTextureEnvironment(scene)) {
    return createFallbackBarkTexture(scene);
  }
  return createPatternTexture(
    scene,
    "generated-south-ward-bark-texture",
    (ctx, size) => {
      ctx.fillStyle = "#5f4a35";
      ctx.fillRect(0, 0, size, size);
      let seed = 90210;
      const random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };

      for (let i = 0; i < 150; i += 1) {
        const x = random() * size;
        const width = 1 + random() * 4;
        const shade = 40 + Math.floor(random() * 55);
        ctx.strokeStyle =
          "rgba(" +
          (shade + 20) +
          "," +
          (shade + 10) +
          "," +
          shade +
          "," +
          (0.18 + random() * 0.35) +
          ")";
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x, -12);
        let y = -12;
        while (y < size + 12) {
          y += 14 + random() * 24;
          ctx.lineTo(x + (random() - 0.5) * 11, y);
        }
        ctx.stroke();
      }

      for (let i = 0; i < 34; i += 1) {
        const x = random() * size;
        const y = random() * size;
        ctx.strokeStyle =
          "rgba(28,20,14," + (0.18 + random() * 0.25) + ")";
        ctx.lineWidth = 1 + random() * 2;
        ctx.beginPath();
        ctx.arc(
          x,
          y,
          3 + random() * 9,
          random() * Math.PI,
          random() * Math.PI * 2,
        );
        ctx.stroke();
      }

      for (let i = 0; i < 70; i += 1) {
        ctx.fillStyle =
          "rgba(190,165,126," + (0.035 + random() * 0.08) + ")";
        ctx.fillRect(
          random() * size,
          random() * size,
          1 + random() * 3,
          8 + random() * 24,
        );
      }
    },
    1.3,
    3.8,
  );
}

function foliageTexture(scene: Scene): Texture {
  if (isHeadlessTextureEnvironment(scene)) {
    return createFallbackFoliageTexture(scene);
  }
  const texture = new DynamicTexture(
    "generated-first-light-foliage-texture",
    { width: 256, height: 256 },
    scene,
    false,
  );
  texture.hasAlpha = true;
  texture.wrapU = Texture.CLAMP_ADDRESSMODE;
  texture.wrapV = Texture.CLAMP_ADDRESSMODE;

  const ctx = texture.getContext() as CanvasRenderingContext2D;
  ctx.clearRect(0, 0, 256, 256);
  let seed = 41721;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const colors = [
    "#25482a",
    "#315b34",
    "#3e693c",
    "#4f7542",
    "#5b8149",
  ] as const;
  const fallbackLeafColor = colors[0];

  for (let spray = 0; spray < 30; spray += 1) {
    const sx = 34 + random() * 188;
    const sy = 40 + random() * 176;
    const angle = random() * Math.PI * 2;
    const stemLength = 22 + random() * 46;
    const ex = sx + Math.cos(angle) * stemLength;
    const ey = sy + Math.sin(angle) * stemLength;
    ctx.strokeStyle = "rgba(52,68,38,0.62)";
    ctx.lineWidth = 1.3 + random() * 1.8;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    const leaves = 4 + Math.floor(random() * 5);
    for (let i = 0; i < leaves; i += 1) {
      const t = (i + 1) / (leaves + 1);
      const cx = sx + (ex - sx) * t + (random() - 0.5) * 11;
      const cy = sy + (ey - sy) * t + (random() - 0.5) * 11;
      const leafAngle = angle + (random() - 0.5) * 1.8;
      const length = 10 + random() * 18;
      const width = 4 + random() * 8;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(leafAngle);
      ctx.fillStyle =
        colors[Math.floor(random() * colors.length)] ?? fallbackLeafColor;
      ctx.globalAlpha = 0.82 + random() * 0.18;
      ctx.beginPath();
      ctx.moveTo(-length / 2, 0);
      ctx.quadraticCurveTo(0, -width, length / 2, 0);
      ctx.quadraticCurveTo(0, width, -length / 2, 0);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < 110; i += 1) {
    const x = 28 + random() * 200;
    const y = 30 + random() * 196;
    const length = 7 + random() * 13;
    const width = 3 + random() * 6;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(random() * Math.PI * 2);
    ctx.fillStyle =
      colors[Math.floor(random() * colors.length)] ?? fallbackLeafColor;
    ctx.globalAlpha = 0.72 + random() * 0.25;
    ctx.beginPath();
    ctx.moveTo(-length / 2, 0);
    ctx.quadraticCurveTo(0, -width, length / 2, 0);
    ctx.quadraticCurveTo(0, width, -length / 2, 0);
    ctx.fill();
    ctx.restore();
  }

  texture.update(false);
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
  generatorVersion: number,
): void {
  const root = new TransformNode("generated-tree:" + item.id, scene);
  nodes.push(root);
  root.position.set(item.position.x, item.position.y, item.position.z);
  root.rotation.y = item.yawRadians;
  root.scaling.setAll(item.scale);

  // One continuous tapered trunk avoids the broken-stick joint produced by
  // independently rotated upper and lower cylinders. Root flares retain
  // understated silhouette irregularity without compromising the main shaft.
  const trunk = MeshBuilder.CreateCylinder(
    "generated-tree-trunk:" + item.id,
    {
      height: 5.05,
      diameterTop: 0.66,
      diameterBottom: 0.7,
      tessellation: 10,
    },
    scene,
  );
  trunk.position.set(0, 2.525, 0);
  trunk.parent = root;
  trunk.material = trunkMaterial;
  trunk.receiveShadows = true;
  meshes.push(trunk);

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

  const crown = planTreeCanopy(item, generatorVersion);
  crown.cards.forEach((placement, index) => {
    const card = MeshBuilder.CreatePlane(
      "generated-tree-foliage:" + item.id + ":" + Math.floor(index / 3) + ":" + index % 3,
      {
        width: placement.width,
        height: placement.height,
        sideOrientation: Mesh.DOUBLESIDE,
      },
      scene,
    );
    card.position.set(placement.x, placement.y, placement.z);
    card.rotation.y = placement.yaw;
    card.rotation.x = placement.pitch;
    card.parent = root;
    card.material = foliageMaterial;
    card.receiveShadows = false;
    card.isPickable = false;
    meshes.push(card);
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
  lamp.position.set(1.03, 5.02, 0);
  lamp.parent = root;
  lamp.material = metal;
  meshes.push(lamp);
  // Actual luminous underside, rather than a yellow unlit head on a stick.
  const diffuser = MeshBuilder.CreateBox(
    "generated-streetlight-diffuser:" + item.id,
    { width: 0.43, height: 0.028, depth: 0.235 }, scene);
  diffuser.position.set(1.03, 4.925, 0);
  diffuser.parent = root;
  diffuser.material = glow;
  meshes.push(diffuser);
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

  // The two painted/cabin boxes are replaced by two articulated visual
  // meshes. Wheel count, material families and Rapier collider stay intact.
  const visual = planVehicleProxyGeometry();
  const surfaces = [
    { name: "generated-car-body:", geometry: visual.body, material: paint },
    { name: "generated-car-cabin:", geometry: visual.glass, material: glass },
  ] as const;
  for (const surface of surfaces) {
    const mesh = new Mesh(surface.name + item.id, scene);
    const vertexData = new VertexData();
    const positions = [...surface.geometry.positions];
    const indices = [...surface.geometry.indices];
    const normals: number[] = [];
    VertexData.ComputeNormals(positions, indices, normals);
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.applyToMesh(mesh);
    mesh.parent = root;
    mesh.material = surface.material;
    meshes.push(mesh);
  }

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
  options: {readonly skipPocketParkGround?:boolean} = {},
): GeneratedStreetContext {
  const plan = planStreetContext(city);
  const meshes: Mesh[] = [];
  const nodes: TransformNode[] = [];

  const trunk = material(
    scene,
    "generated-tree-bark",
    new Color3(0.34, 0.25, 0.17),
    0.02,
  );
  trunk.diffuseTexture = barkTexture(scene);

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
    new Color3(0.91, 0.90, 0.79),
    0,
  );
  glow.emissiveColor = new Color3(0.04, 0.04, 0.035);

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

  if (!options.skipPocketParkGround) for (const district of city.districts) {
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
      addTree(scene, item, meshes, nodes, trunk, foliage, city.generatorVersion);
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
