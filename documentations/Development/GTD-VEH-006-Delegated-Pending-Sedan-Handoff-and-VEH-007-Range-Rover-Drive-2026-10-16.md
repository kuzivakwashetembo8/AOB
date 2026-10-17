# GTD vehicle handoff — VEH-006 Sedan pending; VEH-007 Range Rover driving trial

**Date:** 2026-10-16  
**Instruction owner:** GTD project owner  
**VEH-006 Sedan status: DELEGATED / PENDING**  
**Delegated assignee:** To be designated by owner (no name or completion date was supplied).  
**VEH-007 Range Rover status:** isolated active driving implementation, awaiting live owner verification.  
**Secondary asset:** `ergoninane-fast-71.glb` development and rendering **PAUSED** pending acceptance of Range Rover driving.

## VEH-006: Delegated task / acceptance criteria

The original civilian Sedan design remains an editable project artifact, but its overall in-world quality was not approved. Its known limitations include studio/world material parity, insufficient wheel and glazing detail, coherent automotive highlights, tire-road grounding and cabin believability, and the last per-mesh material patch caused a visibly absent vehicle with four detached shadow discs. The last reliable Sedan GLB render was a dark complete visual, not Ferrari-level realism. It must not be silently classified as completed.

Retained source and evidence: `src/game/vehicles/sedan-blockout-006.ts`, `sedan-realism-006.ts`, `sedan-scene-model-006.ts`, `sedan-studio-006.ts`, `sedan-cabin-006.ts`, `sedan-glb-export-006.ts`, GLB export `public/vehicles/meridian-sedan-006.glb`, studio comparison image, and previous VEH-006 G0–G5 review documents. The existing unmerged source and draft PR #33 are preserved.

**Delegated follow-up:** reproduce the G4 invisible-car regression, bring materials across the GLB pipeline without changing mesh parent visibility, calibrate paint, glass, wheel construction, body panel highlights and tire-road shadows at real Meridian day/night, then collect side-by-side visual comparisons with Ferrari. Do not promote to game until owner explicitly approves visible body, four wheels, cabin, headlights, rear glass, and road contact. Status remains **PENDING**, not accepted.

**Immediate removal from game:** `gtdSedanParked006=1` is retired and no longer creates Sedan meshes, network requests or colliders. Do not delete the working source or GLB. Any old launch link containing that query must no longer reintroduce it.

## VEH-007: Active Range Rover drive conversion

Asset: user-committed `public/Range Rover Sports 2018 (.GLB).glb` (unchanged source geometry and embedded materials). Parking and boarding at Mercer Street South Ward `x=-5.45,z=10.55`, facing `+π/2`; staged only under `?gtdRangeRoverDrive=1` in the isolated branch. Ferrari and Buggy are not replaced.

Integration:
1. Only one preview GLB is loaded. Ergoninane stays committed but no longer sends a network request, gets a mesh, or receives a collider.
2. Raw Range Rover GLB is normalized to its measured dimensions and maintained in its existing visual hierarchy. The initially static Rapier collider is retained until the reusable `StreetVehicleActor` is created, then explicitly relinquished; there must never be two persistent colliders.
3. Reuse Ferrari's `FirstDriveTrial/StreetVehicleActor` for acceleration, responsive braking/reverse, throttle coast, steering, Rapier contacts, curb autostep, stop-before-exit and safe physical egress. The only source-specific movement profile is authored forward axis **+Z** (Ferrari is -Z); this reflects the Range Rover facing +X in the owner screenshot at yaw +π/2.
4. F near the parked Rover boards into its actual visual and physical actor. WASD/arrows drive and steer; F at stopped speed exits at actual current world position. The driver uses the existing UAL Driving_Loop when enabled, with a provisional SUV seat coordinate; cabin IK is explicitly `unknown`, not falsely certified Ferrari carpet geometry.
5. Camera follows the actual SUV heading with accepted rear follow settings. UI/HUD displays "Range Rover" when active, not hard-coded Ferrari. The existing Ferrari remains separately enterable.
6. Actual wheel pivots are discovered only when four independently named GLB wheel nodes can be demonstrated; if missing, report absent pivots, never spin the entire chassis or invent duplicate rubber. This is an explicit asset-dependent remaining acceptance gate.
7. Follow-up in-world visual test must verify acceleration, brakes, immediate reverse after contact, correct steering direction, safe collisions, road/curb motion, exit and reboarding, rendered wheel behavior, driver pose and mobile performance. Rapier remains a kinematic vehicle model; no claim of tire/suspension simulation or completion of deferred collision refinement.

**Next gate:** Run complete TypeScript/Vitest/Vercel preview, then owner accepts SUV driving visually. Do not merge `main`, reinstate Sedan, or load ergoninane before owner permission.
