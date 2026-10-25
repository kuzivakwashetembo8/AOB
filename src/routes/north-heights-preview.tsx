import {createFileRoute,Link} from "@tanstack/react-router";
import {useEffect,useRef,useState} from "react";
import {ChevronDown,Info,Map,RotateCcw,Settings2,X} from "lucide-react";
import type {NorthHeightsInspection} from "@/game/experiments/north-heights-city-8";
import type {GameCommand} from "@/game/core/types";
import {pageHead} from "@/lib/page-head";
import {useSettings} from "@/ui/menus/settings-state";
import {SettingsEditor} from "@/ui/menus/settings-editor";
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
  const [skyTime,setSkyTime]=useState<"day"|"dusk"|"night">("dusk");
  const [mode,setMode]=useState<"walk"|"fly">("walk");
  const [infoOpen,setInfoOpen]=useState(false);
  const [settingsOpen,setSettingsOpen]=useState(false);
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
  useEffect(()=>{controller.current?.setPaused(settingsOpen);},[settingsOpen]);
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
          note=>{if(!closed)setFeedback(note);});
        if(closed)instance.dispose();
        else{controller.current=instance;instance.applySettings(currentSettings.current);}
      }catch(error){
        if(!closed)setStatus("Viewport failure: "+(error instanceof Error?error.message:String(error)));
      }
    };
    void start();
    return()=>{closed=true;controller.current?.dispose();controller.current=null;};
  },[]);
  const close=()=>{controller.current?.setPaused(false);setSettingsOpen(false);};
  useEffect(()=>{
    if(!settingsOpen)return;
    const key=(e:KeyboardEvent)=>{if(e.key==="Escape")close();};
    window.addEventListener("keydown",key);
    return()=>window.removeEventListener("keydown",key);
  },[settingsOpen]);
  const toggleMode=()=>{
    const next=mode==="walk"?"fly":"walk";
    if(controller.current?.setMode(next))setMode(next);
  };
  const cycleSky=()=>{
    const next=skyTime==="day"?"dusk":skyTime==="dusk"?"night":"day";
    controller.current?.setTime(next);setSkyTime(next);
  };
  useEffect(()=>{
    if(!feedback)return;
    const timer=window.setTimeout(()=>setFeedback(""),3500);
    return()=>window.clearTimeout(timer);
  },[feedback]);
  const topButton="nh-top-button flex items-center justify-center rounded-md border border-white/25 bg-[#111923]/90 px-2 text-[11px] font-semibold";
  return(
    <main className={"game-shell game-viewport relative h-[100dvh] w-full overflow-hidden bg-[#07111c] text-white"+
      (settings.reducedMotion?" motion-reduced":"")+(settings.contrast?" high-contrast":"")+
      (settings.textSize==="Large"?" large-interface":"")}>
      <canvas ref={canvas} aria-label="North Heights interactive city"
        className="absolute inset-0 h-full w-full" style={{touchAction:"none"}}/>
      <div className="pointer-events-none absolute left-2 top-2 z-20 flex max-w-[43vw] flex-col items-start gap-1">
        <button type="button" aria-label="Toggle North Heights diagnostics"
          aria-expanded={infoOpen} aria-controls="nh-diagnostics"
          onClick={()=>setInfoOpen(v=>!v)}
          className="pointer-events-auto flex h-9 max-w-full items-center gap-1.5 rounded-md border border-white/25 bg-[#111923]/90 px-2.5 text-[11px] font-bold text-amber-400">
          <Info size={14}/><span className="truncate">NORTH HEIGHTS · 006</span>
          <ChevronDown size={13} className={infoOpen?"rotate-180":""}/>
        </button>
        {infoOpen&&<section id="nh-diagnostics" aria-label="North Heights diagnostics"
          className="pointer-events-auto max-h-[50dvh] w-[min(420px,78vw)] overflow-y-auto rounded-lg border border-white/25 bg-[#101923]/95 p-3 text-xs shadow-xl">
          <div className="font-bold text-amber-400">MERIDIAN CITY // 05 NORTH HEIGHTS</div>
          <div className="mt-2" role="status">{status}</div>
          <div className="mt-2 text-white/75">{stats||"Initializing"}</div>
          <div className="mt-2 text-white/60">Drag: look · Arrows/WASD: move · Shift: sprint · Space: jump</div>
          <div className="mt-3 border-t border-white/15 pt-2 text-[10px] text-white/55">
            North Heights experimental trial. City Pack 8 by Pasha (design reference, CC BY 4.0).
            Tree model by 00amza (CC BY 4.0).
          </div>
        </section>}
      </div>
      <nav aria-label="North Heights options"
        className="absolute right-2 top-2 z-20 flex items-center gap-1">
        <button className={topButton} onClick={cycleSky} aria-label="Change sky time">{skyTime.toUpperCase()}</button>
        <button className={topButton+" border-amber-400 bg-amber-500 text-black"}
          onClick={toggleMode} aria-label="Toggle walk and flight">{mode.toUpperCase()}</button>
        <button className={topButton} onClick={()=>controller.current?.reset()} aria-label="Reset camera"><RotateCcw size={16}/></button>
        <button className={topButton} onClick={()=>{setSettingsOpen(true);controller.current?.setPaused(true);}}
          aria-label="Open shared GTD settings"><Settings2 size={17}/></button>
        <Link className={topButton} to="/world" aria-label="World directory"><Map size={16}/></Link>
      </nav>
      {feedback&&!settingsOpen&&<div role="status" className="pointer-events-none absolute bottom-[42%] left-1/2 z-20 max-w-[70vw] -translate-x-1/2 rounded-lg border border-amber-400/40 bg-black/85 px-3 py-2 text-center text-xs text-amber-100">{feedback}</div>}
      {!ready&&!infoOpen&&<div role="status" className={"pointer-events-none absolute left-1/2 top-14 z-10 w-[min(460px,73vw)] -translate-x-1/2 rounded border border-white/15 px-2 py-1 text-center text-xs "+(failed?"bg-red-950/90":"bg-black/70")}>
        {failed?status:"Loading North Heights..."}
      </div>}
      {touchVisible&&!settingsOpen&&<TouchControls settings={settings} send={send} onAction={()=>undefined}/>}
      {desktopVisible&&!settingsOpen&&<DesktopControls send={send} onAction={()=>undefined}/>}
      {settingsOpen&&<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 px-3 py-2">
        <section role="dialog" aria-modal="true" aria-label="GTD North Heights settings"
          className="game-settings-dialog w-[min(960px,100%)] rounded-xl border border-white/25 bg-[#111820] p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between border-b border-white/15 pb-2">
            <b className="text-sm text-amber-400">GTD SETTINGS · NORTH HEIGHTS</b>
            <button type="button" aria-label="Close settings and resume" onClick={close}
              className="flex h-9 w-9 items-center justify-center rounded border border-white/25"><X size={18}/></button>
          </div>
          <SettingsEditor inGame initialSettings={settings} onApply={next=>{
            save(next);controller.current?.applySettings(next);close();
          }}/>
          <p className="mt-2 text-[10px] text-white/55">
            Shared GTD preferences. Clarity, quality, FPS and touch options apply to this preview.
            Vehicle, audio and development diagnostics require their respective game systems.
          </p>
        </section>
      </div>}
      <style>{"\n.nh-top-button{min-width:34px;height:36px}\n.nh-top-button:focus-visible{outline:2px solid #f59e0b}\n@media(max-height:520px){.nh-top-button{height:32px;min-width:32px;padding-inline:6px}.touch-controls{height:155px}.joystick{bottom:0}}\n"}</style>
    </main>
  );
}
