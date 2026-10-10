# FL-4 Morning Integration and Pre-Continuation Patch — 2026-10-10

**Status:** ACTIVE IMPLEMENTATION INTEGRATED; AUTOMATED VERIFICATION PASSED FOR FIRST CANDIDATE; FINAL VISUAL AND DEVICE ACCEPTANCE OPEN  
**Date:** 2026-10-10 SAST  
**Development branch:** `development/meridian-fl4-optimization`  
**Production reference:** `main` `af1adcdd8efaa53cc6c666079f3ff7613fd86bc5` — fixed mobile-tested baseline, intentionally NOT altered by this patch  
**Source of Truth:** `documentations/Meridia First Light Implementation Plan.md`  
**Execution contract:** `documentations/FL-4 Technical Implementation Plan.md`  
**Visual decision record:** `documentations/FL-4 Visual Realism Decision Record and Implementation Plan.md`  
**Overnight handoffs:** `documentations/FL-4 Evidence/` (window, canopy, vehicle, performance and final audit)  
**Relevant issues:** GTD-VIS-001 cosmetic daytime sky banding; GTD-VIS-002 mobile 3D clarity

## 1. Decision and why

The five 01:00–05:00 jobs generated careful architecture, vegetation, vehicle and performance specifications but were unable to edit several active source files. This prevented visual realization despite apparently successful non-production builds. On user authorization, the morning work proceeded as a **bounded integration patch**, not another round of design brainstorming or a replacement for FL-4's performance/device acceptance requirements.

**Source-editing blocker disposition:** The same official GitHub `fetch_file` → `update_file` / `create_file` workflow accepted the subsequent file writes to the actual architecture generator and street-context renderer. No filesystem or connector security restrictions were bypassed; the cause of overnight rejection is not independently known. The immediate blocker is cleared **for these verified writes**, not asserted permanently resolved for all future files.

The three art corrections retain their original purpose and remain subject to matched preview screenshots, device-performance budgets and explicit user acceptance. The morning patch does not force a full mobile resolution-policy change, introduce traffic gameplay or reopen the non-blocking sky banding.

## 2. FL4-VIS-A — Real window/storey grammar

**Active source:** `src/game/world-generation/architecture-plan.ts`  
**Commit:** `91eaa0acb23f6d35e29c8aebc0dd6d01e91b94e7`

The previous generated opening formula used `min(1.05, floorHeight * 0.30)` for sill and `min(1.65, floorHeight * 0.47)` for window height. This made the same 1.65 m glazing serve both normal and 4.2–4.4 m storeys and left implausibly large blank head zones.

**Integrated rule:**
- Ordinary storeys **at/below 3.8 m** retain their previously accepted ordinary-window formula.
- Taller storeys use `sill = min(1.32, floorHeight * 0.30)` and `height = min(2.05, floorHeight * 0.46)`, measured from the correct per-floor base.
- Generated storefronts retain the low `0.22 m` sill and can use glazing up to `min(3.1, floorHeight - 0.22 - 0.62)` when taller walls warrant it. These are decorative panels, not newly traversable openings.
- Authored garage doors, garage rear glass, their cutThrough values, Rapier blockers, camera portals, seed/IDs, roofs and building dimensions are unchanged. The overnight audit found no justification for altering actual storey heights.

**Example expected tall-floor values:** west residential 4.2 m → sill 1.26 m, window 1.932 m, upper wall 1.008 m; rear residential 4.4 m → sill 1.32 m, window 2.024 m, head 1.056 m. Architectural interpretation remains archetype-specific; normal storefront exceptions must not be converted into generic residential windows.

**Coverage:** Morning regression suite asserts tall-storey resizing, ordinary-storey unchanged, authored garage openings identical and all generated windows remain within their floor elevations. **Visual acceptance pending.**

## 3. FL4-VIS-B — Proportional tree canopy activated

**Active source:** `src/game/world-generation/street-context-renderer.ts`  
**Planner:** `src/game/world-generation/tree-canopy.ts` from overnight Task 2  
**Commit:** `92e3eadf901ad3e7a9e344daf9af9ff985ad18ba`

The tree renderer formerly hard-coded ten three-plane clusters and ignored `item.canopyScale`. It now calls `planTreeCanopy(item, city.generatorVersion)` and instantiates its **exact 30 deterministic foliage cards**, honoring returned `x/y/z`, width/height, yaw and pitch. It retains prior material/texture, double-sided treatment, non-pickable/non-shadow-receiving foliage, unaltered tree collision and the user-accepted continuous, near-uniform trunk/root flares.

**Expected effect:** Larger street/park trees gain greater leaf volume and umbrella spread, while smaller trees remain more restrained; no added leaf-card mesh count or new foliage material is introduced. This is a projected qualitative/cost-preserving change, **not** an observed FPS improvement.

**Coverage:** Previously committed planner tests remain in the suite; morning live-renderer integration tests verify generated foliage cardinality, actual per-card positions and plane dimensions. **Matched screenshots and visual acceptance pending.**

## 4. FL4-VIS-C — Static parked car silhouette integrated

**Active renderer:** `src/game/world-generation/street-context-renderer.ts`  
**New pure geometry planner:** `src/game/world-generation/vehicle-proxy-geometry.ts`  
**Commits:** `725bcb04bf1c88e83406cbcfb3f720da36eb6484`, `b6daee8e4d60682828f05a21961b0c9602ae39ea`, `fd086d38a5c5948ffefc06f7f6f739238147f514`

