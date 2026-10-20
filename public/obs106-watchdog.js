/* OBS-106: independent browser Worker. Heartbeats are emitted even if the
 * game/render/UI main thread is blocked; not guaranteed after process crash.
 * Only sanitized operation IDs and bounded metrics leave the browser.
 */
"use strict";
let runId=null,release="development",startedAt=0,lastMainAt=0;
let lastStage="startup",lastSeenTotal=0,closed=false,queued=[],sending=false;
let sequence=0;
const LIMIT=200;
function safe(v,limit=140){return String(v??"").replace(/[^a-zA-Z0-9_.:|/ -]/g,"_").slice(0,limit)||"unknown";}
function elapsed(){return Math.min(86400000,Math.max(0,Math.round(performance.now()-startedAt)));}
function add(type,id,state,metrics={}){
 if(!runId||closed)return;
 const at=elapsed();
 const evt={event_id:crypto.randomUUID(),run_id:runId,release_sha:release,
  recorded_at:new Date().toISOString(),event_type:type,item_id:safe(id,160),
  state:safe(state,40),elapsed_ms:at,metrics:{}};
 for(const [key,value] of Object.entries(metrics)){
  if(!/^[a-zA-Z0-9_]{1,64}$/.test(key))continue;
  if(typeof value==="string")evt.metrics[key]=safe(value,160);
  else if(typeof value==="number"&&Number.isFinite(value))evt.metrics[key]=Math.round(value);
  else if(typeof value==="boolean")evt.metrics[key]=value;
 }
 queued.push(evt);
 if(queued.length>LIMIT)queued=queued.slice(-LIMIT);
}
async function flush(){
 if(sending||!runId||queued.length===0)return;
 sending=true;
 const batch=queued.splice(0,45);
 try {
  const result=await fetch("/api/telemetry/obs106",{method:"POST",credentials:"same-origin",
    headers:{"content-type":"application/json"},body:JSON.stringify({events:batch}),
    cache:"no-store",keepalive:false});
  if(!result.ok){
    // Avoid hot-looping if the server is unconfigured.
    if(result.status>=500&&sequence<8)queued=batch.concat(queued).slice(-LIMIT);
  }catch{
   if(sequence<8)queued=batch.concat(queued).slice(-LIMIT);
 }finally{sending=false;sequence++;}
}
self.onmessage=function(e){
 const d=e.data;
 if(!d||typeof d!=="object")return;
 if(d.type==="init"&&typeof d.runId==="string"&&/^[0-9a-f-]{36}$/.test(d.runId)&&!runId){
   runId=d.runId;release=safe(d.release,128);
   startedAt=performance.now();lastMainAt=startedAt;
   add("lifecycle","monitor-worker","started",{independent_thread:true});
   void flush();
   return;
 }
 if(!runId)return;
 if(d.type==="mark"){
   lastMainAt=performance.now();
   lastStage=safe(d.item,160);
   lastSeenTotal++;
   if(["load","resource","longtask","lifecycle"].includes(d.eventType))
     add(d.eventType,lastStage,safe(d.state,40),d.metrics??{});
 }
 if(d.type==="ping"){lastMainAt=performance.now();}
 if(d.type==="stop"){
   add("lifecycle","game-ready","completed",{operations:lastSeenTotal});
   void flush();
   closed=true;
 }
};
setInterval(()=>{
 if(!runId||closed)return;
 const unresponsiveMs=Math.max(0,Math.round(performance.now()-lastMainAt));
 add("heartbeat",lastStage,unresponsiveMs>3500?"stalled":"alive",{
   main_thread_silence_ms:unresponsiveMs,observed_operations:lastSeenTotal,
   queued_events:queued.length
 });
 void flush();
},2500);
