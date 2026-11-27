// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent, screen, cleanup } from "@testing-library/react";
import { DrivingArrowHolds } from "../ui/hud/driving-arrow-holds";
import { DrivingArrowControls, TouchControls, visibleTouchActions } from "../ui/hud/touch-controls";
import {DesktopControls} from "../ui/hud/desktop-controls";
import { MovementInputArbiter } from "../game/input/movement-input-arbiter";
import { stepDriveControl } from "../game/vehicles/drive-kinematics";
import { defaults, normalizeDrivingTouchLayout } from "../ui/menus/settings-state";
import { SettingsEditor } from "../ui/menus/settings-editor";

function pointer(element: Element, type: string, pointerId: number) {
  // jsdom's fallback fireEvent.pointerDown does not attach a real pointerId.
  // A native Event with an explicit identifier validates independent fingers.
  const event = Object.assign(new Event(type,{bubbles:true,cancelable:true}),{
    pointerId, pointerType:"touch",
  });
  fireEvent(element,event);
}
afterEach(()=>cleanup());
describe("UI-DRIVE-009 optional vehicle arrows",()=>{
  it("uses the mobile joystick and identical action-button classes on desktop without directional buttons",()=>{
    const send=vi.fn();
    const mobile=render(<TouchControls settings={defaults} send={send} onAction={()=>{}} armed/>);
    const mobileJump=mobile.container.querySelector(".gtd-action-jump");
    expect(mobile.getByRole("group",{name:"Movement joystick"})).toBeTruthy();
    mobile.unmount();
    const desktop=render(<DesktopControls send={send} onAction={()=>{}} armed/>);
    const desktopJump=desktop.container.querySelector(".gtd-action-jump");
    expect(desktop.getByRole("group",{name:"Movement joystick"})).toBeTruthy();
    expect(desktopJump?.className).toBe(mobileJump?.className);
    expect(desktop.container.querySelector(".desktop-movement-pad")).toBeNull();
    expect(desktop.queryByRole("button",{name:/Move forward|Move left|Move right|Move back/})).toBeNull();
    expect(desktop.getByRole("button",{name:"Low crouch"})).toBeTruthy();
  });
  it("shows a latched low-crouch toggle only while armed and sends its selected state",()=>{
    const send=vi.fn();
    const {rerender}=render(<TouchControls settings={defaults} send={send} onAction={()=>{}} armed={false}/>);
    expect(screen.queryByRole("button",{name:"Low crouch"})).toBeNull();
    rerender(<TouchControls settings={defaults} send={send} onAction={()=>{}} armed={true}/>);
    const crouch=screen.getByRole("button",{name:"Low crouch"});
    expect(crouch).toBeTruthy();
    fireEvent.click(crouch);
    expect(send).toHaveBeenCalledWith({type:"action",action:"crouch",pressed:true});
    expect(crouch.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(crouch);
    expect(send).toHaveBeenLastCalledWith({type:"action",action:"crouch",pressed:false});
    rerender(<TouchControls settings={defaults} send={send} onAction={()=>{}} armed={false}/>);
    expect(screen.queryByRole("button",{name:"Low crouch"})).toBeNull();
  });
  it("keeps vehicle controls outside the three-action on-foot row",()=>{
    expect(visibleTouchActions(true).map(a=>a.action)).toEqual([]);
    expect(visibleTouchActions(false).map(a=>a.action)).toEqual(["jump","sprint","combat"]);
    const send=vi.fn();
    const {rerender}=render(<TouchControls settings={{...defaults,drivingTouchLayout:"arrows"}} driving send={send} onAction={()=>{}}/>);
    expect(screen.queryByRole("button",{name:"Enter or exit vehicle"})).toBeNull();
    expect(screen.queryByRole("button",{name:"Aim / combat"})).toBeNull();
    expect(screen.queryByRole("button",{name:"Jump or ascend"})).toBeNull();
    expect(screen.queryByRole("button",{name:"Toggle flight mode"})).toBeNull();
    rerender(<TouchControls settings={{...defaults,drivingTouchLayout:"arrows"}} driving={false} send={send} onAction={()=>{}}/>);
    expect(screen.getByRole("button",{name:"Jump or ascend"})).toBeTruthy();
    expect(screen.queryByRole("button",{name:"Toggle flight mode"})).toBeNull();
  });
  it("preserves drag defaults and rejects unrecognized persisted control layouts",()=>{
    expect(defaults.drivingTouchLayout).toBe("drag");
    expect(normalizeDrivingTouchLayout("arrows")).toBe("arrows");
    expect(normalizeDrivingTouchLayout("missing")).toBe("drag");
    expect(normalizeDrivingTouchLayout(null)).toBe("drag");
    const send=vi.fn();
    render(<TouchControls settings={defaults} driving send={send} onAction={()=>{}}/>);
    expect(screen.getByRole("group",{name:"Movement joystick"})).toBeTruthy();
    expect(screen.queryByRole("group",{name:"Driving arrow controls"})).toBeNull();
  });
  it("shows arrows only for driving and persists selection through settings",()=>{
    const apply=vi.fn();
    const {rerender}=render(<SettingsEditor initialSettings={defaults} onApply={apply}/>);
    fireEvent.click(screen.getByRole("button",{name:"Mobile Controls"}));
    const trigger = screen.getByRole("combobox",{name:"Driving controls"});
    // Radix custom select uses a virtual listbox, not the native select.
    fireEvent.keyDown(trigger,{key:" ",code:"Space"});
    fireEvent.click(screen.getByRole("option",{name:"Arrows"}));
    fireEvent.click(screen.getByRole("button",{name:/apply settings/i}));
    expect(apply).toHaveBeenCalledWith(expect.objectContaining({drivingTouchLayout:"arrows"}));
    rerender(<TouchControls settings={{...defaults,drivingTouchLayout:"arrows"}} driving={false} send={()=>{}} onAction={()=>{}}/>);
    expect(screen.queryByRole("group",{name:"Driving arrow controls"})).toBeNull();
  });
  it("aggregates independent held pointers and releases only their own direction",()=>{
    const h=new DrivingArrowHolds();
    expect(h.press(1,"up")).toEqual({x:0,y:-1});
    expect(h.press(2,"left")).toEqual({x:-1,y:-1});
    expect(h.release(2)).toEqual({x:0,y:-1});
    expect(h.press(3,"down")).toEqual({x:0,y:0});
    expect(h.release(1)).toEqual({x:0,y:1});
    expect(h.reset()).toEqual({x:0,y:0});
    expect(h.release(999)).toEqual({x:0,y:0});
  });
  it("pointer cancel, lost capture and blur release all held input",()=>{
    const send=vi.fn();
    const {unmount}=render(<DrivingArrowControls send={send} haptics={false}/>);
    const up=screen.getByRole("button",{name:"Accelerate"});
    const left=screen.getByRole("button",{name:"Steer left"});
    Object.defineProperty(up,"setPointerCapture",{value:vi.fn()});
    Object.defineProperty(left,"setPointerCapture",{value:vi.fn()});
    pointer(up,"pointerdown",10);
    pointer(left,"pointerdown",11);
    expect(send).toHaveBeenLastCalledWith({type:"move",x:-1,y:-1,source:"touch-arrows"});
    pointer(left,"pointercancel",11);
    expect(send).toHaveBeenLastCalledWith({type:"move",x:0,y:-1,source:"touch-arrows"});
    pointer(up,"lostpointercapture",10);
    expect(send).toHaveBeenLastCalledWith({type:"move",x:0,y:0,source:"touch-arrows"});
    pointer(up,"pointerdown",12);
    window.dispatchEvent(new Event("blur"));
    expect(send).toHaveBeenLastCalledWith({type:"move",x:0,y:0,source:"touch-arrows"});
    unmount();
    expect(send).toHaveBeenLastCalledWith({type:"move",x:0,y:0,source:"touch-arrows"});
  });
  it("does not let keyboard keyup cancel touch throttle",()=>{
    const a=new MovementInputArbiter();
    expect(a.apply({type:"move",x:0,y:-1,source:"touch-arrows"})).toEqual({x:0,y:-1});
    expect(a.apply({type:"move",x:0,y:0,source:"keyboard"})).toEqual({x:0,y:-1});
    expect(a.apply({type:"move",x:-1,y:-1,source:"touch-arrows"})).toEqual({x:-1,y:-1});
    expect(a.apply({type:"move",x:0,y:0,source:"keyboard-reset"})).toEqual({x:-1,y:-1});
    expect(a.apply({type:"move",x:0,y:0,source:"touch-arrows"})).toEqual({x:0,y:0});
  });
  it("quick tap makes a smaller steering angle than continued hold; release recenters without yaw snap",()=>{
    const step=1/60;
    let short={speedMps:0,steeringRadians:0};
    let long={...short};
    for(let i=0;i<4;i++) short=stepDriveControl(short,{throttle:1,steering:-1},step,1.2);
    for(let i=0;i<30;i++) long=stepDriveControl(long,{throttle:1,steering:-1},step,1.2);
    expect(Math.abs(short.steeringRadians)).toBeLessThan(Math.abs(long.steeringRadians));
    expect(Math.abs(long.steeringRadians)).toBeCloseTo(.5);
    for(let i=0;i<30;i++) long=stepDriveControl(long,{throttle:0,steering:0},step,1.2);
    expect(long.steeringRadians).toBe(0);
  });
});
