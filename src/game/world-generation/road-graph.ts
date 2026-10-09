import type { GroundPoint, RoadNetworkSpec, RoadSegmentSpec, WorldPosition } from "./schema";

/** Geometry plans are pure data. Rendering and collision adapters may consume them later. */
export interface RoadSurfacePlan {
  readonly segmentId: string;
  readonly roadClass: RoadSegmentSpec["roadClass"];
  readonly asphalt: readonly WorldPosition[];
  readonly leftSidewalk: readonly WorldPosition[];
  readonly rightSidewalk: readonly WorldPosition[];
  /** Curbs are only the longitudinal boundaries, never a cap across an intersection. */
  readonly leftCurb: readonly WorldPosition[];
  readonly rightCurb: readonly WorldPosition[];
  readonly startCut: number;
  readonly endCut: number;
}
export interface RoadJunctionPlan {
  readonly nodeId: string;
  readonly kind: "continuation" | "t" | "four-way" | "custom";
  readonly connectedSegmentIds: readonly string[];
  readonly radius: number;
  readonly asphalt: readonly WorldPosition[];
  /** Curb arcs exclude every connected road mouth. */
  readonly curbArcs: readonly (readonly WorldPosition[])[];
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
const add = (a: WorldPosition, x: number, z: number): WorldPosition => point(a.x + x, a.z + z, a.y);
const distance = (a: WorldPosition, b: WorldPosition): number => Math.hypot(a.x - b.x, a.z - b.z);
const TWO_PI = 2 * Math.PI;
const normalize = (a: number): number => (a % TWO_PI + TWO_PI) % TWO_PI;

export function projectToRoad(
  roads: RoadNetworkSpec, position: WorldPosition, segmentId?: string,
): RoadProjection | null {
  const nodes = new Map(roads.nodes.map((node) => [node.id, node.position]));
  let closest: RoadProjection | null = null;
  for (const segment of roads.segments) {
    if (segmentId && segment.id !== segmentId) continue;
    const a = nodes.get(segment.startNodeId);
    const b = nodes.get(segment.endNodeId);
    if (!a || !b) throw new Error("Road " + segment.id + " references an unknown node");
    const dx = b.x - a.x, dz = b.z - a.z;
    const length2 = dx * dx + dz * dz;
    if (length2 < EPS) throw new Error("Road " + segment.id + " has zero horizontal length");
    const fraction = Math.max(0, Math.min(1,
      ((position.x - a.x) * dx + (position.z - a.z) * dz) / length2));
    const projected = point(a.x + dx * fraction, a.z + dz * fraction, a.y + (b.y - a.y) * fraction);
    const candidate: RoadProjection = {
      segmentId: segment.id, position: projected,
      distance: distance(position, projected), fraction,
      tangent: { x: dx / Math.sqrt(length2), z: dz / Math.sqrt(length2) },
      roadWidth: segment.width,
    };
    if (!closest || candidate.distance < closest.distance - EPS ||
        (Math.abs(candidate.distance - closest.distance) <= EPS && candidate.segmentId < closest.segmentId)) {
      closest = candidate;
    }
  }
  return closest;
}

interface Incident { readonly segment: RoadSegmentSpec; readonly outwardAngle: number; readonly length: number; }
export function planRoadGraph(roads: RoadNetworkSpec, arcResolution = 64): RoadGraphPlan {
  if (!Number.isSafeInteger(arcResolution) || arcResolution < 16) {
    throw new Error("Road junction arcResolution must be an integer >= 16");
  }
  const nodes = new Map(roads.nodes.map((n) => [n.id, n.position]));
  if (nodes.size !== roads.nodes.length) throw new Error("Duplicate road node ID");
  const incident = new Map<string, Incident[]>();
  for (const n of roads.nodes) incident.set(n.id, []);
  const seenSegments = new Set<string>();
  for (const s of roads.segments) {
    if (seenSegments.has(s.id)) throw new Error("Duplicate road segment ID: " + s.id);
    seenSegments.add(s.id);
    const a = nodes.get(s.startNodeId), b = nodes.get(s.endNodeId);
    if (!a || !b || s.startNodeId === s.endNodeId) throw new Error("Invalid road endpoints: " + s.id);
    const length = distance(a, b);
    if (length < EPS || !Number.isFinite(s.width) || s.width <= 0 ||
        !Number.isFinite(s.sidewalkWidth) || s.sidewalkWidth < 0) {
      throw new Error("Invalid road dimensions: " + s.id);
    }
    incident.get(s.startNodeId)!.push({ segment: s, outwardAngle: Math.atan2(b.z - a.z, b.x - a.x), length });
    incident.get(s.endNodeId)!.push({ segment: s, outwardAngle: Math.atan2(a.z - b.z, a.x - b.x), length });
  }
  const junctionRadius = new Map<string, number>();
  for (const [nodeId, entries] of incident) {
    if (entries.length < 2) continue;
    const radius = Math.max(...entries.map((entry) => entry.segment.width)) * 0.8;
    junctionRadius.set(nodeId, radius);
  }
  const junctions: RoadJunctionPlan[] = [];
  const declared = new Map(roads.intersections.map((i) => [i.nodeId, i]));
  for (const [nodeId, radius] of junctionRadius) {
    const entries = incident.get(nodeId)!;
    const node = nodes.get(nodeId)!;
    const declaredKind = declared.get(nodeId);
    const kind = declaredKind?.kind ?? (entries.length === 2 ? "continuation" :
      entries.length === 3 ? "t" : entries.length === 4 ? "four-way" : "custom");
    const openings = entries.map(({ segment, outwardAngle }) => {
      const halfAngle = Math.asin(Math.min(1, segment.width / (2 * radius)));
      return { from: normalize(outwardAngle - halfAngle), to: normalize(outwardAngle + halfAngle) };
    });
    const isRoadMouth = (angle: number) => openings.some(({ from, to }) =>
      from <= to ? angle >= from - EPS && angle <= to + EPS : angle >= from - EPS || angle <= to + EPS);
    const curbArcs: WorldPosition[][] = [];
    let current: WorldPosition[] = [];
    for (let i = 0; i <= arcResolution; i++) {
      const angle = TWO_PI * i / arcResolution;
      const p = add(node, radius * Math.cos(angle), radius * Math.sin(angle));
      if (i < arcResolution && !isRoadMouth(angle + Math.PI / arcResolution)) {
        if (!current.length) current.push(p);
        current.push(add(node, radius * Math.cos(angle + TWO_PI / arcResolution),
          radius * Math.sin(angle + TWO_PI / arcResolution)));
      } else if (current.length) {
        curbArcs.push(current);
        current = [];
      }
    }
    if (current.length) curbArcs.push(current);
    junctions.push({
      nodeId, kind, connectedSegmentIds: entries.map((entry) => entry.segment.id).sort(),
      radius,
      asphalt: Array.from({ length: arcResolution }, (_, i) =>
        add(node, radius * Math.cos(TWO_PI * i / arcResolution),
          radius * Math.sin(TWO_PI * i / arcResolution))),
      curbArcs,
    });
  }
  const surfaces: RoadSurfacePlan[] = roads.segments.map((segment) => {
    const a = nodes.get(segment.startNodeId)!, b = nodes.get(segment.endNodeId)!;
    const length = distance(a, b);
    const dx = (b.x - a.x) / length, dz = (b.z - a.z) / length;
    const half = segment.width / 2, sidewalk = segment.sidewalkWidth;
    const radiusStart = junctionRadius.get(segment.startNodeId);
    const radiusEnd = junctionRadius.get(segment.endNodeId);
    const cut = (radius: number | undefined) => radius === undefined ? 0 :
      Math.sqrt(Math.max(0, radius * radius - half * half));
    const startCut = cut(radiusStart), endCut = cut(radiusEnd);
    if (startCut + endCut >= length - EPS) {
      throw new Error("Road " + segment.id + " too short for adjacent junctions");
    }
    const start = add(a, dx * startCut, dz * startCut);
    const end = add(b, -dx * endCut, -dz * endCut);
    const nx = -dz, nz = dx;
    const left = (p: WorldPosition, offset: number) => add(p, nx * offset, nz * offset);
    const right = (p: WorldPosition, offset: number) => add(p, -nx * offset, -nz * offset);
    const leftStart = left(start, half), leftEnd = left(end, half);
    const rightStart = right(start, half), rightEnd = right(end, half);
    return {
      segmentId: segment.id, roadClass: segment.roadClass, startCut, endCut,
      asphalt: [leftStart, leftEnd, rightEnd, rightStart],
      leftSidewalk: [leftStart, leftEnd, left(end, half + sidewalk), left(start, half + sidewalk)],
      rightSidewalk: [rightStart, rightEnd, right(end, half + sidewalk), right(start, half + sidewalk)],
      leftCurb: [leftStart, leftEnd], rightCurb: [rightStart, rightEnd],
    };
  });
  return { surfaces, junctions };
}
