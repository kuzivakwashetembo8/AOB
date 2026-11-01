# GTD-POI-001 — Person of Interest Narrative and Initial Ten Mission Directives

**Date:** 2026-11-01  
**Project:** G.T.D — Grand Theft Division  
**Repository:** `interlinkglobal/GTD`  
**Document type:** Narrative direction and mission-design baseline  
**Status:** Owner-selected narrative direction and ten initial mission categories; detailed case design and implementation **not yet approved**  
**Scope of this commit:** Documentation only. No gameplay, assets, branches, builds, merges, or deployments are authorized by this document.

## 1. Narrative source of truth

G.T.D is a 3D open-world vigilante game in **Meridia**, with **Voight** as the player-controlled field operative. Its proposed narrative closely follows the *premise and dramatic mechanism* of the television series **Person of Interest**: an intelligence system predicts danger, **Finch** interprets information and recruits Voight to intervene, and Voight protects people by preventing incidents before they occur.

This direction **does not** require a complete recreation of the television series, its episodes, cast, larger AI war, or every plot detail. Adapt the essential premise into playable, original mission situations.

### 1.1 Foundational roles

| Role | Narrative function | Interaction rule |
| --- | --- | --- |
| **Voight** | Player character and field operative. Investigates and intervenes in Meridia. | The player directly controls Voight using existing world traversal, driving and action systems. |
| **Finch** | Human mission handler and source of new assignments. | **Voight meets Finch in person at a designated building** to receive/accept a mission and hear a concise briefing. `Finch.glb` is now present in G.T.D. His designated meeting location is the eastern 53-storey North Heights tower `NH-04-06-L2` (see [POI-002](./GTD-POI-002-Finch-Headquarters-Designation-and-Map-Landmark-2026-11-01.md)); interior and meeting interactions remain unimplemented. |
| **The Machine** | Predictive intelligence source. Delivers clues and updates about an *active* investigation. | **The Machine communicates through ringing public payphones**, represented by future `Payphone.glb` assets. Its ring/answer interaction takes inspiration from *Payback 2*. **Payphones do not issue new missions.** |
| **People of interest** | Existing NPC population from which primary mission subjects are selected. | A subject may be an intended victim or a prospective perpetrator; this classification is not announced at mission start. |
| **Supporting NPCs** | Witnesses, accomplices, bystanders, friends, rescuers, pursuers and other mission participants. | May be drawn from the same 100-NPC population without replacing the one primary subject assigned to a mission. |

### 1.2 Predictive uncertainty

The defining *Person of Interest* idea is that The Machine identifies someone connected to a possible future incident **without specifying whether the identified person is the victim or the perpetrator**. Finch provides the case to Voight. Investigation, events and occasional Machine clues reveal what is actually happening.

Keep uncertainty in the story, **not in the player's controls**. A mission can contain a surprise or reversal while the immediate gameplay objective remains understandable.

### 1.3 Gameplay-facing philosophy

**Adult crime-thriller storytelling; simple, accessible action.** Do not turn the game into a sequence of simplistic costumed-hero rescues, and do not require a casual gamer to study a conspiracy chart.

- Maintain **one clear, actionable objective at a time**, with visible directions or a marker when appropriate.
- Favor a small number of meaningful stages; ordinarily **3–5 primary objectives**, adjusted when a case genuinely calls for fewer.
- Draw variety from gameplay verbs: **drive, pursue, protect, stop, intercept, follow, investigate, recover, escort and escape**.
- Allow motives and outcomes to be nuanced: the obvious suspect can be innocent; a victim can be flawed; a perpetrator can be coerced. The player should still understand *what to do next*.
- Keep dialogue and exposition brief. Finch tells Voight why the case matters; Machine clues supply actionable information, not lengthy lectures.
- Cases can be connected in the background, but knowledge of earlier cases must not become compulsory for understanding the next assignment.
- Avoid assuming every mission ends in a gunfight, vehicle chase, or arrest. Avoid duplicating the same objective sequence across all categories.
- Use existing North Heights/Meridia mechanics wherever possible; new world systems and mission-specific interactions require later technical design and owner approval.

## 2. Player-facing mission loop

1. **Meet Finch:** Voight physically visits the designated Finch building, speaks to Finch and receives the mission assignment.
2. **Receive a subject or situation:** Finch presents a concise threat and, when relevant, a fictional ID/SS-style identifier associated with a primary NPC. Finch may have incomplete information.
3. **Follow the current objective:** The HUD/map presents a simple next step in the city.
4. **Machine clue, when relevant:** A contextual public payphone rings (in the spirit of the phone interaction in *Payback 2*). Voight answers to hear a short clue or objective update from The Machine. **This is investigative assistance, not mission assignment**. Not every mission needs a call.
5. **Intervene:** Voight takes the action required to prevent or mitigate the threat.
6. **Resolve:** The mission records a clear outcome. Details of fail/retry behavior, rewards, persistence, dialogue timing and state transitions remain to be designed.

### 2.1 Dialogue and sound principles

- **Finch voice:** Human, composed, informational briefing and feedback; attached to Finch's in-person meeting/dialogue.
- **Machine voice:** Distinct, concise intelligence delivered through payphone audio.
- **Voice-generation candidates:** ElevenLabs or an open-source/offline text-to-speech alternative, subject to later quality, license, size and browser/mobile performance review.
- Do **not** presume access to, or authorization to imitate, actors' actual voices. Voice production and final cast/character intellectual-property rights need review before public distribution.
- Preserve the existing game's broader audio settings and browser user-gesture restrictions in any later technical work.

