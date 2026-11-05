/** NH-ATM-022: one compact [i] information modal with a custom Radix category select. */
import {useEffect,useRef,useState} from "react";
import {X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";
import {
 CLOUD_GENERA_022,CONDITIONS_022,
 type CloudChoice022,type WeatherMode022,type WeatherCondition022,
} from "@/game/atmosphere/nh022-cloud-presets";
import type {AtmosphereStatus022} from "@/game/atmosphere/nh022-atmosphere-model";
import type {GameSnapshot} from "@/game/core/types";
import type {DrivingTouchLayout} from "@/ui/menus/settings-state";

export type InformationCategory022="overview"|"time"|"weather"|"vehicles"|"settings";
const categories:readonly {value:InformationCategory022;label:string}[]=[
 {value:"overview",label:"Overview"},{value:"time",label:"Time"},
 {value:"weather",label:"Weather"},{value:"vehicles",label:"Vehicles"},
 {value:"settings",label:"Settings"},
];
function parseMinute(value:string):number|null{
 const p=/^(\d{1,2}):(\d{2})$/.exec(value);
 if(!p)return null;
 const h=Number(p[1]),m=Number(p[2]);
 return Number.isInteger(h)&&h>=0&&h<24&&Number.isInteger(m)&&m>=0&&m<60?h*60+m:null;
}
function ControlSelect({label,value,choices,onValueChange}:{
 label:string;value:string;choices:readonly {value:string;label:string}[];
 onValueChange:(value:string)=>void;
}){
 return <div className="flex min-w-0 flex-col gap-1">
  <span className="text-[11px] tracking-wide text-white/75">{label}</span>
  <Select value={value} onValueChange={onValueChange}>
   <SelectTrigger aria-label={label} className="game-setting-select-trigger w-full">
    <SelectValue/>
   </SelectTrigger>
   <SelectContent className="game-setting-select-content z-[100]" position="popper" sideOffset={4}>
    {choices.map(c=><SelectItem className="game-setting-select-option" key={c.value} value={c.value}>{c.label}</SelectItem>)}
   </SelectContent>
  </Select>
 </div>;
}
const speedChoices=[{value:"0",label:"Paused"},{value:"1",label:"48-minute day"},
 {value:"2",label:"24-minute day"},{value:"8",label:"6-minute day"}];
export function NorthHeightsInformationCentre022(props:{
 snapshot:GameSnapshot;atmosphere:AtmosphereStatus022;vehicle:string|null;vehicleSpeed:number;
 drivingLayout:DrivingTouchLayout;radioEnabled:boolean;radioStatus:string;
 canToggleAutopilot:boolean;isManualDriving:boolean;
 onClose:()=>void;onSetTime:(minute:number)=>void;
 onSetSpeed:(speed:number)=>void;onPauseClock:()=>void;onResumeClock:()=>void;
 onWeatherMode:(mode:WeatherMode022)=>void;
 onCondition:(value:WeatherCondition022)=>void;
 onCloudChoice:(value:CloudChoice022)=>void;
 onFreezeAtmosphere:(frozen:boolean)=>void;
 onDrivingLayout:(value:DrivingTouchLayout)=>void;
 onToggleAutopilot:()=>void;onRadioToggle:()=>void;onOpenSettings:()=>void;
}){
 const [category,setCategory]=useState<InformationCategory022>("overview");
 const closeRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  closeRef.current?.focus();
  return()=>{const button=document.querySelector<HTMLButtonElement>(".gtd-header-reveal");button?.focus();};
 },[]);
 useEffect(()=>{
  const onEscape=(event:KeyboardEvent)=>{
   if(event.key!=="Escape")return;
   // Let an open Radix Select close itself before dismissing the parent.
   if(document.querySelector('[role="listbox"][data-state="open"]'))return;
   event.preventDefault();event.stopPropagation();props.onClose();
  };
  window.addEventListener("keydown",onEscape,true);
  return()=>window.removeEventListener("keydown",onEscape,true);
 },[props.onClose]);
 const a=props.atmosphere;
 return <section role="dialog" aria-modal="true" aria-label="North Heights information"
  data-testid="nh022-information-centre"
  className="poi-game-glass-panel absolute right-[max(12px,env(safe-area-inset-right))] top-[max(60px,calc(env(safe-area-inset-top)+52px))] z-[60] flex max-h-[min(76dvh,520px)] w-[min(92vw,355px)] min-w-0 flex-col overflow-hidden p-3 text-white"
  onKeyDown={event=>event.stopPropagation()}>
  <div className="flex shrink-0 items-center justify-between gap-2 pb-2">
   <span className="system-label text-primary">NORTH HEIGHTS // INFORMATION</span>
   <Button ref={closeRef} variant="control" aria-label="Close information" title="Close information" onClick={props.onClose}>
    <X size={18}/>
   </Button>
  </div>
  <ControlSelect label="Category" value={category} choices={categories}
   onValueChange={value=>setCategory(value as InformationCategory022)}/>
  <div className="mt-3 min-h-0 overflow-y-auto overscroll-contain pr-1 text-xs leading-relaxed">
   {category==="overview"&&<div className="space-y-2">
    <div><span className="text-white/60">Location</span><p>{props.snapshot.location}</p></div>
    <div><span className="text-white/60">Local time</span><p>{props.snapshot.meridianTime} · {props.snapshot.meridianTimeScale}×</p></div>
    <div><span className="text-white/60">Atmosphere</span>
     <p>{a.condition} · {a.genus}{a.secondary?" + "+a.secondary:""}</p>
     <p className="text-white/60">{a.weatherMode} · {a.frozen?"Evolution frozen":"Evolving"}</p>
    </div>
    <div><span className="text-white/60">Vehicle</span><p>{props.vehicle??"On foot"}</p></div>
    <div><span className="text-white/60">Current objective</span><p>{props.snapshot.objective}</p></div>
   </div>}
   {category==="time"&&<div className="space-y-3">
    <label className="flex flex-col gap-1 text-white/75">Meridian time
     <input type="time" aria-label="Set Meridian time" value={props.snapshot.meridianTime}
      onChange={e=>{const t=parseMinute(e.target.value);if(t!==null)props.onSetTime(t);}}
      className="w-full rounded border border-white/20 bg-black/60 px-3 py-2 text-sm text-white"/>
    </label>
    <div className="grid grid-cols-4 gap-1">{([
     ["Dawn",360],["Noon",720],["Dusk",1080],["Night",0],
    ] as const).map(([label,t])=><button type="button" key={label}
     className="rounded border border-white/20 bg-white/5 px-1 py-2 text-[11px]"
     onClick={()=>props.onSetTime(t)}>{label}</button>)}</div>
    <ControlSelect label="Cycle speed" value={String(props.snapshot.meridianTimeScale)}
     choices={speedChoices} onValueChange={v=>props.onSetSpeed(Number(v))}/>
    <Button variant="menu" className="w-full"
     onClick={props.snapshot.meridianTimeScale===0?props.onResumeClock:props.onPauseClock}>
     {props.snapshot.meridianTimeScale===0?"Resume clock":"Pause clock"}
    </Button>
    <p className="text-white/60">Pausing the clock does not freeze clouds. Use Weather to freeze atmosphere separately.</p>
   </div>}
   {category==="weather"&&<div className="space-y-3">
    <p className="text-white/70">Current: {a.condition} · {a.genus}{a.secondary?" + "+a.secondary:""}</p>
    <ControlSelect label="Weather schedule" value={a.weatherMode}
     choices={[{value:"Auto",label:"Auto · Natural daily cycle"},{value:"Manual",label:"Manual · Keep selected weather"}]}
     onValueChange={v=>props.onWeatherMode(v as WeatherMode022)}/>
    <ControlSelect label="Conditions" value={a.condition}
     choices={CONDITIONS_022.map(c=>({value:c,label:c}))}
     onValueChange={v=>props.onCondition(v as WeatherCondition022)}/>
    <ControlSelect label="Cloud family" value={a.cloudChoice}
     choices={[{value:"Auto",label:"Auto · Appropriate for weather"},
      {value:"Mixed",label:"Mixed clouds"},
      ...CLOUD_GENERA_022.map(c=>({value:c,label:c}))]}
     onValueChange={v=>props.onCloudChoice(v as CloudChoice022)}/>
    <Button variant="menu" className="w-full"
     onClick={()=>props.onFreezeAtmosphere(!a.frozen)}>
     {a.frozen?"Resume atmosphere":"Freeze atmosphere"}
    </Button>
    <p className="text-white/60">
     {a.frozen?"Cloud movement and weather evolution are frozen.":
      a.weatherMode==="Auto"?"Cloud cover, form and weather change with Meridian's daily cycle.":
       "Manual weather holds its selection while clouds continue drifting."}
    </p>
   </div>}
   {category==="vehicles"&&<div className="space-y-3">
    <p>{props.vehicle??"On foot — enter a vehicle to access its active controls."}</p>
    <ControlSelect label="Mobile driving controls" value={props.drivingLayout}
     choices={[{value:"drag",label:"Drag steering"},{value:"arrows",label:"Four arrows"}]}
     onValueChange={v=>props.onDrivingLayout(v as DrivingTouchLayout)}/>
    {props.vehicle&&<>
     <p className="text-white/70">Speed: {props.vehicleSpeed.toFixed(1)}</p>
     {props.canToggleAutopilot&&<Button variant="menu" className="w-full"
      onClick={props.onToggleAutopilot}>
      {props.isManualDriving?"Enable autopilot":"Enable manual driving"}
     </Button>}
     <div className="flex items-center justify-between gap-2"><span>Vehicle music · {props.radioStatus}</span>
      <Button variant="control" onClick={props.onRadioToggle}>
       {props.radioEnabled?"Disable":"Enable"}
      </Button>
     </div>
    </>}
    {!props.vehicle&&<p className="text-white/60">The driving layout setting is saved for your next vehicle.</p>}
   </div>}
   {category==="settings"&&<div className="space-y-3">
    <p>Graphics, audio, interface and accessibility settings remain in the existing shared settings editor.</p>
    <Button variant="menu" className="w-full" onClick={props.onOpenSettings}>Open full game settings</Button>
   </div>}
  </div>
 </section>;
}