The original visual had two box meshes (body/cabin) and four wheel cylinders. It now has:
- **one painted contour mesh** spanning hood, raked windshield, passenger roof, rear slope and trunk;
- **one dark-glass mesh** with front and rear windshield surfaces and four side-window panes, placed marginally outside the adjacent painted surfaces to prevent hidden glazing;
- the same four wheel meshes, existing three shared material families, positioned/rotated/scaled deterministic root and disposal ownership.

The painted geometry remains within prior body envelope `|x| ≤ 0.85, 0.35 ≤ y ≤ 1.47, |z| ≤ 2` in local units; the existing tire geometry protrudes as before. **Rapier collision center, half extents, yaw, placement, stable IDs and lifecycle are not changed.** This is a cheap non-drivable visual proxy only: no traffic, damage, vehicle interior, moving-car physics or new world mechanics.

**Cost interpretation:** Car mesh count remains six per proxy; body/glass triangle count rises modestly compared with two boxes. Shadow and draw-call performance savings are **not assumed** and require runtime measurement.

**Coverage:** Tests check finite vertices, valid indices, visual body envelope, active renderer use, two custom vertex-data meshes plus four wheels and disposal. **Visual approval and measured performance pending.**

## 5. Combined verification and preview chain

Morning source integration commits were tested in non-production Vercel under `dpl_XUvjNNBUhUD229ApQxZh7C2z9XDj`, source SHA `4d08273dff950c3dc8d2f60c83db457989c5af2e`: **READY** after sequential command `npx tsc --noEmit && npm run test && npm run build`, confirming strict TypeScript, the full test suite and the Vite/Nitro production build succeeded. This first verified commit contains the three live integrations and new combined integration tests. Later source-only adjustment `fd086d38a5c5948ffefc06f7f6f739238147f514` improves pane visibility; its **separate final build verification must be checked** before assigning full PASS to the final candidate.

**Morning first verified control preview:** `https://gtd-a959u1jns-interlinkglobaltech.vercel.app/game`  
**Final revised candidate:** see later final verified deployment record; never assume it passed before checking.

Repository-wide lint inherited an earlier reported ~864 errors and six warnings and was not part of the above verification command. Do not claim lint passed. Device-specific p50/p95, true GPU timers, thermal state and visual screenshot comparisons remain unmeasured/awaiting review.

## 6. Status mapping: previously blocked work

| Workstream | Overnight outcome | Morning state | Remaining gate |
| --- | --- | --- | --- |
| FL4-VIS-A01/A02 | Audit/specification | Completed and retained | None for source understanding |
| FL4-VIS-A03 | Source edits blocked | **Implemented in active generator** | user visual/regression validation |
| FL4-VIS-A04 | Not verified | New automated geometry assertions | matched views and user acceptance |
| FL4-VIS-B01 | Planner audit complete | Retained | none |
| FL4-VIS-B02 | Planner disconnected | **Integrated in active renderer** | real image/performance check |
| FL4-VIS-B03 | Not verified | Automated live-card checks | user visual review |
| FL4-VIS-C01 | Audit complete | Retained | none |
| FL4-VIS-C02 | Source edits blocked | **Integrated shaped sedan proxy** | side/front/rear image review |
| FL4-VIS-C03 | Not verified | Automated mesh/envelope checks | actual physics/gameplay review |
| FL4-01/02/03/04 | Measurement and mobile evidence partial | Not falsely promoted | instrument actual mobile pixel density, full-window desktop, comparable performance |
| FL4-05 | Regression partial | Strict TypeScript/tests/build verified for first candidate | complete visual/device regression, lint triage |
| FL4-06 | Final audit blocked | Still OPEN | explicit user visual/technical acceptance |

## 7. Mobile and environmental invariants

GTD-VIS-002's previous source-based DPR table was corrected to the **Babylon inverse-scaling** semantics confirmed by overnight Task 4. With GTD's explicit `Math.max(1, DPR/1.5)` hardware scale, approximate native-area coverage is **14.1% for a hypothetical DPR 2** and **2.8% for a hypothetical DPR 3**; neither value is measured on the user's phone. The source calculation helps prioritize mobile diagnosis but does not prove the device's render buffer or acceptable performance. **No hardware scaling/antialiasing defaults were changed in this morning patch.**

GTD-VIS-001 horizontal blue-sky banding remains documented as a minor, non-blocking appearance issue. FL-3 accepted night sky, ambient/street illumination, day/night clock, garage traversal, camera and Rapier physics remain protected. Existing landscape PWA controls are preserved.

## 8. Pre-continuation review and release decision

1. Review the **new integration preview** against fixed production baseline `af1adcdd8efaa53cc6c666079f3ff7613fd86bc5` at matched Meridian time/viewpoints; include tall facade windows and storefronts, different tree sizes and several car viewing angles.
2. Verify that Voight enters/exits the garage, does not pass through parked-car colliders and can rotate camera without obstruction regressions. Watch for wrong normals/hidden glazing, overlapping openings or oversized canopy clipping.
3. Capture a current mobile PWA diagnostic report when possible (DPR, CSS/backing/render pixel sizes, frame p50/p95), then evaluate any proposed mobile-specific policy **separately** from the three visual improvements.
4. Record performance/cost comparisons and user-specific acceptance. If any A/B/C defect appears, execute **targeted patch batches** on the development branch, not a speculative redesign.
5. Do not mark FL-4 COMPLETED until its canonical measured responsiveness/stability and explicit user visual approval criteria are met.
6. **No automatic merge or production promotion:** `main` remains the deliberately released pre-overnight comparison baseline until the user explicitly authorizes the next release.

**Final finding:** The previously disconnected three overnight implementations have been converted into **active generator/renderer code**, and the source-edit blocker is removed for this morning patch. This is substantive FL-4 progress, but it must not be confused with completed user-facing or mobile-performance acceptance.
