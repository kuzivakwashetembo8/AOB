import { describe, expect, it } from "vitest";
import { isMeridiaCharacterTrialRequested } from "../game/character/character-mode";

describe("GTD-CHAR-001 canonical protagonist activation", () => {
  const hosts = [
    "grand-theft-division.vercel.app",
    "gtd-interlinkglobaltech.vercel.app",
    "gtd-git-main-interlinkglobaltech.vercel.app",
    "gtd-on4t16b9b-interlinkglobaltech.vercel.app",
    "gtd-preview.vercel.app",
    "localhost",
  ];
  it("uses the rigged humanoid for both production and experimental branches", () => {
    for (const hostname of hosts) {
      expect(isMeridiaCharacterTrialRequested("", hostname)).toBe(true);
      expect(isMeridiaCharacterTrialRequested("?gtdVehicleTrial=1", hostname)).toBe(true);
    }
  });
  it("cannot re-enable the retired capsule with legacy query flags", () => {
    for (const hostname of hosts) {
      expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=baseline", hostname)).toBe(true);
      expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=off", hostname)).toBe(true);
    }
  });
});
