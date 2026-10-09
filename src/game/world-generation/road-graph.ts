import type {
  GroundPoint,
  RoadNetworkSpec,
  RoadSegmentSpec,
  WorldPosition,
} from "./schema";

/** Geometry plans are pure data. Rendering and collision adapters may consume them later. */
export interface RoadSurfacePlan {
  readonly segmentId: string;
  readonly roadClass: RoadSegmentSpec["roadClass"];
  readonly asphalt: readonly WorldPosition[];
  readonly leftSidewalk: readonly WorldPosition[];
  readonly rightSidewalk: readonly WorldPosition[];
  /** Curbs are only longitudinal boundaries and never cap an active road mouth. */
  readonly leftCurb: readonly WorldPosition[];
  readonly rightCurb: readonly WorldPosition[];
  readonly startCut: number;
  readonly endCut: number;
}

export type JunctionEdge = "negative-x" | "positive-x" | "negative-z" | "positive-z";

export interface RoadMouthPlan {
  readonly segmentId: string;
  readonly edge: JunctionEdge;
  readonly width: number;
  readonly center: WorldPosition;
}

export interface RoadJunctionPlan {
  readonly nodeId: string;
  readonly kind: "continuation" | "t" | "four-way" | "custom";
  readonly connectedSegmentIds: readonly string[];
  /**
   * Compatibility value used by older diagnostics. It is now the orthogonal
   * half-extent rather than the radius of a circular junction.
   */
  readonly radius: number;
  readonly asphalt: readonly WorldPosition[];
  /** Straight or short-bevel curb pieces around the junction perimeter. */
  readonly curbSegments: readonly (readonly [WorldPosition, WorldPosition])[];
  /** Compatibility alias. No generated ordinary junction contains radial arcs. */
  readonly curbArcs: readonly (readonly WorldPosition[])[];
  /** Rectilinear corner sidewalk patches outside the asphalt-owned junction. */
  readonly sidewalkCorners: readonly (readonly WorldPosition[])[];
  readonly roadMouths: readonly RoadMouthPlan[];
  readonly cornerTreatment: "orthogonal";
  readonly halfExtent: number;
}

export interface RoadGraphPlan {
  readonly surfaces: readonly RoadSurfacePlan[];
  readonly junctions: readonly RoadJunctionPlan[];
}

export interface RoadProjection {
  readonly segmentId: string;
  readonly position: WorldPosition;
  readonly distance: number;
  readonly fraction: number;
  readonly tangent: GroundPoint;
  readonly roadWidth: number;
}

const EPS = 1e-7;
const point = (x: number, z: number, y = 0): WorldPosition => ({ x, y, z });
const add = (a: WorldPosition, x: number, z: number): WorldPosition =>
  point(a.x + x, a.z + z, a.y);
const distance = (a: WorldPosition, b: WorldPosition): number =>
  Math.hypot(a.x - b.x, a.z - b.z);

export function projectToRoad(
  roads: RoadNetworkSpec,
  position: WorldPosition,
  segmentId?: string,
): RoadProjection | null {
  const nodes = new Map(roads.nodes.map((node) => [node.id, node.position]));
  let closest: RoadProjection | null = null;
  for (const segment of roads.segments) {
    if (segmentId && segment.id !== segmentId) continue;
    const a = nodes.get(segment.startNodeId);
    const b = nodes.get(segment.endNodeId);
    if (!a || !b) {
      throw new Error("Road " + segment.id + " references an unknown node");
    }
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length2 = dx * dx + dz * dz;
    if (length2 < EPS) {
      throw new Error("Road " + segment.id + " has zero horizontal length");
    }
    const fraction = Math.max(
      0,
      Math.min(
        1,
        ((position.x - a.x) * dx + (position.z - a.z) * dz) / length2,
      ),
    );
    const projected = point(
      a.x + dx * fraction,
      a.z + dz * fraction,
      a.y + (b.y - a.y) * fraction,
    );
    const candidate: RoadProjection = {
      segmentId: segment.id,
      position: projected,
      distance: distance(position, projected),
      fraction,
      tangent: { x: dx / Math.sqrt(length2), z: dz / Math.sqrt(length2) },
      roadWidth: segment.width,
    };
    if (
      !closest ||
      candidate.distance < closest.distance - EPS ||
      (Math.abs(candidate.distance - closest.distance) <= EPS &&
        candidate.segmentId < closest.segmentId)
    ) {
      closest = candidate;
    }
  }
  return closest;
}

interface Incident {
  readonly segment: RoadSegmentSpec;
  readonly dx: number;
  readonly dz: number;
  readonly length: number;
}

function edgeForDirection(dx: number, dz: number): JunctionEdge {
  if (Math.abs(dx) >= Math.abs(dz)) {
    return dx >= 0 ? "positive-x" : "negative-x";
  }
  return dz >= 0 ? "positive-z" : "negative-z";
}

