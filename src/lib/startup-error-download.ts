import type {StartupCheckEntry} from "../game/core/loading-checklist";
/** LOAD-062: user-initiated local diagnostic, never automatic upload. */
export function composeStartupFailureEvidence(
  error:string,entries:readonly StartupCheckEntry[],telemetry:unknown,
  context:{release:string;capturedAt:string},
){
  return {
    schema:"gtd.load062.owner-evidence.v1",
    release:context.release,capturedAt:context.capturedAt,
    failure:error.slice(0,600),
    checkpoints:entries.map(({id,status,detail})=>({
      id,status,detail:detail?.slice(0,280)??null,
    })),
    telemetry,
    note:"User-initiated local JSON export; no credentials, IP, precise location or browser User-Agent.",
  };
}
export function downloadStartupFailureEvidence(
  error:string,entries:readonly StartupCheckEntry[],telemetry:unknown,
  release:string,
):void{
  const result=composeStartupFailureEvidence(error,entries,telemetry,{
    release,capturedAt:new Date().toISOString(),
  });
  const url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{
    type:"application/json"
  }));
  const anchor=document.createElement("a");
  anchor.href=url;
  anchor.download="gtd-load062-"+new Date().toISOString().replace(/[:.]/g,"-")+".json";
  anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
