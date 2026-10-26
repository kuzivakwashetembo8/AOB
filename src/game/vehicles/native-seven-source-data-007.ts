/** Prebuild placeholder. Original source data emitted by GEN-VEH-007. */
export type SevenNativeEncoded007={p:string;n:string;i:string;indexBits:number;vertices:number;triangles:number};
export type SevenNativeWheel007={center:number[];radius:number;width:number;rim:SevenNativeEncoded007;tire:SevenNativeEncoded007};
export type SevenNativeEntry007={source:string;sourceTriangles:number;geometryTriangles:number;cluster:number;status:string;wheelsStatus:string;body:Record<string,SevenNativeEncoded007|null>|null;wheels:Record<string,SevenNativeWheel007>|null};
export const SEVEN_SOURCE_NATIVE_007:Record<string,SevenNativeEntry007>={};
