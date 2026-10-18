# Procedure DDD — Meridian Central MC-V01 Failed Street-Generation Branch

**Project:** GTD — Grand Theft Division / Meridia / Meridian City  
**Date:** 2026-10-18  
**Directive:** Owner stop order: "Implementation unsuccessful, initiate Procedure DDD"  
**Failed branch:** \`feat/mc002-v01-connected-streets-20261018\`  
**Final branch commit:** \`9093706bff5205b9f6ea14577a8c2ff63e194388\`  
**Original branch point:** \`ff76cd51740871c656a269f2308b7b127794711c\`  
**Disposition:** **FAILED VISUAL GATE — PERMANENTLY DECOMMISSIONED — DO NOT MERGE OR REUSE**  
**GitHub branch deletion:** Requested as part of DDD; verify separately before claiming completed.  
**Preserved design authority:** \`documentations/GTD-MC-001 Meridian Central Refined Urban Design Specification - 2026-10-18.md\`.

## 1. Purpose: what this branch was and why it existed

The owner approved the story-based 9-block Meridian Central plan: **eight named streets, sixteen intersections, nine city blocks, and 36 reserved sites (35 buildings plus one public plaza)**. City Central needed to differ visibly from working-class South Ward: 5–8 metre commercial sidewalks, substantially wider roads, a major boulevard, distinct pedestrian crossing geometry, large parcels and a direct road connection to the accepted First Light/Mercer Street network.

The branch was created as the *first visual checkpoint* (**MC-V01**) of the five approved city-expansion gates. MC-V01 was intended to deliver all streets/curbs/intersections/plots as one substantial preview before any MC-V02 tower and skyline work could begin. It was **not** a car or wheel development branch. The independently accepted four-vehicle wheel implementation already resided on \`main\`.

Approved street identities: **Commerce Avenue, Meridian Boulevard, Justice Avenue, Station Road, Northbank Street, Exchange Street, Civic Street and South Link Road**. Their proposed corridors were 23–39 metres overall, with Meridian Boulevard specifically 39 metres and 7.5 metre sidewalks on each side.

The implementation chose a novel bounded runtime module rather than reuse the earlier, separately decommissioned WORLD-006 GEO-R1 expansion prototype. It planned fixed North–South street centerlines X = 170, 315, 460, 605 and East–West lines Z = -427, -282, -137, 8; 24 connecting inner road segments; sixteen Cartesian junctions; a Mercer connector (65,8) → (170,8); temporary empty buildable parcels; physical road/curb collision; MC-V01 inspection spawn via \`/game?mcV01=1\`; preservation of the ordinary \`/game\` South Ward spawn.

**Intended visual result:** a continuous, fully colored and navigable downtown road network, not a sky-colored void with floating markings.

## 2. Implementation and attempted corrections: chronological history

| Sequence | Commit / deployment evidence | Work performed and verified claim | Visual or process outcome |
| --- | --- | --- | --- |
| Foundational implementation | \`77bc50ba4350a49f7ff52c4d1b73774c4285ce50\` | Added \`meridian-central-v01-streets.ts\`; eight roads, 16 nodes, nine parcel envelopes, surfaces/colliders, runtime wiring, five visual milestones, initial automated tests. | Structural implementation only. No owner visual acceptance. |
| Pre-preview geometry correction | \`d61e8ab4a1ee68efdb495153cc0d4a4541097510\` | Raised sidewalk wall faces and median collision geometry; attempted to close asphalt gaps at junctions. | Technical adjustments prior to first accepted inspection. |
| Initial visual-checkpoint candidate | \`94945a9240d320bb75c552e193a3cb7fc6aa8598\`; preview host \`gtd-gk31bps02-interlinkglobaltech.vercel.app\` | Only connected crossing approaches receive markings; preview route \`/game?mcV01=1\`; deployed successfully. | **FAILED:** Owner Android screenshots showed a sky-blue road/terrain void, black/dark line markings and apparent unsupported character. Asphalt, pavement, blocks and parcel ground were missing. |
| First explicit recovery | \`c0240f65089b0a053df95c2258321ec6a278f718\`; preview host \`gtd-fo61nb00v-interlinkglobaltech.vercel.app\` | Set MC-V01 surface StandardMaterials \`maxSimultaneousLights=3\`, adapting an existing mobile-light budget pattern, added material policy test and corrected the MC inspection objective. | **FAILED AGAIN:** New Android screenshots showed the same featureless blue roadbed/terrain absence and detached dark markings, despite the corrected objective. The light-limit hypothesis was insufficient. |
| Final owner-authorized attempt | \`9093706bff5205b9f6ea14577a8c2ff63e194388\`; preview host \`gtd-m80xg9ia7-interlinkglobaltech.vercel.app\` | Replaced custom manually indexed flat RectBatch quads with real \`MeshBuilder.CreateBox\` primitives merged into material-based batches, applied opaque lighting/fog-independent emissive colors, reinforced geometry tests, recorded an explicit last-chance/decommission gate. | Automated **362/362 tests over 87 files** and Vercel READY were reported, but **NO owner visual acceptance** was given. The owner issued the permanent stop order. |

**Evidence limitation:** The last owner-provided screenshot, sent together with the stop order, visibly displays the **earlier second-preview host** \`gtd-fo61nb00v-interlinkglobaltech.vercel.app\`, not the final third-preview host \`gtd-m80xg9ia7-interlinkglobaltech.vercel.app\`. Therefore the screenshot itself is **not pixel proof of the final binary**. The owner nonetheless definitively rejected continued development and ordered DDD; do not reinterpret that directive as permission for another patch or preview.

## 3. The actual observed failure

The accepted visual criterion for MC-V01 was **continuous, visibly colored asphalt, green parcels/terrain, raised pale sidewalks, complete intersections and grounded pedestrian/vehicle geometry**, in a downtown road layout visually wider than South Ward.

The repeated Android observations instead show:

1. **Ground/surface invisibility:** no colored road, sidewalk, curb, median or lot-ground body; the sky-blue clear color fills almost the entire playable scene, beneath detached linework.
2. **Marking-only rendering:** dark road lines and dark crosswalk silhouettes render even when their supporting road surface is absent; markings cannot count as a complete road.
3. **Broken urban continuity:** without visible roadbeds and sidewalk masses, crossing alignment, driving geometry, parcel borders and connection to South Ward cannot be visually authenticated.
4. **Invalid acceptance inference:** GitHub source graph definitions, NullEngine allocated vertices/collision handles, green unit tests, an HTTP-200 /game route, Vercel READY and release-SHA checks were insufficient to validate actual Android WebGL framebuffer output.
5. **Repeated ineffective hypotheses:** capping lights did not fix the user's screenshot; replacement with six-faced built-in primitives was not independently visually accepted before the owner stop order.

### Root-cause classification

**Confirmed immediate cause of decommissioning:** Repeated failure of the real-device **visual acceptance gate** (at minimum the initial and second review candidates), in an implementation that constructed valid-looking scene/physics data but did not deliver visible city ground and roads.

**Exact rendering mechanism: UNRESOLVED.** We do *not* have a captured mobile WebGL shader compilation log, exact GPU capability/error sample, frame capture, offending material trace, camera/depth diagnosis or pixel-image diff proving one root cause. Plausible suspects included material shader uniform limits, custom vertex winding/geometry, lighting/fog paths or broader runtime rendering state, but the light-limit mitigation was demonstrably not sufficient; the final primitive switch also cannot be called confirmed successful. **Do not enshrine a speculative GPU explanation as fact.**

**Process failure:** The tests validated graph metadata, mesh allocations, collider ownership and build success, but did not reproduce actual user-device visible framebuffer output. A headless engine check cannot establish that streets render. The preview deployment then outsourced discovery of this fundamental missing-surface failure to owner screenshot review. Another architecture must establish a real pixel/render gate before urban expansion.

## 4. Permanent quarantine boundary

### Must never be promoted

Do **not** merge, cherry-pick, revert-and-reapply, copy/paste, resume, redeploy as an active development baseline, or refactor across branches any failed MC-V01 expansion-specific implementation:

- \`src/game/world/meridian-central-v01-streets.ts\` — all RectBatch and Babylon CreateBox street-generation revisions.
- MC-V01 additions to \`src/game/world/generated-first-light-world.ts\` — optional MC build/spawn/world lifetime integration.
- MC-V01 additions to \`src/game/world/first-light-runtime-source.ts\` — downtown runtime launch options.
- MC-V01 additions to \`src/game/core/gtd-runtime.ts\` — downtown spawn URL, location/HUD wiring and objectives.
- \`src/test/mc002-v01-street-network.test.ts\` — tests bound to the rejected generator.
- The rejected branch's **checkpoint implementation code** and candidate scene/geometry/material recipes.
- Any old MC-V01 preview URL as a production or future-development reference.

The failed codebase and preview deployments may remain accessible in historical commit/event logs strictly as **failure evidence**, not as an endorsed starting point. The branch ref itself must be deleted.

### What stays authoritative

- The **accepted narrative/urban plan** \`GTD-MC-001\` already on \`main\`, plus the five **conceptual visual checkpoints** as recorded in this failure report. That creative specification is NOT decommissioned.
- The user's currently accepted South Ward map, Voight/player setup, asset pipeline, night sky, lighting, four working car rigs and game controls.
- **WHEEL-001/WHEEL-002 is an independently successful, earlier release** on \`main\`, integrated with \`e5233e6f6411da83e439462476494a3d5224b2a5\`. The source blob IDs for \`src/game/vehicles/street-vehicle-wheels.ts\`, \`scripts/wheel001_extract_wheels.mjs\`, \`scripts/wheel001_asset_audit.mjs\`, \`scripts/wheel001_onboard_blender.py\`, wheel tests and source-wheel qualification workflow match exactly between this rejected branch and \`main\`. No wheel-source change was introduced by MC-V01. Preserve this accepted implementation and its original-source assets.
- The owner's subsequently committed fifth and sixth vehicle-source assets on \`main\` are NOT part of the failed expansion and must be retained.

**Repository proof:** As audited before decommissioning, the main branch head was \`6c2053903c4969719472b774b1438676503046c5\`. It contains none of the MC-V01-specific newly added generator/test/checkpoint source files. The rejected branch diverged from the accepted \`GTD-MC-001\` documentation commit \`ff76cd51740871c656a269f2308b7b127794711c\`. Compared with \`main\`, the failed branch is **5 commits ahead and 2 commits behind**. The only material changes vs main relate to the MC expansion/test/documentation, and main's two newer uploaded vehicle GLBs remain outside the failed branch.

## 5. Procedure DDD execution / release controls

1. **Document:** this report is the permanent source of truth for the decommissioned branch purpose, changes, failure modes, unsuccessful hypotheses, visual evidence, explicit stop order and code quarantine.
2. **Decommission:** effective immediately. MC-V01 is CLOSED / REJECTED. **MC-V02, MC-V03, MC-V04, MC-V05 and production promotion are NOT AUTHORIZED.** No continuing, correcting or incorporating the failed branch.
3. **Delete branch ref:** delete exact \`refs/heads/feat/mc002-v01-connected-streets-20261018\` only after checking the expected final branch SHA \`9093706bff5205b9f6ea14577a8c2ff63e194388\`. Re-check main and branch existence afterward. Never delete main. If an authorized connector cannot delete branches, report that as an outstanding step rather than falsely claiming it complete.
4. **Do not merge failed code** to main. This single retrospective Markdown issue report is the ONLY intentional main-branch carryover; it is administrative evidence, not an executable game feature.
5. **Future restart requires a new, owner-approved independent architecture**, with actual mobile pixel evidence early in the build and separate minimum viable rendering proof. Do not automatically reactivate the prior GEO-R1 or MC-V01 code.

## 6. Postmortem one-line conclusion

**MC-V01 failed because its produced downtown road network never met actual Android visual acceptance: the roadway, sidewalks and parcel ground did not visibly render, despite three implementation revisions and passing synthetic/CI gates. The exact GPU/runtime mechanism remains unconfirmed. The failed implementation is quarantined; the previously accepted wheel system and all current main functionality are independent and preserved.**
