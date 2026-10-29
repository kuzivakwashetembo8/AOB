/** WORLD-OPT-001 browser adapter. Opt-in by ?worldPerf=1; no implicit global listeners. */
import {createWorldOpt001Collector,type WorldOpt001Snapshot} from "./world-opt-001-collector";
export interface WorldOpt001BrowserSession{
  snapshot():WorldOpt001Snapshot;
  exportJson():string;
  stop():void;
}
export function worldOpt001Enabled(search:string):boolean{
  return new URLSearchParams(search).get("worldPerf")==="1";
}
export function startWorldOpt001BrowserSession(options:{
  search:string;scenario?:string;metrics?:()=>Record<string,number|null>;
  onSnapshot?:(value:WorldOpt001Snapshot)=>void;
  windowObject?:Pick<Window,"requestAnimationFrame"|"cancelAnimationFrame"|"setInterval"|"clearInterval">;
  documentObject?:Pick<Document,"hidden"|"addEventListener"|"removeEventListener">;
}):WorldOpt001BrowserSession|null{
  if(!worldOpt001Enabled(options.search)||typeof window==="undefined")return null;
  const w=options.windowObject??window;
  const d=options.documentObject??document;
  const collector=createWorldOpt001Collector({
    scenario:options.scenario,
    deviceClass:typeof navigator!=="undefined"&&/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)?"mobile":"desktop"
  });
  let active=true,frameId=0;
  const visibility=()=>{if(d.hidden)collector.pause();};
  const frame=(time:number)=>{
    if(!active)return;
    if(d.hidden)collector.pause();else collector.addFrame(time);
    frameId=w.requestAnimationFrame(frame);
  };
  d.addEventListener("visibilitychange",visibility);
  frameId=w.requestAnimationFrame(frame);
  const timer=w.setInterval(()=>{
    if(!active||d.hidden)return;
    try{
      const values=options.metrics?.()??{};
      for(const [name,value] of Object.entries(values))collector.metric(name,value);
      options.onSnapshot?.(collector.snapshot());
    }catch(error){collector.note("Metric adapter failed: "+String(error));}
  },1000);
  return {
    snapshot:()=>collector.snapshot(),
    exportJson:()=>collector.exportJson(),
    stop(){
      if(!active)return;
      active=false;w.cancelAnimationFrame(frameId);w.clearInterval(timer);
      d.removeEventListener("visibilitychange",visibility);
    }
  };
}
