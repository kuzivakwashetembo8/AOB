# Meridian City generation

Step 1 provides the pure typed city model, validation, rule resolution and deterministic seeded variation. Step 2 provides a pure architectural plan and a Babylon visual adapter. The live First Light renderer remains `../world/first-light-world.ts` until visual, collision and camera parity are proven.

- `schema.ts`, `defaults.ts`, `seeded-variation.ts`, `spatial.ts`, `validation.ts`, `first-light-spec.ts`: Step 1 contracts and First Light regression inventory.
- `architecture-templates.ts`: stable opening/roof fixture template IDs and dimensions.
- `architecture-plan.ts`: pure deterministic massing, facade bays, semantic openings, segmented wall boxes, roof pieces, local footprint/floor elevations.
- `building-generator.ts`: Babylon `generateBuilding(scene, physics, spec, { generatorVersion })` visual-shell adapter with owned-resource disposal. Physics is intentionally not modified.
- `index.ts`: public API.

Typical use (in a separate preview scene, not the live First Light scene):

```ts
assertValidCitySpec(FIRST_LIGHT_CITY_SPEC);
const specs = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
const plan = planBuilding(specs[0]!, FIRST_LIGHT_CITY_SPEC.generatorVersion);
const generated = generateBuilding(scene, null, specs[0]!, {
  generatorVersion: FIRST_LIGHT_CITY_SPEC.generatorVersion,
});
// Later: generated.dispose()
```

Coordinates are local to the building's ground-level footprint centre, except `plan.footprint` which is world-space. The Babylon adapter applies the authored world position and yaw. Generated storefront panels are visual only, not automatically traversable entrances. Physical window/door/garage openings are wall-segmented without runtime CSG. No Rapier colliders, camera blockers, navigation portals, runtime migration or LOD/instancing are claimed at Step 2.
