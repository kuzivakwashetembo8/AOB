# GTD-CHAR-120E — Wrist-targeted sprint arm path / anatomical correction

**Date:** 2026-10-22 (Africa/Johannesburg)  
**Branch:** `feat/char-120-natural-athletic-sprinting-20261022`  
**Status:** Development, user-authorized repair. **No visual approval**, production and main protected.  
**Reference:** The owner’s side-view screenshot of Voight sprinting beside a tan brick building, reviewed after the CHAR-120D preview `https://gtd-nag4zd38v-interlinkglobaltech.vercel.app/game` (release `36b806ce5663e9c5e9a5ef4078528e293239d2df`).

## Defect and findings

- The legs, stride, sprint speed and torso inclination remain accepted.
- The previously reversed elbow-flexion direction (CHAR-120C) is accepted. However, the leading hand remains down by the thigh and the trailing hand folds behind the back/hip. The model still lacks a raised, forward-driving hand.
- CHAR-120D rotates the upper arm toward a target **elbow** position: a fixed +0.095 m along the hip-forward axis, measured at rest. That test proves *relative improvement* in elbow/wrist position, not an **absolute anatomical wrist position** during running.
- Static neutral-position calibration is insufficient: the final wrist position depends on both upper-arm and forearm rotations through the forward-kinematic hierarchy.
- The linked GLB is not equivalent to synthetic unit-test arms that point straight down in bind space. Actual native `character.glb` joint-space translations and rotations are mirrored and materially differ from the synthetic test setup.
- Treat **wrist target plus shoulder/elbow/wrist evaluation in the animated pose** as the appropriate corrective constraint, retaining the authored upper-arm swing phase and accepted elbow bend.

## Implementation schema (single-factor arm path only)

1. Retire the CHAR-120D **static elbow-only forward correction in live sprint playback**. Do not stack it with the new wrist correction.
2. Preserve `sprintDelta()` source UAL arm/forearm tracks, all gains, symmetric right-to-left mirror, the CHAR-120C forearm signed mean inversion, `character.glb`, walking and neutral base pose.
3. Each sprint frame after ordinary retarget playback, read the real **`LeftArm` / `LeftForeArm` / `LeftHand`** and mirrored **right** joint world positions, relative to the animated `Hips` basis (`forward`, `up`, `right`). Do this for both sides before applying correction, so the second side does not inherit the first one's changed sample.
4. Derive a continuous lead-arm index from each wrist’s signed **forward distance relative to its own shoulder**. The forward-most arm becomes the rising lead arm; the other follows behind. Use a smooth bounded phase strength, avoiding an abrupt leader swap at the mid-stride crossing.
5. For both sides, define a conservative **wrist** envelope relative to shoulder, not a hard-coded quaternion: a trailing hand near the waist/hip and a leading hand slightly forward and higher, in an anatomically plausible running lane. Preserve the actual wrist’s lateral position to avoid elbows pinching into the chest. Avoid hands forced above chest or crammed against ribs.
6. Calculate a bounded local upper-arm correction by aiming the **current shoulder-to-wrist vector** toward the desired wrist location using `parentSpaceAimDelta` in the actual upper arm’s parent frame; this rotates the arm chain without changing local forearm flexion or local wrist quaternion. Apply once after animated pose at `weight * sprintWeight` strength. Reject non-finite/degenerate joints and reject corrections that make wrist-target distance worse. Do not add a new wrist solver, new IK, procedural gait oscillator, or any leg/torso input modification.
7. Keep the correction bounded (provisional limit 0.65 rad) and avoid accumulating between frames: the playback resets all joints from captured base each tick before the correction. Preserve arm swing tempo and phase.
8. Tests: prove leading wrist is visibly higher/forward relative to shoulder than the trailing one on a linked parented rig; compare before/after target distance, verify preserved local forearm + hand rotations and untouched torso/leg/shoulder, confirm bilateral symmetry/phase, full sprint cycle, stop/return-to-walk and neutral reset. Include a **more realistic mock** with distinct upper/lower lengths and mirrored local transformations. The actual skinned avatar remains the final visual acceptance gate.
9. Build TypeScript, full Vitest, gait audits and offline/PWA checks, deploy one preview from the precise branch SHA, verify `/game`, `/build-version.json`, sprint animation JSON. No production deployment, no main merge.

## Stop conditions

Displaced shoulders, inverted palms, hand crossing torso centerline, lead hand still entirely behind the torso, backward elbows, regression in lower-body walk/sprint, visible oscillation or frame-to-frame snaps. If visual review fails, record the failure rather than escalating random quaternion coefficients.

## Execution register

- **Documentation-first record:** Owner accepted the inspection and explicitly authorized patch plus post-change preview. This document precedes implementation.
- **Runtime correction, tests, build, preview, visual review:** Pending verified commits.

**State: not accepted until actual on-screen front / back / side review.**
