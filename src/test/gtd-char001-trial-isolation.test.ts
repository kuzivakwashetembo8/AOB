import { describe, expect, it } from "vitest";
import { NullEngine, PBRMaterial, Scene, StandardMaterial } from "@babylonjs/core";
import {
  capTrialPbrLightUniforms,
  isMeridiaCharacterTrialRequested,
  MERIDIA_TRIAL_SOURCE,
} from "../game/character/voight-humanoid-trial";

describe("GTD-CHAR-001 controlled Meridian character trial", () => {
  it("shows the merged humanoid on main by default but retains an explicit proxy rollback", () => {
    expect(isMeridiaCharacterTrialRequested("", "gtd-preview.vercel.app")).toBe(false);
    expect(isMeridiaCharacterTrialRequested("", "grand-theft-division.vercel.app")).toBe(true);
    expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=other", "grand-theft-division.vercel.app")).toBe(true);
    expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=baseline", "grand-theft-division.vercel.app")).toBe(false);
    expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=ual", "gtd-preview.vercel.app")).toBe(true);
    expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=ual", "grand-theft-division.vercel.app")).toBe(true);
  });
  it("prevents 16-light PBR uniform-buffer overload without changing city StandardMaterials", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const character = new PBRMaterial("trial-character", scene);
      character.maxSimultaneousLights = 16;
      const city = new StandardMaterial("original-city-material", scene);
      city.maxSimultaneousLights = 16;
      expect(capTrialPbrLightUniforms(scene)).toBe(1);
      expect(character.maxSimultaneousLights).toBe(4);
      expect(city.maxSimultaneousLights).toBe(16);
      expect(capTrialPbrLightUniforms(scene)).toBe(0);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });
  it("uses a pinned documented demonstration asset; never a floating latest URL", () => {
    expect(MERIDIA_TRIAL_SOURCE.sourceBytes).toBe(3749364);
    expect(MERIDIA_TRIAL_SOURCE.referenceCommit).toMatch(/^[a-f0-9]{40}$/);
    expect(MERIDIA_TRIAL_SOURCE.rootUrl).toContain(MERIDIA_TRIAL_SOURCE.referenceCommit);
    expect(MERIDIA_TRIAL_SOURCE.fileName).toBe("ual.glb");
  });
});
