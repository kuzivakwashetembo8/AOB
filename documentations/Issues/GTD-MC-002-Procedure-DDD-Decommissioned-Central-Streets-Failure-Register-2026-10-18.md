# GTD-MC-002 — Procedure DDD: Meridian Central MC-V01 Decommissioned Implementation and Failure Register

**Owner decision:** 2026-10-18, Procedure DDD explicitly ordered after rejection of the MC-V01 implementation.  
**Classification:** **DECOMMISSIONED / OWNER-REJECTED / DO NOT REUSE**.  
**Branch:** \`feat/mc002-v01-connected-streets-20261018\`.  
**Terminal implementation commit:** \`9093706bff5205b9f6ea14577a8c2ff63e194388\`.  
**Base before first MC-V01 code:** \`ff76cd51740871c656a269f2308b7b127794711c\`.  
**Deletion:** Required by owner. This DDD record must persist on \`main\` independently of the branch, without any implementation code.  
**Design authority that survives:** \`documentations/GTD-MC-001 Meridian Central Refined Urban Design Specification - 2026-10-18.md\`. Narrative, street names, block/site schedule and visual checkpoint *concepts* remain approved; **this road runtime and its implementation approach do not**.

## 1. Origin, purpose and authorizations

The Game Development narrative positions **Meridian Central** as the dense commercial, financial, institutional and transport core of Meridian City, distinct from the lower-density residential South Ward. In the owner-approved MC-001 proposal, its expected physical design consisted of nine urban blocks (**A1–C3**), **36 sites** (35 buildings plus a public plaza), eight named streets and sixteen intersections. Its wider sidewalks, multi-lane roads, commercial building podiums, transit corridors and public plaza were benchmarked against six owner-provided architectural and game references. The design standard and construction schedule were recorded before implementation.

The owner then authorized a gate-based build: **MC-V01 complete street network; MC-V02 A2+B2 skyline; MC-V03 A1+A3+B1 finance/transport; MC-V04 B3+C1+C2+C3 remaining buildings; MC-V05 district-wide streetscape**. Each gate required a *substantial observable improvement* rather than deploying one tree or one building. The owner was to visually approve each entire checkpoint before any next phase.

**MC-V01's task:** make all eight streets and sixteen crossings visible and physically traversable, with a much wider downtown public realm, nine reserved blocks and a real road connection to existing Mercer Street. No high-rises, NPCs or traffic AI were authorized in V01. Work used an isolated GitHub branch because the existing First Light area, four accepted driveable vehicles, player/camera, lighting and 60-second startup requirement must not be regressed.

**Original implementation branch:** \`feat/mc002-v01-connected-streets-20261018\`, created from the accepted \`main\` lineage after MC-001. Its road layout was a new renderer, not a resumption of the previously banned WORLD-006 GEO-R1 code; nevertheless, the new approach has now independently failed visual acceptance.

## 2. The design/implementation attempted, not accepted

The branch placed four north–south road centerlines at X = 170, 315, 460, 605 metres and four east–west roads at Z = -427, -282, -137, 8 metres, forming the intended 3×3 buildable grid with 16 crossing nodes and 24 interior road links. A tapered corridor connected (65,8), the accepted Mercer Street eastern endpoint, to (170,8), a proposed Commerce Avenue / South Link junction. It reserved the MC-01 through MC-36 stable site identifiers. Street dimensions came from MC-001: for example Meridian Boulevard used a 24 m carriageway and 7.5 m sidewalks per side for 39 m overall.

The branch created an MC-specific Babylon.js surface system for asphalt, sidewalks, medians, terrain, blocks and lane/crosswalk paint; Rapier support colliders and curb elevations; optional direct downtown inspection through \`/game?mcV01=1\`; street-name HUD display; world creation/disposal integration; automated static geometry and collision tests; and an MC-002 checkpoint document.

**Changed implementation files compared with \`main\` before DDD** (all forbidden from migration as implementations):
- \`src/game/world/meridian-central-v01-streets.ts\` — new road geometry, parcels, material batches and collision ownership.
- \`src/game/world/generated-first-light-world.ts\` — added MC-V01 world extension, optional downtown spawn/focus and disposal hooks.
- \`src/game/world/first-light-runtime-source.ts\` — passed new city flags into the existing world.
- \`src/game/core/gtd-runtime.ts\` — enabled city surfaces and inspection URL/HUD context.
- \`src/test/mc002-v01-street-network.test.ts\` — tests that could pass without proving actual GPU pixels.
- \`documentations/GTD-MC-002 Meridian Central Visual Development Checkpoints - 2026-10-18.md\` — branch-local staging and failure notes. This archived DDD record supersedes its implementation status; the approved five *conceptual* checkpoints may inform an entirely new authorization, but its implementation descriptions do not.

## 3. Exact branch development chronology

| Branch commit | Work performed | Evidence and outcome |
|---|---|---|
| \`77bc50ba4350a49f7ff52c4d1b73774c4285ce50\` | First implementation: centerlines, parcels, surfaces, roads, collisions, HUD integration and five-gate documentation | Geometric/physics plan existed in code; no confirmed Android pixel acceptance |
| \`d61e8ab4a1ee68efdb495153cc0d4a4541097510\` | Replaced some junction geometry with raised curb faces; addressed asphalt seam logic | Did not resolve mobile rendering failure |
| \`94945a9240d320bb75c552e193a3cb7fc6aa8598\` | Corrected crossing direction gating so roads did not present markings on nonexistent outbound legs | **First owner screenshots:** blue ground/void; dark markings seen, but roadway, sidewalks and terrain absent. **FAILED VISUAL GATE** |
| \`c0240f65089b0a053df95c2258321ec6a278f718\` | Second attempt: cap seven StandardMaterial surface families to three simultaneous lights, preserving previous street geometry and changing HUD inspection objective | **Second owner screenshots:** no improvement in ground/road visibility; blue void and detached markings remained. **FAILED VISUAL GATE** |
| \`9093706bff5205b9f6ea14577a8c2ff63e194388\` | Owner-authorized **third and final** attempt: replace hand-assembled flat triangles with ordinary Babylon CreateBox solid surfaces, merge to seven families, render as opaque emissive unlit/fog-independent materials, assert geometry and elevations | Deployment \`gtd-m80xg9ia7-interlinkglobaltech.vercel.app\` was READY and tests passed. **Owner subsequently declared the MC-V01 implementation unsuccessful and ordered Procedure DDD. No further patch attempts are authorized.** |

The two earlier previews were \`gtd-gk31bps02-interlinkglobaltech.vercel.app\` (first failed review), and \`gtd-fo61nb00v-interlinkglobaltech.vercel.app\` (second failed review). The final preview was \`gtd-m80xg9ia7-interlinkglobaltech.vercel.app\`. These are **historical evidence references, not approved release links**. Do not use them to start new city work.

**Evidence limitation recorded verbatim:** The latest provided screenshot (phone time 21:07, 2026-10-18) visibly displays the \`gtd-fo61nb00v\` URL, which corresponds to the *second*, not the final, preview. That screenshot therefore independently corroborates the second failure, **not** how the third build's framebuffer rendered. Nonetheless, the owner explicitly declared the implementation unsuccessful and instructed decommissioning of the entire branch. We must not invent a third-build Android screenshot or override the owner's disposition.

## 4. Actual observed failure

The game loaded Voight, the normal gameplay HUD, the Meridian Central location label and isolated lane/stop/crosswalk markings, but the streetscape was **not present as the intended opaque geometry**:

- Large contiguous terrain appeared as unbroken sky blue; there was no visible roadbed or grass/block ground.
- Asphalt, distinctive pale broad sidewalks, raised curb masses and median areas did not show as solid urban surfaces.
- Dark stripes/crosswalk markings looked suspended without a supporting roadway, and Voight seemed to stand or hover in an empty blue environment.
- The intended nine-block ground pattern and Mercer-to-downtown street experience were not perceivable or verifiable.
- Since visual surfaces were absent, practical user acceptance of crossing widths, curbs, road continuity, driveability and sidewalk clearance was impossible.

**Business outcome:** MC-V01 never passed its first substantial visual checkpoint. No buildings (MC-V02) or other skyline/traffic features were authorized; building count and site definitions in MC-001 remain an approved plan, not a delivered city.

## 5. Why the efforts failed — distinguish proof from hypotheses

**Proven evidence:**
- Visual failure repeated after the first and second full preview despite automated checks reporting valid geometry and collisions.
- The second revision's three-light limit did not visibly restore the missing surfaces. The lighting-budget diagnosis therefore cannot be asserted as an established root cause.
- The reported green tests relied on Babylon \`NullEngine\` and metadata, index counts, mesh/collider lifetimes and shader properties, not on actual mobile WebGL framebuffer images. **A mathematically valid mesh does not prove that the Android renderer draws it.**
- The final third revision passed **362/362 tests across 87 files**, successfully built and published, but no verified Android final-build pixel evidence was available in the latest screenshot. The owner rejected the implementation irrespective of that test result.

**Unproven candidate explanations, not settled diagnoses:** Mobile shader compilation/resource limits; custom quad winding, normals, culling, depth/camera clipping or material incompatibility; scene draw ordering and sky dome interaction; incorrect world-space surface placement; or material/mesh rendering-state interactions. The last patch replaced the entire surface primitive family but *without authenticated GPU framebuffer evidence or shader console traces*, it cannot be claimed to have established or solved a single root cause.

**Process failures:**
1. Treating allocation of vertices and colliders as sufficient evidence of visible materialized roads.
2. Attempting material property patches before obtaining a device-level screenshot/trace that isolated the cause.
3. Building the whole network before completing trustworthy browser render diagnostics; the size of the failure made attribution harder.
4. Reusing general shader assumptions for a new city without first proving their relevance to the observed fault.
5. Conflating a READY deployment and passing unit suite with milestone delivery. **They are not visual acceptance.**

The owner-authorized trial limit has now been reached. A fourth patch or derived branch that resumes MC-V01's implementation is **expressly prohibited**.

## 6. Decommission contract / cross-over firewall

**Permanent stop order:**
- **DO NOT** merge \`feat/mc002-v01-connected-streets-20261018\` into \`main\` (no PR merge, squash merge or fast-forward).
- **DO NOT** cherry-pick its commits, port its runtime functions, carry across its box/mesh/material batcher, scene hooks, road or Rapier colliders, inspection URL logic or test code, or use its source as a new city foundation.
- **DO NOT** promote the preview deployments, reuse their immutable deployment references as production artifacts, or restore the branch as a development base.
- **DO NOT** proceed to MC-V02+ on this branch or on a renamed/duplicated copy.
- **DO** preserve this textual incident report, accepted narrative plan MC-001 and owner decisions. A future city implementation, if authorized, must begin from a new independently researched rendering architecture and pass genuine browser/mobile visual proof.
- **DO** maintain the existing working South Ward, its assets/lighting, current cars and wheel-turning feature exactly as deployed.

**Wheel isolation independently verified on 2026-10-18:**
- The accepted **WHEEL-002** code was merged on \`main\` as \`e5233e6f6411da83e439462476494a3d5224b2a5\`, **before** the MC-V01 branch diverged from \`ff76cd51740871c656a269f2308b7b127794711c\`.
- The current working \`main\` at audit time was \`6c2053903c4969719472b774b1438676503046c5\`; its history descends from that approved WHEEL-002 merge and includes later independent owner commits for extra vehicle assets.
- These files have **identical Git blob SHA hashes** on \`main\` and the failed city branch: \`scripts/wheel001_extract_wheels.mjs\`, \`scripts/wheel001_asset_audit.mjs\`, \`scripts/wheel001_onboard_blender.py\`, \`src/game/vehicles/street-vehicle-wheels.ts\`, \`.github/workflows/wheel001-source-qualification.yml\`, \`src/test/wheel001-admission.test.ts\`, \`src/test/wheel002-source-wheel-fidelity.test.mjs\`, \`src/test/street-vehicle-wheels-grounding.test.ts\`.
- Only the *city's* integration additions to \`gtd-runtime.ts\`, \`generated-first-light-world.ts\` and \`first-light-runtime-source.ts\` differ between the branches; those differences are prohibited from migration. The unchanged WHEEL-002 scripts and rigs are **not** a product of the MC-V01 implementation and must remain operational.
- The original additional vehicle GLBs already on \`main\` are independent of the failed MC branch; do not remove them.

## 7. Terminal status and post-delete verification

**Desired end state:** (1) this DDD text lives under \`documentations/Issues/\` on \`main\`; (2) no MC-V01 implementation/code crosses to \`main\`; (3) the failed feature-branch reference is deleted; (4) wheel rig source/traces and additional traffic vehicle assets remain intact.

**Branch deletion confirmation must be written only after GitHub has reported or a read-after-delete has independently established that the ref no longer exists.** If the current connector does not provide deletion capability, report that as an incomplete administrative step rather than falsely claiming the ref is gone; the owner may remove it from the repository's Branches UI.

**Future restart gate:** A new plan must first explain the complete Android WebGL draw/visibility diagnostic strategy and its independent rendering model, seek owner authorization and then use substantial visual checkpoints. No automatic relaunch of the withdrawn implementation.
