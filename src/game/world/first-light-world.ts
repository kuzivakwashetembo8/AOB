import {
  Color3,
  DirectionalLight,
  DynamicTexture,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  Scene,
  ShadowGenerator,
  StandardMaterial,
  Texture,
  TransformNode,
  Vector3,
} from "@babylonjs/core";
import type { MeridianPhysics } from "../physics/rapier-world";

type BoxSpec = {
  name: string;
  position: Vector3;
  size: Vector3;
  material: StandardMaterial;
  collide?: boolean;
  castShadow?: boolean;
  cameraBlocker?: boolean;
};

const mat = (scene: Scene, name: string, color: Color3, specular = 0.04) => {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = color;
  material.specularColor = new Color3(specular, specular, specular);
  return material;
};

function addBox(
  scene: Scene,
  physics: MeridianPhysics,
  shadows: ShadowGenerator,
  spec: BoxSpec,
) {
  const mesh = MeshBuilder.CreateBox(
    spec.name,
    { width: spec.size.x, height: spec.size.y, depth: spec.size.z },
    scene,
  );
  mesh.position.copyFrom(spec.position);
  mesh.material = spec.material;
  mesh.receiveShadows = true;
  mesh.metadata = {
    ...(mesh.metadata ?? {}),
    cameraBlocker: spec.cameraBlocker ?? spec.collide ?? false,
  };
  if (spec.castShadow) shadows.addShadowCaster(mesh);
  if (spec.collide) {
    physics.addStaticBox(
      { x: spec.position.x, y: spec.position.y, z: spec.position.z },
      { x: spec.size.x / 2, y: spec.size.y / 2, z: spec.size.z / 2 },
    );
  }
  return mesh;
}

