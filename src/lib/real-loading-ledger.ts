/**
 * GTD-OBS-105: measured startup operation ledger.
 * No synthetic percentages, scheduled placeholder entries or network guesses.
 * A resource-timing "loaded" row means a transfer ended; it does NOT mean a
 * GLB was decoded, instantiated, physically admitted or rendered.
 */
export type AuditKind="stage"|"resource"|"asset"|"world"|"physics"|"render"|"main-thread";
export type AuditState="loading"|"loaded"|"failed";
export interface AuditRow {
  id:string;label:string;kind:AuditKind;state:AuditState;
  startedMs:number;endedMs:number|null;durationMs:number;
  detail:string|null;bytes:number|null;transferBytes:number|null;
  error:string|null;
}
export type AuditSnapshot={schema:"gtd.obs105.live.v1";sessionId:string;
  observedAt:string;elapsedMs:number;
  counts:{total:number;loading:number;loaded:number;failed:number};
  rows:AuditRow[];heapUsedBytes:number|null;totalLongTaskMs:number;
  longestLongTaskMs:number;};
const MAX_ROWS=1800;
const MAX_DETAIL=300;
const sanitized=(v:unknown)=>String(v??"").replace(/[\r\n\t]/g," ").slice(0,MAX_DETAIL);
const displayUrl=(value:string)=>{
  try {const url=new URL(value,typeof location==="undefined"?"https://localhost":location.href);
    // Never store bearer URLs, query strings, credentials or hashes.
    return (url.host===(typeof location!=="undefined"?location.host:"localhost")?"":url.host)+
      decodeURIComponent(url.pathname).slice(0,190);
  }catch {return "unidentified resource";}
};
const now=()=>typeof performance!=="undefined"?performance.now():Date.now();
export class RealLoadingLedger{
 readonly sessionId=(typeof crypto!=="undefined"&&"randomUUID"in crypto)?crypto.randomUUID():"local-session";
 private readonly started=now();
 private readonly rows=new Map<string,AuditRow>();
 private readonly observers:PerformanceObserver[]=[];
 private totalLongTaskMs=0;
 private longestLongTaskMs=0;
 private finished=false;
 private observing=false;
 start(id:string,label:string,kind:AuditKind="stage",detail?:string):void{
   if(this.finished||this.rows.has(id))return;
   if(this.rows.size>=MAX_ROWS)return;
   this.rows.set(id,{id,label:sanitized(label),kind,state:"loading",
     startedMs:now(),endedMs:null,durationMs:0,
     detail:detail?sanitized(detail):null,bytes:null,transferBytes:null,error:null});
   console.info("[GTD-OBS-105] BEGIN",kind,id);
 }
 finish(id:string,detail?:string,bytes?:number|null):void{
   const row=this.rows.get(id);
   if(!row||row.state!=="loading")return;
   row.endedMs=now();row.durationMs=Math.max(0,Math.round(row.endedMs-row.startedMs));
   row.state="loaded";
   if(detail)row.detail=sanitized(detail);
   if(bytes!==undefined)row.bytes=bytes;
   console.info("[GTD-OBS-105] DONE",row.kind,id,row.durationMs+"ms",row.detail);
 }
 fail(id:string,error:unknown):void{
   const row=this.rows.get(id);
   if(!row||row.state!=="loading")return;
   row.endedMs=now();row.durationMs=Math.max(0,Math.round(row.endedMs-row.startedMs));
   row.state="failed";row.error=sanitized(error instanceof Error?error.message:error);
   console.error("[GTD-OBS-105] FAILED",row.kind,id,row.durationMs+"ms",row.error);
 }
 measure<T>(id:string,label:string,kind:AuditKind,run:()=>T,detail?:string):T{
   this.start(id,label,kind,detail);
   try{
     const result=run();
     this.finish(id);
     return result;
   }catch(e){this.fail(id,e);throw e;}
 }
 async measureAsync<T>(id:string,label:string,kind:AuditKind,run:()=>Promise<T>,detail?:string):Promise<T>{
   this.start(id,label,kind,detail);
   try {const result=await run();this.finish(id);return result;}
   catch(e){this.fail(id,e);throw e;}
 }
 private recordResource(e:PerformanceResourceTiming):void{
   if(this.finished||this.rows.size>=MAX_ROWS)return;
   const resource=displayUrl(e.name);
   const id="transfer:"+Math.round(e.startTime*100)+":"+resource;
   if(this.rows.has(id))return;
   const type=e.initiatorType||"unknown";
   const responseStatus=(e as PerformanceResourceTiming&{responseStatus?:number}).responseStatus;
   const failed=typeof responseStatus==="number"&&responseStatus>=400;
   const duration=Math.max(0,Math.round(e.duration));
   const report:AuditRow={
     id,label:resource,kind:"resource",state:failed?"failed":"loaded",
     startedMs:e.startTime,endedMs:e.responseEnd,
     durationMs:duration,detail:"transfer completed ("+type+"); decode and GPU upload not implied",
     bytes:e.decodedBodySize>0?e.decodedBodySize:null,
     transferBytes:e.transferSize>0?e.transferSize:null,
     error:failed?"HTTP "+responseStatus:null,
   };
   this.rows.set(id,report);
   if(/\.(glb|gltf|webp|png|jpg|jpeg|ktx2|wasm)(?:$|\?)/i.test(resource))
     console.info("[GTD-OBS-105] TRANSFER",resource,duration+"ms",report.transferBytes);
 }
 private recordLongTask(e:PerformanceEntry):void{
   this.totalLongTaskMs+=e.duration;
   this.longestLongTaskMs=Math.max(this.longestLongTaskMs,e.duration);
   if(this.rows.size>=MAX_ROWS)return;
   const id="longtask:"+Math.round(e.startTime);
   if(this.rows.has(id))return;
   this.rows.set(id,{id,label:"Main-thread blocking task",kind:"main-thread",
     state:"loaded",startedMs:e.startTime,endedMs:e.startTime+e.duration,
     durationMs:Math.round(e.duration),detail:"PerformanceObserver longtask; source not attributed",
     bytes:null,transferBytes:null,error:null});
 }
 startBrowserObservers():void{
   if(this.observing)return;
   this.observing=true;
   if(typeof PerformanceObserver==="undefined"||typeof performance==="undefined")return;
   try{
     performance.setResourceTimingBufferSize?.(2500);
     const observer=new PerformanceObserver(list=>{
       for(const entry of list.getEntries())this.recordResource(entry as PerformanceResourceTiming);
     });
     observer.observe({type:"resource",buffered:true});
     this.observers.push(observer);
   }catch{
     for(const entry of performance.getEntriesByType("resource"))this.recordResource(entry as PerformanceResourceTiming);
   }
   try{
     const observer=new PerformanceObserver(list=>{
       for(const entry of list.getEntries())this.recordLongTask(entry);
     });
     observer.observe({type:"longtask",buffered:true});
     this.observers.push(observer);
   }catch{/* unsupported in the current browser */}
 }
 snapshot():AuditSnapshot{
   const at=now();
   const rows=[...this.rows.values()].map(row=>({...row,
     durationMs:row.state==="loading"?Math.max(0,Math.round(at-row.startedMs)):row.durationMs}));
   const counts={total:rows.length,loading:rows.filter(r=>r.state==="loading").length,
     loaded:rows.filter(r=>r.state==="loaded").length,
     failed:rows.filter(r=>r.state==="failed").length};
   const perf=performance as Performance&{memory?:{usedJSHeapSize:number}};
   return {schema:"gtd.obs105.live.v1",sessionId:this.sessionId,
     observedAt:new Date().toISOString(),elapsedMs:Math.max(0,Math.round(at-this.started)),
     counts,rows,heapUsedBytes:perf?.memory?.usedJSHeapSize??null,
     totalLongTaskMs:Math.round(this.totalLongTaskMs),
     longestLongTaskMs:Math.round(this.longestLongTaskMs)};
 }
 dispose():void{
   this.finished=true;
   for(const observer of this.observers)observer.disconnect();
   this.observers.length=0;
 }
}
export const gtdLoadingLedger=new RealLoadingLedger();
