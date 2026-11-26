# GTD-LMS-LONG-GUN-002 — Reese Long-Gun Holding Stance: Technical Implementation Plan

**Status:** Proposed — awaiting owner approval  
**Date:** 2026-11-26  
**Target branch:** `feat/cod-muzzle-flash-fpv-integration`  
**Planning baseline commit:** `f6d55150e2ba53487f1508236529de76f7064ec1`  
**Related proposal:** `# AOB — Long-Gun Holding Stance.md` (repository-root proposal on the newer `main` line)  
**Scope:** Reese's M4A1 and MPX-9 long-gun handling; preserve P-19 pistol handling.

---

## 1. Approval boundary

This document is a technical proposal only. It does not authorize runtime implementation, animation asset changes, GLB replacement, deployment, merge, or production changes.

Implementation may begin only after the owner has reviewed and explicitly approved this plan. Approval of this document is not approval to broaden scope beyond the work described here. Any material change to the proposed animation strategy, character rig, weapon attachment model, or supported weapon set must be returned for review before implementation.

The selected target is the branch whose HEAD matches the most recent Vercel Preview deployment identified during this review: `feat/cod-muzzle-flash-fpv-integration` at `f6d55150e2ba53487f1508236529de76f7064ec1`. The deployment was reported READY. This is branch/deployment identification only; no deployment was triggered by this planning work.

## 2. Problem statement

Reese currently mounts each extracted weapon to a right-hand bone mount and aligns the weapon's authored `gripR` landmark to that mount. When a gun is selected, the character adapter starts the pistol-aim animation. The weapon runtime already retains each weapon's `gripL` landmark, but the current character adapter does not consume it or drive a left-hand support grip.

This produces a pistol-style upper-body presentation for weapons whose intended handling is two-handed. It is especially visible on the M4A1 and MPX-9, where the left hand should visibly support the handguard or vertical foregrip and the stock should be shouldered.

The intended result is a distinct long-gun handling presentation, not a change to weapon geometry, firing mechanics, camera mode, or player movement physics.

## 3. Goals and non-goals

### Goals

1. M4A1 and MPX-9 use long-gun-ready, long-gun-aim, and compatible armed locomotion poses.
2. Reese's right hand remains the firing-hand anchor at the weapon's authored `gripR` landmark.
3. Reese's left hand visibly contacts the weapon's authored `gripL` landmark, with the M4A1 support hand on its handguard and the MPX-9 support hand on its vertical foregrip.
4. The stock/shoulder relationship, elbow bend, torso orientation, and head/eye line read as a coherent two-handed long-gun stance.
5. P-19 continues to use the existing pistol aim/fire handling path.
6. Weapon switching, holstering, first-person presentation, hidden-driving transitions, and the existing Rapier capsule remain stable.
7. The change is limited to Reese's player-character presentation and its weapon-animation selection.

### Non-goals

- No new weapon family, weapon model, attachment, recoil system, ballistics, damage, AI, NPC, multiplayer, or input-binding work.
- No change to the Rapier collision capsule, movement controller, camera architecture, or HUD.
- No duplicate camera-space arms or weapon.
- No broad animation-system rewrite.
- No change to P-19's grip or stance beyond regression protection.
- No edits to 3d-gen animation authoring unless inspection proves a required clip or pose is absent from the actual Reese export and the owner separately approves that asset work.

## 4. Verified baseline and evidence boundaries

The following statements are confirmed from source inspection of the target AOB branch and the 3d-gen source repository. They are not claims that a runtime build or visual playtest has passed.

### 4.1 AOB target branch

- `src/game/character/reese-player-001.ts` loads `/GLBs/Reese%20(1).glb`, instantiates its embedded animation groups, requires at least 60 skeleton bones, and currently expects 70 animation groups.
- The adapter resolves locomotion clips and explicitly resolves `punch`, `pistol_aim`, and `pistol_fire`. There is no current rifle clip mapping in this adapter.
- The extracted M4A1, MPX-9, and P-19 models are prebuilt and attached to a single right-hand bone mount.
- Weapon selection currently starts `groups.pistolAim` whenever a gun is equipped. The locomotion update path independently selects idle/walk/run/jump/fall clips, so an equipped weapon does not currently have a dedicated armed locomotion state.
- The weapon adapter in `src/game/weapons/gun-runtime-001.ts` reads and stores both `gripR` and `gripL` metadata. The character adapter currently uses `gripR` to align each weapon to the right-hand mount; it does not use `gripL`.
- Weapon roots are built once and switched by visibility. The proposal must preserve that allocation and ownership model.
- The character adapter has a single actor/rig for both third-person and first-person presentation. The first-person path hides selected head meshes; it does not create substitute arms or a second weapon.

