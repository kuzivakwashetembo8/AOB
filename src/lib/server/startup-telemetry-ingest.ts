/**
 * GTD-LOAD-061 server-only Supabase transport. Privileged keys never enter Vite.
 * The public endpoint validates strict, bounded, nonidentifying observations.
 */
import { z } from "zod";

const uuid = z.string().uuid();
const name = z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
const milliseconds = z.number().finite().min(0).max(86_400_000);
const run = z.object({
  run_id: uuid, release_sha: name, environment: name,
  started_at: z.string().datetime({ offset: true }),
  outcome: z.enum(["playable", "failed", "aborted", "reloaded"]),
  duration_ms: milliseconds, budget_ms: z.literal(60000), over_budget: z.boolean(),
  device_class: z.enum(["mobile", "desktop", "unknown"]),
  browser_family: z.enum(["edge", "firefox", "chrome", "safari", "other", "unknown"]),
  cache_cohort: z.enum(["unknown", "warm", "cold"]),
  network_class: z.enum(["unknown", "slow-2g", "2g", "3g", "4g"]),
  foreground_ms: milliseconds, background_ms: milliseconds,
  trace_id: uuid.nullable(),
}).strict();
const span = z.object({
  event_id: uuid, run_id: uuid, stage_key: name, asset_id: name.nullable(),
  start_offset_ms: milliseconds, end_offset_ms: milliseconds,
  duration_ms: milliseconds,
  status: z.enum(["done", "failed", "skipped", "aborted"]),
  is_blocking: z.boolean(), error_code: name.nullable(),
}).strict();
const asset = z.object({
  id: uuid, run_id: uuid, asset_id: name,
  source_kind: z.enum(["local-glb", "remote-glb"]),
  source_bytes_known: z.number().int().nonnegative().nullable(),
  transfer_bytes: z.number().int().nonnegative().nullable(),
  container_ready_ms: milliseconds.nullable(),
  instantiate_ms: milliseconds.nullable(),
  cache_evidence: z.enum(["unknown", "network-observed"]),
  result: z.enum(["loaded", "failed"]),
  error_code: name.nullable(),
}).strict();
export const StartupTelemetryPayload = z.object({
  run, spans: z.array(span).max(40), assets: z.array(asset).max(12),
}).strict();
export function parseStartupTelemetry(value: unknown) {
  const result = StartupTelemetryPayload.safeParse(value);
  if (!result.success) return null;
  const valueParsed = result.data;
  const {run, spans, assets} = valueParsed;
  if (run.over_budget !== (run.duration_ms > 60000) ||
      run.foreground_ms + run.background_ms > run.duration_ms + 3 ||
      spans.some(s => s.run_id !== run.run_id ||
        s.end_offset_ms < s.start_offset_ms ||
        Math.abs(s.duration_ms - (s.end_offset_ms-s.start_offset_ms))>3 ||
        s.end_offset_ms > run.duration_ms + 3) ||
      assets.some(a => a.run_id !== run.run_id)) return null;
  return valueParsed;
}
function response(status: number, message: string): Response {
  return new Response(JSON.stringify({message}),{
    status,headers:{"content-type":"application/json","cache-control":"no-store"}
  });
}
async function writeTable(base: string, secret: string,
  table: "gtd_startup_runs"|"gtd_startup_spans"|"gtd_asset_observations",
  conflictColumn: string, value: unknown): Promise<void> {
  if(Array.isArray(value)&&value.length===0) return;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),9000);
  try {
    const result=await fetch(base+"/rest/v1/"+table+"?on_conflict="+conflictColumn,{
      method:"POST",signal:controller.signal,
      headers:{
        apikey:secret,
        ...(secret.startsWith("eyJ")?{Authorization:"Bearer "+secret}:{}),
        "content-type":"application/json",
        Prefer:"resolution=merge-duplicates,return=minimal"
      },
      body:JSON.stringify(value)
    });
    if(!result.ok)throw Error("Supabase "+table+" HTTP "+result.status);
  } finally {clearTimeout(timeout);}
}
export async function handleStartupTelemetry(request:Request):Promise<Response> {
  if(request.method!=="POST")return response(405,"method_not_allowed");
  const origin=request.headers.get("origin");
  const site=request.headers.get("sec-fetch-site");
  if((origin&&origin!==new URL(request.url).origin) ||
     (site&&site!=="same-origin"&&site!=="none"))
    return response(403,"cross_origin");
  if(!request.headers.get("content-type")?.startsWith("application/json"))
    return response(415,"json_required");
  const contentLength=Number(request.headers.get("content-length")??0);
  if(contentLength>48_000)return response(413,"payload_too_large");
  let textBody:string;
  try{textBody=await request.text();}catch{return response(400,"invalid_body");}
  if(textBody.length>48_000)return response(413,"payload_too_large");
  let input:unknown;
  try{input=JSON.parse(textBody);}catch{return response(400,"invalid_json");}
  const payload=parseStartupTelemetry(input);
  if(!payload)return response(422,"invalid_telemetry");
  const base=process.env["SUPABASE_URL"]?.replace(/\/$/,"");
  const secret=process.env["SUPABASE_SECRET_KEY"]||process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if(!base||!secret||!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/.test(base))
    return response(503,"telemetry_unconfigured");
  try{
    await writeTable(base,secret,"gtd_startup_runs","run_id",payload.run);
    await writeTable(base,secret,"gtd_startup_spans","event_id",payload.spans);
    await writeTable(base,secret,"gtd_asset_observations","id",payload.assets);
    return response(202,"recorded");
  }catch(error){
    console.error("[GTD-LOAD-061] Ingestion failed",
      error instanceof Error?error.message:"unknown");
    return response(502,"telemetry_write_failed");
  }
}
