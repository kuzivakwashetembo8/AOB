# WORLD-003 L2 / CHAR-002 — Aerial inspection corrections

**Preview stage:** owner acceptance pending; do not merge production.

## Field observations
1. Allocation-only thin instances reported success in NullEngine tests but the user's aerial screenshot still showed original brown terrain across the parcel gaps. Correctness must check drawable, world-positioned surfaces, not just thinInstanceCount.
2. Shift+S selected prone high-speed flying while the character remained facing the previous direction. Normal S backward hover was accepted.

## Implementation
- Replace the four thin-instance batches with four *explicit world-space quad batches*, oriented +Y and y=0.014m (parking markings y=0.022m). Both sit above the original terrain (0) and below existing street asphalt top (~0.03m) and sidewalks (~0.11m). One drawable mesh/material per paved, parking, grass and parking-stall family; no per-location hand-authored patches, collisions or camera obstruction. Parcels still come from the existing deterministic CitySpec planner.
- For flight, normal S keeps the original heading and uses UAL `flyHoverBack`. Shift+S turns with the existing travel-heading function toward the world movement vector, and stays on backward hover while rotation completes. Once yaw error is within 20 degrees it can use UAL `fly`, now facing the travel direction. No physics or camera changes.
- Tests inspect positions, up-facing normals, extents, layer heights and pure pose transitions; the earlier tests that only expected allocated instances have been revised.

## Acceptance
Fly over South Ward: visible generated grass, paving and lined parking in the gaps, no road seams or z-fighting. Hold S: gentle backward lean with no turn; Shift+S: visible turn to fly fast in the new direction, no backward-facing prone posture. All previously accepted vehicle/camera functions must remain unchanged.
