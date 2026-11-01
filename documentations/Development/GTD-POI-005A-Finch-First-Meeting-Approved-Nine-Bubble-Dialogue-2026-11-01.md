# GTD-POI-005A — Finch's First Meeting: Approved Nine-Bubble Dialogue

**Date:** 2026-11-01  
**Project:** G.T.D — Grand Theft Division  
**Repository:** `interlinkglobal/GTD`  
**Working branch:** `feature/finch-headquarters-map-20261101`  
**Status:** **NARRATIVE APPROVED; NOT IMPLEMENTED**  
**Owner decision:** The nine-bubble first-meeting proposal was accepted in conversation. Preserve the wording below as the approved reference; subsequent dialogue changes require owner review.  
**Implementation authorization:** **NOT GRANTED.** No changes to gameplay, UI, model placement, assets, builds, deployments, or mission runtime are authorized by this document.  
**Implementation proposal:** [GTD-POI-005B](./GTD-POI-005B-Finch-First-Meeting-Floor-53-Technical-Implementation-Plan-Pending-Approval-2026-11-01.md).

## 1. Narrative premise and G.T.D interpretation

G.T.D. adapts the dramatic *premise*, not the plot episodes, of *Person of Interest*: an intelligence system detects people connected to possible imminent threats, but cannot tell Finch or Voight whether the identified person is a potential victim or prospective perpetrator. Finch recruits Voight as the field operative who investigates and intervenes.

The established relationship must remain distinct:
- **Finch:** human mission handler, encountered **in person** on floor 53 of the eastern North Heights tower `NH-04-06-L2`. Assignments and briefings originate here.
- **Voight:** the player-controlled field operative, capable of investigating, protecting, preventing, pursuing, and stopping harm.
- **The Machine:** supplies limited, contextual intelligence during **active** investigations through ringing public payphones. The Machine does **not** assign new missions.
- **People of interest:** one principal NPC per future mission, selected from the 100 existing NPC identities; a person's victim/perpetrator classification is deliberately undisclosed to the player at case start.

Keep the foreground simple: one current objective at a time, short dialogue, adult crime-thriller restraint, no compulsory conspiracy-board reading. The first meeting **introduces the premise and the relationship**, but should not create an actual mission without a separately approved mission system.

## 2. Scene and trigger contract

**Setting:** Finch's private office and library, floor 53, in the tower designated `FINCH HQ`. Voight has entered from the ground-floor lobby, taken the elevator, and walked physically close to Finch. The dialogue is rendered as nine sequential **text-only chat bubbles** with the game's established translucent dark-overlay visual language.

**Approved production text below is exact.** Sentence punctuation, paragraph breaks and sequence should be preserved. Use “FINCH” as the speaker. Text is not a voiceover script at this stage; **no voice, sound synthesis, speech API, or impersonation**.

### Dialogue — “The Offer”

**FINCH — 01**

> Mr. Voight. I'm Harold Finch. Thank you for coming.

**FINCH — 02**

> I asked you here because I have a problem that neither money nor information can solve alone.

**FINCH — 03**

> There's a system called The Machine. It analyses patterns in people's lives and sometimes identifies violent events before they happen.

**FINCH — 04**

> But it gives us very little information. Sometimes nothing more than a number belonging to a person.

**FINCH — 05**

> We don't know whether that person is about to become a victim, or whether they're the one responsible. That's what makes this work difficult.

**FINCH — 06**

> That's where you come in. I'll provide the assignments. You'll find these people, discover what's happening, and do whatever you reasonably can to prevent the crime.

**FINCH — 07**

> Occasionally, a public telephone will ring while you're investigating. Answer it. The Machine may have discovered something that could help you.

**FINCH — 08**

> I'll provide the resources you need, and you'll be compensated. But remember, Mr. Voight, these aren't merely numbers. They're human lives.

**FINCH — 09**

> If you're willing, we can begin. There's someone in Meridia who may be running out of time.

## 3. Approved presentation direction

The prior proposal accepted by the owner describes a restrained, dark semi-transparent chat-bubble presentation consistent with G.T.D.'s existing HUD and controller styling. The interactive dialogue should identify **Harold Finch**, make one bubble readable at a time, and progress in the approved sequence. The original proposed mockup included a small `1 / 9` indicator and **Tap to continue** affordance.

The intended trigger is **Voight approaching Finch on floor 53**, not arriving at the building, driving nearby, answering a payphone, or entering the elevator. Avoid forcing the nine messages to show simultaneously.

**Engineering details not yet approved:** proximity distance; touch/keyboard mapping; first-visit persistence vs replay; whether player movement pauses; cancellation/resume policy; auto-dismiss timing; responsive positioning. Those belong to POI-005B's proposed plan and remain subject to separate approval.

## 4. What the introduction deliberately does not reveal

Finch does not disclose the system's creator, full capabilities, ownership, broader conspiracies, future conflict, or whether any specific subject is a victim or perpetrator. The final line hints at an upcoming case but does not allocate an NPC ID, start a mission, assign a target, or claim mission engine readiness.

No original television-script dialogue has been copied into this approved game-introduction text. The character/world naming and protected-character/IP implications must be reviewed before commercial/public release. Do not synthesize or imitate performers' voices without rights clearance.

## 5. Owner-requested scene context (separately pending implementation approval)

The same owner turn also requested:
1. Place the committed `public/GLBs/Characters/Finch.glb` in the floor-53 room.
2. Furnish floor 53 as a combined **hotel-room-style suite, library, and office**.
3. Make the **elevator fully glass** (not merely selected glass sides).
4. Begin a new game **outside Finch HQ**, beside a **yellow parked, usable car**.
5. Redesign the **Floor 53 / Ground Floor** elevator control to match the existing game buttons.
6. Trigger the above nine **silent, text-only** dialogue bubbles when Voight stands near Finch.

These six requirements are the **requested scope**, **not authorization to implement**. Review the associated technical plan (POI-005B) first. Preserve existing North Heights traffic, NPC identities, collision, and loading performance.

## 6. Narrative acceptance criteria

- Exactly nine bubbles; sequential, labelled Finch; no duplicated/omitted lines or paraphrased replacements.
- Proximity trigger only on the accessible 53rd floor in the designated tower, with Finch physically present.
- Voight remains the player character; Finch remains a human mission handler; The Machine is not a mission dispenser.
- No speech, voice generation, actor imitation, or unintended mission activation.
- Casual player can understand **why Voight is there**, **what he will do**, **what the information limitation is**, and **where further clues might come from** without a plot glossary.
- All implementation details remain blocked pending approval of the technical plan and subsequent implementation authorization.

**Next gate:** Owner reviews and approves or revises [POI-005B](./GTD-POI-005B-Finch-First-Meeting-Floor-53-Technical-Implementation-Plan-Pending-Approval-2026-11-01.md). Until that gate, this is documentation only.
