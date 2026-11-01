# GTD-NPC-ANIM-001 — Deferred Full NPC Animation Library and Shared-Rig Feasibility Plan

**Date:** 2026-11-01  
**Project:** G.T.D — Grand Theft Division  
**Repository:** `interlinkglobal/GTD`  
**Classification:** Deferred development backlog / technical investigation and future implementation plan  
**Status:** DOCUMENTED, NOT IMPLEMENTED — no authorization to change assets, engine code, 3D-gen, or deployment  
**Priority trigger:** Before introducing mission interactions that need NPC talking, sitting, falling, impact/death responses, or recovery.  
**Sources:** 2026-11-01 owner-provided audit handoff; [PED-001](./GTD-PED-001-Optimized-NPC-Representation-Preview-2026-10-28.md), [PED-002](./GTD-PED-002-100-Unique-NPC-Appearances-2026-10-28.md), and [POI-001](./GTD-POI-001-Person-of-Interest-Narrative-and-Initial-Ten-Mission-Directives-2026-11-01.md).

## 1. Purpose and decision boundary

The 100 existing NPC GLBs were exported for efficient street-pedestrian movement; their available animation coverage is inadequate for the proposed mission interactions. Preserve the accepted NPC appearances, existing pedestrian simulation, performance, and asset-loading strategy. Add an **eventually complete gameplay animation repertoire**, not necessarily a complete duplicate animation payload inside every individual GLB.

**Recommended direction to investigate, not an approved design:** One or more shared animation banks and compatible/retargeted skeletons, activated on demand. Whether this is feasible for all 100 NPCs is an unanswered technical question. If incompatibilities exist, group characters by skeleton signatures and retarget where robust; use selective re-export only where needed.

The scope is **documentation only**. Do not create an implementation branch, mutate any GLB, modify 3D-gen, change NPC behavior, merge, or deploy until separately approved.

## 2. Recorded audit evidence (prior-session handoff; not a new exhaustive inspection)

- `main` was reported to contain numbered NPC GLBs `001` through `100`.
- Of those, **90 readable files were inspected** in the prior audit. Each inspected file reportedly exposed exactly three animation clips: `Idle`, `Walk`, `Run`.
- Ten files exist but were **not clip-verified** because they exceeded the then-available binary reader size limit: `017`, `027`, `034`, `039`, `054`, `055`, `056`, `061`, `074`, and `087`. Do **not** infer clip completeness or incompleteness for these ten.
- The prior audit reported Finch's 3D-gen export configuration as `Idle`, `Talk`, `Sit Idle`. It also reported a successful Vercel build test, but **no `Finch.glb` committed to G.T.D at the time of that audit**. Finch's current repository status must be rechecked when the work begins.
- These findings are a snapshot, not a perpetual claim about `main`. Re-run inventory against the then-current commit before development.

### 2.1 Evidence for the 3D-gen restriction

