import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { districts, PLAYABLE_DISTRICT_CODE, playableDistrictRoute } from "../game/world/districts";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("South Ward decommission / North Heights entry policy", () => {
  it("makes North Heights the first selected district without renumbering city sectors", () => {
    expect(districts).toHaveLength(12);
    expect(districts[0]).toMatchObject({ code: "05", name: "North Heights" });
    expect(new Set(districts.map(district => district.code)).size).toBe(12);
    expect(districts.find(district => district.name === "South Ward")?.code).toBe("02");
  });

  it("allows entry only to North Heights; South Ward and every other district are coming soon", () => {
    expect(PLAYABLE_DISTRICT_CODE).toBe("05");
    for (const district of districts) {
      expect(playableDistrictRoute(district.code)).toBe(
        district.code === "05" ? "/north-heights-preview" : null,
      );
    }
    expect(playableDistrictRoute("02")).toBeNull();
    expect(playableDistrictRoute("unknown")).toBeNull();
  });

  it("renders district actions through the shared single-world entry policy", () => {
    const directory = source("src/routes/world.tsx");
    expect(directory).toContain("useState(0)");
    expect(directory).toContain("const playableRoute = playableDistrictRoute(district.code)");
    expect(directory).toContain("!playableDistrictRoute(item.code)");
    expect(directory).toContain("COMING SOON — DISTRICT NOT READY");
    expect(directory).not.toContain('district.code === "02" ? "/game"');
  });

  it("blocks legacy South Ward entry points before they can mount an engine", () => {
    const game = source("src/routes/game.tsx");
    const comparison = source("src/routes/first-light-comparison.tsx");
    const root = source("src/routes/__root.tsx");
    expect(game).toContain('beforeLoad: () => { throw redirect({ to: "/world", replace: true }); }');
    expect(comparison).toContain('beforeLoad: () => { throw redirect({ to: "/world", replace: true }); }');
    expect(root).not.toContain("PersistentGameSession");
    expect(root).not.toContain("gameActive");
    expect(root).toContain("<Outlet />");
  });

  it("leaves the independent North Heights engine, physics and NPC boot path intact", () => {
    const preview = source("src/routes/north-heights-preview.tsx");
    const engine = source("src/game/experiments/north-heights-city-8.ts");
    expect(preview).toContain('createFileRoute("/north-heights-preview")');
    expect(preview).toContain("createNorthHeightsCity8(canvas.current");
    expect(engine).toContain("createNorthHeightsWalk005");
    expect(engine).toContain("NH012TrafficSimulator");
    expect(engine).toContain("loadNorthHeightsPedestrianCharacters001");
  });
});
