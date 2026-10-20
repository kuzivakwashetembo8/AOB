# GTD GLB asset registry

All source and generated GLBs belong under `public/GLBs/`.

| Directory | Purpose |
| --- | --- |
| `Cars/` | Six owner-supplied original vehicle models (binary unchanged) |
| `Cars/Generated/` | Wheel-rigged derivatives generated at build time |
| `Nature/` | `leaves.glb`, original 3D foliage |
| `Characters/` | Verified `ual.glb`, staged at build time |
| `Experimental/` | `ergoninane-fast-71.glb`, retained inactive |
| `Infrastructure/` | Reserved for infrastructure models |

`public/` becomes the web origin root. Runtime asset URLs therefore begin with `/GLBs/`. New GLBs must be placed into an asset-type category, never in the `public/` root or in per-file directories. The eight source files were moved via their original Git blob SHA without re-encoding or changing their bytes. The build scripts also place generated models under this directory.
