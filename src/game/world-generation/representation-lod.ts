import type { PlannedOpening } from "./architecture-plan";
import type { LodProfile, WindowType } from "./schema";

export type RepresentationTier = "near" | "medium" | "far" | "skyline";
export type BatchingMode = "individual" | "thin-instances";
export interface RepresentationPolicy {
  readonly tier: RepresentationTier; readonly useMassProxies: boolean;
  readonly includeFacadeDetails: boolean; readonly includeSmallFixtures: boolean;
  readonly castShadows: boolean;
}
export const REPRESENTATION_POLICIES: Readonly<Record<RepresentationTier, RepresentationPolicy>> = {
  near: { tier: "near", useMassProxies: false, includeFacadeDetails: true, includeSmallFixtures: true, castShadows: true },
  medium: { tier: "medium", useMassProxies: false, includeFacadeDetails: false, includeSmallFixtures: false, castShadows: true },
  far: { tier: "far", useMassProxies: true, includeFacadeDetails: false, includeSmallFixtures: false, castShadows: false },
  skyline: { tier: "skyline", useMassProxies: true, includeFacadeDetails: false, includeSmallFixtures: false, castShadows: false },
};
export const LOD_DISTANCES: Readonly<Record<LodProfile, readonly [number, number, number]>> = {
  hero: [48, 125, 310], standard: [34, 90, 230],
  background: [22, 60, 150], skyline: [30, 80, 180],
};
const TIERS: readonly RepresentationTier[] = ["near", "medium", "far", "skyline"];
/** Distance thresholds use 12% hysteresis to avoid rapid oscillation. */
export function selectRepresentationTier(profile: LodProfile, distance: number, previous?: RepresentationTier): RepresentationTier {
  if (!Number.isFinite(distance) || distance < 0) throw new Error("LOD distance must be finite and nonnegative");
  const thresholds = LOD_DISTANCES[profile];
  const target = distance < thresholds[0] ? 0 : distance < thresholds[1] ? 1 : distance < thresholds[2] ? 2 : 3;
  if (!previous) return TIERS[target]!;
  let index = TIERS.indexOf(previous);
  if (index < 0) return TIERS[target]!;
  while (index < target && distance >= thresholds[index]! * 1.12) index += 1;
  while (index > target && distance < thresholds[index - 1]! * 0.88) index -= 1;
  return TIERS[index]!;
}
/** Visual tier only; cutThrough and physical semantics remain unchanged. */
export function windowRepresentation(opening: PlannedOpening, tier: RepresentationTier): WindowType {
  if (opening.kind !== "window") return "none";
  if (tier === "far" || tier === "skyline") return "decorative";
  if (tier === "medium") return opening.cutThrough ? "recessed" : "decorative";
  switch (opening.templateId) {
    case "window-interior": return "interior-linked";
    case "window-physical": return "physical";
    case "window-recessed": return "recessed";
    default: return "decorative";
  }
}
