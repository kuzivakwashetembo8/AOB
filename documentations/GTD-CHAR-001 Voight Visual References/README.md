# GTD-CHAR-001 — Voight Visual Reference Set

**Status:** Character identity and canonical portrait direction accepted by user; supporting generated angle/pose studies are modeling and animation references, not rigged 3D assets or exact orthographic measurements. Stage 1 must not be declared fully closed without specific angle/pose acceptance and other G1 evidence.
**Date:** 2026-10-11
**Canonical technical plan:** [GTD-CHAR-001 Technical Implementation Plan](../GTD-CHAR-001%20Technical%20Implementation%20Plan.md)
**Research:** [Voight Development Research](../voight-development-research.md)

## Reference hierarchy

1. **voight-character.png — canonical identity master.** Primary accepted African male character direction, specifically South Sudanese-inspired aesthetic as supplied by the user. Calm, formidable facial expression; deep-brown complexion; textured short tightly coiled hair; restrained facial hair; athletic broad-shouldered V-taper, relatively narrow waist and upright stature. The face, body silhouette, posture and outfit shown in this portrait are the standard against which all later variants are judged.
2. **voight-standing.png — standing turnaround.** Front, left profile, rear and right profile. Reveals shoulder silhouette, jacket length and rear yoke, raised collar, profile, belt, pant fit and boots. Reconciled against the master portrait rather than assumed to be an exact projection of the same underlying 3D mesh.
3. **voight-posture.png — neutral modeling poses.** Front/left/rear relaxed A-pose approximations and a front T-pose. Guides anatomy, clothing clearance, arm span and future rigging. The relaxed A-pose angles differ across panels; the T-pose arm extent and spacing need technical verification rather than literal trace-based modeling.
4. **voight-sitting.png — ordinary seated variations.** Front/side/rear views on a plain chair. Indicates hips and knees bent approximately at seated right angles, boots grounded, upright torso, hand-on-thigh posture, and leather jacket/jeans creasing at hip, knee and shoulder. The chair obscures parts of the rear and leg anatomy; use this as a deformation/pose concept rather than a measured chair-interaction specification.
5. **voight-driving.png — driving seated variations.** Front/side/rear at a steering wheel. Shows upright driver position, forward-directed gaze, bent elbows, both hands contacting the wheel, bent hips/knees and seatbelt layers. These drawings do not specify exact GTD car seat dimensions, steering column/pedal positions or a production-correct seatbelt rig; actual vehicle enter/sit/drive remains deferred from first playable Stage 5.

## Character invariants accepted in principle

- Original South Sudanese-inspired African appearance direction, deep-brown complexion, short tightly coiled textured hair and controlled facial hair; **do not infer a real individual's identity, ancestry or exact anthropometry from these illustrations**.
- Athletic, tall-reading V-taper; broad shoulders, trim waist, long-legged but plausible adult anatomy. Initial technical scale candidate ~1.83 m and ~80 kg is a *proposed target within the user's stated range* (5'9"–6'2", 75–85 kg), not a measurement from concept imagery.
- Upright posture, composed gaze, distinct serious expression; recognizable from behind at standard third-person camera distance.
- One canonical outfit: black/deep-brown leather biker jacket with quilted upper sleeves/shoulder treatment, prominent raised collar, asymmetrical front line and metallic zip details; charcoal semi-formal button-front shirt; dark jeans/trousers; belt; rugged lace-up boots. Retain recognizable shoulder/collar/back silhouette and restrained leather-versus-fabric material contrast.
- Modular-clothing architecture remains required, **without** requiring every future garment to remain identical. The face, physique, recognizable habitual movement, and overall design signature must survive wardrobe changes.

## Technical interpretation, not asset geometry

**Visual fidelity:** The jacket's raised collar, shoulders and rear panels and the haircut provide valuable silhouette/identity cues in third-person gameplay. The black-on-black palette requires test captures in Meridian's dusk/night lighting to ensure shirt, jacket, trousers, hands and face do not become an unreadable dark silhouette. Highlights should result from convincing materials and environment lighting rather than bright costume recoloring without art approval.

**Rigging:** Model a physics/world root distinct from the deformable skeleton. Shoulders/clavicles, upper-arm panels, jacket collar/hem and waist must bend without clipping; knees, hips, seat contact and feet must deform naturally in sitting. Hands need usable steering-wheel and eventual object interaction targets. The skeleton/rest pose must be authored and measured after the foundation is chosen; a generated character sheet is not an authoritative topology, bind pose, bone layout or UV.

**Animation:** Ordinary sitting and driving are separate pose/interaction families: driving has hand targets/steering motion and pedal response, sitting has relaxed arms/seat position. Neither makes full driving/vehicle entry a Stage 5 first-playable deliverable: the current scope requires idle, locomotion, turns, jump and land, preserving Rapier and camera behavior.

**Consistency limitations:** These five pictures were generated independently. Head, eye shape, shoulder width, jacket zipper locations, hair tuft detail, arm angles, boot sizing, occlusions and lighting may not match perfectly view-to-view. Treat **voight-character.png as identity authority**; discrepancies in secondary drawings must be resolved during actual model authoring rather than copied literally. A- and T-pose drawings are visual aids, not orthographic scan data.

## Implementation authority and approval gates

The images document a **Stage 1 visual direction**, not a vetted source asset, licensed mesh, commercial distribution clearance, trial result, selected permanent foundation or proof of mobile rendering performance. Stages 2–5 proceed according to the user-approved technical plan and each stage's authorization. No current GTD runtime files, existing player capsule, accepted vehicles, first-frame render witness or production deployment are modified by this reference relocation.