### 4.2 3d-gen source capability

The inspected 3d-gen source contains dedicated rifle clips, including rifle idle/aim/fire, rifle walk/run/sprint, strafe, crouch, and reload variants. Its animation evaluator includes two-arm IK and weapon-fit/support-hand solving. This establishes that the source project has a rifle-animation and support-hand solution available in its codebase.

It does **not** establish that the exact AOB Reese GLB currently served by this branch contains those named clips, that its clip names match the generator's internal IDs, or that its exported rig has the required upper-body tracks. The actual binary must be inspected before the implementation chooses a clip mapping or assumes an IK-compatible skeleton.

### 4.3 Unverified asset/runtime facts

The following remain explicit pre-implementation checks:

- Exact animation-group names in the Reese GLB currently loaded by the target preview.
- Whether the GLB includes the rifle idle/aim/fire and armed locomotion clips needed for the selected state model.
- Whether those clips animate the full body or can be blended safely with existing locomotion.
- Exact left-hand bone name, hierarchy, bind pose, and transform space.
- Whether the support-hand animation authored in 3d-gen is already baked into the exported clips or depends on runtime IK.
- Actual visual fit of M4A1 `gripL` and MPX-9 `gripL` against Reese's left hand at runtime.

These checks are a required first implementation phase. Do not infer them from the source generator alone.

## 5. Proposed technical approach

### 5.1 Prefer authored rifle animation clips

The preferred path is to use the dedicated rifle clips already present in the 3d-gen source if the exact Reese GLB contains them and their tracks match the current instantiated skeleton.

The AOB adapter should resolve rifle clips by robust display-name aliases, following the existing `findReeseClip001` strategy. Candidate semantic groups are:

- rifle ready / low-ready idle
- rifle aim
- rifle fire (and automatic fire only if the current firing flow requires it)
- rifle walk
- rifle run
- rifle sprint
- rifle crouch/strafe only if the current movement controller exposes those states and the clips are present

Do not hardcode an assumed export name until the actual GLB's `animationGroups` have been enumerated. Keep the current pistol aliases and resolution path separate.

If rifle clips are missing from the binary, or if the clips do not animate the required hands/upper body, stop and report the exact missing capability. The fallback must be reviewed before proceeding: either update the Reese export from 3d-gen using existing authored rifle clips, or propose a narrowly scoped runtime support-hand IK solution. Do not silently substitute pistol aim or build a new procedural pose system.

### 5.2 Weapon-class animation profile

Introduce a small, explicit weapon handling classification at the character adapter boundary. It should be derived from the selected weapon ID, not inferred from model names or mesh materials.

| Weapon ID | Handling profile | Required pose family |
|---|---|---|
| `m4a1` | `longGun` | Rifle ready / aim / armed locomotion |
| `mpx9` | `longGun` | Rifle ready / aim / armed locomotion |
| `p19` | `pistol` | Existing pistol aim / fire / current locomotion behavior |

This classification is intentionally limited to the three existing Reese weapon IDs. Avoid a generic extensible weapon framework in this change.

### 5.3 State selection and transitions

The character adapter should select the animation state from the combination of equipped weapon profile, movement state, and current combat action. The proposed minimum state matrix is:

| Equipment | Stationary | Moving | Firing |
|---|---|---|---|
| Unarmed | Existing idle | Existing walk/run | Existing unarmed behavior |
| P-19 | Existing pistol aim | Existing current locomotion behavior | Existing pistol fire |
| M4A1 / MPX-9 | Rifle ready or rifle aim, according to current aim intent | Rifle walk/run/sprint when available | Rifle fire while preserving two-hand grip |

The current public adapter surface does not expose an explicit aim-intent parameter. During implementation, inspect its callers before deciding whether the current armed state should default to low-ready or aim. Do not add new input bindings as part of this task. If no aim intent exists, choose and document one deterministic default and keep the state machine ready for a later input change.

Transitions should reuse the adapter's existing cross-fade mechanism. Prevent a stale pistol animation from continuing to drive the arms after switching to a long gun, and prevent a rifle animation from surviving a switch to P-19 or unarmed state. Avoid rapid start/stop churn by comparing the requested semantic state with the currently active state before restarting clips.

### 5.4 Support-hand contact

