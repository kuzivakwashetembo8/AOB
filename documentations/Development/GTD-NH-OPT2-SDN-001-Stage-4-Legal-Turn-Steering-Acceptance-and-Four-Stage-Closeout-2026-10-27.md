# GTD-NH-OPT2-SDN-001 — Stage 4 Accepted; Four-Stage Sedan Driving Closeout

**Date:** 27 October 2026
**Game:** G.T.D — Grand Theft Division, North Heights, Meridia
**Working branch:** `feature/north-heights-optimization-2-20261027`
**Owner's exact acceptance:** “Stage 4 successful, document then return for converse. We are going full autonomous in-lane driving now.”
**Disposition:** **STAGE 4 ACCEPTED; STAGES 1–4 ALL OWNER-ACCEPTED. DOCUMENTED FEATURE CHECKPOINT, NOT MERGED TO MAIN.**
**Authorization boundary:** This request authorizes documentation and discussion of the next direction. It **does not** authorize implementation of new driving behaviours, merges, or production deployment.

## 1. Stage 4 — Accepted legal-turn control

The player rides the **same original NH-012 moving traffic Sedan** used by the first three accepted stages. Left Arrow/A on desktop or mobile Left requests one legal left-turn connector at the upcoming junction. Right Arrow/D or mobile Right requests the corresponding legal right turn. The input is interpreted **in vehicle/road heading coordinates, never camera coordinates**. A one-time press queues a choice for the next unresolved junction; a changed choice before junction entry replaces the earlier pending connector. Holding a button must not automatically schedule a continuous series of left or right turns.

The existing directed lane graph (`src/game/traffic/nh012-lane-network.ts`) supplies the authoritative candidate connectors. U-turns or unavailable directions are rejected with user feedback rather than shifting the car off its lane. After the traffic simulator reserves the junction and enters a connector, turning is committed; manual commands cannot switch or release that reservation mid-turn. Queued intent is consumed **only** upon successful junction reservation, not simply upon slowing or waiting at the stop line.

The vehicle is always located by its existing NH-012 `agent.id`, `edgeId`, `connectorId`, `s`, pose and speed. Stage 4 changes the selection of the next allowable road connector, **not** the physics owner, per-wheel transform, car model, steering quaternion, or character seating.

### Owner-accepted Stage 4 build

- **Preview:** `https://gtd-r898dd3by-interlinkglobaltech.vercel.app/north-heights-preview`
- **Preview commit:** `f2e8f60df2e81623d47c50fc0ac8b9cc757ab9c2`
- **Vercel status:** READY; package and PWA output built.
- **Validation:** 149 test files / 587 tests passed, including Stage 4 road-graph and desktop/multi-touch control tests, and the prior Stage 1–3 traffic/vehicle regressions.
- **Owner:** After preview evaluation, explicitly confirmed “Stage 4 successful”.
- **Scope:** Feature branch preview only. No merge or release to production `main`.

### Primary implementation points

- `src/game/traffic/nh012-traffic-simulator.ts` — `NH012DriverTurn`, `legalDriverTurnConnector`, `setDriverTurn`, `pendingDriverTurn`, `clearDriverTurn`; existing `chooseConnector` and exclusive junction-reservation gate remain the movement authority.
- `src/game/experiments/north-heights-city-8.ts` — keyboard and mobile action mapping, one-shot/rising-edge steering requests, cleanup on vehicle exit or reset, HUD feedback.
- `src/ui/hud/touch-controls.tsx` — Left and Right adjacent to approved Gas and Brake buttons, preserving multi-touch pedal precedence and release cleanup.
- `src/ui/hud/desktop-controls.tsx` — passenger-mode turn buttons alongside the approved pedals.
- `src/routes/north-heights-preview.tsx` — assisted-driving steering guidance and queued-turn feedback.
- `src/test/nh-opt2-sedan-legal-turns-stage4.test.ts` — legal direction, invalid road turns, queued intent lifecycle, simulation continuity, braking and reservation interactions.
- `src/test/nh-opt2-sedan-next-turn-controls-stage4.test.tsx` — desktop buttons, mobile pointer input, simultaneous Gas/Brake/turn operation.

## 2. Four accepted Sedan Driving stages — permanent G.T.D contract

