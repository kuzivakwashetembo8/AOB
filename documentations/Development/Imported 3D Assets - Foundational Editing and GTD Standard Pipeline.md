# Imported 3D Assets — Foundational Editing and GTD Standard Pipeline

**Status:** APPROVED DEVELOPMENT METHODOLOGY (2026-10-10). Per-asset art, performance, license and production release remain separate decisions.  
**Scope:** cars, streetlights, lamp heads, utility poles/posts, traffic signs, bollards, street furniture, vegetation and eventually architecture.  
**Canonical authority:** Meridia First Light Implementation Plan; Meridian Game World Development SOT; FL-4 Technical Implementation Plan.  
**Companion proof:** Development/Imported Vehicle Benchmark - Experimental Evidence to Development Acceptance.md.  
**Safety boundary:** Publicly accessible source or a fork does NOT supply permission to redistribute/edit its art commercially.

## 1. Core design principle

An imported GLB can be an **excellent foundational building block**, not necessarily a final asset. A source model may already offer real automotive silhouette, panel curvature, distinct glass/rubber/paint materials, lamp reflectors, wheel arches and pivots. GTD can evaluate these structures **without requiring locally installed Blender**. A browser game does not have to construct every asset from simple Babylon.js primitives.

However, rendering a file is different from creatively owning its appearance, controlling its semantics, or having a license to ship it. The long-term goal is an **original or appropriately licensed GTD-standard representation**, made by modifying a lawful source or authoring a new object, preserving useful metadata and physics separation, then testing it in Meridian.

The user-approved imported off-road buggy and sports car are now **development-only reference vehicles**. Their acceptable in-world shape/scale is locked, but commercial rights, trademarks, performance and release readiness are NOT established.

### Separate these three layers

1. **Asset authoring:** create or lawfully transform mesh topology, UVs, textures, normals, geometry, animation and material content, using a browser platform, licensed library, scripted generator or workstation modeling.
2. **Asset delivery and ingestion:** save validated GLB/glTF (or other supported format), track provenance/version, load it into Babylon.js, normalize coordinates and metres, share resources and make it render.
3. **Game representation:** attach stable semantic IDs, procedural placement, collision, camera rules, lighting, animation hooks, interactivity and measurable performance. An asset is not game-ready merely because its triangles rendered.

A browser-hosted GLB is editable at the scene graph/material level if nodes are exposed. Editing its **actual shape** often requires manipulating/replacing vertex geometry in an editor or custom authoring pipeline and re-exporting a new GLB. Converting it to React Three Fiber JSX using gltf.pmnd.rs is NOT a prerequisite for GTD/Babylon.js, nor does that conversion transform copyrighted geometry into an original model.

## 2. Seven reusable acceptance gates

### G0 — Identify the real problem BEFORE researching assets
What object must a gamer infer, at which camera angle and distance? What function is required now and what may follow later? What is the accepted level of fidelity versus the surroundings? Who owns physics, lighting and animation? Which comparative measurements will make a decision possible?

Examples: a civilian four-door must be identifiable on grass; a lamppost must have convincing mast/luminaire silhouette at normal street distance and illuminate at night; a bollard must align visual and player collision. Do not select assets by marketplace thumbnail alone.

### G1 — Provenance and edit rights
Record maker, original publication, file location/hash/version, textures, source format, model attribution, commercial game redistribution, derivative/modification rights, trademarks and logos. Classify as ORIGINAL, LICENSED FOR INTENDED USE, or RIGHTS UNRESOLVED — DEVELOPMENT ONLY. A public GitHub fork does not prove the underlying model was released under the repository's code license. A model may have a license but its branded badges could require separate review. If permission is missing, use the model only as a controlled technical comparison; create an original production equivalent from a lawful starting point.

### G2 — Inspect the unmodified original in isolation
Use a browser orbit viewer with front, side, rear, elevated and three-quarter views. Capture:
- source bounding dimensions and units, axes, pivot, natural floor/ground contact;
- triangle and mesh count, UVs/normals, hierarchy, material slots, transparent surfaces and animated nodes;
- GLB byte size, texture sizes and compressed decoder requirements;
- copyright/licensing data and editable master availability.

Document what is observed, measured, estimated and unknown. Do not claim a competitor's topology or polycount solely from screenshots.

### G3 — Normalize the asset to Meridian City
GTD's game-scale convention is **one world unit per metre**, unless a subsystem intentionally converts it. Convert intrinsic dimensions to class-appropriate target dimensions; align the intended forward axis, origin/pivot and ground contact; place using stable semantic street/lot IDs and authored yaw. Prefer uniform scaling while calibrating because anisotropic scaling can distort tires and glass. Controlled axis corrections may be tested with labeled hypothesis IDs but must not silently become original-model dimensions.

