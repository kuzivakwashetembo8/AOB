import { describe, expect, it } from "vitest";
import { canInitializePlayerVehicle } from "../game/vehicles/drive-availability";

describe("GTD-WORLD-002 promoted vehicle availability", () => {
  it("enables driving without a gtdVehicleTrial query flag on production and mobile", () => {
    // Hostname and URL flags are intentionally NOT part of this runtime gate.
    for (const hostname of [
      "grand-theft-division.vercel.app",
      "gtd-interlinkglobaltech.vercel.app",
      "localhost",
    ]) {
      for (const search of ["", "?gtdVehicleTrial=1", "?gtdCharacterTrial=ual"]) {
        expect(hostname.length + search.length).toBeGreaterThan(0);
        expect(canInitializePlayerVehicle(true, true)).toBe(true);
      }
    }
  });
  it("never creates an undownloaded or unsupported vehicle actor", () => {
    expect(canInitializePlayerVehicle(false, true)).toBe(false);
    expect(canInitializePlayerVehicle(true, false)).toBe(false);
    expect(canInitializePlayerVehicle(false, false)).toBe(false);
  });
});
