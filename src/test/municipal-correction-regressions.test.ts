import { describe, expect, it } from "vitest";
import { NullEngine, Scene, StandardMaterial } from "@babylonjs/core";
import { FIRST_LIGHT_CITY_SPEC } from "../game/world-generation/first-light-spec";
import { resolveCityBuildings } from "../game/world-generation/defaults";
import { planBuilding } from "../game/world-generation/architecture-plan";
import { planFacadeDetails } from "../game/world-generation/facade-details";
import { generateBuilding } from "../game/world-generation/building-generator";
import { isStreetlightClear, planStreetContext } from "../game/world-generation/street-context";
import { createMeridianEnvironment } from "../game/world/environment-controller";

describe("SO-MA: one street object at a time / facade and lamp corrections", () => {
  const buildings = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);

  it("removes unexplained dark facade boxes, not structural walls or real openings", () => {
    let windows = 0;
    for (const building of buildings) {
      const plan = planBuilding(building, FIRST_LIGHT_CITY_SPEC.generatorVersion);
      const details = planFacadeDetails(building, plan);
      const forbidden = new Set(["facade-ac-unit", "facade-wall-light",
        "facade-utility-box", "facade-vent"]);
      expect(details.primitives.filter(p => p.templateId && forbidden.has(p.templateId)))
        .toHaveLength(0);
      windows += plan.openings.filter(o => o.kind === "window").length;
    }
    expect(windows).toBeGreaterThan(10);
  });

  it("keeps a physical storefront LED strip as part of facade generation, even with thin instancing", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const shop = buildings.find(b => b.id === "sw-fl-corner-commercial")!;
      const building = generateBuilding(scene, null, shop, {
        generatorVersion: FIRST_LIGHT_CITY_SPEC.generatorVersion,
        enableFacadeDetails: true,
        batchingMode: "thin-instances",
      });
      const strips = building.meshes.filter(m => m.name.startsWith("generated-led:"));
      expect(strips.length).toBeGreaterThan(0);
      expect(strips.every(m => m.material instanceof StandardMaterial &&
        m.material.name === "ma-facade-led:" + shop.id)).toBe(true);
      const ledMaterial = strips[0]!.material as StandardMaterial;
      const env = createMeridianEnvironment(scene, { enableShadows: false,
        initialMinuteOfDay: 12 * 60, initialTimeScale: 0 });
      expect(ledMaterial.emissiveColor.r).toBeLessThan(0.1);
      env.setTimeMinutes(22 * 60);
      expect(ledMaterial.emissiveColor.r).toBeGreaterThan(1);
      env.dispose();
      building.dispose();
      expect(scene.meshes).toHaveLength(0);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });

  it("rejects both generated and authored street lamp heads that cross building margins", () => {
    const streetlights = planStreetContext(FIRST_LIGHT_CITY_SPEC).items
      .filter(item => item.kind === "streetlight");
    expect(streetlights.length).toBeGreaterThanOrEqual(2);
    for (const lamp of streetlights) {
      expect(isStreetlightClear(lamp, buildings), lamp.id).toBe(true);
      const tip = { x: lamp.position.x + Math.cos(lamp.yawRadians) * 1.03 * lamp.scale,
        z: lamp.position.z - Math.sin(lamp.yawRadians) * 1.03 * lamp.scale };
      expect([tip.x,tip.z].every(Number.isFinite)).toBe(true);
    }
  });

  it("removes all unconfirmed MA municipal props and hydrants/board definitions", () => {
    const props = FIRST_LIGHT_CITY_SPEC.districts.flatMap(d => d.neighborhoods
      .flatMap(n => n.blocks.flatMap(block => block.props ?? [])));
    expect(props.some(p => p.id.startsWith("sw-ma-"))).toBe(false);
    expect(props.some(p => p.templateId === "hydrant" ||
      p.templateId === "shop-board" || p.templateId === "wheelie-bin")).toBe(false);
    const lights = props.filter(p => p.templateId === "streetlight");
    expect(lights.length).toBeGreaterThan(0);
  });
});
