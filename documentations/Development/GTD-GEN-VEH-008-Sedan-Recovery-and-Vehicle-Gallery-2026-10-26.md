# GTD-GEN-VEH-008 — Sedan source restoration and Vehicle Inspection Gallery
Date: 2026-10-26
Branch: feature/gtd-sedan-gallery-008
Base: 3fc45f6305cfd0467f46cdc94dcce6819d91c401
Status: implementation branch; preview/owner QA required. No production merge approved.

## Locked evidence
GEN-VEH-007 release report: Sedan original 132,082 triangles; 23 paint islands and 24 glass islands; previous selection retained 22/23 paint and 12/24 glass. Wheel extraction was 4/4 corners source-ready. The sedan's front is negative source X, documented in NH-013 and established by -X headlamps and +X rear lamps. New script previously transformed +X into +Z, reversing its original front.

## GEN-VEH-008 implementation boundaries
1. Normalize the sedan's source -X front to GTD +Z using a handedness-preserving X/Z transform. Do not add NH-013's separate PI rotation on top of this canonical mapping.
2. Mandatory source paint/glass/front/rear lamp islands cannot be dropped to meet the previous 22k triangle budget. Prefer a bounded review budget with a build failure over missing rear glazing. All other source models' extraction parameters remain untouched.
3. No source GLB is overwritten. The batch generator continues to produce native typed data for existing traffic, plus on-demand per-model gallery JSON derivatives generated in prebuild.
4. Rejected GEN-VEH-007 traffic derivatives are isolated from North Heights until individually reviewed. Preserve existing 125-agent lane/traffic logic, earlier accepted Rover/Lamborghini, parked/drivable originals and zero diagnostic dots.
5. Home -> Vehicles beneath Settings: isolated Babylon scene, lazy derivative loading, gestures/preset perspectives and per-model QA status. This is a static inspection view, not another traffic simulator.
6. Validate native triangle/part coverage, forward direction, four wheel corners, asset-identity registry, lazy menu navigation, disposal, TypeScript/Vitest/Vercel and Android screenshots before sign-off.

## Gates
G0 original source unchanged; G1 sedan forward +Z; G2 24/24 glazing and 23/23 paint islands retained; G3 gallery and swipe; G4 NH-012/016 unaffected; G5 mobile performance; G6 owner visual acceptance. No main merge without G6.
