# GTD-CHAR-110/111 — Procedural Walking Failure Register and Animation-Retargeting Pivot
Date: 2026-10-21
Disposition: **REJECTED AS THE PRIMARY WALKING STRATEGY / PRESERVE AS EXPERIMENTAL EVIDENCE**
Decision: **Retarget authored skeletal animation; do not continue hand-authoring sinusoidal gait as Voight's locomotion system.**
Source branch: `experiment/gtd-char-110-josh-rig-audit-20261021`
Owner confirmation: 2026-10-21 discussion following mobile visual review.
Record scope: documentation and direction only. No runtime patch, no production merge, no deployment as part of this decision.

## Why this record exists
Synthetic or approximate motion repeatedly produced technically defensible test output but unacceptable visible human behavior. Without a permanently discoverable failure register, a future implementation may reintroduce geometry warping, manually alternated leg poses, or joint sine waves merely because these are easier than skeletal retargeting. **Those paths were tried, visually rejected, and must not be silently revived.**

Do not conflate rejected procedural *gait generation* with useful procedural *correction*. IK for foot planting, hand contact, look direction, root alignment, and collision can remain procedural downstream of a proper authored movement cycle.

## Evidence ledger: attempts, actual outcomes and preservation rules

| Gate | What was attempted | Observed result | Decision |
| --- | --- | --- | --- |
| CHAR-105 | Raw-vertex shoulder positioning and two-phase, below-hip mesh deformation for walking, with existing Rapier movement | Shoulders unnaturally raised, arms distorted; synthetic walking/feet dragging; original character initially faced backwards | **Rejected for animation**; preserve separately accepted travel-heading correction |
| CHAR-106 | Further shoulder/upper-sleeve vertex pulling based on height and lateral coordinates | Inflated shoulders, sleeves ballooning; moving hands inward did not relax true upper arms | **Rejected; never reuse mesh-space upper-body heuristics** |
| CHAR-107 | Rotate Babylon `Bone` rather than glTF linked `TransformNode` | T-pose/regression because linked node was authoritative | **Rejected; linked transform node authority is required** |
| CHAR-108 | Read-only source GLB skeletal/clip audit | `character.glb` is a real 73-joint skinned rig, **0 animation clips** | **Retain as accepted factual evidence** |
| CHAR-109 | Bounded, reversible, parent-local linked arm-joint correction | Owner accepted natural relaxed neutral standing silhouette | **Accepted; freeze standing baseline** |
| CHAR-110 trial | Josh scene/actual GLB audit plus custom target-leg, sine-phase skeletal gait `skeletal-gait-110.ts`, replacing CHAR-105 leg vertex deformation on opt-in character | Confirmed usable bilateral thigh/calf/foot joint chains. Synthetic test proved leg-joint motion and possible ankle rise. **Real owner preview still visibly moonwalked**; no convincing leg lift, arms locked down, ground travel too fast | **Trial visually rejected for walking; do not promote to CHAR-111 or main** |

Owner's October 21 mobile test of preview:
`https://gtd-ooor7tpc5-interlinkglobaltech.vercel.app/game`
Deployed trial commit: `d07734b572a91e5058c75a4e0e48a2564e915c81` (the deployed build is evidence of the failed approach, not an accepted preview).
Owner observations, verbatim in substance:
1. Knees now bend, but feet do not meaningfully lift; character **moonwalks forward**.
2. Arms do not swing, hanging straight down like a standing-at-attention pose.
3. Translational speed is excessive for ordinary walking.

**Evidence precision:** One supplied still screenshot documents presentation/context, not a measurable stride trajectory. The owner reported the defects from interactive observation. We do not claim measured foot clearance, frame-time, cadence, contact-phase or speed from that screenshot. The source code independently confirms the configured walking translation is `WALK_SPEED = 3.8 m/s` for this mode. This is **13.68 km/h**, a running-range ground speed, not ordinary walking. Synthetic test green status is not visual acceptance.

