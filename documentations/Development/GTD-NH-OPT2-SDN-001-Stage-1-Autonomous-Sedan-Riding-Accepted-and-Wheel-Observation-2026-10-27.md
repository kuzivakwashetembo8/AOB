# GTD-NH-OPT2-SDN-001 — Accepted Autonomous Sedan Riding; Wheel Defect Observation

**Date:** 2026-10-27
**Branch:** `feature/north-heights-optimization-2-20261027`
**Owner decision:** **STAGE 1 ACCEPTED — PERMANENT G.T.D FEATURE**
**Release status:** Accepted as a required capability. Still on the implementation branch pending any separate main merge/deploy instruction.
**Visual evidence:** Owner's in-game North Heights screenshot shared 2026-10-27; original screenshot retained in conversation, not committed as an asset.
**Baseline acceptance build:** `3dfdfb463c96b0c7d81e3f7c81ca45774cf565a6`
**Original preview:** `https://gtd-1uw9nparf-interlinkglobaltech.vercel.app/north-heights-preview`

## Accepted permanent feature contract

G.T.D in North Heights shall support **autonomous passenger travel in any of the 125 existing moving, accepted, extracted native Sedans**. Voight may approach a moving or stationary traffic Sedan and use the normal proximity vehicle entry action (F on keyboard or vehicle button on mobile), subject to actual boarding range, vertical separation and building obstructions.

Upon successful entry Voight becomes invisible without any pose/seat simulation. The original NH-012 logical car **continues uninterrupted along its own route** and still obeys existing stop lines, junction reservations, speed limits, traffic-following and road-curvature rules. The third-person camera follows the same Sedan; it is not switched to first person. The rider sees the existing vehicle body and wheels—not a re-created Rapier car—and the minimap follows the correct current location.

Exit applies at the current traffic Sedan's stop, only when its speed is at most 0.25 m/s and an obstacle-free supported current-world exit can be located. The one Voight capsule and visual actor are restored; the car returns to ordinary autonomous travel (in Stage 1 it never left that mode). The separately parked six GLB vehicles and their Rapier driving capability remain unchanged.

**Permanent architecture rule:** The traffic agent stays in the original NH-012 simulator and GEN-VEH-009 native thin-instance renderer; boarding must never materialize a second Sedan chassis or duplicate wheel/pivot transforms. This acceptance is a regression contract for Stages 2–4 and for future optimizations.

**Acceptance scope:** Owner confirmed **automated driving successfully implemented**, not manual braking/acceleration/steering and not the whole four-stage plan. Automated riding is locked as a permanent G.T.D feature.

## New visual defect observation — wheels versus rims

**Defect ID:** `GTD-NH-OPT2-SDN-WHEEL-OBS-001`
**Status:** **OPEN — OBSERVED, NOT REPAIRED**
**Owner's observation:** **Rims visibly spin while driving, but the surrounding tyres/wheels do not visibly spin.** This is distinct from the previous rejected branch's detached-wheels-on-roof defect and must not be confused with it. The accompanying screenshot shows the accepted Sedan visual presentation; rotation discrepancy is based on the owner's direct gameplay observation, not on motion proven by one still frame.

**Relevant inspection target:** `src/game/experiments/north-heights-sedan-traffic-009.ts` renders native tyre and rim thin-instance groups, both nominally assigned per-wheel rotation from a shared wheel-transform calculation. Wheel vertex symmetry, texture/normal/material appearance, geometry local basis, and actual matrix upload could each affect visible perceived rotation. **Root cause unverified.** The code *attempts* to rotate both; do not claim only rims receive rotation without runtime proof.

**Restrictions:** Do not patch, replace, re-extract or rematerialize the accepted Sedan wheels as part of Stage 2. Investigate independently with an isolated repeatable motion comparison, inspect both tyre and rim native matrices, and fix only after explicit prioritization/authorization. Do not cherry-pick the decommissioned NH-OPT-011 replacement-rig implementation.

**Acceptance invariant for Stage 2:** Wheel geometry and accepted automatic ride-along appearance must not regress. This known, explicitly recorded tyre-animation defect remains open and does **not** revoke Stage 1 acceptance.

## Stage-gate disposition

- Stage 1: **OWNER ACCEPTED / PERMANENT FEATURE / BASELINE LOCKED**
- Wheel OBS-001: **OPEN, DOCUMENTED, NOT A BLOCKER TO STAGE 2 BRAKING**
- Stage 2: **OWNER AUTHORIZED IMPLEMENTATION AND PREVIEW**
- Stage 3 and Stage 4: **NOT AUTHORIZED FOR IMPLEMENTATION**
- Main merge/production deployment: **NOT REQUESTED**

Source plan: `documentations/Development/GTD-NH-OPT2-SDN-001-Sedan-Driving-Four-Stage-Technical-Implementation-Plan-2026-10-27.md`.
