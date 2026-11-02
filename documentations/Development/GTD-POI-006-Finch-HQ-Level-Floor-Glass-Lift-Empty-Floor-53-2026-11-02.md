# GTD-POI-006 — Finch HQ flat lobby, pure-glass elevator and empty Floor 53

**Date:** 2026-11-02
**Owner instructions:** (1) stop character floating halfway across the ground floor by using one level floor; (2) full-glass elevator, remove wood/metal/non-glass fittings, keep camera inside when riding or standing inside; (3) remove every furnishing from Floor 53 except Finch.
**Implementation:** `feature/agent-reese-player-20261102` after REESE-001; preview only, pending owner acceptance. No production merge authorized.

## Diagnosis

The original procedural building white floor was at `northHeightsGround(center)+0.27m` everywhere, while the terrain mesh, Rapier ground collision and a per-frame `boundActor()` lower-Y clamp used varying `northHeightsGround(player.x,player.z)` as if the player were still outdoors. This created incompatible support surfaces within the same lobby, permitting the player capsule to be pushed up over the level white floor.

## Fixes

1. `north-heights-finch-elevator-structure-004.ts` introduces one source of truth for the headquarters footprint, the floor offset and inside/outside support. `finchTerrainHeight006` flattens the **mesh that Rapier also consumes**, to 0.25m below the room's white floor across the full footprint, smoothing back into the original hill over 1.6m outside. Only this building is modified.
2. `north-heights-reconstruction-001.ts` samples finer terrain triangulation around this HQ footprint instead of using the original ~14m coarse terrain triangles there; this prevents interpolation crossing the floor plane. Elsewhere, terrain and world generation remain unchanged.
3. `north-heights-city-8.ts` uses `finchLobbyMinimumCapsuleY006` inside HQ instead of the outdoor hillside height; the physics slab top and visually flat white floor remain at the same elevation. Rapier movement, auto-step and all other buildings are unchanged.
4. `north-heights-finch-lobby-004.ts` removes metal door header, timber jambs, handrails, control panel, indicator and other opaque cabin hardware. Moving floor, ceiling, four sides and sliding doors use transparent glass materials. The reception desk and receptionist remain in the **ground-floor lobby**; they are not elevator fittings.
5. The elevator returns its live cabin bounds to the North Heights renderer; the camera is clamped strictly within the transparent moving enclosure (x/z and top/bottom) whenever occupied, including boarding, closing, travel and opening. Player and cabin still travel continuously.
6. `north-heights-finch-suite-005.ts` now creates **no floor 53 furnishing, carpet, materials or colliders**. The underlying white structural slab, walls, glass shaft, lift landing and Finch remain. Finch retains his established world coordinates and dialogue proximity trigger.

## Regression and acceptance

`finch-interior-glass-floor-006.test.ts` asserts uniform room level across the full tower footprint and the absence of opaque elevator fittings, plus dynamic camera bounds and cleanup. Updated POI-005 test asserts empty floor 53 (zero added props/colliders). All older floor and elevator round-trip tests are retained.

**Manual preview acceptance still needed:** walk from street to back of lobby without apparent floating; enter lift and rotate camera in all directions, ride to Floor 53 and return; confirm no camera escape, furniture or non-glass elevator trims; confirm Finch and dialogue still work. Static unit tests cannot prove visual fidelity or physics jitter in-browser.
