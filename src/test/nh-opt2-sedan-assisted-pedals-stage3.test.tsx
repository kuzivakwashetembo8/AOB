// @vitest-environment jsdom
import {describe,it,expect,vi,afterEach} from "vitest";
import {render,fireEvent,screen,cleanup} from "@testing-library/react";
import {SedanPassengerPedals,TouchControls} from "@/ui/hud/touch-controls";
import {defaults} from "@/ui/menus/settings-state";

function pointer(element:Element,type:string,pointerId:number){
  const event=Object.assign(new Event(type,{bubbles:true,cancelable:true}),{
    pointerId,pointerType:"touch",
  });
  fireEvent(element,event);
}
afterEach(()=>cleanup());
describe("NH-OPT2-SDN-001 Stage 3 Sedan mobile pedal integration",()=>{
  it("shows one Gas and one Brake while riding with the existing vehicle action",()=>{
    const send=vi.fn();
    render(<TouchControls send={send} settings={defaults} onAction={()=>{}} driving passenger/>);
    expect(screen.getByRole("button",{name:/hold to accelerate sedan/i})).toBeTruthy();
    expect(screen.getByRole("button",{name:/hold to brake sedan/i})).toBeTruthy();
    expect(screen.getByRole("button",{name:/enter or exit vehicle/i})).toBeTruthy();
    expect(screen.queryByRole("group",{name:"Steering arrows"})).toBeNull();
  });

  it("releasing accelerator immediately returns a neutral input request",()=>{
    const send=vi.fn();
    render(<SedanPassengerPedals send={send} haptics={false}/>);
    const gas=screen.getByRole("button",{name:/hold to accelerate sedan/i});
    Object.defineProperty(gas,"setPointerCapture",{value:vi.fn()});
    pointer(gas,"pointerdown",1);
    expect(send).toHaveBeenLastCalledWith({type:"move",x:0,y:-1,source:"touch-arrows"});
    pointer(gas,"pointerup",1);
    expect(send).toHaveBeenLastCalledWith({type:"move",x:0,y:0,source:"touch-arrows"});
  });

  it("Brake wins over simultaneous Gas; releasing Brake restores held Gas",()=>{
    const send=vi.fn();
    render(<SedanPassengerPedals send={send} haptics={false}/>);
    const gas=screen.getByRole("button",{name:/hold to accelerate sedan/i});
    const brake=screen.getByRole("button",{name:/hold to brake sedan/i});
    Object.defineProperty(gas,"setPointerCapture",{value:vi.fn()});
    Object.defineProperty(brake,"setPointerCapture",{value:vi.fn()});
    pointer(gas,"pointerdown",1);
    pointer(brake,"pointerdown",2);
    expect(send).toHaveBeenLastCalledWith({type:"move",x:0,y:1,source:"touch-arrows"});
    pointer(brake,"pointerup",2);
    expect(send).toHaveBeenLastCalledWith({type:"move",x:0,y:-1,source:"touch-arrows"});
    pointer(gas,"pointercancel",1);
    expect(send).toHaveBeenLastCalledWith({type:"move",x:0,y:0,source:"touch-arrows"});
  });

  it("losing focus clears held Gas and does not stick after unmount",()=>{
    const send=vi.fn();
    const {unmount}=render(<SedanPassengerPedals send={send} haptics={false}/>);
    const gas=screen.getByRole("button",{name:/hold to accelerate sedan/i});
    Object.defineProperty(gas,"setPointerCapture",{value:vi.fn()});
    pointer(gas,"pointerdown",3);
    window.dispatchEvent(new Event("blur"));
    expect(send).toHaveBeenLastCalledWith({type:"move",x:0,y:0,source:"touch-arrows"});
    unmount();
    expect(send).toHaveBeenLastCalledWith({type:"move",x:0,y:0,source:"touch-arrows"});
  });
});
