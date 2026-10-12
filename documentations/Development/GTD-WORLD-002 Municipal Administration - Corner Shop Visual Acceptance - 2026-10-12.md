# Municipal Administration — Mercer Corner Shop Visual Acceptance

**Stage:** One-area visual refinement, owner-authorized, preview-only. No South Ward expansion, no production merge. Baseline: `cf00a2f56caa77d00a8940c12f055df64b740b8f`.

## User-reported issues and remedies
- **MA-V01 — No visible OPEN/CLOSED boards:** Original small high-mounted boards were not perceivable from Voight's view. Mount the owner's existing same-origin WebP sign art on a 1.68 × 0.80 m physical backplate at 2.25 m centre height and push it safely beyond facade geometry. Provide a legible 3.60 m shop-name plate directly over the glazing, and preserve art aspect ratios.
- **MA-V02 — Dark storefront strips:** Keep the architectural facade strip. Add a 6.60 m aluminium LED housing/diffuser aligned with the shop front; emission and a modest, local white light follow the existing Meridian night cycle. No independent time simulation.
- **MA-V03 — Invisible street furniture:** Place two visible residential bins, a red hydrant, utility cabinet and real Mercer street-name plate beside the existing corner shop rather than scattering all new props across the district. Keep existing garage clearance, sidewalk and vehicle collision rules.
- **MA-V04 — Streetlights look like unlit poles:** Give each existing street lamp a distinct translucent-looking luminous underside, place its existing point emitter at the actual head (including yaw), and use the canonical dusk/night intensity.
- **MA-V05 — Rectangular drainage sticks:** Render existing generator-wide facade-downpipe details as thin silver cylinders with collars. Preserve their authored placement, walls, LOD, reuse and disposal.
- **MA-V06 — No live location HUD:** Resolve the nearest registered street from South Ward's actual road graph at Voight's (or the controlled car's) current position, and show `South Ward // Mercer Street`, `Workshop Road` or `Foundry Lane` in the existing HUD alongside time.

## Guardrails and live acceptance
- This revision is a narrow visual slice. Do not expand the city, add NPC/business simulation, implement offline level installation, or alter accepted Ferrari/Voight controls.
- Real sign visibility and generated image loading require owner visual confirmation. Automated geometry/unit tests and Vercel READY are not sufficient to close MA-V01.
- Inspect a storefront at both 14:30 and 20:30 Meridian time; verify the OPEN/CLOSED art, name board and local LED; inspect two bins, a hydrant, street plate and cabinet; walk/drive past to confirm no phantom collision.
- After dark, streetlight heads must emit visible light; check performance and visual sharpness on desktop before considering mobile acceptance.
- The district/street label must change naturally while moving between the three named roads.
- Metal downpipes must look round from oblique viewpoints; no alteration to structural wall collision.
- Record any remaining visibility, texture-loading, physics, material or shadow defects before merging. All changes remain on `feat/gtd-world-002-municipal-administration-20261012` and draft PR #16.

**Acceptance:** OPEN until the owner reviews the live desktop preview.