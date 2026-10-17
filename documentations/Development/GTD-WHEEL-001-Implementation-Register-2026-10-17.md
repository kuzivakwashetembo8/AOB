# WHEEL-001 Implementation Register — 2026-10-17

**Status:** IN PROGRESS. Separate review branch. Source vehicle corrections require real-GLB qualification; CI tests alone do not constitute wheel acceptance.

## First delivered gate
- Created a new MVRS-1 admission contract for checking actual wheel pivots/mesh children and a versioned qualified asset manifest.
- Integrated fail-closed behavior into the non-Range-Rover imported vehicle setup. A source without four bound real wheels remains parked rather than producing a chassis-only sliding driving actor. Do not misinterpret this safety gate as successful wheel repair.
- Preserved existing Range Rover rig and driving controls. Kept Ferrari/Buggy excluded from the four-vehicle review branch.
- Source provenance, signed-off visual qualification and source-to-derivative conversion remain separate work packages.

## Pending before four-vehicle drive acceptance
1. Inspect *actual* owner Toyota, Dodge and Defender GLB source geometry and capture repeatable wheel-locator evidence per asset hash.
2. Export revised asset derivatives with real wheel pivot nodes and original rim/tire surfaces, ideally in an offline processor; reject ambiguous geometry for supervised modeling.
3. Replace preview-only structural permission with approved MVRS-1 manifests tied to exact derivative hashes.
4. Validate deterministic wheel steering/roll commands and visual road contact with owner screenshots and desktop/mobile first-frame timing.
5. Only after gates pass, promote the implementation onto main with no decommissioned GEO-R1 code.

**Do not claim all four wheels turn in live gameplay until confirmed on the actual assets.**
