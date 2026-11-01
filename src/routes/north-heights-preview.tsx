import {createFileRoute} from "@tanstack/react-router";
import {useEffect,useRef,useState} from "react";
import {X,ArrowUp,ArrowDown} from "lucide-react";
import type {FinchElevatorState004} from "@/game/experiments/north-heights-finch-lobby-004";
import {RadioController} from "@/game/audio/radio/radio-controller";
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
import {BootstrapOverlay} from "@/ui/menus/bootstrap";
import {initialStartupChecklist} from "@/game/core/loading-checklist";
import {RealLoadingLedger} from "@/lib/real-loading-ledger";
import {startWorldOpt001BrowserSession,type WorldOpt001BrowserSession} from "@/game/performance/world-opt-001-browser";
import type {WorldOpt001Snapshot} from "@/game/performance/world-opt-001-collector";

export const Route=createFileRoute("/north-heights-preview")({
  head:()=>pageHead("North Heights · Procedural Reconstruction",
    "Isolated North Heights walking and flying, with shared GTD controls."),
  component:NorthHeightsPreview,
});
function NorthHeightsPreview(){
  const canvas=useRef<HTMLCanvasElement>(null),controller=useRef<NorthHeightsInspection|null>(null);
  const radio=useRef<RadioController|null>(null);
  if(!radio.current)radio.current=new RadioController();
  const [radioState,setRadioState]=useState(()=>radio.current!.getSnapshot());
  useEffect(()=>radio.current!.subscribe(()=>setRadioState(radio.current!.getSnapshot())),[]);
  useEffect(()=>()=>{radio.current?.dispose();radio.current=null;},[]);
  const {settings,save}=useSettings();
  const currentSettings=useRef(settings);currentSettings.current=settings;
  const [status,setStatus]=useState("Preparing North Heights");
  const [firstPlayable,setFirstPlayable]=useState(false);
  const loader=useRef<RealLoadingLedger|null>(null);
  if(!loader.current)loader.current=new RealLoadingLedger();
  const [loadingSnapshot,setLoadingSnapshot]=useState(()=>loader.current!.snapshot());
  const [loadingSeconds,setLoadingSeconds]=useState(0);
  const [stats,setStats]=useState("");
  const perfSession=useRef<WorldOpt001BrowserSession|null>(null);
  const [perfSnapshot,setPerfSnapshot]=useState<WorldOpt001Snapshot|null>(null);
  const [meridianMinute,setMeridianMinute]=useState(14*60+53);
  const [meridianSpeed,setMeridianSpeed]=useState(2);
  const [mode,setMode]=useState<"walk"|"fly">("walk");
  const [location,setLocation]=useState("NORTH HEIGHTS // MERIDIAN CITY");
  const [position,setPosition]=useState({x:0,z:-31});
  const [vehicle,setVehicle]=useState<string|null>(null);
  useEffect(()=>{if(vehicle)radio.current?.enterVehicle();else radio.current?.exitVehicle();},[vehicle===null]);
  useEffect(()=>{const visibility=()=>radio.current?.setHidden(document.hidden);document.addEventListener("visibilitychange",visibility);return()=>document.removeEventListener("visibilitychange",visibility);},[]);
  const [vehicleSpeed,setVehicleSpeed]=useState(0);
  const [canEnterVehicle,setCanEnterVehicle]=useState(false);
  const [inside,setInside]=useState(false);
  const [elevator,setElevator]=useState<FinchElevatorState004|null>(null);
  const [mapOpen,setMapOpen]=useState(false);
  const [paused,setPaused]=useState(false);
  useEffect(()=>{radio.current?.setPaused(paused);},[paused]);
  const [panel,setPanel]=useState<"pause"|"settings"|"objectives"|"save">("pause");
  const [feedback,setFeedback]=useState("");
  const [coarse,setCoarse]=useState(false);
  const inputMode=useInputMode();
  const ready=firstPlayable&&status.includes("physics ready");
  const failed=/failed|failure|error/i.test(status);
  const touchVisible=coarse&&!(settings.autoHide&&inputMode==="keyboard");
  const desktopVisible=!coarse&&settings.desktopControls;
  const sedanPassenger=vehicle?.startsWith("Sedan · ")??false;
  const sedanManual=vehicle?.startsWith("Sedan · Manual")??false;
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
  useEffect(()=>{
    const id=window.setInterval(()=>{
      if(!loader.current)return;
      const snapshot=loader.current.snapshot();
      setLoadingSnapshot(snapshot);
      setLoadingSeconds(Math.floor(snapshot.elapsedMs/1000));
    },1000);
    return()=>window.clearInterval(id);
  },[]);
  useEffect(()=>{
    const session=startWorldOpt001BrowserSession({
      search:window.location.search,scenario:"north-heights-preview",
      metrics:()=>({
        "npc.population":100,"traffic.population":125,
        "game.ready":controller.current?1:0,
        "loading.elapsedMs":loader.current?.snapshot().elapsedMs??null
      }),
      onSnapshot:setPerfSnapshot
    });
    perfSession.current=session;
    return()=>{session?.stop();if(perfSession.current===session)perfSession.current=null;};
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
      const ledger=loader.current!;
      ledger.startBrowserObservers();
      ledger.start("nh:bootstrap","North Heights world startup","stage");
      let currentStage:string|null=null,sequence=0;
      try{
        if(!canvas.current)return;
        const {createNorthHeightsCity8}=await import("@/game/experiments/north-heights-city-8");
        if(closed||!canvas.current)return;
        const instance=await createNorthHeightsCity8(canvas.current,
          message=>{if(!closed){
            setStatus(message);
            if(/failed|failure|error/i.test(message)){
              if(currentStage)ledger.fail(currentStage,message);
              ledger.fail("nh:bootstrap",message);
            }else{
              if(currentStage)ledger.finish(currentStage);
              currentStage="nh:stage:"+(++sequence);
              ledger.start(currentStage,message,"world");
            }
          }},
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
          available=>{if(!closed)setCanEnterVehicle(available);},
          ()=>{if(!closed){
            if(currentStage)ledger.finish(currentStage,"First drawn playable North Heights frame");
            ledger.finish("nh:bootstrap","First playable scene frame rendered");
            setFirstPlayable(true);setLoadingSnapshot(ledger.snapshot());
          }},
          state=>{if(!closed)setElevator(state);});
        if(closed)instance.dispose();
        else{
          // First-frame completion is delivered by Babylon onAfterRender, not here.
          controller.current=instance;
          instance.applySettings(currentSettings.current);
          const hour=Math.floor(meridianMinute/60);
          instance.setTime(hour>=6&&hour<17?"day":hour>=17&&hour<20?"dusk":"night");
          instance.setPaused(paused);
        }
      }catch(error){
        ledger.fail("nh:bootstrap",error);
        if(currentStage)ledger.fail(currentStage,error);
        if(!closed){setStatus("Viewport failure: "+(error instanceof Error?error.message:String(error)));setLoadingSnapshot(ledger.snapshot());}
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
    objective:sedanPassenger?
      "Stage 6 · W/Up forward · S/Down brake/reverse · hold Left/Right to steer anywhere · walls solid · P autopilot"
      :"Explore North Heights on foot or in flight",
    health:100,reputation:0,heat:0,speed:vehicleSpeed,vehicle,
    meridianTime:clock,meridianMinuteOfDay:Math.floor(meridianMinute),
    meridianTimeScale:meridianSpeed,interiorState:inside?"inside":"outside",
    flying:mode==="fly"&&!vehicle,
  };
  return(
    <main className={"game-shell game-viewport relative h-[100dvh] w-full overflow-hidden bg-[#07111c] text-white"+
      (settings.reducedMotion?" motion-reduced":"")+(settings.contrast?" high-contrast":"")+
      (settings.textSize==="Large"?" large-interface":"")}>
      {perfSnapshot&&<aside data-testid="world-opt-001-panel"
        className="absolute bottom-16 left-2 z-30 max-w-[min(90vw,300px)] rounded border border-cyan-300/50 bg-black/85 p-2 text-[11px] text-white"
        aria-label="World performance diagnostics">
        <div className="font-semibold">WORLD-OPT-001 · DEVELOPMENT</div>
        <div>Frames: {perfSnapshot.samples.count} · p50: {perfSnapshot.samples.medianMs?.toFixed(1)??"—"} ms</div>
        <div>p95: {perfSnapshot.samples.p95Ms?.toFixed(1)??"—"} ms · p99: {perfSnapshot.samples.p99Ms?.toFixed(1)??"—"} ms</div>
        <div>&gt;50ms: {perfSnapshot.samples.over50ms} · NPC: 100 · Sedan: 125</div>
        <button type="button" className="mt-1 rounded border border-white/50 px-2 py-1"
          onClick={()=>{
            const data=perfSession.current?.exportJson();if(!data)return;
            const url=URL.createObjectURL(new Blob([data],{type:"application/json"}));
            const a=document.createElement("a");a.href=url;a.download="gtd-world-opt-001.json";a.click();
            window.setTimeout(()=>URL.revokeObjectURL(url),3000);
          }}>Export JSON</button>
      </aside>}
      <canvas ref={canvas} aria-label="North Heights interactive city"
        className="absolute inset-0 h-full w-full" style={{touchAction:"none"}}/>
      {ready&&settings.hud&&<GameHud snapshot={snapshot}
        context={vehicle?"driving":"walking"}
        mapSlot={<NorthHeightsMiniMap position={position} onExpand={()=>setMapOpen(true)}/>}
        metadataSlot={<div className="flex flex-col gap-2">{vehicle&&!paused&&<div className="flex items-center gap-2 rounded bg-black/75 px-3 py-2 text-xs text-white" aria-label="Vehicle music"><span>VEHICLE MUSIC · {radioState.status.toUpperCase()}</span><button type="button" onClick={()=>radio.current?.setEnabled(!radioState.preferences.enabled)}>{radioState.preferences.enabled?"OFF":"ON"}</button></div>}{sedanPassenger&&!paused&&<div data-testid="nh-opt2-sedan-passenger"
        className="flex max-w-[min(85vw,360px)] flex-wrap items-center gap-2 rounded bg-black/75 px-3 py-1 text-center text-xs text-white">
        <span>{sedanManual
          ?"STAGE 6 FREE DRIVE · ↑ FORWARD +30% · ↓ BRAKE / REVERSE · HOLD ← → TO STEER · BUILDINGS / TRAFFIC / TREES / LAMPS SOLID"
          :vehicle?.includes("Finch HQ")?"ARRIVED AT FINCH HQ · STOPPED · EXIT AND ENTER LOBBY"
          :vehicle?.includes("Finch route")?"FINCH ROUTE · AUTOMATIC NAVIGATION · DRIVE INPUT CANCELS"
          :"AUTOPILOT · FIRST PEDAL OR TURN TAKES MANUAL CONTROL"}
          {" · "}{vehicleSpeed>.25?"STOP TO EXIT":"F / VEHICLE TO EXIT"}</span>
        <button type="button" data-testid="nh-opt2-stage5-toggle-autopilot"
          className="shrink-0 rounded border border-white/40 bg-white/15 px-2 py-1 font-semibold"
          aria-label={sedanManual?"Switch Sedan to autopilot":"Switch Sedan to manual driving"}
          onClick={()=>controller.current?.toggleSedanAutopilot()}>
          {sedanManual?"AUTO (P)":"MANUAL (P)"}
        </button>
      </div>}</div>}
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
      {ready&&!paused&&(elevator?.available||elevator?.moving)&&
        <div className="absolute right-3 top-[30%] z-30 rounded-lg border border-white/40 bg-black/85 px-3 py-2 text-white"
          aria-label="Finch Headquarters glass elevator">
          {elevator.moving
            ?<div role="status" className="flex flex-col items-center gap-1 text-xs">
              <span>FINCH HQ · LIFT IN MOTION</span>
              <span>HEIGHT {elevator.progress}% · DESTINATION {elevator.direction==="up"?"53":"1"}</span>
            </div>
            :<button type="button" data-testid="finch-elevator-travel"
              onClick={()=>controller.current?.travelFinchElevator()}
              className="flex items-center gap-2 rounded border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold"
              aria-label={elevator.direction==="up"?"Ride elevator up to floor 53":"Ride elevator down to ground floor"}>
              {elevator.direction==="up"?<ArrowUp size={24}/>:<ArrowDown size={24}/>}
              {elevator.direction==="up"?"FLOOR 53":"GROUND FLOOR"}
            </button>}
        </div>}
      {feedback&&!paused&&<div role="status" className="pointer-events-none absolute bottom-[42%] left-1/2 z-20 max-w-[70vw] -translate-x-1/2 rounded-lg border border-amber-400/40 bg-black/85 px-3 py-2 text-center text-xs text-amber-100">{feedback}</div>}
      {!ready&&<BootstrapOverlay entries={initialStartupChecklist()}
        measured={loadingSnapshot} elapsedSeconds={loadingSeconds}
        error={failed?status:null}
        onDownloadStartupDiagnostics={()=>{const data=JSON.stringify(loader.current?.snapshot()??loadingSnapshot,null,2);
          const url=URL.createObjectURL(new Blob([data],{type:"application/json"}));
          const link=document.createElement("a");link.href=url;link.download="gtd-north-heights-loading.json";link.click();
          window.setTimeout(()=>URL.revokeObjectURL(url),3000);}}
      />}
      {touchVisible&&!paused&&!mapOpen&&<TouchControls settings={settings} send={send}
        driving={vehicle!==null} flying={mode==="fly"&&!vehicle}
        passenger={sedanPassenger}
        canEnterVehicle={canEnterVehicle} canExitVehicle={Math.abs(vehicleSpeed)<.25} onAction={()=>undefined}/>}
      {desktopVisible&&!paused&&!mapOpen&&<DesktopControls send={send} onAction={()=>undefined}
        driving={vehicle!==null} flying={mode==="fly"&&!vehicle}
        passenger={sedanPassenger}
        canEnterVehicle={canEnterVehicle} canExitVehicle={Math.abs(vehicleSpeed)<.25}/>}
      {mapOpen&&<NorthHeightsExpandedMap position={position} onClose={()=>setMapOpen(false)}
        vehicleOccupied={sedanPassenger}
        onFinchHQSelect={()=>{
          const routed=controller.current?.driveToFinchHQ()??false;
          if(routed)setMapOpen(false);
          return routed;
        }}/>} 
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
