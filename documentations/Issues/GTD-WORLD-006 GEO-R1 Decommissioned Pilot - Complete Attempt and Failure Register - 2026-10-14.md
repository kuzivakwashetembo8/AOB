# GTD-WORLD-006 / GEO-R1 — DECOMMISSIONED VISIBLE SOUTH WARD PILOT
## Complete attempt record, failed visual gates, and permanent no-merge/no-deploy disposition

**Owner stop order:** 2026-10-14; final mobile evidence at 13:39 device local time.  
**Disposition:** **FAILED / DECOMMISSIONED / CLOSED — NOT MERGED**. Not a paused feature or a candidate for another patch.  
**Recorded to:** `main` documentation only, without carrying any R1 source/code/preview configuration into `main`.  
**Affected code branch:** `feat/world006-r1-visible-south-ward-pilot-20261014`, final recorded head `b5c3682e8731fc98d0addd2e87767dcd6b1a0661`.  
**Affected PR:** [#23](https://github.com/interlinkglobal/GTD/pull/23), based on `feat/world006-city-registry-foundation-20261014`. The R1 feature branch has **13 commits and 14 changed files** compared with its P1 base; the entire change set is rejected for merging.  
**Original non-R1 `main` baseline at disposition:** `a7299d15f84facb8200488ec6f8e4679416221be`.  
**Scope of prohibition:** all R1 scene-generation code, city/road/building placements, R1 startup/workaround patches, experiments, and verification configurations in this failed branch lineage; no merges, cherry-picks, ports, PR reopening, extensions, or preview/production deployments from these commits. Keep only the lessons/evidence.

### 1. Objective and proposed scope — what the trial attempted

The parent [WORLD-006 plan](../GTD-WORLD-006%20Meridia%20City%20Expansion%20Architecture%20and%20Security-Gated%20Implementation%20Plan%20-%202026-10-14.md) calls for expanding Meridian City from South Ward outward before traffic. GEO-R1 was intended as the **first** actual 3-building browser preview and an experiment to expose scaling defects.

R0 / First Light contained **10** authored buildings and **5** road segments. R1 proposed **13 total** building records and **8** road segments, using a composed `CitySpec`, physical roads/sidewalks, a preview-specific enlarged flat terrain and collision envelope, and a mobile inspection spawn. The new architecture/profile candidates were:

| Proposed new building / position (x,z) | Profile | Assigned unapproved surface | Additional geometry |
| --- | --- | --- | --- |
| Mercer Row Townhouses (84, -12) | ARCH-05, 3 floors | RND-02 sand-float stucco | physical pedestrian entrance, pitched roof |
| Mason Community Clinic (142, -12) | ARCH-06, 2 floors | STN-01 limestone ashlar | physical patient entry, civic front |
| East Mercer Service Workshop (142, 29) | ARCH-31, 1 floor | MET-01 metallic base finish | personnel entrance, real service bay, 26 independent metal ribs |

R1 also proposed two connected Mercer Street segments and an unapproved **Mason Street** side street, with a continuation and a T-junction. Mason Street and these lot coordinates remain **experimental**; no new streets, addresses, or building types were accepted for the canonical map. Provisional surface UV repeat was 2.4 m × 1.8 m without owner approval. RND-10 was not involved.

### 2. Evidence standard

We distinguish:
- **Code and headless evidence:** typed/validated `CitySpec`, 13 Babylon generated building handles, mesh/physics/texture records, geometry/frustum checks, and Vitest passing.
- **Deployment evidence:** Vercel reported READY, HTTP 200 for `/game`, `/sw.js`, and RND-02/STN-01/MET-01 WebP. This verifies delivery/build, **not** real GPU output.
- **Owner's Android Chrome screenshots:** authoritative field outcome for visible architecture. The final screenshots establish the scene remains visually incomplete. No developer-console capture or shader-compile attribution is available, so unproven causes must not be presented as established facts.

### 3. Chronology — every meaningful attempt and outcome

| Sequence | Change, preview and verification | Observed outcome / failure mode |
| --- | --- | --- |
| 01 — Initial R1 authoring | Three intended lot-backed buildings and 3 connected road segments; baseline 10 and 5 retained behind `?gtdWorld006R1=1`. First Vercel check `dpl_2SUxvpoqfhVqJVQdBJbBFNYzKjcT`. | **4/4 new R1 tests failed** (authored entrance opening counts did not match required openings, and a neighborhood ID conflicted with a road segment ID). Existing First Light tests still passed. No acceptable preview. |
| 02 — City-contract repair | Authored explicit townhouse and clinic pedestrian doors, workshop pedestrian + garage openings, globally unique IDs; limited overlap rejection to new-vs-any parcels. Added nearby R1 inspection spawn. Corrected preview `dpl_AstKWw8KK5VwVcCfBFMM9TwzeJ4F` at `gtd-fahye1wmn-interlinkglobaltech.vercel.app`. | Headless **260/260** tests and build passed; Android screenshot showed **STARTUP ERROR 7/8** and “Render first completed scene” stuck after approximately **1,573** actual render attempts. No visible city completion. |
| 03 — Camera/frustum experiment | [Source commit `29d6d12d`](https://github.com/interlinkglobal/GTD/commit/29d6d12d6988265bf53dd450940cf1b9eed6c4b8); changed R1 inspection spawn/camera to (84,0.92,17) and northward view toward townhouse, shared view constant and CPU frustum regression. Preview `dpl_4GWKgh8Ux7sQNbKH4uSZvhrrkh8o` (`gtd-4gvnh3jt9-interlinkglobaltech.vercel.app`). | **261/261** automated tests, including CPU frustum intersections, passed. CPU frustum of 1,913 building mesh bounds is **not evidence of mobile GPU building draw**. Camera hypothesis not confirmed as resolution. |
| 04 — First-frame street-witness alternative | [Commit `30c605a0`](https://github.com/interlinkglobal/GTD/commit/30c605a08772a40eae1b528772186e8a358f50a9); counted actual asphalt+sidewalk as possible terrain alternatives and preserved Voight/building frame requirements; added `[T/R/S/B/M/V]` diagnostic. Preview `dpl_6HYqfZw1TZpYqfXctLU8p5hx616Y` (`gtd-rnbca1j62-interlinkglobaltech.vercel.app`). | **262/262** tests passed and deployment READY; second Android screenshot again showed **7/8 startup failure**, after approximately **1,355** render attempts. The fix was not selected at runtime because `characterTrial` had higher precedence. |
| 05 — Startup mode precedence repair | [Commit `011f5571`](https://github.com/interlinkglobal/GTD/commit/011f55718b21a8e07a048d358c367e284531c360); pure `selectWorldFrameWitnessMode` explicitly prioritizes R1 over the always-present humanoid `characterTrial`, fixes R1 witness selection, exposes details. Preview `dpl_93zaqBsZjkykXAXRxh7rJJN8wDnc` (`gtd-f5m69cwkn-interlinkglobaltech.vercel.app`). | **263/263** tests passed; Android screenshot at approximately **13:11** showed gameplay starts, but primarily **roads, sidewalks, vehicles, trees, sky and Voight**, with most old/new building bodies missing and extensive black/unfilled ground. Startup fixed, city still visually failed. |
| 06 — Native material / thin-instance shader experiment | [Commit `b5c3682e`](https://github.com/interlinkglobal/GTD/commit/b5c3682e8731fc98d0addd2e87767dcd6b1a0661); in R1 only preserved native Babylon `StandardMaterial` on all 13 buildings rather than custom character-trial `ShaderMaterial`, capped simultaneous lights at 2, disabled receive-shadows on building meshes; testing native thin-instance transforms. Preview `dpl_GtTzSnLVdkduqpymDYFLjzmNddf7` (`gtd-6ye6bwxxl-interlinkglobaltech.vercel.app`). | Typecheck, **264/264** tests in 61 files, Vite/Nitro/PWA build passed, preview READY. **Final owner screenshot at approximately 13:39 still showed dark/unfilled blocks, roads/cars/Voight, and only a partial building visible on the far left**. User rejects visibility result; majority of existing and new structures did not visibly populate the city. **Final FAILED gate; owner decommissions branch.** |

These are historical preview addresses for evidence identification **only**. They are withdrawn and must **not** be redeployed, promoted, or supplied as active testing links. The existence of READY preview URLs does not convert the failed R1 feature into an approved build.

### 4. Failure modes — factual observations versus hypotheses

**FM-01 — Contract failure during data authoring (confirmed, repaired locally).** The first R1 spec omitted explicit doors/garage openings and duplicated a city ID. Four new tests failed. Repair made unit tests green, but did not establish browser reliability.

**FM-02 — Strict first completed-scene acceptance 7/8 (confirmed from Android screenshots).** The engine, physics, Voight, imported vehicles and South Ward generation checkpoints passed, but the required complete visible scene did not. Repeated >1,300 frame attempts were futile. Camera/orientation and terrain-only witness assumptions were investigated, but a device-side per-material GPU attribution was unavailable.

**FM-03 — Startup mode precedence regression (confirmed in source).** Because `this.characterTrial` is populated in regular gameplay, `this.characterTrial ? characterMode : R1Mode` shadowed the new R1 branch and required an unrelated lane-marking witness. A corrected selector was introduced and first-frame startup subsequently passed, **but this did not repair the city graphics**.

**FM-04 — Existing and R1 buildings missing/partially drawn despite 13 authored handles (confirmed visually; shader cause unproven).** Headless `NullEngine`, metadata, camera frustum bounds, test mesh/collider counts and texture URLs were mistaken for stronger visual evidence than they actually provide. Android visuals show roads/cars/Voight without most building masses. The final screenshot shows **at least one partial building**, so this is **partial/inconsistent GPU scene visibility**, not proof that all building meshes are absent or all are disabled in JavaScript.

**FM-05 — GPU thin-instance/custom ShaderMaterial interaction (hypothesis NOT validated).** Building wall meshes use thin-instance transforms. Character-trial lighting code swaps some materials for minimal custom ShaderMaterial. Native StandardMaterial preservation / `maxSimultaneousLights<=2` / disabling receive-shadows was tested, **but failed owner visual acceptance**. Therefore neither the custom-shader theory nor the native-material workaround should be carried forward as a resolved diagnosis.

**FM-06 — Ground infill and dark unfilled lots (known separate and persistent).** WORLD-003 paving/parking/grass rendering defect existed before GEO-R1 and remained across every available post-startup screenshot. Extending the ground polygon/collision support did not make the missing city fill visually real. Prior 17-light WebGL uniform issues were observed historically, but the exact shader/material responsible here was not proven.

**FM-07 — Test matrix misses actual mobile visual pipeline (confirmed process gap).** TypeScript, Vitest, Vite/Nitro build, HTTP 200, 3D CPU frustum, Babylon NullEngine, Rapier collider census and PWA worker checks all passed while Android city visuals failed. A future *independently authorized new project* would need an actual supported mobile browser GPU draw validation path, shader compile logs/status on-screen or another authorized observation method, plus before/after First Light screenshots—not just more simulation-level tests.

**FM-08 — Render-performance and lifecycle unknown (not asserted).** This test does not prove frame-rate, decoded VRAM, shader program readiness, device throttling, LOD, thin-instance buffer state, geometry disposal or street streaming correctness under greater density. Do not fill these gaps with guesses. No actual ambient traffic was ever added.

### 5. Owner decision and irreversible project disposition

At the final Android screenshot, the owner explicitly ordered: *“Document all the attempts and their failure modes then close this branch. It has been decommissioned and prohibited from any merges or further developments & deployments.”*

Effective immediately:
1. **Do not merge** PR #23 or cherry-pick, port, rebase, squash, or otherwise copy GEO-R1 code into any branch destined for production. Closing PR is mandatory. This is **abandonment**, not completion.
2. **Do not continue** the R1 feature branch or create a follow-on GEO-R1 development branch based on it. No diagnostic patches, commits, new previews, production deployments or test runs from the decommissioned lineage.
3. **Withdraw** all related verification branches, especially `verify/world006-r1-visible-20261014`, `verify/world006-r1-startup-fix-20261014`, `verify/world006-r1-frame-precedence-20261014`, and `verify/world006-r1-native-building-visibility-20261014`, from deployment candidacy. Their history may remain readable solely for forensic evidence until a repository administrator retires their refs.
4. **No retrospective acceptance** of the added ARCH-05/06/31 building implementations, RND-02/STN-01/MET-01 in-game appearances, Mason Street geometry, initial preview spawn, metal ribs, R1 render witness policy or native-material override.
5. **Keep separate:** the high-level WORLD-006 architecture document and P0/P1 `feat/world006-city-registry-foundation-20261014` are **not** part of the R1 branch rejection, but neither gains permission to deploy or resume work from this failure record. No other development is implicitly authorized.
6. **WORLD-003 ground failure remains OPEN**. The actual affected First Light city geometry and the baseline should be re-established only in a separately and explicitly authorized effort unrelated to this decommissioned implementation.
7. **Evidence preserved, code rejected:** never treat passing tests or archived READY URLs as release clearance. The next project must be planned afresh under a separate user instruction, not by reopening this failed R1 PR.

### 6. Repository and deployment handling

- This failure report and the warning atop WORLD-006 are **documentation-only updates directly to `main`**; they are NOT a merge of the feature branch.
- Close and visibly label PR #23 **DECOMMISSIONED — DO NOT MERGE/DEPLOY**; lock discussion after the final disposition comment where supported.
- GitHub commit history and PR review comments are retained for evidence. Branch ref deletion or a repository ruleset forbidding a later recreation/merge may require repository-admin tooling. **Do not claim hard technical ref deletion or branch-rule enforcement unless independently verified.**
- No new deployment is created by writing this record; do not alter Vercel production, the project's deploy-per-commit policy, or the separate foundation PR.
- No request to remove existing served historical preview artifacts has been executed. They are retired as official review candidates; actual removal requires an explicit supported deployment-retirement action.

### 7. Detailed prior documentation and evidence links

- [PR #23 discussion and failed R1 patch history](https://github.com/interlinkglobal/GTD/pull/23)
- [Initial camera-frustum attempt](https://github.com/interlinkglobal/GTD/pull/23#issuecomment-6165102620)
- [Street-witness alternative](https://github.com/interlinkglobal/GTD/pull/23#issuecomment-6166050054)
- [Startup precedence analysis](https://github.com/interlinkglobal/GTD/pull/23#issuecomment-6166956557)
- [Native material experiment](https://github.com/interlinkglobal/GTD/pull/23#issuecomment-6167317560)
- In-branch historical files (read-only for audit): `documentations/GTD-WORLD-006 GEO-R1 Visible South Ward Pilot Implementation and QA - 2026-10-14.md`; `documentations/GTD-WORLD-006 R1 Mobile Startup Render-Gate Precedence Fix - 2026-10-14.md`; `documentations/GTD-WORLD-006 R1 Mobile Building Visibility Native Materials Experiment - 2026-10-14.md`.
- User-provided Android screenshots in this conversation at approximately 10:59, 12:57, 13:11, 13:39 (device times). Screenshots were visually inspected; **raw browser shader logs were not obtained**.

**END STATE: ABANDONED / DO NOT IMPLEMENT OR DEPLOY.**