function segmentPieces(
  start: number,
  end: number,
  openingHalf: number | null,
): readonly [number, number][] {
  if (openingHalf === null) return [[start, end]];
  const gapStart = Math.max(start, -openingHalf);
  const gapEnd = Math.min(end, openingHalf);
  const pieces: [number, number][] = [];
  if (gapStart > start + EPS) pieces.push([start, gapStart]);
  if (end > gapEnd + EPS) pieces.push([gapEnd, end]);
  return pieces;
}

function junctionPlan(
  nodeId: string,
  node: WorldPosition,
  entries: readonly Incident[],
  kind: RoadJunctionPlan["kind"],
): RoadJunctionPlan {
  const maxRoadWidth = Math.max(...entries.map((entry) => entry.segment.width));
  const maxSidewalk = Math.max(
    ...entries.map((entry) => entry.segment.sidewalkWidth),
  );

  // Matches the authored First Light visual relationship: 8 m carriageway
  // produces an 11.6 m junction ownership box. The sidewalk contribution is
  // bounded so larger future sidewalks do not create oversized junction pads.
  const cornerMargin = Math.min(1.8, maxSidewalk * 0.58);
  const halfExtent = maxRoadWidth / 2 + cornerMargin;

  const asphalt = [
    point(node.x - halfExtent, node.z - halfExtent, node.y),
    point(node.x + halfExtent, node.z - halfExtent, node.y),
    point(node.x + halfExtent, node.z + halfExtent, node.y),
    point(node.x - halfExtent, node.z + halfExtent, node.y),
  ] as const;

  const mouthByEdge = new Map<JunctionEdge, Incident>();
  for (const entry of entries) {
    const edge = edgeForDirection(entry.dx, entry.dz);
    const existing = mouthByEdge.get(edge);
    if (!existing || entry.segment.width > existing.segment.width) {
      mouthByEdge.set(edge, entry);
    }
  }

  const roadMouths: RoadMouthPlan[] = [];
  for (const [edge, entry] of mouthByEdge) {
    const center =
      edge === "negative-x"
        ? point(node.x - halfExtent, node.z, node.y)
        : edge === "positive-x"
          ? point(node.x + halfExtent, node.z, node.y)
          : edge === "negative-z"
            ? point(node.x, node.z - halfExtent, node.y)
            : point(node.x, node.z + halfExtent, node.y);
    roadMouths.push({
      segmentId: entry.segment.id,
      edge,
      width: entry.segment.width,
      center,
    });
  }

  const curbSegments: [WorldPosition, WorldPosition][] = [];
  const addHorizontal = (
    z: number,
    edge: JunctionEdge,
  ) => {
    const opening = mouthByEdge.get(edge);
    const pieces = segmentPieces(
      -halfExtent,
      halfExtent,
      opening ? opening.segment.width / 2 : null,
    );
    for (const [a, b] of pieces) {
      curbSegments.push([
        point(node.x + a, z, node.y),
        point(node.x + b, z, node.y),
      ]);
    }
  };
  const addVertical = (
    x: number,
    edge: JunctionEdge,
  ) => {
    const opening = mouthByEdge.get(edge);
    const pieces = segmentPieces(
      -halfExtent,
      halfExtent,
      opening ? opening.segment.width / 2 : null,
    );
    for (const [a, b] of pieces) {
      curbSegments.push([
        point(x, node.z + a, node.y),
        point(x, node.z + b, node.y),
      ]);
    }
  };

  addHorizontal(node.z - halfExtent, "negative-z");
  addHorizontal(node.z + halfExtent, "positive-z");
  addVertical(node.x - halfExtent, "negative-x");
  addVertical(node.x + halfExtent, "positive-x");

  const sidewalk = Math.max(0.6, maxSidewalk);
  const sidewalkCorners: WorldPosition[][] = [
    [
      point(node.x - halfExtent - sidewalk, node.z - halfExtent - sidewalk),
      point(node.x - halfExtent, node.z - halfExtent - sidewalk),
      point(node.x - halfExtent, node.z - halfExtent),
      point(node.x - halfExtent - sidewalk, node.z - halfExtent),
    ],
    [
      point(node.x + halfExtent, node.z - halfExtent - sidewalk),
      point(node.x + halfExtent + sidewalk, node.z - halfExtent - sidewalk),
      point(node.x + halfExtent + sidewalk, node.z - halfExtent),
      point(node.x + halfExtent, node.z - halfExtent),
    ],
    [
      point(node.x + halfExtent, node.z + halfExtent),
      point(node.x + halfExtent + sidewalk, node.z + halfExtent),
      point(node.x + halfExtent + sidewalk, node.z + halfExtent + sidewalk),
      point(node.x + halfExtent, node.z + halfExtent + sidewalk),
    ],
    [
      point(node.x - halfExtent - sidewalk, node.z + halfExtent),
      point(node.x - halfExtent, node.z + halfExtent),
      point(node.x - halfExtent, node.z + halfExtent + sidewalk),
      point(node.x - halfExtent - sidewalk, node.z + halfExtent + sidewalk),
    ],
  ];

  return {
    nodeId,
    kind,
    connectedSegmentIds: entries
      .map((entry) => entry.segment.id)
      .sort(),
    radius: halfExtent,
    asphalt,
    curbSegments,
    curbArcs: curbSegments.map(([a, b]) => [a, b]),
    sidewalkCorners,
    roadMouths: roadMouths.sort((a, b) =>
      a.segmentId.localeCompare(b.segmentId),
    ),
    cornerTreatment: "orthogonal",
    halfExtent,
  };
}

