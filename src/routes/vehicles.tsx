/** Isolated owner-facing vehicle inspection, GEN-VEH-008. */
import {createFileRoute} from "@tanstack/react-router";
import {useCallback,useEffect,useRef,useState} from "react";
import type {PointerEvent} from "react";
import {ChevronLeft,ChevronRight,RotateCcw} from "lucide-react";
import {BackLink,PageShell} from "@/ui/menus/shell";
import {pageHead} from "@/lib/page-head";
import {GALLERY_VEHICLES_008,galleryVehicleAt008} from "@/game/vehicles/vehicle-inspection-registry-008";
import type {VehicleInspectionScene008} from "@/game/vehicles/vehicle-inspection-scene-008";

export const Route=createFileRoute("/vehicles")({
 head:()=>pageHead("Vehicles | GTD","Inspect original-source GTD vehicle reconstructions before approval."),
 component:VehicleGalleryPage
});
type Perspective="front"|"rear"|"left"|"right"|"top"|"threeQuarter";
function VehicleGalleryPage(){
 const canvas=useRef<HTMLCanvasElement>(null);
 const showroom=useRef<VehicleInspectionScene008|null>(null);
 const currentIndex=useRef(0);
 const touchStart=useRef<{x:number;y:number}|null>(null);
 const [index,setIndex]=useState(0);
 const [message,setMessage]=useState("INITIALIZING VEHICLE INSPECTION");
 const selected=galleryVehicleAt008(index);
 currentIndex.current=index;
 const change=useCallback((direction:number)=>setIndex(i=>(i+direction+GALLERY_VEHICLES_008.length)%GALLERY_VEHICLES_008.length),[]);
 useEffect(()=>{
   let closed=false;
   const start=async()=>{
     try{
       if(!canvas.current)return;
       const {createVehicleInspectionScene008}=await import("@/game/vehicles/vehicle-inspection-scene-008");
       if(closed||!canvas.current)return;
       const scene=createVehicleInspectionScene008(canvas.current);
       showroom.current=scene;
       const vehicle=galleryVehicleAt008(currentIndex.current);
       setMessage("DECODING // "+vehicle.name);
       const note=await scene.show(vehicle);
       if(!closed&&galleryVehicleAt008(currentIndex.current).id===vehicle.id)setMessage(note);
     }catch(error){
       if(!closed)setMessage("INSPECTION ERROR // "+(error instanceof Error?error.message:String(error)));
     }
   };
   void start();
   return()=>{closed=true;showroom.current?.dispose();showroom.current=null;};
 },[]);
 useEffect(()=>{
   const scene=showroom.current;if(!scene)return;
   let active=true;
   setMessage("DECODING // "+selected.name);
   void scene.show(selected).then(note=>{
     if(active)setMessage(note);
   }).catch(error=>{
     if(active&&error?.name!=="AbortError")
       setMessage("INSPECTION ERROR // "+(error instanceof Error?error.message:String(error)));
   });
   return()=>{active=false;};
 },[selected.id]);
 const startSwipe=(event:PointerEvent<HTMLCanvasElement>)=>{
   if(event.pointerType==="touch"&&event.isPrimary)
     touchStart.current={x:event.clientX,y:event.clientY};
 };
 const endSwipe=(event:PointerEvent<HTMLCanvasElement>)=>{
   const start=touchStart.current;touchStart.current=null;
   if(!start||event.pointerType!=="touch")return;
   const dx=event.clientX-start.x,dy=event.clientY-start.y;
   if(Math.abs(dx)>Math.max(95,window.innerWidth*.085)&&Math.abs(dx)>Math.abs(dy)*1.6)
     change(dx<0?1:-1);
 };
 const view=(value:Perspective)=>showroom.current?.view(value);
 return <PageShell>
   <section className="vehicle-gallery-page">
     <header className="vehicle-gallery-head">
       <div>
         <div className="system-label text-primary">GTD // VEHICLE EXTRACTION QA</div>
         <h1 className="vehicle-gallery-title">VEHICLES<span className="text-primary">.</span></h1>
       </div>
       <BackLink/>
     </header>
     <div className="vehicle-gallery-main">
       <div className="vehicle-gallery-stage">
         <canvas ref={canvas} className="vehicle-gallery-canvas"
           aria-label={"Interactive 3D inspection of "+selected.name}
           onPointerDown={startSwipe} onPointerUp={endSwipe} onPointerCancel={()=>{touchStart.current=null;}} />
         <div className="vehicle-gallery-label">
           <strong>{selected.name}</strong>
           <span>{index+1} / {GALLERY_VEHICLES_008.length} · GEN-VEH</span>
         </div>
         <div className="vehicle-gallery-status" role="status">{message}</div>
       </div>
       <aside className="vehicle-gallery-side">
         <div className="system-label text-primary">ORIGINAL-SOURCE DERIVATIVE</div>
         <strong>{selected.status}</strong>
         <p>{selected.note}</p>
         <div className="vehicle-gallery-switch">
           <button type="button" onClick={()=>change(-1)} aria-label="Previous vehicle"><ChevronLeft size={20}/></button>
           <span>SWIPE TO CHANGE</span>
           <button type="button" onClick={()=>change(1)} aria-label="Next vehicle"><ChevronRight size={20}/></button>
         </div>
         <div className="system-label">CAMERA VIEWS</div>
         <div className="vehicle-gallery-views">
           {(["front","rear","left","right","top"] as const).map(p=>
             <button key={p} type="button" onClick={()=>view(p)}>{p.toUpperCase()}</button>)}
           <button type="button" onClick={()=>view("threeQuarter")} aria-label="Reset inspection camera">
             <RotateCcw size={14}/> RESET
           </button>
         </div>
         <p className="vehicle-gallery-hint">Drag to orbit · pinch or scroll to zoom · swipe horizontally to change vehicles. Inspection only; changes are not promoted into traffic.</p>
       </aside>
     </div>
   </section>
 </PageShell>;
}
