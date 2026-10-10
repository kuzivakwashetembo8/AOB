/**
 * Deterministic, low-cost visual-only massing for stationary First Light cars.
 * The Rapier collider is intentionally owned by generated-first-light-world.ts;
 * these surfaces must stay inside the prior painted-body collision envelope.
 */
export interface ProxyGeometry {
  readonly positions: readonly number[];
  readonly indices: readonly number[];
}

type Point = readonly [number, number, number];
type Face = readonly [Point, Point, Point, Point];

function geometry(faces: readonly { quad: Face; outward: Point }[]): ProxyGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  for (const { quad, outward } of faces) {
    let vertices = [...quad];
    const [a, b, c] = vertices;
    const ab = [b![0] - a![0], b![1] - a![1], b![2] - a![2]];
    const ac = [c![0] - a![0], c![1] - a![1], c![2] - a![2]];
    const cross: Point = [
      ab[1]! * ac[2]! - ab[2]! * ac[1]!,
      ab[2]! * ac[0]! - ab[0]! * ac[2]!,
      ab[0]! * ac[1]! - ab[1]! * ac[0]!,
    ];
    const dot = cross[0] * outward[0] + cross[1] * outward[1] + cross[2] * outward[2];
    if (dot < 0) vertices = [quad[0], quad[3], quad[2], quad[1]];
    const start = positions.length / 3;
    for (const point of vertices) positions.push(...point);
    indices.push(start, start + 1, start + 2, start, start + 2, start + 3);
  }
  return { positions, indices };
}

/**
 * Stations describe the full body contour in local Z: hood, angled
 * windshield, passenger roof, angled rear glass, then trunk. One draw
 * mesh owns the painted hull and one mesh all six glazed quadrilaterals.
 */
export function planVehicleProxyGeometry(): {
  readonly body: ProxyGeometry;
  readonly glass: ProxyGeometry;
} {
  const stations: readonly { z: number; topY: number; topHalfWidth: number }[] = [
    { z: -2.0, topY: 0.84, topHalfWidth: 0.80 },
    { z: -1.10, topY: 0.87, topHalfWidth: 0.78 },
    { z: -0.68, topY: 1.47, topHalfWidth: 0.65 },
    { z: 0.55, topY: 1.47, topHalfWidth: 0.65 },
    { z: 1.05, topY: 0.87, topHalfWidth: 0.78 },
    { z: 2.0, topY: 0.84, topHalfWidth: 0.80 },
  ];
  const corners = (s: typeof stations[number]): readonly [Point, Point, Point, Point] => [
    [-0.85, 0.35, s.z],
    [0.85, 0.35, s.z],
    [s.topHalfWidth, s.topY, s.z],
    [-s.topHalfWidth, s.topY, s.z],
  ];
  const rings = stations.map(corners);
  const bodyFaces: { quad: Face; outward: Point }[] = [];
  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i]!, b = rings[i + 1]!;
    const normals: readonly Point[] = [[0, -1, 0], [1, 0, 0], [0, 1, 0], [-1, 0, 0]];
    for (let side = 0; side < 4; side++) {
      const n = (side + 1) % 4;
      bodyFaces.push({ quad: [a[side]!, b[side]!, b[n]!, a[n]!], outward: normals[side]! });
    }
  }
  bodyFaces.push({ quad: rings[0]!, outward: [0, 0, -1] });
  bodyFaces.push({ quad: rings[rings.length - 1]!, outward: [0, 0, 1] });

  // Draw near-coplanar windows slightly outside their body panels, so
  // they stay visible without requiring more vehicle meshes/materials.
  const windshield = (near: number, far: number): Face => {
    const a = stations[near]!, b = stations[far]!;
    return [
      [-a.topHalfWidth * 0.89, a.topY + 0.014, a.z + (near === 1 ? 0.06 : -0.06)],
      [a.topHalfWidth * 0.89, a.topY + 0.014, a.z + (near === 1 ? 0.06 : -0.06)],
      [b.topHalfWidth * 0.89, b.topY + 0.014, b.z + (near === 1 ? -0.06 : 0.06)],
      [-b.topHalfWidth * 0.89, b.topY + 0.014, b.z + (near === 1 ? -0.06 : 0.06)],
    ];
  };
  const glassFaces: { quad: Face; outward: Point }[] = [
    { quad: windshield(1, 2), outward: [0, 1, -0.6] },
    { quad: windshield(3, 4), outward: [0, 1, 0.6] },
  ];
  for (const side of [-1, 1] as const) {
    for (const [z0, z1] of [[-0.60, -0.10], [0.02, 0.45]] as const) {
      glassFaces.push({
        quad: [
          [side * 0.733, 0.97, z0],
          [side * 0.733, 0.97, z1],
          [side * 0.663, 1.40, z1],
          [side * 0.663, 1.40, z0],
        ],
        outward: [side, 0, 0],
      });
    }
  }
  return { body: geometry(bodyFaces), glass: geometry(glassFaces) };
}