export function planRoadGraph(
  roads: RoadNetworkSpec,
  _arcResolution = 64,
): RoadGraphPlan {
  const nodes = new Map(roads.nodes.map((node) => [node.id, node.position]));
  if (nodes.size !== roads.nodes.length) {
    throw new Error("Duplicate road node ID");
  }

  const incident = new Map<string, Incident[]>();
  for (const node of roads.nodes) incident.set(node.id, []);
  const seenSegments = new Set<string>();

  for (const segment of roads.segments) {
    if (seenSegments.has(segment.id)) {
      throw new Error("Duplicate road segment ID: " + segment.id);
    }
    seenSegments.add(segment.id);

    const a = nodes.get(segment.startNodeId);
    const b = nodes.get(segment.endNodeId);
    if (!a || !b || segment.startNodeId === segment.endNodeId) {
      throw new Error("Invalid road endpoints: " + segment.id);
    }
    const length = distance(a, b);
    if (
      length < EPS ||
      !Number.isFinite(segment.width) ||
      segment.width <= 0 ||
      !Number.isFinite(segment.sidewalkWidth) ||
      segment.sidewalkWidth < 0
    ) {
      throw new Error("Invalid road dimensions: " + segment.id);
    }

    const dx = (b.x - a.x) / length;
    const dz = (b.z - a.z) / length;
    incident.get(segment.startNodeId)!.push({
      segment,
      dx,
      dz,
      length,
    });
    incident.get(segment.endNodeId)!.push({
      segment,
      dx: -dx,
      dz: -dz,
      length,
    });
  }

  const declared = new Map(roads.intersections.map((item) => [item.nodeId, item]));
  const junctions: RoadJunctionPlan[] = [];
  const junctionByNode = new Map<string, RoadJunctionPlan>();

  for (const [nodeId, entries] of incident) {
    if (entries.length < 2) continue;
    const node = nodes.get(nodeId)!;
    const declaredKind = declared.get(nodeId);
    const kind =
      declaredKind?.kind ??
      (entries.length === 2
        ? "continuation"
        : entries.length === 3
          ? "t"
          : entries.length === 4
            ? "four-way"
            : "custom");
    const planned = junctionPlan(nodeId, node, entries, kind);
    junctions.push(planned);
    junctionByNode.set(nodeId, planned);
  }

  const surfaces: RoadSurfacePlan[] = roads.segments.map((segment) => {
    const a = nodes.get(segment.startNodeId)!;
    const b = nodes.get(segment.endNodeId)!;
    const length = distance(a, b);
    const dx = (b.x - a.x) / length;
    const dz = (b.z - a.z) / length;
    const half = segment.width / 2;
    const sidewalk = segment.sidewalkWidth;

    const supportDistance = (
      junction: RoadJunctionPlan | undefined,
      directionX: number,
      directionZ: number,
    ) => {
      if (!junction) return 0;
      // Axis-aligned First Light roads resolve exactly to halfExtent. For a
      // future diagonal road, this is the support distance of the square
      // junction ownership region in that direction.
      return (
        Math.abs(directionX) * junction.halfExtent +
        Math.abs(directionZ) * junction.halfExtent
      );
    };

    const startCut = supportDistance(
      junctionByNode.get(segment.startNodeId),
      dx,
      dz,
    );
    const endCut = supportDistance(
      junctionByNode.get(segment.endNodeId),
      -dx,
      -dz,
    );

    if (startCut + endCut >= length - EPS) {
      throw new Error(
        "Road " + segment.id + " too short for adjacent junctions",
      );
    }

    const start = add(a, dx * startCut, dz * startCut);
    const end = add(b, -dx * endCut, -dz * endCut);
    const nx = -dz;
    const nz = dx;
    const left = (p: WorldPosition, offset: number) =>
      add(p, nx * offset, nz * offset);
    const right = (p: WorldPosition, offset: number) =>
      add(p, -nx * offset, -nz * offset);

    const leftStart = left(start, half);
    const leftEnd = left(end, half);
    const rightStart = right(start, half);
    const rightEnd = right(end, half);

    return {
      segmentId: segment.id,
      roadClass: segment.roadClass,
      startCut,
      endCut,
      asphalt: [leftStart, leftEnd, rightEnd, rightStart],
      leftSidewalk: [
        leftStart,
        leftEnd,
        left(end, half + sidewalk),
        left(start, half + sidewalk),
      ],
      rightSidewalk: [
        rightStart,
        rightEnd,
        right(end, half + sidewalk),
        right(start, half + sidewalk),
      ],
      leftCurb: [leftStart, leftEnd],
      rightCurb: [rightStart, rightEnd],
    };
  });

  return {
    surfaces,
    junctions: junctions.sort((a, b) => a.nodeId.localeCompare(b.nodeId)),
  };
}
