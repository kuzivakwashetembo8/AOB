# Meridian City data foundation

Schedule 1 contracts and deterministic resolution live here. This folder is
renderer/physics independent by design. Import the public API from `index.ts`.

- `schema.ts`: stable city/building/road/anchor/opening types.
- `defaults.ts`: archetype defaults and ordered rule resolution.
- `seeded-variation.ts`: feature-keyed deterministic variation.
- `spatial.ts`: world-space facade transforms.
- `validation.ts`: structured validation errors.
- `first-light-spec.ts`: non-rendered regression inventory of First Light.

The live First Light renderer remains `../world/first-light-world.ts` until later
phases demonstrate visual, collision and camera parity.
