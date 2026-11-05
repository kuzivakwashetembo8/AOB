// @vitest-environment jsdom
import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {GameHud} from "@/ui/hud/game-hud";
import {NorthHeightsInformationCentre022} from "@/ui/hud/nh022-information-centre";
import {NorthHeightsAtmosphereModel022} from "@/game/atmosphere/nh022-atmosphere-model";
import type {GameSnapshot} from "@/game/core/types";

const snapshot:GameSnapshot={
 lifecycle:"running",context:"walking",location:"NORTH HEIGHTS",
 objective:"Meet Finch",health:100,reputation:0,heat:0,speed:0,vehicle:null,
 meridianTime:"14:53",meridianMinuteOfDay:893,meridianTimeScale:2,
 interiorState:"outside",flying:false,
};
afterEach(cleanup);
describe("GTD NH-ATM-022 information controls",()=>{
 it("uses the original [i] button as one control-centre entry instead of exposing developer time in the HUD",()=>{
  const open=vi.fn();
  render(<GameHud snapshot={snapshot} context="walking" mode="touch"
   interaction="" pause={()=>{}} showObjective={false}
   setMeridianTime={()=>{}} setMeridianTimeScale={()=>{}}
   onInfo={open} informationOpen={false}/>);
  fireEvent.click(screen.getByRole("button",{name:"Open information"}));
  expect(open).toHaveBeenCalledTimes(1);
  expect(screen.queryByLabelText("Meridian time development controls")).toBeNull();
  expect(screen.getByRole("button",{name:"Pause menu"})).toBeTruthy();
 });
 it("presents a small labelled dialog, custom category select and a working close action",()=>{
  const close=vi.fn(),model=new NorthHeightsAtmosphereModel022(771);
  render(<NorthHeightsInformationCentre022
   snapshot={snapshot} atmosphere={model.status} vehicle={null} vehicleSpeed={0}
   drivingLayout="drag" radioEnabled={false} radioStatus="idle"
   canToggleAutopilot={false} isManualDriving={false}
   onClose={close} onSetTime={()=>{}} onSetSpeed={()=>{}}
   onPauseClock={()=>{}} onResumeClock={()=>{}}
   onWeatherMode={()=>{}} onCondition={()=>{}} onCloudChoice={()=>{}}
   onFreezeAtmosphere={()=>{}} onDrivingLayout={()=>{}}
   onToggleAutopilot={()=>{}} onRadioToggle={()=>{}} onOpenSettings={()=>{}}/>);
  expect(screen.getByRole("dialog",{name:"North Heights information"})).toBeTruthy();
  expect(screen.getByRole("combobox",{name:"Category"})).toBeTruthy();
  expect(screen.getByText("Meet Finch")).toBeTruthy();
  fireEvent.click(screen.getByRole("button",{name:"Close information"}));
  expect(close).toHaveBeenCalledTimes(1);
 });
});
