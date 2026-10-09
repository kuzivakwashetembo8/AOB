# Meridian First Light FL-3 Interaction and Atmosphere Implementation and Handoff

Status: VERIFIED VISUAL REVIEW CANDIDATE — USER ACCEPTANCE PENDING  
Date: 2026-10-09  
Branch: `development/meridian-fl3-interaction-atmosphere`  
Verified implementation source: `ec81e6d0a6a8cc06455cc84f3ae0a2136b8efc63`

## Outcome

The first comprehensive FL-3 candidate is implemented.

The candidate moves First Light from a fixed daytime generated environment to an environment with an authoritative Meridian clock, dynamic atmospheric state, night-capable street lighting, and a physically traversable hero-garage interior with real spatial content.

The governing review journey is:

> **Street → approach garage → enter → move inside → inspect interior/camera/lighting → exit → return to atmospheric exterior.**

## Meridian time system

Implemented:

- canonical Meridian day: 48 real minutes at 1x;
- FL-3 default validation rate: 24 real minutes at 2x;
- accelerated 6-minute debug rate at 8x;
- pause;
- direct HH:MM editing;
- Dawn, Noon, Dusk and Night presets;
- one authoritative `MeridianClock`.

The HUD does not maintain a second timer. Runtime time metadata is derived from the same clock that drives the environment.

## Environment system

`MeridianEnvironmentController` owns:

- directional sun;
- sun direction, intensity and color;
- hemispheric/ambient contribution;
- sky dome;
- fog/horizon treatment;
- streetlight point lights;
- hero-garage point lights;
- directional shadow generator;
- lifecycle cleanup.

Streetlights remain inexpensive local lights without local shadow maps in this pass.

## Hero garage interior

The generated South Ward garage now contains an intentionally bounded working-garage representation:

- concrete floor;
- workbench;
- drawer chest;
- tall tool cupboard;
- shelving;
- lockers;
- compact fridge;
- desk;
- monitor/screen;
- chair;
- wall tool board;
- tool silhouettes;
- tire stacks;
- ceiling light fixtures.

These objects establish believable purpose. FL-3 does not add inventory simulation, opening drawers/cupboards, appliance logic, or dense furnishing.

Major fixtures have simple Rapier collision boxes.

## Interior state and camera

The hero garage uses the generated interior cell and semantic portal data.

Runtime state:

- `outside`;
- `threshold`;
- `inside`.

The state is derived from player position, interior bounds and portal proximity.

Camera target radius adapts:

- outside: 6.2 m;
- threshold: 4.5 m;
- inside: 3.35 m.

The garage roof representation reduces visually at threshold/inside while independent semantic camera blockers remain active. The building is not globally hidden.

The FL-2 terrain camera-blocker correction remains part of the live candidate and should be explicitly retested while looking sharply upward.

## Verification

Exact verification deployment:

- deployment: `dpl_6oDCRuWRDtssn6e1tbjeDjReCrCX`
- preview: `https://gtd-3iyzrye2b-interlinkglobaltech.vercel.app/game`
- source: `ec81e6d0a6a8cc06455cc84f3ae0a2136b8efc63`
- state: READY
- strict TypeScript: passed
- Vitest: 10 files / 63 tests passed
- targeted substantive ESLint: passed
- production build: passed
- `/game`: HTTP 200
- `/first-light-comparison`: HTTP 200
- grouped runtime errors: none in verification window
- Vercel deployment guard: restored to `exit 0`

Earlier verification failures were resolved before this candidate:
- `dpl_GouC6ygqLFadgwACNupym2R2442v`: TypeScript failed because Babylon `Scene` was imported as type-only while used as a runtime value.
- `dpl_p6xhMRGfzFMBckELX3ejuug9zax7`: one stale objective-text regression assertion failed; implementation itself had advanced correctly.
- `dpl_Gb91WpFhpoVbu1Jc5gjETjpTPG86`: superseded by the exact-head verification candidate.

## Live review checklist

Review `/game` for:

1. Meridian time is visible and advances.
2. Direct HH:MM editing immediately changes environment state.
3. Dawn, Noon, Dusk and Night presets work.
4. Pause / 48m / 24m / 6m controls behave correctly.
5. Daytime sky reads as a real exterior rather than a dark void.
6. Dusk/night materially changes sky, ambient light and sun contribution.
7. Streetlights illuminate nearby ground/facades at night.
8. The garage entrance remains physically traversable.
9. Interior workshop props read as a working garage rather than an empty room.
10. Major fixtures block Voight appropriately.
11. Garage interior lighting remains readable at day and night.
12. Camera compresses acceptably at threshold/inside.
13. Roof visibility treatment does not feel like a building disappearance.
14. Extreme upward look does not send camera underground.
15. T-junction asphalt still reads as continuous rather than a raised patch.
16. Voight can enter, move inside, exit, and re-enter without getting trapped.

## Promotion gate

Do not promote this FL-3 branch merely because automated verification passed.

Promotion requires live visual/gameplay review confirming that the FL-3 journey is believable, readable and mechanically stable.

After user acceptance:

1. reconcile with current `main` if needed;
2. rerun exact-head verification;
3. promote through a controlled PR;
4. intentionally deploy the promoted `main` commit if requested/appropriate;
5. update the First Light decision log;
6. close FL-3;
7. make FL-4 Optimization and Acceptance the governing phase.
