# GTD-CHAR-110C — Retargeted Walking: Leg Crossover and Ipsilateral Lane Gate
Date: 2026-10-21
Branch: `fix/char-110-leg-lane-20261021`
Reference checkpoint: https://gtd-1h7x9ex8w-interlinkglobaltech.vercel.app/game
Status: **patch candidate; build measurement / owner visual acceptance pending**.

## Owner evidence and exact priority
Four screenshot frames on 2026-10-21 at 09:03 local show the same character.glb in Mercer Street walking at the CHAR-110B preview.
- **Improved and must preserve:** Voight now lifts a foot and steps instead of moonwalking; this was achieved by the transferred UAL authored `Walk_Loop`.
- **Rejected:** the apparent right leg crosses toward/over the left side of the body in motion, while the left leg appears displaced to the right and insufficiently advances. The owner requests **each leg remain on its anatomically correct side during walking**.
- **Secondary, deliberately deferred:** stride length is excessive. It is NOT the primary fix for this checkpoint; avoid changing cadence, speed or sagittal swing just to conceal crossing.
- Screenshots are representative selected frames, not a sampled 3D motion trace. Exact root cause requires evaluating the generated clip and original bones; do not claim source Joint names are swapped without evidence.

## Technical hypothesis
`scripts/char110-bake-ual-walk.mjs` converts UAL's `Walk_Loop` motion relative to its `Idle_Loop` rest into target-local quaternions through parent frames. This establishes actual strides, but UAL and Voight have very different initial thigh rest orientations. Rotation-channel remapping alone does not guarantee a foot lands on its original anatomical side; a source-leg pitch can become unwanted adduction in the target.

No evidence has yet shown that UAL itself crosses its knees, that the left and right names were interchanged, or that the collision capsule moved incorrectly. Those explanations are **not accepted findings**.

## Scope of the patch
- Keep **authored Walk_Loop** timing, flexion, forward/back leg motion, pelvis, upper-body and arm swing, 1.5 m/s movement, and the accepted CHAR-109 standing pose.
- Run `scripts/char110-verify-leg-lanes.mjs` after the existing offline retarget bake. It performs forward kinematics on the **real 73-joint target glTF** for the baked animation and measures both knees, ankles and toe bases in **pelvis-local x** against the true left/right thigh positions, without using camera/world headings as the coordinate basis.
- For any frame whose leg passes too close to or across the pelvis centerline, apply **minimum bounded outward thigh abduction** about the pelvis-forward axis to the already-retargeted sample. Do not replace the authored leg cycle, pose entire meshes, modify the right/left labels, or drag the feet geometrically.
- Preserve each authored frame except minimal lateral corrections. Keep the cycle seamless, test every sampled frame and halfway interpolation frame. Reject a build if an anatomical correction greater than 0.55 radians is required or signed knee/foot/toe separation remains inadequate.
- Execute only at build time: no new per-frame runtime solver and no new assets required beyond the already-generated target-specific `char110-ual-walk.json`.
- Existing opt-in behavior and UAL default remain unmodified. Do not merge to main without the owner testing a preview.

## Completion evidence still required
1. Build-time logs `CHAR110_LEG_LANES_BEFORE`, `CHAR110_LEG_LANES_AFTER`, and `CHAR110_LEG_LANE_ACCEPTED` with actual measured per-side positions and bounds. A passing old Vitest mock alone does not establish success.
2. Strict TS/Vitest and Vercel preview build READY.
3. Owner visual verification facing front, back, side during movement and transitions: legs remain ipsilateral, foot lift retained, arms move naturally, and standing returns to accepted CHAR-109 neutral.
4. Treat stride as a subsequent independent tuning problem (CHAR-111), not part of the leg-lane gate.

If this limited anatomical correction cannot satisfy the real asset's lane bounds, stop and document the measured failure. Do not silently fall back to sinusoidal/procedural walking; that earlier approach is explicitly rejected by `documentations/Issues/GTD-CHAR-110-111-Procedural-Walk-Failure-Register-and-Retarget-Pivot-2026-10-21.md`.

## Actual build measurements and correction history
2026-10-21 full-glTF build audit, deployment build commit `cf498d487c8a4a0cdc71060a55f0afe84a6431e5`:

| Grounded measurement | Left leg | Right leg |
| --- | ---: | ---: |
| Original pre-correction centerline-crossing samples | 28 / 41 | 28 / 41 |
| Minimum signed knee x before correction | -0.0165 m | -0.0285 m |
| Minimum signed ankle x before correction | -0.0226 m | -0.1528 m |
| Minimum signed toe x before correction | +0.0015 m | -0.1697 m |
| Maximum corrective hip-abduction angle | 0.170 rad (9.7 degrees) | 0.245 rad (14.0 degrees) |
| Corrected sampled frames | 41 / 41 | 35 / 41 |
| Minimum signed knee x after correction | +0.0454 m | +0.0738 m |
| Minimum signed ankle x after correction | +0.0460 m | +0.0485 m |
| Minimum signed toe x after correction | +0.0714 m | +0.0457 m |
| Remaining centerline crossings / lane violations | **0 / 0** | **0 / 0** |

The anatomical margin is **+0.0434 m from the pelvis centerline** per leg, computed as a fraction of actual target thigh separation. The post-bake checker validated every original clip frame and the interpolated halfway frames, and emitted `CHAR110_LEG_LANE_ACCEPTED`.

**Verification defect discovered and repaired:** initial diagnostic calculated `min(kneeX,footX,toeX) * sign`, which is incorrect for the negative-x anatomical right side and falsely accepted a right-foot crossing. A second build attempted to use the corrected calculation but failed because literal escaped newline characters put the validator definition inside a JavaScript comment. Both mistakes were isolated, explicitly fixed, and the later audit executed `min(kneeX*sign, footX*sign, toeX*sign)` successfully. Neither failed intermediate build should be treated as an accepted preview.

**Interpretation:** the longitudinal stepping is still the 1.333-second authored UAL Walk_Loop transferred to Voight. Only the left/right thigh tracks received minimal outward alignment corrections; the other 20 anatomical joint tracks, cadence, translation speed, pose/skin weights and foot-lift source were not replaced. Geometric lane compliance does not guarantee high-quality shoe-ground contact or natural stride length. Visual acceptance remains pending.

## Completion disposition
The **baked animated-joint lane constraint passed**. Next required step: wait for full Vercel READY state and have the owner inspect front/back/side during movement. The branch stays experimental and unmerged pending that result.