| Stage | Capability | Owner disposition |
| --- | --- | --- |
| **1 — Autonomous passenger travel** | Proximity-board an original moving Sedan, hide Voight, follow same car in third-person, continue original automatic traffic and exit safely when stopped. | **ACCEPTED** |
| **2 — Manual braking** | Hold Down/S or mobile Brake to decelerate **only** the selected Sedan within the existing 20 Hz traffic simulator. Release to resume safe automatic motion. | **ACCEPTED** |
| **3 — Manual acceleration** | Hold Up/W or mobile Gas to request bounded forward acceleration; Brake prevails; all existing speed/following/junction safety remains in force. | **ACCEPTED** |
| **4 — Legal next-junction direction selection** | Tap Left/Right to choose the next permitted road-network connector, retain original lane movement and junction ownership. | **ACCEPTED** |

**Permanent invariants:** One accepted native Sedan renderer (GEN-VEH-009), no converted or duplicate moving-vehicle GLB/Rapier chassis on entry, 125 stable NH-012 traffic identities, 12 accepted Sedan colours, intact original sourced body/glass/rims and tyres, normal traffic behaviour for the other agents, 20 Hz deterministic traffic authority, stable third-person view, proximity boarding, safe disembark, and unchanged separately parked six GLB vehicles. Stage 4 completes the *agreed four-stage assisted lane-driving plan*; it is **not** full unrestricted free-angle driving.

## 3. Existing unresolved visual observation

`GTD-NH-OPT2-SDN-WHEEL-OBS-001` remains **OPEN**: the owner observed visibly spinning **rims** while the surrounding **tyres** did not visibly spin. This is distinct from the rejected earlier branch's wheel relocation defect. Code attempts to animate both; precise visual cause is **unverified**. No geometry, extracted wheel assets or matrices were changed during Stages 2–4 to address it, and it is not silently marked resolved.

## 4. Next direction — discussion only: “full autonomous in-lane driving”

Following acceptance, the owner announced: **“We are going full autonomous in-lane driving now.”** Record that wording as the next topic, **without assuming it means unrestricted steering, fully player-controlled in-lane motion, or automated navigation to a destination**. The current system is already an autonomously routed, lane-constrained 125-agent traffic simulator that now accepts player brake/throttle/next-turn requests. A further “full autonomous in-lane driving” milestone needs an explicit agreed behavioral contract and should be discussed before any code changes.

Design boundaries to resolve conversationally, not implement yet:

1. **Who controls the route?** Fully AI-selected navigation, user-selected destination, or player steering while the car remains auto-centered in a lane?
2. **Who controls speed?** Continuous AI throttle/brake, player pedals with safety override, or switchable manual/autopilot modes?
3. **What does “in-lane” guarantee?** Lane centerline adherence, lateral offset/position correction, lane changes, obstacle avoidance, or user-defined turns subject to permitted connectors?
4. **How does a user intervene?** Button press priorities, manual takeover and handback, cancellation, stop/resume and safe exit.
5. **What are the acceptance measures?** Vehicle tracking and road-contact correctness, stop-line/junction legality, follower safety, stable 125 agents, third-person camera, graphics fidelity, desktop/mobile performance.
6. **What remains explicitly out-of-scope?** No reactivation of rejected NH-OPT-011 wheel-rig conversions; full arbitrary off-network/free steering is not authorized by Stage 4 acceptance.

These are prompts for the owner and assistant's **next conversation**, not a prescribed implementation plan or approval to make changes.

## 5. Release and handoff

- Four-stage Sedan Driving implementation: **COMPLETE AND OWNER-ACCEPTED** on `feature/north-heights-optimization-2-20261027`.
- Current owner directive: **DOCUMENT AND RETURN FOR CONVERSATION**.
- Next feature: **NOT IMPLEMENTED**. Await owner architecture discussion and subsequent explicit approval.
- Production branch: **UNCHANGED**; no main merge or deployment requested.
- Historical plan: `documentations/Development/GTD-NH-OPT2-SDN-001-Sedan-Driving-Four-Stage-Technical-Implementation-Plan-2026-10-27.md`.
- Previous decisions: `GTD-NH-OPT2-SDN-001-Stage-1-Autonomous-Sedan-Riding-Accepted-and-Wheel-Observation-2026-10-27.md`, `GTD-NH-OPT2-SDN-001-Stage-2-Manual-Braking-Acceptance-2026-10-27.md`, `GTD-NH-OPT2-SDN-001-Stage-3-Manual-Acceleration-Acceptance-2026-10-27.md`.

**End-of-stage disposition: ACCEPTED / DOCUMENTED / RETURNED TO DESIGN CONVERSATION.**
