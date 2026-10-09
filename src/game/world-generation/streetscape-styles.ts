export interface RoadSurfaceStyle {
  readonly id: string;
  readonly baseColor: string;
  readonly roughness: number;
  readonly wearIntensity: number;
  readonly markingContrast: number;
  readonly drainageTone: string;
}

export interface CurbEdgeStyle {
  readonly id: string;
  readonly materialFamily: "concrete" | "timber";
  readonly baseColor: string;
  readonly weathering: number;
  readonly nominalHeight: number;
  readonly nominalWidth: number;
}

export interface StreetscapeStyleFamily {
  readonly id: string;
  readonly road: RoadSurfaceStyle;
  readonly curb: CurbEdgeStyle;
}

/**
 * Preserves the accepted authored First Light visual language as a future
 * district-selectable family. It is intentionally not discarded when the
 * generated First Light runtime uses a different surface treatment.
 */
export const SOUTH_WARD_AUTHORED_STREETSCAPE_STYLE: StreetscapeStyleFamily = {
  id: "south-ward-authored-dark-timber",
  road: {
    id: "south-ward-dark-asphalt",
    baseColor: "#4b4b47",
    roughness: 0.95,
    wearIntensity: 0.42,
    markingContrast: 0.9,
    drainageTone: "#2e3331",
  },
  curb: {
    id: "timber-road-edge",
    materialFamily: "timber",
    baseColor: "#66513b",
    weathering: 0.58,
    nominalHeight: 0.21,
    nominalWidth: 0.2,
  },
};

export const GENERATED_FIRST_LIGHT_STREETSCAPE_STYLE: StreetscapeStyleFamily = {
  id: "generated-first-light-concrete",
  road: {
    id: "generated-first-light-asphalt",
    baseColor: "#41454b",
    roughness: 0.95,
    wearIntensity: 0.34,
    markingContrast: 0.84,
    drainageTone: "#242826",
  },
  curb: {
    id: "generated-first-light-concrete-edge",
    materialFamily: "concrete",
    baseColor: "#7a7366",
    weathering: 0.38,
    nominalHeight: 0.21,
    nominalWidth: 0.2,
  },
};
