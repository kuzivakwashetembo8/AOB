import {describe,it,expect} from "vitest";
import {parseStartupTelemetry} from "../lib/server/startup-telemetry-ingest";
describe("GTD-LOAD-061 validated startup telemetry",()=>{
  const runId="f87c40c9-12d7-4a10-9cec-9244bc12e213";
  const good=()=>({
    run:{run_id:runId,release_sha:"650a027814cec5bd8cc840bfef15a5ba68198a1c",
      environment:"production",started_at:"2026-10-17T12:00:00.000Z",
      outcome:"playable",duration_ms:61000,budget_ms:60000,over_budget:true,
      device_class:"mobile",browser_family:"chrome",cache_cohort:"unknown",
      network_class:"4g",foreground_ms:61000,background_ms:0,trace_id:null},
    spans:[{event_id:"a87c40c9-12d7-4a10-9cec-9244bc12e213",run_id:runId,
      stage_key:"checkpoint_renderer",asset_id:null,start_offset_ms:100,
      end_offset_ms:250,duration_ms:150,status:"done",
      is_blocking:true,error_code:null}],
    assets:[]
  });
  it("accepts valid records for existing Supabase tables",()=>
    expect(parseStartupTelemetry(good())).not.toBeNull());
  it("rejects a false one-minute verdict",()=>{
    const sample=good();sample.run.over_budget=false;
    expect(parseStartupTelemetry(sample)).toBeNull();
  });
  it("rejects cross-run records",()=>{
    const sample=good();sample.spans[0]!.run_id="f87c40c9-12d7-4a10-9cec-9244bc12e214";
    expect(parseStartupTelemetry(sample)).toBeNull();
  });
  it("rejects extra personal data",()=>
    expect(parseStartupTelemetry({...good(),ip:"127.0.0.1"})).toBeNull());
  it("rejects impossible timing data",()=>{
    const sample=good();sample.spans[0]!.duration_ms=900;
    expect(parseStartupTelemetry(sample)).toBeNull();
  });
});
