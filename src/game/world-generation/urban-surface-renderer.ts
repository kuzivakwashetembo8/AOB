import {
  Color3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  VertexData,
} from "@babylonjs/core";
import type { Material, Scene } from "@babylonjs/core";
import type { CitySpec, WorldPosition } from "./schema";
import { planRoadGraph } from "./road-graph";
import type { JunctionEdge, RoadJunctionPlan } from "./road-graph";
import { MATERIAL_FAMILIES } from "./representation-materials";
import { createSurfaceTexture } from "./surface-textures";
import type {
  MaterialFamilyId,
  MaterialRecipe,
} from "./representation-materials";

export interface RoadMarkingPlan {
  readonly id: string;
  readonly center: WorldPosition;
  readonly length: number;
  readonly width: number;
  readonly yawRadians: number;
  readonly kind: "center-dash" | "stop-line";
}

export interface GeneratedUrbanSurfaces {
  readonly meshes: readonly Mesh[];
  readonly markingPlan: readonly RoadMarkingPlan[];
  dispose(): void;
}

function urbanRecipe(
  familyId: MaterialFamilyId,
  key: string,
): MaterialRecipe {
  const family = MATERIAL_FAMILIES[familyId];
  return {
    key: "urban:" + key,
    familyId,
    role: familyId === "asphalt" ? "roof" : "trim",
    color: family.color,
    roughness: family.roughness,
    metalness: family.metalness,
    alpha: family.alpha,
    textureKind: family.textureKind,
    textureScale: family.textureScale,
    variation: {
      tintBucket: 0,
      weathering: 0.64,
      grime: 0.58,
      patching: 0.48,
      uvOffset: { u: 0.17, v: 0.39 },
    },
  };
}

function makeTexturedMaterial(
  scene: Scene,
  name: string,
  familyId: MaterialFamilyId,
): StandardMaterial {
  const recipe = urbanRecipe(familyId, name);
  const material = new StandardMaterial(name, scene);
  material.diffuseTexture = createSurfaceTexture(scene, recipe);
  material.diffuseColor = Color3.White();
  material.specularColor = new Color3(0.025, 0.025, 0.025);
  material.specularPower = 8;
  return material;
}

function createConvexSurface(
  scene: Scene,
  name: string,
  points: readonly WorldPosition[],
  y: number,
  material: Material,
): Mesh {
  if (points.length < 3) {
    throw new Error("Surface " + name + " needs at least three points");
  }

  const mesh = new Mesh(name, scene);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (const point of points) {
    positions.push(point.x, y, point.z);
    normals.push(0, 1, 0);
    uvs.push(point.x * 0.08, point.z * 0.08);
  }

  for (let index = 1; index < points.length - 1; index += 1) {
    indices.push(0, index, index + 1);
  }

  const data = new VertexData();
  data.positions = positions;
  data.normals = normals;
  data.uvs = uvs;
  data.indices = indices;
  data.applyToMesh(mesh);
  mesh.material = material;
  mesh.receiveShadows = true;
  mesh.isPickable = false;
  return mesh;
}

function createStrip(
  scene: Scene,
  name: string,
  start: WorldPosition,
  end: WorldPosition,
  width: number,
  height: number,
  y: number,
  material: Material,
): Mesh {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dz);
  const mesh = MeshBuilder.CreateBox(
    name,
    { width, height, depth: length },
    scene,
  );
  mesh.position.set(
    (start.x + end.x) / 2,
    y + height / 2,
    (start.z + end.z) / 2,
  );
  mesh.rotation.y = Math.atan2(dx, dz);
  mesh.material = material;
  mesh.receiveShadows = true;
  mesh.isPickable = false;
  return mesh;
}

function average(a: WorldPosition, b: WorldPosition, y = 0): WorldPosition {
  return { x: (a.x + b.x) / 2, y, z: (a.z + b.z) / 2 };
}

const oppositeEdge = (edge: JunctionEdge): JunctionEdge =>
  edge === "negative-x"
    ? "positive-x"
    : edge === "positive-x"
      ? "negative-x"
      : edge === "negative-z"
        ? "positive-z"
        : "negative-z";

function tStemSegment(junction: RoadJunctionPlan): string | null {
  if (junction.kind !== "t") return null;
  const edges = new Set(junction.roadMouths.map((mouth) => mouth.edge));
  const stem = junction.roadMouths.find(
    (mouth) => !edges.has(oppositeEdge(mouth.edge)),
  );
  return stem?.segmentId ?? null;
}

