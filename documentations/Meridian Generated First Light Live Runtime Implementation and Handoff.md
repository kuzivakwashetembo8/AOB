# Meridian Generated First Light Live Runtime Implementation and Handoff

Status: PROMOTED AND PLAYABLE — FL-2 ACCEPTED; FL-3 ACTIVE  
Date: 2026-10-09  
Branch: `main`  
Promoted source commit: `553f2bd4c394a587a9bae6bb1d74c140462cfba7`

## Outcome

Generated First Light is no longer comparison-only infrastructure.

The live GTD `/game` runtime now selects the generated First Light world through a controlled world-source switch while retaining Authored First Light as a rollback/regression path.

The target remains:

> **Voight walking in the newly generated First Light world on the normal `/game` route.**

## Runtime architecture implemented

- reusable `createGeneratedFirstLightWorld(scene, physics)` lifecycle owner
- stable semantic player spawn
- stable camera-focus anchor
- generated buildings and representation systems
- accepted authored-parity roads/curbs/sidewalks
- accepted authored-style vegetation
- generated street context
- Rapier building collision
- Rapier parked-vehicle collision
- generated ground collision
- semantic camera blockers
- fixed daytime shadow baseline
- explicit lifecycle disposal
- authored/generated runtime source switch

The existing fixed-step movement, input bridge, camera control, and React/runtime ownership boundary were preserved.

## Streetscape preservation

The authored darker asphalt and timber curb/edge visual language is preserved in `streetscape-styles.ts` as a reusable future district family. It is not deprecated by the current Generated First Light treatment.

## Verification

Controlled verification deployment:

- deployment: `dpl_D1B1MoGhXcQrYmNJyFM6VemnguLf`
- preview: `https://gtd-jfd788f4f-interlinkglobaltech.vercel.app/game`
- source: `2f4396da06d8e38732e4ad15ccfaa5914791ff80`
- state: READY
- strict TypeScript: passed
- full Vitest suite: passed
- existing 50-cycle Rapier reclamation test: passed
- generated full-world lifecycle tests: passed
- production build: passed
- `/game`: HTTP 200
- `/first-light-comparison`: HTTP 200
- grouped runtime errors in verification window: none
- Vercel automatic deployment guard: restored to `exit 0`

## Live review acceptance — 2026-10-09

The promoted Generated First Light `/game` runtime was reviewed in motion.

Accepted:
- Voight can navigate around the block successfully.
- Generated First Light is sufficiently stable and visually coherent to close FL-2 and proceed to FL-3.
- T-junctions, turns, and intersections are functionally acceptable.

Rolling refinements:
- Extreme upward camera orbit could cross below terrain. Generated terrain now participates in the semantic camera-blocker ray system, matching the wall/roof exclusion model.
- The raised square asphalt overlays at the two First Light T-junctions read as separate carpet patches. They were removed; the existing overlapping main/side/rear carriageways now form the continuous tar surface.

No new deployment was triggered for these refinement commits. They will ride with the next substantial FL-3 visual review build.
## Promotion gate

Before `main` promotion:

1. targeted substantive lint must pass;
2. exact branch head must remain based on current `main`;
3. promotion must preserve Authored First Light;
4. promotion must preserve alternate streetscape styles;
5. intentional deployment must be created from the exact promoted `main` SHA;
6. `/game` must reach READY and remain error-free;
7. user must visually confirm Voight movement, collision, camera, and Generated First Light presentation.

The live review confirmation was received on 2026-10-09. FL-2 is accepted and FL-3 is now authoritative.