## 3. NPC identification and long-term population target

The current target is **100 distinct mission cases**, one per existing NPC, with an underlying **50 primary victims / 50 primary perpetrators** allocation across that set. The first implementation design tranche is **ten missions** (Section 4); the remaining ninety are **not yet authored or approved**.

Required eventual mapping (not created in this documentation commit):

- Each NPC has a **stable, unique, fictional ID/SS-style identifier**. Do not use actual citizens' identification numbers or assume a national ID format.
- Each of the 100 future cases has exactly **one designated primary NPC**, with a stable NPC ID and mission ID.
- Exactly **50 primary NPC classifications = victim** and **50 = perpetrator** across all 100. Keep those classifications hidden in the player interface until the story reveals them.
- Secondary NPC participation is permitted and encouraged. A supporting role in one mission does not consume that character's own primary mission.
- Specific NPC identities, numeric identifiers, role assignments, locations, schedules, and supporting casts are **TBD**. Do not fabricate or lock them until the canonical roster is inspected.
- The initial ten directives do **not** require a fixed five/five split; the 50/50 constraint applies to the completed 100-case population.

## 4. The first ten owner-selected mission directives

These are **threat categories and plain-language player goals**, not final case scripts or proof that corresponding mechanics already exist. The full case details and NPC mapping are deferred.

| ID | Mission directive | Simple player-facing goal | Case-design room for nuance |
| --- | --- | --- | --- |
| **001** | **Prevent Robbery** | Stop an imminent robbery of a person or business. | The suspected robber, target or stolen item may not be what Finch initially expects. |
| **002** | **Prevent Kidnapping** | Find and stop an attempted abduction. | The intended captive or the apparent rescuer may have an unexpected role. |
| **003** | **Prevent Murder** | Protect the intended victim and prevent a killing. | Voight may initially misidentify who is in danger and who intends violence. |
| **004** | **Prevent Corruption** | Interrupt or expose a consequential corrupt act. | A public official, employee, informant or business associate may be coerced or deceptive. |
| **005** | **Prevent Accident** | Identify a looming danger and prevent injuries or damage. | Danger may arise through negligence, sabotage, faulty equipment or mistaken actions; not every accident must be intentional. |
| **006** | **Prevent Arson** | Stop a deliberate fire before people or property are harmed. | A threatened building may conceal something beyond an insurance fraud or dispute. |
| **007** | **Prevent Carjacking** | Protect a driver from an imminent vehicle hijacking. | The pursued driver or the apparent aggressor may not be the true central threat. |
| **008** | **Prevent Extortion** | Stop threats used to coerce money, conduct or information from someone. | The apparent victim may be concealing a separate crime or may be under coercion. |
| **009** | **Prevent Sabotage** | Stop deliberate damage to equipment, property or critical infrastructure. | Misleading blame, workplace disputes or competing motives may shape the case. |
| **010** | **Prevent Bombing** | Locate and prevent a planned explosive attack. | Misleading warnings, decoys and the identity of the real intended target can provide tension. |

The ten labels above are the accepted initial mission **directives**. The examples in the last column are **optional creative directions**, not approved twists or implementation requirements.

## 5. Narrative boundaries and safeguards

1. **Finch's building is the assignment venue.** Do not substitute payphones as the source of new missions.
2. **Payphones carry Machine clues.** Ringing is contextual to the active case, and the player should be able to identify the relevant phone without prolonged searching.
3. **The Machine predicts, but the player acts.** It should not solve every mystery for Voight or override player agency.
4. **Preserve narrative nuance without making gameplay convoluted.** No mandatory long dossiers, nested investigation boards, or opaque chains of objectives.
5. **Respect the current world/physics acceptance gate.** The approved mission direction does not authorize mission-engine implementation, GLB production, movement/vehicle changes, mergers or deployment.
6. **Intellectual property:** *Person of Interest*, Finch and associated identifiers are third-party properties. The narrative references are direction for development; any direct public use of copyrighted character likenesses, protected dialogue, trademarks or actor voice likenesses requires a separate rights/clearance decision. Original names/characters are an alternative if necessary.

## 6. Pending inventory and decisions (not yet authorized for implementation)

The next planning step is to inspect the canonical repo/assets and agree an **inventory and source-of-truth roster**, including:

- Finch's committed `Finch.glb` asset and designated meeting building `NH-04-06-L2` (POI-002); **interior design, placement, animations and dialogue remain pending**;
- `Payphone.glb`, suitable world placements, ringing/answer interaction and trigger conditions;
- 100 existing NPC stable identifiers and fictional ID/SS-style numbers, with concealed 50/50 subject classification;
- Finch and Machine voice pipeline, generation tools, clips, formats and playback;
- ten case definitions, supporting NPC assignments, simple objectives, locations, triggers, mission outcome tracking and HUD/map cues.

**Next authorization gate:** Inventory review and a distinct technical implementation plan. Do not infer approval to write gameplay code from this narrative document.

## 7. Location decision addendum (2026-11-01)

**POI-002** establishes `NH-04-06-L2` as Finch's permanent North Heights headquarters. Its initial map landmark is informational only. The proposed two-level interior is a ground-floor reception with an edge elevator and a 53rd-floor Finch meeting/operations room. Floors 2–52 remain inaccessible and do not require furnished interiors. This addendum does not authorize interiors, placing Finch, elevators or mission code. Refer to [GTD-POI-002](./GTD-POI-002-Finch-Headquarters-Designation-and-Map-Landmark-2026-11-01.md) for source-of-truth building and map data.
