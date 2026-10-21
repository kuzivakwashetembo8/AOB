# GTD-CHAR-110 — UAL Walk Retarget, Implementation and Verification
Date: 2026-10-21
Branch: `feat/char-110-ual-retarget-20261021`
Base: `docs/char-110-retargeting-pivot-20261021`, originally `6386b0f1eadfc6f864e61ea62d486fff98893826`.
State: **build verified, visual acceptance pending; do not merge to main**.
Deployed code commit: `b1dc8317c5283f8afd052f79dc53844188a58021`
Preview: https://gtd-1h7x9ex8w-interlinkglobaltech.vercel.app/game
Vercel deployment: `dpl_A4uiUMJp51zr3G6PjbxKNp24aarY`, READY.

## Historical decision / decommissioned approaches
See `documentations/Issues/GTD-CHAR-110-111-Procedural-Walk-Failure-Register-and-Retarget-Pivot-2026-10-21.md`. The owner rejected CHAR-105 mesh gait and CHAR-110 prior sine-wave linked-leg gait: actual knees bent but feet still appeared to moonwalk, arms stayed locked down and walking speed was 3.8 m/s. **Do not restart the failed plan.** This branch starts from docs/main, NOT from the rejected experiment. CHAR-109 standing posture remains accepted and is not changed.

## Assets and factual audit
- Author target: `public/GLBs/Characters/character.glb`, 12,197,104 bytes, 86 nodes, **73 joints**, no native clips.
- Source: `public/GLBs/Characters/ual.glb`, pinned Quaternius UAL through `interlinkglobal/three-player-controller@ca82bbc76a3b9b0afa80c73b60167adf6123b9b6`, Git blob `e236f349526637a5c829c408d48ce9d8fcde9cff`, 3,749,364 bytes. The baseline OFFLINE-001 build already downloads, verifies and localizes this source.
- UAL: 67 nodes, **65 skin joints**, existing `Walk_Loop`, `Idle_Loop`, `Sprint_Loop`, `Driving_Loop` and other clips. The real `Walk_Loop` is **1.333333 seconds**, 195 channels (65 each translation, rotation, scale), generally 33 animation key samples.
- Source leg names: `thigh_l/r`, `calf_l/r`, `foot_l/r`, `ball_l/r`. Target leg names: `LeftUpLeg/RightUpLeg`, `LeftLeg/RightLeg`, `LeftFoot/RightFoot`, `LeftToeBase/RightToeBase`. Structural parent chains confirmed from BOTH actual GLB sources.
- Rest-joint rotations differ radically; naive copying (or renaming) quaternion tracks would be wrong.

## Retarget map and method
`scripts/char110-bake-ual-walk.mjs` runs in `prebuild` AFTER the already-authoritative UAL asset staging and `scripts/char110-rig-audit.mjs`. It parses glTF JSON/BIN keyframe accessors, rejects unverified non-float or unsupported interpolation, verifies source/target joint skins, and computes a canonical anatomical frame from hip, feet and thigh positions. Verified source/target anatomical forward both point approximately negative Z in source GLB space. Alignment quaternion: `[0.036185,0,0,0.999345]` (~4.15° pitch).

Mapped roles:
- `pelvis -> Hips`;
- `spine_01/02/03 -> Spine/Spine1/Spine2`, `neck_01 -> Neck`, `Head -> Head`;
- `clavicle_l/r -> LeftShoulder/RightShoulder`;
- `upperarm_l/r -> LeftArm/RightArm`;
- `lowerarm_l/r -> LeftForeArm/RightForeArm`;
- `hand_l/r -> LeftHand/RightHand`;
- `thigh_l/r -> LeftUpLeg/RightUpLeg`;
- `calf_l/r -> LeftLeg/RightLeg`;
- `foot_l/r -> LeftFoot/RightFoot`;
- `ball_l/r -> LeftToeBase/RightToeBase`.

