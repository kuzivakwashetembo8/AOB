# GTD-CHAR-001 — L2 Intermittent Gait Interruption Incident

**Recorded:** 2026-10-11, user local UTC+02. Uploaded screenshot clock reads ~23:37; this is a screenshot observation, not a server incident timestamp.
**Source experiment:** `experiment/gtd-char001-l1-travel-facing`, confirmed preview `gtd-alge6grou-interlinkglobaltech.vercel.app/game?gtdCharacterTrial=ual`.
**Correction branch:** `experiment/gtd-char001-l2-gait-continuity`, created independently from the L1 branch after user confirmed direction alignment.
**Status:** Investigated; fix and user acceptance pending. **No main/production change.**
**Related authority:** GTD-CHAR-001 travel-facing locomotion plan, L2 gait coordination.

## Observation (user-confirmed)

The imported humanoid now faces its travel direction. During a sustained arrow-button hold, it occasionally appears to trip or interrupt its step, sometimes after a long uninterrupted distance. During sprinting the visual rhythm resembles “run-run-run-stop-run-stop-run…” on any heading. A still screenshot cannot locate the frame-level cause. The user suspects repeated polling of held controls and observes that the reference `https://hh-hang.github.io/three-player-controller/footIK.html` does not show this behavior.

## Source-backed diagnosis (not yet proven as the sole runtime cause)

1. `src/routes/game.tsx` keeps a `Set` of held keyboard codes; auto-repeated `keydown` calls re-send the **same** movement vector. There is no code path that intentionally releases a held arrow on every key repeat. `keyup`, `window.blur`, pause/effect cleanup do clear input, and should be included in trace diagnostics.
2. `src/ui/hud/desktop-controls.tsx` sends one continuous directional command on `pointerdown`; it sends zero on `pointerup`, `pointercancel`, and lost pointer capture. These are legitimate release events, not a periodic polling mechanism. Pointer-capture interruptions remain a possible alternate cause for on-screen buttons and must be distinguishable from gait resets in exported evidence.
3. `src/game/core/gtd-runtime.ts` runs Rapier at fixed 60 Hz and passes *each tick's instantaneous collision-corrected planar speed and grounded status* directly to `updateAnimation`. Small physics contact changes at sidewalks, curbs, overlapping collision seams, and low-FPS update variance may cross thresholds even with sustained input.
4. `src/game/character/voight-humanoid-trial.ts` currently switches clips immediately on `!grounded`, or speed `>5` to sprint, `>0.18` to walk, otherwise idle. Each clip transition calls `active.start(true)`, resets animation blend, and advances outgoing weight. A one-frame grounded=false or speed dip can cause a *visible stop/phase reset* and back-to-back transitions. This matches the user symptom; **actual event correlation must still be measured**.
5. The reference controller's `FootIK.ts` exposes before/after-animation hooks for pose restore/IK and foot-phase stabilization, not GTD's present per-tick threshold-to-clip selector. The demo's absence of glitch is observational evidence, not a proof that GTD's controls are wrong.
6. Existing L1 trace contains input direction, Rapier velocity and grounded per 3rd tick, but lacks per-tick clip-change / raw command-transition evidence. This makes the original report insufficient to discriminate an actual control interruption from a transient animation-state reset.

## Authorized narrow L2 response

- Keep Rapier correction, all city assets, exact L1 facing and ground support, and the approved four-arrow semantics intact.
- Introduce **visual-only transient state stabilization**: brief ground-contact grace for one-tick false airborne reports, short motion dropout grace under sustained input, and sprint state hysteresis to prevent repeated threshold oscillation. Genuine input release, blocked movement, user jump, and sustained airborne state must still transition normally. Never move or override the physics capsule to conceal a gait issue.
- Do not assume fixed stride lengths, detailed foot-phase analysis or implement Foot IK prematurely. This is an L2 continuity correction and diagnostic layer, not finished cadence/IK acceptance.
- Update diagnostic export to record **raw** input commands and actual held movement, instantaneous corrected planar speed, grounded/vertical state, stabilized visual locomotion state, clip-transition events and reasons. Distinguish repeated identical commands from real zero/release commands. Bounded opt-in local buffer, no network telemetry.
- Automated tests must reproduce a held-intent sprint with one/two isolated ground or speed dropouts, demonstrate no false stop/jump clip toggling, and verify true release/jump/blocked/airborne behavior. Static screenshots alone cannot certify motion.
- Deliver a Vercel preview only after passing TypeScript, tests and build. User compares a long uninterrupted run on flat asphalt then repeated curbs, same camera and controls, downloads trace if any glitch remains.
- Prior L1 preview remains an unchanged comparison reference; **no merge to main** until human acceptance.

## Investigation protocol if symptom persists

Check exported evidence in this order: (1) raw move-command transition to zero? → inspect keyboard blur/key release vs pointer cancel/lost capture; (2) commanded move continuously nonzero, but Rapier actual velocity/ground drops? → contact/seam and capsule; (3) raw physics stable, but visual clip transitions? → animation controller or authored clip discontinuity; (4) state/velocity/ground stable and no clip transition? → inspect clip looping, root/pelvis curves and renderer frame timing. This prevents guessing based on appearance alone.
