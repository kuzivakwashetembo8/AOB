/** MAT-006: user-facing WOOD-01..10 map to WALL-02. Previous MAT-004
 * TIM aliases are ordinal and are not separate textures.
 * Actual pixel dimensions must be audited from WebP headers in a binary-capable
 * environment. No header dimensions are invented for current source assets.
 */
export const WOOD_FAMILY_ID = "WALL-02" as const;
export const WOOD_SURFACE_IDS = ["WOOD-01","WOOD-02","WOOD-03","WOOD-04","WOOD-05","WOOD-06","WOOD-07","WOOD-08","WOOD-09","WOOD-10"] as const;
export type WoodSurfaceId = typeof WOOD_SURFACE_IDS[number];
export interface WoodSurfaceAsset {
  readonly id: WoodSurfaceId;
  readonly familyId: typeof WOOD_FAMILY_ID;
  readonly label: string;
  readonly path: string;
  readonly sourcePathOnMain: string;
  readonly gitBlobSha: string;
  readonly sizeBytes: number;
  readonly pixelWidth: null;
  readonly pixelHeight: null;
  readonly status: "asset-committed";
}

export const WOOD_SURFACES = {
  "WOOD-01": {"id":"WOOD-01","familyId":"WALL-02","label":"Natural Horizontal Planks","path":"/assets/surfaces/wood/wood-01-natural-horizontal.webp","sourcePathOnMain":"public/Wood 1.webp","gitBlobSha":"9005c8590e8ac3936704023f0875cae1274bd42b","sizeBytes":2133064,"pixelWidth":null,"pixelHeight":null,"status":"asset-committed"},
  "WOOD-02": {"id":"WOOD-02","familyId":"WALL-02","label":"Dark Stained Horizontal Siding","path":"/assets/surfaces/wood/wood-02-dark-stained-horizontal.webp","sourcePathOnMain":"public/Wood 2.webp","gitBlobSha":"433cf30ec340413f7952a1b075b574257446c805","sizeBytes":2030940,"pixelWidth":null,"pixelHeight":null,"status":"asset-committed"},
  "WOOD-03": {"id":"WOOD-03","familyId":"WALL-02","label":"Weathered Grey Boards","path":"/assets/surfaces/wood/wood-03-weathered-grey.webp","sourcePathOnMain":"public/Wood 3.webp","gitBlobSha":"4aacef5d08eaba487ee7efc22856ceca91ef6aa4","sizeBytes":2358220,"pixelWidth":null,"pixelHeight":null,"status":"asset-committed"},
  "WOOD-04": {"id":"WOOD-04","familyId":"WALL-02","label":"Rough Rustic Barn Wood","path":"/assets/surfaces/wood/wood-04-rustic-barn.webp","sourcePathOnMain":"public/Wood 4.webp","gitBlobSha":"8e7353ccca6cb4f6694ef4629a86bebb9c41ef8d","sizeBytes":2752364,"pixelWidth":null,"pixelHeight":null,"status":"asset-committed"},
  "WOOD-05": {"id":"WOOD-05","familyId":"WALL-02","label":"Vertical Timber Cladding","path":"/assets/surfaces/wood/wood-05-vertical-timber.webp","sourcePathOnMain":"public/Wood 5.webp","gitBlobSha":"2ed6e12416320bb00eb6f2102e9543f12796eab6","sizeBytes":1973698,"pixelWidth":null,"pixelHeight":null,"status":"asset-committed"},
  "WOOD-06": {"id":"WOOD-06","familyId":"WALL-02","label":"Painted White Wood Siding","path":"/assets/surfaces/wood/wood-06-painted-white.webp","sourcePathOnMain":"public/Wood 6.webp","gitBlobSha":"5c262f412d35b74d6967f9af188d3665607a1ad2","sizeBytes":1830226,"pixelWidth":null,"pixelHeight":null,"status":"asset-committed"},
  "WOOD-07": {"id":"WOOD-07","familyId":"WALL-02","label":"Painted Pastel Wood Siding","path":"/assets/surfaces/wood/wood-07-pastel-painted.webp","sourcePathOnMain":"public/Wood 7.webp","gitBlobSha":"7cf7ed496a83d8f7cb3159040c8612ee012efc65","sizeBytes":2008394,"pixelWidth":null,"pixelHeight":null,"status":"asset-committed"},
  "WOOD-08": {"id":"WOOD-08","familyId":"WALL-02","label":"Reclaimed Mixed-Tone Wood","path":"/assets/surfaces/wood/wood-08-reclaimed-mixed.webp","sourcePathOnMain":"public/Wood 8.webp","gitBlobSha":"20ee6d6936f98972499e0bb16483a69479db7b15","sizeBytes":2591310,"pixelWidth":null,"pixelHeight":null,"status":"asset-committed"},
  "WOOD-09": {"id":"WOOD-09","familyId":"WALL-02","label":"Polished Premium Timber Panels","path":"/assets/surfaces/wood/wood-09-premium-timber.webp","sourcePathOnMain":"public/Wood 9.webp","gitBlobSha":"49a3205cc995141c994e62e207de068448d58ef7","sizeBytes":1870360,"pixelWidth":null,"pixelHeight":null,"status":"asset-committed"},
  "WOOD-10": {"id":"WOOD-10","familyId":"WALL-02","label":"Charred Dark Wood Slats","path":"/assets/surfaces/wood/wood-10-charred-dark.webp","sourcePathOnMain":"public/Wood 10.webp","gitBlobSha":"8eb77654895a06c519446a051eea69a84361fa7a","sizeBytes":1958836,"pixelWidth":null,"pixelHeight":null,"status":"asset-committed"},
} as const satisfies Record<WoodSurfaceId, WoodSurfaceAsset>;
export function woodSurfaceById(id: WoodSurfaceId): WoodSurfaceAsset {
  return WOOD_SURFACES[id];
}

/** Provisional authoring measurement: source generation targeted 7:4.
 * Do NOT misrepresent this target as a verified source-image pixel aspect.
 */
export const WOOD_TILE_WIDTH_METRES = 1.62;
export const WOOD_TILE_HEIGHT_METRES = WOOD_TILE_WIDTH_METRES * 4 / 7;
export const WOOD_TILE_METRES = Object.freeze({
  width: WOOD_TILE_WIDTH_METRES, height: WOOD_TILE_HEIGHT_METRES,
});