Confirm pavement/curb clearance, lane width, Voight height, accessible walking and nighttime lighting. Keep Rapier colliders separate from imported visual meshes. A simple static cuboid or compound body is a deliberate approximation, not the vehicle's exact physics.

### G4 — Make it a semantic, editable GTD object
Rather than sprinkling GLB-specific mesh-name checks into city generators, define one internal representation contract.

Proposed conceptual fields:
- assetId and original semantic game-world ID;
- assetClass, modelRevision and rightsStatus;
- source URL/hash, original editable master, authored local axes;
- dimensions in metres, pivot/ground-contact anchor, named component nodes;
- material roles (bodyPaint, glass, rubber, brushedMetal, lampLens, weathering);
- collision role and physics ownership;
- optional light/emissive behavior and animation pivot hooks;
- instancing/LOD profile, loading fallback, cleanup/disposal responsibilities.

**This is a documentation schema concept, not an already implemented GTD interface.** First-class source components are important: four independently transformable wheel pivots are a foundation for eventual drivable cars; lamp pole and luminaire are separate foundations for daytime geometry and controlled nighttime illumination; road-sign face and mast should remain individually replaceable. Use stable semantic IDs to avoid coupling gameplay to unstable exported mesh names.

### Editing ladder — from least to most invasive

| Target edit | Production technique | Required verification |
|---|---|---|
| Paint tint / metal or rubber roughness | Bound material slot overrides; shared immutable material templates | No unintended tint on glass/lights and no excess material duplicates |
| World scale, mounting angle, origin | Root transform and approved spatial contract | Lane/curb/Voight comparisons, stable collisions |
| Detail change, lens, sign face, rim or plate | Replace independently named components; legal original/permissioned material | Matching normals, silhouettes, light semantics, texture rights |
| Shape/body/silhouette change | Author/edit mesh geometry or a new original model, export fresh versioned GLB | Front/side/rear and close distance acceptance |
| UV/weathering/shading | Reauthor textures and PBR/normal/occlusion inputs | Day/dusk/night coherence; mobile resource cost |
| Motion/interaction | Named pivot hierarchy and independent game physics | Owned state, simulation and lifecycle QA |
| LOD, compression, instancing | Profiled production-asset optimization | Same-view quality, batch count and device p50/p95 |

**Critical:** Recoloring or slightly scaling a Ferrari cannot make it an original everyday Meridian fleet sedan. A derivative mesh may still require permission. The GTD-standard vehicle must have intentionally authored four-door sedan proportions, neutral/unbranded identity and fully cleared usage.

### G5 — Measure in the actual game
Profile cold and cached loading, decompression, materials/shaders, meshes/draw calls, triangles/indices, shadow casters, textures and approximate memory where supported, p50/p95 frame/render time, runtime disposal, re-entry and instance scaling. Run baseline and imported versions using **the same build, scene, time, viewport/backbuffer, device and traversal**. Test desktop and real landscape mobile independently. Treat hardware GPU/thermal measurements unavailable through browser APIs as UNAVAILABLE rather than inferred. Correct an observed bottleneck only after evidence warrants it.

Test both visual and physical interactions around Voight, sidewalk, curb, road, garage, camera occlusion and repeatable collision registration; rendering success alone is not a physics acceptance result. If 1–2 specimens perform acceptably, that does not prove ten or hundreds of copies are acceptable; use a separate, bounded multi-copy trial.

### G6 — Produce the GTD-owned result and govern release
Keep the original or licensed source master with legal evidence, the GTD-editable representation, exported GLB, semantic asset metadata, calibration report, quality screenshots, performance data and tests under version control or an explicitly associated asset store. Accept a candidate only after both its fidelity and device impact are reviewed. Respect required credits and derivative rights. Host cleared binaries on a stable application/CDN origin for releases; do not rely indefinitely on a raw third-party GitHub file endpoint.

Distinguish flags: TECHNICAL DEVELOPMENT ACCEPTED, VISUAL APPROVED, PERFORMANCE ACCEPTED, RIGHTS VERIFIED, and PRODUCTION RELEASE AUTHORIZED. They are **separate**; passing one never grants the others. Preserve a fallback to previously accepted geometry if asset loading fails.

## 3. Concrete template: imported lamp posts and utility poles

**Problem:** A Meridian streetlight should look like a convincing metal post/arm/luminaire while supporting the already approved realistic night lamp radius. The representation must repeat across streets and maintain walkable sidewalk clearance.

