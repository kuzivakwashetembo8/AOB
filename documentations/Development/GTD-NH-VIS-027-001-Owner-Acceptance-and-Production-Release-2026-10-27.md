# G.T.D — NH-VIS-027-001 Sedan Tread and Solid Curb Visual Acceptance and Release

**Date:** 2026-10-27
**Project:** Grand Theft Division (G.T.D.), Meridia / North Heights
**Milestone:** NH-VIS-027-001 — Sedan rotating outer tread shell and volumetric concrete curbs
**Owner's explicit decision:** “Accepted, merge and deploy.”
**Disposition:** **VISUAL ACCEPTED / MAIN MERGE AND PRODUCTION DEPLOYMENT AUTHORIZED.**

## Owner-tested exact build

- Preview: https://gtd-ij1h8j67k-interlinkglobaltech.vercel.app/north-heights-preview
- Owner-accepted source revision: `cc77d5a7b85247181649d141898e56ac1aa417cf`
- Vercel preview ID: `dpl_Cyp7LXxfHvo2fb2knf4VqbopQr8e`, verified `READY`.
- Build checks: **606 passing tests in 152 files**, all TypeScript and native-source preprocessing checks, PWA package 801 files and no missing mandatory assets.
- Owner: explicitly accepted the presented build and authorized merge/deploy.

## Accepted correction 1 — rotating source Sedan rubber

- The original Four Door Sedan GLB has four `Siped tread blocks` outer shell meshes which were omitted by the narrowly prefixed GEN-VEH-007 source-part classification. They were wrongly grouped as static body/trim while the tyre carcasses and alloy rims rolled.
- Fix: recognize all four actual source tread nodes, require one per correct rotating wheel corner, and forbid static tread meshes in the body. Retain actual source rim/carcass/tread geometry and accepted source-native traffic rendering rather than procedural replacements.
- Signed longitudinal wheel travel now turns tyre and rim backwards on reverse travel; no new wheel rig or displacement.

## Accepted correction 2 — solid North Heights curb geometry

- Existing pavement top was 0.20 m above grade and asphalt top 0.075 m, but exposed sidewalk outer sides and intersection-corner pads had no enclosed geometry.
- Fix: add grade-following lower concrete base and full vertical fascia on the exposed outer sides and corner ends, including both road-axis orientations. Retain the accepted road topology, same visual height, shared geometry batches/materials and normal walking/vehicle physics.
- Existing North Heights pavement and curb regression assertions updated to require solid rather than paper-thin pavement.

## Release isolation: only this exact acceptance

By the time the owner authorized release, `feature/gtd-nh-wheel-tyre-curb-geometry-20261027` had subsequently advanced **12 commits after the approved preview SHA** and contained separate `NH-VIS-027-002` / HUD / night-curb modifications. Those subsequent files **were not present in the accepted preview and are not authorized for release by this acceptance**.

To avoid accidentally merging subsequent changes, production release MUST use the independently isolated branch `release/gtd-nh-vis027-001-accepted-wheel-curb-20261027` starting at the precise owner-tested SHA `cc77d5a7b85247181649d141898e56ac1aa417cf`, plus **this acceptance document only**. Do not merge the advancing original feature branch into `main`; its unrelated work remains outside the release.

## Required release verification

1. PR from this isolated accepted revision into `main`.
2. Confirm PR touches ONLY these scoped files and this acceptance doc: original `NH-VIS-027-001` technical document, `scripts/genveh007-extract-seven.mjs`, `src/game/experiments/north-heights-roads-003.ts`, `src/game/experiments/north-heights-sedan-traffic-009.ts`, targeted test, loading-persistence test-timeout correction, and updated NH008 UI/curb test.
3. Merge PR and verify exact new main merge SHA.
4. Deploy production via Vercel from that exact main commit; verify the new production deployment is `READY` and public domains resolve to it.
5. Record outstanding subsequent work for a later separately authorized milestone.

**RELEASE GATE:** Approved wheel-and-curb refinement only; never release subsequent untested work implicitly.