function createFoliageTexture(scene: Scene) {
  const texture = new DynamicTexture(
    "first-light-foliage-texture",
    { width: 256, height: 256 },
    scene,
    false,
  );
  texture.hasAlpha = true;
  texture.wrapU = Texture.CLAMP_ADDRESSMODE;
  texture.wrapV = Texture.CLAMP_ADDRESSMODE;

  const ctx = texture.getContext();
  ctx.clearRect(0, 0, 256, 256);
  let seed = 41721;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const colors = ["#244a2c", "#315c35", "#3b6b3b", "#4b7742", "#527d46"];
  for (let i = 0; i < 105; i += 1) {
    const x = 38 + random() * 180;
    const y = 38 + random() * 180;
    const rx = 10 + random() * 21;
    const ry = 6 + random() * 14;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(random() * Math.PI);
    ctx.fillStyle = colors[Math.floor(random() * colors.length)] ?? colors[0];
    ctx.globalAlpha = 0.8 + random() * 0.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  texture.update(false);
  return texture;
}

function createStreetTree(
  scene: Scene,
  physics: MeridianPhysics,
  shadows: ShadowGenerator,
  position: Vector3,
) {
  const root = new TransformNode("south-ward-tree", scene);
  root.position.copyFrom(position);

  const bark = mat(scene, "tree-bark", new Color3(0.22, 0.16, 0.1), 0.02);
  const trunk = MeshBuilder.CreateCylinder(
    "south-ward-tree-trunk",
    { height: 4.7, diameterTop: 0.42, diameterBottom: 0.62, tessellation: 8 },
    scene,
  );
  trunk.position.y = 2.35;
  trunk.parent = root;
  trunk.material = bark;
  trunk.receiveShadows = true;
  shadows.addShadowCaster(trunk);
  physics.addStaticBox(
    { x: position.x, y: 2.2, z: position.z },
    { x: 0.3, y: 2.2, z: 0.3 },
  );

  const branchSpecs = [
    { p: new Vector3(-0.42, 4.1, 0.05), r: new Vector3(0, 0, -0.46), h: 2.0 },
    { p: new Vector3(0.48, 4.0, 0.1), r: new Vector3(0.06, 0, 0.5), h: 2.1 },
    { p: new Vector3(0.05, 4.35, -0.35), r: new Vector3(-0.42, 0, 0.08), h: 1.8 },
  ];
  branchSpecs.forEach((b, i) => {
    const branch = MeshBuilder.CreateCylinder(
      `south-ward-tree-branch-${i}`,
      { height: b.h, diameterTop: 0.12, diameterBottom: 0.24, tessellation: 7 },
      scene,
    );
    branch.position.copyFrom(b.p);
    branch.rotation.copyFrom(b.r);
    branch.parent = root;
    branch.material = bark;
    shadows.addShadowCaster(branch);
  });

  const foliageTexture = createFoliageTexture(scene);
  const foliage = new StandardMaterial("tree-foliage-material", scene);
  foliage.diffuseTexture = foliageTexture;
  foliage.opacityTexture = foliageTexture;
  foliage.useAlphaFromDiffuseTexture = true;
  foliage.backFaceCulling = false;
  foliage.specularColor = Color3.Black();

  const clusters = [
    new Vector3(0, 5.5, 0),
    new Vector3(-1.05, 5.15, 0.15),
    new Vector3(1.08, 5.1, 0.2),
    new Vector3(-0.45, 6.2, -0.35),
    new Vector3(0.62, 6.15, -0.25),
    new Vector3(0.1, 5.75, 0.85),
    new Vector3(-0.2, 5.55, -0.95),
  ];

  clusters.forEach((cluster, index) => {
    [0, Math.PI / 3, (2 * Math.PI) / 3].forEach((yaw, planeIndex) => {
      const card = MeshBuilder.CreatePlane(
        `tree-foliage-${index}-${planeIndex}`,
        { width: 2.7, height: 1.95, sideOrientation: Mesh.DOUBLESIDE },
        scene,
      );
      card.parent = root;
      card.position.copyFrom(cluster);
      card.rotation.y = yaw;
      card.rotation.x = planeIndex === 1 ? 0.08 : -0.04;
      card.material = foliage;
      card.receiveShadows = false;
    });
  });

  return root;
}

function createStreetlight(
  scene: Scene,
  shadows: ShadowGenerator,
  position: Vector3,
) {
  const metal = mat(scene, "streetlight-metal", new Color3(0.12, 0.14, 0.14), 0.12);
  const glow = mat(scene, "streetlight-glow", new Color3(0.84, 0.64, 0.3), 0);
  glow.emissiveColor = new Color3(0.55, 0.34, 0.12);

  const pole = MeshBuilder.CreateCylinder(
    "south-ward-streetlight-pole",
    { height: 5.3, diameter: 0.12, tessellation: 8 },
    scene,
  );
  pole.position.copyFrom(position.add(new Vector3(0, 2.65, 0)));
  pole.material = metal;
  shadows.addShadowCaster(pole);

  const arm = MeshBuilder.CreateBox(
    "south-ward-streetlight-arm",
    { width: 1.25, height: 0.09, depth: 0.09 },
    scene,
  );
  arm.position.copyFrom(position.add(new Vector3(0.52, 5.05, 0)));
  arm.material = metal;
  shadows.addShadowCaster(arm);

  const lamp = MeshBuilder.CreateBox(
    "south-ward-streetlight-lamp",
    { width: 0.5, height: 0.16, depth: 0.28 },
    scene,
  );
  lamp.position.copyFrom(position.add(new Vector3(1.03, 4.98, 0)));
  lamp.material = glow;
}

function createParkedCar(
  scene: Scene,
  physics: MeridianPhysics,
  shadows: ShadowGenerator,
  position: Vector3,
) {
  const root = new TransformNode("south-ward-parked-car", scene);
  root.position.copyFrom(position);
  root.rotation.y = Math.PI / 2;

  // Parked vehicles are world geometry at this stage: a simple body collider
  // prevents Voight from walking through the visual proxy.
  physics.addStaticBox(
    { x: position.x, y: 0.76, z: position.z },
    { x: 2.0, y: 0.76, z: 0.88 },
  );

  const paint = mat(scene, "parked-car-paint", new Color3(0.18, 0.28, 0.24), 0.16);
  const dark = mat(scene, "parked-car-dark", new Color3(0.035, 0.045, 0.045), 0.04);
  const glass = mat(scene, "parked-car-glass", new Color3(0.12, 0.18, 0.2), 0.22);

  const body = MeshBuilder.CreateBox(
    "parked-car-body",
    { width: 1.75, height: 0.62, depth: 4.0 },
    scene,
  );
  body.position.y = 0.62;
  body.parent = root;
  body.material = paint;
  body.receiveShadows = true;
  shadows.addShadowCaster(body);

  const cabin = MeshBuilder.CreateBox(
    "parked-car-cabin",
    { width: 1.55, height: 0.68, depth: 1.95 },
    scene,
  );
  cabin.position.set(0, 1.18, -0.15);
  cabin.parent = root;
  cabin.material = glass;
  shadows.addShadowCaster(cabin);

  [
    [-0.88, 0.42, -1.25],
    [0.88, 0.42, -1.25],
    [-0.88, 0.42, 1.25],
    [0.88, 0.42, 1.25],
  ].forEach(([x, y, z], i) => {
    const wheel = MeshBuilder.CreateCylinder(
      `parked-car-wheel-${i}`,
      { height: 0.18, diameter: 0.62, tessellation: 12 },
      scene,
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.parent = root;
    wheel.material = dark;
    shadows.addShadowCaster(wheel);
  });
}

function addWindowGrid(
  scene: Scene,
  shadows: ShadowGenerator,
  buildingPosition: Vector3,
  columns: number,
  rows: number,
  spacingX: number,
  spacingY: number,
  faceZ: number,
  startY: number,
  material: StandardMaterial,
) {
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const window = MeshBuilder.CreateBox(
        `support-window-${buildingPosition.x}-${row}-${column}`,
        { width: 1.15, height: 1.35, depth: 0.12 },
        scene,
      );
      window.position.set(
        buildingPosition.x + (column - (columns - 1) / 2) * spacingX,
        startY + row * spacingY,
        faceZ,
      );
      window.material = material;
      shadows.addShadowCaster(window);
    }
  }
}

