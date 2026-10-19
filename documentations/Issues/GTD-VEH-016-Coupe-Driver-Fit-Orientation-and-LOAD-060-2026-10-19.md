# GTD-VEH-016 — BMW/Lamborghini driving follow-up; startup performance register
Date: 2026-10-19
Branch: `fix/veh016-coupe-seats-orientation-and-load-evidence-20261019`
Baseline: accepted six-car static parking / VEH-015 wheel-drive preview, 516025522d588b0cb0f4f78ca80b303ca960d6cf
Status: **isolated owner-preview correction; visual verification required**. Not approved for main.

## User evidence and exact scope

Screenshot 20261019-080026: BMW M4 Competition M Package (called Benz in report): humanoid occupies the **passenger seat** and orange lower-leg/feet geometry visibly pierces the car underside. Vehicle itself drives; steering/wheels not reopened.

Screenshot 20261019-080255: Lamborghini Temerario: humanoid is **facing the wrong direction**, upper head intersects/exits the roof, and accelerator arrow moves visually rearward while reverse arrow moves visually forward. No verified steering/wheel failure reported.

The new original parked BMW is not a Mercedes. Do not change labels/assets. Correct only presentation or source-front calibration, leaving the existing Rapier drive solver and the four accepted vehicles untouched.

## Prior solution reused: VEH-FIT-002 / VEH-007 / FIT004

The earlier driving-seat recovery rejected moving/hiding the entire humanoid or inventing a new walking collider. It used the accepted `Driving_Loop` clip; a real seat root relative to vehicle dimensions; geometry-bound thigh/calf IK toward pedal/footwell targets; sampled deforming shoe soles with bounded correction; no adjustment to walking; normal exit cleanup. The Range Rover generic seat is **not universal** for sports coupes.

## Root-cause assessment

- **BMW laterality — code-confirmed:** `syncDriverSeat` applied `rangeRoverDriverSeatWorldPose` unconditionally to every non-Ferrari. Its +0.22 × body-width lateral offset placed the BMW character on the wrong cockpit side. The user screenshot confirms wrong-side occupancy. Patch switches BMW only to -0.22 × width and shifts the fore/aft seat fraction from +.11 to +.035 (backrest-ward).
- **BMW lower legs — mechanism observed, final magnitude provisional:** existing SUV pose workflow targets provisional shoe height .37 × bodyHeight for all non-Ferrari GLBs and samples real shoe vertices afterwards. The BMW is a shorter, lower-floored coupe; screenshot shows leakage. Patch changes only BMW initial foot IK targets to .50 × real chassis height, reusing the already accepted deforming-shoe sampling and bounded IK path. Human root height and skeleton/animations remain untouched. Actual calf/sole containment still requires live acceptance.
- **Lamborghini roof — source-independent root calibration:** generic SUV seat root was .57 × 1.28 m ≈ .730 m, too high for its compact roof in the screenshot. Patch sets this car alone to .30 × 1.28 m ≈ .384 m (a 0.346 m reduction), retaining the original 1.78 m skeleton and driving clip. This is a visual proposal, not a measured seat-cushion/roof clearance certificate.
- **Lamborghini reverse front — model/physics frame mismatch:** actual GLB front wheel-control assembly `CTRL_Wheel_FL/FR` is at source negative X; the accepted parking fitting turned its long X axis generically without calibrating authored *front sign*. With `forwardAxisSign: +1`, the physics actor accelerates along anchor +Z, but the screenshot shows the displayed nose pointed the opposite way. Patch rotates **only the Lamborghini modelRoot** an additional Math.PI around local Y, bringing its rendered nose into agreement with the unchanged Rapier +Z throttle. The chassis/camera/keyboard/throttle sign are NOT inverted. Signed wheel rotation still needs owner observation after model rotation.

All changes are contained to VEH-016 module/conditional targeting; Range Rover/Hilux/Defender/Dodge positions, seat pose, source wheel rigs and steering physics remain unchanged.

## Supabase: 2026-10-19 inspection (GTD Analytics project)

Queried live relational tables `gtd_startup_runs`, `gtd_startup_spans` and `gtd_asset_observations`. **Only six terminal runs exist** in storage; the latest is an Oct 18 production run, release `e5233e6f6411da83e439462476494a3d5224b2a5`, not the BMW/Lamborghini preview. The `gtd_startup_reports` in-progress diagnostics table has zero rows. No valid 6-vehicle comparison exists yet.

Representative runs:
| UTC started | Device | Outcome | Duration | Network hint | Critical stage |
|--|--|--|--:|--|--|
| 2026-10-18 19:29 | Desktop | Aborted | 738.687 s | 2g | vehicle_loader 732.817 s |
| 2026-10-18 11:29 | Mobile | Playable | 40.798 s | 3g | vehicle_loader 6.593 s |
| 2026-10-18 10:20 | Desktop | Playable | 882.637 s | 3g | first_frame 676.898 s; vehicle_loader 198.949 s; background 806.947 s |
| 2026-10-18 08:16 | Desktop | Playable | 53.464 s | 3g | vehicle_loader 35.473 s |
| 2026-10-18 06:17 | Mobile | Playable | 66.869 s | 3g | vehicle_loader 61.564 s |
| 2026-10-17 13:00 | Desktop | Playable | 51.846 s | 3g | older import cohort |

Observed Toyota `container_ready_ms` spans ≈3.536 s through 198.835 s, with `instantiate_ms` generally <1 s. Some transfers/cache fields are null/unknown. This variation implicates external asset acquisition/decode/cache/network interaction but **does not isolate cause**; Chromium's `3g`/ `2g` EffectiveConnectionType is an estimate, not measured throughput. The 882 s run was mostly background time and must not be compared naively to foreground 40–67 s sessions.

The six-model deployment's known source file bytes add ≈6.43 MB for BMW and Lamborghini; BMW's on-build wheel derivative is 1,445,280 bytes and Lamborghini original is 4,499,268 bytes. Concurrent GET latency, CPU glTF decodes and network transfer remain potential costs. There is no evidence yet proving fleet growth vs Wi-Fi is dominant. Do not label the current loading delay a confirmed fleet regression.

## Acceptance gates and disposition

1. Tests: isolated BMW/Rover opposite-side geometry, BMW internal pedal target, Lamborghini lower root, Lamborghini π source-forward correction and **unchanged** drive profiles.
2. Preview build: TypeScript, Vitest, Vercel READY. No unaccepted code merged to main.
3. BMW: manually board, inspect correct driver side; while steering/driving, both thigh/calf/foot meshes remain fully in car, no roof intersection, no phantom collision; exit/enter.
4. Lamborghini: visually forward arrow translates toward actual bonnet, reverse arrow toward engine/rear, camera follows behind; driver faces bonnet, entire head below roof; four real wheel surfaces still steer/roll without white rims or torn fragments.
5. Capture desktop and mobile stopwatch cold/warm startup in foreground and repeat over a reliable network. Save `run_id/release_sha/cache_cohort/network_class` and per-asset `container_ready_ms/instantiate_ms`. Treat >60 seconds as failed budget. Recheck Supabase once current-preview run rows arrive; no automatic attribution or performance fix from incomplete telemetry.

Changes in this branch are a bounded first patch. Live visual/device tests, not type checks alone, determine acceptance.
