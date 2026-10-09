export type SkylineBand = "low-rise" | "neighborhood-anchor" | "district-tower" | "central-skyline";
export const skylineBand = (height: number): SkylineBand => height < 16 ? "low-rise" : height < 32 ? "neighborhood-anchor" : height < 70 ? "district-tower" : "central-skyline";
