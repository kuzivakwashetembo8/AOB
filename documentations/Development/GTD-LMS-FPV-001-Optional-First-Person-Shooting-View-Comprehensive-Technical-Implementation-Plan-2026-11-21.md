# GTD-LMS-FPV-001 — Optional First-Person Shooting View
## Comprehensive Technical Implementation Plan — 2026-11-21

**Project:** Age of Abundance (AOB)
**Repository:** `kuzivakwashetembo8/AOB`
**Baseline:** `main` at `c09208504347d29ce7f988faa5075948c1c942a6`
**Document status:** PLANNING ONLY — implementation not yet authorized
**Feature:** Optional first-person camera/viewmodel for on-foot shooting
**Default perspective:** Third person
**Acceptance authority:** Project owner
**Release deadline:** 1 December 2026

> **Authorization boundary:** This commit records the implementation plan only. It does not authorize runtime changes, asset changes, a preview deployment, a merge or a production deployment. Implementation requires separate owner approval. Once approved, work must be isolated on a feature branch and previewed before any production promotion.

---

## 1. Product goal

Add an optional first-person shooting perspective to Age of Abundance while retaining the existing third-person experience as the default. Players must be able to opt into first person in Settings and switch perspective directly from the gameplay UI without opening the pause menu.

This is a **player-selected camera mode**, not a default camera replacement and not an automatic camera snap every time the player presses Fire. The selected mode should remain consistent between Settings and the in-game toggle. A fresh or migrated installation defaults to third person.

The first-person presentation must feel like a deliberate shooter view: stable eye position, correct forward aim, visible weapon and hands/forearms, readable weapon movement, coherent recoil, and no viewmodel clipping through the city. It must use AOB's existing Babylon.js renderer and existing player/weapon systems.

## 2. Claude of Duty — important signals to carry forward

The read-only study of `kuzivakwashetembo8/Claude-of-Duty` identified the following useful design principles:

1. **Separate world presentation from first-person presentation.** Claude of Duty uses a camera-relative viewmodel anchor and a dedicated first-person presentation rig. The world character and the local weapon presentation do not have to be the same rendered object.
2. **The camera is the aiming authority.** Shot direction is derived from camera forward, while the muzzle transform supplies the physical shot origin. This avoids treating the visible barrel direction as the sole authority for player intent.
3. **Weapon grips are explicit landmarks.** `gripR` and `gripL`, together with finger/back basis vectors, define where the hands contact the weapon. The hands are solved against those weapon landmarks rather than eyeballed into place.
4. **Use layered motion, not one giant animation.** Base pose, ADS, sway/breathing, locomotion bob, camera-turn lag, recoil/settle and authored action clips are separate layers.
5. **ADS is a geometric alignment problem.** The sight landmark is brought onto the camera axis; it is not merely a manually guessed gun offset.
6. **Keep firing state and presentation state coordinated.** Weapon state, ammunition, shot cadence, camera recoil, viewmodel recoil, muzzle position and shot direction need clear ownership and consistent timing.
7. **Treat the support hand as a real contact.** Claude's fitted support-hand pose and contact-AO work show that visual grip quality is more than placing a hand near the foregrip.

