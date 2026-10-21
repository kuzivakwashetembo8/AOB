# CHAR-118 — Slight Forward Walking Torso Inclination

Date: 2026-10-21. Branch: Walking-Torso-Inclination.
Baseline: 45413d32333768fc9dd37f497366652a3a5e8726 (accepted CHAR-117).
Status: observations documented before implementation; patch and preview authorized. Merge awaits Harmony's confirmation.

## Observations confirmed by Harmony
References: Screenshot (505).png (humanoid), torso too straight, stride too forward..png (Voight).
Both are side views, at different walking phases.
- Voight's back reads nearly vertical from pelvis to shoulders. His advancing leg appears to move ahead while the torso remains behind.
- The humanoid has a gentle back curve and a slight forward inclination. Its shoulders and head appear slightly ahead of the pelvis in the direction of movement.
- The relevant difference is the torso's participation in the step, not simply stride length or knee height.
- Target: a SLIGHT forward walking inclination with a relaxed, distributed back curve. Avoid a hunch, a sharp waist hinge or a running lean.
- Preserve CHAR-117 shoulder/elbow articulation, palm facing relative to the arms, and moderate opposite-side arm swing. Arms should accompany the torso.
- These stills establish visual direction, not a measured spine angle, exact gait phase or particular bone correction.

## Bounded implementation plan
Start with five degrees of additional forward curvature distributed across Spine, Spine1 and Spine2 (2, 1.75 and 1.25 degrees respectively). These are initial implementation values, not measurements from the images. Apply in audited parent-local joint frames and fade with existing locomotion weight. Leave standing neutral, hips, legs, cadence, leg refinement, collision and GLB unchanged. Retain level head/gaze stabilization while allowing the head position to follow the torso.

Verify the actual GLB and skinned silhouette in matched side/three-quarter views. Compare baseline/candidate across a full cycle: pelvis and lower-body transforms must match; accepted arm local rotations must match; walking-only spine change must reset cleanly. Obtain a Vercel preview for Harmony's merge confirmation or denial. Do not merge or deploy production in this task.
