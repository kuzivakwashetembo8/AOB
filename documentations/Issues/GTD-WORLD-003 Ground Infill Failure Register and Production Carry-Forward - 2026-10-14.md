# GTD-WORLD-003 — Ground Infill Failure Register and Production Carry-Forward

**Recorded:** 2026-10-14 (SAST)  
**Location:** South Ward / Mercer Street, Foundry Lane, gaps between buildings and beside the public green space  
**Status:** **OPEN / FAILED VISUAL ACCEPTANCE / CARRIED INTO MAIN AT OWNER DIRECTION**  
**Last reviewed source:** `feat/char002-humanoid-flight-survey-20261013@358ad10fb75ddf43353d36aeabbcbc862a20326c`  
**Owner release instruction:** Document all attempted implementations and failures, **do not attempt another fix**, merge the branch and manually deploy production for overnight follow-up.

## Requirement and observed outcome

The existing dark/plain-brown exposed base terrain in gaps between buildings must be filled **dynamically** with varied pavement, marked parking lots and grass; no fixed world-coordinate authoring patches. The requested acceptance criterion is **visible, geographically credible finished ground from both street and aerial viewpoints**, not only populated arrays or passing unit tests.

**Final field outcome: FAIL.** The last owner screenshot and console are from the L3 preview, `gtd-2uy2opzn0-interlinkglobaltech.vercel.app/game`. Black/dark empty ground persists immediately adjacent to the public green space and between buildings; **no generated paved/parked/grass infill was visibly confirmed**. The user explicitly requested production promotion without a further corrective attempt.

## Attempts and evidence, in chronological order

| Attempt | Implementation and corresponding source | Tests/build evidence | User-reviewed field outcome | Failure/lesson |
|---|---|---|---|---|
| Historical baseline | Earlier South Ward parity renderer used four **manually positioned development fills** and three authored parking pads. | Existing scenes could show only manually authored islands. | Larger brown/black gaps remained. | Violates the required dynamic city-generation policy; cannot be accepted as a general solution. |
| L1 — seeded procedural infill | `src/game/world-generation/parcel-infill.ts` derives 5 m cells from `CitySpec` roads, lot footprints, archetypes and seeded 15 m land-use clusters; original renderer added **three thin-instance ground material groups**, then a fourth parking-line batch. Commits `ef13562` and `f2a7358`; legacy municipal expectations updated at `1d6e616`. | NullEngine tests confirmed deterministic classes, mesh instance counts; first full suite had **245/246**, with one obsolete authored-parking assertion, which was updated. Later full suite passed. | First user preview of completed four-feature patch (`gtd-ci8f1z9z1-interlinkglobaltech.vercel.app/game`) still displayed empty dark areas from above. | Instance existence, classification and tests did not establish actual browser pixels. No verified parking/pavement from this technique. |
| L2 — explicit surface geometry | Replaced thin-instance ground groups with four **upward-facing world-space quad meshes** for pavement, parking, grass and parking stall lines. Proposed layer heights `LAND_Y=0.014` m and `PAINT_Y=0.022` m. Changed test contract to check vertices, normals, bounds, heights; commit `9060c17`. | **248/248 tests in 59 files passed**; Vercel preview reported READY. | In `gtd-451z36xbb-interlinkglobaltech.vercel.app/game`, aerial and close-up screenshots showed the same unfilled dark land beside buildings and the public space. | Drawable geometric arrays and correct normal orientation still did not prove visibility through the real WebGL renderer. |
| L3 — lighting uniform-budget hypothesis | A console dump from L2 showed Babylon 9.29.0 WebGL2 shader-compilation errors with `LIGHTCOUNT 17` and `MAXLIGHTCOUNT 17`. Applied `maxSimultaneousLights=3` to the four **generated infill materials only**, documented in `GTD-WORLD-003 L3 - WebGL2 Ground Material Uniform Limit - 2026-10-14.md`; commit `358ad10`. | NullEngine test asserted each infill material's 3-light cap under a scene containing 17 lights; Vercel preview READY; `/game` and `/sw.js` served HTTP 200. | **Final user screenshot** in `gtd-2uy2opzn0-interlinkglobaltech.vercel.app/game` still shows black/brown gaps and no visible new parking lots/pavements. New console again reports shader errors referencing `LIGHTCOUNT 17`. | The 3-light cap did **not** meet visual acceptance. The 17-light shader's particular mesh/material was **not isolated**; attributing every blank patch exclusively to it would be an unverified inference. |

