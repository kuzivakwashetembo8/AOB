import {useEffect,useRef,useState} from "react";
import {X,Plus,Minus,MapPinned} from "lucide-react";
import {
 NORTH_HEIGHTS_MAP_ROADS_010,NORTH_HEIGHTS_MAP_BLOCKS_010,
 NORTH_HEIGHTS_MAP_PARKING_010,NORTH_HEIGHTS_MAP_FINCH_HQ_001,northHeightsMapPoint010,
} from "@/game/experiments/north-heights-map-data-010";

const regionColor:Record<string,string>={
 "South Gateway":"#405365","West Terrace":"#475562",
 "Glass Exchange":"#516574","Eastview Quarter":"#485d6a",
 "Ridge Gardens":"#3c5854","Summit Crest":"#4a5c6b",
};
function DistrictVector({x,z,labels=false,onFinchSelect,poi}:{
 x:number;z:number;labels?:boolean;onFinchSelect?:()=>void;
 poi?:{x:number;z:number}|null|undefined
}){
 const point=northHeightsMapPoint010({x,z});
 return <g>
  <rect width="640" height="640" fill="#172533"/>
  {labels&&NORTH_HEIGHTS_MAP_BLOCKS_010.map(block=><rect key={block.id}
    x={block.x+3} y={block.y+3} width="58" height="58" rx="2"
    fill={block.kind==="park"?"#346553":
      block.kind==="parking"?"#4d555d":regionColor[block.area]??"#43536a"}
    opacity={block.kind==="building"?.72:1}/>)}
  {NORTH_HEIGHTS_MAP_ROADS_010.map((road,i)=><g key={i}>
    <line x1={road.x} x2={road.x} y1="0" y2="640"
      stroke="#aeb8bf" strokeWidth="7" strokeOpacity=".65"/>
    <line x1="0" x2="640" y1={road.z} y2={road.z}
      stroke="#aeb8bf" strokeWidth="7" strokeOpacity=".65"/>
  </g>)}
  {labels&&NORTH_HEIGHTS_MAP_PARKING_010.map(lot=><g key={lot.id}>
    <rect x={lot.x-18} y={lot.y-18} width="36" height="36"
      fill="#7b8a91" stroke="#f3cd78" strokeWidth="2"/>
    {labels&&<text x={lot.x+20} y={lot.y+5} fontSize="12"
      fill="#ffda94">PARKING</text>}
  </g>)}
  {labels&&[
    {name:"SOUTH GATEWAY",x:320,y:578},
    {name:"WEST TERRACE",x:105,y:352},
    {name:"GLASS EXCHANGE",x:315,y:352},
    {name:"EASTVIEW QUARTER",x:532,y:352},
    {name:"RIDGE GARDENS",x:322,y:122},
    {name:"SUMMIT CREST",x:318,y:38},
  ].map(area=><text key={area.name} x={area.x} y={area.y}
    textAnchor="middle" fontWeight="bold" fontSize="13"
    paintOrder="stroke" stroke="#071522" strokeWidth="3"
    fill="#e9eef2" opacity=".92">{area.name}</text>)}
  {labels&&NORTH_HEIGHTS_MAP_ROADS_010.map((road,i)=><g key={i}>
    <text x={road.x+4} y="13" fontSize="9" fill="#e4edf1"
      transform={`rotate(90 ${road.x+4} 13)`}>{road.northSouth}</text>
    <text x="8" y={road.z-5} fontSize="9" fill="#e4edf1">{road.eastWest}</text>
  </g>)}
  {/* Level 001: anonymous circular i, no person name, number or map caption. */}
  {poi&&(()=>{
   const p=northHeightsMapPoint010(poi);
   return <g aria-label="Point of interest" data-testid="level001-anonymous-poi">
     <circle cx={p.x} cy={p.y} r={labels?13:18}
       fill="#172b3c" stroke="#fff" strokeWidth={labels?2.5:3.5}/>
     <text x={p.x} y={p.y+(labels?5:7)} textAnchor="middle"
       fill="#fff" fontWeight="bold" fontSize={labels?19:26}>i</text>
   </g>;
  })()}
  {/* POI-002: static headquarters landmark, not a mission objective or player position. */}
  <g aria-label="Finch headquarters location"
    role={onFinchSelect?"button":undefined}
    tabIndex={onFinchSelect?0:undefined}
    style={{cursor:onFinchSelect?"pointer":"default"}}
    onPointerDown={onFinchSelect?e=>e.stopPropagation():undefined}
    onPointerUp={onFinchSelect?e=>e.stopPropagation():undefined}
    onClick={onFinchSelect?e=>{e.stopPropagation();onFinchSelect();}:undefined}
    onKeyDown={onFinchSelect?e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onFinchSelect();}}:undefined}>
    <title>Finch HQ · Harold Finch headquarters</title>
    <rect x={NORTH_HEIGHTS_MAP_FINCH_HQ_001.x-(labels?10:17)}
      y={NORTH_HEIGHTS_MAP_FINCH_HQ_001.y-(labels?10:17)}
      width={labels?20:34} height={labels?20:34} rx="2"
      transform={`rotate(45 ${NORTH_HEIGHTS_MAP_FINCH_HQ_001.x} ${NORTH_HEIGHTS_MAP_FINCH_HQ_001.y})`}
      fill="#d9a64c" stroke="#182638" strokeWidth={labels?2:4}/>
    <circle cx={NORTH_HEIGHTS_MAP_FINCH_HQ_001.x}
      cy={NORTH_HEIGHTS_MAP_FINCH_HQ_001.y} r={labels?3.8:6.4}
      fill="#172533"/>
    {onFinchSelect&&<circle cx={NORTH_HEIGHTS_MAP_FINCH_HQ_001.x}
      cy={NORTH_HEIGHTS_MAP_FINCH_HQ_001.y} r={25}
      fill="transparent" pointerEvents="all"/>}
    {labels&&<g>
      <rect x={NORTH_HEIGHTS_MAP_FINCH_HQ_001.x+18}
        y={NORTH_HEIGHTS_MAP_FINCH_HQ_001.y-17}
        width="86" height="22" rx="4"
        fill="#102432" stroke="#d9a64c" strokeWidth="1.5"/>
      <text x={NORTH_HEIGHTS_MAP_FINCH_HQ_001.x+61}
        y={NORTH_HEIGHTS_MAP_FINCH_HQ_001.y-2}
        textAnchor="middle" fontWeight="bold" fontSize="12"
        fill="#f8df9c">FINCH HQ</text>
    </g>}
  </g>
  <circle cx={point.x} cy={point.y} r={labels?10:17}
    fill="#ffffff" stroke="#111827" strokeWidth={labels?3:6}/>
  <circle cx={point.x} cy={point.y} r={labels?18:29}
    fill="none" stroke="#ffffff" strokeOpacity=".6" strokeWidth="3"/>
 </g>;
}
export function NorthHeightsMiniMap({position,onExpand,poi}:{
 position:{x:number;z:number};onExpand:()=>void;poi?:{x:number;z:number}|null|undefined
}){
 return <button type="button" aria-label="Expand North Heights map"
  title="Open North Heights map"
  onClick={onExpand}
  className="relative z-10 shrink-0 overflow-hidden rounded-full border border-white/45 bg-[#071522] shadow-xl"
  style={{width:"clamp(82px,9vw,116px)",height:"clamp(82px,9vw,116px)"}}>
  <svg viewBox="0 0 640 640" aria-hidden="true" className="h-full w-full">
    <DistrictVector x={position.x} z={position.z} poi={poi}/>
  </svg>
  <span className="sr-only">
    North Heights
  </span>
 </button>;
}
export function NorthHeightsExpandedMap({position,onClose,onFinchHQSelect,vehicleOccupied=false,poi}:{
 position:{x:number;z:number};onClose:()=>void;
 onFinchHQSelect?:()=>boolean;vehicleOccupied?:boolean;
 poi?:{x:number;z:number}|null|undefined;
}){
 const [zoom,setZoom]=useState(1);
 const [destinationNotice,setDestinationNotice]=useState("");
 const [pan,setPan]=useState({x:0,y:0});
 const drag=useRef<{id:number;x:number;y:number}|null>(null);
 useEffect(()=>{
   const escape=(e:KeyboardEvent)=>{if(e.key==="Escape")onClose();};
   window.addEventListener("keydown",escape);
   return()=>window.removeEventListener("keydown",escape);
 },[onClose]);
 return <div role="dialog" aria-modal="true" aria-label="North Heights 2D map"
   className="fixed inset-0 z-[100] flex flex-col items-center gap-2 overflow-hidden bg-[#07111d]/95 p-2 text-white">
   <header className="flex w-full max-w-[780px] items-center justify-between gap-2">
     <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
       <MapPinned size={17}/> NORTH HEIGHTS — MERIDIAN CITY
     </div>
     <div className="flex items-center gap-2">
       <button aria-label="Zoom out" className="rounded border border-white/40 p-2"
         onClick={()=>setZoom(v=>Math.max(1,v-.25))}><Minus size={17}/></button>
       <button aria-label="Zoom in" className="rounded border border-white/40 p-2"
         onClick={()=>setZoom(v=>Math.min(3,v+.25))}><Plus size={17}/></button>
       <button aria-label="Reset map view" className="rounded border border-white/40 px-2 py-2 text-xs"
         onClick={()=>{setZoom(1);setPan({x:0,y:0});}}>RESET</button>
       <button aria-label="Close map" className="rounded border border-white/40 p-2"
         onClick={onClose}><X size={18}/></button>
     </div>
   </header>
   <div className="min-h-0 w-full flex-1 overflow-hidden rounded-lg border border-white/25 bg-[#142334]">
     <svg viewBox="0 0 640 640" className="h-full w-full" role="img"
       aria-label="Top-down North Heights map: white dot marks the player and gold diamond marks Finch headquarters"
       style={{touchAction:"none"}}
       onPointerDown={e=>{drag.current={id:e.pointerId,x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);}}
       onPointerMove={e=>{
         const prev=drag.current;
         if(!prev||prev.id!==e.pointerId)return;
         const width=e.currentTarget.getBoundingClientRect().width||640;
         const ratio=640/width;
         setPan(p=>({x:p.x+(e.clientX-prev.x)*ratio,y:p.y+(e.clientY-prev.y)*ratio}));
         drag.current={id:e.pointerId,x:e.clientX,y:e.clientY};
       }}
       onPointerUp={()=>{drag.current=null;}}
       onPointerCancel={()=>{drag.current=null;}}>
       <g transform={`translate(${pan.x} ${pan.y}) translate(320 320) scale(${zoom}) translate(-320 -320)`}>
         <DistrictVector x={position.x} z={position.z} labels poi={poi}
           onFinchSelect={()=> {
             if(!vehicleOccupied){setDestinationNotice("Enter a vehicle to navigate to Finch HQ");return;}
             if(!onFinchHQSelect?.())setDestinationNotice("Unable to start navigation: use a road-going vehicle");
           }}/>
       </g>
     </svg>
   </div>
   <footer className="flex w-full max-w-[780px] flex-wrap items-center justify-between gap-2 text-xs text-slate-200">
     <span><span className="inline-block h-2 w-2 rounded-full bg-white"/> YOU ARE HERE</span>
     <span className="flex items-center gap-2">
       <span className="inline-block h-2.5 w-2.5 rotate-45 bg-[#d9a64c]"/>
       FINCH HQ · {vehicleOccupied?"CLICK PIN TO AUTO-DRIVE":"ENTER VEHICLE TO NAVIGATE"}
     </span>
     {destinationNotice&&<span role="status" className="text-amber-300">{destinationNotice}</span>}
     <span>22 named streets · 6 areas · 2 parking lots · Drag to pan</span>
   </footer>
 </div>;
}
