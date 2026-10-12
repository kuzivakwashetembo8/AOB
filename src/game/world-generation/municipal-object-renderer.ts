/**
 * SO-MA Municipal Administration — static, batched-by-material-capable urban
 * prop renderer. Each plan item owns exactly one transform, optional fitted
 * mesh geometry, and optionally one simple Rapier collision handle. The
 * imported user shop boards are same-origin WebP files, never remote URLs.
 */
import {
  Color3, DynamicTexture, Mesh, MeshBuilder, PointLight, StandardMaterial,
  Texture, TransformNode, Vector3,
} from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";
import type { MunicipalItem } from "./municipal-object-plan";

export interface GeneratedMunicipalContext {
  readonly itemCount: number;
  readonly meshes: readonly Mesh[];
  readonly boards: readonly string[];
  /** Reuses Meridian's existing daylight cycle, no new animation loop. */
  setNightFraction(night: number): void;
  dispose(): void;
}

const SHOP_ART: Readonly<Record<"south-ward-shop-open" | "south-ward-shop-closed", string>> = {
  "south-ward-shop-open": "/SHOP%20OPEN%20BOARD.webp",
  "south-ward-shop-closed": "/SHOP%20CLOSED%20BOARD.webp",
};

const headless = (scene: Scene) => {
  const engine = scene.getEngine();
  return engine.getClassName() === "NullEngine" ||
    engine.constructor.name === "NullEngine" ||
    typeof document === "undefined";
};

