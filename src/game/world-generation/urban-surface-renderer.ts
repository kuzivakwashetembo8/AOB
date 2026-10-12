import {
  Color3,
  Mesh,
  MeshBuilder,
  StandardMaterial,
  VertexData,
} from "@babylonjs/core";
import type { Material, Scene } from "@babylonjs/core";
import type { CitySpec, WorldPosition } from "./schema";
import { planRoadGraph, projectToRoad } from "./road-graph";
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

export interface CurbCutPlan {
  readonly id: string;
  readonly segmentId: string;
  readonly side: "left" | "right";
  readonly center: WorldPosition;
  readonly width: number;
}

export interface GeneratedUrbanSurfaces {
  readonly meshes: readonly Mesh[];
  readonly markingPlan: readonly RoadMarkingPlan[];
  readonly curbCutPlan: readonly CurbCutPlan[];
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

export function planCurbCuts(city: CitySpec): readonly CurbCutPlan[] {
  const cuts: CurbCutPlan[] = [];
  const segments = new Map(
    city.roads.segments.map((segment) => [segment.id, segment] as const),
  );
  const nodes = new Map(
    city.roads.nodes.map((node) => [node.id, node.position] as const),
  );

  for (const district of city.districts) {
    for (const neighborhood of district.neighborhoods) {
      for (const block of neighborhood.blocks) {
        for (const lot of block.lots) {
          const building = lot.building;
          if (!building) continue;
          const segment = segments.get(lot.frontage.roadSegmentId);
          if (!segment) continue;
          const a = nodes.get(segment.startNodeId);
          const b = nodes.get(segment.endNodeId);
          if (!a || !b) continue;

          const garageAnchors = (building.anchors ?? []).filter(
            (item) => item.kind === "garage-entrance",
          );
          for (const garage of garageAnchors) {
            const projection = projectToRoad(
              city.roads,
              garage.position,
              segment.id,
            );
            if (!projection) continue;
            const nx = -projection.tangent.z;
            const nz = projection.tangent.x;
            const sideDot =
              (garage.position.x - projection.position.x) * nx +
              (garage.position.z - projection.position.z) * nz;
            const opening = (building.openings ?? []).find(
              (item) => item.anchorId === garage.id,
            );
            cuts.push({
              id: building.id + ":" + garage.id,
              segmentId: segment.id,
              side: sideDot >= 0 ? "left" : "right",
              center: projection.position,
              width: Math.max(3.2, (opening?.width ?? 3.8) + 0.8),
            });
          }
        }
      }
    }
  }

  return cuts.sort((a, b) => a.id.localeCompare(b.id));
}

function splitLineAroundCuts(
  start: WorldPosition,
  end: WorldPosition,
  cuts: readonly CurbCutPlan[],
): readonly [WorldPosition, WorldPosition][] {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dz);
  if (length <= 0.001 || cuts.length === 0) return [[start, end]];
  const ux = dx / length;
  const uz = dz / length;

  const intervals = cuts
    .map((cut) => {
      const distanceAlong =
        (cut.center.x - start.x) * ux + (cut.center.z - start.z) * uz;
      return {
        from: Math.max(0, distanceAlong - cut.width / 2),
        to: Math.min(length, distanceAlong + cut.width / 2),
      };
    })
    .filter((item) => item.to > item.from)
    .sort((a, b) => a.from - b.from);

