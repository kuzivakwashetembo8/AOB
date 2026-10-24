# GTD — Procedure DDD-001: Decommission Failed Universal / Curated Six-Vehicle Seating
**Date:** 24 October 2026 (Africa/Johannesburg)  
**Decision:** **REJECTED by owner; no further implementation; do not merge.**  
**Rejected branch:** `feat/veh-interior-001-cabin-mapper-20261023`  
**Rejected pull request:** [#49](https://github.com/interlinkglobal/GTD/pull/49), draft against `feat/char-126-human-vehicle-seating-20261023`, **never merged**.  
**Rejected tested tip:** [`d4cf306d015a21e508c78a8e1ffe38f8e4d9cdc6`](https://github.com/interlinkglobal/GTD/commit/d4cf306d015a21e508c78a8e1ffe38f8e4d9cdc6).  
**Branch creation/base:** accepted seated-animation feature branch `feat/char-126-human-vehicle-seating-20261023` at `d48b735aa3f2c5fab733f0de6d354c9beaf0eda5`.  
**Recorded scope:** 68 experimental commits, 36 PR-changed files (including 10 technical documents).  
**Production policy:** Ferrari and Buggy are excluded. **Do not undo or alter their exclusion.**

## 1. Purpose of the decommissioned branch

The owner had accepted Voight's **independent** CHAR-130 seated pose (upright torso, horizontally extended thighs, downward-bent shins, naturally separated forward hands). The *remaining separate problem* was placing that pose **inside the real driver cabin** of six already imported 3D cars: Range Rover Sport 2018, Toyota Hilux 002, Land Rover Defender 001, Dodge HP, BMW M4, Lamborghini Temerario.

This branch attempted (a) generic GLB interior mapping; (b) first-fit coordinates in all six; (c) copying the historically better-looking `ual.glb` driver-seat root anchors; (d) universal negative-collision/height equations; and finally (e) **manually curated per-model placement numbers** applied simultaneously in one preview. Despite extensive passing unit tests and a built preview, the final owner visual checkpoint failed. This is a **complete failure of practical vehicle seating acceptance**, not merely an incomplete minor refinement.

**Scope boundary:** Reject all branch-only VEH-INTERIOR-001–005 and VEH-SEAT-CAL-001 *code/placement* changes. Do **not** revert or decommission the separately accepted CHAR-130 anatomical seated animation, gait/sprint/flying features, vehicle wheel turning, or active fleet GLBs. PR #48 remains independent and was not merged into main by this experiment.

## 2. Reproducible visual defect register

The owner provided multiple screenshots and repeatedly rejected the in-car fit. The known failure patterns before the last six-model curated preview:

| Vehicle | Observed unresolved defect | Violated acceptance |
|---|---|---|
| Range Rover | Head/face and hands protrude through windshield | Head, torso and hands must remain within actual glass/dashboard boundaries and against driver backrest |
| Toyota Hilux | More contained than peers, but exact hip/back contact and footwell not established | No unverified car can be marked accepted merely because a single camera view looks plausible |
| Defender | Character appears on passenger side; majority of torso/hands intrude through windshield; feet below cabin floor | Steering-side assignment, backrest alignment, glass and floor containment all fail |
| Dodge HP | Feet/shoes visible beneath the chassis | Shins, toes and skinned soles must remain above actual floor/underbody |
| BMW M4 | Head above roof in one trial; lower-leg/shoe protrusion beneath sill in subsequent trial | Both roof/headroom and footwell fit must hold simultaneously |
| Lamborghini Temerario | Wrong front seat and head/upper body above low roof; lower-body positioning questionable | True driver-side assignment, roof clearance and footwell constraints fail |

**Final verdict:** The owner explicitly rejected the [VEH-SEAT-CAL-001 preview](https://gtd-quyv2n31a-interlinkglobaltech.vercel.app/game?gtdChar126=1) on 2026-10-24. No evidence establishes that any of the six passed a complete front/side/underbody **visual acceptance** gate. Earlier screenshots cannot be represented as observations of the *final* preview where no new images were supplied; the owner's final "Failed" verdict is the authoritative rejection.

## 3. Full approach and attempt history

### Attempt A — VEH-INTERIOR-001: evidence-first generic mapper
- Documentation, versioned vehicle-local coordinate contract, potential seats, roof, floor, glass, driver/front passenger/back rows, footwells, cache and admission states; no unseen seat was allowed to become "verified".
- Build-time G1 GLB audit scanned all six actual source binaries. Index accessor triangle counts: Rover **523,384**; Hilux **49,912**; Defender **50,142**; Dodge **646,834**; BMW **206,593**; Lamborghini **563,025** — **2,039,890** total. Each required Draco decode. Under the source-name classifier, **none** had a separately named seat/backrest/steering component; this is **not proof such geometry is absent**.
- Implemented read-only Babylon original-triangle transformation/sampling for witnessed floor and roof, with unknown/collapsed returns and synthetic NullEngine tests. **Actual verified cabins were not discovered.**
- Outcome: defensible survey but no real driver anchors or cabin collision constraints.

### Attempt B — VEH-INTERIOR-002: decode real GLBs and classify connected parts
- Sequential offline Draco decode and source-hash/orientation/component reports across the six imported models; generated runtime *diagnostic-only* status and attached it to imported parked instances. No performance-heavy per-frame scan.
- Discovered that index-only topology gave a nonsensical **193,579 disconnected components for BMW** with 206,593 triangles; authoring seams and duplicated coordinates fragmented connected geometry. Introduced tolerance-bounded weld of *analysis indices*; did not alter GLB meshes.
- Corrected welded geometric island counts: Rover **490**; Hilux **1**; Defender **6**; Dodge **1**; BMW **2,416**; Lamborghini **1,386**.
- Outcome: source triangles/islands available, but islands do not identify seats, cushions, roof, footwell, windshield, steering rim or actual usable cabin. All six correctly remained `needs-review`. No auto seating solution.

### Attempt C — VEH-INTERIOR-003: provisional six-fleet physical fit by car dimensions
- `six-fleet-driver-fit-003.ts` computed generic local x/y/z target from fitted exterior dimensions, forward thighs/downward calves and minimum hip height; `gtd-runtime.ts` boarded humans using it. Actual linked ankle positions from post-IK checked for probable shoe penetration, with a root upward lift bounded by guessed floor/roof.
- Example predicted BMW minimum hip ~**0.995 m**, Lamborghini ~**0.952 m** above car anchor, despite low roofs. These estimates produced explicit roof conflicts and failed to certify backrest contact.
- Defect: pushing pelvis high enough for estimated sole clearance made heads/upper torsos penetrate roof/glass; lowering it moved shoes beneath bodywork. A post-IK whole-character lift could violate headroom. Owner screenshots rejected the resulting in-car fit.
- Outcome: diagnostic candidate coordinates, not verified sitting.

### Attempt D — VEH-INTERIOR-004: copy accepted `ual.glb` driver-seat placement
- Reused `rangeRoverDriverSeatWorldPose` and `coupeDriverSeatWorldPose` from the existing older humanoid pipeline; normalized UAL **actor-root** reference shifted to proposed human **pelvis joint** location. Preserved the previously accepted free-standing CHAR-130 pose.
- Recognized a root-to-hip frame mismatch and removed duplicate roof-drop/floor-raise cycles. Measured the linked real 73-joint character: **head joint +0.673369 m above pelvis; ankle joint -0.442437 m below pelvis; additional 0.115 m shoe reserve only an assumption**.
- Added bounded in-car shin/calf bending and roof-restricted residual foot lift. Tests passed, but visual trials still showed windshield/roof/underbody intrusion and wrong driver lanes. Reusing UAL driver anchors did **not** guarantee `character.glb` fits, because UAL root offsets, mesh envelopes and pose differ.
- Outcome: useful anthropometric evidence, still no acceptance.

### Attempt E — VEH-INTERIOR-005: universal negative-constraint equation
- Formalized an evidence-first hard-constraint solver with signed forbidden-surface distances, driver-role/steering-side check, seat support and cabin membership. Analytical vertical pelvis interval:
  `F + soleDrop - calfFlex + floorMargin <= pelvisY <= R - headRise - roofMargin`.
- Added pure `vehicle-seat-constraints-005.ts`, 0–0.22 m bounded calf flex and minimized deviation from the UAL prior, integrated into six-car placement with explicit `FIT_UNVERIFIED` status when surfaces were unknown. Post-IK lift bounded by nominal roof.
- **Why visibly ineffective:** six-fleet actual `F` and `R` were still calculated from **EXTERIOR height fractions**, while glass, underbody, real sole mesh, backrest, cabin membership and steering-side signed distances remained unknown/null. The equation could optimize numbers but could not locate true physical cabin constraints; mathematical tests correctly passed synthetic data while the rendered vehicles remained wrong. Owner stated the equation produced no meaningful difference.
- Outcome: mathematically defined rejection logic, operationally inadequate real-scene inputs; rejected for this goal.

### Attempt F — VEH-SEAT-CAL-001: six hard-coded curated seat profiles
- Following explicit agreement that one universal pose engine could have **independent** parameters per GLB, the branch defined six distinct profiles in `vehicle-seat-profiles-006.ts`: front-seat lateral side, longitudinal offset, fixed hip Y, car-only foot lift, forward hand retraction and yaw.
- Range Rover/Toyota: seat back/down; Defender/Lamborghini: opposite lane + back/down; Dodge/BMW: calf and ankle lift. `human-seat-pose-126.ts` applied corrections only during in-car sitting, retaining free-space CHAR-130. `mercer-static-character-103.ts` stopped generic hip clamps and duplicated foot lifts from overwriting curated numbers. `gtd-runtime.ts` switched driver role to the six profiles; Ferrari/Buggy stayed excluded.
- Bundled **all six** in a **single** Vercel deployment to conserve the deployment quota. Preview from rejected commit `d4cf306`: `https://gtd-quyv2n31a-interlinkglobaltech.vercel.app/game?gtdChar126=1`.
- Verification was real but narrower than desired: **552 automated tests across 124 files passed**; deployment READY; unit tests checked transforms, side signs, parameter limits, isolation, anatomy regressions. **They did not establish visible skinned-body/cabin contact on any of six GLBs.** Owner explicitly rejected final preview.
- Outcome: initial 6-profile implementation rejected. Do not promote even one profile on the basis of passing code tests.

## 4. Failure analysis: confirmed vs inferred

**Confirmed design/evidence defects**
1. All six built source GLBs lacked an automatically verified seat/backrest/driver steering anchor. Neither name parsing nor connected-component counts establishes an interior.
2. The code repeatedly substituted fitted **exterior dimensions** for actual interior floor, headliner, windshield, glass and footwell triangles. Those are not equivalent physical bounds.
3. Multiple coordinate conventions were mixed across source GLB, normalized car anchor, UAL actor root, and the human hip joint; shifting root was not a measured seat-back alignment.
4. Actual 3D **skinned head/hair, hand, sole, toe, torso** intersections with real cabin triangles were not checked as the six-car release gate. Linked-bone tests and synthetic geometry tests only demonstrated the math and transforms.
5. Source-specific driver handedness was sometimes inherited from nominal template assumptions rather than directly observed wheel/seat relationship. The owner observed incorrect seats in Defender and Lamborghini.
6. One set of layer corrections (generic minimum hip, roof cap, residual root lift, car-only calf IK, per-model shift) could undo another or trade roof penetration for underfloor penetration. Curated profiles removed some double-clamps but still did not prove fit.
7. Six-car previews were called "READY" after build/test success; **READY meant deployment health, never cabin-fit acceptance**. User visual verification failed.

**Likely contributors, not yet proven root causes:** GLB surface omissions, model orientation/scale peculiarities, incorrect specific anchor offsets, glass transparency or model-normal/triangle-winding limitations. Without a verified interior and mesh-intersection witness, do not assert a single definitive line-level root cause.

**Root organizational failure:** The project repeatedly built placement *hypotheses* before having a trustworthy means to reject a physically impossible seat in a real imported cabin. Visual-feedback iteration could not be made robust using pose-relative heuristics alone.

## 5. Isolation / preservation rules

- **Do not merge PR #49** and do not selectively cherry-pick its seating scripts, source GLB mapping modules, `package.json` build hooks, generated status, runtime changes, tests, or guesses into `main`.
- **Do not merge the failed branch back into PR #48**. The separately accepted seated-character anatomy (CHAR-130), as well as walking, running, sprinting, flying, and vehicle physics, remain out of this DDD scope.
- The **six existing vehicle GLBs** remain in their pre-existing game state; no Ferrari or Buggy production reactivation.
- Retain the learnings and full commit-history appendix here as the forensic record. Historic candidate code can remain accessible only by immutable commit SHA / closed PR audit history; it is **not approved reuse**.
- Do not claim that closing PR or marking a branch abandoned is equivalent to deleting it. Ref deletion must be verified separately.

## 6. What a future independent solution must require (non-authorizing)

No new vehicle seating development is authorized by this report. A future proposal should first identify whether real cabin interior surfaces exist or whether a one-time explicit authored sidecar is necessary. Validate steering-side identity, cushion/backrest anchors, actual full-body skinned collision against windshield/roof/glass/footwell, **per-vehicle visual gates** for the six, and simultaneous all-six preview iteration without consuming one deployment per vehicle. Passing synthetic/joint-space unit tests may not substitute for owner-visible acceptance. Protect CHAR-130 and any accepted car-specific achievements from regressions.

## 7. Historical 68-commit audit trail — rejected branch only

The following titles and immutable SHAs are returned by the GitHub PR #49 commit log in chronological order; they cover every distinct branch commit rather than only selected successful-looking checkpoints.

01. [`5f0482917003`](https://github.com/interlinkglobal/GTD/commit/5f048291700383fe4f30897bb2d2879d5f40888d) — docs(VEH-INTERIOR-001): design source-backed universal cabin mapping before occupant placement
02. [`17e95bcf1507`](https://github.com/interlinkglobal/GTD/commit/17e95bcf150732f02e81f8e99fb62f92025a9c4b) — docs(VEH-INTERIOR-001): correct character component integration reference
03. [`98bd6cb1f668`](https://github.com/interlinkglobal/GTD/commit/98bd6cb1f668ca9f767a743db4bf488b78638964) — feat(VEH-INTERIOR-001 G1): read-only six-GLB metadata audit with truthful unknown cabin admission
04. [`e1662e8f4c62`](https://github.com/interlinkglobal/GTD/commit/e1662e8f4c62ba78687a4bcaeaa30766fcaa1ae8) — build(VEH-INTERIOR-001): produce factual source audit before Vite without scanning at game startup
05. [`9b89341ca0a7`](https://github.com/interlinkglobal/GTD/commit/9b89341ca0a7d619c3edd483dfa87ce13a15f65f) — test(VEH-INTERIOR-001 G1): merged meshes, named hints and unknown-seat fail-closed semantics
06. [`2295829bda59`](https://github.com/interlinkglobal/GTD/commit/2295829bda5905a35b35e858e0231ee24bfecc1f) — docs(VEH-INTERIOR-001 G1): actual all-six GLB structural findings, exclusions and G2 boundary
07. [`ce395dc300ad`](https://github.com/interlinkglobal/GTD/commit/ce395dc300adf2da1aabcc07920401254cab832f) — feat(VEH-INTERIOR-001 G2): conservative car-local floor/roof triangle sampler with fail-closed evidence
08. [`98cc374f622d`](https://github.com/interlinkglobal/GTD/commit/98cc374f622d0079b7d1652a9599ab02767ccdc8) — test(VEH-INTERIOR-001 G2): tested car-local real floor/roof sampling and fail-closed absence
09. [`1da1bbd78f78`](https://github.com/interlinkglobal/GTD/commit/1da1bbd78f78dcbd1a8f337594f9ff7886cef3ee) — docs(VEH-INTERIOR-001 G2): record read-only triangle sampler and prerequisites for calibrated overlay
10. [`d8b031827473`](https://github.com/interlinkglobal/GTD/commit/d8b0318274733bf10a66899bfefda20286862838) — docs(VEH-INTERIOR-002): lock six-car-first scope, exclude Ferrari/Buggy, define truthful admission
11. [`6e44af87407c`](https://github.com/interlinkglobal/GTD/commit/6e44af87407c80858ad21e275f2c692e85c1635b) — feat(VEH-INTERIOR-002): decode source Draco geometry for all six with deterministic non-admitting evidence reports
12. [`fd50c54cd34b`](https://github.com/interlinkglobal/GTD/commit/fd50c54cd34b8de9891479f0ca8978b2465d683b) — test(VEH-INTERIOR-002): six-only decoded geometry, orientation correction, no false cabin admission
13. [`24e5588c885b`](https://github.com/interlinkglobal/GTD/commit/24e5588c885b8ad2479646d8750d5b0611e49b80) — feat(VEH-INTERIOR-002): six-only read-only per-vehicle interior map status with non-admitting fallback
14. [`a79e80f366dd`](https://github.com/interlinkglobal/GTD/commit/a79e80f366ddcecafcd5a0c696f7e0b1bacfe89c) — feat(VEH-INTERIOR-002): generate compact six-car runtime admission status from decoded source geometry
15. [`c1bcf4059f8a`](https://github.com/interlinkglobal/GTD/commit/c1bcf4059f8a8421dde5e94f3a06d42f5713e2a0) — build(VEH-INTERIOR-002): offline Draco six-fleet geometry mapping as final prebuild stage
16. [`a28942296dc6`](https://github.com/interlinkglobal/GTD/commit/a28942296dc6a4df8806477163c2c6fca5864caf) — feat(VEH-INTERIOR-002): attach build-time cabin evidence status to each of six parked vehicle actors
17. [`419cb1b2bd3c`](https://github.com/interlinkglobal/GTD/commit/419cb1b2bd3c0c479a6764faa5e25decfe024fa3) — fix(VEH-INTERIOR-002): register required WebP and other glTF extensions for original fleet decoder
18. [`4c84f71e6013`](https://github.com/interlinkglobal/GTD/commit/4c84f71e601322601330383696c6abfd0ff7d328) — feat(VEH-INTERIOR-002): expose six-source cabin evidence report without altering provisional seating
19. [`808bb00ebe01`](https://github.com/interlinkglobal/GTD/commit/808bb00ebe01ff992c31e609e8c3e0ee4deb7b56) — test(VEH-INTERIOR-002): exact six active vehicle map statuses, no retired imports, fail-closed seating
20. [`e75fdc0a53a6`](https://github.com/interlinkglobal/GTD/commit/e75fdc0a53a6691f71bfcb9422aeb253ef46edeb) — feat(VEH-INTERIOR-002): inspect disconnected submeshes in merged Draco primitives without inventing seat semantics
21. [`cb268ef4acf2`](https://github.com/interlinkglobal/GTD/commit/cb268ef4acf2c7b71d7193d6063b85c1fa9d1f53) — feat(VEH-INTERIOR-002): discover disconnected real-geometry components for all six merged GLBs
22. [`9c83224f03df`](https://github.com/interlinkglobal/GTD/commit/9c83224f03dffb03d7463db24ce383c3dfaa0e6a) — test(VEH-INTERIOR-002): disconnected merged-geometry component analysis and fail-closed invalid indices
23. [`8dc7ff1e9850`](https://github.com/interlinkglobal/GTD/commit/8dc7ff1e9850c8febeb7bdc354f47c8c4319d964) — chore(VEH-INTERIOR-002): log real disconnected geometry evidence count for each of six models
24. [`d891629ba88a`](https://github.com/interlinkglobal/GTD/commit/d891629ba88a7310bccc08b64c42c3f31ac86667) — docs(VEH-INTERIOR-002): record six-car decoded geometry rollout, diagnostic wiring and remaining safe-seat blockers
25. [`629bd075dc85`](https://github.com/interlinkglobal/GTD/commit/629bd075dc8540678d3de5bc171021af38a0d11a) — fix(VEH-INTERIOR-002): weld coincident GLB seam vertices before component-region evidence
26. [`43bd0e9f5c0f`](https://github.com/interlinkglobal/GTD/commit/43bd0e9f5c0fce0f948a5ddb4e34710f25c081ff) — test(VEH-INTERIOR-002): verify GLB seam vertex welding avoids false split components
27. [`97e9d2f65972`](https://github.com/interlinkglobal/GTD/commit/97e9d2f65972f8cd98c148a7fa695f9622257f0a) — docs(VEH-INTERIOR-002): record false component fragmentation and geometric seam-welding correction
28. [`1cc9241fd51a`](https://github.com/interlinkglobal/GTD/commit/1cc9241fd51a7b080c21aca399bf080f3b1ffd59) — docs(VEH-INTERIOR-002): record actual welded source-island counts and six-cabin admission blockers
29. [`9b8a4391765a`](https://github.com/interlinkglobal/GTD/commit/9b8a4391765ae91793a40b4abc9ced1076f32b75) — docs(VEH-INTERIOR-003): owner-authorized six-car provisional fit and feet/roof acceptance gate
30. [`ccd53243a26b`](https://github.com/interlinkglobal/GTD/commit/ccd53243a26b7276f0107a5c32c593548620dc6a) — feat(VEH-INTERIOR-003): unified six-vehicle provisional seat/footwell fitting and roof-vs-shoe diagnostics
31. [`7d7e1225a921`](https://github.com/interlinkglobal/GTD/commit/7d7e1225a9211d5b4c23b8aef570e3611b40e951) — fix(VEH-INTERIOR-003): preserve shoe floor-clearance hip bound through provisional low-roof clamps
32. [`fe069bcadb51`](https://github.com/interlinkglobal/GTD/commit/fe069bcadb5195668fb2f542010e904366e8039d) — feat(VEH-INTERIOR-003): explicit only-six fleet ID mapping; Ferrari and Buggy excluded
33. [`87637399fe0a`](https://github.com/interlinkglobal/GTD/commit/87637399fe0a85da73c52ccc79b6f0bbd2f196bf) — feat(VEH-INTERIOR-003): wire six-car provisional driver/passenger placement and live fit diagnostics
34. [`3f6c4f7fca55`](https://github.com/interlinkglobal/GTD/commit/3f6c4f7fca558003284df35d8de159137c32aa0a) — test(VEH-INTERIOR-003): six original drivers, heel/floor bounds, seat yaw, BMW handedness, low-roof conflicts
35. [`84be5fc494cf`](https://github.com/interlinkglobal/GTD/commit/84be5fc494cf3fa85076dabf3cb9a981293f5a81) — feat(VEH-INTERIOR-003): read-only accepted rig left/right ankle geometry witness
36. [`4c8b550b1845`](https://github.com/interlinkglobal/GTD/commit/4c8b550b1845bcbb731b9dadc27b76124325ed22) — feat(VEH-INTERIOR-003): after real seated IK use ankle witnesses to lift soles above provisional floor
37. [`385a9c7a7d3d`](https://github.com/interlinkglobal/GTD/commit/385a9c7a7d3daa8692c48216031ea91c7ce3934c) — test(VEH-INTERIOR-003): assert real glb post-IK left/right ankle witnesses for vehicle sole lift
38. [`fdce77eb93bd`](https://github.com/interlinkglobal/GTD/commit/fdce77eb93bd47fff6defcb3970db4d0f40c0ad5) — docs(VEH-INTERIOR-003): document six-car candidate coordinates, actual ankle recovery and unresolved low-roof warnings
39. [`a20dce040283`](https://github.com/interlinkglobal/GTD/commit/a20dce040283b263bef131dfa5b35a9724dee9f6) — docs(VEH-INTERIOR-004): diagnose BMW elevated hip and adopt working UAL seat anchors as reference
40. [`6c93843ffa2d`](https://github.com/interlinkglobal/GTD/commit/6c93843ffa2d860f77f106d4bac982b93f337b24) — feat(VEH-INTERIOR-004): reuse established UAL seat anchors for six car human hip placement
41. [`51424198ab2a`](https://github.com/interlinkglobal/GTD/commit/51424198ab2ac086a7d8f6d3a7606cbd1ddb26be) — feat(VEH-INTERIOR-004): place playable human using UAL anchor reference in all six vehicles
42. [`2de48c182164`](https://github.com/interlinkglobal/GTD/commit/2de48c182164c94c42b00842f79f4cf1adcb2da5) — test(VEH-INTERIOR-004): six exact UAL seat lanes, lowered BMW pelvis and bounded initial sole clearance
43. [`12c529642c6f`](https://github.com/interlinkglobal/GTD/commit/12c529642c6f559430d4df3d0fd6e3822c6026cf) — test(VEH-INTERIOR-004): check horizontal seat separation in rotated vehicle frame
44. [`94b23d6131ae`](https://github.com/interlinkglobal/GTD/commit/94b23d6131ae2be6c1455b6322135ce0ce78e237) — test(VEH-INTERIOR-004): measure actual CHAR-130 head and shoe-offset witnesses for UAL seat calibration
45. [`9fedcc0aed4d`](https://github.com/interlinkglobal/GTD/commit/9fedcc0aed4d047c4134e3f09b990288588a62b5) — feat(VEH-INTERIOR-004): bound UAL-based pelvis by actual head rise and plan compact in-car calf clearance
46. [`32d7a4dc9dbc`](https://github.com/interlinkglobal/GTD/commit/32d7a4dc9dbce9788302138ef3dc9339b1fc0a6e) — feat(VEH-INTERIOR-004): keep seated thighs but fold calves only in low-footwell cars
47. [`f03bce4d60c3`](https://github.com/interlinkglobal/GTD/commit/f03bce4d60c3e4724b0d9528d08210b85a1efcad) — feat(VEH-INTERIOR-004): prevent duplicate roof/hip lift and apply cabin-only calf clearance to Voight
48. [`a9ab790d9235`](https://github.com/interlinkglobal/GTD/commit/a9ab790d9235f28dad5cad9c9ec4970e3d96f445) — test(VEH-INTERIOR-004): expect actual ~2cm projected sole clearance after bounded calf fit
49. [`367755c7363b`](https://github.com/interlinkglobal/GTD/commit/367755c7363b89fd30e7274c2fe9387fe53109b2) — test(VEH-INTERIOR-004): actual 73-joint GLB folds calves inside cabin while preserving head/hips and free seat
50. [`c06c7a9ba450`](https://github.com/interlinkglobal/GTD/commit/c06c7a9ba450d90ed03ee99bb97c650ea6179277) — docs(VEH-INTERIOR-004): measured seated 73-joint envelope and vehicle-only compact calf fit algorithm
51. [`f441c6aacd8b`](https://github.com/interlinkglobal/GTD/commit/f441c6aacd8bc367eafe0c81b07073b58b935419) — docs(VEH-INTERIOR-005): define universal hard negative constraints and proof-backed seated fit solver
52. [`ed95c13de7f1`](https://github.com/interlinkglobal/GTD/commit/ed95c13de7f1967f1f56afda0085e54eb23dfc69) — docs(VEH-INTERIOR-005): formulate universal forbidden-state seat feasibility and collision constraints
53. [`7bbcfa45bded`](https://github.com/interlinkglobal/GTD/commit/7bbcfa45bdedb6f1701a1604cf111ed465cff427) — feat(VEH-INTERIOR-005): pure universal hard collision and feasible pelvis interval solver
54. [`55c79f3cef89`](https://github.com/interlinkglobal/GTD/commit/55c79f3cef89dd24fba49fc4fdbf6d2c33304c69) — feat(VEH-INTERIOR-005): apply analytic roof-floor solver to all six UAL-seated vehicle fits
55. [`e301cfe94776`](https://github.com/interlinkglobal/GTD/commit/e301cfe94776e46e8171fae7486d8aa482ef6f13) — fix(VEH-INTERIOR-005): forbid verified verdict without skinned collision witnesses
56. [`1ce7ada7b01c`](https://github.com/interlinkglobal/GTD/commit/1ce7ada7b01c42461f70ae67eda1b3fffca573c5) — fix(VEH-INTERIOR-005): prohibit post-IK foot lift from breaching roof clearance
57. [`8efee0f112c2`](https://github.com/interlinkglobal/GTD/commit/8efee0f112c2902134329292bbae526d2f3cf166) — test(VEH-INTERIOR-005): reject glass, roof, floor, wrong seat and verify all six constraint integrations
58. [`19af46196d08`](https://github.com/interlinkglobal/GTD/commit/19af46196d0887f16daa9a2af8b9b31896856db4) — test(VEH-INTERIOR-005): exercise feasible tight-roof interval requiring calf flex
59. [`e03a6940b56f`](https://github.com/interlinkglobal/GTD/commit/e03a6940b56f4444686341c1cb1eeb4b961261e7) — docs(VEH-INTERIOR-005): record applied interval solver and evidence-limited six-fleet integration
60. [`2661dcbae322`](https://github.com/interlinkglobal/GTD/commit/2661dcbae322d66470cbf45cffd558a1d0b5b144) — docs(VEH-SEAT-CAL-001): six independent driver calibration targets and non-regression gates
61. [`dc6f818e7165`](https://github.com/interlinkglobal/GTD/commit/dc6f818e7165bdf6ffeacf643eee0702bca51ad4) — feat(VEH-SEAT-CAL-001): six independent curated driver seats, steering lanes, heights and leg clearances
62. [`2704471cbeb3`](https://github.com/interlinkglobal/GTD/commit/2704471cbeb30570dc2f896b3dfcd1364d225c87) — feat(VEH-SEAT-CAL-001): car-only ankle and forward-hand pose tuning, preserve standalone CHAR-130
63. [`1d310f0b5be7`](https://github.com/interlinkglobal/GTD/commit/1d310f0b5be73448629685fd92bb5dfc198ce612) — feat(VEH-SEAT-CAL-001): protect curated pelvis from dynamic re-clamping and lift shoes independently
64. [`bf8a9f1f6ff7`](https://github.com/interlinkglobal/GTD/commit/bf8a9f1f6ff7e86523a63bc72b995f18e82bf3d2) — feat(VEH-SEAT-CAL-001): six curated driver profiles in live boarding and diagnostics
65. [`744f0105afa2`](https://github.com/interlinkglobal/GTD/commit/744f0105afa2729260e834403f2fa83cc4b6aac0) — test(VEH-SEAT-CAL-001): all six independent lanes/yaws/heights and foot fit corrections
66. [`8adb0d0d2e80`](https://github.com/interlinkglobal/GTD/commit/8adb0d0d2e808e17e763125aaf18ae76eb29cf60) — test(VEH-SEAT-CAL-001): assert intentionally pending visual acceptance instead of contradicting fit warnings
67. [`ea08b4e8b3ea`](https://github.com/interlinkglobal/GTD/commit/ea08b4e8b3ea215d47fe95256a17534fb90c220a) — test(VEH-SEAT-CAL-001): validate all six calibrated lanes at four headings and reject bad parameters
68. [`d4cf306d015a`](https://github.com/interlinkglobal/GTD/commit/d4cf306d015a21e508c78a8e1ffe38f8e4d9cdc6) — test(VEH-SEAT-CAL-001): all six curated driver profiles, yaw invariance and isolation

## 8. Procedure DDD execution results (verified 2026-10-24)

- [x] **Permanent documentation:** this 68-commit forensic record is committed on `main`. A second, independently authored [DDD postmortem](https://github.com/interlinkglobal/GTD/blob/main/documentations/Development/GTD-PROCEDURE-DDD-VEH-INTERIOR-001-TO-005-SEAT-CAL-001-2026-10-24.md) is also on `main` and linked from PR #49. Both retain the full rejected history.
- [x] **PR sealed:** [PR #49](https://github.com/interlinkglobal/GTD/pull/49) was **CLOSED WITHOUT MERGE** at `2026-10-24T09:48:35Z`; its title and body explicitly mark the entire experiment **DDD failed / do not merge**. The final rejected tip remains identified as `d4cf306d015a21e508c78a8e1ffe38f8e4d9cdc6`.
- [x] **Experimental code removed from active branch tip by ref reset (NOT deletion):** the branch `feat/veh-interior-001-cabin-mapper-20261023` was safely returned to parent SHA `d48b735aa3f2c5fab733f0de6d354c9beaf0eda5`. GitHub ref GET confirmed the current branch tip matches the original CHAR-130 parent, and comparing against that parent now shows `ahead_by=0`, `behind_by=0`, `status=identical`. The rejected 68-commit series is still accessible through immutable commit SHAs in this record and the closed PR.
- [x] **Isolation verified:** PR #48 remains **open and unmerged**, with its head intact at `d48b735a...`. Checks on `main` returned 404/not-present for `src/game/vehicles/vehicle-seat-profiles-006.ts`, `vehicle-seat-constraints-005.ts`, `six-fleet-driver-fit-003.ts`, and `scripts/veh-interior-001-decode-fleet.mjs`. No failed seating implementation was introduced into `main` by DDD; only documentation was added.
- [ ] **Physical branch deletion outstanding:** the installed GitHub connection has `update_ref` but exposes **no Git ref/branch deletion action**. After the safe ref reset, the *branch name still exists*. A GitHub repository operator must select **Delete branch** on the [closed PR #49](https://github.com/interlinkglobal/GTD/pull/49) or remove that branch ref with authorized GitHub administration. Do not report it deleted until the branch search returns no entry.

**Operational result:** DDD implemented as far as tool permissions allow: comprehensive historic record, rejected/unmerged PR, branch reset to unmodified accepted parent, verification that failed code never entered `main`. **Branch deletion remains an explicit unresolved housekeeping step.** No new gameplay implementation or production deployment was undertaken.