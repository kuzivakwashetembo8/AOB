export type RadioEventType="vehicle_enter"|"vehicle_exit"|"no_stations"|"no_station_selected"|"play_requested"|"playing"|"buffering"|"media_error"|"play_rejected"|"stopped"|"station_selected";
const endpoint="https://ekdsnlforqcliafpmuye.supabase.co/functions/v1/gtd-radio-ingest";
const sessionId=()=>{if(typeof crypto!=="undefined"&&typeof crypto.randomUUID==="function")return crypto.randomUUID();return null;};
export class RadioTelemetry {
 private readonly session=sessionId();
 private sent=0;
 record(eventType:RadioEventType,details:{stationId?:string|null;reason?:string;errorName?:string;audio?:HTMLAudioElement|null}={}){
  if(!this.session||this.sent>=80||typeof window==="undefined")return;
  this.sent++;
  const audio=details.audio;
  const payload={schema:"gtd.radio.v1",sessionId:this.session,eventType,stationId:details.stationId??null,reason:details.reason??null,errorName:details.errorName??null,mediaErrorCode:audio?.error?.code??null,networkState:audio?.networkState??null,readyState:audio?.readyState??null,deviceClass:/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent)?"mobile":"desktop",releaseSha:null};
  try{void fetch(endpoint,{method:"POST",mode:"cors",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});}catch{/* telemetry must never interrupt gameplay */}
 }
}
