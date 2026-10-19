# GTD-VEH-017 — Adopt accepted Range Rover seated posture for BMW and Lamborghini
Date: 2026-10-19
Branch: `fix/veh017-rover-seating-template-coupes-20261019`
Baseline: VEH-016 commit `379b139c1e43ba5484b7a5390b385fd02aba2f65`
Status: **preview candidate; visual acceptance pending; main unchanged**

## Trigger
Following successful Lamborghini forward/left/right control correction, owner reported that the driver’s feet now appear on the steering wheel in BOTH BMW M4 and Lamborghini Temerario. Owner instructed: copy the accepted seated posture from the Range Rover, rather than inventing another human animation. The current screenshot was taken on the VEH-016 preview at night.

## Mechanism and isolated fix
The accepted Range Rover uses `Driving_Loop`, `rangeRoverDriverSeatWorldPose` and `planRangeRoverFootwellTargets` (real thigh positions, bounded pedal reach), combined with measured lower-shoe evaluation. The VEH-016 coupes already inherited its animation and leg correction path but **diverged in the seat-root transform** and BMW **added an extra one-off foot elevation** to 0.50 times body height. The Rover’s original pedal target is 0.37 times body height. This raised-foot override is not part of the accepted Rover policy and plausibly pushes the BMW feet toward the dashboard/steering wheel. The precise geometry intersection is visible evidence from the owner, but automated tests do not localize actual foot vertices.

VEH-017 derives each coupe seat through the **actual Range Rover driver pose function**. Only necessary car-specific **position** deltas remain: BMW uses the opposite lateral driver side (from VEH-016 owner issue), and the shorter Lamborghini roof uses a bounded lower seating height instead of blindly copying SUV head height. No local pose or animation changes. The BMW foot-height override is **removed**: both coupes use the original Range Rover lower-leg pipeline and the same `0.37*bodyHeight` provisional floor-relative target, including bounded skinned-shoe sampling. Do not hide or resize the character, raise the whole car, overwrite vehicle geometry, or create a new humanoid.

### Accepted SUV baseline vs current coupe calibration
| Property | Range Rover accepted | BMW VEH-017 | Lamborghini VEH-017 |
|--|--:|--:|--:|
| Humanoid animation | Existing UAL Driving_Loop | Same | Same |
| Lower-limb IK/pedal solver | Rover | Same, no BMW override | Same |
| Lateral driver side fraction | +0.22 | -0.22 (opposite physical side) | +0.22 |
| Fore/aft fraction | +0.11 vehicle length | +0.035 | +0.04 |
| Character root height | 0.57 times body height | 0.57 | 0.43 (bounded low roof; provisional) |
| Vehicle visual heading | Existing accepted source | unchanged | Existing VEH-016 +π correction |
| Rapier forward axis | +Z | +Z unchanged | +Z unchanged |

The adjustments are applied relative to the **Rover-derived pose** in the vehicle’s yaw frame, not to steering, wheelless source meshes, or Rapier physics. In particular, the Lamborghini's fixed forward/reverse input is never touched.

### Failure modes explicitly avoided
- Returning BMW to Rover's lateral sign would reinstall the known **passenger-side** defect.
- Returning Lamborghini fully to SUV .57*1.28 m would reinstall the previously reported **head-through-roof** defect.
- Increasing feet/pedals to .50 chassis height to hide ground clipping reproduces the current **feet-near-steering** report.
- Blindly copying source-model rotations or changing `forwardAxisSign` would undo the **owner-confirmed correct Lamborghini driving directions**.

## Acceptance sequence
1. Code compile and full regression suite, including a Rover untouched assertion and VEH-017 coupe root/pedal tests.
2. Vercel candidate deployment; confirm 200 /game and current release SHA; no main merge.
3. User: board BMW, photograph side profile with camera at door height. Check driver occupies **driver's seat**, pelvis against backrest, toes ahead of hips inside dashboard footwell, neither feet on wheel nor through bottom.
4. User: board Lamborghini, photograph profile; check head fully beneath roof, feet inside cabin (not on steering wheel), driver faces front, steering/rolling intact and arrow-up moves forward.
5. Exit/re-enter and turn each car to verify seat stability under yaw and movement.
6. Loading retains independent 60-second gate. VEH-016 Supabase analysis predates six-car preview; repeat first-playable cold/warm session telemetry. No new performance claim from these seating-only changes.

**Important:** A passing unit suite and READY deployment do not prove actual humanoid foot mesh collision-free. Visual review remains necessary.
