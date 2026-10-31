import {describe,expect,it} from "vitest";
import {
  acousticGear021,acousticStep021,generateAudioNoise021,selectAudibleVehicles021,
  AUDIO021_IDLE_RPM,AUDIO021_MAX_RPM,
} from "./vehicle-audio-model-021";

describe("GTD-AUDIO-021 synthesized Sedan drivetrain model",()=>{
  it("keeps an actual idle frequency while the Sedan is stopped",()=>{
    const idle=acousticStep021({signedSpeedMps:0,throttle:0,braking:0},undefined,.05);
    expect(idle.rpm).toBe(AUDIO021_IDLE_RPM);
    expect(idle.firingHz).toBeGreaterThan(20);
    expect(idle.roadLevel).toBe(0);
  });
  it("moves firing frequency with physical acceleration, not frame rendering",()=>{
    let tone=acousticStep021({signedSpeedMps:0,throttle:0,braking:0},undefined,.05);
    for(let i=0;i<30;i++)tone=acousticStep021(
      {signedSpeedMps:4,throttle:1,braking:0},tone,.05);
    expect(tone.rpm).toBeGreaterThan(1600);
    expect(tone.rpm).toBeLessThan(AUDIO021_MAX_RPM+1);
    expect(tone.roadLevel).toBeGreaterThan(0);
    expect(tone.load).toBeGreaterThan(.6);
  });
  it("uses bounded sound-only gear shifts with hysteresis",()=>{
    expect(acousticGear021(0,1)).toBe(1);
    expect(acousticGear021(3.2,1)).toBe(2);
    expect(acousticGear021(2.25,2)).toBe(2);
    expect(acousticGear021(1,2)).toBe(1);
    expect(acousticGear021(25,1)).toBe(2);
  });
  it("supports reverse motion and invalid numerical telemetry without NaNs",()=>{
    const reverse=acousticStep021(
      {signedSpeedMps:-4,throttle:.5,braking:0},undefined,.05);
    expect(reverse.roadLevel).toBeGreaterThan(0);
    const bad=acousticStep021(
      {signedSpeedMps:Number.POSITIVE_INFINITY,throttle:NaN,braking:Infinity},
      reverse,NaN);
    expect(Number.isFinite(bad.rpm)).toBe(true);
    expect(Number.isFinite(bad.firingHz)).toBe(true);
    expect(Number.isFinite(bad.load)).toBe(true);
  });
  it("prioritizes the one player vehicle while capping nearby AI voices",()=>{
    const agents=Array.from({length:125},(_,i)=>({
      id:"car"+i,x:i*.85,z:0,
    }));
    const selected=selectAudibleVehicles021(agents,{x:0,z:0},"car123",3,20);
    expect(selected).toHaveLength(4);
    expect(selected[0]).toBe("car123");
    expect(new Set(selected).size).toBe(4);
    expect(selected.slice(1).every(x=>x!=="car123")).toBe(true);
  });
  it("generates deterministic, finite in-memory noise without audio file downloads",()=>{
    const one=generateAudioNoise021(48000),two=generateAudioNoise021(48000);
    expect(one.length).toBe(48000);
    expect(one[51]).toBe(two[51]);
    expect(one.every(x=>Number.isFinite(x)&&Math.abs(x)<=1)).toBe(true);
    expect(one[1234]).not.toBe(0);
  });
});
