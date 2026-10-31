export interface RadioStation { id: string; name: string; streamUrl: string; country: "ZA"; genre: string; }
/** Only streams explicitly validated for embedding may be admitted here. */
export const RADIO_STATIONS: readonly RadioStation[] = [];