export function planRoadMarkings(city: CitySpec): readonly RoadMarkingPlan[] {
  const roadPlan = planRoadGraph(city.roads);
  const junctionByNode = new Map(
    roadPlan.junctions.map((junction) => [junction.nodeId, junction] as const),
  );
  const markings: RoadMarkingPlan[] = [];

  for (const surface of roadPlan.surfaces) {
    const [leftStart, leftEnd, rightEnd, rightStart] = surface.asphalt;
    if (!leftStart || !leftEnd || !rightEnd || !rightStart) continue;

    const start = average(leftStart, rightStart, 0.085);
    const end = average(leftEnd, rightEnd, 0.085);
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.hypot(dx, dz);
    const yawRadians = Math.atan2(dx, dz);
    const ux = length > 0 ? dx / length : 0;
    const uz = length > 0 ? dz / length : 1;

    const dashLength = 3.1;
    const gap = 4.2;
    for (
      let distance = 1.8;
      distance + dashLength <= length - 1.4;
      distance += dashLength + gap
    ) {
      markings.push({
        id: surface.segmentId + ":center:" + distance.toFixed(1),
        center: {
          x: start.x + ux * (distance + dashLength / 2),
          y: 0.085,
          z: start.z + uz * (distance + dashLength / 2),
        },
        length: dashLength,
        width: 0.13,
        yawRadians,
        kind: "center-dash",
      });
    }

    const segment = city.roads.segments.find(
      (candidate) => candidate.id === surface.segmentId,
    );
    if (!segment) continue;

    const startJunction = junctionByNode.get(segment.startNodeId);
    const endJunction = junctionByNode.get(segment.endNodeId);

    if (
      surface.startCut > 0.01 &&
      startJunction &&
      tStemSegment(startJunction) === surface.segmentId
    ) {
      markings.push({
        id: surface.segmentId + ":start-stop",
        center: {
          x: start.x + ux * 0.7,
          y: 0.088,
          z: start.z + uz * 0.7,
        },
        length: segment.width - 0.8,
        width: 0.16,
        yawRadians: yawRadians + Math.PI / 2,
        kind: "stop-line",
      });
    }

    if (
      surface.endCut > 0.01 &&
      endJunction &&
      tStemSegment(endJunction) === surface.segmentId
    ) {
      markings.push({
        id: surface.segmentId + ":end-stop",
        center: {
          x: end.x - ux * 0.7,
          y: 0.088,
          z: end.z - uz * 0.7,
        },
        length: segment.width - 0.8,
        width: 0.16,
        yawRadians: yawRadians + Math.PI / 2,
        kind: "stop-line",
      });
    }
  }

  return markings;
}

function createRoadNaturalism(
  scene: Scene,
  city: CitySpec,
  materials: {
    readonly patch: Material;
    readonly drain: Material;
    readonly gutter: Material;
  },
): Mesh[] {
  const meshes: Mesh[] = [];
  const nodes = new Map(
    city.roads.nodes.map((node) => [node.id, node.position] as const),
  );

  for (const segment of city.roads.segments) {
    const start = nodes.get(segment.startNodeId);
    const end = nodes.get(segment.endNodeId);
    if (!start || !end) continue;

    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.hypot(dx, dz);
    if (length < 16) continue;
    const ux = dx / length;
    const uz = dz / length;
    const nx = -uz;
    const nz = ux;
    const yaw = Math.atan2(dx, dz);

    const gutterOffset = segment.width / 2 - 0.18;
    for (const side of [-1, 1] as const) {
      const gutter = createStrip(
        scene,
        "generated-gutter:" + segment.id + ":" + side,
        {
          x: start.x + nx * gutterOffset * side,
          y: 0,
          z: start.z + nz * gutterOffset * side,
        },
        {
          x: end.x + nx * gutterOffset * side,
          y: 0,
          z: end.z + nz * gutterOffset * side,
        },
        0.24,
        0.012,
        0.058,
        materials.gutter,
      );
      meshes.push(gutter);
    }

    for (
      let distance = Math.min(9, length * 0.18);
      distance < length - Math.min(9, length * 0.18);
      distance += 22
    ) {
      const side = Math.floor(distance / 22) % 2 === 0 ? 1 : -1;
      const drain = MeshBuilder.CreateBox(
        "generated-drain:" + segment.id + ":" + distance.toFixed(1),
        { width: 0.95, height: 0.018, depth: 0.18 },
        scene,
      );
      drain.position.set(
        start.x + ux * distance + nx * (segment.width / 2 - 0.1) * side,
        0.087,
        start.z + uz * distance + nz * (segment.width / 2 - 0.1) * side,
      );
      drain.rotation.y = yaw;
      drain.material = materials.drain;
      drain.isPickable = false;
      meshes.push(drain);
    }

    const patchDistance = length * 0.36;
    const patch = MeshBuilder.CreateBox(
      "generated-asphalt-repair:" + segment.id,
      {
        width: Math.min(2.2, Math.max(1.2, segment.width * 0.22)),
        height: 0.012,
        depth: Math.min(5.5, Math.max(3.2, length * 0.09)),
      },
      scene,
    );
    patch.position.set(
      start.x + ux * patchDistance + nx * segment.width * 0.12,
      0.072,
      start.z + uz * patchDistance + nz * segment.width * 0.12,
    );
    patch.rotation.y = yaw;
    patch.material = materials.patch;
    patch.isPickable = false;
    meshes.push(patch);
  }

  return meshes;
}

