# GTD Level 001 — Diane | Approved screenplay and technical contract

Date: 2026-11-02
Branch: `feature/level-001-diane-20261102`
Source: Reese preview `9378c5de7a2940ddd3065e146175caf80c73e9bc` (Finch HQ glass elevator and empty 53rd floor). Main has not accepted/merged those previews.
Status: **Approved for implementation, not accepted for production.**

## Owner decisions

- This is the **first playable mission** for Agent Reese in North Heights.
- Condense exposition: no more than **four bubbles per conversation**, four at assignment and two on return.
- One existing **female** NPC becomes **Diane**, with a stable fictional (invalid, non-real) SSN shown in a floating label over her head at close range.
- Reuse three existing NPCs as civilian-clothed police officers; no new models, weapons, combat, chase failures, timers, or complex crimes.
- Finch assigns a machine-generated identity; Diane follows an authored sidewalk route; Reese follows, discovers her meeting officers, and returns to Floor 53 to report. No episode remake.
- Diane's **map location is an anonymous, circular lowercase `i` place-of-interest pin**, on compact and expanded maps. **No name, SSN, or other text labels on the map.** The pin is a location clue, not a live tracker, and disappears after she is found.
- No fast-travel or cutscene; keep normal walking, driving, elevator and third-person camera controls. Observation requires short-range view of the meeting. Pausing/recovery is forgiving.
- Persist stage and stable case identities in localStorage. On reload resume an appropriate mission checkpoint; completion stays completed.
- Existing 100 pedestrian appearances, 125 car agents, Finch location/dialogue encounter remain intact.

## Level script

**Finch assignment (four bubbles):**

1. Finch: “Mr. Reese, The Machine has given us a new number.”
2. Finch: “Her name is Diane. We don't know whether she's a victim or a perpetrator.”
3. Finch: “Find her and follow her. I want to know who she's meeting.”
4. Finch: “Don't intervene. Come back when you have something.”

**Objectives:** Find Diane → Follow Diane → Return to Finch.

- Find: map shows only an `i` point of interest at Diane's starting position; entering short identification range reveals the name and fictional SSN on Diane's overhead world label.
- Follow: Diane walks a short, reliable, precomputed pedestrian-graph route with recovery pauses if the player lags. The marker stops advertising her position.
- Observe: she meets three waiting plainclothes officers. Maintaining a short, forward-facing view from nearby for a few seconds completes the observation. A brief on-screen cue communicates the discovery; no interaction button or NPC conversation.
- Return: player walks/drives to Finch HQ and rides the elevator to Floor 53, where Finch stands alone in the empty room.

**Return report (two bubbles):**

1. Reese: “Diane met three men. Plainclothes officers. They seemed to know each other.”
2. Finch: “Interesting. I'll look into them. We may have misunderstood Diane's role in this.”

Show mission completion and leave Level 002 unavailable. Do not reveal Diane as a perpetrator at this stage.

## Technical gates

1. Mission state transitions are monotonic, persisted and validated on read, and do not duplicate or alter global NPC population.
2. Scripted four NPC identities are deterministic and not controlled simultaneously by the ambient simulator. Authored route uses the shared pedestrian graph.
3. World-space nameplate has Diane's permanent case name + unique fictional invalid SSN; the **map has none of that text**.
4. Four opening and two closing bubbles are not replayed after completion; a previously completed 9-line Voight introduction must not suppress this new mission.
5. NPC model visual identity / gender should be checked during owner preview. The existing GLB manifest has no gender metadata, so do not claim GLB gender from file name alone.
6. Existing Finch mission encounter, glass lift, flat lobby, empty floor 53, Reese animation, physics and camera are not regressed.

Preview deployment and owner's in-game visual acceptance are required before any merge to main.
