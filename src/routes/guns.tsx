/** LMS-GUN-001: isolated owner-facing weapon inspection gallery. */
import {createFileRoute} from "@tanstack/react-router";
import {useCallback,useEffect,useRef,useState} from "react";
import type {PointerEvent} from "react";
import {ChevronLeft,ChevronRight,RotateCcw} from "lucide-react";
import {BackLink,PageShell} from "@/ui/menus/shell";
import {pageHead} from "@/lib/page-head";
import {GUNS_001,gunAt001} from "@/game/weapons/gun-inspection-registry-001";
import type {GunInspectionScene001} from "@/game/weapons/gun-inspection-scene-001";

export const Route=createFileRoute("/guns")({
 head:()=>pageHead("Guns | LMS","Inspect the extracted LMS weapon models."),
 component:GunGalleryPage
});
type Perspective="side"|"front"|"top";
function GunGalleryPage(){
 const canvas=useRef<HTMLCanvasElement>(null);
 const showroom=useRef<GunInspectionScene001|null>(null);
 const touchStart=useRef<{x:number;y:number}|null>(null);
 const currentIndex=useRef(0);
 const [index,setIndex]=useState(0);
 const [message,setMessage]=useState("INITIALIZING WEAPON INSPECTION");
 const selected=gunAt001(index);currentIndex.current=index;
 const change=useCallback((direction:number)=>setIndex(i=>(i+direction+GUNS_001.length)%GUNS_001.length),[]);
 useEffect(()=>{
  let closed=false;
  const start=async()=>{
   try{
    if(!canvas.current)return;
    const {createGunInspectionScene001}=await import("@/game/weapons/gun-inspection-scene-001");
    if(closed||!canvas.current)return;
    const scene=createGunInspectionScene001(canvas.current);showroom.current=scene;
    const gun=gunAt001(currentIndex.current);setMessage("DECODING // "+gun.name);
    const note=await scene.show(gun);
    if(!closed&&gunAt001(currentIndex.current).id===gun.id)setMessage(note);
   }catch(error){
    if(!closed)setMessage("INSPECTION ERROR // "+(error instanceof Error?error.message:String(error)));
   }
  };
  void start();
  return()=>{closed=true;showroom.current?.dispose();showroom.current=null;};
 },[]);
 useEffect(()=>{
  const scene=showroom.current;if(!scene)return;
  let active=true;setMessage("DECODING // "+selected.name);
  void scene.show(selected).then(note=>{if(active)setMessage(note);}).catch(error=>{
   if(active&&error?.name!=="AbortError")setMessage("INSPECTION ERROR // "+(error instanceof Error?error.message:String(error)));
  });
  return()=>{active=false;};
 },[selected.id]);
 const startSwipe=(event:PointerEvent<HTMLCanvasElement>)=>{
  if(event.pointerType==="touch"&&event.isPrimary)touchStart.current={x:event.clientX,y:event.clientY};
 };
 const endSwipe=(event:PointerEvent<HTMLCanvasElement>)=>{
  const start=touchStart.current;touchStart.current=null;
  if(!start||event.pointerType!=="touch")return;
  const dx=event.clientX-start.x,dy=event.clientY-start.y;
  if(Math.abs(dx)>Math.max(95,window.innerWidth*.085)&&Math.abs(dx)>Math.abs(dy)*1.6)change(dx<0?1:-1);
 };
 const view=(value:Perspective)=>showroom.current?.view(value);
 return <PageShell>
  <section className="gun-gallery-page">
   <header className="gun-gallery-head">
    <div><div className="system-label text-primary">LMS // WEAPON EXTRACTION QA</div>
     <h1 className="gun-gallery-title">GUNS<span className="text-primary">.</span></h1></div>
    <BackLink/>
   </header>
   <div className="gun-gallery-main">
    <div className="gun-gallery-stage">
     <canvas ref={canvas} className="gun-gallery-canvas"
      aria-label={"Interactive 3D inspection of "+selected.name}
      onPointerDown={startSwipe} onPointerUp={endSwipe}
      onPointerCancel={()=>{touchStart.current=null;}}/>
     <div className="gun-gallery-label"><strong>{selected.name}</strong>
      <span>{index+1} / {GUNS_001.length} · {selected.category}</span></div>
     <div className="gun-gallery-status" role="status">{message}</div>
    </div>
    <aside className="gun-gallery-side">
     <div className="system-label text-primary">EXTRACTED SOURCE MODEL</div>
     <strong>{selected.category}</strong><p>{selected.description}</p>
     <div className="gun-gallery-switch">
      <button type="button" onClick={()=>change(-1)} aria-label="Previous gun"><ChevronLeft size={20}/></button>
      <span>SWIPE TO CHANGE</span>
      <button type="button" onClick={()=>change(1)} aria-label="Next gun"><ChevronRight size={20}/></button>
     </div>
     <div className="system-label">CAMERA VIEWS</div>
     <div className="gun-gallery-views">
      <button type="button" onClick={()=>view("side")}>SIDE</button>
      <button type="button" onClick={()=>view("front")}>FRONT</button>
      <button type="button" onClick={()=>view("top")}>TOP</button>
      <button type="button" onClick={()=>view("side")} aria-label="Reset inspection camera"><RotateCcw size={14}/> RESET</button>
     </div>
     <p className="gun-gallery-hint">Drag to orbit · scroll or pinch to zoom · swipe horizontally to change guns. Inspection only; weapon handling and firing are not connected yet.</p>
    </aside>
   </div>
  </section>
 </PageShell>;
}