## Mechanistic failure analysis
- The first mesh-based gait moved vertices without anatomically valid limb hierarchy, heel strike, foot plant or ground-relative contact. Fixing shoulder shape did not fix locomotion.
- The later joint-driven trial improved anatomical authority (linked upper/lower leg transforms) but used a `sin(phase)` driven alternating thigh/knee pose, not an authored multi-joint human gait. It has no enforced stance-foot lock, no correct center-of-mass/hip transfer, no guaranteed toe clearance, no pelvis compensation, and no measured ground-contact IK. A computed ankle rise inside a synthetic skeleton does not prove visually correct foot elevation on a weighted GLB mesh.
- CHAR-109's arm-neutral controller persistently restores down-at-side shoulders, while the gait trial never drives upper-body swing. Consequently arms remain stationary. Any next animation system must **compose** the accepted idle arm pose with moving gait poses instead of globally forcing the neutral pose throughout movement.
- Translation speed and animation timing were not calibrated together. At 3.8 m/s a short non-planted procedural cycle amplifies skating even if knees bend.
- The retarget compatibility gate was **not completed** before the first CHAR-110 joint-sine gait experiment. That trial must not be misconstrued as evidence that UAL or Josh animation retargeting is impossible.

## Verified source facts
- Owned target `public/GLBs/Characters/character.glb`: 86 nodes, one skin, 73 joints, 12 skinned meshes, no authored clips. Leg hierarchy `Hips > LeftUpLeg > LeftLeg > LeftFoot > LeftToeBase` and matching right chain. Arms `LeftShoulder > LeftArm > LeftForeArm` and matching right.
- Josh fork `interlinkglobal/three-player-controller` pinned `ca82bbc76a3b9b0afa80c73b60167adf6123b9b6`: actual `example/glTF.html` + `glTF.js` uses authored clips, mixer blending and subsequent foot IK. Pinned `josh.glb` audit: 144 nodes, 135 joints, 42 source animation clips including `walk`, `run`, `idle1` and `Driving_Loop`. This is not yet proof of target compatibility or legal asset redistribution.
- UAL is already imported in GTD: working `Idle_Loop`, `Walk_Loop`, `Sprint_Loop`, `Driving_Loop` and associated game integration are established in the existing development humanoid. Their transfer to Voight requires anatomical/rest-basis validation, not direct track copying.

## Superseding policy / no-repeat rules
1. **Do not refine `human-walking-105.ts` vertex-phase walking as the long-term locomotion solution.**
2. **Do not extend `skeletal-gait-110.ts` sine-wave joint animation to running, combat, flight or driving** as the primary ability generator. Keep it as a negative-control experiment while the branch is retained; do not merge this trial gait into `main`.
3. **Do not conclude retargeting failed:** direct source-to-target retargeting has not been implemented or meaningfully tested yet.
4. **Do not disturb CHAR-109's accepted standing silhouette, preserved heading fix, skinning, single Rapier capsule, camera and mobile control behavior.** Adapt pose ownership by state rather than clamping gait arms to idle continuously.
5. New primary architecture: **authoritative Voight skeleton + validated offline retargeted source animations + runtime blend/state machine + bounded post-animation IK**. Keep Babylon.js/Rapier.
6. Prefer UAL's already integrated source for the first `Walk_Loop` proof; use Josh's larger clip library after the reusable mapping is proven. Do not import Josh character mesh into GTD runtime.
7. Tune animation and translation together. Proposed initial normal walking target: **1.5 m/s (5.4 km/h)**, adjustable only after testing; 3.8 m/s is not acceptable as the default walking calibration.
8. If source clip rest frames cannot safely map, **stop and document the incompatible joints, scale/axis/bind issues**. Evaluate targeted re-rigging or an authored animation export rather than reverting automatically to hand-synthesized walking.
9. Validate applicable asset/animation redistribution and attribution rights; the code repository's MIT license alone does not verify rights to bundled character animations.

## Evidence anchors
- `documentations/Development/GTD-CHAR-105-Enable-Human-Walking-2026-10-20.md`
- `documentations/Development/GTD-CHAR-106-Shoulder-Failure-Recovery-2026-10-20.md`
- `documentations/Development/GTD-CHAR-108-glb-native-rig-and-idle-audit-2026-10-21.md`
- `documentations/Development/GTD-CHAR-109-Accepted-Posture-and-CHAR-114-Handoff-2026-10-21.md`
- `documentations/Development/GTD-CHAR-110-Josh-scene-and-native-gait-trial-2026-10-21.md` (experimental branch)
- `src/game/character/human-walking-105.ts`, `src/game/character/skeletal-gait-110.ts`, `src/game/character/native-neutral-pose-109.ts`, `src/game/world/mercer-static-character-103.ts` (inspect by commit/ref)
- Superseding plan: `documentations/Development/GTD-CHAR-110-Retargeting-First-Trajectory-Decision-2026-10-21.md`.

**Status gate:** procedural walking is rejected; actual animation retargeting is the next experiment and remains **unimplemented/unaccepted**.
