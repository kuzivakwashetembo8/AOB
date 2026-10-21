# GTD-CHAR-110 — Retargeting-First Trajectory Decision (Voight Capability Program)
Date: 2026-10-21
Decision: **ACCEPTED DIRECTION; DOCUMENTATION-ONLY CHECKPOINT**
Branch: `experiment/gtd-char-110-josh-rig-audit-20261021`
Canonical companion failure register: `documentations/Issues/GTD-CHAR-110-111-Procedural-Walk-Failure-Register-and-Retarget-Pivot-2026-10-21.md`

## Executive decision
**Stop inventing complete human locomotion from math phases. Transfer and calibrate real authored skeletal animations onto the owned `character.glb`.** The rejected October 21 procedural walking trial must not be resumed or extended as the basis for sprinting, seating, shooting or fighting.

The owner accepted CHAR-109 **natural standing**, not walking. October 21 inspection of the new CHAR-110 native-leg trial found knee bending but apparent moonwalking, no arm swing, and excessively fast walking. The synthetic leg-lift unit tests passed but did not establish correct animation in the real weighted character. Keep all distinctions explicit.

## Why the strategy changes now
- **Architectural leverage:** A once-validated source-to-target rig mapping can power walking, sprinting, jump, flying, seating, shooting, fighting and future authored clips. Ad hoc mathematical gait patterns require a new physically and visually coordinated algorithm for every movement; combinatorial transitions multiply defects and maintenance.
- **Failed empirical checkpoint:** The source rig exists; both vertex phase deformation and joint sine-phase animation failed visual fidelity. More amplitude, different angle multipliers, or cosmetic hand offsets cannot fix absent stance-foot locking and whole-body timing.
- **Working references are available:** UAL is the proven integrated locomotion/driving specimen in the same Babylon/Rapier runtime. The inspected Josh glTF scene loads genuine authored animations and crossfades them with a mixer; IK follows animation.
- **Velocity mismatch:** the human walking mode currently translates at 3.8 m/s, too fast for a casual walk. Match animation timing, physical displacement and stride geometry rather than changing speed independently.

## Non-negotiable target architecture
```
UAL or Josh source (real, verified motion clips; source rig)
      |
      | build-time anatomy map, rest/bind transforms, axes,
      | handedness, scale, animation sampling, provenance validation
      v
Voight target-specific retargeted animation clips
      |
      | runtime Babylon AnimationGroups / mixer, state transitions,
      | blend and upper-/lower-body masks where warranted
      v
Original character.glb 73-joint linked skeleton (single mesh identity)
      |
      | post-animation foot IK/stance correction, ground contact,
      | hand IK, pelvis compensation, vehicle-specific anchors
      v
Existing GTD Rapier controller, camera, input, vehicle system
```
Prefer precomputed, optimized clips stored as local approved game assets; **do not require downloading entire Josh/UAL model solely to animate Voight at runtime**. Preserve reversibility and mobile/offline performance. The source and destination joint counts need not match if anatomical chains and rest-relative motion are reconciled; unmatched joints must be evaluated, not guessed.

## Sequence and stop/go gates

### A. CHAR-110A — source comparison and explicit map (do this first)
1. Read `three-player-controller/example/glTF.html`, `example/glTF.js`, `src/PlayerController.ts`, `src/systems/AnimationSystem.ts`, `FootIK` and inspect pinned UAL/Josh actual GLB assets, not just configuration names.
2. Produce `sourceJoint -> canonicalAnatomicalJoint -> targetJoint` tables for pelvis/spine/head, shoulders/arms/hands, thighs/knees/ankles/feet/toes, plus hierarchy chains.
3. Capture each joint's local bind/rest orientation, inverse-bind matrices, bone axes, scaling, basis parity, pose reference and clips/channels. Mark incompatible/ambiguous joints explicitly; do not coerce unverified mappings.
4. Verify rights to redistribute derived animation tracks (separate from project code license).
5. **Gate:** an auditable target-safe motion-delta transform; no copied quaternion tracks merely because bone labels resemble each other.

### B. CHAR-110B — one offline retargeted UAL walk clip
1. Begin with UAL `Walk_Loop` since source animation and GTD integration already exist; Josh `walk` is the secondary comparator, not a premise that its 135-joint hierarchy works unmodified.
2. Transform animations relative to source rest transforms, reconcile local coordinate bases and apply to matching Voight target joint rest frames. Maintain true skinned vertices and clothing geometry.
3. Solve pelvis/leg/arm motion as a **coordinated full-body clip**. Do not keep CHAR-109's idle arm quaternions forced during walk; establish per-state pose authority and preserve neutral pose when idle.
4. Calibrate gait animation time to actual measured Rapier ground speed; initial owner-review target normal walk about **1.5 m/s**. Keep default UAL and opt-in original switch until approved.
5. **Gate:** isolated walk/idle preview only; validate no T-pose, backward facing, upper-body distortions, foot dragging or visible skate. If incompatible, record exact failing joints before any alternate strategy.

### C. CHAR-111 — owner acceptance of realistic walking
1. Confirm alternating feet **clearly swing off the ground**, knee bends anatomically, heel/toe contact is visible, hips transfer weight, arms counter-swing naturally, start/stop blending works, heading is correct.
2. Add/contact-calibrate ground foot IK and stance-foot locking on roadway, curbs and sidewalks; IK is a correction layer, not a replacement for the source walk clip.
3. Check desktop/mobile camera perspectives, arrow/WASD/touch inputs, 60 Hz physics, loading/offline and FPS. No extra Rapier actor, no duplicate GLB and no new animation engine.
4. Compare visual evidence side/front/rear under ordinary walking speed. Owner explicitly approves or rejects before advancing.

### D. CHAR-112/113/114 — subsequent capabilities, strictly in order
- CHAR-112: retarget `Sprint_Loop`, jump start/loop/land; transitions and measured speed calibration.
- CHAR-113: directional fly/hover clips; retain existing flight physics/controller.
- CHAR-114: seating/enter/exit/driving loops and hand/foot cabin IK; then character graduation.
- Later fighting/shooting: authored full-body and upper-body masked action clips, recoil/contact IK, layered on locomotion. Do not implement these during walking verification.

## What remains accepted vs rejected
**Preserve:** CHAR-109 neutral standing joint solution; corrected travel-facing orientation; character identity/mesh; single Rapier capsule/camera; UAL fallback; working vehicle and flight controls; offline/PWA and performance budget.

**Do not promote:** CHAR-105 raw-vertex walking, CHAR-106 sleeve/shoulder vertex manipulation, CHAR-107 Bone-only shoulder transforms, CHAR-110 sine-driven thigh/knee gait as a full-body solution. Code on the isolated experimental branch is historical reference, not production acceptance.

**Not proven yet:** successful UAL/Josh-to-Voight motion retargeting, planted contact, realistic walking, upper/lower-body layering, performance of new clips and source asset redistribution rights.

## Change control
This document **supersedes** any earlier CHAR-109/110/111 handoff advice that proposes a per-joint procedural walking cycle as the normal fallback or adopts 3.8 m/s as an accepted walking pace. Prior documents remain unchanged as the contemporaneous historical record, with explicit pointers to this decision. If retargeting fails, file a compatibility-failure report and request a new architectural decision; do not quietly restart the failed plan.

**Next authorized work:** compatibility audit and an isolated, demonstrably correct UAL `Walk_Loop` retarget prototype, only after this documentation is reviewed. No patch, preview build or merge is part of the documentation checkpoint.
