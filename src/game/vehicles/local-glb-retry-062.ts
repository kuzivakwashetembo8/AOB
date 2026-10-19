/** GTD-LOAD-062: one bounded transient transport retry for immutable local GLBs.
 * A rejected glTF decode, missing HTTP file, or failed 3D instantiation is
 * NEVER retried. Original accepted assets and URLs are not modified.
 */
export type LocalGLBLoadErrorCode=
  "transport_status_0"|"network_transport"|"http_error"|
  "loader_invalid_asset"|"loader_failure"|"load_cancelled"|
  "asset_instantiation_failed";

export function classifyGLBLoadError(error:unknown):{
  code:LocalGLBLoadErrorCode;recoverable:boolean
}{
  const msg=error instanceof Error?error.message:String(error);
  if(/(?:Error\s+status|\bstatus)\s*[:=]\s*0\b/i.test(msg))
    return {code:"transport_status_0",recoverable:true};
  if(/(?:Failed to fetch|NetworkError|Network request failed|ERR_CONNECTION_RESET|ERR_NETWORK_CHANGED|ERR_INTERNET_DISCONNECTED|ERR_CONNECTION_CLOSED)/i.test(msg))
    return {code:"network_transport",recoverable:true};
  if(/\b(?:HTTP|status)\s*[:= ]\s*[1-5]\d\d\b|\b(?:403|404|401|410|429|500|503)\b/.test(msg))
    return {code:"http_error",recoverable:false};
  if(/(?:invalid|corrupt|malformed|unsupported|decode|draco|gltf|glb)/i.test(msg))
    return {code:"loader_invalid_asset",recoverable:false};
  return {code:"loader_failure",recoverable:false};
}
export class LocalGLBImportError extends Error{
  constructor(
    readonly label:string,readonly code:LocalGLBLoadErrorCode,
    readonly attempts:number,
  ){
    super("Native vehicle "+label+" failed ("+code+") after "+
      attempts+" request"+(attempts===1?"":"s")+
      ". Network recovery could not complete; original vehicle remains required.");
    this.name="LocalGLBImportError";
  }
}
export async function loadLocalGLBWithRecovery<T>(
  label:string,request:()=>Promise<T>,
  options:{
    readonly cancelled?:()=>boolean;
    readonly onAttempt?:(attempt:number)=>void;
    readonly pause?:(milliseconds:number)=>Promise<void>;
  }={},
):Promise<T>{
  const sleep=options.pause??((ms:number)=>new Promise<void>(
    resolve=>setTimeout(resolve,ms)));
  for(let attempt=1;attempt<=2;attempt++){
    if(options.cancelled?.())
      throw new LocalGLBImportError(label,"load_cancelled",attempt-1);
    options.onAttempt?.(attempt);
    try{return await request();}
    catch(error){
      const classified=classifyGLBLoadError(error);
      if(!classified.recoverable||attempt===2)
        throw new LocalGLBImportError(label,classified.code,attempt);
      await sleep(1200); // 1 retry, same immutable URL and normal cache
    }
  }
  throw new Error("Unreachable GLB loader retry state");
}
