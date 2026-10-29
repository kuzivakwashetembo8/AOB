import {describe,it,expect} from "vitest";
import {createWorldOpt001Collector,worldOpt001Summarize,WORLD_OPT_001_SCHEMA} from "../game/performance/world-opt-001-collector";
describe("WORLD-OPT-001 schema and bounded collector",()=>{
 it("uses nearest-rank percentiles and counts long frames",()=>{
  expect(worldOpt001Summarize([10,20,30,60,80].map((intervalMs,i)=>({intervalMs,atMs:i})))).toEqual({
   count:5,medianMs:30,p95Ms:80,p99Ms:80,over50ms:2,over50Rate:.4,maxMs:80
  });
 });
 it("returns null metrics on an empty sample",()=>{
  const x=worldOpt001Summarize([]);
  expect(x.count).toBe(0);expect(x.p99Ms).toBeNull();expect(x.over50Rate).toBeNull();
 });
 it("keeps only newest bounded samples",()=>{
  const c=createWorldOpt001Collector({capacity:2,now:()=>0,clock:()=>"2026-10-29T00:00:00Z"});
  c.addFrame(0);c.addFrame(10);c.addFrame(30);c.addFrame(90);
  expect(c.sampleCount).toBe(2);expect(c.snapshot().samples.medianMs).toBe(20);
  expect(c.snapshot().samples.maxMs).toBe(60);
 });
 it("excludes tab suspension and resume intervals",()=>{
  const c=createWorldOpt001Collector();
  c.addFrame(0);c.addFrame(16);c.pause();c.addFrame(5000);c.addFrame(5016);
  c.addFrame(7000);c.addFrame(7016);
  expect(c.snapshot().samples.count).toBe(3);
 });
 it("exports versioned JSON with metrics and notes",()=>{
  const c=createWorldOpt001Collector({scenario:"flight",deviceClass:"mobile"});
  c.metric("npc.active",100);c.metric("gpu.ms",null);c.note("GPU timing unsupported");
  const result=JSON.parse(c.exportJson());
  expect(result.schema).toBe(WORLD_OPT_001_SCHEMA);
  expect(result.metrics["npc.active"]).toBe(100);
  expect(result.metrics["gpu.ms"]).toBeNull();
  expect(result.notes).toContain("GPU timing unsupported");
 });
 it("resets samples and metadata",()=>{
  const c=createWorldOpt001Collector();c.addFrame(0);c.addFrame(10);c.metric("test",1);c.reset();
  expect(c.snapshot().samples.count).toBe(0);expect(c.snapshot().metrics).toEqual({});
 });
});