export function createGeneratedUrbanSurfaces(
  scene: Scene,
  city: CitySpec,
): GeneratedUrbanSurfaces {
  const roadPlan = planRoadGraph(city.roads);
  const meshes: Mesh[] = [];
  const materials: StandardMaterial[] = [];

  const asphalt = makeTexturedMaterial(scene, "generated-asphalt", "asphalt");
  const sidewalk = makeTexturedMaterial(
    scene,
    "generated-sidewalk",
    "sidewalk-paving",
  );
  const curb = new StandardMaterial("generated-curb", scene);
  curb.diffuseColor = new Color3(0.47, 0.45, 0.41);
  curb.specularColor = Color3.Black();

  const marking = new StandardMaterial("generated-road-marking", scene);
  marking.diffuseColor = new Color3(0.84, 0.8, 0.65);
  marking.emissiveColor = new Color3(0.04, 0.035, 0.02);
  marking.specularColor = Color3.Black();

  const drain = new StandardMaterial("generated-road-drain", scene);
  drain.diffuseColor = new Color3(0.12, 0.13, 0.13);
  drain.specularColor = Color3.Black();

  const gutter = new StandardMaterial("generated-road-gutter-wear", scene);
  gutter.diffuseColor = new Color3(0.14, 0.145, 0.14);
  gutter.alpha = 0.7;
  gutter.specularColor = Color3.Black();

  const patch = new StandardMaterial("generated-road-repair", scene);
  patch.diffuseColor = new Color3(0.145, 0.15, 0.145);
  patch.specularColor = Color3.Black();

  materials.push(asphalt, sidewalk, curb, marking, drain, gutter, patch);

  for (const surface of roadPlan.surfaces) {
    meshes.push(
      createConvexSurface(
        scene,
        "generated-asphalt:" + surface.segmentId,
        surface.asphalt,
        0.045,
        asphalt,
      ),
      createConvexSurface(
        scene,
        "generated-sidewalk-left:" + surface.segmentId,
        surface.leftSidewalk,
        0.095,
        sidewalk,
      ),
      createConvexSurface(
        scene,
        "generated-sidewalk-right:" + surface.segmentId,
        surface.rightSidewalk,
        0.095,
        sidewalk,
      ),
    );

    meshes.push(
      createStrip(
        scene,
        "generated-curb-left:" + surface.segmentId,
        surface.leftCurb[0]!,
        surface.leftCurb[1]!,
        0.2,
        0.17,
        0.055,
        curb,
      ),
      createStrip(
        scene,
        "generated-curb-right:" + surface.segmentId,
        surface.rightCurb[0]!,
        surface.rightCurb[1]!,
        0.2,
        0.17,
        0.055,
        curb,
      ),
    );
  }

  for (const junction of roadPlan.junctions) {
    meshes.push(
      createConvexSurface(
        scene,
        "generated-junction:" + junction.nodeId,
        junction.asphalt,
        0.048,
        asphalt,
      ),
    );

    junction.sidewalkCorners.forEach((corner, index) => {
      meshes.push(
        createConvexSurface(
          scene,
          "generated-junction-walk:" + junction.nodeId + ":" + index,
          corner,
          0.095,
          sidewalk,
        ),
      );
    });

    junction.curbSegments.forEach(([start, end], index) => {
      meshes.push(
        createStrip(
          scene,
          "generated-junction-curb:" + junction.nodeId + ":" + index,
          start,
          end,
          0.2,
          0.17,
          0.055,
          curb,
        ),
      );
    });
  }

  meshes.push(
    ...createRoadNaturalism(scene, city, {
      patch,
      drain,
      gutter,
    }),
  );

  const markingPlan = planRoadMarkings(city);
  for (const item of markingPlan) {
    const mesh = MeshBuilder.CreateBox(
      "generated-road-marking:" + item.id,
      { width: item.width, height: 0.025, depth: item.length },
      scene,
    );
    mesh.position.set(item.center.x, item.center.y, item.center.z);
    mesh.rotation.y = item.yawRadians;
    mesh.material = marking;
    mesh.isPickable = false;
    meshes.push(mesh);
  }

  let disposed = false;
  return {
    meshes,
    markingPlan,
    dispose() {
      if (disposed) return;
      disposed = true;
      for (const mesh of meshes) mesh.dispose();
      for (const material of materials) {
        const texture = material.diffuseTexture;
        material.diffuseTexture = null;
        texture?.dispose();
        material.dispose();
      }
    },
  };
}
