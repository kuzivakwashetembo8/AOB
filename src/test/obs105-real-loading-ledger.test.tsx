// @vitest-environment jsdom
import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,render,screen} from "@testing-library/react";
import {RealLoadingLedger} from "../lib/real-loading-ledger";
import {BootstrapOverlay} from "../ui/menus/bootstrap";
import {initialStartupChecklist} from "../game/core/loading-checklist";
afterEach(cleanup);
describe("GTD OBS-105 measured loading ledger",()=>{
 it("only shows genuine operations and never fabricated retired imports",()=>{
   const audit=new RealLoadingLedger();
   expect(audit.snapshot().counts.total).toBe(0);
   audit.start("world:building:A","Generate building A","world");
   expect(audit.snapshot().counts).toEqual({total:1,loading:1,loaded:0,failed:0});
   audit.finish("world:building:A","12 actual meshes");
   audit.start("asset:decode:car","Decode specific car.glb","asset");
   audit.fail("asset:decode:car",new Error("invalid GLB"));
   const snapshot=audit.snapshot();
   expect(snapshot.counts).toEqual({total:2,loading:0,loaded:1,failed:1});
   const view=render(<BootstrapOverlay entries={initialStartupChecklist()}
     measured={snapshot} elapsedSeconds={71}/>);
   expect(screen.getByText("Generate building A")).toBeTruthy();
   expect(screen.getByText("Decode specific car.glb")).toBeTruthy();
   expect(screen.getByText("invalid GLB")).toBeTruthy();
   expect(screen.queryByText(/Retired off-road imports/)).toBeNull();
   expect(screen.getByTestId("startup-clock").textContent).toBe("01:11");
   expect(view.container.querySelector(".gtd-real-groups")).toBeTruthy();
   audit.dispose();
 });
 it("times actual synchronous and asynchronous operations, including failures",async()=>{
   const audit=new RealLoadingLedger();
   const sum=audit.measure("physics:1","Collision batch","physics",()=>5);
   expect(sum).toBe(5);
   await expect(audit.measureAsync("asset:1","GLB decode","asset",
     async()=>{throw Error("decode failed");})).rejects.toThrow("decode failed");
   expect(audit.snapshot().rows.find(r=>r.id==="physics:1")?.state).toBe("loaded");
   expect(audit.snapshot().rows.find(r=>r.id==="asset:1")?.error).toBe("decode failed");
   audit.dispose();
 });
 it("includes bounded diagnostic export fields without a guessed download time",()=>{
   const audit=new RealLoadingLedger();
   audit.start("renderer","Initialize renderer","stage");
   const row=audit.snapshot().rows[0]!;
   expect(row.state).toBe("loading");
   expect(row.endedMs).toBeNull();
   expect(row.transferBytes).toBeNull();
   expect(audit.snapshot().schema).toBe("gtd.obs105.live.v1");
   audit.dispose();
 });
});
