# GTD-CHAR-122B — Isolated sprint knee and shoe-heading recovery

Date: 2026-10-22 (Africa/Johannesburg)
Baseline: main aab6d481c489ac76e4d5e387060fb02b79055211, accepted CHAR-120F
Branch: feat/char-122b-sprint-leg-heading-20261022
Status: isolated experimental recovery; visual owner acceptance pending. Do NOT merge to main automatically.

## Failure and separation

The owner rejected the CHAR-121 preview on actual mobile: elbows remain winged, knees over-flexed, and shoes point sideways from rear view. CHAR-122 attempted correcting both simultaneously, preserving actual GLB tests: strong lateral arm tightening violated the stable angular-velocity and forward-wrist gates. See `documentations/Development/GTD-CHAR-122-Sprint-Silhouette-Recovery-2026-10-22.md` on its separate experimental branch for detailed failed builds.

The lower-body defect was independent: `refineLegs(weight*(1-sprintWeight))` entirely disables walking shoe-heading correction during sprint, leaving native-reference knee rotation and source-idle-relative ankle/toe retarget uncorrected.

Measured **actual character.glb** over 80 sprint phases (two legs): before correction, maximum bend **107.96°**, toe heading deviation **46.59°**; after bounded sprint-only candidate, bend **83.18°**, toe deviation **14.04°**. These are model-space diagnostics, not proof of visual acceptability. No lower-body cross-over change is authorized.

## Patch

1. On **main baseline**, add only `refineSprintLegs(blend)`: local knee-rotation moderation toward captured neutral at 0.38 of the sprint blend, and pelvis-relative foot-toe yaw steering toward ±0.12 rad using the existing guarded `parentSpaceAimDelta`, up to 1.4 rad in one pose adjustment. Reject corrections crossing pelvis centerline.
2. Preserve existing authored step timing, pelvis, thigh motion, shoe contact, all non-leg joints, all walk/idle behavior, vehicles, flight and asset files. Fade corrections to zero when sprint stops.
3. Actual-rig test across full cycle: knee bend <95°; forward-facing toe deviation <25° over viable samples; no alteration of hip/thigh animations and accepted walk restoration; preserve 120F arm-chain trajectory unchanged. Maintain absolute elbow/wrist and continuity thresholds.
4. Run Vercel TypeScript, all Vitest and PWA pack; preview only after READY.
5. The **arm width defect remains OPEN**. Do not represent this isolated leg checkpoint as a complete CHAR-122 sprint fix.

## Gate

Preview leg heading from front/rear/side; record owner judgment. No merge to main or production until explicit acceptance.