The build samples UAL `Walk_Loop` **relative to the first frame of UAL `Idle_Loop`**, not relative to its original bind/T pose. This avoids lowering Voight's already-accepted idle arms *a second time*. Every source local idle-relative delta is converted into its source-parent rest frame, aligned anatomically, then transformed into the target parent's local rest frame. No raw source local rotation is applied directly to a target joint.

Offline output: `public/GLBs/Characters/char110-ual-walk.json`, **34,779 bytes** for **22 anatomical tracks, 41 samples**. No second GLB, no Three.js runtime, no network request to Josh/UAL origin during game play. Each quaternion/loop is validated, and source/target identity remains separate.

Verified preview-bake peak local angular deltas in radians:
- Left/right upper arms **0.603 / 0.653**; left/right forearms **0.527 / 0.727**.
- Left/right thighs **0.609 / 1.063**; knees/calves **1.175 / 1.462**.
- Left/right feet **0.522 / 0.765**; toes **0.442 / 0.291**.
These values establish nontrivial authored joint motion. **They do not by themselves measure skinned shoe clearance, hip contact, foot plant, player-perceived appearance or FPS.**

## Runtime integration
- `src/game/character/retargeted-walk-110.ts`: same-origin asset loader, schema and 22-joint integrity gate, Babylon linked `TransformNode` animation, eased weight/start/stop (0.20s), cycle time advanced by actual Rapier planar speed, frame interpolation, and exact rest restoration on stop, disable or disposal.
- `src/game/world/mercer-static-character-103.ts`: removes the CHAR-105 vertex-deformation player from runtime; loads the retargeted animation on the **same instantiated Voight GLB** and captures animated rest AFTER CHAR-109 has lowered/accepted the arms. During motion, do not overwrite arm swings with `neutralPose.ensure()` each tick. The accepted static posture is preserved when stopped.
- `src/game/core/gtd-runtime.ts`: opt-in custom character walking target **1.5 m/s** (instead of 3.8); existing UAL default, Rapier capsule, orientation, camera and input remain intact. Running/flight/driving custom-human gates remain disabled for this milestone.
- `src/test/char110-ual-retargeted-walk.test.ts`: verified 2/2 unit cases for schema/bad quaternion rejection, opposing arm playback and neutral restoration.
- Vercel verified strict `tsc --noEmit`, Vitest tests, Vite/Nitro app bundle, local offline packaging, and `CHAR110_RETARGET_SUCCESS` emitted by the real source bake. Initial compile failures (a wrongly escaped code comment and a TypeScript report union) were corrected on the branch before the READY build; neither was merged.

## Important remaining work / owner gate
This is a **first visual checkpoint**, NOT CHAR-111 walking acceptance. Runtime photos/video are not independently inspected. Specifically:
1. Stand facing camera, side, rear: shoulders remain in **accepted CHAR-109 neutral**.
2. Walk straight slowly (~1.5 m/s): opposite leg swing, discernible foot lift, knee flexion, natural *counter-swinging* arms, correct forward heading. Check visible clipping and excessive shoulder rotation.
3. Start, stop, turn, compare stance and stride: inspect skating, planted-foot drift, pelvis bob and hem/shoe deformation. Foot-ground IK and per-foot stance locking are NOT yet implemented; this may require CHAR-111.
4. Mobile preview, arrows/touch, entry/exit transition from optional Character mode; no loading regression, observe FPS and one-minute attention budget. Default UAL must be recoverable by disabling Enable Character.

If owner rejects, document observed failures and revise this retargeting model, **not** the failed sine-wave gait. No merge and no parity promotion without owner visual acceptance.

## Animation rights provenance
Original Quaternius UAL pack page (https://quaternius.com/packs/universalanimationlibrary.html) describes CC0 usage, including commercial redistribution in games. Quaternius has a newer general 2026 QAL page that places some restrictions on standalone asset redistribution. Before production shipping independently distributable clips, verify specific pack provenance, applicable license version and whether this precomputed JSON is treated as a standalone asset. Neither a source fork MIT code license nor a passing build resolves this legal question. Current status: review pending; preview experimental.
