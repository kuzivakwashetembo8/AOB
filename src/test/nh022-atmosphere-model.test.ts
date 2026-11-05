import {describe,it,expect} from "vitest";
import {
 NorthHeightsAtmosphereModel022,scheduledWeather022,
 validateAtmosphereSnapshot022,mixSeed022,
} from "@/game/atmosphere/nh022-atmosphere-model";
import {
 CLOUD_GENERA_022,CLOUD_PRESETS_022,CONDITIONS_022,
} from "@/game/atmosphere/nh022-cloud-presets";

describe("GTD-NH-ATM-022 living sky and manual weather contract",()=>{
 it("defines ten meteorologically distinct visual genera",()=>{
  expect(CLOUD_GENERA_022).toHaveLength(10);
  expect(new Set(CLOUD_GENERA_022)).toHaveLength(10);
  expect(CLOUD_PRESETS_022.Cirrostratus.shape).toBe("veil");
  expect(CLOUD_PRESETS_022.Cumulus.shape).toBe("puffs");
  expect(CLOUD_PRESETS_022.Nimbostratus.shape).toBe("rain");
  for(const genus of CLOUD_GENERA_022){
   const preset=CLOUD_PRESETS_022[genus];
   expect(preset.scale).toBeGreaterThan(0);
   expect(preset.drift).toBeGreaterThan(0);
  }
 });
 it("has a deterministic schedule independent of camera direction",()=>{
  for(let day=0;day<15;day++){
   const before=scheduledWeather022(17171,day,650);
   expect(scheduledWeather022(17171,day,650)).toEqual(before);
   expect(CONDITIONS_022).toContain(before.condition);
   expect(before.episode).toBe(3);
  }
  expect(mixSeed022(10,2,3)).toBe(mixSeed022(10,2,3));
  expect(mixSeed022(10,2,3)).not.toBe(mixSeed022(10,2,4));
 });
 it("advects in place while time is fixed, but freeze holds cloud motion",()=>{
  const model=new NorthHeightsAtmosphereModel022(435433);
  model.syncClock(12*60,2,0);
  const initial=model.render.cloudSeconds;
  model.advance(0.04);
  expect(model.render.cloudSeconds).toBeGreaterThan(initial);
  model.setFrozen(true);
  const frozen=model.render;
  model.advance(0.04);
  model.syncClock(14*60,2,8);
  expect(model.render.cloudSeconds).toBe(frozen.cloudSeconds);
  expect(model.render.blend).toBe(frozen.blend);
  model.setFrozen(false);
  model.advance(0.04);
  expect(model.render.cloudSeconds).toBeGreaterThan(frozen.cloudSeconds);
 });
 it("keeps manual selection until Auto, with a bounded crossfade",()=>{
  const model=new NorthHeightsAtmosphereModel022(8129);
  model.setCondition("Thunderstorm");
  model.setCloudChoice("Cumulonimbus");
  expect(model.status.weatherMode).toBe("Manual");
  expect(model.status.condition).toBe("Thunderstorm");
  expect(model.status.genus).toBe("Cumulonimbus");
  model.advance(.05);
  expect(model.render.blend).toBeGreaterThan(0);
  expect(model.render.blend).toBeLessThanOrEqual(1);
  model.syncClock(600,12,2);
  expect(model.status.condition).toBe("Thunderstorm");
  model.setWeatherMode("Auto");
  expect(model.status.weatherMode).toBe("Auto");
  expect(model.status.condition).toBe(scheduledWeather022(8129,12,600).condition);
 });
 it("captures and restores the seed, position, freeze and overrides",()=>{
  const one=new NorthHeightsAtmosphereModel022(47241);
  one.syncClock(350,18,1);
  one.setCloudChoice("Cirrostratus");
  one.setCondition("Rain");
  one.advance(.04);
  one.setFrozen(true);
  const saved=one.capture();
  expect(validateAtmosphereSnapshot022(saved)).toBe(true);
  const two=new NorthHeightsAtmosphereModel022(1);
  expect(two.restore(saved)).toBe(true);
  expect(two.capture()).toEqual(saved);
  expect(two.render).toEqual(one.render);
  expect(two.restore({...saved,version:2})).toBe(false);
  expect(two.restore({...saved,from:{...saved.from,genus:"Unknown"}})).toBe(false);
 });
});