Reference source files:
- [Claude of Duty — viewmodel.js](https://github.com/kuzivakwashetembo8/Claude-of-Duty/blob/main/src/weapons/viewmodel.js)
- [Claude of Duty — weapons/index.js](https://github.com/kuzivakwashetembo8/Claude-of-Duty/blob/main/src/weapons/index.js)
- [Claude of Duty — hands.js](https://github.com/kuzivakwashetembo8/Claude-of-Duty/blob/main/src/weapons/hands.js)
- [Claude of Duty — player/index.js](https://github.com/kuzivakwashetembo8/Claude-of-Duty/blob/main/src/player/index.js)

### 2.1 What must not be copied literally

Claude of Duty is a Three.js browser FPS. AOB's live game uses Babylon.js, Rapier player physics, a FreeCamera in the North Heights runtime, a skinned Reese GLB and a Babylon adapter that converts the extracted Three.js weapon geometry.

Do not transplant Claude's Three.js scenes, cameras, animation classes or rendering code. Transfer the architecture and validate equivalent Babylon behavior. Do not add a second renderer or mount the /guns gallery into gameplay.

---

## 3. Verified AOB baseline and integration points

The following are code observations from the current `main` branch, not assumptions about future implementation:

- `src/game/experiments/north-heights-city-8.ts` creates a Babylon `Engine`, `Scene` and `FreeCamera`. It currently positions the camera through `setCameraAt()` and `resolveNorthHeightsThirdPersonCamera()` while on foot.
- The North Heights runtime already has yaw/pitch input, touch drag sensitivity, invert-Y handling, camera pitch constraints, terrain clearance, building blockers and a detached Machine Camera mode. These behaviors must be preserved.
- The runtime's `applySettings()` receives the shared `Settings` object and updates its local settings state. It is the natural settings-to-runtime integration boundary.
- `src/ui/menus/settings-state.ts` defines the persisted `Settings` shape and stores it under `gtd-interface-settings`. It currently includes third-person camera distance but no first-person perspective preference.
- `src/ui/menus/settings-editor.tsx` is shared between standalone Settings and the in-game pause/settings surface.
- `src/ui/hud/game-hud.tsx` owns the persistent gameplay HUD and pause control. `src/ui/hud/touch-controls.tsx` owns touch action buttons and the existing combat action.
- `src/game/character/reese-player-001.ts` loads Reese's GLB, drives his embedded animation groups, removes the embedded legacy pistol meshes, attaches extracted weapons to a right-hand bone mount and prebuilds M4A1, MPX-9 and P-19 roots.
- `src/game/weapons/gun-runtime-001.ts` converts the extracted weapon builders to Babylon geometry. It retains `gripR` and `muzzle` metadata and solves the weapon mount orientation.
- Reese's current `triggerCombat()` contract is explicitly animation-and-audio-only; it does not perform damage, raycasts or projectile simulation. This plan must not silently expand that combat contract.
- `src/game/camera/third-person-camera-constraints.ts` provides the existing third-person terrain and building constraints. Those constraints must remain the third-person path and must not be bypassed by a broad camera rewrite.

**Pre-implementation audit requirement:** `north-heights-city-8.ts` describes itself as an isolated North Heights experiment. Before implementation, trace the actual production route and runtime selected by the current Age of Abundance build. Confirm whether this file is the active gameplay runtime or a preview/experimental entry point. Do not implement the feature only in an unshipped experiment.

---

## 4. Scope and explicit non-goals

### Included

- A persistent, opt-in first-person shooting perspective preference.
- Third person remains the default for new installations and users without an explicit saved preference.
- A Settings control to enable/disable first-person perspective.
- A gameplay HUD toggle that changes the same setting immediately.
- A first-person camera pose derived from Reese's authoritative player position, orientation and eye-height calibration.
- A dedicated first-person weapon/arms presentation that is visible only in first-person mode.
- Correct camera-relative weapon placement, grip alignment, aim direction, muzzle reference and basic first-person recoil/weapon motion.
- Safe transitions between third person and first person, including weapon selection, pause/resume, death/respawn, vehicle entry/exit and Machine Camera mode.
- Desktop and touch usability, including camera look controls and the gameplay perspective toggle.
- Performance, regression, visual and device validation.

### Explicitly excluded

- Making first person the default perspective.
- Automatically entering first person on every fire press.
- Replacing or redesigning the third-person camera.
- Replacing Reese, his world skeleton, or the accepted Rapier player capsule.
- Rebuilding the three weapon models or changing their authored forward/grip landmarks without evidence of a defect.
- Adding new weapon types, enemy AI, LMS round logic, ammunition economy, hit detection, damage, projectiles or multiplayer.
- Rewriting the existing renderer, physics engine, input system or settings persistence.
- Changes to North Heights population, traffic, buildings, interiors or world geometry.
- Adding a second Three.js renderer or embedding the /guns gallery renderer in the game.

---

## 5. Player-facing behavior and state contract

### 5.1 Perspective states

Use a single explicit perspective state:

```ts
type ShootingPerspective001 = "third-person" | "first-person";
```

The persisted setting should be a boolean or normalized enum in the existing `Settings` object. Recommended field: `firstPersonShooting`, default `false`. Normalize absent, malformed or unsupported stored values to third person. Do not create a second localStorage namespace.

The settings control and gameplay toggle must read/write the same setting. There must not be separate UI-only and runtime-only perspective states that can drift apart.

### 5.2 Settings behavior

- Add a clearly named setting under the existing gameplay/camera/character settings category, e.g. **First-person shooting view**.
- Default: OFF.
- Explain briefly that the game remains in third person unless the player enables this option.
- Saving the setting updates the live runtime immediately when the settings editor is open in-game.
- The standalone Settings page persists the preference for the next gameplay session.
- Existing saved settings migrate safely: missing field means OFF; preserve every other saved setting.
- The existing camera-distance setting remains meaningful in third-person mode and is not repurposed.

### 5.3 Gameplay UI behavior

- Add a dedicated perspective toggle to the persistent gameplay HUD. It must be discoverable during play and usable without opening Pause or Settings.
- Use a camera/perspective icon with explicit accessible labels: “Switch to first-person view” and “Switch to third-person view”.
- Show a clear active-state treatment while first person is selected.
- Keep it separate from Jump, Sprint, Punch/Fire, weapon selection and vehicle controls. Do not rearrange the accepted three-action touch layout to make room.
- The HUD toggle and Settings control must update the same preference and active runtime mode.
- Ensure the toggle remains reachable on narrow portrait and landscape screens and does not overlap map, elevator, vehicle or pause controls.
- The control must not steal the pointer/touch gesture used to look around or fire.

### 5.4 Context restrictions

The perspective selection is available for on-foot gameplay. While driving, riding as a passenger, inside a vehicle cabin, in the detached Machine Camera, in a lift transition, in a cutscene, or while the game is paused, first-person shooting presentation must not take over the active camera.

Recommended behavior: preserve the player's selected preference but suspend its visual application in incompatible contexts; restore the selected perspective when normal on-foot control resumes. Do not mutate the player's world position or vehicle/camera ownership to force a transition.

---

## 6. Technical architecture

### 6.1 One world simulation, optional local viewmodel

Keep one authoritative player, one Rapier capsule, one world simulation and one Babylon renderer. First-person mode changes the local presentation only:

- Player position, velocity, collision, health and world-facing character identity remain owned by the existing runtime.
- The first-person camera uses the same player yaw/pitch inputs and authoritative player position.
- The third-person world character remains the canonical player actor for world simulation and any future external observers.
- In first person, hide or exclude Reese's local full-body mesh from the player's own view to prevent the camera seeing inside the head/torso. Do not disable the actor, skeleton, physics capsule, weapon state or animation driver.
- A dedicated viewmodel rig provides the visible first-person arms/hands and weapon. It must not become a second player or independent combat authority.

### 6.2 First-person rig strategy — mandatory spike before commitment

The reference project uses purpose-built first-person arms/hands and solves them to weapon grip landmarks. AOB has a skinned Reese GLB with embedded clips and a world-space hand-mounted weapon, but the current code does not establish that its arm meshes can be cleanly isolated for a camera-space viewmodel.

During the first implementation spike, inspect the actual Reese GLB hierarchy, skeleton, arm/hand mesh ownership, skin weights, materials and embedded aim/fire clips. Compare two bounded options:

**Option A — isolated Reese arms:** reuse or duplicate only the required forearm/hand meshes and their minimum skeleton/bone chain if the GLB supports clean extraction without copying the entire avatar or breaking skinning. This is preferred if it is reliable, visually consistent and cheap.

**Option B — dedicated viewmodel arms/hands:** create a small Babylon-native first-person arm/hand rig, using authored grip landmarks and two-bone IK or calibrated pose targets. Reuse existing weapon models and the same grip metadata. This is acceptable if the Reese GLB cannot be isolated cleanly.

Do not duplicate the full Reese GLB as a camera-space avatar merely to obtain arms. That would add unnecessary skinning, draw and memory cost and risks rendering the body in front of the camera. Do not invent a final arm strategy before inspecting the real asset.

**Spike exit gate:** a visible first-person pair of arms/hands can hold the M4A1 in a static pose with no detached wrists, obvious palm gaps or broken skinning. Record the chosen option and the reason.

### 6.3 Viewmodel anchor and rendering

- Create a dedicated camera-relative transform root for first-person arms and weapon. Its local transform is tuned in camera space and updated from the active gameplay camera each frame.
- Reuse the existing Babylon scene and engine. Do not introduce Three.js or another WebGL context.
- The viewmodel must render over nearby world geometry without being incorrectly occluded, while the world remains normally depth-tested.
- Prototype a dedicated Babylon rendering group for the viewmodel and validate `scene.setRenderingAutoClearDepthStencil()` behavior against the existing scene/render pipeline. If that cannot reliably provide the desired overlay without disturbing the world's depth or post-processing, evaluate a tightly scoped second-camera/layer-mask path. Do not change global scene clear behavior without a measured reason.
- Keep the viewmodel out of world collision, picking, shadows and world residency systems. It is presentation-only.
- Use a narrow near/far projection range or equivalent first-person projection tuning only if required; avoid changing the world camera's projection in a way that distorts the city.
- Ensure the camera and viewmodel are updated in the same frame after player movement/look and before render. Avoid a one-frame lag between aim and weapon.
- Validate resize, aspect ratio, device pixel ratio, rendering scale and mobile GPU behavior.

Babylon rendering groups and depth clearing are documented mechanisms, but their behavior must be tested within AOB's current render pipeline before selecting the final implementation:
- [Babylon.js — Rendering groups and depth clearing](https://doc.babylonjs.com/features/featuresDeepDive/scene/optimize_your_scene/)
- [Babylon.js — Layer masks and multi-camera rendering](https://doc.babylonjs.com/features/featuresDeepDive/cameras/layerMasksAndMultiCam)

### 6.4 Camera pose and collision

- First-person eye position must be derived from the Rapier player position and a measured Reese eye-height offset, not from a guessed world-space camera position.
- Calibrate the eye point against Reese's actual head/eye location and the 1.78m character scale. Confirm the capsule's feet-origin convention before calculating the offset.
- Use player yaw/pitch as the camera orientation authority. Preserve current sensitivity, touch sensitivity and invert-Y behavior.
- Apply a small, bounded camera smoothing policy only where necessary; never let smoothing make the shot direction lag behind the reticle.
- Keep the camera inside valid world bounds and above terrain. Test walls, glass, doors, building edges, stairs/curbs, elevators and tight interiors.
- First-person camera collision should prevent the eye point entering solid geometry. Do not reuse the third-person camera's orbit-distance correction unchanged; create a small first-person eye/camera obstruction policy using existing collision/query facilities.
- Do not move the Rapier capsule to accommodate camera collision. The camera is a view, not the physics body.

### 6.5 Weapon, grip and aiming integration

- Reuse `createReeseWeapon001()`, the existing three weapon roots and the authored `gripR` and `muzzle` landmarks.
- First-person weapon placement is camera-rig-local, not attached to Reese's world-space right-hand bone mount. The existing world-space attachment remains active for third-person presentation.
- Define a first-person weapon profile for each existing gun: camera-space root offset, rotation, scale if required, sight alignment, muzzle point and support-hand target. Keep per-weapon tuning data separate from camera logic.
- Use the same weapon forward convention already established in `gun-runtime-001.ts`. Do not introduce a second or contradictory forward-axis convention.
- The firing hand must meet `gripR`; the support hand must meet `gripL` or a verified support-hand pose target. The hand must not float near the weapon.
- For rifles/SMGs, the support hand must visibly contact the handguard/foregrip. For P-19, use an appropriate two-handed or one-handed pose based on the authored model and desired animation.
- Define a sight/aim landmark for each weapon if the source model provides it; otherwise author and document one in weapon-local coordinates.
- During ADS, align the sight landmark with the camera's optical axis. Blend smoothly into/out of ADS; do not simply zoom the camera and leave the gun misaligned.
- Use the camera's forward direction as the player aim direction. The muzzle transform supplies the origin for any future authoritative shot query. This plan does not implement that shot query.
- Validate that the barrel points forward and the camera reticle/centerline agrees with the weapon's bore direction.

### 6.6 Animation and first-person motion

Build a bounded animation stack, informed by Claude of Duty:

1. **Base pose:** weapon-ready idle and weapon-specific arm pose.
2. **Locomotion:** restrained walk/run bob; do not make the viewmodel bounce excessively.
3. **Breathing/sway:** small low-amplitude motion while idle.
4. **Camera-turn lag:** subtle weapon lag during fast yaw/pitch changes; clamp impulses to prevent teleport-like snaps.
5. **ADS:** sight-aligned pose and reduced sway/bob.
6. **Fire recoil:** brief weapon-local kick and return; keep camera recoil separate and bounded.
7. **Action clips:** draw, holster, reload, inspect and fire only where clips exist and are verified.

Inspect Reese's actual embedded clip names and bone coverage before mapping first-person clips. Existing third-person clips such as `pistol_aim` and `pistol_fire` are not automatically valid for an isolated arm rig. If clips cannot drive the viewmodel reliably, use a small procedural pose/IK fallback. Do not add or import a second full character animation asset during this stage.

The existing combat action contract remains unchanged. At the current baseline `triggerCombat()` is animation-and-audio-only. Do not add damage, raycasts, ammo consumption or projectiles under this camera feature.

### 6.7 Input and aim behavior

- Desktop mouse look and mobile touch drag continue to drive the same yaw/pitch state.
- The perspective toggle is a discrete UI action, not a movement/look input.
- Do not add an undocumented keyboard shortcut or alter existing key bindings without approval.
- Touch users must be able to operate the perspective toggle without the tap being interpreted as camera drag or combat.
- Keep input blocked correctly when Settings, pause, map, lift or other modal UI is open.
- If an ADS input already exists in the active gameplay runtime, reuse it; otherwise do not add a new aim control without owner approval.

---

## 7. Work packages and delivery gates

### WP-001 — Active runtime and asset audit

- Trace the actual Age of Abundance production route to the runtime that owns North Heights gameplay.
- Confirm whether `north-heights-city-8.ts` is active, preview-only or experimental.
- Trace camera creation, per-frame camera placement, pointer/touch look, settings hydration, in-game settings save, HUD composition, pause and Machine Camera transitions.
- Inspect Reese's GLB arm/hand mesh and skeleton structure and enumerate relevant animation groups.
- Inspect all three weapon models for grip, support-hand, sight, muzzle and forward-axis metadata.
- Record current draw calls, GPU/CPU frame time and baseline memory on desktop and target Android device.

**Exit gate:** production entrypoint and integration owners are identified; viewmodel arm strategy is evidenced; no runtime files changed before this gate.

### WP-002 — Perspective preference and shared toggle

- Add normalized `firstPersonShooting` preference with default false to `Settings`.
- Add it to existing settings hydration and save flow; missing legacy field resolves to false.
- Add a Settings toggle with clear OFF/default semantics.
- Add a persistent gameplay HUD perspective button with accessible labels and active state.
- Connect both controls to one runtime setter and one source of truth.
- Keep existing touch action positions and all current gameplay controls intact.

**Exit gate:** Settings and gameplay UI remain synchronized; a fresh settings object is third person; preference survives reload; no camera behavior changes yet.

### WP-003 — Camera mode controller and safe transitions

- Add a small camera-mode controller or equivalent isolated runtime state, not a second camera manager.
- Keep existing third-person camera calculation unchanged when mode is third person.
- Add measured first-person eye position and orientation for on-foot Reese.
- Implement context gating and transition rules for vehicle, passenger, Machine Camera, lifts, pause, death/respawn and teardown.
- Add bounded collision handling for the first-person eye point.
- Ensure no jump/teleport in the player's Rapier capsule when changing perspectives.

**Exit gate:** perspective can switch repeatedly while stationary and moving; third-person camera returns to its prior behavior; camera remains valid around walls and terrain.

### WP-004 — First-person arms and M4A1 viewmodel spike

- Implement the chosen arm strategy from WP-001.
- Create a camera-relative viewmodel root and first-person weapon mount.
- Integrate M4A1 geometry and solve its firing-hand grip and support-hand contact.
- Establish Babylon rendering-group/depth behavior or a verified alternate render path.
- Hide Reese's local body only in first-person view; keep the world actor, skeleton, physics and third-person presentation intact.
- Calibrate first-person FOV and weapon placement on desktop and Android.

**Exit gate:** first-person view shows the world, both arms/hands and M4A1 in a convincing stable pose; no body/head geometry intrudes; no world geometry incorrectly draws over the viewmodel.

### WP-005 — Weapon profiles, aim and motion

- Add MPX-9 and P-19 camera-space profiles using the same weapon interface.
- Align sight and bore directions for each weapon.
- Add restrained idle sway, breathing, walk/run bob and turn lag.
- Add ADS alignment only if a verified existing aim input is available; otherwise leave ADS integration behind a separate approval gate.
- Connect existing fire animation event to viewmodel recoil without changing combat authority.
- Verify switch/holster/hand mode behavior and no default embedded pistol reappears.

**Exit gate:** all three weapons render correctly in first person, aim forward, stay attached to the visible hands and remain stable during movement and repeated fire animations.

### WP-006 — Integration, performance and regression QA

- Validate Settings and HUD toggles on fresh and existing saved settings.
- Validate first-person ↔ third-person transitions at idle, walk, sprint, fire animation, weapon switch, pause/resume, vehicle entry/exit, Machine Camera entry/exit, lift and respawn.
- Validate all three weapons and hand/no-weapon state.
- Test walls, windows, building interiors/exteriors, stairs/curbs, terrain grades, tight corners and city boundaries.
- Test desktop mouse and Android touch look; test portrait and landscape.
- Measure draw calls, frame time, CPU animation cost, GPU fill cost and memory with the viewmodel enabled/disabled.
- Verify renderer disposal and scene teardown do not leak meshes, materials, animation groups, observers or input handlers.
- Run existing test suite plus new settings normalization, camera-mode state, context-gating and transition tests.
- Record manual visual testing separately; automated tests cannot certify hand contact, perceived recoil or camera comfort.

**Exit gate:** no release-blocking regression in third-person mode; optional first-person mode is stable and usable on agreed target devices; performance impact is measured and accepted.

---

## 8. Acceptance criteria

### Default and controls
- New and legacy users without an explicit preference start in third person.
- First-person mode is opt-in through Settings and can be toggled directly from the gameplay HUD.
- Both controls always reflect the same active selection.
- Preference persists across reload and is restored on the next gameplay session.
- Toggle is usable on desktop and touch and does not interfere with movement, look, combat or other HUD controls.

### First-person presentation
- Camera eye position matches Reese's calibrated head/eye height and follows the authoritative player position.
- Reese's full-body mesh does not obstruct the local first-person view; the world actor and physics remain active.
- Both visible arms/hands and the selected weapon are presented in a stable camera-relative rig.
- Right and support hands make visible contact with the correct weapon landmarks.
- All three guns point forward and have coherent sight/bore alignment.
- First-person viewmodel renders correctly near walls and other world geometry without world-depth corruption.
- Movement, turning and firing produce restrained, coherent viewmodel motion.

### Transitions and preservation
- Third-person mode is unchanged when the option is OFF.
- Perspective switching never teleports the player, changes the Rapier capsule, disables the player actor or resets movement.
- Vehicle, Machine Camera, lift, pause and respawn transitions do not leave the camera or body hidden in an invalid state.
- The hand/no-weapon state shows no weapon.
- Existing city, traffic, pedestrians, buildings, audio, camera look sensitivity and accepted controls remain functional.

### Performance and reliability
- No second renderer or full duplicate player avatar is introduced.
- No per-frame allocations or unbounded mesh/material creation are added to the viewmodel update.
- All created meshes, materials, observers and animation resources are disposed on teardown.
- Third-person performance remains within baseline variance; first-person overhead is measured and within an owner-approved budget.
- Tests and manual playtest evidence are recorded against a specific preview build.

---

## 9. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Wrong runtime entrypoint is modified | Critical | Trace production route before implementation; do not assume the experimental city file ships |
| Reese arms cannot be isolated from GLB cleanly | High | Inspect skeleton/skin weights first; use a bounded Babylon-native arm rig if required |
| Camera-space arms and world-space weapon mount conflict | High | Maintain separate first-person and third-person presentation roots; share weapon definitions, not transforms |
| Rendering group depth clear breaks world occlusion or post-processing | High | Build a minimal isolated render spike; keep fallback camera/layer path bounded |
| Eye camera clips through walls or ground | High | Dedicated eye-point obstruction policy; preserve Rapier capsule and world bounds |
| Reticle, bore and muzzle direction diverge | Critical | Camera-forward aim authority, measured weapon forward axis and per-weapon sight/muzzle validation |
| Full Reese clone increases draw/skinning cost | High | Prohibit full duplicate avatar; isolate arms or create a small dedicated viewmodel rig |
| New POV causes motion discomfort | Medium | Restrained bob/sway, stable horizon, bounded recoil, optional reduced-motion consideration |
| UI toggle conflicts with touch gestures | Medium | Dedicated accessible button, pointer isolation and mobile layout tests |
| First-person work regresses accepted third person | Critical | Keep third-person path unchanged and run A/B regression after each work package |

---

## 10. Test strategy

Use incremental scenarios rather than testing only a complete round:

1. **Settings only:** default false, saved true/false, malformed stored value, migration from existing settings.
2. **HUD synchronization:** toggle in Settings, toggle in gameplay, pause and resume; both controls show the same state.
3. **Camera only:** stationary Reese, walk, sprint, rotate 360 degrees, look up/down, terrain slope, wall proximity.
4. **Single weapon:** M4A1 static grip, camera-relative placement, sight and bore alignment.
5. **Weapon coverage:** MPX-9 and P-19; switch between all three; return to hand/no-weapon.
6. **Presentation transitions:** third-to-first-to-third repeatedly while moving, aiming and playing the fire animation.
7. **Context transitions:** vehicle, Machine Camera, lift, pause, respawn, death and teardown.
8. **Device coverage:** desktop mouse, Android touch, portrait and landscape.
9. **Regression:** existing third-person camera, third-person weapon attachment, movement, collision, world rendering, city streaming and HUD.
10. **Performance:** same scene/build/settings with first-person OFF versus ON; record CPU frame time, GPU frame time where available, draw calls, memory and frame pacing.

Automated tests should cover settings normalization, mode selection, context gating, transition invariants and cleanup. Manual playtests must verify camera comfort, correct viewmodel framing, hand contact, sight alignment, recoil feel and absence of clipping.

Record each result as **passed**, **failed** or **not run**, with preview URL, commit SHA, device/browser and reproduction notes. A successful compile is not proof of correct first-person presentation.

---

## 11. Release discipline and scope control

- Keep this feature isolated from unrelated LMS systems and world optimization.
- Implement only after the owner reviews and approves the plan.
- Use a dedicated feature branch from the then-current `main`; do not branch from a rejected weapon-removal attempt.
- Produce a Vercel preview after implementation and provide the preview link for owner review.
- Do not merge or deploy production without explicit owner acceptance and instruction.
- Preserve the December 1, 2026 release deadline. If the arm rig or render-path spike threatens the deadline, ship third person unchanged and defer optional first person rather than destabilizing the release.
- Do not claim a build, test, playtest or device verification unless it was actually run and recorded.

## 12. Definition of done

First-person shooting view is complete when the player can explicitly enable it in Settings or toggle it from the gameplay HUD, enter a stable first-person on-foot view with visible hands/arms and any of the three existing guns, aim forward with the weapon correctly aligned, see restrained movement and firing feedback, and return to third person at any time. Third person remains the default and is unchanged when first person is disabled. The feature does not alter the player's physical simulation, current combat authority, accepted city systems or existing weapon availability.

**Priority if time is constrained:** (1) shared setting/HUD state and safe camera switching; (2) stable eye camera and collision; (3) convincing M4A1 arms/weapon viewmodel; (4) MPX-9 and P-19 profiles; (5) motion/recoil polish. Do not compromise the default third-person experience to force first-person completion.
