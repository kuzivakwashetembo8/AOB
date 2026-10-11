import { describe, expect, it } from "vitest";
import {
  isMeridiaCharacterTrialRequested,
  MERIDIA_TRIAL_SOURCE,
} from "../game/character/voight-humanoid-trial";

describe("GTD-CHAR-001 controlled Meridian character trial", () => {
  it("keeps the character opt-in and strictly excludes production hostname", () => {
    expect(isMeridiaCharacterTrialRequested("", "gtd-preview.vercel.app")).toBe(false);
    expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=other", "gtd-preview.vercel.app")).toBe(false);
    expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=ual", "gtd-preview.vercel.app")).toBe(true);
    expect(isMeridiaCharacterTrialRequested("?gtdCharacterTrial=ual", "grand-theft-division.vercel.app")).toBe(false);
  });
  it("uses a pinned documented demonstration asset; never a floating latest URL", () => {
    expect(MERIDIA_TRIAL_SOURCE.sourceBytes).toBe(3749364);
    expect(MERIDIA_TRIAL_SOURCE.referenceCommit).toMatch(/^[a-f0-9]{40}$/);
    expect(MERIDIA_TRIAL_SOURCE.rootUrl).toContain(MERIDIA_TRIAL_SOURCE.referenceCommit);
    expect(MERIDIA_TRIAL_SOURCE.fileName).toBe("ual.glb");
  });
});
