import {describe,expect,it} from "vitest";
import {
  NH012_PLAYER_RENDER_ENTER_RADIUS,NH012_PLAYER_RENDER_EXIT_RADIUS,
  nh012IsRenderResident,
} from "./nh012-player-residency";

describe("NH-012 player-centred render residency",()=>{
  const centre={x:0,z:0};
  it("admits a nonresident Sedan at the enter boundary",()=>{
    expect(nh012IsRenderResident({x:NH012_PLAYER_RENDER_ENTER_RADIUS,z:0},centre,false)).toBe(true);
  });
  it("keeps a nonresident Sedan outside the enter radius",()=>{
    expect(nh012IsRenderResident({x:NH012_PLAYER_RENDER_ENTER_RADIUS+.01,z:0},centre,false)).toBe(false);
  });
  it("retains a resident Sedan through the wider exit boundary",()=>{
    expect(nh012IsRenderResident({x:NH012_PLAYER_RENDER_EXIT_RADIUS,z:0},centre,true)).toBe(true);
  });
  it("evicts a resident Sedan only beyond the exit radius",()=>{
    expect(nh012IsRenderResident({x:NH012_PLAYER_RENDER_EXIT_RADIUS+.01,z:0},centre,true)).toBe(false);
  });
  it("keeps pinned player or mission vehicles resident regardless of distance",()=>{
    expect(nh012IsRenderResident({x:1000,z:1000},centre,false,true)).toBe(true);
  });
  it("fails open during initialization when no player centre exists",()=>{
    expect(nh012IsRenderResident({x:1000,z:1000},null,false)).toBe(true);
  });
});
