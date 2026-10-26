# GTD-GEN-VEH-006 — BMW M4 retirement from moving traffic
Date: 2026-10-26
Branch: feature/gtd-generated-traffic-no-bmw-001
Status: owner directive implemented on isolated branch; production unchanged

## Decision
Owner rejected BMW as a moving traffic vehicle after recognizing its original GLB-to-native exterior extraction but observing mobile glitches and unacceptable wheel visual behaviour. BMW is removed from the generated-traffic catalogue, **not merely lowered to procedural coupe**. The original GLB, parked/drivable South Ward specimen and source extraction work remain archived for engineering reference; there is no destructive file deletion.

## Measured source facts
GEN_VEH_006_NATIVE extracted 151,780 exterior triangles and 20,702 wheel triangles = 172,482 per full vehicle. NH012 previously allocated 21 BMW actors in the 125-car traffic circuit; that represented up to 3,622,122 BMW triangles per frame in a worst case full-visibility scenario. This is a modelling upper bound, not a measured GPU/frame-time trace. Both wheel-axis/contact mismatch and high geometry cost plausibly contribute to poor UX.

## Implementation
- NH012 removes BMW from its default model table entirely, preserving total traffic population at 125.
- Five remaining source families — Range Rover Sport, Toyota Hilux, Defender, Dodge HP and Lamborghini Temerario — each receive five paint variants times five deterministic logical instances = 125.
- Existing 8 Sedan, 12 Hatchback, 8 Taxi and 6 Renault Kangoo overlays reassign 34 of those existing actors, leaving 91 source-family moving traffic actors. Hence nine named moving vehicle types total.
- NH016 fleet roster excludes BMW. BMW source geometry is not imported in moving traffic; its detailed extract build step had already been disabled in the lightweight A/B branch, and BMW 3D rendering code already removed.
- Preserve routes, lane physics, steering, traffic tick rate, other accepted vehicle designs and all six parked/drivable GLBs.
- Compare this isolated build with previous preview before authorizing merging to main.

## The remaining nine models
1. Lamborghini Temerario — exterior and wheel alignment accepted; rim readability follow-up
2. Range Rover Sport 2018 — accepted exterior and wheels
3. Toyota Hilux 002 — extraction pending
4. Land Rover Defender 001 — extraction pending
5. Dodge HP — extraction pending
6. Four Door Sedan — extraction pending
7. Fourd Confusion Hatchback — extraction pending
8. Taxi — extraction pending
9. Renault Kango Optimized (Kangoo) — extraction pending

Two have had successful source-derived extraction; seven await the full three-stage procedure. BMW is outside this remaining set.
