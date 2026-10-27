# GTD-NH-OPT2-SDN-001 — Stage 5: Full Manual In-Lane Driving

**Date:** 2026-10-27
**Project:** G.T.D — Grand Theft Division / Meridia / North Heights
**Branch:** `feature/north-heights-optimization-2-20261027`
**Owner authorization:** “Yes, document then implement this as stage 5 right away.”
**Status:** APPROVED FOR STAGE 5 IMPLEMENTATION AND PREVIEW. NOT authorized to merge with main.

## 1. Scope and owner decisions

Stage 5 replaces the Stage 4 assisted *driver's* lane driving with continuous **manual speed authority**, a genuinely faster accelerator, **reverse** and **immediate local junction instructions**, while retaining the existing NH-012 lane/connector network, native GEN-VEH-009 Sedan renderer, the 125-agent fleet, and all previously accepted passenger/autopilot capability.

The gamer may deliberately drive **through other Sedans** for this experimental checkpoint, including occupied intersections. Traffic collision physics is **not implemented**; no simulated agent traffic reservation or lead-vehicle spacing may delay the manually driven Sedan. This is an **intentional, documented temporary overlap policy** and must not be misrepresented as real-world collision or road safety.

### Exact driving contract

| Control | Stage 5 behavior |
|---|---|
| Up/W/Gas | Acceleration is 2.6 m/s² (30% above AI 2.0); maximum forward speed is 10.4 m/s (30% above AI 8.0). |
| Down/S/Back | Brake forward speed at existing 3.5 m/s²; once stopped, transition to reverse, remaining on the lane/connector path. |
| Neither pedal | Release throttle/reverse and coast to a stop, **not back to autonomous acceleration**. |
| Left/Right | One legal turn request may be applied **only in the last 8 m of the current incoming edge**. Pressing earlier is ignored, not queued. The chosen connector is traversed without automated four-way-stop permission. |
| No turn input | At a straight-ahead option, maintain forward movement through the legal straight connector. At a T/boundary with no straight option, stop at lane end until a legal direction is chosen. |
| Other cars | No collision, following-distance or exclusive-junction reservation requirement for player; passing through other traffic is permitted during test. |
| Automatic traffic | The other 124 traffic agents retain unchanged max speed 8 m/s, acceleration 2.0 m/s², stop/queue/following rules and accepted rendering. |
| Autonomous passenger mode | The Stage 1 accepted autopilot remains available as an explicit/manual mode transition. A first movement input may engage manual operation, and an explicit toggle permits resuming autopilot safely. |

**Interpretation of immediate turn:** “Immediate” means the direction instruction is accepted immediately *within* the 8 m intersection approach zone and cannot be delayed by traffic permissions. The Sedan still follows the current lane center until the existing connector’s start, then follows its genuine Bézier junction curve; no teleport, snapping to the middle of the intersection, arbitrary yaw, or driving through buildings. An attempted turn outside the zone has zero effect.

**Reverse:** Keep a signed private/manual velocity, with the visible agent speed reported as its magnitude. Negative movement reduces the current directed edge's arc length or traverses its connector backwards while preserving original forward-facing chassis orientation. Do not invent a wrong-side outbound road or move beyond a source lane boundary. When crossing a forward path boundary, maintain a bounded history of traversed junctions for reversing where feasible. Full open-ended arbitrary off-road reversing is outside this lane-constrained milestone.

## 2. Architecture

- Add narrow Stage 5 manual-control state to `src/game/traffic/nh012-traffic-simulator.ts`, keyed by existing `NH012Agent.id`. Manual updates run **inside the same 20 Hz step**, never in a Rapier duplicate chassis.
- Manual agent follows only approved `NH012TrafficEdge` and `NH012TrafficConnector` samples. Existing `x`, `z`, `heading`, `edgeId`, `connectorId`, `s` retain their meanings.
- An autonomous→manual takeover removes this car's existing automated junction reservation if inside a connector, without releasing another vehicle's reservation.
- During manual mode only, selected car ignores the current stop-line cap, leader gap, outgoing capacity gate, wait ticks and junction reservation. Autonomous agents continue governed by the existing algorithm. The temporary overlap exemption is explicitly represented in validation.
- Mode transitions (manual↔autopilot) and close/reset/exit must not leave dangling player requests, duplicate cars or orphaned reservations; no active manual control exists while on foot.
- The 125 moving Sedan thin instances remain present. Preserve all source wheel hubs, original glass, paint and LOD. Do not address the separately recorded tyre rotation issue in Stage 5.
- Third-person camera, touch and desktop arrow input, six parked drivable GLBs, PWA persistence, controls/settings parity and on-foot Voight remain unchanged.

## 3. Acceptance gates

1. Board an original moving Sedan and take over manual speed without a second car spawning. Switch back to autonomous ride-along for the accepted Stage 1 behavior.
2. Hold W/Up long enough to demonstrate 2.6 m/s² and 10.4 m/s maximum, while other traffic remains at existing 2.0/8.0 limits.
3. Release controls → selected car coasts to zero; Down/S decelerates, then reverses along permitted lane or connector. No reverse into unsupported map space.
4. Press Left/Right when 8+ m from intersection → ignored and **not** queued. Press inside the 8 m approach window → legal connector engaged at the next physical end-of-edge crossing, immediately without stop/wait.
5. Turn into an occupied junction without blocking on AI reservation. Cars can visually overlap by design for this checkpoint; no new Rapier collider is instantiated.
6. Press Left/Right at a T with no such connector → refused, no illegal U-turn. Straight works automatically where legally available. No wrong-side roadway travel from premature input.
7. NH-012 agent count remains exactly 125; other agents continue normal traffic rules. Nonmanual regression simulation is unchanged.
8. Stage 1–4 controls and visual presentation remain regression-tested; all automated tests pass and a Vercel branch preview is provided for **owner acceptance**.
9. Stage 5 release scope: **preview only** until direct instruction to merge/deploy production main.

## 4. Known deferred defects / policy

- `GTD-NH-OPT2-SDN-WHEEL-OBS-001`: rim spins visibly, surrounding tyres appear stationary. **Not patched** by Stage 5.
- Car-to-car collision handling, physical crash response and damage remain **not implemented**. Visual overlaps are intentional for testing.
- Fully freeform lateral lane-changing, parking, off-road movement and unconstrained road steering are **not** covered; this is **continuous driver-controlled motion along lanes**.
- No main merge or production deployment authorized.

**Status: STAGE 5 DOCUMENTATION APPROVED; IMPLEMENTATION REQUESTED.**