At the time of this document, [`interlinkglobal/3d-gen/src/batch/worker.ts`](https://github.com/interlinkglobal/3d-gen/blob/main/src/batch/worker.ts) validates requested `clips` against only `idle`, `walk`, `run`. In the same file, generated batch parameters set `faceBones = false`, `faceShapes = false`, and `speechShapes = false`. Export settings embed selected animation clips in each GLB with `rootMotion: false`. This design explains the limited batch repertoire and absence of speech-related morph targets; it does **not** establish the animation or skeleton compatibility of every individual file.

Do not remove the existing optimized batch export profile blindly. Any broader export configuration should be a distinct, opt-in capability with explicit size and runtime tests.

## 3. Required future animation repertoire

The eventual capability should cover the following semantic categories. Exact clip names, directional variants, skeleton support, and looping semantics must be resolved from 3D-gen's available source assets and the game's runtime animation controller.

| Category | Required behaviors | Current NPC evidence | Notes |
| --- | --- | --- | --- |
| Locomotion | Idle, Walk, Run | Present in 90 inspected files | Preserve accepted movement and transitions |
| Conversation | Talk, conversational idle/gestures | Not found in the 90 inspected files | Optional facial/lip sync is separate from body Talk |
| Seating | Sit down, Sit idle, Stand up | Not found | Must align character with actual seat height and orientation |
| Grounded/rest | Lie down, Sleep/lying idle, Get up | Not found | Avoid physics penetration and animation teleportation |
| Impacts | Hit reactions (including available directional variants) | Not found | Directionality relative to contact; temporary recovery state |
| Falls/incapacitation | Forward/backward fall, Knockdown, Death/incapacitated idle | Not found | Context-driven, believable pose and landing/contact |
| Recovery | Get up from appropriate prone/supine poses | Not found | Recovery only when permitted by game state |
| Mission-specific | Additional approved interaction gestures if required | Unverified | Add by actual gameplay requirement; no speculative asset bloat |

**Definition of "full":** Full **functional coverage** for approved gameplay states. There is no requirement to embed every upstream source animation in every GLB. Separate combat/violence animations from ordinary pedestrians; do not allocate them to distant, noninteractive NPCs by default.

**Finch:** Handle separately as an interaction-critical NPC. Retain his conversation and seated behavior when available; evaluate any additional clips against his actual briefing role. Do not assume that his rig/export matches the 100 pedestrians.

## 4. Architecture hypotheses to validate

### A. Shared animation clip bank (preferred experiment)

1. Compare bone names, hierarchy, bind/rest poses, root transformations, joint orientation, and mesh skinning for representative NPC GLBs and the 3D-gen source skeleton(s).
2. Fingerprint rigs and group exact matches. For exact matches, evaluate sharing or cloning animation groups/channels bound to each independently instantiated skeleton.
3. For rigs that differ, perform explicit animation retargeting and check bind-pose offsets, bone orientation, root motion, and proportions. Never assume that similar-looking humanoids are interchangeable.
4. Ship an independent versioned animation-bank asset (or banks by rig family), ideally cached once and loaded only when interactions require it. Each active NPC still needs correct **per-instance playback state**, even if clip data is shared.
5. Preserve `Idle/Walk/Run` compatibility and implement a reversible fallback to existing clips when extended clips or retargeting fail.

### B. Selective per-model re-export (fallback)

Where shared/retargeted clips cannot work acceptably, extend 3D-gen's export configuration to provide necessary states for the affected rig/model only. Re-export the smallest required subset, preserving existing appearance, names/IDs, materials, scaling, weights, and locomotion. Measure file-size and loading regressions. Never automatically regenerate all 100 full-size models.

### C. Facial animation (separate capability)

Body animation `Talk` is not equivalent to facial speech. Existing batch settings disable face bones, face blend shapes, and speech shapes. Explore facial capability only for interactive speakers (Finch and relevant mission NPCs) and only after assessing whether the original character source can supply it without appearance loss or heavy runtime cost. If unavailable, use modest head/jaw/body gestures or subtitles rather than falsely claiming lip synchronization.

## 5. Proposed future work packages and gates

**Gate 0 — Authorization:** Owner explicitly approves technical investigation, selects a baseline commit, and confirms which mission interactions require animation. Until then this remains backlog.

**ANIM-001-A: Complete binary audit.**
- Inspect **all 100** current GLBs via a local/in-repository binary parser rather than the former connected-reader size-limited path.
- Resolve the ten unverified IDs explicitly.
- Produce a machine-readable table: NPC ID, path, byte size, file hash, animation names/durations/tracks, rig signature, morph target support, and load/parse failures.
- Inventory Finch separately; distinguish 3D-gen artifact from file actually committed to G.T.D.
- Fail the audit rather than silently assigning 'missing' or 'present' to unreadable assets.

**ANIM-001-B: Rig compatibility experiment.**
- Choose one typical verified NPC and one representative from any alternate rig family; examine skeleton and bind transforms.
- Export a few **separate** actions from the existing source library (e.g., `Talk`, `Sit Down`, `Sit Idle`, `Stand Up`, `Hit`, `Knockdown`, `Get Up`).
- Prove or disprove correct runtime binding/retargeting on a single existing NPC **without** replacing its geometry or appearance. Log exact errors and memory costs.

**ANIM-001-C: Runtime integration prototype.**
- Prototype an animation-state machine with explicit legal transitions: locomotion → interaction → locomotion; hit → stagger/recovery or incapacity; standing → sit transition → sitting → stand; standing → fall → prone → rise when permitted.
- Ensure clip priority, blend duration, interruption policy, animation completion callbacks, animation ownership, and cancellation on despawn.
- Respect collisions, feet-to-ground alignment, seat/bed geometry, movement constraints, orientation, and mission state. Avoid false physical outcomes: an animation alone does not imply valid collision/impact mechanics.
- Respect GLB loader lifecycle and existing Babylon.js skeleton/animation abstractions where feasible; no global single-NPC animation state.

**ANIM-001-D: Performance and loading validation.**
- Preserve the PED-002 100-ID appearance mapping and proximity-based asset imports. Do not eagerly load a 100-character extended clip collection at world startup.
- Reuse immutable animation data where feasible; manage per-NPC controllers and skeleton instances safely.
- Benchmark first playable time, asset/network bytes, peak memory, garbage collection, FPS/frame time, animation transitions, mobile landscape, and desktop before/after, including pedestrians entering/exiting visible range.
- Establish a measured budget from the accepted current build **before** setting numerical pass/fail thresholds. Do not invent a benchmark target after the fact.
- Test with all 100 logical pedestrian identities and representative active characters; retain existing LRU/cache, concurrency, render-range and cleanup policies unless separately approved.

**ANIM-001-E: Incremental rollout.**
- Stage 1: single character in isolated preview.
- Stage 2: small group spanning verified rig families; conversation and seat transitions.
- Stage 3: mission-critical characters (including Finch if his asset has been committed) under controlled scenarios.
- Stage 4: all compatible NPC identities, only following measured validation and owner approval.
- If any stage fails, stop, report, and revert that stage without altering approved pedestrian world behavior.

## 6. Acceptance criteria

1. Audit enumerates 100/100 IDs with definite clip/rig results (or explicit file/parse defects), including all ten formerly unverified.
2. The chosen architecture demonstrates correct multiple-clip playback on one **unchanged** existing NPC appearance; skeleton/retargeting correctness is evidenced, not assumed.
3. All approved animation states show correct direction, bone deformation, transitions, grounded poses, interruption handling, and per-NPC independence; talking, sitting, hit, knockdown, and recovery work in context.
4. A failed bank load or incompatible rig fails safely to current locomotion, with diagnostics and without corrupting NPC identities or freezing world loading.
5. Accepted pedestrian routing, spawn/despawn continuity, collision/curb handling, proximity loading, no visible placeholder dots, and 100 distinct appearances remain intact.
6. Benchmarked desktop/mobile performance satisfies **owner-approved thresholds established from the current accepted baseline**; no full-bank boot blocking or uncontrolled duplicated payload.
7. Finch's specific animation set and file presence are verified independently, and mission dialogue/briefing uses the existing narrative division: **Finch assigns missions face-to-face; The Machine supplies contextual intelligence through ringing payphones**.
8. Preview and owner acceptance precede any merge/deploy. Documentation does not itself authorize implementation.

## 7. Dependencies and non-goals

**Dependencies:** Accepted pedestrian loading system ([PED-001](./GTD-PED-001-Optimized-NPC-Representation-Preview-2026-10-28.md) / [PED-002](./GTD-PED-002-100-Unique-NPC-Appearances-2026-10-28.md)); source clip and rig catalog in [3D-gen](https://github.com/interlinkglobal/3d-gen); approved mission requirements ([POI-001](./GTD-POI-001-Person-of-Interest-Narrative-and-Initial-Ten-Mission-Directives-2026-11-01.md)); representative actual GLB assets.

**Out of scope now:** rebuilding the 100 NPCs, generating new characters, changing mission logic, combat systems, cutscenes, facial-lip-sync implementation, physics changes, or production deployment.

**Open technical questions:** How many rig families exist? Are 3D-gen animation tracks tied to stable skeleton names and bind poses? Which complete source clips actually exist and export cleanly? Can Babylon.js reuse tracks across live skeleton instances without unwanted shared playback state? Which characters need talking/face support? What performance cost is acceptable on the target mobile device?

## 8. Handoff instruction

When the owner later directs "**implement full NPC animations**", begin with **ANIM-001-A** and a fresh source-of-truth audit of the then-current `main` branch. Do not skip the ten files that were too large to inspect previously. Present findings and a refined implementation architecture for approval. **Do not assume that this document grants prior authorization.**
