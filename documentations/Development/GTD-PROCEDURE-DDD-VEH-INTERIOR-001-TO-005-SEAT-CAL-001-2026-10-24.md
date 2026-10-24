# PROCEDURE DDD — Decommissioning of Failed Six-Vehicle Seating Branch
**Project:** GTD — Grand Theft Division, Meridian City  
**Incident class:** Unsuccessful experimental development / failed owner visual acceptance  
**Date:** 2026-10-24 (Africa/Johannesburg)  
**Decision:** **FAILED — DO NOT MERGE, DO NOT REDEPLOY, DO NOT PORT THE EXPERIMENTAL SEATING CODE**  
**Experimental branch:** `feat/veh-interior-001-cabin-mapper-20261023`  
**Immutable final experimental commit:** `d4cf306d015a21e508c78a8e1ffe38f8e4d9cdc6`  
**Pull request:** [Draft PR #49](https://github.com/interlinkglobal/GTD/pull/49), targeted at `feat/char-126-human-vehicle-seating-20261023`, **never main**. To be **closed unmerged** during DDD.  
**Source parent:** [Draft PR #48](https://github.com/interlinkglobal/GTD/pull/48), `feat/char-126-human-vehicle-seating-20261023`, where the independent accepted seated character animation CHAR-130 resides. **The parent branch is not included in DDD and must remain untouched.**  
**Current repository audit:** PR #49 had 68 commits / 36 modified paths relative to parent, 0 parent commits missing, and was unmerged. A comparison to `main` shows divergence caused in part by the independent parent branch; do NOT conflate the failed seating branch with independently approved CHAR-130 features. The new `vehicle-seat-profiles-006.ts` and VEH-INTERIOR planning documents were not present on `main` at audit time.

## I. Why this branch existed

After successful standalone `character.glb` seated-anatomy work (CHAR-127/128/130), the six production-intended vehicles continued to place Voight incorrectly. The objective was a scalable driving-cabin mapping and seat-placement system covering the Range Rover Sport 2018, Toyota Hilux, Land Rover Defender, Dodge HP, BMW M4, and Lamborghini Temerario, and capable of handling future imports without reworking character animation. Ferrari and Buggy are intentionally **excluded** from the production vehicle set. This work remained experimental.

The accepted human sitting posture and correct vehicle placement were separate problems: **an anatomically seated character is not automatically seated inside the physical cabin**. The experiment mixed incomplete geometry inference, UAL-normalization assumptions, inferred seat sides and soft body-clearance estimates, producing some internal test successes but no visually acceptable complete six-car driver accommodation.

## II. Chronological experiment and observed outcome

### Phase A — VEH-INTERIOR-001: technical plan and six-GLB source audit (Oct 23)
**Attempt:** Define canonical vehicle-local geometry, discover floor/roof/windshield/seat/footwell and driver side, and use the same map for future cars. Added `scripts/veh-interior-001-source-audit.mjs`, test fixtures, build preflight inventory and `vehicle-interior-geometry-001.ts` triangle sampler.

**Observed factual result:** Parsed all six actual GLBs. Source counts were Range Rover 7 meshes / 523,384 indexed triangles; Hilux 1 / 49,912; Defender 1 / 50,142; Dodge 1 / 646,834; BMW 30 / 206,593; Lamborghini 782 / 563,025. All contained Draco-compressed geometry. No separately named seat/backrest/steering surfaces were proven by the semantic naming survey. A label match is not an interior seat or surface proof.

**Outcome:** Source inventory, geometry-independent evidence provenance and verified-surface rejection logic worked as **research utilities**, but no real seat, cushion, physical floor, steering side or drivable human clearance could be established from labels and outer dimensions. A synthetic floor/roof passing its unit tests was not verification of any actual car.

### Phase B — VEH-INTERIOR-002: offline Draco decode and merged-component discovery (Oct 23)
**Attempt:** Decode six original GLBs at build time, inventory actual triangle connectivity, discover disconnected islands, weld coincident source seams, emit compact non-admitting cabin evidence and runtime diagnostics without game-loop scanning. Added `veh-interior-001-decode-fleet.mjs`, `veh-interior-002-components.mjs`, generated cabin evidence and regression tests.

**Result:** The algorithm could inspect source topology and report missing/ambiguous geometry; the seam-welding refinement was required because disconnected-component counts falsely fragmented connected visual meshes. However triangle connectivity did **not** reliably classify seats, footwells or the sealed usable passenger compartment, especially in single merged Draco primitives.

**Outcome:** **No verified six-car cabin map** was produced. Source map statuses accurately remained partial / needs-review, yet without a physical cabin fit this research could not solve the user's actual driver-placement requirement.

### Phase C — VEH-INTERIOR-003: provisional six-car auto-placement (Oct 23)
**Attempt:** Compute driver/passenger anchors, hip and foot positions from external fitted width/height/length fractions, then lift hips using linked-ankle witnesses and a guessed floor height. Added `six-fleet-driver-fit-003.ts` and runtime seating adjustments.

**Observed visual failures:** BMW showed head/torso emerging through its roof in one preview; an earlier image showed a leg protruding below the chassis. Defender hands/upper body entered windshield and driver side was incorrect; Lamborghini was too high and/or assigned the wrong front seat; Dodge shoes extended under the body. The Hilux was better but not fully certified.

**Root failure:** Exterior bounding proportions are **not physical cabin measurements**. Raising the pelvis to satisfy a hypothetical footwell floor can move the head through the roof, with no genuine cushion/backrest/roof collision witness.

### Phase D — VEH-INTERIOR-004: copy previously working `ual.glb` driver-root anchors (Oct 23)
**Attempt:** Reuse legacy Range Rover / coupe UAL steering-side coordinates, translate the normalized UAL actor root into a `character.glb` hip target, lower the BMW pelvis, and fold calves instead of elevating the torso. Added `six-fleet-ual-seat-004.ts`, CHAR-130 real-rig joint measurements, calf-only accommodation and headroom estimates.

**Measured rig evidence:** The accepted posed 73-joint character's **head joint** was ~0.673m above the pelvis and ankle joints ~0.442m below it; an additional 0.115m shoe reserve was **estimated**, not measured from skinned shoe vertices.

**Owner screenshot findings:** Range Rover still showed head/hands into windshield; Defender appeared on passenger side with torso/hands through windshield, and feet below floor; Lamborghini wrong side and head/roof conflict; Dodge and BMW lower-body penetration. UAL actor-root and `character.glb` pelvis origin were not interchangeably grounded.

**Root failure:** Reusing a working control anchor is only a **starting point**; the original seat-root transform does not encode every model's actual cushion height, backrest contact, steering wheel side or the deforming character's full body envelope.

### Phase E — VEH-INTERIOR-005: universal forbidden-state/constraint equation (Oct 23)
**Attempt:** Optimize pelvis position under the mathematical inequality

`floorY + soleDrop - boundedCalfFlex + floorMargin <= pelvisY <= roofY - headRise - roofMargin`

and reject roof/floor/glass/body/driver-seat violations. Added `vehicle-seat-constraints-005.ts`, proof-status contracts, regression fixtures and integration with UAL placement.

**Outcome:** Correctly expressed the *mathematical* feasibility test and its missing-evidence distinction, but the actual six-car runtime supplied **provisional exterior-derived heights**, absent signed windshield/body distances, unknown seat support and unknown steering geometry. The algorithm was therefore unable to turn guesses into verified cabin fit.

**Observed visual result:** User explicitly reported the equation produced no meaningful seating difference; the BMW, Defender, Rover, Dodge and Lamborghini defects persisted. Passing unit tests for synthetic or incomplete geometry did not validate rendered skinned-mesh contact or true driver-side assignment.

### Phase F — VEH-SEAT-CAL-001: six independent hard-coded initial driver profiles (Oct 24)
**Attempt:** Following owner direction to abandon automatic placement as the primary source, create `vehicle-seat-profiles-006.ts`, independent driver lateral lane, fore/aft fraction, fixed hip height, ankle lift and hand reach for each of the six models. Bypass provisional dynamic roof/floor corrections for curated drivers; preserve the approved standalone CHAR-130 pose. Commit all six changes in one batch and one Vercel preview instead of six separate deployments.

**Test/build:** On final preview commit `d4cf306d`, Vercel reached READY and recorded **552 tests passing across 124 test files**. These were code/geometry-fixture regressions and NOT owner visual acceptance.

**Final owner verdict on Oct 24:** **“Failed. Document all attempts then initiated procedure DDD on this branch.”** This is dispositive. No speculative claim that a particular profile was accepted is permitted; the entire six-car visual seating trial is rejected regardless of passing automated checks.

**Why the curated stage still failed:** Its numbers were calibrated from exterior screenshots without measured true seat cushion/backrest, physical wheel position, consistent source coordinate handedness and full skinned-mesh collision. Its independent corrections could move a character plausibly without proving contained posture. No visual acceptance was achieved across all six cars. Lack of a live editable calibration/debug view increased feedback and deployment overhead.

## III. Defect matrix at closure (last independently identified recurring failure)

| Vehicle | Observed concern | Closure disposition |
|---|---|---|
| Range Rover Sport 2018 | Face/head and hands through forward glass; too far forward | **Unresolved/rejected** |
| Toyota Hilux 002 | Less-obvious defects; driver contact/feet not proven by screenshot | **Unverified, not accepted** |
| Land Rover Defender 001 | Apparent passenger-side placement, torso/hands through windshield, feet through floor | **Unresolved/rejected** |
| Dodge HP | Feet/shoes visible below vehicle underbody | **Unresolved/rejected** |
| BMW M4 | Initial head above roof; later shoe visible below sill | **Unresolved/rejected** |
| Lamborghini Temerario | Wrong side, low roof/headroom and shoes below body | **Unresolved/rejected** |

These are image-observed defects, **not** claims of exact source-GLB measurements. They are not fixed merely because a later calculator returned an admissible interval or test passed.

## IV. Root cause and lessons

1. **Insufficient cabin evidence**: GLB material/mesh names, connectivity and external AABBs cannot establish real car interiors, seats, steering wheels, or collision volumes when source geometry lacks separable/semantic surfaces.
2. **Reference-frame ambiguity**: Source GLB forward axes and modelRoot visual heading (particularly Lamborghini π correction), physical steering side and model/import transform were not established as a measured immutable per-car convention.
3. **Actor-root vs pelvis mismatch**: The accepted UAL visual scale/actor anchor and actual character hip/skinned envelope require direct calibration, not just fractional offsets.
4. **Optimizing unmeasured constraints**: An algebraically correct interval constrained by guessed floor/roof locations can be faithfully calculated while remaining visually wrong.
5. **Skeleton checks ≠ skin containment**: Wrist/ankle/head linked-joint tests do not prove hands, hair, shoes and torso avoid rendered meshes. Actual skinned vertices and collision contacts were missing.
6. **Premature all-car acceptance inference**: A six-car batch of constants derived from screenshots did not supply reliable independent head/foot/backrest witnesses for each car.
7. **Development efficiency**: One shared preview for all six was appropriate given deployment rate limits; however numerical editing and visual review should eventually be possible live in the browser and committed only after acceptance.

## V. Isolation and preservation rules (mandatory)

- **Do not merge PR #49** into its CHAR-130 parent or `main`; close as **not merged — failed experiment**.
- **Do not cherry-pick or port** `human-seat-pose-126.ts` modifications from the VEH-INTERIOR branch; its copy also carries later unaccepted vehicle-only tuning. Do not copy altered `gtd-runtime.ts`, `mercer-static-character-103.ts`, `package.json`, `mercer-additional-parked-glbs-006.ts`, calibration profiles or generated geometry outputs. Any future re-use of read-only audit ideas must be separately reviewed, documented and authorized.
- **Preserve CHAR-130** and CHAR-127/128 accepted standalone seated anatomy on their independent parent branch. Those accepted features are **not decommissioned** here; PR #48 must remain independent and unchanged.
- Preserve established walking, running, flying, jumping, wheel turning, driving physics, existing UAL fit and the excluded Ferrari/Buggy policy. Never revert an accepted implementation while removing an unaccepted seating-calibration experiment.
- **No production deployment** and no promotion of any experimental Vercel preview to `main`.
- Store this report on **main as documentation only** to preserve engineering lessons without copying any experimental runtime code.

## VI. Evidence and immutable references

- Draft PR #49: https://github.com/interlinkglobal/GTD/pull/49
- Last failed experiment: https://github.com/interlinkglobal/GTD/commit/d4cf306d015a21e508c78a8e1ffe38f8e4d9cdc6
- Parent accepted CHAR-130 / PR #48: https://github.com/interlinkglobal/GTD/pull/48
- Last experimental Vercel preview: `https://gtd-quyv2n31a-interlinkglobaltech.vercel.app/game?gtdChar126=1` (**rejected; do not use as baseline**)
- Previous checkpoints: `gtd-5bcgoqei6` (provisional stage), `gtd-piadft2be` (UAL transfer), `gtd-38ejzjrzr` (constraint stage).
- All stage planning and source reports were committed on the failed branch and can be recovered by immutable commit history/PR diff even after branch removal.

## VII. Procedure DDD execution checklist

- [x] Audit PR #49 and all 68 experimental commits relative to CHAR-130 parent.
- [x] Document original goal, all six approaches, objective failure reasons, owner observations, complete 68-commit ledger and safeguarding instructions on `main`.
- [ ] Close PR #49 without merge and confirm final state.
- [ ] Delete `feat/veh-interior-001-cabin-mapper-20261023` **only after** archival and PR closure. If the GitHub connection lacks branch-ref deletion permission/action, explicitly report this blocking step; do **not** claim deletion.
- [ ] Verify post-decommission repository main and parent PR #48 remain unaffected.
- [ ] Prevent any further development, deployment or merging from the retired branch.

## VIII. Complete 68-commit branch-specific evidence ledger

Chronological ascending; only commits that are **ahead of** `feat/char-126-human-vehicle-seating-20261023` are included. Commits in the parent feature's CHAR-126–130 history are intentionally excluded to avoid classifying accepted independent work as failed.

| # | Commit date | SHA | Purpose |
|---:|---|---|---|
| 1 | 2026-10-23 12:47 UTC | [`5f0482917`](https://github.com/interlinkglobal/GTD/commit/5f048291700383fe4f30897bb2d2879d5f40888d) | docs(VEH-INTERIOR-001): design source-backed universal cabin mapping before occupant placement |
| 2 | 2026-10-23 12:48 UTC | [`17e95bcf1`](https://github.com/interlinkglobal/GTD/commit/17e95bcf150732f02e81f8e99fb62f92025a9c4b) | docs(VEH-INTERIOR-001): correct character component integration reference |
| 3 | 2026-10-23 13:47 UTC | [`98bd6cb1f`](https://github.com/interlinkglobal/GTD/commit/98bd6cb1f668ca9f767a743db4bf488b78638964) | feat(VEH-INTERIOR-001 G1): read-only six-GLB metadata audit with truthful unknown cabin admission |
| 4 | 2026-10-23 13:48 UTC | [`e1662e8f4`](https://github.com/interlinkglobal/GTD/commit/e1662e8f4c62ba78687a4bcaeaa30766fcaa1ae8) | build(VEH-INTERIOR-001): produce factual source audit before Vite without scanning at game startup |
| 5 | 2026-10-23 13:48 UTC | [`9b89341ca`](https://github.com/interlinkglobal/GTD/commit/9b89341ca0a7d619c3edd483dfa87ce13a15f65f) | test(VEH-INTERIOR-001 G1): merged meshes, named hints and unknown-seat fail-closed semantics |
| 6 | 2026-10-23 13:52 UTC | [`2295829bd`](https://github.com/interlinkglobal/GTD/commit/2295829bda5905a35b35e858e0231ee24bfecc1f) | docs(VEH-INTERIOR-001 G1): actual all-six GLB structural findings, exclusions and G2 boundary |
| 7 | 2026-10-23 13:56 UTC | [`ce395dc30`](https://github.com/interlinkglobal/GTD/commit/ce395dc300adf2da1aabcc07920401254cab832f) | feat(VEH-INTERIOR-001 G2): conservative car-local floor/roof triangle sampler with fail-closed evidence |
| 8 | 2026-10-23 13:57 UTC | [`98cc374f6`](https://github.com/interlinkglobal/GTD/commit/98cc374f622d0079b7d1652a9599ab02767ccdc8) | test(VEH-INTERIOR-001 G2): tested car-local real floor/roof sampling and fail-closed absence |
| 9 | 2026-10-23 14:00 UTC | [`1da1bbd78`](https://github.com/interlinkglobal/GTD/commit/1da1bbd78f78dcbd1a8f337594f9ff7886cef3ee) | docs(VEH-INTERIOR-001 G2): record read-only triangle sampler and prerequisites for calibrated overlay |
| 10 | 2026-10-23 14:52 UTC | [`d8b031827`](https://github.com/interlinkglobal/GTD/commit/d8b0318274733bf10a66899bfefda20286862838) | docs(VEH-INTERIOR-002): lock six-car-first scope, exclude Ferrari/Buggy, define truthful admission |
| 11 | 2026-10-23 14:54 UTC | [`6e44af874`](https://github.com/interlinkglobal/GTD/commit/6e44af87407c80858ad21e275f2c692e85c1635b) | feat(VEH-INTERIOR-002): decode source Draco geometry for all six with deterministic non-admitting evidence reports |
| 12 | 2026-10-23 14:55 UTC | [`fd50c54cd`](https://github.com/interlinkglobal/GTD/commit/fd50c54cd34b8de9891479f0ca8978b2465d683b) | test(VEH-INTERIOR-002): six-only decoded geometry, orientation correction, no false cabin admission |
| 13 | 2026-10-23 14:55 UTC | [`24e5588c8`](https://github.com/interlinkglobal/GTD/commit/24e5588c885b8ad2479646d8750d5b0611e49b80) | feat(VEH-INTERIOR-002): six-only read-only per-vehicle interior map status with non-admitting fallback |
| 14 | 2026-10-23 14:56 UTC | [`a79e80f36`](https://github.com/interlinkglobal/GTD/commit/a79e80f366ddcecafcd5a0c696f7e0b1bacfe89c) | feat(VEH-INTERIOR-002): generate compact six-car runtime admission status from decoded source geometry |
| 15 | 2026-10-23 14:56 UTC | [`c1bcf4059`](https://github.com/interlinkglobal/GTD/commit/c1bcf4059f8a8421dde5e94f3a06d42f5713e2a0) | build(VEH-INTERIOR-002): offline Draco six-fleet geometry mapping as final prebuild stage |
| 16 | 2026-10-23 14:57 UTC | [`a28942296`](https://github.com/interlinkglobal/GTD/commit/a28942296dc6a4df8806477163c2c6fca5864caf) | feat(VEH-INTERIOR-002): attach build-time cabin evidence status to each of six parked vehicle actors |
| 17 | 2026-10-23 14:58 UTC | [`419cb1b2b`](https://github.com/interlinkglobal/GTD/commit/419cb1b2bd3c0c479a6764faa5e25decfe024fa3) | fix(VEH-INTERIOR-002): register required WebP and other glTF extensions for original fleet decoder |
| 18 | 2026-10-23 15:01 UTC | [`4c84f71e6`](https://github.com/interlinkglobal/GTD/commit/4c84f71e601322601330383696c6abfd0ff7d328) | feat(VEH-INTERIOR-002): expose six-source cabin evidence report without altering provisional seating |
| 19 | 2026-10-23 15:02 UTC | [`808bb00eb`](https://github.com/interlinkglobal/GTD/commit/808bb00ebe01ff992c31e609e8c3e0ee4deb7b56) | test(VEH-INTERIOR-002): exact six active vehicle map statuses, no retired imports, fail-closed seating |
| 20 | 2026-10-23 15:04 UTC | [`e75fdc0a5`](https://github.com/interlinkglobal/GTD/commit/e75fdc0a53a6691f71bfcb9422aeb253ef46edeb) | feat(VEH-INTERIOR-002): inspect disconnected submeshes in merged Draco primitives without inventing seat semantics |
| 21 | 2026-10-23 15:04 UTC | [`cb268ef4a`](https://github.com/interlinkglobal/GTD/commit/cb268ef4acf2c7b71d7193d6063b85c1fa9d1f53) | feat(VEH-INTERIOR-002): discover disconnected real-geometry components for all six merged GLBs |
| 22 | 2026-10-23 15:05 UTC | [`9c83224f0`](https://github.com/interlinkglobal/GTD/commit/9c83224f03dffb03d7463db24ce383c3dfaa0e6a) | test(VEH-INTERIOR-002): disconnected merged-geometry component analysis and fail-closed invalid indices |
| 23 | 2026-10-23 15:07 UTC | [`8dc7ff1e9`](https://github.com/interlinkglobal/GTD/commit/8dc7ff1e9850c8febeb7bdc354f47c8c4319d964) | chore(VEH-INTERIOR-002): log real disconnected geometry evidence count for each of six models |
| 24 | 2026-10-23 15:08 UTC | [`d891629ba`](https://github.com/interlinkglobal/GTD/commit/d891629ba88a7310bccc08b64c42c3f31ac86667) | docs(VEH-INTERIOR-002): record six-car decoded geometry rollout, diagnostic wiring and remaining safe-seat blockers |
| 25 | 2026-10-23 15:11 UTC | [`629bd075d`](https://github.com/interlinkglobal/GTD/commit/629bd075dc8540678d3de5bc171021af38a0d11a) | fix(VEH-INTERIOR-002): weld coincident GLB seam vertices before component-region evidence |
| 26 | 2026-10-23 15:11 UTC | [`43bd0e9f5`](https://github.com/interlinkglobal/GTD/commit/43bd0e9f5c0fce0f948a5ddb4e34710f25c081ff) | test(VEH-INTERIOR-002): verify GLB seam vertex welding avoids false split components |
| 27 | 2026-10-23 15:12 UTC | [`97e9d2f65`](https://github.com/interlinkglobal/GTD/commit/97e9d2f65972f8cd98c148a7fa695f9622257f0a) | docs(VEH-INTERIOR-002): record false component fragmentation and geometric seam-welding correction |
| 28 | 2026-10-23 15:14 UTC | [`1cc9241fd`](https://github.com/interlinkglobal/GTD/commit/1cc9241fd51a7b080c21aca399bf080f3b1ffd59) | docs(VEH-INTERIOR-002): record actual welded source-island counts and six-cabin admission blockers |
| 29 | 2026-10-23 15:35 UTC | [`9b8a43917`](https://github.com/interlinkglobal/GTD/commit/9b8a4391765ae91793a40b4abc9ced1076f32b75) | docs(VEH-INTERIOR-003): owner-authorized six-car provisional fit and feet/roof acceptance gate |
| 30 | 2026-10-23 15:37 UTC | [`ccd53243a`](https://github.com/interlinkglobal/GTD/commit/ccd53243a26b7276f0107a5c32c593548620dc6a) | feat(VEH-INTERIOR-003): unified six-vehicle provisional seat/footwell fitting and roof-vs-shoe diagnostics |
| 31 | 2026-10-23 15:38 UTC | [`7d7e1225a`](https://github.com/interlinkglobal/GTD/commit/7d7e1225a9211d5b4c23b8aef570e3611b40e951) | fix(VEH-INTERIOR-003): preserve shoe floor-clearance hip bound through provisional low-roof clamps |
| 32 | 2026-10-23 15:38 UTC | [`fe069bcad`](https://github.com/interlinkglobal/GTD/commit/fe069bcadb5195668fb2f542010e904366e8039d) | feat(VEH-INTERIOR-003): explicit only-six fleet ID mapping; Ferrari and Buggy excluded |
| 33 | 2026-10-23 15:38 UTC | [`87637399f`](https://github.com/interlinkglobal/GTD/commit/87637399fe0a85da73c52ccc79b6f0bbd2f196bf) | feat(VEH-INTERIOR-003): wire six-car provisional driver/passenger placement and live fit diagnostics |
| 34 | 2026-10-23 15:39 UTC | [`3f6c4f7fc`](https://github.com/interlinkglobal/GTD/commit/3f6c4f7fca558003284df35d8de159137c32aa0a) | test(VEH-INTERIOR-003): six original drivers, heel/floor bounds, seat yaw, BMW handedness, low-roof conflicts |
| 35 | 2026-10-23 15:42 UTC | [`84be5fc49`](https://github.com/interlinkglobal/GTD/commit/84be5fc494cf3fa85076dabf3cb9a981293f5a81) | feat(VEH-INTERIOR-003): read-only accepted rig left/right ankle geometry witness |
| 36 | 2026-10-23 15:42 UTC | [`4c8b550b1`](https://github.com/interlinkglobal/GTD/commit/4c8b550b1845bcbb731b9dadc27b76124325ed22) | feat(VEH-INTERIOR-003): after real seated IK use ankle witnesses to lift soles above provisional floor |
| 37 | 2026-10-23 15:43 UTC | [`385a9c7a7`](https://github.com/interlinkglobal/GTD/commit/385a9c7a7d3daa8692c48216031ea91c7ce3934c) | test(VEH-INTERIOR-003): assert real glb post-IK left/right ankle witnesses for vehicle sole lift |
| 38 | 2026-10-23 15:44 UTC | [`fdce77eb9`](https://github.com/interlinkglobal/GTD/commit/fdce77eb93bd47fff6defcb3970db4d0f40c0ad5) | docs(VEH-INTERIOR-003): document six-car candidate coordinates, actual ankle recovery and unresolved low-roof warnings |
| 39 | 2026-10-23 16:10 UTC | [`a20dce040`](https://github.com/interlinkglobal/GTD/commit/a20dce040283b263bef131dfa5b35a9724dee9f6) | docs(VEH-INTERIOR-004): diagnose BMW elevated hip and adopt working UAL seat anchors as reference |
| 40 | 2026-10-23 16:12 UTC | [`6c93843ff`](https://github.com/interlinkglobal/GTD/commit/6c93843ffa2d860f77f106d4bac982b93f337b24) | feat(VEH-INTERIOR-004): reuse established UAL seat anchors for six car human hip placement |
| 41 | 2026-10-23 16:12 UTC | [`51424198a`](https://github.com/interlinkglobal/GTD/commit/51424198ab2ac086a7d8f6d3a7606cbd1ddb26be) | feat(VEH-INTERIOR-004): place playable human using UAL anchor reference in all six vehicles |
| 42 | 2026-10-23 16:13 UTC | [`2de48c182`](https://github.com/interlinkglobal/GTD/commit/2de48c182164c94c42b00842f79f4cf1adcb2da5) | test(VEH-INTERIOR-004): six exact UAL seat lanes, lowered BMW pelvis and bounded initial sole clearance |
| 43 | 2026-10-23 16:13 UTC | [`12c529642`](https://github.com/interlinkglobal/GTD/commit/12c529642c6f559430d4df3d0fd6e3822c6026cf) | test(VEH-INTERIOR-004): check horizontal seat separation in rotated vehicle frame |
| 44 | 2026-10-23 16:13 UTC | [`94b23d613`](https://github.com/interlinkglobal/GTD/commit/94b23d6131ae2be6c1455b6322135ce0ce78e237) | test(VEH-INTERIOR-004): measure actual CHAR-130 head and shoe-offset witnesses for UAL seat calibration |
| 45 | 2026-10-23 16:19 UTC | [`9fedcc0ae`](https://github.com/interlinkglobal/GTD/commit/9fedcc0aed4d047c4134e3f09b990288588a62b5) | feat(VEH-INTERIOR-004): bound UAL-based pelvis by actual head rise and plan compact in-car calf clearance |
| 46 | 2026-10-23 16:20 UTC | [`32d7a4dc9`](https://github.com/interlinkglobal/GTD/commit/32d7a4dc9dbce9788302138ef3dc9339b1fc0a6e) | feat(VEH-INTERIOR-004): keep seated thighs but fold calves only in low-footwell cars |
| 47 | 2026-10-23 16:21 UTC | [`f03bce4d6`](https://github.com/interlinkglobal/GTD/commit/f03bce4d60c3e4724b0d9528d08210b85a1efcad) | feat(VEH-INTERIOR-004): prevent duplicate roof/hip lift and apply cabin-only calf clearance to Voight |
| 48 | 2026-10-23 16:21 UTC | [`a9ab790d9`](https://github.com/interlinkglobal/GTD/commit/a9ab790d9235f28dad5cad9c9ec4970e3d96f445) | test(VEH-INTERIOR-004): expect actual ~2cm projected sole clearance after bounded calf fit |
| 49 | 2026-10-23 16:21 UTC | [`367755c73`](https://github.com/interlinkglobal/GTD/commit/367755c7363b89fd30e7274c2fe9387fe53109b2) | test(VEH-INTERIOR-004): actual 73-joint GLB folds calves inside cabin while preserving head/hips and free seat |
| 50 | 2026-10-23 16:22 UTC | [`c06c7a9ba`](https://github.com/interlinkglobal/GTD/commit/c06c7a9ba450d90ed03ee99bb97c650ea6179277) | docs(VEH-INTERIOR-004): measured seated 73-joint envelope and vehicle-only compact calf fit algorithm |
| 51 | 2026-10-23 20:02 UTC | [`f441c6aac`](https://github.com/interlinkglobal/GTD/commit/f441c6aacd8bc367eafe0c81b07073b58b935419) | docs(VEH-INTERIOR-005): define universal hard negative constraints and proof-backed seated fit solver |
| 52 | 2026-10-23 20:04 UTC | [`ed95c13de`](https://github.com/interlinkglobal/GTD/commit/ed95c13de7f1967f1f56afda0085e54eb23dfc69) | docs(VEH-INTERIOR-005): formulate universal forbidden-state seat feasibility and collision constraints |
| 53 | 2026-10-23 20:38 UTC | [`7bbcfa45b`](https://github.com/interlinkglobal/GTD/commit/7bbcfa45bdedb6f1701a1604cf111ed465cff427) | feat(VEH-INTERIOR-005): pure universal hard collision and feasible pelvis interval solver |
| 54 | 2026-10-23 20:39 UTC | [`55c79f3ce`](https://github.com/interlinkglobal/GTD/commit/55c79f3cef89dd24fba49fc4fdbf6d2c33304c69) | feat(VEH-INTERIOR-005): apply analytic roof-floor solver to all six UAL-seated vehicle fits |
| 55 | 2026-10-23 20:39 UTC | [`e301cfe94`](https://github.com/interlinkglobal/GTD/commit/e301cfe94776e46e8171fae7486d8aa482ef6f13) | fix(VEH-INTERIOR-005): forbid verified verdict without skinned collision witnesses |
| 56 | 2026-10-23 20:39 UTC | [`1ce7ada7b`](https://github.com/interlinkglobal/GTD/commit/1ce7ada7b01c42461f70ae67eda1b3fffca573c5) | fix(VEH-INTERIOR-005): prohibit post-IK foot lift from breaching roof clearance |
| 57 | 2026-10-23 20:40 UTC | [`8efee0f11`](https://github.com/interlinkglobal/GTD/commit/8efee0f112c2902134329292bbae526d2f3cf166) | test(VEH-INTERIOR-005): reject glass, roof, floor, wrong seat and verify all six constraint integrations |
| 58 | 2026-10-23 20:40 UTC | [`19af46196`](https://github.com/interlinkglobal/GTD/commit/19af46196d0887f16daa9a2af8b9b31896856db4) | test(VEH-INTERIOR-005): exercise feasible tight-roof interval requiring calf flex |
| 59 | 2026-10-23 20:40 UTC | [`e03a6940b`](https://github.com/interlinkglobal/GTD/commit/e03a6940b56f4444686341c1cb1eeb4b961261e7) | docs(VEH-INTERIOR-005): record applied interval solver and evidence-limited six-fleet integration |
| 60 | 2026-10-24 07:34 UTC | [`2661dcbae`](https://github.com/interlinkglobal/GTD/commit/2661dcbae322d66470cbf45cffd558a1d0b5b144) | docs(VEH-SEAT-CAL-001): six independent driver calibration targets and non-regression gates |
| 61 | 2026-10-24 07:35 UTC | [`dc6f818e7`](https://github.com/interlinkglobal/GTD/commit/dc6f818e7165bdf6ffeacf643eee0702bca51ad4) | feat(VEH-SEAT-CAL-001): six independent curated driver seats, steering lanes, heights and leg clearances |
| 62 | 2026-10-24 07:35 UTC | [`2704471cb`](https://github.com/interlinkglobal/GTD/commit/2704471cbeb30570dc2f896b3dfcd1364d225c87) | feat(VEH-SEAT-CAL-001): car-only ankle and forward-hand pose tuning, preserve standalone CHAR-130 |
| 63 | 2026-10-24 07:36 UTC | [`1d310f0b5`](https://github.com/interlinkglobal/GTD/commit/1d310f0b5be73448629685fd92bb5dfc198ce612) | feat(VEH-SEAT-CAL-001): protect curated pelvis from dynamic re-clamping and lift shoes independently |
| 64 | 2026-10-24 07:36 UTC | [`bf8a9f1f6`](https://github.com/interlinkglobal/GTD/commit/bf8a9f1f6ff7e86523a63bc72b995f18e82bf3d2) | feat(VEH-SEAT-CAL-001): six curated driver profiles in live boarding and diagnostics |
| 65 | 2026-10-24 07:37 UTC | [`744f0105a`](https://github.com/interlinkglobal/GTD/commit/744f0105afa2729260e834403f2fa83cc4b6aac0) | test(VEH-SEAT-CAL-001): all six independent lanes/yaws/heights and foot fit corrections |
| 66 | 2026-10-24 07:43 UTC | [`8adb0d0d2`](https://github.com/interlinkglobal/GTD/commit/8adb0d0d2e808e17e763125aaf18ae76eb29cf60) | test(VEH-SEAT-CAL-001): assert intentionally pending visual acceptance instead of contradicting fit warnings |
| 67 | 2026-10-24 08:16 UTC | [`ea08b4e8b`](https://github.com/interlinkglobal/GTD/commit/ea08b4e8b3ea215d47fe95256a17534fb90c220a) | test(VEH-SEAT-CAL-001): validate all six calibrated lanes at four headings and reject bad parameters |
| 68 | 2026-10-24 08:29 UTC | [`d4cf306d0`](https://github.com/interlinkglobal/GTD/commit/d4cf306d015a21e508c78a8e1ffe38f8e4d9cdc6) | test(VEH-SEAT-CAL-001): all six curated driver profiles, yaw invariance and isolation |

**Final engineering conclusion:** This is a failed **vehicle-specific integration** effort, not a failure of the standalone seated animation. A new workstream may be authorized later with real per-car interior/witness geometry and live visual calibration. No unaccepted VEH-INTERIOR-001..005 / VEH-SEAT-CAL-001 code is entitled to promotion.
