/** MAT-007, WALL-03 photographic curtain-panel trial.
 * Image is an opaque pure-glass colorway without baked structural divisions, with lighting-responsive specularity.
 * This is NOT a transparent or physically refractive curtain wall.
 * The original 10-style glass taxonomy includes patterned/wired/channel/block
 * systems; the current committed strip-free facade examples are colorway variants.
 */
export const GLASS_FAMILY_ID = "WALL-03" as const;
export const GLASS_SURFACE_IDS = ["GLS-01","GLS-02","GLS-03","GLS-04","GLS-05","GLS-06","GLS-07","GLS-08","GLS-09","GLS-10"] as const;
export type GlassSurfaceId = typeof GLASS_SURFACE_IDS[number];
export interface GlassSurfaceAsset {
  readonly id: GlassSurfaceId;
  readonly familyId: typeof GLASS_FAMILY_ID;
  readonly label: string;
  readonly path: string;
  readonly sourcePathOnMain: string;
  readonly widthPx: number | null;
  readonly heightPx: number | null;
  readonly bytes: number;
  readonly gitBlobSha: string;
  readonly status: "asset-committed";
}
export const GLASS_SURFACES = {
  "GLS-01": {"id":"GLS-01","familyId":"WALL-03","label":"Neutral blue vision glass","path":"/assets/surfaces/glass/gls-01.webp","sourcePathOnMain":"public/Glass 1.webp","widthPx":null,"heightPx":null,"bytes":1130340,"gitBlobSha":"63e28510351276f89779059ba4d0cc31f3fe14a9","status":"asset-committed"},
  "GLS-02": {"id":"GLS-02","familyId":"WALL-03","label":"Smoked charcoal glass","path":"/assets/surfaces/glass/gls-02.webp","sourcePathOnMain":"public/Glass 2.webp","widthPx":null,"heightPx":null,"bytes":1146512,"gitBlobSha":"2bf577e231def28f8b4f58edf8a2cbdd4996c249","status":"asset-committed"},
  "GLS-03": {"id":"GLS-03","familyId":"WALL-03","label":"Silver-neutral reflective glass","path":"/assets/surfaces/glass/gls-03.webp","sourcePathOnMain":"public/Glass 3.webp","widthPx":null,"heightPx":null,"bytes":1128766,"gitBlobSha":"56f7be1b468f103b2ceecbb9226e1d00feab4834","status":"asset-committed"},
  "GLS-04": {"id":"GLS-04","familyId":"WALL-03","label":"Pale aqua glass","path":"/assets/surfaces/glass/gls-04.webp","sourcePathOnMain":"public/Glass 4.webp","widthPx":null,"heightPx":null,"bytes":1092460,"gitBlobSha":"18fdc7ffeb99b17686512614c90059925b06009e","status":"asset-committed"},
  "GLS-05": {"id":"GLS-05","familyId":"WALL-03","label":"Teal corporate glass","path":"/assets/surfaces/glass/gls-05.webp","sourcePathOnMain":"public/Glass 5.webp","widthPx":null,"heightPx":null,"bytes":1087504,"gitBlobSha":"51c15e0c190761361a1d962198fc26ad2adff449","status":"asset-committed"},
  "GLS-06": {"id":"GLS-06","familyId":"WALL-03","label":"Bronze-tinted glass","path":"/assets/surfaces/glass/gls-06.webp","sourcePathOnMain":"public/Glass 6.webp","widthPx":null,"heightPx":null,"bytes":1189218,"gitBlobSha":"90029f12d85c3f55cea6df0e0bf255bdfc3f9310","status":"asset-committed"},
  "GLS-07": {"id":"GLS-07","familyId":"WALL-03","label":"Midnight navy glass","path":"/assets/surfaces/glass/gls-07.webp","sourcePathOnMain":"public/Glass 7.webp","widthPx":null,"heightPx":null,"bytes":1098142,"gitBlobSha":"1f2c8b0f99c0f357a875da98431ae0a97150fc85","status":"asset-committed"},
  "GLS-08": {"id":"GLS-08","familyId":"WALL-03","label":"Green-grey urban glass","path":"/assets/surfaces/glass/gls-08.webp","sourcePathOnMain":"public/Glass 8.webp","widthPx":null,"heightPx":null,"bytes":1105606,"gitBlobSha":"f02a9dc208631ba4880cdc4c4d3c4b67182f2a30","status":"asset-committed"},
  "GLS-09": {"id":"GLS-09","familyId":"WALL-03","label":"Icy blue glass","path":"/assets/surfaces/glass/gls-09.webp","sourcePathOnMain":"public/Glass 9.webp","widthPx":null,"heightPx":null,"bytes":1117930,"gitBlobSha":"3e19c18c115cadfcbd348e7dd9dc1d639fe2cb29","status":"asset-committed"},
  "GLS-10": {"id":"GLS-10","familyId":"WALL-03","label":"Warm grey glass","path":"/assets/surfaces/glass/gls-10.webp","sourcePathOnMain":"public/Glass 10.webp","widthPx":null,"heightPx":null,"bytes":1110404,"gitBlobSha":"2199b0905106b90eadadbe28f168f4b95a08fe62","status":"asset-committed"},
} as const satisfies Record<GlassSurfaceId, GlassSurfaceAsset>;
export function isGlassSurfaceId(value: string): value is GlassSurfaceId {
  return Object.prototype.hasOwnProperty.call(GLASS_SURFACES,value);
}
/** MAT-007 glass-only comparison: preserve the original wide-facade UV repeat
 * (27m x ~15.20m) as a controlled rendering baseline. No mullions or seams
 * are baked into these materials. Physical frame geometry is NOT added here.
 * Preview tiling/lighting at close range before choosing a future repeat.
 */
export const GLASS_TILE_WIDTH_METRES = 27;
export const GLASS_TILE_METRES = Object.freeze({
  width: GLASS_TILE_WIDTH_METRES,
  height: GLASS_TILE_WIDTH_METRES * 941 / 1672,
});
