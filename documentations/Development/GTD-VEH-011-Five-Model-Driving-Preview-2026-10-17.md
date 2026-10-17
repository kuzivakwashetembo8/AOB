# VEH-011 — Five-model owner-GLB driving preview

**2026-10-17 — Implementation in review branch; actual drive acceptance pending.**

## Scope
Drive **Ferrari**, **Range Rover Sport**, **Toyota Hilux**, **Land Rover Defender 001** and **Dodge HP**. The Buggy remains excluded from this *five-model preview only* because its external source stalled beyond the 60-second startup budget. Sedan and ergoninane remain out of scope. No color variants, traffic AI, geometry replacement or city expansion.

Existing Rapier `FirstDriveTrial` is used for every imported original. The first two cars retain their existing controls; the three new ones receive vehicle-class identifiers, `+Z` authoring-axis calibration, ground/curb collision, acceleration, reversing, steering, brakes, exit clearance and third-person following camera. Each successfully created dynamic actor transfers collider ownership from its one parked static collider. All five can be approached locally and driven with F / keyboard or touch controls.

## Wheel graphics honesty
The owner-supplied Defender 001 binary has **one combined render mesh** and no independent wheel nodes (verified from actual GLB JSON). It can be physically steered and driven, but rotating genuine isolated wheel parts requires additional mesh-part separation and visual approval. The new `prepareNativeFleetWheelRig` attempts a non-destructive measured four-wheel pivot mapping on Hilux/Dodge only if their real mesh hierarchy independently exposes all four tires. Otherwise it reports zero validated pivots and **does not fabricate geometry or spin the chassis**. This is a known review limitation: do not describe unsupported wheel animation as accepted.

## QA acceptance checklist
For each model: enter at parked location, forward/backward, turn left/right, steer visually, observe road contact and collision, stop and exit using F, re-enter without duplicate ghost colliders, check camera and seated Voight pose. Inspect wheeled motion separately; note missing/incorrect wheel rig or heading for source models. Confirm no regressions in accepted Rover/Ferrari; keep previous 60-second startup target. Screenshots on real desktop/mobile are required for visual signoff.

No changes promoted to `main`. Model branding/redistribution rights not validated.
