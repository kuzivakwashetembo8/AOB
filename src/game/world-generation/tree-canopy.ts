import { featureRandom } from "./seeded-variation";
import type { StreetContextItem } from "./street-context";

/**
 * Low-cost canopy geometry for the generated First Light street trees.
 *
 * The accepted single-piece trunk and its collider are owned elsewhere.
 * Canopy variation is a visual-only, feature-keyed plan: fixed 30 foliage
 * cards, one existing material and texture, no new alpha draw calls.
 */
export interface TreeCanopyCard {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly yaw: number;
  readonly pitch: number;
  readonly width: number;
  readonly height: number;
}

export interface TreeCanopyPlan {
  readonly cards: readonly TreeCanopyCard[];
  /** Conservative world-space lateral envelope, for diagnostics only. */
  readonly radius: number;
  /** Conservative world-space vertical envelope, for diagnostics only. */
  readonly depth: number;
  readonly trunkHeight: number;
  readonly trunkDiameter: number;
}

const CLUSTERS: readonly (readonly [number, number, number])[] = [
  [0, 5.45, 0],
  [-1.75, 5.15, 0.05],
  [1.8, 5.12, 0.1],
  [-1.15, 5.85, -0.55],
  [1.2, 5.82, -0.48],
  [-0.75, 5.35, 1.15],
  [0.8, 5.28, 1.12],
  [0, 6.15, 0.12],
  [-2.05, 5.0, -0.85],
  [2.05, 5.0, -0.75],
];

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value));

export function planTreeCanopy(
  item: Pick<StreetContextItem, "scale" | "canopyScale" | "seed">,
  generatorVersion: number,
): TreeCanopyPlan {
  if (!Number.isFinite(item.scale) || item.scale <= 0) {
    throw new Error("Tree scale must be finite and positive");
  }
  if (
    item.canopyScale !== undefined &&
    (!Number.isFinite(item.canopyScale) || item.canopyScale <= 0)
  ) {
    throw new Error("Canopy scale must be finite and positive");
  }

  // The authored First Light range is 0.94–1.10. Clamp extreme future
  // values to prevent foliage spilling into neighboring facades.
  const size = clamp((item.scale - 0.9) / 0.22, 0, 1);
  const canopy = clamp(item.canopyScale ?? 1.1, 0.9, 1.32);
  const spread = 0.9 + 0.18 * size + 0.18 * (canopy - 1.08);
  const cardWidth = 0.88 + 0.24 * size + 0.22 * (canopy - 1.08);
  const cardHeight = 0.88 + 0.25 * size + 0.12 * (canopy - 1.08);
  const verticalSpread = 0.9 + 0.16 * size + 0.12 * (canopy - 1.08);

  const variation = (cluster: number, plane: number, key: string) =>
    featureRandom(
      item.seed,
      generatorVersion,
      "tree-canopy:" + cluster + ":" + plane + ":" + key,
    );

  const cards: TreeCanopyCard[] = [];
  CLUSTERS.forEach(([baseX, baseY, baseZ], cluster) => {
    for (let plane = 0; plane < 3; plane += 1) {
      cards.push({
        x: baseX * spread + (variation(cluster, plane, "x") - 0.5) * 0.18,
        y:
          5.45 +
          (baseY - 5.45) * verticalSpread +
          (variation(cluster, plane, "y") - 0.5) * 0.16,
        z: baseZ * spread + (variation(cluster, plane, "z") - 0.5) * 0.18,
        yaw:
          (plane * Math.PI) / 3 +
          (variation(cluster, plane, "yaw") - 0.5) * 0.12,
        pitch:
          (plane === 1 ? 0.08 : -0.04) +
          (variation(cluster, plane, "pitch") - 0.5) * 0.06,
        width: 3.45 * cardWidth,
        height: 1.85 * cardHeight,
      });
    }
  });

  // Bounds include maximum per-card offsets and slight yaw variation.
  const radius = item.scale * (2.05 * spread + 1.725 * cardWidth + 0.18);
  const depth =
    item.scale * (1.15 * verticalSpread + 1.85 * cardHeight + 0.16);
  return {
    cards,
    radius,
    depth,
    trunkHeight: 5.05 * item.scale,
    trunkDiameter: 0.7 * item.scale,
  };
}
