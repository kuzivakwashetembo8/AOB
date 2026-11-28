import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  advanceReeseAutomaticFireCadence001,
  REESE_AUTOMATIC_FIRE_INTERVAL_MS_001,
} from "../game/character/reese-automatic-fire-012";

describe("COMBAT-002 held automatic-fire cadence", () => {
  it("emits the first repeat only after the configured interval", () => {
    expect(REESE_AUTOMATIC_FIRE_INTERVAL_MS_001).toBe(100);
    expect(advanceReeseAutomaticFireCadence001(0, 99)).toEqual({ shots: 0, elapsedMs: 99 });
    expect(advanceReeseAutomaticFireCadence001(99, 1)).toEqual({ shots: 1, elapsedMs: 0 });
  });

  it("preserves fractional cadence remainder across updates", () => {
    const first = advanceReeseAutomaticFireCadence001(0, 245);
    expect(first).toEqual({ shots: 2, elapsedMs: 45 });
    expect(advanceReeseAutomaticFireCadence001(first.elapsedMs, 55)).toEqual({ shots: 1, elapsedMs: 0 });
  });

  it("does not impose a burst duration or shot-count cap", () => {
    expect(advanceReeseAutomaticFireCadence001(0, 10_000)).toEqual({ shots: 100, elapsedMs: 0 });
  });

  it("ignores negative or non-finite elapsed time", () => {
    expect(advanceReeseAutomaticFireCadence001(-5, Number.NaN)).toEqual({ shots: 0, elapsedMs: 0 });
  });
});

describe("COMBAT-002 integration contracts", () => {
  const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
  it("keeps moving-fire recoil in an upper-body overlay while gait continues", () => {
    const actor = read("src/game/character/reese-player-001.ts");
    expect(actor).toContain("createUpperBodyFireOverlay001");
    expect(actor).toContain(
      "const upperTrack=/(spine1|spine2|neck|head|shoulder|arm|forearm|hand|thumb|index|middle|ring|pinky)\\d*$/i",
    );
    expect(actor).toContain("updateAutomaticFire(dt)");
    expect(actor).not.toContain("combatRemaining=.10");
  });
  it("uses held input for automatic weapons and leaves P-19 single-shot", () => {
    const actor = read("src/game/character/reese-player-001.ts");
    expect(actor).toContain("setCombatHeld(pressed:boolean)");
    expect(actor).toContain("if(!reeseIsLongGun001(selectedWeapon))");
    expect(actor).toContain("setCombatShotHandlers");
    const world = read("src/game/experiments/north-heights-city-8.ts");
    expect(world).toContain('if(event.code==="KeyC")controller.action("combat",false)');
    expect(world).toContain("actor?.setCombatHeld(false)");
    expect(world).toContain("vehicleAudio.startAutomaticFire(weapon,100)");
  });
  it("stops the sustained audio bed on every audio lifecycle boundary", () => {
    const audio = read("src/game/audio/vehicle/procedural-vehicle-audio-021.ts");
    expect(audio).toContain('startAutomaticFire(weapon:"m4a1"|"mpx9",cadenceMs=100)');
    expect(audio).toContain("source.loop=true");
    expect(audio).toContain("source.loopEnd=interval");
    expect(audio).toContain("stopAutomaticFire():void");
    expect(audio).toContain("if(value)this.stopAutomaticFire()");
    expect(audio).toContain("this.stopAutomaticFire();this.closed=true");
  });
});
