// @vitest-environment jsdom
import {describe,expect,it} from "vitest";
import {render,screen,cleanup} from "@testing-library/react";
import {afterEach} from "vitest";
import {
  STARTUP_LOAD_BUDGET_SECONDS,StartupBudgetStopwatch,
  describeStartupBudget,formatStartupDuration,
} from "../game/core/startup-load-budget";
import {BootstrapOverlay} from "../ui/menus/bootstrap";
import {initialStartupChecklist} from "../game/core/loading-checklist";
afterEach(()=>cleanup());
describe("GTD-LOAD-060 one-minute first-playable-frame budget",()=>{
  it("displays elapsed minutes/seconds versus fixed 01:00 even after overruns",()=>{
    expect(STARTUP_LOAD_BUDGET_SECONDS).toBe(60);
    for(const [s,display] of [[0,"00:00"],[1,"00:01"],[59,"00:59"],
      [60,"01:00"],[61,"01:01"],[75,"01:15"],[125,"02:05"]] as const)
      expect(formatStartupDuration(s)).toBe(display);
  });
  it("classifies exactly 60s as within and 61s as attention budget violation",()=>{
    expect(describeStartupBudget(1)).toEqual({exceeded:false,overBySeconds:0,remainingSeconds:59});
    expect(describeStartupBudget(60).exceeded).toBe(false);
    expect(describeStartupBudget(61)).toEqual({exceeded:true,overBySeconds:1,remainingSeconds:0});
    expect(describeStartupBudget(136).overBySeconds).toBe(76);
  });
  it("measures real monotonic time, does not depend on timer ticks and freezes at actual readiness",()=>{
    const clock=new StartupBudgetStopwatch();
    expect(clock.elapsedSecondsAt(900)).toBe(0);
    clock.start(1000);
    clock.start(9000); // StrictMode effect repeat must not reset stopwatch
    expect(clock.elapsedSecondsAt(60500)).toBe(59);
    expect(clock.elapsedSecondsAt(62600)).toBe(61);
    expect(clock.stop(76400)).toBe(75);
    expect(clock.completed).toBe(true);
    expect(clock.elapsedSecondsAt(150000)).toBe(75);
    expect(clock.stop(180000)).toBe(75); // idempotent after first frame
  });
  it("shows a live elapsed counter and clear overrun, not an invented percent",()=>{
    const {rerender}=render(<BootstrapOverlay entries={initialStartupChecklist()} elapsedSeconds={61}/>);
    const overlay=screen.getByRole("status",{name:"Preparing Meridian game"});
    expect(overlay.getAttribute("data-gtd-startup-budget")).toBeNull();
    expect(screen.getByRole("timer",{name:"Elapsed game loading time versus 60-second target"}).getAttribute("data-gtd-startup-budget")).toBe("over");
    expect(screen.getByTestId("startup-clock").textContent).toBe("01:01");
    expect(screen.getByText(/OUTSIDE ATTENTION WINDOW/).textContent).toContain("00:01");
    rerender(<BootstrapOverlay entries={initialStartupChecklist()} elapsedSeconds={20}/>);
    expect(screen.getByRole("timer").getAttribute("data-gtd-startup-budget")).toBe("within");
    expect(screen.getByText(/TIME REMAINING/).textContent).toContain("00:40");
  });
});
