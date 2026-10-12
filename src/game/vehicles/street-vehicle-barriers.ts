/**
 * Generic, finite, two-dimensional SAT test for authored vehicle no-step
 * obstacles such as raised garage portal sills. This NEVER generates
 * invisible geometry: the barrier bounds come from real Rapier static boxes.
 *
 * Ground-plane footprint is intentional: a kinematic chassis momentarily
 * climbing a curb can lift above a low portal collider, but must not use
 * that temporary climb to bypass a known no-drive threshold.
 */
export interface GroundFootprint {
  readonly x: number; readonly z: number;
  readonly halfX: number; readonly halfZ: number;
  readonly yaw: number;
}
const dot = (a: readonly [number, number], b: readonly [number, number]) =>
  a[0] * b[0] + a[1] * b[1];
const axes = (yaw: number) => {
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  return [
    [cos, -sin] as const,
    [sin, cos] as const,
  ] as const;
};
export function vehicleFootprintsOverlap(a: GroundFootprint, b: GroundFootprint): boolean {
  if (![a.x,a.z,a.halfX,a.halfZ,a.yaw,b.x,b.z,b.halfX,b.halfZ,b.yaw]
    .every(Number.isFinite) || Math.min(a.halfX,a.halfZ,b.halfX,b.halfZ) <= 0) {
    throw new Error("VM-G01: finite positive car and portal footprints required");
  }
  const aAxes = axes(a.yaw), bAxes = axes(b.yaw);
  const delta: readonly [number, number] = [b.x - a.x, b.z - a.z];
  for (const axis of [...aAxes, ...bAxes]) {
    const aRadius = a.halfX * Math.abs(dot(axis, aAxes[0])) +
      a.halfZ * Math.abs(dot(axis, aAxes[1]));
    const bRadius = b.halfX * Math.abs(dot(axis, bAxes[0])) +
      b.halfZ * Math.abs(dot(axis, bAxes[1]));
    if (Math.abs(dot(delta, axis)) > aRadius + bRadius) return false;
  }
  return true;
}
