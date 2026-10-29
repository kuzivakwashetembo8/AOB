/** WORLD-OPT-001: bounded, opt-in, browser-local frame instrumentation.
 * Schema-first: no Babylon dependency and no gameplay mutations. */
export const WORLD_OPT_001_SCHEMA = "gtd.world-performance.v1" as const;
export type WorldOpt001Sample = { atMs:number; intervalMs:number };
export type WorldOpt001Summary = {
  count:number; medianMs:number|null;p95Ms:number|null;p99Ms:number|null;
  over50ms:number;over50Rate:number|null;maxMs:number|null;
};
export type WorldOpt001Snapshot = {
  schema:typeof WORLD_OPT_001_SCHEMA;
  scenario:string; startedAt:string; capturedAt:string;
  deviceClass:"mobile"|"desktop"|"unknown";
  samples:WorldOpt001Summary;
  metrics:Record<string,number|null>;
  notes:string[];
};
const finite=(n:number)=>Number.isFinite(n)&&n>=0;
export function worldOpt001Summarize(samples:readonly WorldOpt001Sample[]):WorldOpt001Summary{
  const values=samples.map(s=>s.intervalMs).filter(finite).sort((a,b)=>a-b);
  const count=values.length;
  const quantile=(p:number)=>count?values[Math.ceil(p*count)-1]!:null;
  const over50ms=values.filter(v=>v>50).length;
  return {count,medianMs:quantile(.5),p95Ms:quantile(.95),p99Ms:quantile(.99),
    over50ms,over50Rate:count?over50ms/count:null,maxMs:count?values[count-1]!:null};
}
export function createWorldOpt001Collector(options:{
  scenario?:string;capacity?:number;deviceClass?:"mobile"|"desktop"|"unknown";
  now?:()=>number;clock?:()=>string;
}={}){
  const capacity=Math.max(1,Math.min(36000,Math.floor(options.capacity??3600)));
  const samples:Array<WorldOpt001Sample|undefined>=new Array(capacity);
  const metrics=new Map<string,number|null>();
  const notes:string[]=[];
  const now=options.now??(()=>performance.now());
  const clock=options.clock??(()=>new Date().toISOString());
  const startedAt=clock();
  let size=0,head=0,last:number|null=null,paused=false;
  function addFrame(atMs=now()){
    if(!Number.isFinite(atMs))return;
    if(last!==null&&!paused){
      const intervalMs=atMs-last;
      // Background tabs, sleep and resumed contexts are not gameplay frames.
      if(intervalMs>=0&&intervalMs<=1000){
        samples[head]={atMs,intervalMs};head=(head+1)%capacity;
        size=Math.min(capacity,size+1);
      }
    }
    last=atMs;paused=false;
  }
  function ordered(){
    const out:WorldOpt001Sample[]=[];
    for(let i=0;i<size;i++)out.push(samples[(head-size+i+capacity)%capacity]!);
    return out;
  }
  return {
    addFrame,
    pause(){paused=true;last=null;},
    reset(){size=0;head=0;last=null;paused=false;metrics.clear();notes.length=0;},
    metric(name:string,value:number|null){if(name&&name.length<=100)metrics.set(name,value===null?null:Number.isFinite(value)?value:null);},
    note(value:string){if(notes.length<40)notes.push(value.slice(0,250));},
    snapshot():WorldOpt001Snapshot{
      return {schema:WORLD_OPT_001_SCHEMA,scenario:options.scenario??"unspecified",
        startedAt,capturedAt:clock(),deviceClass:options.deviceClass??"unknown",
        samples:worldOpt001Summarize(ordered()),
        metrics:Object.fromEntries(metrics),notes:[...notes]};
    },
    exportJson(){return JSON.stringify(this.snapshot(),null,2);},
    get sampleCount(){return size;},
  };
}
