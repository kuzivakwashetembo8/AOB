# WORLD-003 L3 — WebGL2 Light Uniform Budget for Ground Infill

**Date:** 2026-10-14 | **Status:** preview-only; owner visual gate outstanding.

## Observation
Two consecutive previews render brown/black terrain rather than the
procedurally generated pavement, parking and grass, even though
NullEngine vertex/count assertions all passed.

The October 14 user-supplied browser console shows repeated Babylon
`Unable to compile effect` and:

`VERTEX shader uniform block count exceeds GL_MAX_VERTEX_UNIFORM_BUFFERS (12)`

The failing shader defines `LIGHTCOUNT 17`, reflecting the complete
South Ward lighting set. A 17-light StandardMaterial shader needs more
UBO bindings than the GPU allows; geometry can exist but never render.

The Vercel protected-preview `manifest.webmanifest` CORS/SSO warning is
separate and does not explain the missing rendered surfaces.

## Correction
Cap `maxSimultaneousLights=3` on the **four generated parcel
materials only**: paving, parking, grass and parking paint. This uses the
three main environment lights (ambient, night-fill, sun) and avoids
attempting shader compilation for 17 local lights. Keep the existing
ground-plane heights, normal/winding, city-derived land-use planner,
collision, character, roads, buildings and world lighting untouched.

Test with a NullEngine scene containing 17 PointLight sources to assert
the material light budgets. Browser WebGL2 compile and visual rendering
remain the **mandatory acceptance gate** because NullEngine does not
enforce device uniform-buffer limits.

## Acceptance
From the same Mercer Street aerial position, confirm actual pavement,
parking markings and grass fill previously unpainted gaps, including
the block beside the public space. Confirm both daytime and nighttime
surface visibility without shader errors and that the existing night
lighting and vehicle/flight controls remain unchanged.
