# Vehicle Asset Doctrine Refinement — FL4-VIS-C

**Decision status:** PROPOSED IMPLEMENTATION STANDARD; no change to canonical doctrine or production art.  
**Authority:** `Meridia First Light Implementation Plan.md`, First Light Asset Doctrine §5, and FL-4 visual realism DR-05.

## Decision

At First Light gameplay distance, a parked vehicle must be recognizable as a **three-dimensional car** from front, side and rear. It should communicate bonnet/hood, passenger roof, front and rear glass, wheels, wheelbase, ground contact and plausible body proportions. It does not need a working engine, doors, interior, suspension, traffic logic or a drivable model.

Use **silhouette first, surface response second, mechanical detail later**. A geometric improvement that preserves recognizable massing at six meshes is preferable to dozens of decorative meshes whose cost becomes substantial across a procedurally generated street.

## Representation and interaction rules

The current generated sedan placeholder is six meshes with three shared materials. A first silhouette uplift should keep those six meshes by replacing two rectangular blocks with a shaped body and combined glazing, while retaining the four wheel meshes. Preserve the fixed Rapier cuboid, stable road-segment spawn IDs, transform, deterministic scale/yaw, shadow registration and disposal. Do not use 2D billboards at close interaction distance.

A dark window material can imply glazing without transparency sorting, complex refraction or a modeled interior. Avoid extra draw calls for tiny badges, handles or lights until screenshots show that they materially improve legibility. Retain stylized color/material response rather than attempting photorealistic automotive shaders.

## Future separation

This is a **temporary parked-proxy representation rule**, not the specification for future drivable cars. A later vehicle milestone must independently decide wheel animation, suspension, steering, collision fidelity, interior/door interaction, damage, LOD and traffic. Current architecture should avoid assuming those future systems exist.

## Evidence and gate

Require before/after multi-angle, Voight-scale images, a collision/garage regression, actual active mesh/triangle/draw-call counts and matched frame-time measurements. Passing a build does not prove visual improvement. User visual acceptance remains mandatory.

**Execution state:** Source-file writes were blocked in this task, so the doctrine is recorded as an implementation rationale only. See `Vehicle Proxy Audit - Task 3.md` and `Vehicle Proxy Regression Contract - Task 3.md`. FL4-VIS-C02/C03 and VIS-07 remain open.
