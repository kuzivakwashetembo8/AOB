import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  TransformNode,
} from "@babylonjs/core";
import type { Mesh, Scene } from "@babylonjs/core";
import type { GeneratedBuilding } from "../world-generation";

export interface GeneratedGarageInterior {
  readonly root: TransformNode;
  readonly meshes: readonly Mesh[];
  setVisible(visible: boolean): void;
  dispose(): void;
}

function material(
  scene: Scene,
  name: string,
  color: Color3,
  specular = 0.04,
  emissive?: Color3,
): StandardMaterial {
  const result = new StandardMaterial(name, scene);
  result.diffuseColor = color;
  result.specularColor = new Color3(specular, specular, specular);
  if (emissive) result.emissiveColor = emissive;
  return result;
}

export function createSouthWardGarageInterior(
  scene: Scene,
  building: GeneratedBuilding,
): GeneratedGarageInterior | null {
  if (building.buildingId !== "sw-fl-garage" || !building.interior) return null;

  const root = new TransformNode("south-ward-garage-interior", scene);
  root.parent = building.root;
  const meshes: Mesh[] = [];

  const concrete = material(
    scene,
    "garage-interior-concrete",
    new Color3(0.26, 0.27, 0.25),
    0.02,
  );
  const ceiling = material(
    scene,
    "garage-interior-ceiling",
    new Color3(0.22, 0.225, 0.215),
    0.015,
  );
  const steel = material(
    scene,
    "garage-interior-steel",
    new Color3(0.16, 0.18, 0.18),
    0.16,
  );
  const painted = material(
    scene,
    "garage-interior-painted",
    new Color3(0.42, 0.38, 0.3),
    0.08,
  );
  const red = material(
    scene,
    "garage-interior-tool-red",
    new Color3(0.38, 0.075, 0.055),
    0.14,
  );
  const rubber = material(
    scene,
    "garage-interior-rubber",
    new Color3(0.035, 0.04, 0.04),
    0.01,
  );
  const appliance = material(
    scene,
    "garage-interior-appliance",
    new Color3(0.68, 0.7, 0.67),
    0.12,
  );
  const screen = material(
    scene,
    "garage-interior-screen",
    new Color3(0.03, 0.05, 0.055),
    0.18,
    new Color3(0.04, 0.11, 0.13),
  );
  const lightMaterial = material(
    scene,
    "garage-interior-fixture-glow",
    new Color3(0.93, 0.86, 0.68),
    0,
    new Color3(0.68, 0.56, 0.34),
  );
  const materials = [
    concrete,
    ceiling,
    steel,
    painted,
    red,
    rubber,
    appliance,
    screen,
    lightMaterial,
  ];

  const box = (
    name: string,
    size: { x: number; y: number; z: number },
    position: { x: number; y: number; z: number },
    mat: StandardMaterial,
    rotationY = 0,
  ) => {
    const mesh = MeshBuilder.CreateBox(
      name,
      { width: size.x, height: size.y, depth: size.z },
      scene,
    );
    mesh.parent = root;
    mesh.position.set(position.x, position.y, position.z);
    mesh.rotation.y = rotationY;
    mesh.material = mat;
    mesh.receiveShadows = true;
    mesh.isPickable = false;
    mesh.metadata = {
      interior: "south-ward-garage",
      decorative: true,
    };
    meshes.push(mesh);
    return mesh;
  };

  const interior = building.interior;
  const interiorWidth = interior.localMax.x - interior.localMin.x;
  const interiorDepth = interior.localMax.z - interior.localMin.z;
  const interiorCenterX = (interior.localMin.x + interior.localMax.x) / 2;
  const interiorCenterZ = (interior.localMin.z + interior.localMax.z) / 2;

  box(
    "garage-interior-floor",
    { x: interiorWidth, y: 0.08, z: interiorDepth },
    { x: interiorCenterX, y: interior.localMin.y + 0.02, z: interiorCenterZ },
    concrete,
  );

  // A dedicated interior-facing ceiling preserves enclosure even while the
  // exterior roof shell is partially cut away for third-person camera use.
  box(
    "garage-interior-ceiling",
    { x: interiorWidth, y: 0.12, z: interiorDepth },
    {
      x: interiorCenterX,
      y: interior.localMax.y - 0.08,
      z: interiorCenterZ,
    },
    ceiling,
  ).metadata = {
    interior: "south-ward-garage",
    decorative: false,
    interiorCeiling: true,
  };

  // West work zone: heavy bench, drawers and tool cabinet.
  box(
    "garage-workbench-top",
    { x: 4.2, y: 0.16, z: 0.85 },
    { x: -3.7, y: 1.02, z: -3.75 },
    painted,
  );
  box(
    "garage-workbench-left",
    { x: 0.18, y: 1.0, z: 0.72 },
    { x: -5.55, y: 0.5, z: -3.75 },
    steel,
  );
  box(
    "garage-workbench-right",
    { x: 0.18, y: 1.0, z: 0.72 },
    { x: -1.85, y: 0.5, z: -3.75 },
    steel,
  );
  const drawer = box(
    "garage-drawer-chest",
    { x: 1.15, y: 1.05, z: 0.62 },
    { x: -4.65, y: 0.54, z: -3.7 },
    red,
  );
  for (let i = 0; i < 4; i += 1) {
    box(
      "garage-drawer-handle-" + i,
      { x: 0.72, y: 0.035, z: 0.035 },
      { x: -4.65, y: 0.27 + i * 0.2, z: -3.365 },
      steel,
    );
  }
  drawer.metadata = { ...drawer.metadata, propKind: "drawers" };
  box(
    "garage-tall-tool-cupboard",
    { x: 1.25, y: 2.1, z: 0.65 },
    { x: -5.45, y: 1.05, z: -2.85 },
    steel,
  );

  // Keep the rear glazing physically and visually unobstructed. The storage
  // rack that previously sat across the rear window wall now occupies the
  // solid right-hand wall.
  const shelfX = interior.localMax.x - 0.48;
  const shelfZ = -1.35;
  for (let level = 0; level < 4; level += 1) {
    box(
      "garage-shelf-" + level,
      { x: 3.6, y: 0.09, z: 0.72 },
      { x: shelfX, y: 0.28 + level * 0.56, z: shelfZ },
      steel,
      Math.PI / 2,
    );
  }
  box(
    "garage-shelf-left-post",
    { x: 0.1, y: 2.15, z: 0.1 },
    { x: shelfX, y: 1.08, z: shelfZ - 1.7 },
    steel,
  );
  box(
    "garage-shelf-right-post",
    { x: 0.1, y: 2.15, z: 0.1 },
    { x: shelfX, y: 1.08, z: shelfZ + 1.7 },
    steel,
  );

  box(
    "garage-lockers",
    { x: 1.65, y: 2.15, z: 0.58 },
    { x: 5.45, y: 1.08, z: 2.85 },
    painted,
  );
  box(
    "garage-fridge",
    { x: 0.82, y: 1.75, z: 0.72 },
    { x: 4.1, y: 0.88, z: 3.02 },
    appliance,
  );
  box(
    "garage-fridge-handle",
    { x: 0.04, y: 0.48, z: 0.04 },
    { x: 4.42, y: 1.04, z: 3.405 },
    steel,
  );

  // Small office/service corner: desk, chair silhouette, monitor/TV.
  box(
    "garage-desk",
    { x: 2.55, y: 0.12, z: 0.8 },
    { x: -4.6, y: 0.86, z: 3.1 },
    painted,
  );
  box(
    "garage-desk-pedestal",
    { x: 0.62, y: 0.82, z: 0.68 },
    { x: -5.4, y: 0.42, z: 3.1 },
    steel,
  );
  box(
    "garage-monitor",
    { x: 0.82, y: 0.52, z: 0.08 },
    { x: -4.25, y: 1.24, z: 2.77 },
    screen,
  );
  box(
    "garage-chair-seat",
    { x: 0.58, y: 0.1, z: 0.58 },
    { x: -3.65, y: 0.48, z: 3.3 },
    rubber,
  );
  box(
    "garage-chair-back",
    { x: 0.58, y: 0.72, z: 0.1 },
    { x: -3.65, y: 0.84, z: 3.55 },
    rubber,
  );

  // Wall-mounted details derive their minimum height from the generated rear
  // window apertures so future window-layout changes remain respected.
  const rearWindowTop = Math.max(
    0,
    ...building.plan.openings
      .filter(
        (opening) =>
          opening.facade === "rear" &&
          opening.kind === "window",
      )
      .map((opening) => opening.sillHeight + opening.height),
  );
  const toolBoardHeight = 0.68;
  const toolBoardY = Math.min(
    interior.localMax.y - 0.52,
    rearWindowTop + 0.28 + toolBoardHeight / 2,
  );

  box(
    "garage-wall-tool-board",
    { x: 3.0, y: toolBoardHeight, z: 0.08 },
    { x: -2.7, y: toolBoardY, z: interior.localMin.z + 0.14 },
    painted,
  ).metadata = {
    interior: "south-ward-garage",
    decorative: true,
    windowKeepClear: true,
  };
  for (let i = 0; i < 7; i += 1) {
    box(
      "garage-wall-tool-" + i,
      { x: 0.08, y: 0.28 + (i % 3) * 0.1, z: 0.06 },
      {
        x: -3.9 + i * 0.4,
        y: toolBoardY,
        z: interior.localMin.z + 0.19,
      },
      steel,
    );
  }

  for (let stack = 0; stack < 2; stack += 1) {
    for (let tire = 0; tire < 3; tire += 1) {
      const mesh = MeshBuilder.CreateTorus(
        "garage-tire-" + stack + "-" + tire,
        { diameter: 0.72, thickness: 0.2, tessellation: 14 },
        scene,
      );
      mesh.parent = root;
      mesh.position.set(
        3.3 + stack * 0.82,
        0.18 + tire * 0.26,
        -2.55,
      );
      mesh.rotation.x = Math.PI / 2;
      mesh.material = rubber;
      mesh.receiveShadows = true;
      mesh.isPickable = false;
      meshes.push(mesh);
    }
  }

  box(
    "garage-ceiling-light-west",
    { x: 2.8, y: 0.08, z: 0.18 },
    { x: -2.7, y: interior.localMax.y - 0.18, z: -0.7 },
    lightMaterial,
  );
  box(
    "garage-ceiling-light-east",
    { x: 2.8, y: 0.08, z: 0.18 },
    { x: 2.7, y: interior.localMax.y - 0.18, z: -0.7 },
    lightMaterial,
  );

  let disposed = false;
  return {
    root,
    meshes,
    setVisible(visible) {
      root.setEnabled(visible);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const mesh of meshes) mesh.dispose();
      root.dispose();
      for (const value of materials) value.dispose();
    },
  };
}
