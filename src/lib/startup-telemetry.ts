/**
 * GTD-LOAD-061: automatic, nonblocking startup telemetry.
 * Browser → same-origin server → Supabase, with no privileged browser keys.
 */
import type {GameEvent} from "../game/core/types";
declare const __GTD_RELEASE_ID__: string;
declare const __GTD_RELEASE_ENV__: string;
type Checkpoint=Extract<GameEvent,{type:"load-checkpoint"}>;
type AssetEvent=Extract<GameEvent,{type:"asset-observation"}>;
type State={start:number;closed:boolean};
type Span={event_id:string;run_id:string;stage_key:string;asset_id:null;
  start_offset_ms:number;end_offset_ms:number;duration_ms:number;
  status:"done"|"failed"|"skipped"|"aborted";is_blocking:boolean;error_code:null};
type Asset={id:string;run_id:string;asset_id:string;source_kind:string;
  source_bytes_known:number|null;transfer_bytes:number|null;
  container_ready_ms:number|null;instantiate_ms:number|null;
  cache_evidence:string;result:"loaded"|"failed";error_code:null};
export const STARTUP_BUDGET_MS=60000;
const elapsed=(end:number,start:number)=>Math.max(0,Math.round(end-start));
const nonnegative=(value:number|null)=>value!==null&&Number.isFinite(value)
  ?Math.max(0,Math.round(value)):null;
