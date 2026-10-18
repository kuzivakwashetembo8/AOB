# GTD-WHEEL-002 — Solid wheel geometry and source-color preservation

**Observed:** October 18, 2026 owner Android screenshots, four-vehicle source-backed wheel preview `7449f9b`.  
**Status:** Regression identified; corrective branch under test. This document is not visual acceptance.  
**Scope:** Toyota Hilux, Land Rover Defender, Dodge HP; Range Rover must remain untouched.

## Acceptance finding

- The new real wheel pivots visibly steer, so the previous 'stationary wheel' problem has advanced.
- **New geometry defect:** Several tire/rim surfaces separate or appear torn as wheel pivots steer. A seemingly duplicate stationary wheel surface remains while another copy turns.
- **New finish defect:** The Dodge HP wheel surfaces become conspicuously pale/white instead of retaining their original source look. Owner identifies this as potentially universal for later imported assets.
- The current images are static; only the owner-reported motion establishes rotation. Do not infer an animation frame rate or tire speed from screenshots.

## Reproducible source-code causes

`scripts/wheel001_extract_wheels.mjs` originally selected only components with `part.tris.length >= 18`, substantial radial extent, and tight centroid constraints. Small spokes, lug nuts, rims and caps were skipped and retained inside the nonrotating chassis primitive. Moving only selected connected islands thus left overlapping, stationary source geometry.

The exporter also copied typed color and texture attribute arrays without copying `Accessor.normalized`. A normalized integer `COLOR_0` (or texture-coordinate) accessor must preserve `normalized=true`. Otherwise the renderer may interpret component bytes such as 90 as unnormalized shader values, producing a bright/white wheel. These causes are code-backed; the precise attributes and remaining residual components of each source should be confirmed by the real-source output registry and subsequent visual tests.

## Mandatory preventive invariants

1. **Original mesh partition:** every source triangle is assigned once to the static body OR exactly one animated wheel; no omitted, duplicated, or double-rendered source triangles. Assert before output and after GLB reimport.
2. **Complete wheel assembly:** move all bounded and positively identified source islands of tire, rim, spokes and hubs (including small details). Reject when conspicuous concentric circular geometry remains in the stationary body. Never hide or indiscriminately delete original body panels.
3. **Attribute fidelity:** preserve position, normal, tangent, all UV sets, vertex color data, integer normalized flags, primitive rendering mode, source material, texture and transparency properties. Compare source against output on the actual GLB, not just synthetic fixtures.
4. **Surface integrity:** four independent front/back wheel assemblies have no torn surfaces or exposed inner discs while steering and rolling.
5. **Material integrity:** no color drift for Dodge or subsequent owner-imported models. A color change is a qualification failure, not an acceptable wheel-animation side effect.
6. **Range Rover regression:** unchanged mesh and pivot logic. No new duplicate wheel assemblies.
7. **Performance:** source decoding/partition/QA occur at build/onboarding, not during gameplay; 60-second first-frame budget preserved.

## Verification requirements

- Run tests for normalized integer `COLOR_0`, wheel island containment, exact source triangle accounting, and emitted GLB normalized attributes.
- Confirm actual source attributes and source-to-generated wheel counts for Toyota, Defender and Dodge in `/wheel001-generated/registry.json`.
- Test the real preview in Chrome desktop and Android: stationary vs steered front wheels, side view and head-on view, reverse rolling and visible tire/rim solidity; compare original Dodge material appearance at identical lighting.
- Source SHA, derivative SHA and proof must be stored with every candidate. A failed partition or material check must yield an explicit repair-required result, not a silently damaged candidate.
- Do not promote any derivative to `DRIVE_APPROVED` or merge to main before owner visual acceptance.

## Real-source qualification evidence — 2026-10-18

**Verified deploy:** `b44fe6e80392e2c666425ce8dde27c46cfbec801`, preview `gtd-724g5ah8s-interlinkglobaltech.vercel.app`. Vercel production bundle READY; 357 tests / 86 files passed. `/game` and `/wheel001-generated/registry.json` returned HTTP 200.

| Actual owner source | Source triangles | New static body triangles | New animated wheel triangles | Previous animated wheel triangles | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Toyota Hilux 002 | 49,912 | 39,930 | 9,982 | 5,925 | Source partition equal, complete build |
| Land Rover Defender 001 | 50,142 | 37,029 | 13,113 | 6,068 | Source partition equal, complete build |
| Dodge HP | 646,834 | 498,657 | 148,177 | 102,164 | Source partition equal, complete build |

**Direct Dodge cause confirmed:** Its original `COLOR_0` is glTF component type `5121` (UNSIGNED_BYTE) with `normalized: true`. Before WHEEL-002 the wheel primitive copy omitted `Accessor.normalized`, so the exported wheel color stream was interpreted incorrectly. WHEEL-002 preserves that source metadata on each copied original wheel attribute and reopens the derivative GLB to assert matching component type, normalization flag, original material name, rendering mode and vertex attribute semantics. This applies to `TEXCOORD_n` and `COLOR_n` for future imports, not only Dodge.

**Source geometry integrity confirmed:** each actual model's input triangle count equals static-body plus extracted-wheel triangle count exactly. The completed-wheel component selection includes small source islands omitted previously; per-wheel source component counts are recorded in the generated registry. The stronger concentric residual guard fails on unassigned circular wheel geometry instead of permitting a static duplicate. Source original GLBs were not changed. The Range Rover source GLB and accepted wheel rig were not changed.

**Important qualification limit:** Triangle-count equivalence, accessor equivalence and passing tests prove source accounting and metadata preservation, NOT that meshes render identically from every camera angle, or that every possible wheel surface was disconnected from the body. A wheel surface welded to a body-connected mesh may still require supervised source authoring. Owner's visual review must explicitly check tire/rim solidity, no stationary copy, and Dodge color match. No owner acceptance has been recorded for this new preview.

**Size/performance watch:** Toyota derivative 18,054,904 bytes; Defender derivative 744,288 bytes; Dodge derivative 9,763,604 bytes, still substantially larger than its 1,954,504-byte compressed source. Record mobile cold-start time relative to the 60-second SLO before acceptance.