**G0:** Identify street width, existing generated pole anchor, approximate Voight-to-pole proportions, daytime silhouette, dusk/night visual light state and desired collision.
**G1:** Verify asset creator, mesh and textures licensing, whether the fixture may be edited and used in the intended release.
**G2:** Inspect post base, taper, arm bend, lamp head, protective glass, materials/UVs and natural upward axis. If simple mast geometry is sufficient, procedural production may be more efficient than complex import.
**G3:** Position on the existing deterministic streetlight ID, convert to metres, align arm relative to curb and road, keep lamp height and footpoint consistent. Check the lamp does not intersect a building, sidewalk path or roadway.
**G4:** Split conceptual roles: poleMast, baseFlange, outreachArm, luminaireHousing, lampGlass/emissiveLens and optional attachPoint. Replace individual components via an authored GLB or code-generated module. The pole's physics remains a simple mast collider if reachable.
**G5:** Drive illumination from the existing Meridian time/environment controller, not an independently invented time cycle. Do not add an expensive shadow-casting light for every object unless profiling validates its need. Compare day/night screenshot and light pool radius; benchmark one post and multiple copied posts.
**G6:** Apply GTD material/geometry style, confirm license/original geometry, archive source and acceptance, retain prior pole representation as rollback.

For **traffic signs**: keep face/decal, post, optional retroreflection and collision distinct. For **utility poles**: keep shaft, brackets/crossarms, wires and collision semantics distinct; avoid implementing a citywide cable network before its own plan. For **bollards/posts**: favor clear simple geometry with precise player collision and repeat instancing. For **trees**: imported foliage is optional and must demonstrate a tangible advantage over the user-accepted canopy geometry, especially on mobile. For **buildings**: loaded shells are not automatically enterable; author real door/portal/wall openings and independent Rapier/camera obstruction. One generic GLB pipeline should not erase these class-specific behaviors.

## 4. First GTD-original civilian sedan path

The existing imported buggy and Ferrari examples remain accepted **development-only references**, not the fleet-sedan art selection. The target first original vehicle is a plain compact-to-midsize four-door with older angular structural readability and restrained softened modern surfaces; one body/trim geometry, paint color variations only, separate wheel pivots, clear front and rear facade, proper tires/windows/mirrors and future-driving extension hooks. Evaluate a Spline/browser-authoring workflow, rights-cleared editable source, code-generated master or optional remote/desktop Blender as **competing asset-authoring methods**, not assumptions that must be settled before visually testing output.

A distinctive GTD sedan must pass **standalone recognition** off-road, at side/front/rear/three-quarter distances, and the Drive Quest **minimum perceived vehicle quality** benchmark, then fit actual Meridian streets without toy proportions or curb encroachment. Once source/rights are correct and performance is measured, graduate it independently into the development vehicle family; eventual drivable mechanics are a separate authorized phase.

## 5. Failure modes and checklist

- Public demo or fork alone ≠ commercial/derivative rights.
- gltf.pmnd.rs can convert an existing GLB for Three.js React use; it is not an automatic sedan marketplace or a required Babylon converter.
- Prompt-generated meshes do not automatically possess correct topology, wheels/pivots, texture rights, exported material compatibility or game-ready LOD.
- Imported appearance ≠ mobile performance, memory, physics or world-wide scalability.
- The current proxy-to-GLB abrupt appearance transition is an observed loading UX defect to address before production, not proof of bad car geometry.
- **Never measure only the accepted enlarged vehicle**; compare identical scene/build/hardware conditions, preserve raw reports and attribution.
- **Never silently stretch a branded vehicle into a final GTD sedan**; geometry redesign and IP clearance remain real work.
- Maintain provenance/hashes, material editing rights, semantic IDs, original and derived asset revisions, collision accuracy, saved matched screenshots, device cost and explicit development-versus-production acceptance status.

The development implementation of EXP-VEH-001 gives reusable engineering patterns: lazy glTF loading; AssetContainer templates; cached instance clones; semantic parked IDs; root-axis normalization; scale telemetry; per-object Rapier collider replacement; original visual fallback; and disposal. Generalize these patterns cautiously, preserving clean boundaries between vehicle/streetlight/tree/building semantics, instead of inserting all props through a one-size-fits-all object loader.

**Decision:** An imported real-time 3D asset is a valid GTD foundational *development* component and legitimate source of creative/technical exploration. It becomes a **GTD-standard production component** only once it is adapted into GTD identity, backed by clear source and usage rights, integrated with physics/lighting/interaction, and accepted against actual game-device evidence. This does not discard code-generation or procedural alternatives.
