# CHAR-118 — Slight Forward Walking Torso Inclination

Date: 2026-10-21. Branch: Walking-Torso-Inclination.
Baseline: 45413d32333768fc9dd37f497366652a3a5e8726 (accepted CHAR-117).
Status: five-degree walking torso inclination accepted by Harmony; merge to main authorized. Production deployment is not part of this acceptance instruction.

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

## Implementation and verification
- retargeted-walk-110.ts applies an additive five-degree forward curvature across Spine/Spine1/Spine2: 2/1.75/1.25 degrees. Each world-direction aim is converted through the actual parent frame using parentSpaceAimDelta. Actor-forward and up are derived from the hips transform, so actor yaw is respected.
- Apply after normal clip playback and leg refinement, before existing head leveling. The arms inherit the torso motion while retaining their accepted local articulation, wrist pose, swing gains and phase. Head position follows the back; gaze remains level.
- Existing 0.20-second locomotion blend controls lean onset and removal. Each frame starts from the original playback bases, preventing accumulated rotation. Stop/reset restores the accepted standing pose. A different/unmapped spine hierarchy receives original playback without the optional lean.
- Four regression files / six tests passed. The new actual-rig regression samples walking with two actor headings and an identity-hierarchy control, checks each spine angle, unchanged shoulder/arm/forearm/hand local quaternions, unchanged pelvis/leg world matrices, stable head orientation, fade to standing and reset.
- Targeted TypeScript checking of the changed runtime and new test passed.
- Separate baseline/candidate playback with the actual retargeted walk clip at standing plus 160 phases: standing and lower-body world matrices have maximum difference 0; neck position moves 0.02790–0.02822 m forward relative to the pelvis.
- [Matched skinned diagnostic](CHAR-118-torso-inclination-comparison.png): accepted baseline above, candidate below; standing side, two walking phases and walking three-quarter. CPU linear-blend skinning of original GLB triangles is diagnostic evidence, not a browser screenshot or artistic acceptance.
- No change to neutral-arm calibration, GLB bytes, leg stride or source clip. No merge or production deployment. Preview is the decision gate.

## Acceptance gate — 2026-10-21
Harmony: “5-deg is acceptable, merge it with main then once merged return for experimental refining otherwise we achieved the objective we wanted today.”

Accepted preview runtime: c4d6b8be65a5cc7aec23ca4259a9d1b6c090797f at https://gtd-dpvyx3k2q-interlinkglobaltech.vercel.app/game . The earlier preview-only merge restriction above is superseded by this explicit instruction. Preserve the five-degree distributed inclination (2/1.75/1.25 degrees), standing reset, accepted arm articulation and existing lower-body playback as the new main checkpoint. Return after merge before starting experimental refinements. No further runtime change or production deployment is included in this checkpoint.
