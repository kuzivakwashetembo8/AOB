# GTD-WORLD-004 — Meridia Architectural Building Catalogue & Reference Profiles

**Date:** 2026-10-13 · **Status:** owner-directed architectural design standard, **DOCUMENTATION ONLY**  
**Scope:** fixed building types, structural form, facade composition and surface-family eligibility for Meridia.  
**Repository baseline:** preview branch \`feat/mat-005-south-ward-brick-fieldtrial-20261013\`, descended from the owner-approved BRK/WOOD research implementation.  
**Related standards:** GTD-WORLD-003 six-system implementation plan; GTD-RND-MAT-004 100-surface taxonomy; GTD-RND-MAT-005 brick field trial; GTD-RND-MAT-006 wood field trial.

> **Hard release gate:** This catalogue authorizes **no new physical buildings, added district geography, traffic, geometry generation, materials, shaders or physics changes**. Complete the remaining surface families and comply with the owner's outstanding building-material coverage and vehicle-physics gates before physical city expansion or ambient traffic. Reference photographs are **architectural guidance**, not source textures and not permission to copy or redistribute third-party photography commercially.

## 1. Why the catalogue exists

The trial placed convincing wood textures on 8- and 10-storey skyline towers and exposed an architectural **selection** failure: faithful wood grain does not make an all-timber-clad conventional office tower plausible. Avoid a new giant matrix of arbitrary runtime material choices. Instead define a bounded set of \`ArchitecturalProfile\` IDs, each with an intentional massing strategy, floor-range, facade modules, window/balcony/entry conventions, zoning compatibility, and eligible **primary, secondary and prohibited-by-default** surface roles.

**Core hierarchy:**
1. \`BuildingUse\`: residence, office, retail, medical, industrial, transport, civic, hospitality, parking, emergency, utility.
2. \`ArchitecturalProfileId\`: an explicit building form designed for that use.
3. \`MassingTemplateId\`: reusable, preauthored geometry grammar (slab, row, terrace, curtain tower, podium tower, long-span, courtyard, etc.).
4. \`FacadeZone\`: tower shaft, podium, upper wall, street wall, structural pier, glazing, balcony, entrance, canopy, roof, service bay and accent.
5. \`SurfaceAssignment\`: WALL-01 through WALL-10 + asset/style ID + per-role physical UV scale and finish.

Height is a constraint on **profile compatibility**, not a substitute for building use. A 10-storey residential tower and a 10-storey corporate office should not produce the same window pattern.

### Floor classes (suggested authored bands; not universal building codes)

| Class | Proposed floors | Typical forms |
| --- | ---: | --- |
| H1 — low-rise | 1–3 | houses, street shops, workshops, fire stations |
| H2 — mid-rise | 4–7 | apartments, offices, hotels, clinics |
| H3 — high-rise | 8–20 | apartment towers, office towers |
| H4 — major tower | 21–40 | residential / corporate towers |
| H5 — landmark tower | 41+ | skyline landmarks, specialized corporate/hospitality |

Defaults are **bounded presets**. Exceptional authored landmarks may explicitly override them with QA.

## 2. Six owner-supplied architectural image references

The user supplied six separate photos/renders as the structural **reference plates** for the first six major profiles. The companion **illustrated PDF** produced in this discussion includes the images on their relevant profile pages. Original user-uploaded images are not automatically redistributed to the repository: publication and reuse rights are unverified. The numbered entries and detailed visual instructions in this Markdown are the versioned implementation standard. Reference plate order is intentional.

### Figure 01 — Glass-and-metal skyscraper — \`ARCH-01\`
**Image:** tall reflective office skyscraper with articulated glass podium and structural columns.  
**Source attachment:** \`image(20261013-110136).png\` · 2048 × 2048.

- **Massing:** tall slender rectilinear tower above a wider, stepped multi-storey podium; visible inset/transfer level separating podium and shaft.
- **Geometry:** actual glazing panels, continuous vertical mullions and horizontal transoms, recessed/reflective corner glazing, distinct roofline, columns/canopy at pedestrian base. Do not merely stretch a glass photo over a box.
- **Facade zones:** tower shaft = WALL-03 glass, framed by WALL-05 metal; podium = glass with WALL-07 concrete, WALL-05 metal or WALL-10 composite; entrances = real glazing/frames.
- **Legibility:** repetitive window module subdivisions and thin structural joints, depth changes at setback line and credible skyline proportions.
- **Assigned districts:** Meridian Central primary, limited landmark exceptions in Civic Square/West End.
- **Must not:** resemble a conventional masonry slab tower with an opaque blue diffuse wall image.

### Figure 02 — High-rise residential apartment tower — \`ARCH-02\`
**Image:** masonry/concrete apartment high-rise with many real projecting dark-railed balconies.  
**Source attachment:** \`image(20261013-110142).png\` · 1638 × 2048.

- **Massing:** broad multistorey residential slab with setbacks, stepped roofline and repeated living-unit bays.
- **Geometry:** deep window recesses, **physical projecting balcony decks and guardrails**, consistent balcony spacing, balcony doors, structural slab edges, service/core volumes.
- **Facade zones:** WALL-01 brick, WALL-07 concrete, WALL-06 render; glass doors/windows WALL-03; metal balcony guardrail WALL-05. Brick need not cover the entire elevation.
- **Legibility:** distinct residential module (living units, balconies, narrower windows), not a corporate curtain wall.
- **Assigned districts:** West End, North Heights/selected South Ward edges, mixed-use residential corridors.
- **Must not:** implement balconies by baking black rectangles/railings into an albedo texture.

### Figure 03 — Mid-rise corporate office — \`ARCH-03\`
**Image:** contemporary commercial six-ish-storey white structural grid with large clear glass panes at a street corner.  
**Source attachment:** \`image(20261013-110257).png\` · 1618 × 1618.

- **Massing:** compact full-block or corner rectilinear slab with uniform floor heights, minimal rooftop ornament.
- **Geometry:** visible concrete/metal structural frame, a continuous **floor-to-ceiling glazed bay** rhythm with solid spandrels, transparent ground-floor business frontage and actual corner glazing.
- **Facade zones:** WALL-03 glazing, WALL-07 concrete or WALL-10 panels, WALL-05 mullions and frames.
- **Assigned districts:** Meridian Central outskirts, East Market, Civic Square business edges, West End.
- **Must not:** use the existing low-rise office's small discrete punched-window rule as if it were a full glass grid.

### Figure 04 — Detached house and townhouse — \`ARCH-04 / ARCH-05\`
**Image:** detached pitched-roof residence with natural horizontal wood on the upper gable, brick ground floor, attached garage and residential front garden.  
**Source attachment:** \`image(20261013-110252).png\` · 1024 × 576.

- **Massing:** bounded 1–3-storey domestic volume, pitched/gabled roof, realistic soffit/eaves; an additional side/rear garage mass only where appropriate.
- **Geometry:** an actual slope roof ridge, porch/entrance canopy, ordinary window proportions, discrete garage opening and separate mass for extensions.
- **Facade zones:** WALL-02 wood at upper gable or accent, WALL-01 brick/ WALL-06 render lower wall, WALL-05 roof/copings, WALL-03 real windows.
- **Detached vs townhouse:** two separate profiles. Detached uses setbacks and a distinct plot; townhouse shares party-wall logic and repeated narrow units with variable entrances/roof details.
- **Assigned districts:** North Heights, South Ward residential pockets, West End edges.
- **Must not:** cover the complete building with one timber texture regardless of structure, or use this photo as a direct wall tile.

### Figure 05 — Shopping mall / retail centre — \`ARCH-08\`
**Image:** large shopping-centre facade with high central atrium glazing, main canopy, storefront wings, horizontal fascia and signage.  
**Source attachment:** \`image(20261013-110320).png\` · 1024 × 1024.

- **Massing:** genuinely broad, low/mid-rise commercial footprint; central taller transparent entrance or atrium; two or more wings/anchor zones.
- **Geometry:** long-span roof structure, tall glass entry bays, multiple **actual door portals**, sheltered entrance canopy, frame system, loading/service facade and wall-mounted signage anchors. Interior atrium is a separate authorized gameplay feature, not implied by the image.
- **Facade zones:** WALL-03 glass, WALL-05 metal, WALL-07 concrete, WALL-09 ceramic, WALL-10 panel composite.
- **Assigned districts:** East Market primary; West End and designated commercial centers. Do not place as a normal corner shop on a narrow South Ward lot.
- **Must not:** scale a two-storey shop box and paste the word “MALL” on it.

### Figure 06 — Clinic and hospital buildings — \`ARCH-06 / ARCH-07\`
**Image:** modern institutional glass-and-concrete medical facility with framed glazing, prominent weather canopy and landscaped entrance.  
**Source attachment:** \`image(20261013-110451).png\` · 1024 × 1024.

- **Massing:** clinic = small low/mid-rise, hospital = multiwing institutional facility with defined core/entrance and future emergency access.
- **Geometry:** real entrance vestibule, columns, canopy, clear circulation face, glass corridor/window zones, accessible door areas; hospital later adds ambulance bay and service/loading faces.
- **Facade zones:** WALL-07 concrete or WALL-10 fiber cement, WALL-03 glass, WALL-05 metal frames, occasional WALL-06 render.
- **Assigned districts:** clinics may appear across residential/commercial areas; major hospital placement reserved for accessible collector-road/civic neighborhoods.
- **Must not:** represent a hospital by reskinning a clinic or storefront without larger institutional massing and entry logic.

## 3. Verified buildings already authored in First Light

These are **10 actual building instances**, not the entire future city. Source: \`src/game/world-generation/first-light-spec.ts\`.

| ID | Current archetype | Floors | Height (nominal) | Current interpretation / future profile |
| --- | --- | ---: | ---: | --- |
| \`sw-fl-west-support\` | residential | 2 | 8.4 m | low-rise residential; future ARCH-04/05 selection |
| \`sw-fl-garage\` | garage | 1 | 4.7 m | garage / service bay; preserve hero garage logic |
| \`sw-fl-east-support\` | office | 3 | 10.8 m | small office, **not** full-glass ARCH-03 |
| \`sw-fl-south-apartment\` | residential | 3 | 10.4 m | neighborhood low-rise apartment |
| \`sw-fl-corner-commercial\` | commercial | 2 | 8.6 m | corner street retail |
| \`sw-fl-skyline-west\` | podium-tower | 8 | 28.0 m | background podium tower, profile incomplete |
| \`sw-fl-skyline-east\` | podium-tower | 10 | 33.2 m | background podium tower, profile incomplete |
| \`sw-fl-rear-residential\` | residential | 2 | 8.8 m | low-rise residential/shop-adjacent |
| \`sw-fl-rear-shop\` | commercial | 2 | 6.2 m | neighborhood shop |
| \`sw-fl-rear-workshop\` | industrial | 2 | 7.6 m | industrial/service workshop |

The two towers are **not** yet full glass skyscrapers; their trial wood cladding was a deliberately useful failure case. Nominal height means \`floors × floorHeight\` before parapets/roofs.

The schema presently declares **11 generic archetypes** (\`residential\`, \`mixed-use\`, \`commercial\`, \`garage\`, \`warehouse\`, \`industrial\`, \`office\`, \`podium-tower\`, \`civic\`, \`hospitality\`, \`parking\`). Six appear as actual archetypes in the 10-building spec. A schema archetype or generator default is **not** a rendered building type.

## 4. Canonical Meridia building profile inventory

**A = already represented by a First Light building's broad archetype (not necessarily full profile fidelity).**  
**D = broad generator archetype/default exists but no dedicated instance.**  
**N = new specialized architectural profile needed.**  
Statuses are as of this document, not promises of completed meshes or assets.

| Profile | Building category | Typical floors | Massing / structure | Primary facade families | Status |
| --- | --- | --- | --- | --- | --- |
| ARCH-01 | Full glass and metal skyscraper | 25–50+ | slender curtain tower + stepped podium | WALL-03/05/07 | N |
| ARCH-02 | High-rise residential apartment | 8–25 | balcony slab / stepped residential tower | WALL-01/07/03 | N |
| ARCH-03 | Mid-rise corporate office | 4–12 | glazed framed office grid | WALL-03/07/05 | N |
| ARCH-04 | Detached house | 1–3 | pitched domestic house + optional garage | WALL-01/02/06 | N |
| ARCH-05 | Townhouse / terrace | 2–4 | repeated attached residential row | WALL-01/02/06 | N |
| ARCH-06 | Community clinic | 1–4 | low-rise institutional with entry canopy | WALL-07/03/06 | N |
| ARCH-07 | General hospital | 4–12+ | connected wings, visible main/core block | WALL-07/03/05 | N |
| ARCH-08 | Shopping mall / retail centre | 1–5 | broad retail podium, glazed atrium | WALL-03/05/07/10 | N |
| ARCH-09 | Mixed-use shops + apartments | 3–8 | street-level retail + domestic upper slab | WALL-01/06/03 | D |
| ARCH-10 | Distribution warehouse | 1–2 | long-span industrial hall, loading bays | WALL-05/08/07 | D |
| ARCH-11 | Municipal / civic administration | 2–6 | civic entry axis, regular institutional wings | WALL-04/07/03 | D |
| ARCH-12 | Hotel / hospitality | 3–20 | lodging window module, street podium | WALL-03/06/07 | D |
| ARCH-13 | Multi-storey car park | 3–8 | repeated open deck, ramps/vents | WALL-07/05/08 | D |
| ARCH-14 | Primary / secondary school | 1–4 | classroom wings around courtyard | WALL-01/06/07 | N |
| ARCH-15 | University academic / library | 2–8 | courtyard/campus learning block | WALL-03/07/04 | N |
| ARCH-16 | Police station | 1–5 | civic/service block with secured access | WALL-01/07/03 | N |
| ARCH-17 | Fire / emergency station | 1–3 | high vehicle-bay doors, station quarters | WALL-01/07/05 | N |
| ARCH-18 | Restaurant / cafe | 1–3 | street shop / glazed dining frontage | WALL-01/02/03 | N |
| ARCH-19 | Bar / nightclub / entertainment | 1–5 | street venue with discrete illuminated facade | WALL-01/05/03 | N |
| ARCH-20 | Supermarket / grocery anchor | 1–3 | wide sales floor, glazed entry, loading | WALL-05/03/07 | N |
| ARCH-21 | Industrial factory | 1–4 | factory hall, clerestory/glazed work area | WALL-05/07/08 | A (industrial general) |
| ARCH-22 | Foundry / heavy works | 1–4 | high-bay industrial mass + stacks/plant | WALL-05/07/08 | N |
| ARCH-23 | Fuel / vehicle service station | 1–2 | forecourt canopy + service bays | WALL-05/07/03 | N |
| ARCH-24 | Bus terminal / interchange | 1–5 | waiting hall + sheltered platforms | WALL-05/03/07 | N |
| ARCH-25 | Rail / metro station | 1–5 | long-span canopy/platform + concourse | WALL-05/03/04 | N |
| ARCH-26 | Power / utility service building | 1–3 | fenced functional plant enclosure | WALL-07/08/05 | N |
| ARCH-27 | Historic civic / heritage building | 2–6 | stone/brick monumental composition | WALL-04/01/06 | N |
| ARCH-28 | Harbor warehouse / port terminal | 1–4 | steel long-span dock/service mass | WALL-05/07/08 | N |
| ARCH-29 | Neighborhood low-rise apartments | 2–5 | brick slab/row with repetitive home windows | WALL-01/06/07 | A |
| ARCH-30 | Corner shop / street retail | 1–3 | corner/storefront bay massing | WALL-01/06/03 | A |
| ARCH-31 | Garage / vehicle workshop | 1–2 | wide garage opening / service hall | WALL-01/08/05 | A |
| ARCH-32 | Retail arcade / market hall | 1–4 | multiple shop bays and covered passage | WALL-03/05/09 | N |

**Notes:** Profile numbers and ranges are proposed stable planning IDs; names and eligibility should be locked before using in shipped data. One profile can have many authored facade variants, but it must not silently morph into a different function. Other buildings—courthouses, sports centres, theatres, houses of worship, libraries, housing estates—can be proposed later under separate profile review. An ordinary neighborhood grocery is ARCH-30; a large stand-alone supermarket is ARCH-20.

## 5. Bounded structural grammar — avoid unconstrained runtime math

### 5.1 Preauthored geometry / facade templates

| Template ID | Geometry family | Key reuse |
| --- | --- | --- |
| MASS-01 | detached pitched roof | ARCH-04, selected clinic/school annexes |
| MASS-02 | townhouse / attached row | ARCH-05, ARCH-09, ARCH-29 |
| MASS-03 | slab with punched windows | ARCH-02/09/12/29, office legacy |
| MASS-04 | corner storefront | ARCH-18/19/30, mixed-use podium |
| MASS-05 | balcony residential tower | ARCH-02 only / intentionally similar variants |
| MASS-06 | glass curtain-wall office | ARCH-01/03, hotel variants |
| MASS-07 | stepped tower and podium | ARCH-01/02/12 |
| MASS-08 | wide-span industrial/service | ARCH-10/17/20/21/22/28/31 |
| MASS-09 | civic/courtyard composition | ARCH-11/14/15/16/27 |
| MASS-10 | mall / atrium | ARCH-08/32 |
| MASS-11 | parking deck | ARCH-13 |
| MASS-12 | medical connected wings | ARCH-06/07 |
| MASS-13 | sheltered terminal/platform | ARCH-24/25 |
| MASS-14 | fuel canopy + service blocks | ARCH-23 |
| MASS-15 | utility fenced enclosure | ARCH-26 |

**Use discrete prefab module sizes** for window bays, floors, balcony decks, rails, mullions, entrance sections, roofs, canopies and support columns. The runtime selects a prepared template + bounded parameters; it should not solve structural architecture freely every frame. Normal transform, lot-placement, physical UV scaling and LOD remain runtime calculations where needed.

### 5.2 Façade-zone material rules

- **Primary** = eligible for most exterior opaque wall area (or transparent curtain wall where architecturally designed).
- **Secondary** = eligible for limited podium, entrance, soffit, accent, interior or service portions.
- **Restricted** = do not automatically assign to large areas; owner-approved architecturally authored exceptions possible.
- GLASS/WALL-03 needs *real optical glazing material and actual pane geometry*. Do not use 2D wall photos to simulate all-glass buildings.
- Timber/WALL-02 on conventional corporate towers = **restricted to accents**, not wall-dominant assignments.
- Solid wall image textures cannot substitute for actual voids, balcony decks, fire-station bay openings, roller shutters or a mall's entrance atrium.
- Material inheritance must depend on **zone** (podium/shaft/ground floor/front/back/roof) not solely \`BuildingArchetype\`.
- A family may be reused across suitable profiles, but the **profile selects the family**, not a uniform random draw from all 100 assets.
- Preserve explicit exclusions for glass framing, physical windows and railings; don't blindly force every mesh into image-backed diffuse textures.

### 5.3 Proposed typed architecture contract (design only)

\`\`\`ts
type HeightClass = "H1" | "H2" | "H3" | "H4" | "H5";
type SurfaceEligibility = "primary" | "secondary" | "restricted";
type FacadeZoneId =
  | "podium" | "tower-shaft" | "opaque-wall" | "curtain-glazing"
  | "balcony" | "entrance" | "canopy" | "trim" | "roof" | "service";

interface ArchitecturalProfile {
  id: string;                  // ARCH-01 ...
  use: string;                 // "office", "hospital", "residential", ...
  heightClass: HeightClass;
  permittedFloorRange: readonly [number, number];
  massingTemplate: string;     // MASS-01 ...
  requiredZones: readonly FacadeZoneId[];
  materialEligibility: Readonly<Record<FacadeZoneId, readonly string[]>>;
  allowedDistricts: readonly string[];
  imageReferenceIds: readonly string[];  // REF-01 ... REF-06
}
\`\`\`

**This is NOT implemented code.** A source image is never the structural specification by itself; use both the owner references and the explicit geometry/role contracts above.

## 6. District distribution proposal (not a literal adjacency map)

| District | Strongly preferred profiles | Limited or conditional |
| --- | --- | --- |
| Meridian Central | ARCH-01/03/12, premium ARCH-08 | older low-rise at retained historic sites |
| South Ward | ARCH-04/05/09/29/30/31, clinic ARCH-06 | residential mid-rise; full-glass towers rare |
| Old Meridian | ARCH-27/29/30/18 | glass skyscrapers not default |
| Harbor District | ARCH-10/21/28/26, terminal ARCH-24 | limited office pods |
| North Heights | ARCH-04/05/02, local clinics | high-rise skyline constrained |
| East Market | ARCH-08/20/32/30/09 | mixed use; contextual office |
| The Strip | ARCH-12/18/19/03 | late-night frontage, signage |
| Ironworks | ARCH-21/22/10/26/31 | robust office annexes |
| West End | ARCH-02/03/09/29, ARCH-20 | selective corporate towers |
| University District | ARCH-14/15/06/29 | office/research exceptions |
| Civic Square | ARCH-11/16/27/07/03 | high-profile glazed civic landmarks |
| Outer Ring | ARCH-10/23/24/26/28 | low density, service corridors |

District identity is an authored weighting and override policy, not an absolute prohibition on exceptional buildings. Proper land-use and street connectivity are separate gates.

## 7. Pre-generation gates / immediate next action

1. **Finish the remaining WALL-03…WALL-10 surface-family production** following the accepted brick/wood flat-surface methodology. These are **surface assets, not automatic buildings**. Glass requires an optical/facade design study in addition to samples.
2. Decide which \`ARCH-\` profiles are mandatory for first production scope and lock their \`MASS-\` template, unique entrance, balcony, window, roof and service characteristics.
3. On a future authorized implementation branch, add the typed \`ArchitecturalProfile\` and \`FacadeZone\` resolvers **before** adding many new buildings; map accepted materials to appropriate facade zones rather than blanket wall assignment.
4. Reassess the current two skyline towers: disable permanent all-timber cladding, retain valid experimental image assets for low-rise roles, and choose a realistic office/residential material profile only when design and required surface families permit. **No runtime correction has been made by this document.**
5. Before actual geographic expansion, close the owner-mandated building-family coverage and physically correct vehicle-system gates; then build a carefully placed, connected South Ward test block/adjacent neighborhood. No ambient traffic until its independent rule/physics gates close.

### Documentation acceptance

- Six owner-supplied reference figures have distinct profile IDs and **structural, not merely colour/texture**, interpretation.
- Shopping mall is explicitly \`ARCH-08\`, separate from shop, retail arcade and supermarket.
- Fire station, police station, restaurant, bar/nightclub, supermarket, school, university, factory/foundry, fuel station, terminal, civic administration, power service and port logistics have entries.
- Existing South Ward inventory is not misrepresented as 32 already generated structures.
- **No generation, asset import, physics changes or production deployment is authorized by this catalogue.**

**Next directive:** continue generating and optimizing the remaining material families, then return to profile-based building geometry only after owner confirmation.
