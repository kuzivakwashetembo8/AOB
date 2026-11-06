# GTD-FINCH-HQ-023 — Proposed 53-floor program and dynamic room-generation contract

**Date:** 2026-11-06  
**Status:** PROPOSED / OWNER REVIEW REQUIRED. This document is not approval to populate interiors or merge into main.  
**Pilot branch:** `feature/finch-floor53-room-skill-trial-20261106`  
**Reference:** The accepted floor-53 proof contains Finch's mission trigger, furnished office, library, lounge and original glass lift. Its outstanding carpet correction is separate.

## Direction

- All 53 floors share exactly the same **tile geometry, tile size, grout pattern and material family**, differing **only in floor palette**. Visual skins do not replace or duplicate the existing white Rapier floor slabs. The accepted existing lift cutout remains at every upper floor.
- All Finch HQ facade glazing is visually clear, without dark blue opacity/strong reflection masking city visibility. Preserve the facade's real square apertures and align upper edges; retain the existing main entrance opening.
- Floor 53 is a **protected, curated suite** and its existing Finch actor, mission assignments, interaction radius and elevator coordinates must remain unchanged.
- The other 52 floors must **not** be hand-built. A deterministic procedural system constructs them from program, semantic room grammars, floor footprint, and existing building/elevator geometry.
- This program is intentionally a **fictional mixed-tenant office tower**. Public, commercial and ordinary tenant floors provide a plausible front to the restricted upper levels. Access tiers are narrative zoning suggestions, **not** authorization to lock floors or prevent player exploration.

## Per-floor program (proposal)

| Floor | Proposed purpose | Room grammar | Access concept |
|---:|---|---|---|
| 1 | Public reception and entry | lobby | Public |
| 2 | Building security and visitor verification | operations | Controlled |
| 3 | Café and casual meeting area | hospitality | Public |
| 4 | Visitor waiting and interview rooms | lobby | Public |
| 5 | Conference and event suite | conference | Public |
| 6 | Facilities control and building services | service | Staff |
| 7 | Tenant reception and shared workspaces | office | Tenant |
| 8 | Legal practice and consultation rooms | office | Tenant |
| 9 | Accounting and finance offices | office | Tenant |
| 10 | Insurance services offices | office | Tenant |
| 11 | Business consulting offices | office | Tenant |
| 12 | Architecture and design studio | studio | Tenant |
| 13 | Marketing and creative offices | studio | Tenant |
| 14 | Communications and public relations | studio | Tenant |
| 15 | Recruitment and human resources offices | office | Tenant |
| 16 | Start-up and software co-working | office | Tenant |
| 17 | Training and seminar classrooms | classroom | Tenant |
| 18 | Media production and editing suite | studio | Tenant |
| 19 | Executive boardrooms and meeting suites | conference | Tenant |
| 20 | Tenant lounge and amenities | hospitality | Tenant |
| 21 | IT helpdesk and device support | service | Staff |
| 22 | Software engineering workspace | office | Staff |
| 23 | Software testing and QA laboratory | lab | Staff |
| 24 | Product research and UX studio | studio | Staff |
| 25 | Network operations monitoring | operations | Staff |
| 26 | Analytics and reporting floor | office | Staff |
| 27 | Mapping and geospatial analysis | operations | Staff |
| 28 | Cybersecurity operations centre | operations | Controlled |
| 29 | Digital forensics workspace | lab | Controlled |
| 30 | Incident response coordination | operations | Controlled |
| 31 | Applied technology research | lab | Controlled |
| 32 | Reference library and reading rooms | library | Staff |
| 33 | Technical archives and documentation | library | Controlled |
| 34 | Hardware design and prototyping | lab | Controlled |
| 35 | Device evaluation and test labs | lab | Controlled |
| 36 | Data infrastructure control rooms | operations | Controlled |
| 37 | Resilience and continuity operations | operations | Controlled |
| 38 | Secure document processing | service | Controlled |
| 39 | Compliance and audit offices | office | Controlled |
| 40 | Executive support administration | office | Controlled |
| 41 | Personnel and organizational services | office | Controlled |
| 42 | Supplier and procurement offices | office | Controlled |
| 43 | Strategy and policy planning | office | Controlled |
| 44 | Private conference and negotiation rooms | conference | Restricted |
| 45 | Restricted records archive | library | Restricted |
| 46 | Secure communications hub | operations | Restricted |
| 47 | Intelligence assessment rooms | operations | Restricted |
| 48 | Systems integration and control | lab | Restricted |
| 49 | Special operations planning | operations | Restricted |
| 50 | Surveillance review and analysis | operations | Restricted |
| 51 | Mission coordination and briefing | conference | Restricted |
| 52 | Private study, quiet research and library | library | Restricted |
| 53 | Harold Finch's established office and library | curated-suite | Restricted |

## Proposed reusable room grammars (10)

1. `lobby`: security counter, clear entry aisle, waiting groups, signage, public circulation.
2. `office`: desks, manager cabins, small break space, shared meeting room, storage.
3. `conference`: configurable seating, presentation screens, breakout rooms, circulation.
4. `hospitality`: café counters, dining, lounges, restrooms, public seating.
5. `studio`: media/editing equipment, creative desks, production tables.
6. `classroom`: learning desks, teaching wall, whiteboards, small training support.
7. `lab`: workshop stations, benches, cabinets, safe transit corridors.
8. `operations`: monitors, analysis desks, large planning displays, incident tables.
9. `service`: controls, cabinets, maintenance support, equipment access.
10. `library`: shelves, archives, reading tables, quiet study or secure records.
11. `curated-suite`: Floor 53 only; entirely exempt from procedural replacement.

## Generation architecture to propose before implementation

- Data contract: `BuildingId + floor(1..53) + purpose + grammar + palette + stableSeed + generatorVersion`. A fixed map of 53 **purposes** is configuration, not 53 hand-authored room meshes.
- Read true building footprint, facade/window columns, actual floor elevation, real shaft cutouts and elevator exits. Reserve a >=2.4m arrival aisle from the lift before partitioning.
- Partition only accessible footprint around the shaft; derive corridors and door openings from one room-plan graph. Every visible door must lead to a genuine walkable destination; do not generate false door facades. Use room purpose to determine appropriate furnishings and surface treatment.
- Deterministic seeds based on immutable building+floor+room+grammar version; produce different layouts between floors but regenerate unchanged layouts when returning.
- Reuse the same furniture meshes and GLB sources across rooms; varied materials/rotation/density achieve diversity without hundreds of new unique GLBs. No paid external asset generation without separate approval.
- Render just current floor + next reachable floor as player approaches or rides elevator; free GPU resources and room-level physics for distant floors. The already-authored white slabs, shaft and transparent facade remain permanent.
- Create stable Rapier barriers for active rooms, protect elevator cabin movement, prevent dead corridors and furniture blocking mission/NPC interactions, and retain the current third-person gameplay camera.
- Floor 53 overrides (fully furnished and mission-active) remain unchanged. Floors 1–52 use procedural grammar. A program change requires an explicit generator version migration to avoid silently reshuffling existing rooms.
- Acceptance stages: (A) visual floor skins and clear glazing on actual game; (B) owner-approved floor program; (C) generate **one** representative lower floor (recommended Floor 16); (D) test elevator arrivals, contact/collision, quality and performance; (E) gradual floor activation; (F) citywide interior system separately.

## Explicit hold

The present branch changes to floor skins and clear glass are permitted by the 2026-11-06 instruction. Automatic furnished-room generation, floor-specific NPC routes, new missions, security locks and production merge are **not** authorized by this proposal.
