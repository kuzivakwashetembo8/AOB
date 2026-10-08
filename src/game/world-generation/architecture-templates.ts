import type { FacadeOpeningSpec, WindowType } from "./schema";

/**
 * Stable IDs describe architectural intent, not unique mesh assets.
 * Step 3 may replace each template's visual representation without changing IDs.
 */
export interface OpeningTemplate {
  readonly id: string;
  readonly kind: FacadeOpeningSpec["kind"];
  readonly frameThickness: number;
  readonly paneInset: number;
  readonly glazing: boolean;
  readonly defaultCutThrough: boolean;
}

export const OPENING_TEMPLATES = {
  "window-decorative": { id: "window-decorative", kind: "window", frameThickness: 0.07, paneInset: 0.04, glazing: true, defaultCutThrough: false },
  "window-recessed": { id: "window-recessed", kind: "window", frameThickness: 0.10, paneInset: 0.09, glazing: true, defaultCutThrough: false },
  "window-physical": { id: "window-physical", kind: "window", frameThickness: 0.12, paneInset: 0.10, glazing: true, defaultCutThrough: true },
  "window-interior": { id: "window-interior", kind: "window", frameThickness: 0.12, paneInset: 0.10, glazing: true, defaultCutThrough: true },
  "door-standard": { id: "door-standard", kind: "door", frameThickness: 0.14, paneInset: 0, glazing: false, defaultCutThrough: true },
  "garage-bay": { id: "garage-bay", kind: "garage", frameThickness: 0.18, paneInset: 0, glazing: false, defaultCutThrough: true },
  "storefront-glazed": { id: "storefront-glazed", kind: "storefront", frameThickness: 0.10, paneInset: 0.07, glazing: true, defaultCutThrough: true },
  "loading-bay": { id: "loading-bay", kind: "loading", frameThickness: 0.18, paneInset: 0, glazing: false, defaultCutThrough: true },
} as const satisfies Record<string, OpeningTemplate>;

export type OpeningTemplateId = keyof typeof OPENING_TEMPLATES;

export function openingTemplateId(kind: FacadeOpeningSpec["kind"], windowType: WindowType): OpeningTemplateId {
  if (kind === "window") {
    switch (windowType) {
      case "decorative": return "window-decorative";
      case "recessed": return "window-recessed";
      case "physical": return "window-physical";
      case "interior-linked": return "window-interior";
      case "none": return "window-decorative";
    }
  }
  switch (kind) {
    case "door": return "door-standard";
    case "garage": return "garage-bay";
    case "storefront": return "storefront-glazed";
    case "loading": return "loading-bay";
    case "window": return "window-decorative";
  }
}

export interface RoofFixtureTemplate {
  readonly id: string;
  readonly footprintWidth: number;
  readonly footprintDepth: number;
  readonly height: number;
}

export const ROOF_FIXTURE_TEMPLATES = {
  "roof-hvac": { id: "roof-hvac", footprintWidth: 1.5, footprintDepth: 1.2, height: 0.7 },
  "roof-vent": { id: "roof-vent", footprintWidth: 0.3, footprintDepth: 0.3, height: 0.6 },
  "roof-access-hut": { id: "roof-access-hut", footprintWidth: 2.2, footprintDepth: 2.2, height: 2.2 },
  "roof-water-tank": { id: "roof-water-tank", footprintWidth: 1.5, footprintDepth: 1.5, height: 1.8 },
  "roof-antenna": { id: "roof-antenna", footprintWidth: 0.12, footprintDepth: 0.12, height: 2.4 },
} as const satisfies Record<string, RoofFixtureTemplate>;