The support-hand target must be the weapon's authored `gripL` point transformed through the weapon root's world matrix. The existing `gripL` metadata should remain in weapon-local coordinates; do not rewrite source model coordinates or duplicate grip offsets in the character adapter.

Preferred order of responsibility:

1. If the selected rifle clips already animate Reese's left hand onto the correct weapon grip, use those authored tracks and validate contact visually.
2. If the authored clips do not produce reliable contact but the rig exposes a compatible left arm chain, evaluate a constrained left-arm IK pass as a separate, explicitly approved implementation detail.
3. If neither is viable without changing the GLB or rig, stop and request a revised asset/rig decision rather than adding ad hoc per-frame bone offsets.

Any IK proposal must define the elbow pole direction, reachable target handling, update order relative to animation evaluation, and ownership/restoration of the animated bone transforms. It must not mutate shared skeleton state in a way that leaks between instantiated actors. It must also be tested with both weapon grip landmarks; the M4A1 and MPX-9 targets are intentionally different.

### 5.5 Weapon mount and orientation

Keep the existing right-hand mount and `gripR` alignment as the authoritative firing-hand attachment. The support-hand solution must not move the weapon root in a way that breaks the right-hand grip. The stock-to-shoulder alignment should primarily come from the authored rifle pose and the weapon fit, not from moving the weapon away from the right-hand anchor.

Do not add a second weapon mount, parent the weapon to the left hand, or alter the existing source model's coordinate conventions. Preserve the current `solveReeseWeaponMountRotation001` and `solveReeseWeaponGripOffset001` behavior unless runtime measurements demonstrate a concrete defect.

## 6. Likely integration points

Implementation should begin by re-reading these files on the selected branch and confirming their current contents before editing:

1. `src/game/character/reese-player-001.ts`
   - Animation-group registry and GLB clip resolution.
   - `selectWeapon` and equipment-state handling.
   - `updateControlled` locomotion/combat state selection.
   - Existing animation cross-fade and firing transitions.
   - Weapon visibility and first-person presentation boundaries.

2. `src/game/weapons/gun-runtime-001.ts`
   - Existing `ReeseWeaponId001` union.
   - Authored `gripR`, `gripL`, and `muzzle` metadata.
   - Weapon construction and local coordinate contract.
   - No change expected unless a verified metadata or typing defect is found.

3. Existing Reese character tests and weapon runtime tests
   - Locate the actual test files on the target branch before adding assertions.
   - Extend current contracts rather than creating a parallel test harness.

4. The Reese GLB at `public/GLBs/Reese (1).glb`
   - Inspect animation-group names and skeleton tracks using a reproducible asset-inspection script or Babylon loader diagnostic.
   - Do not replace or regenerate this asset without separate approval.

No HUD, React, route, city, Rapier controller, or Vercel configuration change is expected.

## 7. Implementation phases after approval

### Phase 0 — Asset and rig verification

- Inspect the exact GLB used by the target branch.
- Record the complete clip-name inventory and identify the rifle clip aliases.
- Record the left-hand bone and arm-chain hierarchy.
- Determine whether rifle clips already contain the support-hand contact and whether they are full-body or upper-body.
- Capture baseline behavior for P-19 and both long guns before code changes.

**Exit gate:** a short evidence note identifies the exact clips and rig path to be used. If required clips or rig tracks are absent, pause for owner decision.

### Phase 1 — Animation profile and state mapping

- Add explicit pistol/long-gun handling classification for the three existing weapon IDs.
- Add rifle clip references without changing P-19 resolution.
- Define deterministic ready/aim/fire/move selection for long guns.
- Keep state transitions inside the existing character animation adapter.

**Exit gate:** state-selection tests prove weapon class selects the expected semantic clip and falls back safely when an optional clip is unavailable.

### Phase 2 — Support-hand integration

- First validate authored left-hand placement from rifle clips.
- Only if necessary and approved, implement constrained left-arm IK using the weapon's world-space `gripL` target.
- Keep right-hand `gripR` alignment unchanged.
- Validate M4A1 and MPX-9 independently.

**Exit gate:** both hands visibly contact their intended landmarks with no weapon-root drift, arm inversion, or obvious elbow collapse.

### Phase 3 — Locomotion, combat, and switching integration

- Integrate rifle-ready/aim with stationary movement.
- Integrate rifle walk/run/sprint only where matching clips exist.
- Preserve the existing firing trigger and muzzle-effect ownership.
- Verify transitions among unarmed, P-19, M4A1, and MPX-9.
- Verify first-person and hidden-driving paths continue to use the same character and weapon roots.