  const pieces: [WorldPosition, WorldPosition][] = [];
  let cursor = 0;
  for (const interval of intervals) {
    if (interval.from > cursor + 0.01) {
      pieces.push([
        {
          x: start.x + ux * cursor,
          y: start.y,
          z: start.z + uz * cursor,
        },
        {
          x: start.x + ux * interval.from,
          y: start.y,
          z: start.z + uz * interval.from,
        },
      ]);
    }
    cursor = Math.max(cursor, interval.to);
  }
  if (cursor < length - 0.01) {
    pieces.push([
      {
        x: start.x + ux * cursor,
        y: start.y,
        z: start.z + uz * cursor,
      },
      end,
    ]);
  }
  return pieces;
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


function isFirstLightReferenceCity(city: CitySpec): boolean {
  return (
    city.id === "meridian-city" &&
    city.districts.some((district) =>
      district.neighborhoods.some(
        (neighborhood) => neighborhood.id === "south-ward-first-light",
      ),
    )
  );
}

function authoredParityBox(
  scene: Scene,
  name: string,
  x: number,
  y: number,
  z: number,
  width: number,
  height: number,
  depth: number,
  material: Material,
): Mesh {
  const mesh = MeshBuilder.CreateBox(name, { width, height, depth }, scene);
  mesh.position.set(x, y, z);
  mesh.material = material;
  mesh.receiveShadows = true;
  mesh.isPickable = false;
  return mesh;
}

function createFirstLightAuthoredParitySurfaces(
  scene: Scene,
): GeneratedUrbanSurfaces {
  const meshes: Mesh[] = [];
  const materials: StandardMaterial[] = [];

  const asphalt = makeTexturedMaterial(scene, "generated-asphalt", "asphalt");
  const sidewalk = makeTexturedMaterial(
    scene,
    "generated-sidewalk",
    "sidewalk-paving",
  );
  const curb = new StandardMaterial("generated-curb", scene);
  curb.diffuseColor = new Color3(0.48, 0.45, 0.39);
  curb.specularColor = new Color3(0.03, 0.03, 0.03);

  const marking = new StandardMaterial("generated-road-marking", scene);
  marking.diffuseColor = new Color3(0.72, 0.61, 0.31);
  marking.specularColor = new Color3(0.02, 0.02, 0.02);

  const drain = new StandardMaterial("generated-road-drain", scene);
  drain.diffuseColor = new Color3(0.16, 0.19, 0.18);
  drain.specularColor = new Color3(0.04, 0.04, 0.04);

  const residentialPaving = new StandardMaterial("generated-south-ward-residential-paving", scene);
  residentialPaving.diffuseColor = new Color3(0.40, 0.41, 0.39);
  residentialPaving.specularColor = new Color3(0.06, 0.06, 0.05);
  const grass = new StandardMaterial("generated-south-ward-maintained-grass", scene);
  grass.diffuseColor = new Color3(0.27, 0.38, 0.24);
  grass.specularColor = new Color3(0.01, 0.02, 0.01);
  const parking = new StandardMaterial("generated-south-ward-car-park", scene);
  parking.diffuseColor = new Color3(0.31, 0.32, 0.31);
  parking.specularColor = new Color3(0.04, 0.04, 0.04);
  const stallMarking = new StandardMaterial("generated-south-ward-parking-lines", scene);
  stallMarking.diffuseColor = new Color3(0.70, 0.71, 0.65);
  materials.push(asphalt, sidewalk, curb, marking, drain,
    residentialPaving, grass, parking, stallMarking);

  // Develop residential parcels rather than leaving an unexplained brown
  // infinite ground. Deliberately zoned rectangles are BELOW road/sidewalk
  // surfaces and have no separate collider or loading dependency.
  const zones = [
    { id: "north", x: 0, z: -19.5, w: 130, d: 47, material: residentialPaving },
    { id: "west-residential", x: -24.5, z: 28, w: 81, d: 32, material: grass },
    { id: "east-residential", x: 44.5, z: 28, w: 41, d: 32, material: residentialPaving },
    { id: "rear-residential", x: 0, z: 69, w: 130, d: 34, material: grass },
  ] as const;
  for (const zone of zones) {
    meshes.push(authoredParityBox(scene, "generated-development:" + zone.id,
      zone.x, 0.009, zone.z, zone.w, 0.018, zone.d, zone.material));
  }
  for (const lot of [
    { id: "west-parking", x: -41, z: 29, w: 10, d: 14 },
    { id: "east-parking", x: 39.5, z: 31, w: 8, d: 13 },
    { id: "rear-service-parking", x: 53.5, z: 68.5, w: 13, d: 12 },
  ]) {
    meshes.push(authoredParityBox(scene, "generated-parking:" + lot.id,
      lot.x, 0.020, lot.z, lot.w, 0.022, lot.d, parking));
    for (let index = 1; index < 4; index++) {
      const lineZ = lot.z - lot.d / 2 + index * lot.d / 4;
      meshes.push(authoredParityBox(scene,
        "generated-parking-marking:" + lot.id + ":" + index,
        lot.x, 0.033, lineZ, lot.w - 0.75, 0.010, 0.085, stallMarking));
    }
  }

  // First Light road ownership: longitudinal Mercer/Foundry surfaces own
  // the entire T-junction. Workshop Road ends at each road's OUTER edge:
  // no coincident coplanar asphalt layers or raised junction carpet patch.
  meshes.push(
    authoredParityBox(scene, "generated-parity-main-road", 0, 0.015, 8, 130, 0.03, 8, asphalt),
    authoredParityBox(scene, "generated-parity-side-road", 20, 0.015, 28, 8, 0.03, 32, asphalt),
    authoredParityBox(scene, "generated-parity-north-walk", 0, 0.055, 2.125, 130, 0.11, 3.75, sidewalk),
    authoredParityBox(scene, "generated-parity-south-walk-west", -24.5, 0.055, 13.875, 81, 0.11, 3.75, sidewalk),
    authoredParityBox(scene, "generated-parity-south-walk-east", 44.5, 0.055, 13.875, 41, 0.11, 3.75, sidewalk),
    authoredParityBox(scene, "generated-parity-north-curb", 0, 0.105, 4.02, 130, 0.21, 0.2, curb),
    authoredParityBox(scene, "generated-parity-south-curb-west", -24.5, 0.105, 11.98, 81, 0.21, 0.2, curb),
    authoredParityBox(scene, "generated-parity-south-curb-east", 44.5, 0.105, 11.98, 41, 0.21, 0.2, curb),
    authoredParityBox(scene, "generated-parity-rear-road", 2, 0.018, 48, 118, 0.035, 8, asphalt),
  );

  const rearSegments = [
    { suffix: "west", x: -20.5, width: 73 },
    { suffix: "east", x: 42.5, width: 37 },
  ] as const;
  rearSegments.forEach((segment) => {
    meshes.push(
      authoredParityBox(scene, "generated-parity-rear-north-walk-" + segment.suffix, segment.x, 0.055, 42.125, segment.width, 0.11, 3.75, sidewalk),
      authoredParityBox(scene, "generated-parity-rear-south-walk-" + segment.suffix, segment.x, 0.055, 53.875, segment.width, 0.11, 3.75, sidewalk),
      authoredParityBox(scene, "generated-parity-rear-north-curb-" + segment.suffix, segment.x, 0.105, 44.02, segment.width, 0.21, 0.2, curb),
      authoredParityBox(scene, "generated-parity-rear-south-curb-" + segment.suffix, segment.x, 0.105, 51.98, segment.width, 0.21, 0.2, curb),
    );
  });

  meshes.push(
    authoredParityBox(scene, "generated-parity-side-west-walk", 14.125, 0.055, 28, 3.75, 0.11, 24.5, sidewalk),
    authoredParityBox(scene, "generated-parity-side-east-walk", 25.875, 0.055, 28, 3.75, 0.11, 24.5, sidewalk),
    authoredParityBox(scene, "generated-parity-side-west-curb", 16.02, 0.105, 28, 0.2, 0.21, 24.5, curb),
    authoredParityBox(scene, "generated-parity-side-east-curb", 23.98, 0.105, 28, 0.2, 0.21, 24.5, curb),
  );

  const markingPlan: RoadMarkingPlan[] = [];

  for (let x = -56; x <= 56; x += 8) {
    meshes.push(
      authoredParityBox(scene, "generated-parity-main-lane-" + x, x, 0.045, 8, 3.4, 0.035, 0.14, marking),
    );
    markingPlan.push({
      id: "parity-main:" + x,
      center: { x, y: 0.045, z: 8 },
      length: 3.4,
      width: 0.14,
      yawRadians: Math.PI / 2,
      kind: "center-dash",
    });
  }

  for (let z = 17; z <= 39; z += 8) {
    meshes.push(
      authoredParityBox(scene, "generated-parity-side-lane-" + z, 20, 0.06, z, 0.14, 0.04, 3.2, marking),
    );
    markingPlan.push({
      id: "parity-side:" + z,
      center: { x: 20, y: 0.06, z },
      length: 3.2,
      width: 0.14,
      yawRadians: 0,
      kind: "center-dash",
    });
  }

  for (let x = -48; x <= 48; x += 8) {
    meshes.push(
      authoredParityBox(scene, "generated-parity-rear-lane-" + x, x, 0.045, 48, 3.4, 0.035, 0.14, marking),
    );
    markingPlan.push({
      id: "parity-rear:" + x,
      center: { x, y: 0.045, z: 48 },
      length: 3.4,
      width: 0.14,
      yawRadians: Math.PI / 2,
      kind: "center-dash",
    });
  }

  [-1.9, -1.25, -0.6, 0.6, 1.25, 1.9].forEach((offset, index) => {
    meshes.push(
      authoredParityBox(scene, "generated-parity-main-crosswalk-" + index, 20 + offset, 0.065, 8, 0.34, 0.03, 7.2, curb),
      authoredParityBox(scene, "generated-parity-rear-crosswalk-" + index, 20 + offset, 0.065, 48, 0.34, 0.03, 7.2, curb),
    );
  });

  for (let x = -54; x <= 54; x += 11) {
    meshes.push(
      authoredParityBox(scene, "generated-parity-drain-" + x, x, 0.12, 3.89, 1.1, 0.03, 0.17, drain),
    );
  }

  let disposed = false;
  return {
    meshes,
    markingPlan,
    curbCutPlan: [],
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

export function createGeneratedUrbanSurfaces(
  scene: Scene,
  city: CitySpec,
): GeneratedUrbanSurfaces {
  if (isFirstLightReferenceCity(city)) {
    return createFirstLightAuthoredParitySurfaces(scene);
  }

  const roadPlan = planRoadGraph(city.roads);
  const curbCutPlan = planCurbCuts(city);
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

    for (const side of ["left", "right"] as const) {
      const line = side === "left" ? surface.leftCurb : surface.rightCurb;
      const cuts = curbCutPlan.filter(
        (cut) => cut.segmentId === surface.segmentId && cut.side === side,
      );
      const pieces = splitLineAroundCuts(line[0]!, line[1]!, cuts);
      pieces.forEach(([start, end], index) => {
        meshes.push(
          createStrip(
            scene,
            "generated-curb-" +
              side +
              ":" +
              surface.segmentId +
              ":" +
              index,
            start,
            end,
            0.2,
            0.17,
            0.055,
            curb,
          ),
        );
      });

      for (const cut of cuts) {
        const dx = line[1]!.x - line[0]!.x;
        const dz = line[1]!.z - line[0]!.z;
        const length = Math.hypot(dx, dz);
        const ux = dx / length;
        const uz = dz / length;
        const along =
          (cut.center.x - line[0]!.x) * ux +
          (cut.center.z - line[0]!.z) * uz;
        const half = cut.width / 2;
        const rampStart = {
          x: line[0]!.x + ux * Math.max(0, along - half),
          y: line[0]!.y,
          z: line[0]!.z + uz * Math.max(0, along - half),
        };
        const rampEnd = {
          x: line[0]!.x + ux * Math.min(length, along + half),
          y: line[0]!.y,
          z: line[0]!.z + uz * Math.min(length, along + half),
        };
        meshes.push(
          createStrip(
            scene,
            "generated-curb-cut:" + cut.id,
            rampStart,
            rampEnd,
            0.24,
            0.045,
            0.055,
            sidewalk,
          ),
        );
      }
    }
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
    curbCutPlan,
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
