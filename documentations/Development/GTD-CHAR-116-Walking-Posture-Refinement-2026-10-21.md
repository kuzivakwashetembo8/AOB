# CHAR-116 — Walking Posture Refinement — 2026-10-21

Status: partial visual acceptance; checkpoint merge authorized. Lower-body walking accepted; elbow/torso issue unresolved. No deployment authorized.
Branch: Walking-Posture-Refinement (Git-safe form of “Walking Posture Refinement”).
Asset: public/GLBs/Characters/character.glb.
Baseline: af54b4778143e29e2a82ac612e3ed165aa4f50d3 (accepted CHAR-115).

## Request and references
Refine resting elbows/forearms without turning the accepted palms; replace dramatic forward walking arm motion with moderate bilateral swing; narrow excessive walking leg spread and face shoes along travel. Josh screenshots from three-player-controller glTF.html guide the open arm silhouette and opposite shoulder/leg timing. No Josh animations or geometry are imported.

## Defects and changes
1. In src/game/character/native-neutral-pose-109.ts, the fixed name-based world-X target aimed elbows toward the torso on character.glb. Derive outward from actual shoulder positions and apply a small 0.06 outward/downward cant. Roll each forearm by a fixed mirrored 0.24 rad around its actual wrist axis, leaving the wrist endpoint unchanged by that roll. Compute the wrist's fixed neutral rotation from the accepted palm world frame so upper-arm/forearm changes do not turn the palms. The neutral controller owns all adjusted linked nodes and restores them without accumulating offsets.
2. In src/game/character/retargeted-walk-110.ts, the full source-idle-relative arm deltas carried a forward bias and large cross-body excursion. Centre each arm/forearm/shoulder cycle around its quaternion mean, then apply walking gains: upper arm 0.42, forearm 0.35, shoulder 0.55. Preserve the source timing and mirrored half-cycle relationship, so shoulders/arms retain their opposite-leg timing. Wrists remain fixed relative to their corrected relaxed bases.
3. Narrow only ankle excursions beyond 0.10 m from the pelvis centreline: reduce half of the excess, bounded at 0.035 m and 0.055 rad per thigh. Roll back any correction that puts knee/ankle/toe inside its 0.04 m ipsilateral lane.
4. Align measurable, forward-projecting shoe headings to within 0.10 rad of pelvis-forward using parent-space yaw. Preserve authored pitch, roll, and lift. Skip near-vertical/backward toe projections where forward yaw is not reliable. Reject any toe correction crossing the lane.
5. Retain CHAR-115 head stabilization, stride timing, and reset behavior.

## Running reference register
The PRE-CHAR-116 full-amplitude motion is recorded as a promising starting point for running, not an accepted running implementation:
- Immutable reference: af54b4778143e29e2a82ac612e3ed165aa4f50d3.
- Runtime: src/game/character/retargeted-walk-110.ts at that commit.
- Generated source: char110-ual-walk.json from the unchanged CHAR-110 bake pipeline.
- Full right-chain deltas, elbow-direction correction, relaxed wrists and mirrored left half-cycle form the reference.
- This branch leaves source clip keys unchanged. Running must get its own speed/cadence/foot-contact validation and approval; do not simply label walking with a faster speed.

## Actual-rig measurements
Compared using the same accepted 41-frame clip on the actual 73-joint GLB hierarchy, sampled at 160 phases:
- Resting elbow X: +/-0.1462 m -> +/-0.1907 m; shoulders +/-0.1740 m. Each elbow now rests 0.0167 m outward from its shoulder line.
- Resting hand X: +/-0.1409 m -> +/-0.2251 m.
- Accepted world palm quaternion retained to floating-point tolerance on each side.
- Peak ankle separation: 0.26335 m -> 0.23194 m.
- Maximum absolute shoe yaw for measurable forward-projecting toe vectors: 0.95663 rad -> 0.10000 rad (54.8 degrees -> 5.7 degrees).
- Minimum ipsilateral knee/ankle/toe clearance: 0.06641 m, unchanged.
- Foot longitudinal lead range: [-0.61529,+0.64202] m -> [-0.61644,+0.64304] m. Both feet still overtake each other.
- Right-hand lateral excursion: 0.18773 m -> 0.00964 m; average longitudinal offset: 0.14932 m -> 0.00710 m. Longitudinal excursion becomes 0.15889 m from 0.08004 m because motion now goes forward AND backward rather than predominantly across the body.
- Head angular drift <=2.99e-8 rad; right-wrist local angular drift 0.
These are skeletal numerical checks, not a claim of visual acceptance.

## Regression and review
The new actual-rig regression validates outward elbow gap, preserved palm facing, moderate upper-arm amplitude, narrower lanes, forward shoes, no crossover, head alignment, wrists and standing reset. Its deterministic clip does not depend on generated prebuild assets. Existing neutral and walking tests are also run.
Preview reviewed by Harmony. Merge this full current state as a preservation checkpoint without deployment; continue torso refinement on Walking-Posture-Refinement.

## Visual review and preservation checkpoint — 2026-10-21
Harmony's verdict: “The elbow issue has not been solved however the feet issue has. His lower body has achieved the intended walking behavior.”
- Accepted: lower-body walking, foot alignment and stance.
- Unresolved: resting elbow/torso posture. The measured outward joint gap and passing numerical tests did not establish the intended visible elbow anatomy; do not describe the elbow patch as solved.
- Preserve the complete reviewed state at runtime commit 9dc5c237fce2ebccef0bea51c85e791b34f62730 by merging PR #40 to main.
- Explicit release restriction: do not deploy this checkpoint. Existing production stays on its prior deployed commit.
- Keep Walking-Posture-Refinement available for subsequent torso work. Further edits must retain the accepted lower-body behavior and be reviewed before another merge or deployment.
