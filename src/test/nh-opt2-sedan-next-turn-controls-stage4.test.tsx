// @vitest-environment jsdom
import {afterEach,describe,it,expect,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {SedanPassengerPedals,TouchControls} from "@/ui/hud/touch-controls";
import {DesktopControls} from "@/ui/hud/desktop-controls";
import {defaults} from "@/ui/menus/settings-state";

function pointer(element:Element,type:string,pointerId:number){
  const event=Object.assign(new Event(type,{bubbles:true,cancelable:true}),{
    pointerId,pointerType:"touch",
  });
  fireEvent(element,event);
}
afterEach(()=>cleanup());

describe("GTD-NH-OPT2 Stage 4 one-tap junction controls",()=>{
  it("shows the accepted left/right, gas/brake and vehicle action without a free-steering wheel",()=>{
    const send=vi.fn();
    render(<TouchControls send={send} settings={defaults} onAction={()=>{}} driving passenger/>);
    expect(screen.getByRole("button",{name:/choose left turn at next legal junction/i})).toBeTruthy();
    expect(screen.getByRole("button",{name:/choose right turn at next legal junction/i})).toBeTruthy();
    expect(screen.getByRole("button",{name:/hold to accelerate sedan/i})).toBeTruthy();
    expect(screen.getByRole("button",{name:/hold to brake sedan/i})).toBeTruthy();
    expect(screen.getByRole("button",{name:/enter or exit vehicle/i})).toBeTruthy();
  });

  it("sends a distinct left-right rising edge and restores neutral on pointer release",()=>{
    const send=vi.fn();
    render(<SedanPassengerPedals send={send} haptics={false}/>);
    const left=screen.getByRole("button",{name:/choose left turn/i});
    const right=screen.getByRole("button",{name:/choose right turn/i});
    Object.defineProperty(left,"setPointerCapture",{value:vi.fn()});
    Object.defineProperty(right,"setPointerCapture",{value:vi.fn()});
    pointer(left,"pointerdown",11);
    expect(send).toHaveBeenLastCalledWith({type:"move",x:-1,y:0,source:"touch-arrows"});
    pointer(left,"pointerup",11);
    expect(send).toHaveBeenLastCalledWith({type:"move",x:0,y:0,source:"touch-arrows"});
    pointer(right,"pointerdown",12);
    expect(send).toHaveBeenLastCalledWith({type:"move",x:1,y:0,source:"touch-arrows"});
    pointer(right,"pointercancel",12);
    expect(send).toHaveBeenLastCalledWith({type:"move",x:0,y:0,source:"touch-arrows"});
  });

  it("maintains accelerator when a one-shot left-turn button is released",()=>{
    const send=vi.fn();
    render(<SedanPassengerPedals send={send} haptics={false}/>);
    const gas=screen.getByRole("button",{name:/hold to accelerate sedan/i});
    const left=screen.getByRole("button",{name:/choose left turn/i});
    Object.defineProperty(gas,"setPointerCapture",{value:vi.fn()});
    Object.defineProperty(left,"setPointerCapture",{value:vi.fn()});
    pointer(gas,"pointerdown",21);
    pointer(left,"pointerdown",22);
    expect(send).toHaveBeenLastCalledWith({type:"move",x:-1,y:-1,source:"touch-arrows"});
    pointer(left,"pointerup",22);
    expect(send).toHaveBeenLastCalledWith({type:"move",x:0,y:-1,source:"touch-arrows"});
    pointer(gas,"pointerup",21);
    expect(send).toHaveBeenLastCalledWith({type:"move",x:0,y:0,source:"touch-arrows"});
  });

  it("retains brake priority while a direction is selected with another finger",()=>{
    const send=vi.fn();
    render(<SedanPassengerPedals send={send} haptics={false}/>);
    const gas=screen.getByRole("button",{name:/hold to accelerate sedan/i});
    const brake=screen.getByRole("button",{name:/hold to brake sedan/i});
    const right=screen.getByRole("button",{name:/choose right turn/i});
    for(const btn of [gas,brake,right])
      Object.defineProperty(btn,"setPointerCapture",{value:vi.fn()});
    pointer(gas,"pointerdown",31);
    pointer(brake,"pointerdown",32);
    pointer(right,"pointerdown",33);
    expect(send).toHaveBeenLastCalledWith({type:"move",x:1,y:1,source:"touch-arrows"});
    window.dispatchEvent(new Event("blur"));
    expect(send).toHaveBeenLastCalledWith({type:"move",x:0,y:0,source:"touch-arrows"});
  });

  it("exposes LEFT/RIGHT on desktop without hiding existing pedals",()=>{
    const send=vi.fn();
    render(<DesktopControls driving passenger send={send} onAction={()=>{}}/>);
    expect(screen.getByRole("button",{name:/choose next legal left turn/i})).toBeTruthy();
    expect(screen.getByRole("button",{name:/choose next legal right turn/i})).toBeTruthy();
    expect(screen.getByRole("button",{name:/hold to brake sedan/i})).toBeTruthy();
    expect(screen.getByRole("button",{name:/hold to accelerate sedan/i})).toBeTruthy();
  });
});
