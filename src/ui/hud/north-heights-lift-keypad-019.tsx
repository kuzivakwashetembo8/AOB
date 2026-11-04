import {useEffect,useRef,useState,type PointerEvent as ReactPointerEvent} from "react";
import {X} from "lucide-react";

/** NH-LIFT-019 — shared transparent game-control keypad for ANY floor count.
 * The actual floor count comes from the procedural building metadata.
 */
export type LiftKeypadView019={
 buildingId:string;label:string;floors:number;currentFloor:number;
 available:boolean;moving:boolean;finch:boolean;
};
export function NorthHeightsLiftKeypad019({lift,onSelect,onClose}:{
 lift:LiftKeypadView019;onSelect:(floor:number)=>void;onClose:()=>void;
}){
 const viewport=useRef<HTMLDivElement>(null);
 const drag=useRef<{id:number;y:number;top:number}|null>(null);
 const [scroll,setScroll]=useState({visible:false,top:0,height:0});
 const measure=()=>{
  const node=viewport.current;if(!node)return;
  const visible=node.clientHeight,full=node.scrollHeight,overflow=full-visible;
  const track=Math.max(1,visible-16),thumb=Math.max(24,Math.min(track,track*(visible/Math.max(visible,full))));
  setScroll({visible:overflow>1,top:overflow>0?(node.scrollTop/overflow)*(track-thumb):0,height:thumb});
 };
 useEffect(()=>{
  const node=viewport.current;if(!node)return;
  measure();
  const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(measure):null;
  observer?.observe(node);if(node.firstElementChild)observer?.observe(node.firstElementChild);
  return()=>observer?.disconnect();
 },[lift.floors]);
 const startThumb=(event:ReactPointerEvent<HTMLDivElement>)=>{
  event.preventDefault();event.stopPropagation();
  drag.current={id:event.pointerId,y:event.clientY,top:scroll.top};
  event.currentTarget.setPointerCapture?.(event.pointerId);
 };
 const moveThumb=(event:ReactPointerEvent<HTMLDivElement>)=>{
  const d=drag.current,node=viewport.current;if(!d||d.id!==event.pointerId||!node)return;
  const height=Math.max(1,node.clientHeight-16-scroll.height);
  const full=Math.max(0,node.scrollHeight-node.clientHeight);
  node.scrollTop=Math.max(0,Math.min(full,(d.top+event.clientY-d.y)/height*full));
 };
 const releaseThumb=(event:ReactPointerEvent<HTMLDivElement>)=>{
  if(drag.current?.id===event.pointerId)drag.current=null;
 };
 return <section className="absolute right-[5.5rem] top-1/2 z-[70] flex max-h-[min(55dvh,460px)] w-[min(310px,72vw)] -translate-y-1/2 flex-col poi-game-glass-panel rounded-xl p-3 text-white"
  aria-label="Elevator floor keypad" data-testid="nh019-lift-keypad">
  <div className="mb-2 flex items-center justify-between gap-2">
   <div>
    <div className="text-[10px] font-semibold tracking-widest text-white/60">SELECT FLOOR</div>
    <div className="text-sm font-semibold">{lift.label} · {lift.currentFloor} / {lift.floors}</div>
   </div>
   <button type="button" aria-label="Close elevator keypad"
    className="flex h-9 w-9 items-center justify-center rounded border border-white/25 bg-black/55"
    onClick={onClose}><X size={17}/></button>
  </div>
  <div className="relative min-h-0 flex-1">
   <div ref={viewport} onScroll={measure} tabIndex={0}
    className="poi009-floor-scroll h-full max-h-[calc(55dvh-110px)] min-h-0 overflow-y-auto pr-3"
    role="group" aria-label="Available floors">
    <div className="grid grid-cols-5 gap-2 p-1">
   {Array.from({length:lift.floors},(_,i)=>i+1).map(number=>
    <button key={number} type="button" aria-label={`Go to floor ${number}`}
     data-testid={`nh019-floor-${number}`}
     className={`flex h-10 items-center justify-center rounded border text-sm font-semibold transition-colors ${number===lift.currentFloor?"border-white/60 bg-white/20 text-white":"border-white/20 bg-black/55 text-white/90 hover:bg-white/20"}`}
     disabled={!lift.available||lift.moving||number===lift.currentFloor}
     onClick={()=>onSelect(number)}>{number}</button>)}
    </div>
   </div>
   {scroll.visible&&<div aria-hidden="true" className="poi009-scroll-track">
     <div className="poi009-scroll-thumb" style={{height:scroll.height,transform:`translateY(${scroll.top}px)`}}
      onPointerDown={startThumb} onPointerMove={moveThumb}
      onPointerUp={releaseThumb} onPointerCancel={releaseThumb} onLostPointerCapture={releaseThumb}/>
   </div>}
  </div>
  <p className="mt-2 text-[10px] text-white/65">
   {lift.moving?"Lift in motion":"Choose any floor in this building"}
  </p>
 </section>;
}
