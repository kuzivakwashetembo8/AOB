# Procedure DDD — WORLD-022 South Ward Infrastructure Imports

**Date:** 2026-10-24 (Africa/Johannesburg)  
**Decision:** **FAILED / DECOMMISSIONED — NO MERGE, NO FURTHER DEVELOPMENT ON THIS BRANCH**  
**Authority:** Owner: "Delete all those 12 files I committed first then run DDD on this branch."  
**Experimental branch:** `feature/world022-infrastructure-import`  
**Pull request:** [#51](https://github.com/interlinkglobal/GTD/pull/51), draft; must remain closed and unmerged.  
**Original source upload:** `ffa7f4201768479978bd75f51718a19192087575`.  
**First attempted preview:** `gtd-680o80br4-interlinkglobaltech.vercel.app/game?gtdWorld022=1` — FAILED build.  
**Final user-inspected preview:** `gtd-3m5lab1y2-interlinkglobaltech.vercel.app/game?gtdWorld022=1` — Vercel READY, user REJECTED as unplayable/glitchy.  
**Disposition:** No WORLD-022 source models, derived GLBs, generated textures, Blender workflows, runtime code or tests are to cross to main. Only this historical DDD report remains.

## 1. Original purpose
Expand South Ward by preparing twelve architectural files (eleven Autodesk `.3ds`, one Wavefront `.obj`) committed into `public/GLBs/Infrastructure/`, generating provisional material textures, converting to Babylon-compatible GLB and placing buildings near a new road without consuming Birch Avenue's reserved neighborhood. Keep original assets intact during the experiment, defer texture fidelity to owner inspection, limit browser load/performance costs, and obtain explicit acceptance before merge.

## 2. Work actually performed
1. Inspected original source commit; all 12 asset paths were individually established by its GitHub file list. The existing `Minimal Modern Villa House N101225.obj`, `.mtl`, and `.gitkeep` were identified as older, unrelated files.
2. Created draft review branch and PR #51. Added `scripts/world022-convert-infrastructure.py` to attempt headless Blender 3DS/OBJ imports, GLB outputs and size/material/dimension reporting.
3. Added a GitHub Actions conversion workflow. The initial run [40091435050](https://github.com/interlinkglobal/GTD/actions/runs/40091435050) failed **before allocation of a runner** (zero steps). No reliable evidence established whether the 11 individual 3DS files would import or convert correctly.
4. Produced eight provisional image-generated building materials (brick, stucco, block, galvanized steel, rusted metal, office glass, wood, roofing); stored review WebP derivatives on the experimental branch. Updated Blender to use generated fallbacks only where source textures were absent.
5. Independently parsed `Building N131121.obj` and authored a small interim GLB: 3,858 triangulated faces, 398,152 bytes, four source material groups. The model used provisional 15 m vertical scale and runtime-assigned generated textures. Its dimensions, material association and orientation remained **visually unverified**.
6. Added the opt-in Babylon loader, catalog, provisional lots, bounding-box exterior colliders and Infrastructure Avenue geometry behind the Mercer garage area. Initially chose an inappropriate road position near the previously documented future Birch Avenue strip, then relocated it north of Mercer in the corridor behind existing garages. The positioning remained unaccepted.
7. First Vercel deployment `gtd-680o80br4` failed TypeScript `exactOptionalPropertyTypes` compilation in the new report method. Patched the type. Second Vercel deployment `gtd-3m5lab1y2` built to READY, but **READY validates packaging, not mobile responsiveness, character appearance, or gameplay quality**.
8. Owner tested the second preview and reported mobile unresponsiveness, severe desktop glitches and a humanoid visually fragmented into purple particles instead of the expected yellow character. The owner liked the imported architectural geometry but rejected the branch and requested DDD. The remaining eleven 3DS models had not been converted or placed.

## 3. Why this branch failed
**Conclusive acceptance failure:** The end-to-end branch did not deliver a playable South Ward imported-building expansion. The owner specifically observed unacceptable desktop and mobile runtime behaviour and character-rendering corruption. The cause of the purple fragments, input stalls and performance regression was **not isolated**. They coincide with the experimental deployment; this record does not assert that the single 398 KB / 3,858-triangle building caused them.

**Process failure:** Three independent unknowns (binary 3DS conversion, UV/material reconstruction and live game-world integration with scene/physics loading) were advanced together without verified intermediate gates. GitHub Actions inability to allocate a runner meant the planned converter and 11 3DS files remained untested. A custom OBJ fallback was advanced to the live Babylon world without independent GLB-viewer validation or mobile profiling. A Vercel READY status was implicitly over-weighted against observable gameplay. Multiple branch preview deployments were incurred before a stand-alone material/geometry quality gate.

**Additional unverified risks:** guessed source units, potentially misidentified source orientation/frontage, material-name mapping, texture UV repeat/seams, generated 128px WebP detail, scene-loading and collision lifetime, street/garage/Birch clearances and PWA/performance characteristics.

## 4. Explicit file disposition

### 4.1 Owner's 12 original source files — deleted from main
All below were introduced by commit `ffa7f420` and removed together in commit [`4b6ffdb8`](https://github.com/interlinkglobal/GTD/commit/4b6ffdb8e77dd95930a9bb08aa26ff7ffeb290ba):

| Path under `public/GLBs/Infrastructure/` | Format |
| --- | --- |
| `Building N050115.3DS` | 3DS |
| `Building N070409.3ds` | 3DS |
| `Building N120609.3DS` | 3DS |
| `Building N131121.obj` | OBJ |
| `Building N220210.3DS` | 3DS |
| `Building N281212.3ds` | 3DS |
| `Building N291212.3ds` | 3DS |
| `Building_business_centre N270810.3DS` | 3DS |
| `Gas station building N010817.3DS` | 3DS |
| `Hangar N280115.3DS` | 3DS |
| `House N220609.3DS` | 3DS |
| `Office building Boralex N121010.3DS` | 3DS |

Post-removal directory inspection of `main` showed exactly three pre-existing entries: `.gitkeep`, `Minimal Modern Villa House N101225.obj` and `Minimal Modern Villa House N101225.mtl`. This is a new commit, not Git-history purging; the original files may still exist in Git's earlier commit history, clones or external archives.

### 4.2 Branch-only experimental changes — rejected
The compare before decommission showed 19 branch-only changed files, covering:
- `.github/workflows/world022-infrastructure-convert.yml`
- `scripts/world022-convert-infrastructure.py`
- `documentations/Development/WORLD-022-South-Ward-Infrastructure-Imports-2026-10-24.md`
- `public/GLBs/Infrastructure/GeneratedTextures/` (8 experimental WebP images)
- `public/GLBs/Infrastructure/converted/building-n131121.glb` and `converted/world022-catalog.json`
- `src/game/world/world022-imported-south-ward.ts`
- `src/game/world/world022-infrastructure-avenue.ts`
- `src/test/world022-imported-lots.test.ts`
- Changes to `src/game/world/generated-first-light-world.ts`, `src/game/world/first-light-runtime-source.ts` and `src/game/core/gtd-runtime.ts`

None is approved for cherry-pick, merge or production release. Historical PR, old preview URLs and experiment commits are audit artifacts, not supported current architecture.

## 5. Safe baseline and future learnings
- Preserve accepted mainline GTD character motion, vehicles, First Light garage/roads, performance/pause persistence, and the previously documented **Birch Avenue** 20-villa reconstruction recipe. These are unrelated to WORLD-022 and are not reverted.
- `main` remains the only accepted game code baseline. The user requested removing the original 12 source files; there is no authorization to remove unrelated models.
- Conversion should occur on a stand-alone, reproducible local or CI environment with actual per-model conversion artifacts and error reports.
- Material/UV validation should occur in an isolated GLB viewer with ground-truth bounds, not the full GTD game.
- Any new future experiment must be separately authorized; it must pass scene/runtime profiling (desktop and mobile) and material/architectural review before permanent street integration.

## 6. DDD closure gates
- [x] Owner rejected branch, authorized removal and invoked Procedure DDD.
- [x] All twelve specified original source files deleted from **main**, commit `4b6ffdb8e77dd95930a9bb08aa26ff7ffeb290ba`; the older villa files retained.
- [x] Failure cause, attempted mechanisms, previews, uncertainty, rejected paths and protection boundaries documented.
- [ ] PR #51 closed without merge (operational step).
- [ ] Experimental branch reset to documentation-only latest main with a force-with-lease ref update; verify zero diff before declaring feature isolated (operational step).
- [ ] Experimental branch name deleted permanently; connector currently lacks a delete-ref action. If still unavailable, delete using GitHub's repository Branches UI and verify. A reset branch is **not** deletion.
- [ ] Old READY preview removed/disabled. Vercel may retain immutable deployment URLs; refrain from opening or sharing them as accepted GTD.

**Verdict:** WORLD-022 rejected; no runtime salvage, no feature merge, no continuation on the decommissioned branch. This report records history only.
