import type {SVGProps} from "react";
/** POI-009: compact pistol silhouette independent of third-party icon availability. */
export function PistolIcon009({size=19,...props}:SVGProps<SVGSVGElement>&{size?:number}){
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
   stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
   aria-hidden="true" {...props}>
   <path d="M3 7.5h12l2 1.7H21v3.6h-8.2l-2.1 7H5.6l2-7H3z"/>
   <path d="M7.5 12.8h5.2M17 9.2v3.5M9 16h2.3"/>
 </svg>;
}
