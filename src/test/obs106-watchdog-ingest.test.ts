// @vitest-environment jsdom
import {describe,it,expect} from "vitest";
import {parseObs106Payload} from "../lib/server/obs106-telemetry-ingest";
const sample={
 event_id:"716057c5-45c1-46b2-a75a-05ba3050b82e",
 run_id:"e8d444b1-0fe5-4316-b643-758d787c3a4c",
 release_sha:"40639d196b9b425cc324f836c0b04f781a18c77b",
 recorded_at:"2026-10-20T12:00:00.000Z",
 event_type:"heartbeat",item_id:"world:foliage:1",state:"stalled",
 elapsed_ms:10500,metrics:{main_thread_silence_ms:4200},
};
describe("OBS-106 out-of-band bounded watchdog ingest",()=>{
 it("accepts sanitized heartbeat without personal data",()=>{
  expect(parseObs106Payload({events:[sample]})?.events[0]?.state).toBe("stalled");
 });
 it("rejects unbounded and credential-bearing payloads",()=>{
  expect(parseObs106Payload({events:[{...sample,item_id:"https://x.example?access_token=SECRET"}]})).toBeNull();
  expect(parseObs106Payload({events:[{...sample,metrics:{uri:"x".repeat(200)}}]})).toBeNull();
  expect(parseObs106Payload({events:[sample,sample]})).toBeNull();
  expect(parseObs106Payload({events:[]})).toBeNull();
  expect(parseObs106Payload({events:Array.from({length:61},(_,i)=>({
    ...sample,event_id:String(i).padStart(36,"0")
  }))})).toBeNull();
 });
});