export function createMunicipalStreetContext(
  scene: Scene, items: readonly MunicipalItem[],
): GeneratedMunicipalContext {
  const nodes: TransformNode[] = [];
  const meshes: Mesh[] = [];
  const materials: StandardMaterial[] = [];
  const textures: Texture[] = [];
  const dynamicTextures: DynamicTexture[] = [];
  const boards: string[] = [];
  const assetRoots = new Map<string, TransformNode[]>();
  const shopLights: PointLight[] = [];

  const solid = (name: string, hex: string) => {
    const material = new StandardMaterial("ma-material:" + name, scene);
    material.diffuseColor = Color3.FromHexString(hex);
    material.specularColor = new Color3(0.10, 0.11, 0.12);
    materials.push(material);
    return material;
  };
  const iron = solid("painted-iron", "#333c43");
  const steel = solid("galvanised-metal", "#879293");
  const charcoal = solid("dark-frames", "#252a2c");
  const refuse = solid("residential-bin", "#3d5550");
  const rubber = solid("rubber-wheels", "#181b1e");
  const yellow = solid("street-marker", "#c2a24f");
  const red = solid("road-safety-red", "#a7292b");
  const white = solid("road-safety-white", "#dfe3e0");
  const led = solid("shop-led-diffuser", "#e2e8e9");
  led.emissiveColor = new Color3(0.03, 0.04, 0.04);
  const ledFixture = solid("shop-led-housing", "#484e51");

  const box = (id: string, parent: TransformNode,
    width: number, height: number, depth: number,
    x: number, y: number, z: number, material: StandardMaterial) => {
    const m = MeshBuilder.CreateBox("ma:" + id, {
      width, height, depth,
    }, scene);
    m.parent = parent;
    m.position.set(x, y, z);
    m.material = material;
    m.isPickable = false;
    meshes.push(m);
    return m;
  };
  const cylinder = (id: string, parent: TransformNode,
    height: number, diameter: number,
    x: number, y: number, z: number, material: StandardMaterial, tessellation = 10) => {
    const m = MeshBuilder.CreateCylinder("ma:" + id, { height, diameter, tessellation }, scene);
    m.parent = parent;
    m.position.set(x, y, z);
    m.material = material;
    m.isPickable = false;
    meshes.push(m);
    return m;
  };

  const label = (id: string, parent: TransformNode, text: string,
    width: number, height: number, y: number, z: number,
    base = "#253a48", ink = "#f4f5ed") => {
    const board = box(id + ":plate", parent, width, height, 0.065,
      0, y, z, iron);
    if (headless(scene)) return board;
    const texture = new DynamicTexture("ma-label:" + id,
      { width: 1024, height: 256 }, scene, true);
    const context = texture.getContext() as CanvasRenderingContext2D;
    context.fillStyle = base;
    context.fillRect(0, 0, 1024, 256);
    context.fillStyle = ink;
    const fontSize = Math.min(144, Math.floor(1650 / Math.max(3.0, text.length * 0.55)));
    context.font = "bold " + fontSize + "px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, 512, 132, 970);
    texture.update();
    dynamicTextures.push(texture);
    const material = new StandardMaterial("ma-lettering:" + id, scene);
    material.diffuseTexture = texture;
    material.emissiveColor = new Color3(0.06, 0.06, 0.06);
    material.backFaceCulling = false;
    materials.push(material);
    const face = MeshBuilder.CreatePlane("ma:" + id + ":lettering", {
      width: width - 0.04, height: height - 0.04, sideOrientation: Mesh.DOUBLESIDE,
    }, scene);
    face.parent = parent;
    face.position.set(0, y, z + 0.039);
    face.material = material;
    face.isPickable = false;
    meshes.push(face);
    return board;
  };

  // The assets were committed by the project owner, with no runtime network
  // request outside the app origin. Decorative WebP failure never blocks boot.
  const artMaterials = new Map<string, StandardMaterial>();
  function art(assetId: "south-ward-shop-open" | "south-ward-shop-closed") {
    const known = artMaterials.get(assetId);
    if (known) return known;
    const material = new StandardMaterial("ma-shop-art:" + assetId, scene);
    material.backFaceCulling = false;
    material.specularColor = new Color3(0.05, 0.05, 0.05);
    // NullEngine test runs must not request network-dependent image resources.
    if (!headless(scene)) {
      const texture = new Texture(
        SHOP_ART[assetId], scene, true, false,
        Texture.TRILINEAR_SAMPLINGMODE, undefined,
        (_message, error) => {
          console.warn("[SO-MA] Optional shop-board image unavailable:", assetId,
            error instanceof Error ? error.message : String(error));
          // Fail closed: do not leave a blank frame mistaken for a qualified
          // imported art board. No impact on world/character/vehicle startup.
          for (const root of assetRoots.get(assetId) ?? []) root.setEnabled(false);
        },
      );
      texture.name = "ma-shop-board-art:" + assetId;
      texture.wrapU = Texture.CLAMP_ADDRESSMODE;
      texture.wrapV = Texture.CLAMP_ADDRESSMODE;
      texture.hasAlpha = true;
      material.diffuseTexture = texture;
      material.useAlphaFromDiffuseTexture = true;
      textures.push(texture);
    }
    materials.push(material);
    artMaterials.set(assetId, material);
    return material;
  }

  for (const item of items) {
    const root = new TransformNode("ma-root:" + item.id, scene);
    root.position.set(item.position.x, item.position.y, item.position.z);
    root.rotation.y = item.yawRadians;
    nodes.push(root);

    switch (item.kind) {
      case "shop-board": {
        if (!item.assetId) throw new Error("Shop board must have qualified asset ID " + item.id);
        assetRoots.set(item.assetId, [...(assetRoots.get(item.assetId) ?? []), root]);
        // Image-first detail, REAL 7cm 3D frame; mounting is on the frontage
        // band above the ground-floor shop glazing, not at pedestrian height.
        box(item.id + ":frame", root, 1.68, 0.80, 0.08,
          0, 0, 0, charcoal);
        const panel = MeshBuilder.CreatePlane("ma-shop-board-face:" + item.id,
          { width: 1.60, height: 0.72, sideOrientation: Mesh.DOUBLESIDE }, scene);
        panel.parent = root;
        panel.position.z = 0.052;
        const shopMaterial = art(item.assetId);
        panel.material = shopMaterial;
        // Keep the owner's exact artwork proportions inside the physical
        // frame. WebP transfer compression is not a license to stretch art.
        const texture = shopMaterial.diffuseTexture as Texture | null;
        if (texture) {
          const fit = () => {
            const size = texture.getSize();
            if (!size.width || !size.height) return;
            const actualRatio = size.width / size.height;
            const frameRatio = 1.60 / 0.72;
            panel.scaling.x = Math.min(1, actualRatio / frameRatio);
            panel.scaling.y = Math.min(1, frameRatio / actualRatio);
          };
          if (texture.isReady()) fit();
          else texture.onLoadObservable.addOnce(fit);
        }
        panel.isPickable = false;
        meshes.push(panel);
        boards.push(item.id);
        break;
      }
      case "shop-name":
        label(item.id + ":shop-name", root, item.label ?? "CORNER SHOP",
          3.60, 0.52, 0, 0.015, "#242d35", "#f9f4df");
        break;
      case "storefront-led": {
        // The existing dark storefront bands now have a credible aluminium
        // housing, a thin white visible diffuser and ONE modest point light.
        box(item.id + ":housing", root, 6.60, 0.12, 0.14, 0, 0, 0, ledFixture);
        box(item.id + ":diffuser", root, 6.44, 0.065, 0.025,
          0, -0.038, 0.090, led);
        if (!headless(scene)) {
          const light = new PointLight("ma-shop-led-light:" + item.id,
            new Vector3(item.position.x, item.position.y - 0.13,
              item.position.z + Math.cos(item.yawRadians) * 0.5), scene);
          light.diffuse = new Color3(0.95, 0.97, 1);
          light.specular = new Color3(0.32, 0.35, 0.38);
          light.range = 6;
          light.intensity = 0;
          shopLights.push(light);
        }
        break;
      }
      case "wheelie-bin":
        box(item.id + ":body", root, 0.60, 0.79, 0.65, 0, 0.47, 0, refuse);
        box(item.id + ":lid", root, 0.65, 0.07, 0.72, 0, 0.89, 0, charcoal);
        box(item.id + ":handle", root, 0.46, 0.05, 0.10, 0, 0.98, -0.31, iron);
        for (const side of [-1, 1])
          cylinder(item.id + ":wheel:" + side, root, 0.13, 0.19,
            side * 0.29, 0.12, -0.27, rubber, 12).rotation.z = Math.PI / 2;
        break;
      case "hydrant":
        cylinder(item.id + ":base", root, 0.20, 0.39, 0, 0.10, 0, iron);
        cylinder(item.id + ":column", root, 0.57, 0.29, 0, 0.42, 0, red);
        cylinder(item.id + ":cap", root, 0.17, 0.39, 0, 0.69, 0, red);
        box(item.id + ":valve", root, 0.45, 0.17, 0.18, 0, 0.43, 0, steel);
        break;
      case "bollard":
        cylinder(item.id + ":post", root, 0.82, 0.20, 0, 0.42, 0, iron);
        cylinder(item.id + ":band", root, 0.11, 0.208, 0, 0.66, 0, yellow);
        break;
      case "utility-cabinet":
        box(item.id + ":cabinet", root, 0.88, 1.34, 0.44, 0, 0.69, 0, steel);
        box(item.id + ":door", root, 0.78, 1.22, 0.025, 0, 0.7, 0.23, iron);
        box(item.id + ":handle", root, 0.035, 0.13, 0.035, 0.29, 0.66, 0.26, charcoal);
        break;
      case "street-name":
        cylinder(item.id + ":pole", root, 3.12, 0.095, 0, 1.56, 0, iron);
        label(item.id + ":street-name", root, item.label ?? "UNKNOWN ROAD",
          1.44, 0.33, 2.90, 0.11);
        break;
      case "stop-sign":
        cylinder(item.id + ":pole", root, 2.65, 0.095, 0, 1.325, 0, iron);
        label(item.id + ":stop", root, "STOP", 0.73, 0.72, 2.26, 0.10, "#9e292b");
        break;
    }
  }

  let disposed = false;
  return {
    itemCount: items.length, meshes, boards,
    setNightFraction(night) {
      const fraction = Math.max(0, Math.min(1, Number.isFinite(night) ? night : 0));
      const intensity = Math.max(0, (fraction - 0.28) / 0.72);
      led.emissiveColor = new Color3(0.03 + intensity * 0.93,
        0.04 + intensity * 0.94, 0.04 + intensity * 0.97);
      for (const light of shopLights) light.intensity = intensity * 0.95;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const light of shopLights) light.dispose();
      for (const root of nodes) root.dispose(false, false);
      for (const mesh of meshes) mesh.dispose(false, false);
      for (const m of materials) m.dispose(false, false);
      for (const t of textures) t.dispose();
      for (const t of dynamicTextures) t.dispose();
    },
  };
}
