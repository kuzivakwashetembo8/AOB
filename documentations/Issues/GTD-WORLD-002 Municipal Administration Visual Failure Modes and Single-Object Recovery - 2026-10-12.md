# GTD-WORLD-002 Municipal Administration — visual failure record and one-object-at-a-time recovery

**Date:** 2026-10-12. **Status:** implementation committed on isolated `feat/gtd-world-002-municipal-administration-20261012`; desktop owner confirmation remains required. **Production/main must not be merged or deployed.** This record supersedes the *active* multi-object implementation scope of the original plan; the historical technical plan remains available, but not all original props are still enabled.

## Evidence: user screenshots of latest municipal preview
- The newly introduced hydrants and OPEN/CLOSED boards were **not discoverable** anywhere during the South Ward walk. Green unit tests and Vercel READY did **not** prove scene-level visibility, correct storefront placement or asset rendering.
- Black box-like structures below residential windows and in arbitrary facade positions are inconsistent with approved architectural grammar.
- A generated streetlamp arm/head penetrated a window/building: lighting existing in code is not enough when authored geometry violates spatial clearance.
- Storefronts had static horizontal bands but not unmistakable white LED diffusers; prior LED objects were detached from the actual facade system and lacked confirmed visibility.
- Downpipes are now recognizably round silver pipes, but need **between 3 and 7 percent** additional thickness.
- Position metadata was accepted as functional and must remain unchanged.

## Failure mode / source / corrective action / acceptance

| ID | Failure mode | Source/root condition | Implemented correction | Confirmation required |
|---|---|---|---|---|
| MA-FM-01 | Window-adjacent dark unexplained rectangles | `facade-details.ts` randomized `facade-ac-unit` boxes below windows and also emitted unlabeled wall-light/garage utility/vent boxes | Suppress all four optional anonymous block generators; preserve regular window trims, authored openings, cornices and coherent facade mass | No hanging dark AC boxes or random attached black squares when circling shops/apartments |
| MA-FM-02 | Post/light head sinks into facade or upper window | Road-generated streetlights used an arm orientation that aimed away from the road on one side; pole placement favoured facade side and lacked a pole-to-head envelope check | Correct yaw for both sides; move poles toward curb; validate whole pole/arm/head envelope against resolved building footprints plus 0.65m margin (incl ~0.30m head radius); reject unsafe authored/generated lamp positions | No pole/head penetrates building, windows or architectural trim; lamps still exist and glow at night |
| MA-FM-03 | Storefront LED strips cannot be identified at night | Previous separate `municipal-object-renderer` made unrelated, detached mesh fixtures; the dark actual facade sign bands remained | Render thin white luminous diffusers as real generated `facade-sign-band` geometry, including thin-instance mode; couple emissive material and one limited white point light per commercial frontage to existing Meridian night cycle | White horizontal strip physically on the storefront, visually bright after dark; visible in both Mercer and Foundry shops, not floating or sunken |
| MA-FM-04 | Drainpipes still too thin | Pipe cylinder diameter 0.110m and collar diameter 0.155m | Increase *both* 5% to 0.1155m and 0.16275m | Silvery 3D cylindrical piping still correctly anchored; no rectangular regressions |
| MA-FM-05 | OPEN/CLOSED and hydrant invisible in live walkthrough | Placement, image-loading and object ownership lacked actual pedestrian-camera proof; prior object group failed visual acceptance despite passing NullEngine tests | **Remove the full unaccepted `municipal-object-plan.ts`/`municipal-object-renderer.ts`, their tests, all `sw-ma-*` authored props and their Rapier collider/runtime integration.** The user's image files remain in GitHub but are not imported or used in the game | Zero hydrant/shop-board/other unapproved municipal spawned objects; no ghost colliders or network requests; no false "object complete" status |
| MA-FM-06 | District/street position data regression risk | Previously accepted HUD location derived from nearest named road | Keep `south-ward-location.ts` and current-location snapshot/HUD unchanged | Mercer Street, Foundry Lane and Workshop Road correctly update on movement/vehicle travel |

## Scope after this patch
- **Keep:** previously accepted generator-wide window grid, canonical Voight/Ferrari, improved streetlamp night glow, location HUD, round metallic downpipes, existing old street furniture (trees/park bench and litter bin) and non-novel shop storefront architecture.
- **Patch:** 5% more pipe diameter, remove anonymous dark facade blocks, safe streetlamp margins and road-facing heads, native white horizontal facade LEDs using existing day/night time.
- **Remove:** all invisible/unconfirmed experimental municipal furniture, including hydrant, shop boards, shop-name props, bin clusters, bollards, additional street-name/STOP hardware and utility cabinets. **No asset files deleted from main.**
- **Defer:** all new street props and full offline-pack work. Next discussion explicitly selects **one** object, adds it to **one known visible location**, validates live browser from Voight's camera, then accepts/rejects before the next object.

## Release / failure policy
1. Do not equate authored object counts, NullEngine meshes or request success with visible game objects. For the next trial, provide a fixed witness location plus daytime/nighttime close and medium-distance screenshots.
2. Keep all work on the experiment branch and review PR #16; promotion requires owner acceptance.
3. Preserve automated regression gates, particularly facade details, collision, first frame, time-of-day lighting, existing parked/drivable Ferrari and mobile touch.
4. Treat unknown future block-like facade fixtures as **opt-in authored assets only**, not seeded decorations.
5. Record each future object's path, transform, geometry, shadow and collider dimensions, material readiness, asset hashes, rendered witness and rollback decision.

**Status gate:** code integration is not user visual acceptance; awaiting owner test on the next READY preview.
