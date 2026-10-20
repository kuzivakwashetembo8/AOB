/** OBS-106: bounded, same-origin, server-side ingest from an independent
 * monitoring worker. No Supabase credentials are exposed to the browser.
 * Writes the preexisting temporary gtd_foundation_events table.
 */
import {z} from "zod";
const UUID=z.string().uuid();
const id=z.string().min(1).max(160).regex(/^[a-zA-Z0-9_.:|/ -]+$/);
const item=z.object({
 event_id:UUID,run_id:UUID,release_sha:z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/),
 recorded_at:z.string().datetime({offset:true}),
 event_type:z.enum(["load","resource","longtask","heartbeat","lifecycle"]),
 item_id:id,state:z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/),
 elapsed_ms:z.number().int().min(0).max(86400000),
 metrics:z.record(z.string(),z.union([z.string().max(160),z.number().finite(),z.boolean(),z.null()])),
}).strict();
export const Obs106Payload=z.object({events:z.array(item).min(1).max(60)}).strict();
const json=(status:number,message:string)=>new Response(JSON.stringify({message}),{
 status,headers:{"content-type":"application/json","cache-control":"no-store"}});
export function parseObs106Payload(value:unknown){
 const parsed=Obs106Payload.safeParse(value);
 if(!parsed.success)return null;
 if(new Set(parsed.data.events.map(x=>x.event_id)).size!==parsed.data.events.length)return null;
 return parsed.data;
}
export async function handleObs106Telemetry(req:Request):Promise<Response>{
 if(req.method!=="POST")return json(405,"method_not_allowed");
 const origin=req.headers.get("origin"),url=new URL(req.url);
 const site=req.headers.get("sec-fetch-site");
 if((origin&&origin!==url.origin)||(site&&site!=="same-origin"&&site!=="none"))
   return json(403,"cross_origin");
 if(!req.headers.get("content-type")?.startsWith("application/json"))
   return json(415,"json_required");
 if(Number(req.headers.get("content-length")??0)>25000)return json(413,"too_large");
 let source:string;
 try {source=await req.text();}catch{return json(400,"invalid_body");}
 if(source.length>25000)return json(413,"too_large");
 let payload:unknown;
 try{payload=JSON.parse(source);}catch{return json(400,"invalid_json");}
 const data=parseObs106Payload(payload);
 if(!data)return json(422,"invalid_payload");
 const base=process.env["SUPABASE_URL"]?.replace(/\/$/,"");
 const key=process.env["SUPABASE_SECRET_KEY"]??process.env["SUPABASE_SERVICE_ROLE_KEY"];
 if(!base||!key||!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/.test(base))
   return json(503,"not_configured");
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),7000);
 try{
  const res=await fetch(base+"/rest/v1/gtd_foundation_events?on_conflict=event_id",{
   method:"POST",signal:controller.signal,
   headers:{apikey:key,...(key.startsWith("eyJ")?{Authorization:"Bearer "+key}:{}),
     "content-type":"application/json",Prefer:"resolution=ignore-duplicates,return=minimal"},
   body:JSON.stringify(data.events),
  });
  if(!res.ok){console.warn("[OBS-106] ingest failed",res.status);return json(502,"storage_error");}
  return json(202,"recorded");
 }catch{return json(502,"transport_error");}
 finally{clearTimeout(timeout);}
}