export function createFirstLightWorld(scene: Scene, physics: MeridianPhysics) {
  const sky = new HemisphericLight(
    "first-light-sky",
    new Vector3(0.2, 1, -0.15),
    scene,
  );
  sky.intensity = 0.78;
  sky.diffuse = new Color3(0.72, 0.77, 0.78);
  sky.groundColor = new Color3(0.15, 0.14, 0.13);

  const sun = new DirectionalLight(
    "first-light-sun",
    new Vector3(-0.5, -1, 0.38),
    scene,
  );
  sun.position = new Vector3(24, 34, -18);
  sun.intensity = 1.05;
  sun.diffuse = new Color3(1, 0.83, 0.66);

  const shadows = new ShadowGenerator(1024, sun);
  shadows.useBlurExponentialShadowMap = true;
  shadows.blurKernel = 18;

  const asphalt = mat(scene, "south-ward-asphalt", new Color3(0.18, 0.185, 0.18), 0.025);
  const sidewalk = mat(scene, "south-ward-sidewalk", new Color3(0.37, 0.34, 0.3), 0.03);
  const curb = mat(scene, "south-ward-curb", new Color3(0.48, 0.45, 0.39), 0.03);
  const lane = mat(scene, "south-ward-road-marking", new Color3(0.72, 0.61, 0.31), 0.02);
  const garageWall = mat(scene, "garage-concrete", new Color3(0.33, 0.31, 0.28), 0.02);
  const garageTrim = mat(scene, "garage-trim", new Color3(0.16, 0.19, 0.18), 0.04);
  const warmBrick = mat(scene, "support-warm-brick", new Color3(0.39, 0.25, 0.18), 0.025);
  const coolConcrete = mat(scene, "support-cool-concrete", new Color3(0.26, 0.29, 0.3), 0.03);
  const darkGlass = mat(scene, "south-ward-window", new Color3(0.075, 0.11, 0.12), 0.14);
  darkGlass.alpha = 0.78;
  const windowFrame = mat(scene, "garage-window-frame", new Color3(0.12, 0.13, 0.12), 0.08);
  const doorMaterial = mat(scene, "garage-door", new Color3(0.13, 0.17, 0.16), 0.06);
  const accent = mat(scene, "garage-sign-accent", new Color3(0.55, 0.33, 0.12), 0.03);
  const grass = mat(scene, "south-ward-grass", new Color3(0.18, 0.3, 0.17), 0.01);

  const base = MeshBuilder.CreateGround(
    "first-light-base",
    { width: 160, height: 130 },
    scene,
  );
  base.position.z = 20;
  base.material = mat(scene, "first-light-base-material", new Color3(0.17, 0.16, 0.14), 0.01);
  base.receiveShadows = true;
  physics.addStaticBox({ x: 0, y: -0.25, z: 20 }, { x: 80, y: 0.25, z: 65 });

  // Primary street.
  addBox(scene, physics, shadows, {
    name: "south-ward-main-road",
    position: new Vector3(0, 0.015, 8),
    size: new Vector3(130, 0.03, 8),
    material: asphalt,
  });

  // Side street gives the corner genuine urban depth.
  addBox(scene, physics, shadows, {
    name: "south-ward-side-road",
    position: new Vector3(20, 0.018, 34),
    size: new Vector3(8, 0.035, 52),
    material: asphalt,
  });

  // Sidewalks and curb lines.
  addBox(scene, physics, shadows, {
    name: "south-ward-north-walk",
    position: new Vector3(0, 0.055, 2.4),
    size: new Vector3(130, 0.11, 3.1),
    material: sidewalk,
  });
  addBox(scene, physics, shadows, {
    name: "south-ward-south-walk",
    position: new Vector3(0, 0.055, 13.6),
    size: new Vector3(130, 0.11, 3.1),
    material: sidewalk,
  });
  addBox(scene, physics, shadows, {
    name: "north-curb",
    position: new Vector3(0, 0.105, 4.02),
    size: new Vector3(130, 0.21, 0.2),
    material: curb,
  });
  addBox(scene, physics, shadows, {
    name: "south-curb",
    position: new Vector3(0, 0.105, 11.98),
    size: new Vector3(130, 0.21, 0.2),
    material: curb,
  });

  for (let x = -56; x <= 56; x += 8) {
    addBox(scene, physics, shadows, {
      name: `lane-mark-${x}`,
      position: new Vector3(x, 0.045, 8),
      size: new Vector3(3.4, 0.035, 0.14),
      material: lane,
    });
  }

  // Small planted strip and drainage rhythm.
  addBox(scene, physics, shadows, {
    name: "tree-verge",
    position: new Vector3(11, 0.065, 2.15),
    size: new Vector3(5.2, 0.13, 2.35),
    material: grass,
  });
  for (let x = -54; x <= 54; x += 11) {
    addBox(scene, physics, shadows, {
      name: `drain-${x}`,
      position: new Vector3(x, 0.12, 3.89),
      size: new Vector3(1.1, 0.03, 0.17),
      material: garageTrim,
    });
  }

  // Hero building: South Ward neighborhood garage.
  const gx = -7.5;
  const frontZ = -0.2;
  const backZ = -10.1;
  const garageDepth = 10;
  const garageWidth = 13.5;
  const wallHeight = 4.7;

  // Rear wall is physically segmented around two real glazed openings. The
  // glass blocks Voight but is not a camera blocker, so the window reads as an
  // actual opening instead of a dark rectangle painted onto a wall.
  addBox(scene, physics, shadows, {
    name: "garage-back-sill-wall",
    position: new Vector3(gx, 0.55, backZ),
    size: new Vector3(garageWidth, 1.1, 0.35),
    material: garageWall,
    collide: true,
    castShadow: true,
  });
  addBox(scene, physics, shadows, {
    name: "garage-back-lintel-wall",
    position: new Vector3(gx, 4.05, backZ),
    size: new Vector3(garageWidth, 1.3, 0.35),
    material: garageWall,
    collide: true,
    castShadow: true,
  });

  const rearWindowWidth = 2.45;
  const rearWindowHeight = 1.75;
  const rearWindowY = 2.35;
  const rearWindowXs = [gx - 3.35, gx + 3.35];
  const rearPostXs = [gx - 6.35, gx, gx + 6.35];
  rearPostXs.forEach((x, index) => {
    addBox(scene, physics, shadows, {
      name: `garage-back-post-${index}`,
      position: new Vector3(x, 2.35, backZ),
      size: new Vector3(index === 1 ? 1.25 : 0.8, 2.2, 0.35),
      material: garageWall,
      collide: true,
      castShadow: true,
    });
  });

  rearWindowXs.forEach((x, index) => {
    addBox(scene, physics, shadows, {
      name: `garage-real-window-glass-${index}`,
      position: new Vector3(x, rearWindowY, backZ + 0.01),
      size: new Vector3(rearWindowWidth, rearWindowHeight, 0.08),
      material: darkGlass,
      collide: true,
      cameraBlocker: false,
    });
    addBox(scene, physics, shadows, {
      name: `garage-real-window-top-frame-${index}`,
      position: new Vector3(x, rearWindowY + rearWindowHeight / 2 + 0.08, backZ + 0.2),
      size: new Vector3(rearWindowWidth + 0.22, 0.14, 0.18),
      material: windowFrame,
      castShadow: true,
    });
    addBox(scene, physics, shadows, {
      name: `garage-real-window-bottom-frame-${index}`,
      position: new Vector3(x, rearWindowY - rearWindowHeight / 2 - 0.08, backZ + 0.2),
      size: new Vector3(rearWindowWidth + 0.22, 0.14, 0.18),
      material: windowFrame,
      castShadow: true,
    });
    [-1, 1].forEach((side) => {
      addBox(scene, physics, shadows, {
        name: `garage-real-window-side-frame-${index}-${side}`,
        position: new Vector3(
          x + side * (rearWindowWidth / 2 + 0.06),
          rearWindowY,
          backZ + 0.2,
        ),
        size: new Vector3(0.14, rearWindowHeight + 0.28, 0.18),
        material: windowFrame,
        castShadow: true,
      });
    });
    addBox(scene, physics, shadows, {
      name: `garage-real-window-mullion-${index}`,
      position: new Vector3(x, rearWindowY, backZ + 0.2),
      size: new Vector3(0.11, rearWindowHeight, 0.14),
      material: windowFrame,
      castShadow: true,
    });
  });
  addBox(scene, physics, shadows, {
    name: "garage-left-wall",
    position: new Vector3(gx - garageWidth / 2, wallHeight / 2, -5.15),
    size: new Vector3(0.35, wallHeight, garageDepth),
    material: garageWall,
    collide: true,
    castShadow: true,
  });
  addBox(scene, physics, shadows, {
    name: "garage-right-wall",
    position: new Vector3(gx + garageWidth / 2, wallHeight / 2, -5.15),
    size: new Vector3(0.35, wallHeight, garageDepth),
    material: garageWall,
    collide: true,
    castShadow: true,
  });

  const openingWidth = 4.6;
  const frontSideWidth = (garageWidth - openingWidth) / 2;
  addBox(scene, physics, shadows, {
    name: "garage-front-left",
    position: new Vector3(gx - (openingWidth + frontSideWidth) / 2, wallHeight / 2, frontZ),
    size: new Vector3(frontSideWidth, wallHeight, 0.36),
    material: garageWall,
    collide: true,
    castShadow: true,
  });
  addBox(scene, physics, shadows, {
    name: "garage-front-right",
    position: new Vector3(gx + (openingWidth + frontSideWidth) / 2, wallHeight / 2, frontZ),
    size: new Vector3(frontSideWidth, wallHeight, 0.36),
    material: garageWall,
    collide: true,
    castShadow: true,
  });
  addBox(scene, physics, shadows, {
    name: "garage-front-lintel",
    position: new Vector3(gx, 4.18, frontZ),
    size: new Vector3(openingWidth, 1.02, 0.4),
    material: garageTrim,
    collide: true,
    castShadow: true,
  });
  addBox(scene, physics, shadows, {
    name: "garage-roof",
    position: new Vector3(gx, 4.82, -5.15),
    size: new Vector3(garageWidth + 0.35, 0.26, garageDepth + 0.35),
    material: garageTrim,
    collide: true,
    castShadow: true,
  });

  // Interior floor reads differently from the sidewalk without creating a step collider.
  addBox(scene, physics, shadows, {
    name: "garage-interior-floor",
    position: new Vector3(gx, 0.035, -5.15),
    size: new Vector3(12.8, 0.07, 9.3),
    material: doorMaterial,
  });

  // Garage facade depth cues.
  [-12.7, -2.3].forEach((x, index) => {
    const serviceDoor = MeshBuilder.CreateBox(
      `garage-service-door-${index}`,
      { width: 1.15, height: 2.25, depth: 0.15 },
      scene,
    );
    serviceDoor.position.set(x, 1.2, frontZ + 0.24);
    serviceDoor.material = doorMaterial;
  });

  addBox(scene, physics, shadows, {
    name: "garage-sign",
    position: new Vector3(gx, 3.75, 0.06),
    size: new Vector3(4.2, 0.62, 0.16),
    material: accent,
    castShadow: true,
  });

  // Supporting building west of garage.
  addBox(scene, physics, shadows, {
    name: "west-support-building",
    position: new Vector3(-27, 4.2, -4.2),
    size: new Vector3(20, 8.4, 12),
    material: warmBrick,
    collide: true,
    castShadow: true,
  });
  addWindowGrid(
    scene,
    shadows,
    new Vector3(-27, 0, 0),
    5,
    2,
    3.1,
    2.55,
    1.84,
    3.0,
    darkGlass,
  );

  // Supporting building east, pulled back to create the service alley.
  addBox(scene, physics, shadows, {
    name: "east-support-building",
    position: new Vector3(8.8, 5.4, -6.7),
    size: new Vector3(15.5, 10.8, 7.2),
    material: coolConcrete,
    collide: true,
    castShadow: true,
  });
  addWindowGrid(
    scene,
    shadows,
    new Vector3(8.8, 0, 0),
    4,
    3,
    2.8,
    2.45,
    -3.02,
    2.6,
    darkGlass,
  );

  // South-side apartment mass and corner block.
  addBox(scene, physics, shadows, {
    name: "south-apartment",
    position: new Vector3(-18, 5.2, 20.3),
    size: new Vector3(26, 10.4, 11),
    material: warmBrick,
    collide: true,
    castShadow: true,
  });
  addWindowGrid(
    scene,
    shadows,
    new Vector3(-18, 0, 0),
    7,
    3,
    3.0,
    2.45,
    14.74,
    2.6,
    darkGlass,
  );

  addBox(scene, physics, shadows, {
    name: "corner-commercial",
    position: new Vector3(29.2, 4.3, 18.6),
    size: new Vector3(10.5, 8.6, 10),
    material: coolConcrete,
    collide: true,
    castShadow: true,
  });

  // Street-level storefront band gives supporting architecture a different use-type read.
  addBox(scene, physics, shadows, {
    name: "corner-storefront-glass",
    position: new Vector3(29.2, 1.25, 13.52),
    size: new Vector3(8.6, 2.2, 0.16),
    material: darkGlass,
  });

  createStreetTree(scene, physics, shadows, new Vector3(11.2, 0, 2.2));
  createStreetlight(scene, shadows, new Vector3(4.7, 0, 3.15));
  createParkedCar(scene, physics, shadows, new Vector3(7.4, 0, 9.65));

  // Simple service-yard fence rhythm; intentionally sparse.
  const fenceMat = mat(scene, "service-fence", new Color3(0.25, 0.27, 0.25), 0.08);
  for (let i = 0; i < 8; i += 1) {
    addBox(scene, physics, shadows, {
      name: `service-fence-post-${i}`,
      position: new Vector3(15.7, 1.05, -1.2 - i * 1.5),
      size: new Vector3(0.14, 2.1, 0.14),
      material: fenceMat,
      castShadow: true,
    });
  }
  [0.55, 1.45].forEach((y, index) => {
    addBox(scene, physics, shadows, {
      name: `service-fence-rail-${index}`,
      position: new Vector3(15.7, y, -6.45),
      size: new Vector3(0.09, 0.09, 10.7),
      material: fenceMat,
      castShadow: true,
    });
  });

  // First Light neighborhood expansion: a second cross street and rear block
  // extend the spatial test without committing to district-scale simulation.
  addBox(scene, physics, shadows, {
    name: "south-ward-rear-road",
    position: new Vector3(2, 0.018, 48),
    size: new Vector3(118, 0.035, 8),
    material: asphalt,
  });
  addBox(scene, physics, shadows, {
    name: "rear-road-north-walk",
    position: new Vector3(2, 0.055, 42.4),
    size: new Vector3(118, 0.11, 3.1),
    material: sidewalk,
  });
  addBox(scene, physics, shadows, {
    name: "rear-road-south-walk",
    position: new Vector3(2, 0.055, 53.6),
    size: new Vector3(118, 0.11, 3.1),
    material: sidewalk,
  });
  addBox(scene, physics, shadows, {
    name: "rear-road-north-curb",
    position: new Vector3(2, 0.105, 44.02),
    size: new Vector3(118, 0.21, 0.2),
    material: curb,
  });
  addBox(scene, physics, shadows, {
    name: "rear-road-south-curb",
    position: new Vector3(2, 0.105, 51.98),
    size: new Vector3(118, 0.21, 0.2),
    material: curb,
  });

  for (let x = -48; x <= 48; x += 8) {
    addBox(scene, physics, shadows, {
      name: `rear-lane-mark-${x}`,
      position: new Vector3(x, 0.045, 48),
      size: new Vector3(3.4, 0.035, 0.14),
      material: lane,
    });
  }

  // Side-street sidewalks connect the original garage corner to the rear block.
  addBox(scene, physics, shadows, {
    name: "side-street-west-walk",
    position: new Vector3(14.4, 0.055, 30),
    size: new Vector3(3.1, 0.11, 29),
    material: sidewalk,
  });
  addBox(scene, physics, shadows, {
    name: "side-street-east-walk",
    position: new Vector3(25.6, 0.055, 30),
    size: new Vector3(3.1, 0.11, 29),
    material: sidewalk,
  });
  addBox(scene, physics, shadows, {
    name: "side-street-west-curb",
    position: new Vector3(16.02, 0.105, 30),
    size: new Vector3(0.2, 0.21, 29),
    material: curb,
  });
  addBox(scene, physics, shadows, {
    name: "side-street-east-curb",
    position: new Vector3(23.98, 0.105, 30),
    size: new Vector3(0.2, 0.21, 29),
    material: curb,
  });

  // Pocket green breaks the hard street wall and gives the neighborhood a
  // recognizable local-space landmark.
  addBox(scene, physics, shadows, {
    name: "south-ward-pocket-green",
    position: new Vector3(-2.5, 0.07, 35.5),
    size: new Vector3(16, 0.14, 10),
    material: grass,
  });
  createStreetTree(scene, physics, shadows, new Vector3(-6.5, 0, 34.5));
  createStreetTree(scene, physics, shadows, new Vector3(1.8, 0, 36.1));
  createStreetlight(scene, shadows, new Vector3(11.6, 0, 43.0));

  // Rear residential row: deliberately simple massing with repeated window
  // rhythm so later facade work can test reuse without looking cloned.
  addBox(scene, physics, shadows, {
    name: "rear-residential-row",
    position: new Vector3(-31, 4.4, 60.2),
    size: new Vector3(34, 8.8, 13),
    material: warmBrick,
    collide: true,
    castShadow: true,
  });
  addWindowGrid(
    scene,
    shadows,
    new Vector3(-31, 0, 0),
    8,
    2,
    3.6,
    2.6,
    53.62,
    3.0,
    darkGlass,
  );

  // Small local shop/workshop mass anchors the side-street junction.
  addBox(scene, physics, shadows, {
    name: "rear-local-shop",
    position: new Vector3(5, 3.1, 59.2),
    size: new Vector3(16, 6.2, 11),
    material: coolConcrete,
    collide: true,
    castShadow: true,
  });
  addBox(scene, physics, shadows, {
    name: "rear-local-shopfront",
    position: new Vector3(5, 1.35, 53.62),
    size: new Vector3(12.8, 2.35, 0.16),
    material: darkGlass,
  });
  addBox(scene, physics, shadows, {
    name: "rear-local-shop-sign",
    position: new Vector3(5, 3.95, 53.54),
    size: new Vector3(7.2, 0.6, 0.18),
    material: accent,
    castShadow: true,
  });

  addBox(scene, physics, shadows, {
    name: "rear-workshop",
    position: new Vector3(36, 3.8, 59.5),
    size: new Vector3(21, 7.6, 12),
    material: garageWall,
    collide: true,
    castShadow: true,
  });

  // A second parked vehicle establishes street scale deeper into the block.
  createParkedCar(scene, physics, shadows, new Vector3(-14, 0, 49.6));

  return {
    spawn: new Vector3(-7.5, 0.92, 2.45),
    focus: new Vector3(-7.5, 1.25, -1.5),
  };
}
