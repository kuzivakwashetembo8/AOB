// @vitest-environment jsdom
import {describe,it,expect,vi} from "vitest";
import {render,screen,fireEvent} from "@testing-library/react";
import {BootstrapOverlay} from "../ui/menus/bootstrap";
import {initialStartupChecklist} from "../game/core/loading-checklist";
import {classifyGLBLoadError,loadLocalGLBWithRecovery,LocalGLBImportError}
  from "../game/vehicles/local-glb-retry-062";
import {composeStartupFailureEvidence} from "../lib/startup-error-download";

describe("LOAD-062 native fleet transport failure recovery",()=>{
  it("retries one status:0 request and preserves the same original asset source",async()=>{
    const requests:string[]=[];
    const fetchLocal=vi.fn(async()=>{
      requests.push("/GLBs/Cars/Range%20Rover%20Sports%202018%20(.GLB).glb");
      if(requests.length===1)throw Error("LoadFileError: Error status: 0");
      return {name:"original Rover container"};
    });
    const attempts:number[]=[];
    const result=await loadLocalGLBWithRecovery("Range Rover Sport 2018",fetchLocal,{
      pause:async()=>{},onAttempt:a=>attempts.push(a),
    });
    expect(result.name).toBe("original Rover container");
    expect(requests).toEqual([requests[0],requests[0]]);
    expect(attempts).toEqual([1,2]);
  });
  it("does not retry 404 missing originals or invalid GLB source",async()=>{
    for(const error of ["LoadFileError: Error status: 404",
      "GLTFLoader: invalid glb header"]){
      const fetch=vi.fn(async()=>{throw Error(error);});
      await expect(loadLocalGLBWithRecovery("Range Rover",fetch,{pause:async()=>{}}))
        .rejects.toMatchObject({attempts:1});
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  });
  it("fails closed after second transport failure and gives a named, classified reason",async()=>{
    const fail=vi.fn(async()=>{throw Error("LoadFileError: Error status: 0");});
    await expect(loadLocalGLBWithRecovery("Range Rover",fail,{pause:async()=>{}}))
      .rejects.toMatchObject({code:"transport_status_0",attempts:2,
        name:"LocalGLBImportError"});
    expect(fail).toHaveBeenCalledTimes(2);
    expect(classifyGLBLoadError(new TypeError("Failed to fetch")))
      .toEqual({code:"network_transport",recoverable:true});
    expect(classifyGLBLoadError(new Error("glb corrupted")))
      .toEqual({code:"loader_invalid_asset",recoverable:false});
  });
  it("does not issue a retry after teardown",async()=>{
    let cancelled=false;
    const fail=vi.fn(async()=>{throw Error("Error status: 0");});
    const promise=loadLocalGLBWithRecovery("Rover",fail,{
      cancelled:()=>cancelled,
      pause:async()=>{cancelled=true},
    });
    await expect(promise).rejects.toMatchObject({code:"load_cancelled"});
    expect(fail).toHaveBeenCalledTimes(1);
  });
  it("exposes local JSON during normal loading and startup failure",()=>{
    const download=vi.fn();
    const screenView=render(<BootstrapOverlay entries={initialStartupChecklist()}
      error="Range Rover failed" onDownloadStartupDiagnostics={download}/>);
    fireEvent.click(screen.getByRole("button",{name:"Download measured startup diagnostics (JSON)"}));
    expect(download).toHaveBeenCalledTimes(1);
    const data=composeStartupFailureEvidence("Range Rover failed",
      initialStartupChecklist(),{assets:[{asset_id:"gtd-veh006-mercer-range-rover",
        error_code:"transport_status_0"}]},
      {release:"abc123",capturedAt:"2026-10-19T15:00:00.000Z"});
    expect(data.telemetry).toMatchObject({assets:[{
      asset_id:"gtd-veh006-mercer-range-rover",
      error_code:"transport_status_0",
    }]});
    expect(JSON.stringify(data)).not.toContain("127.0.0.1");
    screenView.unmount();
    const view=render(<BootstrapOverlay entries={initialStartupChecklist()}
      onDownloadStartupDiagnostics={download}/>);
    expect(screen.getByRole("button",
      {name:"Download measured startup diagnostics (JSON)"})).toBeTruthy();
    view.unmount();
  });
});
