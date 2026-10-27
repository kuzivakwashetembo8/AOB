# Procedure DDD — NH-OPT-011 / North Heights Optimization (FAILED)

**Date:** 2026-10-27 (Africa/Johannesburg)  
**Decision:** **OWNER-REJECTED — DECOMMISSIONED — DO NOT MERGE OR REDEPLOY**  
**Authority:** User directive received 2026-10-27: “Initiate operation DDD on this branch right away. … Decommission this branch right away and await further instructions.”  
**Branch:** `feature/gtd-north-heights-optimization-011-20261027`  
**Failed branch final implementation SHA:** `b7aa5300afc85b052867029dc4aef06e43085ce5`  
**Accepted main baseline at DDD start:** `baa48485bebb0dbb84b54c01ce8e5282cbacf9fd` (owner's original optimized street-lamp GLBs already on main).  
**Original approved technical plan:** `documentations/Development/GTD-NH-OPT-011-North-Heights-Optimization-Comprehensive-Technical-Implementation-Plan-2026-10-27.md` (planning record only, not evidence of accepted implementation).  
**Final branch preview:** `https://gtd-gbalj219b-interlinkglobaltech.vercel.app/north-heights-preview` (SHA `b7aa530`, build READY, **REJECTED**; do not distribute as an accepted build).  
**Owner-reviewed preview:** `https://gtd-3ftdbn9mm-interlinkglobaltech.vercel.app/north-heights-preview` (SHA `1a2cfdd`, READY, **REJECTED**).  
**Disposition:** Preserve **this historical failure analysis only** on stable `main`. All NH-OPT-011 experimental runtime, generated landscape, vehicle capture, audio, weather, preview-only tests, UI/control patches, and CI scripts are **not accepted** and **must not be merged to main**. Preserve the two original street-lamp GLB files independently committed by owner to main; they are not rejected or authorized for deletion. The existing accepted Sedan-only 125-agent traffic system and prior South Ward/North Heights features on main remain untouched.

## 1. Immediate owner evaluation

The owner provided two real screenshot captures from browser testing and reported the following **four release-blocking defects**:

1. **Grass in tarred roads.** An extensive grass patch occupies the centre of a paved street approach (visible in first screenshot) rather than a properly designated verge, garden, or planting bed. Street-right-of-way and intersection surfaces were not protected by the new landscaping logic.
2. **Street lamps intersect buildings.** Some imported GLB street lamps spawn inside building envelopes. Positioning by road-coordinate grids and assumed offsets was insufficient to guarantee clearance from procedural architecture.
3. **Vehicle entry breaks wheel placement.** When Voight enters a Sedan, wheel geometry loses its natural source alignment. Screenshot two visibly shows a wheel displaced above the roof, with other wheel placements also abnormal. This is a severe failure in physical/visual handoff, geometry-space transforms, hub pivots and/or wheel rig binding.
4. **Disturbing buzzing car sounds.** Newly introduced vehicle engine/traffic audio is an unpleasant continuous electronic buzz rather than natural vehicle acoustics. A procedural harmonic oscillator prototype was incorrectly promoted as a release-ready stand-in for authentic engine and tire recordings.

**Partial successes noted explicitly by owner (findings only, no acceptance of branch):**

- **Misty clouds** are moving toward an acceptable visual result. Their general atmospheric direction may inform a fresh future approach, but the current weather implementation is not accepted for merge.
- **Street lamps illuminate correctly at night.** The functional lighting approach (limited pooled emitters and time-of-day activation) is promising, but the placement and world collision failures prevent accepting this implementation. The original GLBs themselves remain owner-supplied source assets already on main.

The owner requested **immediate DDD, not another patch cycle**. No new runtime corrective fixes are authorized in this branch.

## 2. Timeline and implementation inventory — what was attempted

1. The user gave ten North Heights optimization requirements and answered ten clarification questions individually. A comprehensive plan `GTD-NH-OPT-011` was committed to `main` (documentation only) and explicitly approved for branch implementation.
2. The implementation branch was created from `main` with the two previously owner-committed lamp assets, `Medellin Street Lamp Optimized.glb` and `Modern Street Lamp.glb`; both independently licensed under CC BY 4.0 with existing owner attribution.
3. **Traffic/boarding:** `src/game/vehicles/nh011-all-vehicle-proximity.ts`, `nh011-traffic-sedan-drive.ts`, `nh012-traffic-simulator.ts`, `north-heights-sedan-traffic-009.ts`, `first-drive-trial.ts` and the NH runtime were patched to transfer individual moving Sedan agents from thin-instance autonomous rendering to a drivable Rapier actor. Attempted native source wheel reconstruction, centre offsets, braking, safe exit and physics-collider isolation. The model/rig-space problem survived even after multiple source-offset changes.
4. **Flight and running:** introduced North Heights-only native directional roll/pitch, changed yaw policy and matched on-foot running speed to existing UAL-derived step-speed helper. Broad application initially failed the accepted CHAR-129 flight-pose regression tests, then feature opt-in limited its impact to North Heights. No final user acceptance was obtained for flight or running.
5. **Persistence:** introduced IndexedDB checkpointing, save-schema serialization of 125 traffic agents, deterministic RNG/traffic reservations, player/vehicle state and weather. Later added two-slot atomic fallback and paused first-frame restore. No real browser-close/device-restart owner acceptance evidence was obtained.
6. **Ground/trees:** new procedural concrete curb texture and UVs; parcel land-use overlays; additional courtyard trees, rooftop planter beds and trees beneath selected podium overhangs. Owner's screenshot shows land-use geometry spilled into a tar road. Reconsider the placement algorithm; do not promote its coordinates.
7. **GLB street lamps:** instantiated both supplied models and a bounded pool of nighttime point lights. The night illumination visually worked but positions overlapped buildings. Source asset filenames remain acceptable independent of this failed placement code.
8. **Audio:** new `north-heights-vehicle-audio-011.ts` Web Audio oscillators approximated engine RPM, tire hum, horn and thunder with sawtooth/triangle synthesis, nearest four traffic voices. Resulting car sound was rejected as an unpleasant buzz. Sound sliders were only later scoped to the capable district.
9. **Weather:** `north-heights-weather-011.ts` added procedurally generated white cloud dome, local rain line system, deterministic precipitation/night lightning and thunder simulation, with settings. User considered misty-cloud direction promising. This is *not* approval to reuse the branch unreviewed.
10. **Tests/deployment:** added a dedicated optimization workflow and tests, including Sedan source mesh/hub materialization. Vercel compilation and tests initially failed; fixes eventually produced a 557/557 passing regression suite on SHA `1a2cfdd4e3f633b640e28cc243f65b5b7f32b7c0`, with a READY preview. Later final SHA `b7aa5300afc85b052867029dc4aef06e43085ce5` also produced a READY preview. **Automated tests and successful builds did not reveal the above visual/audio gameplay defects.**

### Main affected domains / files (historical references; NO merge)

- `src/game/experiments/north-heights-city-8.ts`, `north-heights-reconstruction-001.ts`, `north-heights-roads-003.ts`, `north-heights-block-surfaces-008.ts`, `north-heights-concrete-011.ts`, `north-heights-lamps-011.ts`, `north-heights-weather-011.ts`
- `src/game/vehicles/nh011-traffic-sedan-drive.ts`, `nh011-all-vehicle-proximity.ts`, `first-drive-trial.ts`, `src/game/traffic/nh012-traffic-simulator.ts`, `src/game/experiments/north-heights-sedan-traffic-009.ts`, `src/game/physics/rapier-world.ts`
- `src/game/audio/north-heights-vehicle-audio-011.ts`, `src/game/save/north-heights-save-011.ts`, `src/routes/north-heights-preview.tsx`
- `src/game/character/native-flight-129.ts`, `src/game/world/mercer-static-character-103.ts`, `src/ui/menus/settings-state.ts`, `settings-editor.tsx`, `session-overlays.tsx`, `src/ui/hud/touch-controls.tsx`, `desktop-controls.tsx`
- `src/test/nh011-proximity-lifecycle.test.ts`, `nh011-traffic-sedan-materialization.test.ts`, `.github/workflows/nh-opt-011-verify.yml`

## 3. Failure analysis / technical hypotheses (NOT yet proven)

### D-01 — Road encroachment by ground patches

**Observation:** A rectangular or broad green area appears immediately in the driving corridor leading into the intersection. **Likely mechanism:** `planNorthHeightsYardPatches011` computes green strips around lot footprints and `cap(lawn,...)` adds them without a final geometric exclusion mask for pavement/road/right-of-way and curb/intersection boundaries. Additional curated podium/planting logic also used synthetic coordinates without complete crosschecking against road polygons. Verify rendered mesh world matrices and overlapping footprints before concluding which draw path caused the particular screenshot.

**Lesson:** Road occupancy is a hard mask on placement — not an afterthought. Future plans need a deterministic intersection/road polygon exclusion pass and automated geometric overlap tests **plus in-browser top-down visual inspection** before a scene preview.

### D-02 — Lamps inside building volumes

**Observation:** Imported lamps appear within buildings despite functional lighting. **Likely mechanism:** The new lamp placement planner reused grid positions `STREETS[i]+28`, pole lateral offset and generic world-ground formula without querying collision/parcel/doorway geometry. `createNorthHeightsLamps011` also derived scale/transform from source GLB world bounds without independent orientation/clearance validation. Both placement and model pivot must be tested separately.

**Lesson:** Use a build-time spatial occupancy/height query with explicit clearance radius, sidewalk use, roadway offsets, building collision volumes and disallow placements with intersecting AABB/OBB. Visually verify poles against buildings, sidewalks and night lighting.

### D-03 — Wheel source-space/rig mismatch when boarding

**Observation:** Visible detached tire above the roof immediately after takeover. **Possible mechanisms to investigate only in a future authorized branch:** `createNativeWheel007` vertices are in global/body source coordinates; the new `nh011-hub-*` nodes are placed at `sourceWheelFit007` centres; added compensating `mesh.position=-fit.center` may be inappropriate for this model's actual source-space convention. `FirstDriveTrial`'s `StreetVehicleWheelRig` may resolve pivots or rotate offsets with different parent-axis assumptions. Applying source-specific transforms without verifying GLB node matrices and wheel AABB in local/world space can send tyres above the roof.

**Lesson:** Reproduce one wheel at a time with explicit source-centre, pivot-frame and source-to-scene matrix tests, plus user-visible static-then-boarded A/B screenshots. Do not automatically apply inverse centre offsets without proving geometry basis. The **original accepted autonomous Sedan rendering is the reference**, not the new interactive actor.

### D-04 — Unacceptable audio synthesis

**Observation:** The car emitted a harsh buzzing sound rather than a convincing engine. **Supported cause:** The implementation used permanently running Web Audio `sawtooth` and `triangle` oscillators with speed-driven frequency, persistent short-attack gain and limited filtering/sample layering. Periodic sawtooth harmonics are intrinsically buzzy; combining engine/tyre/nearby traffic voices amplifies that character. This was a provisional audio method, not a qualified vehicle audio asset bank.

**Lesson:** Never describe raw oscillator harmonics as realistic production vehicle audio. Future attempt should qualify appropriately licensed recorded/loopable automotive source layers (idle/load/decel/tire/brake), filtering, transient envelopes, distance model, browser gesture activation and **mandatory human listening tests** before a broader deployment. A mute/disable fallback must always be available.

## 4. Validation deficiency — why tests passed but the result failed

- Static/source tests validated some geometry, controller APIs, speed maths and rendering mesh creation, but not **final wheel positions in a real animated running browser** after live car capture.
- Tests did not check generated grass surface polygons against all asphalt strip and intersection geometries across the whole world.
- Tests did not physically check every lamp mesh footprint against rendered building envelopes, or validate owner-provided GLB rotation/scale after instantiation.
- Tests only checked audio graph/activity/voice quotas, not human acoustic quality; synthetic buzz passed all functional checks.
- “Vercel READY”, TypeScript success and `557/557` green tests are **build evidence**, not gameplay acceptance. User screenshots and observed sound take precedence.
- Warning: The earlier assistant reported all ten code changes as implemented before reviewing runtime visuals. That was incomplete acceptance evidence. All ten must be considered **unaccepted** on this branch after DDD.

## 5. DDD disposition / containment commands and no-resurrection rule

1. Preserve this incident analysis on `main` under `documentations/DDD` **before** clearing experimental branch state.
2. Decommission the experimental branch **without merging its runtime commits**. If connector permissions prevent physical branch deletion, move the branch ref back to accepted `main` using a guarded force-with-lease, verify zero branch diff, and report that the empty ref remains available for later manual deletion. Never describe a reset ref as a deleted Git branch.
3. Stop/cancel any still-building preview deployments if permitted. Vercel preview deployments already READY may remain addressable because available connector tooling may not offer deletion; mark these URLs **REJECTED / NOT FOR TESTING OR PRODUCTION**. Do not deploy anything new merely to decommission.
4. Do not remove the two street-lamp GLBs that were **independently owner-committed on main** before the optimization branch. They are accepted input assets, although their placement system was rejected.
5. No code patch, follow-up optimization, branch recreation, preview release, merge or deployment under NH-OPT-011. **Await further direct owner instruction.**
6. Future approaches may **study** the two partial successes (cloud visual direction and night lamp lighting) **only as historical observations**, not approved code to cherry-pick.

## 6. Status

| Check | Recorded disposition |
| --- | --- |
| Owner reviewed actual running preview | **Yes — screenshots and auditory review** |
| Four critical defects | **Confirmed by owner** |
| Two partial successes | **Recorded, not approved for merge** |
| NH-OPT-011 runtime code on accepted `main` | **No** |
| Independent owner original lamp GLBs on `main` | **Preserve** |
| Source bug fixes authorized now | **No** |
| DDD authorized | **Yes** |
| Further work | **HALT pending new instructions** |

**Procedure DDD outcome:** NH-OPT-011 is a rejected experiment, not a partial implementation to continue. Accept only the lessons; do not move runtime code into main.
