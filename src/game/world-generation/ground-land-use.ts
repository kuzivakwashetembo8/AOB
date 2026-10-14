import type {CitySpec} from "./schema";

/** GROUND-004: intentionally use one ground finish for all unoccupied space.
 * The approved multi-use catalogue remains in documentation, not this generator.
 * Roads, buildings and existing sidewalks draw their own accepted meshes on top.
 */
export const LAND_FINISHES = ["GRN-01"] as const;
export type LandFinish = typeof LAND_FINISHES[number];
export interface LandBounds {
  readonly left:number;
  readonly right:number;
  readonly north:number;
  readonly south:number;
}
export interface GroundLandPlan {
  readonly bounds:LandBounds;
  readonly width:number;
  readonly height:number;
  readonly kinds:Uint8Array;
  readonly counts:Readonly<Record<LandFinish,number>>;
  readonly basins:readonly [];
  sample(x:number,z:number):LandFinish|null;
}

/** One intentionally uniform classification over the finite First Light terrain.
 * The city input is retained for future generator API compatibility only.
 */
export function planGroundLandUse(_city:CitySpec,bounds:LandBounds):GroundLandPlan {
  const spanX=bounds.right-bounds.left,spanZ=bounds.south-bounds.north;
  if(![bounds.left,bounds.right,bounds.north,bounds.south].every(Number.isFinite)
    ||spanX<=0||spanZ<=0||!Number.isFinite(spanX*spanZ)
    ||spanX*spanZ>750000) {
    throw new Error("GROUND-004: invalid or excessive ground bounds");
  }
  const width=Math.ceil(spanX),height=Math.ceil(spanZ);
  if(width*height>750000)throw new Error("GROUND-004: excessive cell budget");
  // The sole catalogue index is 0 (GRN-01). All 1m cells are explicitly
  // classified; brown fallback, parking, paved residual and ponds cannot arise.
  const kinds=new Uint8Array(width*height);
  return {
    bounds,width,height,kinds,counts:{"GRN-01":kinds.length},basins:[],
    sample(x:number,z:number) {
      if(!Number.isFinite(x)||!Number.isFinite(z)||
        x<bounds.left||x>=bounds.right||z<bounds.north||z>=bounds.south) return null;
      return "GRN-01";
    },
  };
}
