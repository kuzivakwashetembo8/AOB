/** GTD-RND-MAT-004: canonical brick asset identities. Catalogue entries are
 * not automatic building assignments. Existing live BRK-01 references remain.
 */
export const BRICK_FAMILY_ID = "WALL-01" as const;
export const BRICK_SURFACE_IDS = ["BRK-01","BRK-02","BRK-03","BRK-04","BRK-05","BRK-06","BRK-07","BRK-08","BRK-09","BRK-10"] as const;
export type BrickSurfaceId = typeof BRICK_SURFACE_IDS[number];

export interface BrickSurfaceAsset {
  readonly id: BrickSurfaceId;
  readonly familyId: typeof BRICK_FAMILY_ID;
  readonly label: string;
  readonly path: string;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly sizeBytes: number;
  readonly gitBlobSha: string;
  readonly status: "accepted" | "asset-committed";
}

export const BRICK_SURFACES = {
  "BRK-01": {"id":"BRK-01","familyId":"WALL-01","label":"Standard Warm-Red Running-Bond Brick","path":"/assets/surfaces/brick/brk-01-warm-red.webp","widthPx":1774,"heightPx":871,"sizeBytes":639570,"gitBlobSha":"7a6d9bfd8730f852c55d439ffe01a622bba5d1dc","status":"accepted"},
  "BRK-02": {"id":"BRK-02","familyId":"WALL-01","label":"Dark Red-Brown Weathered Brick","path":"/assets/surfaces/brick/brk-02-dark-red-brown.webp","widthPx":1790,"heightPx":879,"sizeBytes":307430,"gitBlobSha":"862a19854837083647e26b488116f9b9f1c22432","status":"asset-committed"},
  "BRK-03": {"id":"BRK-03","familyId":"WALL-01","label":"Orange Multi-Tone Stock Brick","path":"/assets/surfaces/brick/brk-03-orange-multitone.webp","widthPx":1790,"heightPx":879,"sizeBytes":300804,"gitBlobSha":"c605a6f745ffb34c08f6f9f65a7cbfc35280c0df","status":"asset-committed"},
  "BRK-04": {"id":"BRK-04","familyId":"WALL-01","label":"Buff / Yellow Stock Brick","path":"/assets/surfaces/brick/brk-04-buff-yellow.webp","widthPx":1790,"heightPx":879,"sizeBytes":283098,"gitBlobSha":"7ff0159018648f2b70c6670b99d6c5a8dc4d7ddd","status":"asset-committed"},
  "BRK-05": {"id":"BRK-05","familyId":"WALL-01","label":"Salmon / Pink Handmade Brick","path":"/assets/surfaces/brick/brk-05-salmon-pink.webp","widthPx":1790,"heightPx":879,"sizeBytes":287794,"gitBlobSha":"b2e8304404e5821b3afe1fd9fe9b6d6d62459593","status":"asset-committed"},
  "BRK-06": {"id":"BRK-06","familyId":"WALL-01","label":"Dark Brown Clinker Brick","path":"/assets/surfaces/brick/brk-06-dark-clinker.webp","widthPx":1790,"heightPx":879,"sizeBytes":263788,"gitBlobSha":"99ecd9c414d0af2a6d969d3b191570e87a9891de","status":"asset-committed"},
  "BRK-07": {"id":"BRK-07","familyId":"WALL-01","label":"Charcoal / Black Engineering Brick","path":"/assets/surfaces/brick/brk-07-charcoal-black.webp","widthPx":1790,"heightPx":879,"sizeBytes":217170,"gitBlobSha":"970f2069e52a3ba5afd840cd727bef5cd7969ce4","status":"asset-committed"},
  "BRK-08": {"id":"BRK-08","familyId":"WALL-01","label":"Pale Cream Sand-Faced Brick","path":"/assets/surfaces/brick/brk-08-pale-cream.webp","widthPx":1790,"heightPx":879,"sizeBytes":321840,"gitBlobSha":"b415e91e6b9f19d663137ac1587ea18490277347","status":"asset-committed"},
  "BRK-09": {"id":"BRK-09","familyId":"WALL-01","label":"Reclaimed Aged Mixed Brick","path":"/assets/surfaces/brick/brk-09-reclaimed-mixed.webp","widthPx":1790,"heightPx":879,"sizeBytes":345962,"gitBlobSha":"4451c50235c334e163001823d5e480e61cfda810","status":"asset-committed"},
  "BRK-10": {"id":"BRK-10","familyId":"WALL-01","label":"Painted / Whitewashed Brick","path":"/assets/surfaces/brick/brk-10-whitewashed.webp","widthPx":1790,"heightPx":879,"sizeBytes":352440,"gitBlobSha":"fa540a5a5916d8ce03c2355645e4f81d53fa85c4","status":"asset-committed"},
} as const satisfies Record<BrickSurfaceId, BrickSurfaceAsset>;

export function brickSurfaceById(id: BrickSurfaceId): BrickSurfaceAsset {
  return BRICK_SURFACES[id];
}

export function brickTileMetres(id: BrickSurfaceId, tileWidthMetres: number): {
  width: number; height: number;
} {
  if (!(Number.isFinite(tileWidthMetres) && tileWidthMetres > 0)) {
    throw new RangeError("Brick tile width must be finite and greater than zero");
  }
  const surface = BRICK_SURFACES[id];
  return { width: tileWidthMetres,
    height: tileWidthMetres * surface.heightPx / surface.widthPx };
}