function browserFamily():string{
  const ua=navigator.userAgent;
  if(/Edg\//.test(ua))return "edge";
  if(/Firefox\//.test(ua))return "firefox";
  if(/Chrome\//.test(ua))return "chrome";
  if(/Safari\//.test(ua))return "safari";
  return "unknown";
}
function deviceClass():string{
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)?"mobile":"desktop";
}
function networkClass():string{
  const c=(navigator as Navigator&{connection?:{effectiveType?:string}}).connection;
  const t=c?.effectiveType;
  return t&&["slow-2g","2g","3g","4g"].includes(t)?t:"unknown";
}
function resourceEvidence(assetId:string):{bytes:number|null;cache:string}{
  const entries=performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  const local=entries.filter(e=>assetId.includes("range-rover")
    ?e.name.includes("Range%20Rover%20Sports%202018")
    :assetId.includes("toyota")
      ?e.name.includes("toyota%20hilux%20002.glb")
      :false);
  const entry=local.at(-1);
  if(!entry||entry.transferSize<=0)return {bytes:null,cache:"unknown"};
  return {bytes:entry.transferSize,cache:"network-observed"};
}

export class StartupTelemetry{
  readonly runId:string;
  private readonly startMs:number;
  private readonly startedAt:string;
  private readonly stages=new Map<string,State>();
  private readonly spans:Span[]=[];
  private readonly assets:Asset[]=[];
  private finished=false;
  private backgroundStart:number|null=null;
  private backgroundElapsed=0;
  private detachVisibility:(()=>void)|null=null;

  constructor(startMs:number=performance.now()){
    this.startMs=startMs;
    this.startedAt=new Date().toISOString();
    this.runId=crypto.randomUUID();
    if(document.visibilityState==="hidden")this.backgroundStart=startMs;
    const visibility=()=>{
      const at=performance.now();
      if(document.visibilityState==="hidden"&&this.backgroundStart===null)
        this.backgroundStart=at;
      if(document.visibilityState==="visible"&&this.backgroundStart!==null){
        this.backgroundElapsed+=elapsed(at,this.backgroundStart);
        this.backgroundStart=null;
      }
    };
    document.addEventListener("visibilitychange",visibility);
    this.detachVisibility=()=>document.removeEventListener("visibilitychange",visibility);
  }
  stageStart(key:string,time=performance.now()):void{
    if(this.finished||this.stages.has(key))return;
    this.stages.set(key,{start:time,closed:false});
  }
  stageEnd(key:string,status:Span["status"],time=performance.now()):void{
    if(this.finished)return;
    if(!this.stages.has(key))this.stageStart(key,time);
    const stage=this.stages.get(key)!;
    if(stage.closed)return;
    stage.closed=true;
    const start_offset_ms=elapsed(stage.start,this.startMs);
    const end_offset_ms=elapsed(time,this.startMs);
    this.spans.push({
      event_id:crypto.randomUUID(),run_id:this.runId,stage_key:key,
      asset_id:null,start_offset_ms,end_offset_ms,
      duration_ms:Math.max(0,end_offset_ms-start_offset_ms),
      status,is_blocking:true,error_code:null
    });
  }
  checkpoint(event:Checkpoint):void{
    const key="checkpoint_"+event.id.replace(/-/g,"_");
    if(event.status==="running")this.stageStart(key);
    else this.stageEnd(key,event.status);
  }
  asset(event:AssetEvent):void{
    if(this.finished||this.assets.some(a=>a.asset_id===event.assetId))return;
    const resource=resourceEvidence(event.assetId);
    this.assets.push({
      id:crypto.randomUUID(),run_id:this.runId,asset_id:event.assetId,
      source_kind:event.sourceKind,source_bytes_known:event.sourceBytesKnown,
      transfer_bytes:resource.bytes,
      container_ready_ms:nonnegative(event.containerReadyMs),
      instantiate_ms:nonnegative(event.instantiateMs),
      cache_evidence:resource.cache,result:event.result,error_code:null
    });
  }
  async finish(outcome:"playable"|"failed"|"aborted"|"reloaded",beacon=false):Promise<void>{
    if(this.finished)return;
    this.finished=true;
    const end=performance.now();
    const duration_ms=elapsed(end,this.startMs);
    if(this.backgroundStart!==null){
      this.backgroundElapsed+=elapsed(end,this.backgroundStart);
      this.backgroundStart=null;
    }
    this.detachVisibility?.();
    for(const [key,stage]of this.stages){
      if(stage.closed)continue;
      stage.closed=true;
      const start_offset_ms=elapsed(stage.start,this.startMs);
      this.spans.push({
        event_id:crypto.randomUUID(),run_id:this.runId,stage_key:key,
        asset_id:null,start_offset_ms,end_offset_ms:duration_ms,
        duration_ms:Math.max(0,duration_ms-start_offset_ms),
        status:"aborted",is_blocking:true,error_code:null
      });
    }
    const background_ms=Math.min(duration_ms,this.backgroundElapsed);
    const payload={
      run:{
        run_id:this.runId,
        release_sha:typeof __GTD_RELEASE_ID__==="string"?__GTD_RELEASE_ID__:"development",
        environment:typeof __GTD_RELEASE_ENV__==="string"?__GTD_RELEASE_ENV__:"development",
        started_at:this.startedAt,outcome,duration_ms,budget_ms:STARTUP_BUDGET_MS,
        over_budget:duration_ms>STARTUP_BUDGET_MS,
        device_class:deviceClass(),browser_family:browserFamily(),
        cache_cohort:"unknown",network_class:networkClass(),
        foreground_ms:duration_ms-background_ms,background_ms,trace_id:null
      },
      spans:this.spans.slice(0,40),assets:this.assets.slice(0,12)
    };
    const body=JSON.stringify(payload);
    if(beacon&&typeof navigator.sendBeacon==="function"){
      if(navigator.sendBeacon("/api/telemetry/startup",
          new Blob([body],{type:"application/json"})))return;
    }
    try{
      const result=await fetch("/api/telemetry/startup",{
        method:"POST",headers:{"content-type":"application/json"},
        body,keepalive:true,credentials:"same-origin"
      });
      if(!result.ok)console.warn("[GTD-LOAD-061] Telemetry not accepted",result.status);
    }catch{console.warn("[GTD-LOAD-061] Telemetry transport unavailable");}
  }
}
