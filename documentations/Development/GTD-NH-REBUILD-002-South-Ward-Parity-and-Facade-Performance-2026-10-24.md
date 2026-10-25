# GTD-NH-REBUILD-002 — South Ward road/sky parity and facade-cost reduction

Date: 2026-10-24
Branch: trial/north-heights-reconstruction-001
Status: experimental checkpoint B. Requires owner desktop + mobile visual review.
Production: never changed. No main merge or release.

## Trigger and evidence

The user confirmed the fully native North Heights generator is promising but **not ready**.
The submitted Chrome screenshot shows 142 generated buildings, 22 road axes,
43,436 geometry instances and ~12,472 ms initial generation/load; one on-screen
sample reports 15 FPS. This single visual result is **not** a device-independent
FPS benchmark or an isolated GPU profile.

User requested continuation without further prompting, specific reuse of South Ward
road design and sky, and discretion about the repetitive white rectangular shapes
between blue facade panes. This checkpoint uses a separate branch and isolated
north-heights-preview route. Preserve existing accepted South Ward/main unchanged.

## Road parity

- Borrow accepted SOUTH_WARD_018 local road cross section: 8m asphalt with two lanes,
  3.75m raised pavements on each edge, 0.2m curb profile, centre dashes approximately
  3.2m x 0.14m separated by approximately 9m. Clear dashes at junction mouths.
- Reuse existing core \`createSurfaceTexture\` and \`MATERIAL_FAMILIES\` for asphalt
  aggregate and paving tile patterns; assign consistent world-coordinate UVs.
- Adapt these visuals to procedural North Heights sloping terrain via sampled ribbons.
  Exact source South Ward road generator is not called because it assumes flat terrain.
- Streetlights remain at sidewalk edges. Road geometry is visual only; no Rapier
  collision, traffic connectivity, crosswalk logic, accessible intersections or
  surveyed road topology is claimed yet.

## Skyline and facade corrective pass

- Stop rendering a pale independent cube for every blue window cell. Use darker
  tinted horizontal ribbon glass at a controlled interval of two/three storeys,
  sparse dark mullions, subdued metal roof equipment, and restrained glass specular.
- Group repeating facade boxes via existing Babylon thin-instance batches.
  The first preview had 43,436 instances; new counts must be measured in the
  next browser preview, not guessed from code. Target <12,000 native instances
  without destroying city readability. Material and vertex count are separate.
- Preserve varied massing, roof parapets and landmark towers, lower northern
  residential neighborhoods and the rising North Heights terrain.
- Fix seeded generator RNG scope: each preview world invocation must begin with
  its own deterministic 503021 sequence. Avoid module-global RNG drift.

## Sky parity

- Port the procedural gaussian-splat star field and two-sphere sky model from
  the accepted South Ward Meridian environment code to isolated NH-REBUILD-002.
- Preserve night/dusk/day palette and atmospheric fog; allow user visual inspection
  via the preview SKY selector. Default dusk.
- Mobile star texture resolution reduced to 1024x512 from desktop 2048x1024,
  to limit GPU memory. Sky never fetches Sketchfab/CDNs or other city geometry.
- Do not instantiate the entire main South Ward environment controller in this
  route: it constructs physical lights from First Light roads/garage, incompatible
  with North Heights scene coordinates. Parity is visual and algorithmic.

## Checkpoint B acceptance

1. Vercel preview build must be READY on trial/north-heights-reconstruction-001.
2. The route must return HTTP 200 and link to the expected authored preview code.
3. No city_pack_8.glb request, model or texture in the reconstruction runtime;
   original root source remains unchanged and retains Pasha attribution.
4. User can switch dusk/night/day, inspect star sky and fly with touch/keyboard.
5. Visually confirm actual roads, curbs, fewer stark white facade grids.
6. Measure reported instance count and desktop/mobile FPS. Do not claim successful
   performance improvements from code changes alone. Owner approval is separate.
7. Main code must remain unchanged; no merge until visual checkpoint acceptance.

### Current limitations

- This trial intentionally does not include physics/traffic, accurate lane
  junction mesh merging, vehicle roads, detailed entrances/interiors, NPCs or
  procedural loading partitions.
- Full city still builds synchronously; splitting generation into chunks and
  regional visibility remain important next actions if loading/frame budgets fail.
- No connection between North Heights and the accepted South Ward graph is
  implemented in this branch.
