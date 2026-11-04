import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent} from "react";
import {X,Plus,Minus,MapPinned} from "lucide-react";
import {
 NORTH_HEIGHTS_MAP_ROADS_010,
 NORTH_HEIGHTS_MAP_PARKING_010,NORTH_HEIGHTS_MAP_FINCH_HQ_001,northHeightsMapPoint010,
} from "@/game/experiments/north-heights-map-data-010";

export type NorthHeightsMapBuilding011={id:string;x:number;z:number;width:number;depth:number;floors:number;kind:string};
function DistrictVector({x,z,labels=false,onFinchSelect,poi,buildings=[]}:{
 x:number;z:number;labels?:boolean;onFinchSelect?:(()=>void)|undefined;
 poi?:{x:number;z:number}|null|undefined;
 buildings?:readonly NorthHeightsMapBuilding011[]|undefined;
}){
 const point=northHeightsMapPoint010({x,z});
 return <g>
  {/* World-space streets and real geometry, not abstract grid blocks. */}
  <rect width="640" height="640" fill="#365d45"/>
  {NORTH_HEIGHTS_MAP_ROADS_010.map((road,i)=><g key={i}>
    <line x1={road.x} x2={road.x} y1="0" y2="640" stroke="#afb9b4" strokeWidth="15.5"/>
    <line x1="0" x2="640" y1={road.z} y2={road.z} stroke="#afb9b4" strokeWidth="15.5"/>
    <line x1={road.x} x2={road.x} y1="0" y2="640" stroke="#30383e" strokeWidth="8"/>
    <line x1="0" x2="640" y1={road.z} y2={road.z} stroke="#30383e" strokeWidth="8"/>
    <line x1={road.x} x2={road.x} y1="0" y2="640"
      stroke="#e6c56b" strokeWidth=".6" strokeDasharray="5 8"/>
    <line x1="0" x2="640" y1={road.z} y2={road.z}
      stroke="#e6c56b" strokeWidth=".6" strokeDasharray="5 8"/>
  </g>)}
  {buildings.map(b=>{
    const p=northHeightsMapPoint010(b);
    const fill=b.kind==="podium-tower"?"#548397":b.kind==="office"?"#667d8c":"#7a8588";
    return <g key={b.id}>
      <rect x={p.x-b.width/2+1} y={p.y-b.depth/2+1}
        width={b.width} height={b.depth} fill="#162e34" opacity=".5"/>
      <rect x={p.x-b.width/2} y={p.y-b.depth/2} width={b.width} height={b.depth}
        rx="1.5" fill={fill} stroke="#b9d1d7" strokeWidth="1"/>
      <rect x={p.x-b.width/2+3} y={p.y-b.depth/2+3}
        width={Math.max(1,b.width-6)} height={Math.max(1,b.depth-6)}
        fill="none" stroke="#c9d8e2" opacity=".45" strokeWidth=".6"/>
    </g>;
  })}
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
export function NorthHeightsMiniMap({position,onExpand,poi,buildings}:{
 position:{x:number;z:number};onExpand:()=>void;poi?:{x:number;z:number}|null|undefined;
 buildings?:readonly NorthHeightsMapBuilding011[]|undefined;
}){
 return <button type="button" aria-label="Expand North Heights map"
  title="Open North Heights map"
  onClick={onExpand}
  className="relative z-10 shrink-0 overflow-hidden rounded-full border border-white/45 bg-[#071522] shadow-xl"
  style={{width:"clamp(82px,9vw,116px)",height:"clamp(82px,9vw,116px)"}}>
  <svg viewBox={`${northHeightsMapPoint010(position).x-96} ${northHeightsMapPoint010(position).y-96} 192 192`}
     aria-hidden="true" className="h-full w-full">
    <DistrictVector x={position.x} z={position.z} poi={poi} buildings={buildings}/>
  </svg>
  <span className="sr-only">
    North Heights
  </span>
 </button>;
}
export function NorthHeightsExpandedMap({position,onClose,onMapCloseStart,onFinchHQSelect,vehicleOccupied=false,poi,buildings,machineView=false,onMachineTarget}:{
 position:{x:number;z:number};onClose:()=>void;onMapCloseStart?:(()=>void)|undefined;
 onFinchHQSelect?:()=>boolean;vehicleOccupied?:boolean;
 machineView?:boolean;onMachineTarget?:(x:number,z:number)=>boolean;
 poi?:{x:number;z:number}|null|undefined;
 buildings?:readonly NorthHeightsMapBuilding011[]|undefined;
}){
 const [closing,setClosing]=useState(false);
 const closingRef=useRef(false);
 const closeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const close=()=>{
   if(closingRef.current)return;
   closingRef.current=true;setClosing(true);onMapCloseStart?.();
   closeTimer.current=setTimeout(()=>onClose(),190);
 };
 useEffect(()=>()=>{if(closeTimer.current!==null)clearTimeout(closeTimer.current);},[]);
 const [zoom,setZoom]=useState(1);
 const [destinationNotice,setDestinationNotice]=useState("");
 const [pan,setPan]=useState({x:0,y:0});
 const pointers=useRef(new Map<number,{x:number;y:number}>());
 const drag=useRef<{id:number;x:number;y:number}|null>(null);
 const tapStart=useRef<{id:number;x:number;y:number;pinched:boolean}|null>(null);
 const pinch=useRef<{distance:number;zoom:number;pan:{x:number;y:number};center:{x:number;y:number}}|null>(null);
 const mapPoint=(node:SVGSVGElement,x:number,y:number)=>{
   const rect=node.getBoundingClientRect(),ratio=640/(rect.width||640);
   return {x:(x-rect.left)*ratio,y:(y-rect.top)*ratio};
 };
 const startPinch=(node:SVGSVGElement)=>{
   if(pointers.current.size!==2)return;
   const [a,b]=[...pointers.current.values()];
   const first=mapPoint(node,a!.x,a!.y),second=mapPoint(node,b!.x,b!.y);
   pinch.current={
     distance:Math.max(1,Math.hypot(second.x-first.x,second.y-first.y)),
     zoom,pan,center:{x:(first.x+second.x)/2,y:(first.y+second.y)/2},
   };
   drag.current=null;
   if(tapStart.current)tapStart.current.pinched=true;
 };
 const releasePointer=(event:ReactPointerEvent<SVGSVGElement>)=>{
   const started=tapStart.current;
   if(machineView&&onMachineTarget&&started?.id===event.pointerId&&!started.pinched&&
      Math.hypot(event.clientX-started.x,event.clientY-started.y)<7){
     const p=mapPoint(event.currentTarget,event.clientX,event.clientY);
     const worldMapX=(p.x-pan.x-320)/zoom+320;
     const worldMapY=(p.y-pan.y-320)/zoom+320;
     if(worldMapX>=0&&worldMapX<=640&&worldMapY>=0&&worldMapY<=640){
       if(onMachineTarget(worldMapX-320,320-worldMapY))close();
     }
   }
   if(started?.id===event.pointerId)tapStart.current=null;
   pointers.current.delete(event.pointerId);
   pinch.current=null;
   if(pointers.current.size===1){
     const [id,point]=[...pointers.current.entries()][0]!;
     drag.current={id,x:point.x,y:point.y};
   }else drag.current=null;
   if(event.currentTarget.hasPointerCapture(event.pointerId))
     event.currentTarget.releasePointerCapture(event.pointerId);
 };
 useEffect(()=>{
   const escape=(e:KeyboardEvent)=>{if(e.key==="Escape")close();};
   window.addEventListener("keydown",escape);
   return()=>window.removeEventListener("keydown",escape);
 },[closing,onClose,onMapCloseStart]);
 return <div role="dialog" aria-modal="true" aria-label="North Heights 2D map"
   className={`poi009-expanded-map poi-game-glass-panel fixed inset-0 z-[100] flex flex-col items-center justify-center gap-2 overflow-hidden p-3 text-white ${closing?"poi009-expanded-map-closing":""}`}>
   <button type="button" aria-label="Close map" title="Close map" onClick={close}
     className="poi-game-glass-panel fixed right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))] z-[110] flex h-10 w-10 items-center justify-center rounded-lg text-white">
     <X size={22} strokeWidth={2}/>
   </button>
   <header className="flex w-[min(82vh,92vw,760px)] max-w-[92vw] items-center justify-between gap-2">
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
     </div>
   </header>
   <div className="poi-game-glass-panel aspect-square w-[min(82vh,92vw,760px)] max-w-[92vw] flex-none overflow-hidden rounded-lg bg-transparent">
     <svg viewBox="0 0 640 640" className="h-full w-full" role="img"
       aria-label="Top-down North Heights map: white dot marks the player and gold diamond marks Finch headquarters"
       style={{touchAction:"none"}}
       onPointerDown={e=>{
         pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
         if(pointers.current.size===1)tapStart.current={id:e.pointerId,x:e.clientX,y:e.clientY,pinched:false};
         if(pointers.current.size>1&&tapStart.current)tapStart.current.pinched=true;
         e.currentTarget.setPointerCapture(e.pointerId);
         if(pointers.current.size===1)
           drag.current={id:e.pointerId,x:e.clientX,y:e.clientY};
         else if(pointers.current.size===2)startPinch(e.currentTarget);
       }}
       onPointerMove={e=>{
         if(!pointers.current.has(e.pointerId))return;
         pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
         if(pointers.current.size===2&&pinch.current){
           const [a,b]=[...pointers.current.values()];
           const first=mapPoint(e.currentTarget,a!.x,a!.y);
           const second=mapPoint(e.currentTarget,b!.x,b!.y);
           const center={x:(first.x+second.x)/2,y:(first.y+second.y)/2};
           const start=pinch.current;
           const nextZoom=Math.max(1,Math.min(3,
             start.zoom*Math.hypot(second.x-first.x,second.y-first.y)/start.distance));
           const factor=nextZoom/start.zoom;
           setZoom(nextZoom);
           // Pinch about the two-finger midpoint without jumping the map.
           setPan({
             x:start.pan.x+(center.x-start.center.x)+(start.center.x-320-start.pan.x)*(1-factor),
             y:start.pan.y+(center.y-start.center.y)+(start.center.y-320-start.pan.y)*(1-factor),
           });
           return;
         }
         const prev=drag.current;
         if(!prev||prev.id!==e.pointerId)return;
         const ratio=640/(e.currentTarget.getBoundingClientRect().width||640);
         setPan(p=>({x:p.x+(e.clientX-prev.x)*ratio,y:p.y+(e.clientY-prev.y)*ratio}));
         drag.current={id:e.pointerId,x:e.clientX,y:e.clientY};
       }}
       onPointerUp={releasePointer}
       onPointerCancel={releasePointer}>
       <g transform={`translate(${pan.x} ${pan.y}) translate(320 320) scale(${zoom}) translate(-320 -320)`}>
         <DistrictVector x={position.x} z={position.z} labels poi={poi} buildings={buildings}
           onFinchSelect={machineView?undefined:()=> {
             if(!vehicleOccupied){setDestinationNotice("Enter a vehicle to navigate to Finch HQ");return;}
             if(onFinchHQSelect?.())close();
             else setDestinationNotice("Unable to start navigation: use a road-going vehicle");
           }}/>
       </g>
     </svg>
   </div>
   <footer className="flex w-[min(82vh,92vw,760px)] max-w-[92vw] flex-wrap items-center justify-between gap-2 text-xs text-slate-200">
     <span><span className="inline-block h-2 w-2 rounded-full bg-white"/> YOU ARE HERE</span>
     <span className="flex items-center gap-2">
       <span className="inline-block h-2.5 w-2.5 rotate-45 bg-[#d9a64c]"/>
       FINCH HQ · {vehicleOccupied?"CLICK PIN TO AUTO-DRIVE":"ENTER VEHICLE TO NAVIGATE"}
     </span>
     {destinationNotice&&<span role="status" className="text-amber-300">{destinationNotice}</span>}
     <span>{machineView?"THE MACHINE · TAP A LOCATION TO MOVE CAMERA · Drag to pan":"22 named streets · 6 areas · 2 parking lots · Drag to pan"}</span>
   </footer>
 </div>;
}
