# Meridian City generation

Steps 1–3 are implemented on the dependency branch. The existing First Light scene in `../world/first-light-world.ts` is unchanged; do not replace it before visual and physics parity.

- Step 1: `schema.ts`, `defaults.ts`, `seeded-variation.ts`, `spatial.ts`, `validation.ts`, `first-light-spec.ts` — city data, stable identities and deterministic variation.
- Step 2: `architecture-templates.ts`, `architecture-plan.ts` — pure massing, bays, apertures, roof geometry; `building-generator.ts` — Babylon visual adapter.
- Step 3: `representation-materials.ts` — quantized shared material families, seeded surface recipes; `material-library.ts` — scene-scoped Babylon material reuse and explicit disposal; `facade-details.ts` — deterministic sills, mullions, awnings, utility details and decal hooks; `representation-lod.ts` — distance thresholds, hysteresis, window visual policies; `building-generator.ts` — opt-in detail generation, thin-instance batching and runtime LOD switching.

## Example

```ts
assertValidCitySpec(FIRST_LIGHT_CITY_SPEC);
const specs = resolveCityBuildings(FIRST_LIGHT_CITY_SPEC);
const library = new BuildingMaterialLibrary(scene);
const generated = specs.map((spec) => generateBuilding(scene, null, spec, {
  generatorVersion: FIRST_LIGHT_CITY_SPEC.generatorVersion,
  materialLibrary: library,
  enableFacadeDetails: true,
  batchingMode: "thin-instances",
  initialDistance: 0,
}));

// On camera movement (not in React state):
for (const building of generated) {
  const distance = Math.hypot(
    camera.position.x - building.root.position.x,
    camera.position.z - building.root.position.z,
  );
  building.setRepresentationDistance(distance);
}

// On scene teardown:
for (const building of generated) building.dispose();
library.dispose();
```

The default context preserves Step 2's one-mesh-per-primitive output and does not add optional facade details. Enable detail and batching policies explicitly in a dedicated preview/scene owner. With thin instances, primitive IDs are recorded on batch metadata, not as individually pickable meshes; Step 4 must use the semantic plan for collision and interactions.

Near/medium use the structural shell, while far/skyline switch to mass proxies. These proxies reduce active draw calls, **not total allocated geometry memory**, because the near shell remains cached. A future block streamer must dispose or reconstruct representations as needed. Hysteresis reduces rapid LOD oscillation, but transition fades and visual benchmarking remain pending.

Surface variation includes deterministic tint buckets and future hooks for grime, patching, weathering and UV offsets. Without authored textures/atlases these hooks do not yet produce visible dirt or unique facade imagery. Decal hooks are metadata only, not projected decal meshes. The StandardMaterial library approximates roughness/metal response rather than implementing a complete PBR pipeline.

All dimensions are in metres, with local geometry under the building ground-centre/yaw transform. Physical cutouts remain fixed across visual LOD changes. The generator does not create Rapier colliders, camera blockers, interior portals or navigation, and it is not connected to the live First Light renderer. No automatic deployment.
