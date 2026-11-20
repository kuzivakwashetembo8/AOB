# LMS weapon orientation and hand-socket correction

Date: 20 November 2026
Branch: `feature/lms-gun-hand-equip-001`

## Observed defect

The preview shows the selected M4A1 held by Reese with its barrel pointing upward. The extracted weapon is parented to the right-hand bone, but its local forward axis is not being reconciled with the animated hand-bone coordinate frame. The current adapter assumes that the hand mount's local axes are identical to character axes. That assumption is false in the observed runtime pose.

This is a gameplay blocker: aiming, muzzle placement and shot direction cannot be reliable until the weapon's forward axis is explicitly defined and transformed into the character's frame.

## Source geometry coordinate map

The three extracted source builders author weapon geometry in metres. The source model comments and node metadata define a consistent weapon-local frame:

- +Y is up; the top rail and sights are above the bore.
- −Z is weapon-forward: muzzle/barrel crown is at negative Z.
- +Z is weapon-rear: stock/butt and the firing-hand grip reference are at positive Z.
- X is lateral; sign selects the left/right side.
- The source muzzle node is the authoritative barrel endpoint; the sight axis is explicitly `[0, 0, -1]`.

### Named landmarks

| Landmark | Meaning | M4A1 | MPX-9 | P-19 |
|---|---|---|---|---|
| `muzzle` | Barrel crown / shot origin | `[0, bore, muzzle.crownZ]` | `[0, bore, muzzle.crownZ]` | `[0, bore, zSlideFront - 0.004]` |
| `sight` | Optical sight centre | `[0, opticY, optic.lensZ]` | `[0, opticY, optic.lensZ]` | `[0, opticY, opticZ]` |
| `sightAxis` | Aim direction in weapon space | `[0, 0, -1]` | `[0, 0, -1]` | `[0, 0, -1]` |
| `ironSight` | Mechanical sight reference | rail-top-derived | rail-top-derived | slide-top-derived |
| `gripR` | Right-hand wrist target relative to thumb web | `[0.0251, 0.06, 0.1223]` | `[0.024, 0.028, 0.064]` | `[0.028, 0.003, 0.07]` |
| `gripL` | Support-hand wrist target | present in source | `[-0.056, 0.015, -0.153]` | `[-0.03, -0.012, 0.076]` |
| `chamber` | Chamber / receiver reference | present | present | present |
| `eject`, `ejectDir` | Ejection point and direction | present | present | present |

### Major physical assemblies

- M4A1: upper/lower receiver, barrel and muzzle device, gas block, handguard and top rail, front/rear sights and optic, pistol grip, stock, magazine, charging handle, bolt carrier, trigger and selector.
- MPX-9: tubular receiver, barrel and muzzle device, handguard and rail, foregrip, folding stock, optic, pistol grip, magazine, charging handle, bolt, trigger and selector.
- P-19: frame, slide, barrel/muzzle, accessory rail, grip, magazine, trigger and slide-mounted reflex sight.

The builders expose moving assemblies separately from the static body. The runtime adapter currently creates those assemblies, but does not yet expose all named landmark nodes as Babylon transforms. The current correction is limited to orientation and attachment; it must not imply that firing/reload animation or muzzle-based hit resolution is already implemented.

## Coordinate contract to enforce

1. Character space: Reese GLB is authored +Y-up and +Z-forward at zero yaw.
2. Weapon space: +Y-up, muzzle along −Z, rear along +Z.
3. Hand space: the right-hand bone has its own animated basis and must not be assumed to match character space.
4. Weapon-forward in world space must equal Reese's horizontal character-forward vector: `(sin(yaw), 0, cos(yaw))`.
5. Weapon-up in world space must remain aligned with world-up, with the top rail above the bore.
6. The weapon root remains positioned from the source `gripR` wrist target. Orientation is solved in the hand mount's local coordinates by transforming the desired world rear/up basis through the inverse mount world matrix.
7. The source `sightAxis` and muzzle-to-sight line must agree with the resulting world-forward vector. Aiming and later shot resolution must consume this same authoritative basis.

## Patch plan

1. Replace the fixed Euler 180-degree correction as the sole orientation rule with a named coordinate contract and a mount-space basis solve.
2. After Reese's hand mount has been attached to the actual right-hand bone, compute its world matrix and transform desired character-back and world-up directions into mount-local space.
3. Build the weapon root quaternion from those local basis vectors. The local +Z stock direction must map to character-back; therefore the local −Z muzzle direction maps to character-forward.
4. Recompute the mount-relative orientation after the character pose/yaw is updated, so hand-bone animation cannot rotate the muzzle skyward. Keep the grip translation and per-weapon source grip targets unchanged in this patch.
5. Add deterministic unit coverage for the axis mapping (weapon −Z to character +Z at yaw zero; to +X at quarter-turn; top rail remains upright) and source metadata invariants for all three weapons.
6. Run targeted tests, the full test suite, TypeScript and production build; create a Vercel preview only. Do not merge or deploy production.

## Validation and acceptance

- M4A1, MPX-9 and P-19 all point along character-forward at zero yaw.
- At a 90-degree character yaw, all three point along the rotated character-forward vector.
- The weapon top rail remains above the bore; no roll or upside-down orientation.
- The right-hand grip translation is not changed by the orientation solve.
- Repeated weapon-button taps continue to switch models without allocating duplicate weapon roots.
- No edits to city, traffic, pedestrians, buildings, physics controller or unrelated world systems.
- Preview build must be READY. Manual visual/gameplay validation remains required for grip fit and animation pose; automated coordinate tests cannot prove visual hand contact.

## Known dependency / limitation

The source builders and their named node metadata are inspectable in the repository. The binary Reese GLB has not been decoded in this workflow, so this document does not claim a measured bind-pose basis for the hand bone or identify the embedded weapon mesh. The runtime correction uses the actual instantiated hand-mount world matrix rather than assuming a particular GLB bind-pose orientation.