**Exit gate:** no stale clip, stuck pose, weapon visibility leak, or switching regression.

### Phase 4 — Verification and owner review

- Run targeted unit tests, typecheck, lint, and the repository's relevant build command.
- Run the North Heights preview and inspect the actual character at gameplay camera distance and close range.
- Capture comparable stills or short clips for idle/ready, aim, walk, run, firing, and weapon switching.
- Re-test P-19 against the baseline.
- Record actual results; do not mark any acceptance item complete based only on source inspection.

**Exit gate:** owner reviews the visual evidence and accepts the result before merge or release promotion.

## 8. Acceptance criteria

### Long-gun presentation

- [ ] M4A1 uses a recognizably two-handed rifle stance.
- [ ] MPX-9 uses a recognizably two-handed SMG stance.
- [ ] Right hand remains on the authored firing grip.
- [ ] Left hand visibly contacts the authored support grip for each weapon.
- [ ] Stock is shouldered; elbows, torso, and head line up plausibly with the weapon.
- [ ] The weapon does not float, twist, or drift during idle, aim, movement, and firing.
- [ ] No unsupported pose is silently replaced by pistol aim.

### State and regression coverage

- [ ] Long-gun ready/aim state is deterministic.
- [ ] Available rifle locomotion clips are selected for their corresponding movement states.
- [ ] Firing does not break the support-hand grip.
- [ ] Switching M4A1 ↔ MPX-9 does not leave stale animation or transform state.
- [ ] Switching long gun ↔ P-19 restores the correct weapon-class pose.
- [ ] P-19's existing pistol aim/fire behavior remains unchanged.
- [ ] Unarmed locomotion remains unchanged.
- [ ] First-person presentation retains the same rig and weapon instance.
- [ ] Hidden-driving/vehicle transitions do not leave the character or weapon in a stale pose.
- [ ] No additional weapon roots or per-frame mesh allocations are introduced.

### Engineering and release discipline

- [ ] Targeted automated tests pass.
- [ ] Typecheck, lint, and production build pass.
- [ ] Runtime visual verification is recorded for both long guns and P-19.
- [ ] No unrelated files or systems are modified.
- [ ] The owner reviews the evidence before merge or production deployment.

## 9. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Rifle clips are not present in the current GLB | High — planned animation path cannot be wired | Verify exact asset first; pause for asset export decision |
| Rifle clips are full-body and conflict with movement | High — locomotion or stance may snap | Inspect tracks and test blend behavior before state integration |
| Left-hand bone naming/space differs from assumptions | High — support hand misses target | Discover hierarchy and coordinate space from loaded skeleton |
| IK competes with authored animation | High — jitter or pose fighting | Prefer authored clips; if IK is needed, define one deterministic post-animation solve |
| MPX-9 vertical foregrip target differs substantially from M4A1 | Medium — one shared pose may look wrong | Validate each weapon separately; do not assume identical hand offsets |
| Existing cross-fade leaves stale arm tracks | Medium — transition artifacts | Test all equipment transitions and avoid duplicate clip restarts |
| P-19 regression from shared state logic | High — existing handling breaks | Keep pistol profile isolated and add explicit regression tests |
| First-person camera hides head but not arms | Medium — clipping/visual mismatch | Verify first-person camera separately without introducing duplicate arms |
| Branch baseline is behind newer main commits | Medium — eventual integration conflicts | Keep the work isolated on the identified preview branch and reconcile only through the owner's normal merge process |

## 10. Scope controls and release priority

This is a focused player-facing animation correction. The preferred implementation is reuse of existing authored rifle clips and existing weapon grip metadata. Runtime IK is a conditional fallback, not an assumed requirement.

The December 1, 2026 release remains the governing deadline. If asset verification reveals that the current GLB lacks compatible rifle clips or requires a new rig/export cycle, raise that as a schedule decision immediately. Do not expand this task into a generalized weapon-animation framework or delay release-critical stability work for optional pose refinements.

## 11. Approval record

**Current status:** Awaiting owner review.  
**Implementation authorized:** No.  
**Runtime/assets modified by this plan:** No.  
**Deployment/merge authorized:** No.

Owner approval should explicitly authorize implementation of this plan on `feat/cod-muzzle-flash-fpv-integration`. Any required change to the asset strategy or the proposed support-hand fallback must be presented for approval before proceeding.