## Final browser diagnostic evidence

The user-provided console and screenshot (2026-10-14, approximately 00:39 SAST) show:

- Babylon.js `v9.29.0 - WebGL2 - Parallel shader compilation`.
- `Unable to compile effect` repeated with `#define LIGHTCOUNT 17` and `#define MAXLIGHTCOUNT 17`.
- `Error: VERTEX shader uniform block count exceeds GL_MAX_VERTEX_UNIFORM_BUFFERS (12)`.
- At least one failing shader variant advertises `position normal uv`, another `position normal`; the log **does not conclusively map the failing effect to a specific infill material or any one mesh**.
- `manifest.webmanifest` is redirected by Vercel's preview SSO and blocked by CORS. This is a **separate preview-authentication issue**, not proven causal for ground surfaces.
- `[EXP-VEH-001] Check vehicle class dimensions against Meridian roads` warnings appear for parked cars. These are **not evidence of a ground-surface defect**.
- The browser repeatedly renders the existing public green-space geometry, normal buildings and roads, but the **new infill** remains absent.

The full raw console was supplied as an attachment to the October 14 owner review. Avoid committing the enormous shader dump into source control; retain the exact symptom and constraint above as diagnostic anchors.

## What is known vs. unresolved

**Known from source / test suites:**
1. The generator creates deterministic `pavement`, `parking`, and `grass` parcel classifications.
2. The latest renderer constructs four mesh batches with world positions, upward normals and simple materials.
3. `StandardMaterial.maxSimultaneousLights` is set to 3 in source for the newly generated batches.
4. The NullEngine cannot validate browser WebGL2 shader resource restrictions, final draw ordering, occlusion, depth or actual screen visibility.
5. No automated test yet proves a sample surface has a visible pixel in the **running browser**.

**Still unverified; do not publish as root-cause facts:**
- Whether the logged 17-light shader belongs to the infill meshes, a base terrain shader, or another material.
- Whether geometry height relative to the base terrain, depth testing, rendering group, runtime visibility/enablement, world transform, indexing/winding, light participation, base-ground occlusion, or camera clipping contributes.
- Whether a change in render backend, material shader, or mesh ownership is required.
- Whether any observed failure is specific to this GPU, another browser configuration, or all devices.

**Release risk:** This feature remains visually incomplete on desktop; mobile is **not** demonstrated to be fixed. The source still contains attempted WORLD-003 infill logic. Promoting the branch does **not** close or accept WORLD-003.

## Other work in the same promotion (independently accepted)

The owner visually accepted flight ascent/descent, normal directional hover, Shift-accelerated reversing with turn-then-prone behavior; as well as local Ferrari boarding/exit continuity and the lower rear-follow camera (subject to prior browser checks). These changes are **not** to be rolled back simply because WORLD-003 is unresolved. See CHAR-002, VEH-003 and their associated tests/documentation.

## Overnight resumption / next investigation gate

**No corrective source patch is authorized under this release instruction.** Stop here and preserve the failure evidence. When explicitly authorized later, reproduce in a browser on the deployed exact SHA, isolate a single infill mesh and its compiled shader, compare its world/absolute bounding box and material `isReady` against the actual visible base ground, inspect scene visibility/depth/render groups, and validate pixels before trusting NullEngine. Do not invent another unverified patch or conflate shader-count errors with proven ground mesh causality.

**Promotion semantics:** GitHub normal merge into `main` + manually requested Vercel production deployment, **with WORLD-003 visibly failed and open**. Production deploy success means source delivery only, not feature acceptance. Record resulting PR, merge SHA and deploy ID in the handoff or later addendum.
