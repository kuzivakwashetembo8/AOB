import {createFileRoute} from "@tanstack/react-router";
import {useEffect,useRef,useState} from "react";
import {X} from "lucide-react";
import type {NorthHeightsInspection} from "@/game/experiments/north-heights-city-8";
import type {GameCommand} from "@/game/core/types";
import {pageHead} from "@/lib/page-head";
import {useSettings} from "@/ui/menus/settings-state";
import {GTDSettingsOverlay,GTDSessionPauseActions} from "@/ui/menus/session-overlays";
import {GameHud} from "@/ui/hud/game-hud";
import {NorthHeightsMiniMap,NorthHeightsExpandedMap} from "@/ui/hud/north-heights-map-010";
import type {GameSnapshot} from "@/game/core/types";
import {TouchControls} from "@/ui/hud/touch-controls";
import {DesktopControls} from "@/ui/hud/desktop-controls";
import {useInputMode} from "@/game/input/use-input-mode";

export const Route=createFileRoute("/north-heights-preview")({
  head:()=>pageHead("North Heights · Procedural Reconstruction",
    "Isolated North Heights walking and flying, with shared GTD controls."),
  component:NorthHeightsPreview,
});
function NorthHeightsPreview(){
  const canvas=useRef<HTMLCanvasElement>(null),controller=useRef<NorthHeightsInspection|null>(null);
  const {settings,save}=useSettings();
  const currentSettings=useRef(settings);currentSettings.current=settings;
  const [status,setStatus]=useState("Preparing North Heights");
  const [stats,setStats]=useState("");
  const [meridianMinute,setMeridianMinute]=useState(14*60+53);
  const [meridianSpeed,setMeridianSpeed]=useState(2);
  const [mode,setMode]=useState<"walk"|"fly">("walk");
  const [location,setLocation]=useState("NORTH HEIGHTS // MERIDIAN CITY");
  const [position,setPosition]=useState({x:0,z:-31});
  const [vehicle,setVehicle]=useState<string|null>(null);
  const [vehicleSpeed,setVehicleSpeed]=useState(0);
  const [canEnterVehicle,setCanEnterVehicle]=useState(false);
  const [inside,setInside]=useState(false);
  const [mapOpen,setMapOpen]=useState(false);
  const [paused,setPaused]=useState(false);
  const [panel,setPanel]=useState<"pause"|"settings"|"objectives"|"save">("pause");
  const [feedback,setFeedback]=useState("");
  const [coarse,setCoarse]=useState(false);
  const inputMode=useInputMode();
  const ready=status.includes("physics ready");
  const failed=/failed|failure|error/i.test(status);
  const touchVisible=coarse&&!(settings.autoHide&&inputMode==="keyboard");
  const desktopVisible=!coarse&&settings.desktopControls;
  const send=(command:GameCommand)=>{
    if(command.type==="move")controller.current?.move(command.x,command.y);
    if(command.type==="action")controller.current?.action(command.action,command.pressed);
  };

  useEffect(()=>{
    const m=window.matchMedia("(pointer: coarse)");
    const onChange=()=>setCoarse(m.matches);onChange();
    m.addEventListener("change",onChange);
    return()=>m.removeEventListener("change",onChange);
  },[]);
  useEffect(()=>{controller.current?.applySettings(settings);},[settings]);
  useEffect(()=>{controller.current?.setPaused(paused);},[paused]);
  useEffect(()=>{
    if(paused||!meridianSpeed)return;
    const tick=window.setInterval(()=>setMeridianMinute(v=>(v+meridianSpeed/2)%1440),1000);
    return()=>window.clearInterval(tick);
  },[paused,meridianSpeed]);
  useEffect(()=>{
    const hour=Math.floor(meridianMinute/60);
    controller.current?.setTime(hour>=6&&hour<17?"day":hour>=17&&hour<20?"dusk":"night");
  },[meridianMinute]);
  useEffect(()=>{
    let closed=false;
    const start=async()=>{
      try{
        if(!canvas.current)return;
        const {createNorthHeightsCity8}=await import("@/game/experiments/north-heights-city-8");
        if(closed||!canvas.current)return;
        const instance=await createNorthHeightsCity8(canvas.current,
          message=>{if(!closed)setStatus(message);},
          message=>{if(!closed)setStats(message);},
          next=>{if(!closed)setMode(next);},
          note=>{if(!closed)setFeedback(note);},
          nextLocation=>{if(!closed)setLocation(nextLocation);},
          point=>{if(!closed)setPosition(point);},
          (nextVehicle,speed)=>{if(!closed){
            setVehicle(nextVehicle);
            setVehicleSpeed(speed);
          }},
          nextInside=>{if(!closed)setInside(nextInside);},
          available=>{if(!closed)setCanEnterVehicle(available);});
        if(closed)instance.dispose();
        else{
          controller.current=instance;
          instance.applySettings(currentSettings.current);
          const hour=Math.floor(meridianMinute/60);
          instance.setTime(hour>=6&&hour<17?"day":hour>=17&&hour<20?"dusk":"night");
          instance.setPaused(paused);
        }
      }catch(error){
        if(!closed)setStatus("Viewport failure: "+(error instanceof Error?error.message:String(error)));
      }
    };
    void start();
    return()=>{closed=true;controller.current?.dispose();controller.current=null;};
  },[]);
  const close=()=>{setPanel("pause");setPaused(false);setMapOpen(false);};
  useEffect(()=>{
    if(!paused)return;
    const key=(e:KeyboardEvent)=>{if(e.key==="Escape")close();};
    window.addEventListener("keydown",key);
    return()=>window.removeEventListener("keydown",key);
  },[paused]);
  useEffect(()=>{
    if(!feedback)return;
    const timer=window.setTimeout(()=>setFeedback(""),3500);
    return()=>window.clearTimeout(timer);
  },[feedback]);
  const clock=Math.floor(meridianMinute/60).toString().padStart(2,"0")+":"+
    Math.floor(meridianMinute%60).toString().padStart(2,"0");
  const snapshot:GameSnapshot={
    lifecycle:ready?(paused?"paused":"running"):"bootstrapping",
    context:vehicle?"driving":"walking",location,
    objective:"Explore North Heights on foot or in flight",
    health:100,reputation:0,heat:0,speed:vehicleSpeed,vehicle,
    meridianTime:clock,meridianMinuteOfDay:Math.floor(meridianMinute),
    meridianTimeScale:meridianSpeed,interiorState:inside?"inside":"outside",
    flying:mode==="fly"&&!vehicle,
  };
  return(
    <main className={"game-shell game-viewport relative h-[100dvh] w-full overflow-hidden bg-[#07111c] text-white"+
      (settings.reducedMotion?" motion-reduced":"")+(settings.contrast?" high-contrast":"")+
      (settings.textSize==="Large"?" large-interface":"")}>
      <canvas ref={canvas} aria-label="North Heights interactive city"
        className="absolute inset-0 h-full w-full" style={{touchAction:"none"}}/>
      {ready&&settings.hud&&<GameHud snapshot={snapshot}
        context={vehicle?"driving":"walking"}
        mapSlot={<NorthHeightsMiniMap position={position} onExpand={()=>setMapOpen(true)}/>}
        mode={inputMode} interaction={feedback} pause={()=>{setPanel("pause");setPaused(true);}}
        showObjective={settings.objective} setMeridianTime={setMeridianMinute}
        setMeridianTimeScale={setMeridianSpeed}/>}
      {ready&&!settings.hud&&<button type="button" className="absolute top-5 right-5 z-20"
        aria-label="Pause menu" onClick={()=>{setPanel("pause");setPaused(true);}}>II</button>}
      {ready&&!paused&&stats.includes("SEDAN ")&&
        <div data-testid="nh013-sedan-telemetry" aria-label="NH-013 sedan pilot diagnostic"
          className="pointer-events-none absolute bottom-2 left-1/2 z-10 w-max max-w-[55vw] -translate-x-1/2 rounded border border-white/20 bg-black/80 px-2 py-1 text-center text-[10px] text-white/90">
          {stats.split("SEDAN ")[1]?.split(" · ")[0]
            ? "SEDAN "+stats.split("SEDAN ")[1]?.split(" · ")[0]
            : "SEDAN PILOT INITIALIZING"}
        </div>}
      {feedback&&!paused&&<div role="status" className="pointer-events-none absolute bottom-[42%] left-1/2 z-20 max-w-[70vw] -translate-x-1/2 rounded-lg border border-amber-400/40 bg-black/85 px-3 py-2 text-center text-xs text-amber-100">{feedback}</div>}
      {!ready&&<div role="status" className={"pointer-events-none absolute left-1/2 top-14 z-10 w-[min(460px,73vw)] -translate-x-1/2 rounded border border-white/15 px-2 py-1 text-center text-xs "+(failed?"bg-red-950/90":"bg-black/70")}>
        {failed?status:"Loading North Heights..."}
      </div>}
      {touchVisible&&!paused&&!mapOpen&&<TouchControls settings={settings} send={send}
        driving={vehicle!==null} flying={mode==="fly"&&!vehicle}
        canEnterVehicle={canEnterVehicle} canExitVehicle={Math.abs(vehicleSpeed)<.25} onAction={()=>undefined}/>}
      {desktopVisible&&!paused&&!mapOpen&&<DesktopControls send={send} onAction={()=>undefined}
        driving={vehicle!==null} flying={mode==="fly"&&!vehicle}
        canEnterVehicle={canEnterVehicle} canExitVehicle={Math.abs(vehicleSpeed)<.25}/>}
      {mapOpen&&<NorthHeightsExpandedMap position={position} onClose={()=>setMapOpen(false)}/>}
      {paused&&panel==="settings"&&<GTDSettingsOverlay
        location="NORTH HEIGHTS" settings={settings} onClose={close}
        onBack={()=>setPanel("pause")}
        onApply={next=>{save(next);controller.current?.applySettings(next);close();}}
      />}
      {paused&&panel!=="settings"&&<div className="overlay" role="dialog" aria-modal="true"
        aria-label="Pause menu">
        <div className="overlay-content">
          <div className="flex justify-between items-center">
            <span className="system-label text-primary">NORTH HEIGHTS // MERIDIAN CITY // SESSION PAUSED</span>
            <button aria-label="Close pause menu" className="control-button" onClick={close}><X/></button>
          </div>
          <h1 className="overlay-title">{panel==="pause"?"PAUSED.":panel==="objectives"?"OBJECTIVES.":"SAVE / LOAD."}</h1>
          {panel==="pause"?
            <GTDSessionPauseActions onResume={close}
              onObjectives={()=>setPanel("objectives")}
              onSettings={()=>setPanel("settings")}
              onSave={()=>setPanel("save")}/>:
            <div>
              <p className="mb-5">{panel==="objectives"?snapshot.objective:"Save runtime not connected in North Heights trial."}</p>
              <button className="menu-button" onClick={()=>setPanel("pause")}>Back to pause menu</button>
            </div>}
          <details className="overlay-note mt-4" aria-label="North Heights development diagnostics">
            <summary>District diagnostics</summary>
            <p>{status}</p><p>{stats||"Initializing"}</p>
            <small>North Heights reconstruction trial · tree model by 00amza (CC BY 4.0).</small>
          </details>
        </div>
      </div>}
    </main>
  );
}
