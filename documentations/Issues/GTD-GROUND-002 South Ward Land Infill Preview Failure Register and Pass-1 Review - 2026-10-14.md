# GTD-GROUND-002 — South Ward Land-Infill Preview Failure Register and Pass-1 Review

**Date:** 2026-10-14  
**Scope:** Preview review of GROUND-001 first implementation pass  
**Status:** REVIEWED / NOT ACCEPTED / PATCH PLANNING REQUIRED

## 1. Purpose

This document records the observed behavior of the first South Ward land-infill preview, distinguishing what worked, what failed, and the likely technical causes. It exists to prevent unstructured iteration and to ensure that the next patch is grounded in explicit acceptance failures.

## 2. Pass-1 outcome summary

The first preview demonstrated that the base concept is viable: the empty brown terrain can be replaced by intentional ground-use rendering. However, the preview is **not yet acceptable** because the resulting balance, fidelity, and spatial logic are still below the realism standard required for South Ward.

The pass succeeded in eliminating the dominant bare brown ground and in proving that the existing visible ground draw path can host generated land-use output. It failed in allocation balance, feature hierarchy, water execution, surface quality, and road-edge continuity.

## 3. What worked in this pass

### 3.1 Bare brown terrain replacement succeeded
The preview proved that the exposed brown terrain can be replaced by generated land-use surfaces without breaking the whole world runtime.

### 3.2 Existing roads and core scene survived integration
Roads, sidewalks, buildings, character movement, and basic scene operation remained present. This confirms that the new land-use system can coexist with the accepted First Light runtime.

### 3.3 Ground generation became visible through the existing ground path
A meaningful implementation breakthrough occurred: land-use visuals became visible when routed through the already drawing ground surface, instead of relying only on the previously unreliable overlapping infill geometry path.

### 3.4 Catalogue presence was partially demonstrated
Several approved categories became visibly represented or at least inferable in the scene: grass, paved zones, parking-type markings, and water. This confirms that the catalogue can be mapped into runtime output.

### 3.5 The pass exposed the real error modes clearly
The preview was highly valuable as a diagnostic pass. It made the dominant misallocations visible enough to guide a structured corrective patch rather than speculative theory.

## 4. What failed in this pass

### F-01 — Grass dominates the scene incorrectly
**Observed:** Large portions of South Ward became open green ground, causing the district to read more like semi-rural or semi-country terrain than an urban/suburban working-class neighborhood.

**Why this is unacceptable:** South Ward requires a higher degree of hardscape, paved approaches, service surfaces, and urban infill balance. Grass should support realism, not dominate it.

**Likely cause:** The fallback allocator is over-biased toward grass categories (`GRN-01`, `GRN-02`, `GRN-03`) whenever no stronger feature takes precedence. Grass is being used too often as the residual class.

---

### F-02 — Parking is being hidden or visually overridden by grass
**Observed:** A parking area near Mercer Street appears present in intent but partly hidden under grass or subordinated visually.

**Why this is unacceptable:** Parking, driveways, service yards, and paved forecourts are higher-order urban uses and must remain visually explicit once allocated.

**Likely cause:** Surface precedence is incorrect. A later general grass assignment or texture compositing path is overriding a previously assigned parking result. Another possibility is that parking regions are too weakly sized or too visually low-contrast relative to surrounding grass.

---

### F-03 — Water body is blocky and not physically real
**Observed:** The pond/water feature has visibly blocky edges and behaves like a painted surface classification rather than a formed terrain feature.

**Why this is unacceptable:** It breaks immersion and does not behave like a believable small water body. The owner also requires depth sufficient for the humanoid to sink at least to torso level.

**Likely cause:** The water footprint is currently derived from cell-based or hard-edged mask logic and then rendered as surface color only. No true depression/basin has been cut into the support geometry or physics.

---

### F-04 — Existing park patch is visually forced and inconsistent
**Observed:** The earlier green patch containing the tree/shrubs/bench/bin now looks detached from the rest of the generated world. Its color family and sharp edge treatment make it feel artificially inserted.

**Why this is unacceptable:** It weakens realism and calls attention to authoring seams.

**Likely cause:** The old pocket-green base patch belongs to an older scene strategy and now conflicts with the new world-scale surface language. The park object placement still has value, but the dedicated green ground patch no longer fits.

---

### F-05 — Grass texture quality is too soft/low-resolution
**Observed:** Grass looks blurred and lower fidelity compared to roads and pavements, which read sharper and more believable.

**Why this is unacceptable:** The mismatch makes the land-infill look like a low-quality overlay rather than part of the game’s built world.

**Likely cause:** The grass is being rendered from a low-detail procedural/color pass with insufficient high-frequency surface definition, or with overly soft sampling and insufficient texture sharpness.

---

### F-06 — Road endings look terminated
**Observed:** Some roads now appear to end abruptly with blocky cement/pavement caps.

**Why this is unacceptable:** South Ward roads are intended to extend into future districts. The current treatment implies a literal end-of-road rather than an incomplete world slice awaiting expansion.

**Likely cause:** The same bounded ground fill logic that solves empty-space assignment is also treating the road terminal region as a finished cap condition instead of an open continuation edge.

---

### F-07 — Pavement vertical shading attempt failed
**Observed:** Pavements show blurred vertical shading or striping layered over the intended horizontal slab rhythm.

**Why this is unacceptable:** The intended realism cue is understandable, but the output reads as visual artifacting rather than concrete segmentation.

**Likely cause:** The pavement shading pattern includes vertical modulation that is too broad, too blurred, or too frequent. It conflicts with the more convincing horizontal slab logic.

## 5. Root-cause interpretation

The first pass failed **not because the land-infill idea is wrong**, but because the implementation prioritized proof-of-coverage over final urban realism. The system solved “fill the brown spaces” before it solved “fill them with the right land-use balance and visual fidelity.”

The current failure cluster points to five deeper causes:

1. **Allocation bias problem** — residual land defaults too easily to grass.
2. **Surface precedence problem** — important paved uses can be visually overridden.
3. **Geometry deficiency problem** — water is only painted, not formed.
4. **Legacy-scene mismatch problem** — old pocket-green patch no longer belongs.
5. **Material/fidelity problem** — grass and pavement finishing are not yet visually aligned with the rest of the environment.

## 6. Official disposition of Pass-1

**Decision:** Pass-1 is **accepted as a diagnostic/proof pass**, but **rejected as a production-quality South Ward land-infill solution**.

It remains useful because it established:
- the land-infill can be rendered visibly,
- the world can remain operational,
- the main realism deficits are now clearly identified.

## 7. Mandatory corrections for the next pass

The next patch must, at minimum:

1. Reduce grass dominance and increase urban hardscape balance.
2. Make parking/driveways/service hardscape visually authoritative.
3. Replace the current blocky pond with a smoother, physically deeper water body.
4. Remove the old pocket-green base patch while preserving its props/vegetation where appropriate.
5. Increase grass sharpness and surface quality.
6. Remove road-end cap behavior so roads visually continue outward.
7. Remove vertical pavement shading artifacts.

## 8. Acceptance target for the next preview

The next preview should visibly demonstrate:
- balanced grass vs pavement/concrete,
- visible Mercer-side parking,
- cleaner urban hardscape distribution,
- smoother pond outline,
- true pond depression/depth,
- removal of forced green patch,
- sharper grass texture,
- flatter/cleaner pavement appearance,
- no artificial road termination language.

**Status:** Awaiting corrective patch plan authorization.