# GTD-RND-MAT-004 — Building Surface Families and 100 Surface Types

**Date:** 2026-10-13 (SAST)  
**Classification:** OWNER-APPROVED TAXONOMY / SURFACE ART-DIRECTION REGISTRY  
**Authority:** owner accepts ten deliberately distinct major wall-material families with ten candidate surface types each (100 in total).  
**Asset status:** WALL-01 / BRK-01 is already approved and committed as the first image-derived building design surface; **all other 99 types are catalogue definitions only**, not sourced, generated, committed or deployed.  
**Repository baseline:** production main at \`2833566fb10b69e9df815bc7114188a25e4fba86\`. This standalone documentation lives on the documentation branch until any separately approved promotion.  
**Related:** GTD-RND-MAT-001/002/003; GTD-WORLD-003 six-system audit and implementation plan.

## 0. Identity, scope and governing principles

A **wall family** is an architectural base material with its own physical appearance and rendering needs. A **surface type** is a distinctive construction/finish configuration **within** that family. A specific surface asset (WebP/normal/roughness etc.) is a later, versioned deliverable; cataloguing a type never implies an image or material shader is already available.

**Design rule:** adjacent wall families must have clearly different physical visual identities. Within every family the ten ordered types should differ perceptibly in **at least one meaningful characteristic**—material treatment, unit geometry, grain, joint rhythm, age, reflectance, transparency, fabrication or colour—not merely by a subtle tint. Variations can share a family without pretending to be ten different source-material chemistries. Realistic regional architecture and owner creative review outweigh exhaustive usage of the catalogue in any one district.

**Code naming:** \`WALL-01..WALL-10\` for family, \`BRK/TIM/GLS/STN/MET/RND/CON/CMU/CER/CMP-01..10\` for its surface type. IDs are immutable; changing the rendered look after approval should produce a versioned asset rather than silently change the identity. Future registration should distinguish \`familyId\`, \`surfaceTypeId\`, \`assetId\`, \`scalePresetId\`, \`buildingId\`, \`facadeRole\`, \`revision\` and \`provenance\`.

**Rendering doctrine:** A photographed/generated **base-colour image** is appropriate for opaque masonry or wood when tested for seamless repeats. **Real glass is not opaque photography**; it needs appropriate transparent/reflective/optical materials, pane geometry, plausible framing and device fallbacks. Metal needs lighting response/roughness and sometimes true profile geometry. Profiles, perforation, ribbing, battens, masonry mortar relief and panel openings may need actual geometry or separate normal maps rather than a flattened illustration. No photo may fabricate a real door/window opening or collision. Protect the current approved WebP, garage door, real windows, player and vehicle physics.

## 1. The ten wall families — definitive taxonomy

| ID | Family | Short visual identity | Distinction from the preceding family |
| --- | --- | --- | --- |
| WALL-01 | **Brick masonry** | Small fired-clay modules, coursed mortar, natural face variation | First family; accepted current reference |
| WALL-02 | **Timber / wood cladding** | Organic grain, long boards, natural fibrous direction | Organic continuous planks instead of mineral blocks |
| WALL-03 | **Glass wall systems** | Transparent, translucent, highly reflective panes | Optical depth and reflection instead of opaque wood grain |
| WALL-04 | **Natural stone masonry** | Heavy natural mineral texture and fractured/cut rock | Rough solid geology instead of smooth optical glazing |
| WALL-05 | **Metal cladding** | Thin formed sheets, metallic light response, ribs/joins | Lightweight manufactured sheet instead of heavy stone |
| WALL-06 | **Stucco / plaster / render** | Continuous matte/trowelled mineral-coated wall | Monolithic coating instead of segmented metallic panels |
| WALL-07 | **Cast / precast concrete** | Structural-looking formed surfaces, pour/form marks, slab seams | Hard formed/cast mass instead of softer final render coat |
| WALL-08 | **Concrete block / CMU** | Large manufactured masonry units and pronounced block bond | Independently laid modular blocks instead of poured panels |
| WALL-09 | **Ceramic / terracotta tile and panel** | Fired glossy/matte tiles and terracotta rainscreens | Fine or decorative fired skins instead of structural CMUs |
| WALL-10 | **Composite / fiber-cement / manufactured board** | Lightweight layered, smooth sheet/plank systems | Engineered sheet assembly instead of ceramic units |

The order is a **visual contrast sequence**, not a literal construction-history hierarchy. Material compatibility, realistic placement, climate and building type must still be validated.

## 2. WALL-01 — Brick masonry — BRK

**Distinguishing characteristics:** fired-clay brick faces with legible individual units, realistic mortar, aligned physical-size tiling and variable age/firing/finishing. Continue the owner's successful orthographic, physically tiled material approach. BRK-01 is immutable as the accepted anchor; styles 02–10 require source investigation and image work.

| Surface ID | Surface type | Distinctive texture, colour and plausible application |
| --- | --- | --- |
| **BRK-01** | **Standard warm-red running-bond brick** | **ACCEPTED BASELINE.** Natural red/terracotta with subtle warm-brown variation, tactile fired-clay grain, grey mortar and regular staggered courses; fits the South Ward apartment and garage. Source: \`public/brick-wall-image.webp\`; \`compactA\` apartment / \`standardB\` garage. |
| BRK-02 | Dark red-brown weathered brick | Deep oxide red, umber staining, softened and occasionally pitted faces; older apartment and workshop elevations, noticeably darker and more aged than BRK-01. |
| BRK-03 | Orange multi-tone stock brick | Bright burnt orange with alternating ochre and medium brown bricks, irregular kiln tones and gritty edges; vibrant utilitarian masonry instead of uniformly weathered darkness. |
| BRK-04 | Buff / yellow stock brick | Sandy yellow, honey and pale ochre units with powdery porous faces and warm mortar; strong hue shift from orange-red masonry, suitable for institutions or older shops. |
| BRK-05 | Salmon / pink handmade brick | Muted salmon, pink clay and dusty peach colours, gently uneven hand-formed faces and softer edges; more delicate and irregular than squared buff stock brick. |
| BRK-06 | Dark brown clinker brick | Over-fired burnt brown, purplish-black flashing, hard warped edges and occasional glassy vitrified flecks; dramatic heavy texture, unlike soft handmade pink brick. |
| BRK-07 | Charcoal / black engineering brick | Dense graphite/charcoal near-black units with crisp edges, low colour noise and precise fine joints; controlled industrial appearance instead of irregular over-fired brown clinker. |
| BRK-08 | Pale cream sand-faced brick | Warm ivory, cream and off-white faces with visible sandy granular coating and modest dark joint contrast; high-value light facade in opposition to charcoal. |
| BRK-09 | Reclaimed aged mixed brick | Deliberately heterogeneous red, faded orange, soot-brown and lighter replacement units, chips, patched joints and repair chronology; visibly reused wall rather than uniform new cream brick. |
| BRK-10 | Painted / whitewashed brick | Brick bonds remain visible through chalky white/limewash or partly weathered painted coverage; paint pooling, uneven opacity and exposed chips shift emphasis from raw reclaimed clay to applied finish. |

**Research and generation order:** BRK-02 → BRK-10; no new assets are implied. For each: collect rights-valid visual references, decide unit geometry and colour range, generate/source the orthographic swatch, fix horizontal/vertical repeat borders, inspect 2×2 + 3×3 samples, establish metres-per-tile, optimize WebP, compare day/night, owner approve, commit and register. Keep accepted BRK-01 pixel and source identity unchanged.

## 3. WALL-02 — Timber / wood cladding — TIM

Timber is identified by **continuous grain, plank direction and joinery** rather than masonry coursing. Grain repetition and wood species variation must remain credible; avoid using image-only projections for open slats that need real gaps.

| Surface ID | Surface type | Distinctive appearance and use |
| --- | --- | --- |
| TIM-01 | Natural vertical cedar-style boarding | Honey/red-brown narrow upright boards, parallel organic grain and slim vertical joints; warm residential facades. |
| TIM-02 | Silver-weathered horizontal lap siding | Weather-grey, UV-bleached overlapping horizontal boards with shadow lines; coastal/aged residential character opposite TIM-01 orientation and colour. |
| TIM-03 | Charred black timber cladding | Deep black carbonized grain, subtle glossy ridges and controlled soot-tone variation; dramatic dark finish contrasting silver patina. |
| TIM-04 | Soft-colour painted shiplap | Smooth pastel or muted painted boards with shallow routed lap joints and small paint wear; applied colour replaces scorched visible grain. |
| TIM-05 | Rough reclaimed mixed-width planks | Salvaged browns, splinters, nail marks and uneven plank widths; materially patchy repair-history look rather than uniform painted siding. |
| TIM-06 | Narrow hardwood vertical slat screen | Closely spaced straight stained hardwood battens, crisp dark gaps and refined linear rhythm; open slat geometry may be required, unlike broad rough boards. |
| TIM-07 | Cedar-like timber shingles | Small overlapping tapered wood tiles with staggered joints and weathering at lower edges; a granular scalloped/shingled facade rather than slats. |
| TIM-08 | Exposed structural plywood panel | Large flat amber layered wood sheets with recognizable broad veneer and sheet join lines, knot/patch defects; panel-based utilitarian look rather than shingles. |
| TIM-09 | Cross-laminated timber architectural panels | Broad engineered light-tan laminations, regular layer/board boundaries and precise manufactured appearance; clean structural timber vs rough plywood. |
| TIM-10 | Dark stained board-and-batten | Wide planar boards interrupted by narrow raised vertical cover battens, deep espresso or olive stain and strong projected seams; distinct three-dimensional joint pattern. |

## 4. WALL-03 — Glass wall systems — GLS

GLS surfaces are **material/shader and actual pane-system briefs**, not simply photographic opaque diffuse textures. Evaluate transmission/refraction approximation, reflection, performance, framing and visibility/occlusion with real building geometry.

| Surface ID | Surface type | Distinctive appearance and use |
| --- | --- | --- |
| GLS-01 | Neutral clear vision glass | Low-tint transparent panes with restrained environmental reflections and visible interior silhouette; standard commercial storefronts. |
| GLS-02 | Blue-green solar-control glass | Noticeable cool aqua/blue absorption and selective reflectivity; modern office glass with controlled colour versus neutral clear. |
| GLS-03 | Low-iron ultra-clear glazing | Minimal green edge tint and maximum apparent colour fidelity, crisp optical surface; display/civic uses, visibly clearer than solar-coated glass. |
| GLS-04 | Mirror-silver reflective glazing | High reflectance, subdued view into interior and strong sky/environment imagery; facades reading mirror rather than transparent display. |
| GLS-05 | Smoke-grey tinted glass | Deep charcoal tint, low visible transmittance and subdued reflectance; restrained privacy panels unlike bright mirror silver. |
| GLS-06 | Ceramic-frit dotted glass | Repeating high-contrast dot/grid frit pattern applied to transparent glazing for shade/visual modulation; regular opaque micro-pattern. |
| GLS-07 | Acid-etched / frosted privacy glass | Soft diffuse translucent appearance, blurry forms and almost no legible background detail; privacy instead of discrete frit dots. |
| GLS-08 | Wired industrial safety glass | Visible embedded crosswire mesh behind slightly distorted glass; old factory/warehouse glazing different from uniformly frosted surface. |
| GLS-09 | Profiled channel-glass wall | Deep vertical U-profile translucent glazing with repeated thick rib shadows; potentially distinct pane geometry, unlike flat wired glass. |
| GLS-10 | Textured glass-block wall | Square thick translucent blocks with substantial mortar/silicone grid and refracted bubbly depth; physically modular wall unlike continuous vertical channel glazing. |

## 5. WALL-04 — Natural stone masonry — STN

Natural rock variation should be geology-plausible. Do not confuse quarried stone with fired ceramic imitation; joints and block size matter as much as veining.

| Surface ID | Surface type | Distinctive appearance and use |
| --- | --- | --- |
| STN-01 | Warm limestone ashlar | Regular rectangular cut blocks in pale beige/cream, fine fossil speckling, deliberate thin joints; refined civic stone. |
| STN-02 | Rustic mixed fieldstone | Rounded/angular irregular stones of mixed grey, moss and tan with thick mortar infill; uncoursed rugged finish distinct from cut limestone. |
| STN-03 | Rough split-face granite | Grey salt-and-pepper crystalline stone blocks with sharp fractured projections and coarse shadow; harder, angular texture than fieldstone. |
| STN-04 | Thin stacked slate | Dark blue-grey thin stratified ribbons, narrow dry-stack joints and layered edges; long horizontal flakes rather than granite chunks. |
| STN-05 | Golden bedded sandstone | Warm yellow/rust sedimentary strata, long sawn courses and soft erosion patterns; bright layered sediment instead of dark slate. |
| STN-06 | Black basalt rubble | Dense volcanic charcoal/black blocks with fractured matte edges and occasional porous specks; substantial dark mineral shift from sandstone. |
| STN-07 | Silver quartzite ledgestone | Pale steel-grey sparkling jagged layers, mica/quartz flecks and thin angular planes; reflective crystalline ridges rather than matte basalt. |
| STN-08 | Honed travertine slabs | Cream/tan porous stone in large flat rectangular slabs with natural filled/unfilled linear voids; highly planar versus layered quartzite. |
| STN-09 | Red-brown porphyry blocks | Small dark garnet/purple-red volcanic stones with mineral inclusions and squared stone bond; saturated masonry distinct from light smooth travertine. |
| STN-10 | White-grey veined marble cladding | Large finely jointed smooth light panels with continuous charcoal vein network and polished/honed highlights; low-profile premium stone skin rather than rough red blocks. |

## 6. WALL-05 — Metal cladding — MET

Real sheet thickness, fold geometry, perforation and true metal shading matter; image-only fake gaps/perforations are not a substitute where see-through is needed.

| Surface ID | Surface type | Distinctive appearance and use |
| --- | --- | --- |
| MET-01 | Galvanized corrugated sheet | Silvery zinc-spangle surface with broad sinusoidal raised ribs and horizontal weather stains; industrial/farm service walls. |
| MET-02 | Painted standing-seam steel | Deep coloured smooth tall metal pans with thin raised interlocking seams, refined regular profile instead of corrugated waves. |
| MET-03 | Weathering Corten-style steel | Saturated orange rust patina, mineral runoff streaks, varied oxidized plates with occasional exposed edges; warm aged steel rather than intact paint. |
| MET-04 | Perforated anodized aluminum screen | Crisp regular round/slot openings and cool matte metallic reflectivity; semi-transparent perforated shading system vs solid rusty sheet. |
| MET-05 | Brushed stainless steel panels | Cool bright silver, linear micro-scratches and subtle specular streaks on broad flat panels; unperforated high reflectance. |
| MET-06 | Expanded steel mesh | Diagonal diamond apertures and narrow twisted strands casting layered shadows; open industrial lattice vs planar stainless. |
| MET-07 | Deep box-rib factory panels | Coloured/galvanized angular trapezoidal ribs with pronounced regularly spaced shadows; robust roof/wall profile versus thin mesh. |
| MET-08 | Pressed diamond-checker steel plate | Dense raised lozenge grip relief on dark or galvanized panels with abrasion; small-scale embossed texture rather than longitudinal ribs. |
| MET-09 | Patinated copper sheet | Varied verdigris green/turquoise and warm oxidized copper seams, subtle hammered surface; characteristic chemical ageing versus dark tread plate. |
| MET-10 | Anodized aluminum cassette facade | Large precisely separated satin metallic cassettes with crisp reveal joints and controlled silver/bronze tint; modern flat manufactured module unlike patchy patinated copper. |

## 7. WALL-06 — Stucco / plaster / render — RND

This family covers applied **continuous wall coatings**, not separately laid blocks or factory sheet panels. Thickness, trowel mark and surface age matter.

| Surface ID | Surface type | Distinctive appearance and use |
| --- | --- | --- |
| RND-01 | Smooth painted exterior render | Fine almost flat off-white or warm neutral matte surface with tiny roller texture; clean modern residential facade. |
| RND-02 | Sand-float stucco | Medium granular sandy grit distributed evenly in a soft beige or pale earth pigment; palpable grain relative to smooth RND-01. |
| RND-03 | Scraped directional render | Distinct linear scraped/trowelled grooves and rough shedding texture, directional light shadows; organized scratches vs uniform grain. |
| RND-04 | Traditional pebbledash | Embedded small mineral pebbles creating coarse knobbly high-relief matte finish; pronounced projected aggregate vs shallow scrape marks. |
| RND-05 | Aged limewash render | Chalky soft white layer over uneven substrate with mottled translucency, drips and patchy faded pigment; old soft patina rather than coarse pebble. |
| RND-06 | Polished Venetian-style plaster | Smooth layered marble-like colour shifts and waxed highlights with no strong mortar lines; refined sheen instead of powdery limewash. |
| RND-07 | Swirled hand-trowel plaster | Obvious crescent/arc finishing strokes with directional shadowing and warm chalk pigment; handcrafted texture vs slick polished finish. |
| RND-08 | Dash roughcast render | Coarse splashed cement/grit droplets, irregular clumps and rugged greyish field; randomness replacing intentional circular trowel marks. |
| RND-09 | Hairline-cracked aged painted stucco | Fine branching shrinkage cracks, flaking paint and discoloured repair patches on still mostly flat surface; age damage without heavy dash aggregate. |
| RND-10 | Earth-pigmented mineral render | Saturated clay/ochre/terracotta body colour with lightly layered trowel patina and mineral variation; finished pigmented monolith distinct from peeling painted stucco. |

## 8. WALL-07 — Cast / precast concrete — CON

These are concrete **poured into forms or cast as large panels**, not individual hollow masonry units. Panel joint placement and structural scale should be faithful.

| Surface ID | Surface type | Distinctive appearance and use |
| --- | --- | --- |
| CON-01 | Smooth precast concrete panel | Large pale/cool grey flat slabs, chamfer/reveal lines and subtle casting pores; ordered manufactured facade panels. |
| CON-02 | Horizontal board-formed concrete | Recognizable wood plank formwork grain and evenly spaced horizontal pour impressions; textural grain vs smooth precast. |
| CON-03 | Exposed coarse aggregate concrete | Visible embedded river-stone pebbles and chipped aggregate matrix; rough speckled body instead of wood-imprinted courses. |
| CON-04 | Bush-hammered concrete | Fine densely fractured chisel/punch stippling across the face, strong matte micro-relief without exposed large stones. |
| CON-05 | Deep fluted cast-concrete ribs | Broad vertically running moulded channels creating sculptural light/shadow and regular relief; form geometry unlike uniform hammering. |
| CON-06 | Acid-washed architectural concrete | Light softly etched cement skin with faint fine aggregates and a gentle dissolved-surface texture; subtle planar finish vs dramatic ribs. |
| CON-07 | Integral ochre/red pigmented concrete | Uniform-through-body warm clay/earth colour with pores and casting mottling, not painted masonry; colour-driven mass distinct from grey acid etch. |
| CON-08 | Rain-streaked aged cast-in-place concrete | Grey-brown pollution trails, faint rust runoffs, pour-band marks and local patch repairs; weather chronology rather than new colored cast. |
| CON-09 | Monumental large-joint precast grid | Massive rectangular panels with pronounced dark gasket/recess seams and anchoring hints; strong engineered module rhythm vs amorphous weathering. |
| CON-10 | Patterned form-liner relief concrete | Repeating geometric leaf/hexagonal/custom relief stamped into formed surface, shallow decorative cast shadows; intentional artwork rather than standard slab grids. |

## 9. WALL-08 — Concrete block / CMU — CMU

Block modules and **individually laid mortar-joint patterns** distinguish CMU from cast concrete. The family may include structural service blocks and decorative screen units but their physical openings must not be faked by opaque images.

| Surface ID | Surface type | Distinctive appearance and use |
| --- | --- | --- |
| CMU-01 | Standard grey smooth-face stretcher CMU | Medium-large industrial grey rectangular blocks in running bond, visible pale mortar; baseline utility wall. |
| CMU-02 | Split-face concrete block | Pronounced rock-like fracture texture on each unit, grey/charcoal high relief and large joints; rough dimensional transition from smooth CMU. |
| CMU-03 | Painted pastel concrete block | Opaque soft-colour coating over discernible regular block grid, small chips exposing substrate; controlled applied paint vs rugged natural split face. |
| CMU-04 | Ground-face polished architectural block | Smooth ground aggregate flecks, tight precision joints and semi-satin mineral sheen; precision polished stone-like look vs painted utility CMU. |
| CMU-05 | Lightweight aerated concrete blocks | Large pale-white porous AAC units, broad cut edges and unusually thin adhesive joint lines; light airy low-contrast modules. |
| CMU-06 | Stack-bond architectural CMU | Rectangular blocks stacked in vertical aligned columns with pronounced continuous joint grid; intentional construction rhythm vs narrow AAC mortar. |
| CMU-07 | Open lattice breeze-block screen | Repetitive hollow geometric CMU screen units with actual see-through openings and cast shadows; structural patterned ventilation rather than solid stacked blocks. |
| CMU-08 | Interlocking retaining-wall units | Large stepped concrete masonry blocks with sloping/offset retaining profiles and deep shadowed horizontal joints; massive earth-retention appearance vs open breeze blocks. |
| CMU-09 | Honed charcoal architectural CMU | Dark graphite block faces with subtle honed matte polish, precise exposed arrises and fine black joints; restrained modern dark masonry vs bulky retaining units. |
| CMU-10 | Earth-coloured integral-pigment block | Warm tan/rust concrete modules with visible mineral particles, natural colour-through-body and warm mortar; inviting unpainted masonry after strict charcoal. |

## 10. WALL-09 — Ceramic / terracotta — CER

Fired ceramic finish may be glazed, unglazed, large panel, hand moulded or thin tile. Ceramic is non-structural here unless separately engineered; do not imply a purely image-based rainscreen has support brackets.

| Surface ID | Surface type | Distinctive appearance and use |
| --- | --- | --- |
| CER-01 | Matte ceramic square tile | Small square pastel/stone-colour tiles with thin visible grout grid and diffuse glaze; legible regular small-unit baseline. |
| CER-02 | Glossy elongated subway tile | Narrow long rectangular white or saturated tiles in staggered bond with bright light highlights; different format and reflectance vs matte square. |
| CER-03 | Flat unglazed terracotta panel | Warm fired orange large unglazed rainscreen panels with earthy pore texture and strong straight joints; restrained large modules vs glossy small tile. |
| CER-04 | Ribbed terracotta baguette screen | Long narrow terracotta rods/tubes with deep open shadow gaps, warm clay form and linear rhythmic depth; geometry-driven slats vs closed flat panels. |
| CER-05 | Multi-colour glazed ceramic mosaic | Tiny irregular jewel-like tile chips in deliberately mixed blue/green/gold tones and dense grout; fine busy pattern vs large ribbed rods. |
| CER-06 | Geometric encaustic-pattern tiles | Repeating coloured pigment-inlaid square/cement-look ceramic tiles with bold geometric stars/angles; organized print motif instead of random mosaic. |
| CER-07 | Red-brown unglazed quarry tiles | Hard-wearing dense rustic rust-red clay units with very subdued lustre and robust joints; utilitarian matte field after vivid encaustic pattern. |
| CER-08 | Handmade zellige-style glazed tile | Small irregular hand-cut squares in shifting emerald/teal/ivory, nonplanar glossy faces and uneven grout lines; individual handcraft vs uniform quarry clay. |
| CER-09 | Crackle-glazed ceramic | Warm ivory/pale celadon glazed faces with distinct fine random crazing and subtle edge pooling; refined close-up surface vs highly uneven zellige. |
| CER-10 | Large-format porcelain facade slabs | Oversized slim satin panels with quiet mineral/cloud veining and few thin seams; monolithic manufactured rhythm vs small crazed units. |

## 11. WALL-10 — Composite / fiber-cement / manufactured boards — CMP

Engineered layered wall sheets and lightweight panel systems differ from fired ceramic. Some types require real thickness/fixings and special safety documentation. Their material properties, weather resistance and fire compliance are **not** inferred from appearance.

| Surface ID | Surface type | Distinctive appearance and use |
| --- | --- | --- |
| CMP-01 | Smooth fiber-cement architectural sheets | Flat pale-grey manufactured cementitious boards with crisp joints and barely visible pressed fibre grain; understated sheet-skin baseline. |
| CMP-02 | Woodgrain-embossed fiber-cement lap siding | Durable board siding embossed with timber-like grain, overlapping courses and painted earthy colour; organic-looking manufactured plank vs smooth broad sheet. |
| CMP-03 | Narrow fiber-cement weatherboard planks | Very slim regular horizontal strips with clear plank termination and fine shadow reveals, uniform modern coating; tight repetitive rhythm rather than broad fake woodgrain. |
| CMP-04 | High-pressure laminate (HPL) color panels | Saturated or boldly contrasting smooth phenolic laminate cassettes with sharp black shadow gaps; strong architectural colour vs restrained weatherboard. |
| CMP-05 | Natural-fiber phenolic cladding | Warm dark brown compressed-fibre sheet with subtle fibrous crosscut texture and weathered edges; organic resin board vs vibrant flat HPL. |
| CMP-06 | Translucent fiberglass-reinforced panels | Milky amber or pale-white FRP/GFRP laminate with fibres visible against backlight; light transmission and reinforcement pattern vs opaque phenolic. |
| CMP-07 | Molded glass-fiber reinforced concrete (GFRC) | Thin sculpted mineral-composite panels with curved repeat relief, pores and lighter-than-precast shell construction; opaque mineral form vs translucent FRP. |
| CMP-08 | Mineral-wool core insulated facade sandwich panel | Smooth colour-coated skins with broad engineered panel joins, pressed seam/gasket cues and insulated-panel proportions; flat utility system vs sculpted GFRC. |
| CMP-09 | Aluminum-composite material (ACM) cassette | Thin metallic-faced multilayer panels with sharp folded returns, clean satin metallic colour and precise grid; cladding-product composite distinct from monolithic metal-family sheet. |
| CMP-10 | Textured recycled-polymer composite boards | Matte composite timber/plastic grain, muted variegated recycled pigments and modern slatted or tongue-and-groove joins; visibly non-metal organic-matrix composite after smooth ACM. |

## 12. Asset-production workflow and QA contract

The **100 concepts are not 100 mandatory production downloads**. Author surface candidates family-by-family and prioritize those the owner selects for the present ten buildings. Images are only generated/committed after individual instructions; transparent/refractive materials and open-frame constructions may instead require shader or mesh variants.

### Asset lifecycle

\`CANDIDATE → RESEARCHED → SOURCE_APPROVED → IMAGE_OR_MATERIAL_AUTHORED → TILE_QA → OPTIMIZED → COMMITTED → OWNER_VISUALLY_ACCEPTED → ASSIGNED_TO_BUILDING\`

Only **BRK-01** currently qualifies as the accepted and assigned image surface. All others remain **CANDIDATE**, even where procedural analogues exist. A candidate becoming photographed/AI-generated does not automatically authorize commercial use; maintain provenance and clearance.

### Per-type specification fields

- **Taxonomy:** family ID, surface ID, readable label, material construction process, plausible use, and separation from nearest-looking existing surfaces.
- **Source:** provenance, permissions, source photo/design or generative origin, version/date, master location, image rights and redistribution status.
- **Maps:** required visual albedo/diffuse, optional normal and roughness at identical tile bounds; transparency/metal reflectance PBR/shader profile when needed. Record explicit exceptions for non-image optical surfaces.
- **Dimensions:** source pixel width/height, real metres-per-tile in both axes, horizontal/vertical repeat mode and phase, face handedness and mapping origin. Do not force an image to nominal 2:1 if its measured aspect is different. Set credible construction unit sizes and mortar ratios.
- **Tiling QA:** source opposite-edge continuity, 2×2/3×3 grid preview at 100% and minified scale, lighting evaluation, chroma/brightness drift, bevel seams, repetition recognition and mortar rhythm.
- **Game constraints:** real doors/windows/colliders remain independent, proper garage exterior/interior assignment, corner wrapping or split policy, near/far LOD and consistent light response through Meridian day/night.
- **Performance:** source encoded WebP/KTX2 bytes, projected decoded GPU allocation, mipmap and anisotropy strategy, shared scene texture leases, draw calls, mobile browser decode/loading behavior and fallback.
- **Acceptance:** owner screenshot review and explicit promotion. Don't silently propagate variants to all district buildings.

### Reference registry (conceptual; not yet runtime code)

\`\`\`ts
type WallFamilyId =
  | "WALL-01" | "WALL-02" | "WALL-03" | "WALL-04" | "WALL-05"
  | "WALL-06" | "WALL-07" | "WALL-08" | "WALL-09" | "WALL-10";

interface BuildingSurfaceCatalogueEntry {
  familyId: WallFamilyId;
  surfaceId: string;          // e.g. BRK-04
  label: string;
  materialMode: "opaque-image" | "optical-shader" | "metal-pbr" | "mesh-material-hybrid";
  status: "candidate" | "researched" | "authored" | "committed" | "accepted";
  assetId?: string;           // only after physical source is approved
  physicalTileWidthM?: number;
  physicalTileHeightM?: number;
  permittedBuildingRoles: readonly string[];
}
\`\`\`

A building's type assignment is a deliberate design decision. Asset count, texture family count and draw-call count are **distinct**; reuse a single approved source where credible. Named procedural materials can remain safe fallbacks but do not satisfy an image-family acceptance requirement by themselves.

## 13. Current acceptance and next instruction

- **Family count:** 10/10 definitions complete; **surface-type count:** 100/100 definitions complete.
- **Accepted physical image assets:** 1 (WALL-01 / BRK-01, \`public/brick-wall-image.webp\`, currently on apartment and garage).
- **Nine remaining BRK surface IDs:** BRK-02...BRK-10 — research, source retrieval, image generation/manual cleanup, optimization and repository commitment NOT YET STARTED.
- **Remaining families WALL-02...10:** described for subsequent phases; no production images or new shader implementations authorized by this document.
- **World and traffic dependency:** this catalogue does not close the G1 building-coverage gate of GTD-WORLD-003. The owner will direct which surface to research/generate next; no world expansion or ambient traffic begins until previously stated foundation gates are closed.
