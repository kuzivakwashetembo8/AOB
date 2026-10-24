# GTD-VEH-BASIC-001 — Hidden-driver temporary driving fallback
**Date:** 2026-10-24  
**Branch:** `feat/basic-driving-hidden-driver-20261024`  
**Baseline:** `main` at `05398497ec24254877d9029976bc78581b22e9bc`  
**Status:** Owner-authorized temporary solution; implementation and preview only. **No main merge or production deployment without approval.**

## Intent and scope

Replace the failed visible driver-seat presentation with an explicit, reversible **hidden driver**: when the player boards any currently enabled drivable vehicle, the playable Voight model becomes invisible; the car drives as an empty vehicle using *unchanged* speed, steering, Rapier collision, wheel, camera and control systems. Exiting at rest restores the same playable character near the **vehicle's present location**, never its historical boarding position.

The failed six-car interior experiment (VEH-INTERIOR-001–005 / VEH-SEAT-CAL-001, DDD report `documentations/Development/GTD-VEH-INTERIOR-DDD-001-Failed-Six-Vehicle-Seating-2026-10-24.md`) is explicitly excluded. Do not import its interior mappings, hard-coded seat coordinates or anatomical fitting code. Leave Ferrari/Buggy production exclusion unchanged. The separately accepted CHAR-130 seated animation remains available in source but is not used while this fallback is active.

## State contract

- **On F, walking → driving:** only if not flying, within the existing board radius of an already supported drivable car, and no other active drive. Clear walking directional input; bind current vehicle; record drive state; hide **both** visual representations where applicable: legacy UAL `voight.root`, and the playable native `character.glb` root if Character is enabled. Never start `Driving_Loop` or run `syncDriverSeat()`/cabin IK. The car has no occupant mesh. Disable visual visibility, not asset instantiation or character collision rules.
- **During driving:** preserve pre-existing `trial.prepare()/physics.movePlayer(0)/trial.finish()` Rapier integration, steering, camera, HUD and controls. A hidden visual actor follows the current car pose, not an entry-point snapshot. No seated animation updates.
- **On F, driving → walking:** maintain the accepted speed gate `abs(speedMps) ≤ 0.25`. Resolve *only* `car.findSafeExitPosition()`, which derives collision-free side/rear offsets from the vehicle's current Rapier body translation and heading. If no legal position exists, remain in driving mode and hidden; emit a clear message. Otherwise reposition the Rapier player, both logical roots, camera, and native actor to that actual exit position **before** restoring visual visibility; restore walking context and clear transient driving input.
- **Both character settings:** human character driving is authorized in this branch (the legacy hard block is removed). Switching character type during active driving is disallowed to prevent resurrecting the wrong avatar at the saved pre-vehicle location.
- **Lifecycle:** teardown clears hidden-driver state and does not resurrect a stale avatar on reload; no additional GLB download, PWA/offline or 3D mesh creation.

## Failures to prevent

1. Driver is still visible through a roof or under the car (both UAL and actual character.glb must be correctly hidden).
2. Character reappears at the boarding site after the vehicle has traveled.
3. Actor pops into view one frame *inside* the moving car when exiting.
4. Boarding fails silently when "Enable Character" is on.
5. Failed exit (car moving, or no clear exit) makes the character visible or changes context.
6. Character selection while driving revives a stale saved actor.
7. Changes to vehicle physics, input rates, turning wheels, or production vehicle set.

## Verification

- Unit test a current-car-only exit policy against displaced/rotated vehicle poses, no-available-exit case and zero fallback to a boarding point.
- Source-facing runtime check for no seating animation calls in entry/drive/exit paths; current-car synchronization and both actor hide/show paths.
- Full existing Vitest suite; compiled Vite app; offline resources (no mandatory assets missing).
- One branch-only preview. Owner tests UAL and native character toggle, F board → drive several streets → stop → F exit, and blocked exit. Confirm location, rear camera, speed/steering/wheel behavior, and no roof/floor leaks.
- No merge to main until visually accepted.

**Permanent fix deferred:** calibrated anatomical driver seating may be researched on a separately approved branch later; this workaround makes no assumptions about vehicle interiors.


## Implementation and build verification

**Preview implementation commit:** `fc0692aa58e144c08005657073c8ffb558b6b6b0`.

**Changed runtime:** `gtd-runtime.ts` removes the Character-mode boarding rejection, disables seating/cabin pose invocation for every active drivable vehicle, hides the playable UAL and native Voight representations on boarding, keeps the hidden visual root synchronized with the moving car, and exits only at a collision-checked live vehicle position (never the saved entry point). The native `character.glb` control wrapper adds `setDrivingHidden` and `syncHiddenDrivingPose` without GLB duplication. Existing wheel/driving/physics modules are untouched.

**Full build:** Vercel deployment `dpl_2ePV14XL3T5SUKpT44N7j6zRRgca` reached **READY** at `https://gtd-psdvwwi1r-interlinkglobaltech.vercel.app/game`. The first preview attempt failed strict TypeScript test-probe index typing only; corrected in the implementation commit above without changing runtime driving logic. TypeScript compilation, **five new actual-runtime VEH-BASIC-001 tests**, existing GTD regression suite, Vite/Nitro build, prerender and PWA pack subsequently passed.

**Offline inventory:** `456` resources / `185,717,660` bytes, **0 mandatory resources missing**; `451` files in complete game pack.

**Owner acceptance pending:** Check the original humanoid and `Enable Character` = on; F to board nearest active vehicle, verify empty car and steering/wheel/camera parity; drive away from entry point, stop, F to exit and visually locate Voight beside *new* vehicle location; verify movement and blocked-exit cases. A READY deployment validates packaging and automated behavior but not the owner's actual device.

**Integration boundary:** Branch only. Main and production not merged or redeployed by this experiment.
