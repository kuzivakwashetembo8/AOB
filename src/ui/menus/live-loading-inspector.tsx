import {useMemo,useState} from "react";
import type {AuditKind,AuditRow,AuditSnapshot} from "@/lib/real-loading-ledger";

const order:AuditKind[]=["stage","world","physics","asset","render","resource","main-thread"];
const titles:Record<AuditKind,string>={
 stage:"Startup operations",world:"World generation",physics:"Physics",
 asset:"Imported assets and decoding",render:"GPU / first frame",
 resource:"Completed resource transfers", "main-thread":"Main-thread stalls",
};
const icon=(state:AuditRow["state"])=>state==="loaded"?"✓":state==="failed"?"✕":"◌";
const timing=(value:number)=>value<1000?Math.round(value)+" ms":(value/1000).toFixed(2)+" s";
const bytes=(value:number|null)=>value===null?"":value>=1048576?(value/1048576).toFixed(2)+" MiB":(value/1024).toFixed(1)+" KiB";
export function LiveLoadingInspector({snapshot}:{snapshot:AuditSnapshot}){
 const [filter,setFilter]=useState("");
 const [expanded,setExpanded]=useState<Partial<Record<AuditKind,boolean>>>({});
 const groups=useMemo(()=>order.map(kind=>({
   kind,title:titles[kind],
   rows:snapshot.rows.filter(r=>r.kind===kind&&
      (!filter||[r.label,r.id,r.detail].some(x=>x?.toLowerCase().includes(filter.toLowerCase()))))
     .sort((a,b)=>{
       const value=(s:AuditRow["state"])=>s==="failed"?0:s==="loading"?1:2;
       return value(a.state)-value(b.state)||b.startedMs-a.startedMs;
     }),
 })).filter(g=>g.rows.length),[snapshot,filter]);
 return <section className="gtd-real-ledger" aria-label="Measured resource and game startup diagnostics">
   <div className="gtd-real-ledger-header">
     <span>MEASURED OPERATIONS: {snapshot.counts.total}</span>
     <span>✓ {snapshot.counts.loaded} loaded</span>
     <span>◌ {snapshot.counts.loading} loading</span>
     <span>✕ {snapshot.counts.failed} failed</span>
     <span>LONG TASKS: {timing(snapshot.totalLongTaskMs)}</span>
   </div>
   <div className="gtd-real-search">
     <input aria-label="Filter measured operations" placeholder="Filter assets, stages, requests..."
       value={filter} onChange={e=>setFilter(e.currentTarget.value)}/>
     <small>Only actual operations appear here. Network completion ≠ GLB decoded ≠ GPU ready.</small>
   </div>
   <div className="gtd-real-groups">
     {groups.map(group=><details key={group.kind} className="gtd-real-group"
       open={group.kind==="resource"||group.kind==="main-thread"?undefined:true}>
       <summary>{group.title} · {group.rows.length}
         {group.rows.some(row=>row.state==="loading")?" · ACTIVE":""}</summary>
       <div className="gtd-real-group-rows">
         {group.rows.slice(0,expanded[group.kind]?undefined:80).map(row=><div role="listitem" key={row.id}
           className="gtd-real-row" data-audit-state={row.state} data-audit-kind={row.kind}>
           <span className="gtd-real-icon">{icon(row.state)}</span>
           <span className="gtd-real-row-body">
             <span>{row.label}</span>
             {row.detail&&<small>{row.detail}</small>}
             {row.error&&<small className="text-destructive">{row.error}</small>}
           </span>
           <span className="gtd-real-metric">
             {row.state==="loading"?"loading":row.state==="failed"?"failed":"loaded"}
             <small>{timing(row.durationMs)}</small>
             {row.bytes!==null&&<small>{bytes(row.bytes)}</small>}
             {row.transferBytes!==null&&<small>wire {bytes(row.transferBytes)}</small>}
           </span>
         </div>)}
         {group.rows.length>80&&<button type="button"
           className="text-primary underline gtd-real-more"
           onClick={()=>setExpanded(x=>({...x,[group.kind]:!x[group.kind]}))}>
           {expanded[group.kind]?"Show fewer":`Show all ${group.rows.length} observations`}
         </button>}
       </div>
     </details>)}
   </div>
 </section>;
}
