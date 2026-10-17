# VEH-009/010 — Five-model static visual review

**17 October 2026 | Visual acceptance pending.**

## Owner GLB sources

- `public/Land rover defender 001.glb` — 426,228 bytes, original asset.
- `public/dodge_HP.glb` — 1,954,504 bytes, original asset.

These additions complete the provisional five-model vehicle family: Ferrari, Toyota Hilux, Range Rover Sport, Defender 001, Dodge HP. Their names follow the original source labels; the exact Dodge variant is unverified. Buggy is excluded from the planned ambient-traffic fleet. The delegated Sedan and `ergoninane-fast-71.glb` are not loaded.

## Mercer visual-review lineup

- Range Rover Sport: x = -5.45, z = 10.55; **drivable, unchanged**.
- Toyota Hilux: x = -13.45, z = 10.55; **static, unchanged**.
- Ferrari/Buggy: imported legacy parking positions and driving behavior **unchanged**.
- Defender: x = -31.90, z = 10.55; **static, new**.
- Dodge HP: x = -39.70, z = 10.55; **static, new**.

The new originals load on normal `/game` through the existing parked-GLB path with original materials and textures, bounds-derived scale, correct road positioning and collision acquired only after successful import. New GLBs never receive Range Rover wheels, seat rig or player-driving logic. Spacing is tested against First Light street fixtures and other parked vehicles. Existing First Light city geometry, time of day, lighting, spawn and gameplay remain unchanged.

The existing LOAD-061 startup recorder automatically includes each new asset and its measured import time. **Do not interpret full suite success as visual acceptance.** Inspect desktop and mobile screenshots for model quality, orientation, road contact, proportion, clearance and occlusion before promoting to main or developing color variants.

## Scope hold

No traffic AI, 125-vehicle fleet, city expansion, paint variants, procedural replacement geometry or unverified optimizations. Commercial reuse rights for branded third-party car models have not been established.