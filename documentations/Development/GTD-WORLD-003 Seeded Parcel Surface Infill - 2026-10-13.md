# WORLD-003 — Seeded South Ward Gap/Parcel Ground Surfaces

**Date:** 2026-10-13 · **Status:** owner-directed developmental preview.

Owner request: replace the brown terrain exposed between South Ward buildings
with **dynamic** pavement, parking and grass rather than single-location
authoring patches.

## Architecture

`planParcelInfill(city)` uses the city/road node envelope, lot footprints,
generatorVersion and a seeded 15-metre land-use cluster to classify 5-metre
ground cells. Nearest parcel, road proximity and building archetype shape the
pavement/parking/grass distribution. Classification changes when CitySpec
changes and is deterministic for repeated runs. The renderer uses **three
thin-instanced batches**, backed by existing urban paving/asphalt materials
and a non-specular grass material. All infill is low ground overlay beneath
elevated roads/sidewalks. It adds no collision, camera blockers, gameplay
entities or parked-car props.

This replaces the former four manually positioned South Ward development
rectangles and three separately authored parking pads. Both the South Ward
parity path and generic CitySpec renderer now use the same planner.

Acceptance: confirm patches are large enough to feel like parcels, not checker
tiles; inspect gap edges, building entrances, sidewalks and raised roads from
flight; verify no z-fighting or brown voids, and performance on mobile.
Geometry and parking **surfaces** are a visual land-use trial, not actual new
parked vehicle availability or interactive garage management.
