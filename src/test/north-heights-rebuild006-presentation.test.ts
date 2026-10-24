import {describe,it,expect} from "vitest";
import {defaults} from "../ui/menus/settings-state";
import {northHeightsHardwareScale006,northHeightsFrameLimit006,northHeightsTouchStyle006}
  from "../game/experiments/north-heights-presentation-006";
describe("NH-006 GTD graphics and control parity",()=>{
  const display={dpr:3,coarse:true,width:740,height:360};
  it("uses shared GTD clarity instead of fixed mobile hardware scaling",()=>{
    const high=northHeightsHardwareScale006({...defaults,quality:"High"},display);
    const low=northHeightsHardwareScale006({...defaults,quality:"Low"},display);
    const ultra=northHeightsHardwareScale006({...defaults,quality:"Ultra"},display);
    expect(low).toBeGreaterThan(high);
    expect(high).toBeGreaterThan(ultra);
    const custom=northHeightsHardwareScale006({
      ...defaults,renderClarity:"Custom",renderScalePercent:100,
    },display);
    const custom50=northHeightsHardwareScale006({
      ...defaults,renderClarity:"Custom",renderScalePercent:50,
    },display);
    expect(custom50).toBeGreaterThan(custom);
  });
  it("uses GTD FPS caps exactly, including uncapped",()=>{
    expect(northHeightsFrameLimit006("30")).toBe(30);
    expect(northHeightsFrameLimit006("60")).toBe(60);
    expect(northHeightsFrameLimit006("120")).toBe(120);
    expect(northHeightsFrameLimit006("Uncapped")).toBe(Infinity);
  });
  it("inherits existing South Ward touch opacity, scale and joystick size",()=>{
    const style=northHeightsTouchStyle006({
      ...defaults,opacity:44,scale:95,joystickSize:130,
    });
    expect(style).toEqual({
      "--control-opacity":.44,
      "--control-scale":.95,
      "--joystick-size":"130px",
    });
  });
});
