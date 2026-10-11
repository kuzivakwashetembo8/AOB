import { describe, expect, it } from "vitest";
import { isMeridiaCharacterTrialRequested } from "../game/character/character-mode";

describe("GTD-CHAR-001 production protagonist activation", () => {
  const productionHosts = [
    "grand-theft-division.vercel.app",
    "gtd-interlinkglobaltech.vercel.app",
    "gtd-git-main-interlinkglobaltech.vercel.app",
  ];
  it("activates rigged locomotion by default for every canonical production alias", () => {
    for (const hostname of productionHosts) {
      expect(isMeridiaCharacterTrialRequested("", hostname)).toBe(true);
      expect(isMeridiaCharacterTrialRequested("?unrelated=1", hostname)).toBe(true);
    }
  });
  it("allows the old capsule only under an explicit emergency override", () => {
    for (const hostname of productionHosts) {
      expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=baseline", hostname)).toBe(false);
      expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=off", hostname)).toBe(false);
    }
  });
  it("does not silently enable the prototype humanoid on arbitrary preview domains", () => {
    for (const hostname of ["gtd-preview.vercel.app", "localhost", "another-game.example"]) {
      expect(isMeridiaCharacterTrialRequested("", hostname)).toBe(false);
      expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=ual", hostname)).toBe(true);
    }
  });
});
