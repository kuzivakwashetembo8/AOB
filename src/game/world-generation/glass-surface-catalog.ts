/** MAT-007, WALL-03 photographic curtain-panel trial.
 * Image is an opaque grid with lighting-responsive specularity.
 * This is NOT a transparent or physically refractive curtain wall.
 * The original 10-style glass taxonomy includes patterned/wired/channel/block
 * systems; actual committed flat curtain-grid examples are colorway variants.
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
  readonly widthPx: number;
  readonly heightPx: number;
  readonly bytes: number;
  readonly gitBlobSha: string;
  readonly status: "asset-committed";
}
export const GLASS_SURFACES = {
  "GLS-01": {"id":"GLS-01","familyId":"WALL-03","label":"Neutral blue vision glass","path":"/assets/surfaces/glass/gls-01.webp","sourcePathOnMain":"public/Glass 1.webp","widthPx":1672,"heightPx":941,"bytes":30692,"gitBlobSha":"e321be6415763c9eb33331487d07880bdbdf31e6","status":"asset-committed"},
  "GLS-02": {"id":"GLS-02","familyId":"WALL-03","label":"Smoked charcoal glass","path":"/assets/surfaces/glass/gls-02.webp","sourcePathOnMain":"public/Glass 2.webp","widthPx":1672,"heightPx":941,"bytes":26286,"gitBlobSha":"0c802813e42d2fbfd81f828ad4961d4905a38ff7","status":"asset-committed"},
  "GLS-03": {"id":"GLS-03","familyId":"WALL-03","label":"Silver-neutral reflective glass","path":"/assets/surfaces/glass/gls-03.webp","sourcePathOnMain":"public/Glass 3.webp","widthPx":1672,"heightPx":941,"bytes":28200,"gitBlobSha":"59fbb891d9767e61d222bb924357c3b28e402954","status":"asset-committed"},
  "GLS-04": {"id":"GLS-04","familyId":"WALL-03","label":"Pale aqua glass","path":"/assets/surfaces/glass/gls-04.webp","sourcePathOnMain":"public/Glass 4.webp","widthPx":1672,"heightPx":941,"bytes":42890,"gitBlobSha":"0e65298da5fcebc0f9f2ad162e2d90a71ac64693","status":"asset-committed"},
  "GLS-05": {"id":"GLS-05","familyId":"WALL-03","label":"Teal corporate glass","path":"/assets/surfaces/glass/gls-05.webp","sourcePathOnMain":"public/Glass 5.webp","widthPx":1672,"heightPx":941,"bytes":31366,"gitBlobSha":"bdf11780299de2e64a4b600aa106ac5481770435","status":"asset-committed"},
  "GLS-06": {"id":"GLS-06","familyId":"WALL-03","label":"Bronze-tinted glass","path":"/assets/surfaces/glass/gls-06.webp","sourcePathOnMain":"public/Glass 6.webp","widthPx":1672,"heightPx":941,"bytes":30552,"gitBlobSha":"a8a2be6096185e5be2c39cdaebb9bd2b9da5856c","status":"asset-committed"},
  "GLS-07": {"id":"GLS-07","familyId":"WALL-03","label":"Midnight navy glass","path":"/assets/surfaces/glass/gls-07.webp","sourcePathOnMain":"public/Glass 7.webp","widthPx":1672,"heightPx":941,"bytes":38480,"gitBlobSha":"7b7ee56de5f9c6f256b76848a1d2869d73e5fae7","status":"asset-committed"},
  "GLS-08": {"id":"GLS-08","familyId":"WALL-03","label":"Green-grey urban glass","path":"/assets/surfaces/glass/gls-08.webp","sourcePathOnMain":"public/Glass 8.webp","widthPx":1672,"heightPx":941,"bytes":39590,"gitBlobSha":"acb3fcaa305b083156f16cbe410d205ce0b8a998","status":"asset-committed"},
  "GLS-09": {"id":"GLS-09","familyId":"WALL-03","label":"Icy blue glass","path":"/assets/surfaces/glass/gls-09.webp","sourcePathOnMain":"public/Glass 9.webp","widthPx":1672,"heightPx":941,"bytes":38616,"gitBlobSha":"866c4d62182f4c4ada5399a20d50125ce07335b8","status":"asset-committed"},
  "GLS-10": {"id":"GLS-10","familyId":"WALL-03","label":"Warm grey glass","path":"/assets/surfaces/glass/gls-10.webp","sourcePathOnMain":"public/Glass 10.webp","widthPx":1672,"heightPx":941,"bytes":32222,"gitBlobSha":"42ef211e8e31d3536801cf9adc55d63f8fead9d9","status":"asset-committed"},
} as const satisfies Record<GlassSurfaceId, GlassSurfaceAsset>;
export function isGlassSurfaceId(value: string): value is GlassSurfaceId {
  return Object.prototype.hasOwnProperty.call(GLASS_SURFACES,value);
}
/** An image tile has roughly 12 mullion bays x five storey bands.
 * Repeat period = 27.0m x ~15.2m. It yields approximately 2.25m
 * pane width and ~3.04m floor bands; actual source pixel ratio is exact.
 */
export const GLASS_TILE_WIDTH_METRES = 27;
export const GLASS_TILE_METRES = Object.freeze({
  width: GLASS_TILE_WIDTH_METRES,
  height: GLASS_TILE_WIDTH_METRES * 941 / 1672,
});
