# CHAR-117 — Standing and Walking Torso Posture: Visual Observations

Date: 2026-10-21.
Status: observation and reference specification only. No implementation authorized.
Branch: Walking-Posture-Refinement.
Related record: [CHAR-116](GTD-CHAR-116-Walking-Posture-Refinement-2026-10-21.md).
Preserved main checkpoint: b977dea31a496964412aefffb75e181a376d862a.
Reviewed preview runtime: 9dc5c237fce2ebccef0bea51c85e791b34f62730.

## Direction from Harmony
Harmony confirmed the earlier posture comparison was correct and requested that it be documented before work begins. The development humanoid is the standard Voight should follow for standing and walking upper-body posture. Observe and document only.

Lower-body walking, feet and stance were accepted under CHAR-116. The torso/elbow issue remains unresolved. Preserve the accepted lower body during future work. No merge, deployment, pose adjustment, animation change or GLB edit is part of this observation task.

## Image register
The first two images established the comparison. The four additional images provide standing and walking views of both characters. Filenames identify the supplied references; these are observations of the screenshots, not measurements of their underlying rigs.

| Reference | Character and apparent state | Main evidence |
| --- | --- | --- |
| no-space-between-arms.png | Voight, standing-like pose | Arms closely follow the torso; red annotations identify the closed silhouette. |
| space-between-hands-when-walking.png | Development humanoid, mid-step | Green annotations identify visible space between arms and torso; arms have distinct bends. |
| image(20261021-152616).png | Development humanoid, standing reference | Both arms sit apart from the waist; elbows and forearms remain visually distinguishable. |
| image(20261021-152740).png | Voight, standing reference | Upper arms blend into the jacket/chest outline; hands have clearance but the opening above them is limited. |
| image(20261021-152857).png | Voight, walking reference | A foot advances/lifts, but the arms retain a similarly narrow frontal outline beside the torso. |
| image(20261021-152919).png | Development humanoid, walking reference | A stepping leg and separate arm outlines coexist; clearance beside the waist remains visible. |

The four new images show the same preview host, gtd-cwohdzyea-interlinkglobaltech.vercel.app/game. Camera position and character proportions vary; do not treat pixel differences as anatomical distances.

## Confirmed earlier analysis
Voight's arms look pressed alongside his torso; the mannequin's arms have a visible, relaxed bend that creates space beside the body. The difference starts above the hands.

| Feature | Voight | Development humanoid |
| --- | --- | --- |
| Shoulder-to-elbow line | Upper arms descend tightly beside the chest, blending into the jacket's outline. | Upper arms separate slightly from the chest, giving each arm its own outline. |
| Armpit opening | Little visible background between the upper arm and ribcage. | A narrow opening appears below the armpit and extends toward the waist. |
| Elbows | Visually tucked into the body's outline; their bend is difficult to distinguish. | Sit visibly outside the waist and form a gentle change of direction between upper arm and forearm. |
| Forearms | Look almost like straight continuations of the upper arms, close against the sides. | Angle independently below the elbows, producing a soft bend rather than a rigid vertical line. |
| Hands and hips | Some clearance from the thighs, but that clearance does not continue upward through the forearms. | Hands remain clear of the hips, with an open corridor between the arms and waist. |
| Overall posture | Closed and constrained: the arms appear held against the body. | Open and articulated: the arms appear to hang with a slight natural bend. |

Elbow clearance and hand clearance are different objectives. Moving Voight's hands farther outward could widen the bottom of the silhouette while leaving the upper arms and elbows compressed. The intended shape needs separation beneath the armpit, a distinct elbow beside the waist, and a relaxed forearm leading down to the hand.

## Additional standing observations
The humanoid's standing reference shows that clearance is part of its resting posture. It is not merely a momentary opening caused by an arm swinging forward during walking. Its upper arm, elbow and forearm form a gently articulated contour, with background visible alongside the waist.

Voight's standing view remains narrow through the upper arms and elbow region. The hands are visible beside the thighs, but hand separation alone does not create an open armpit-to-waist contour. His arms read more as vertical extensions of the jacket than as independently hanging limbs.

Both characters are generally upright in these frontal views. A need to tilt the torso or lift/shrug the shoulders is not established by the images.

## Additional walking observations
Voight's walking image shows lower-body progression while the frontal arm silhouette remains close to the standing silhouette. This establishes that the visible clearance problem persists during walking. It does not establish that his arms have no swing: forward/backward motion can be foreshortened in a frontal still.

The humanoid's walking image retains visible space beside the torso while stepping. The desired arm opening therefore needs to survive the walk cycle, not exist only at one neutral pose or selected frame.

The reference standard is a relaxed articulated arm carried beside the body during both states. Walking should add moderate forward/backward movement and slight opposite shoulder/leg coordination to that standing posture. Exact timing, amplitude, shoulder rotation and continuous clearance cannot be proven from isolated screenshots; they need matched views across a full cycle during future review.

## Visual target for future work
- Standing: relaxed shoulders, a small opening beneath each armpit, an elbow visibly distinct from the waist, and a gentle forearm bend leading to the hand.
- Walking: retain that open arm/torso relationship while the arms move moderately back and forth; preserve opposite shoulder/leg coordination.
- Keep the accepted palm orientation. Do not obtain the gap by visibly twisting the palms outward.
- Judge the whole shoulder–elbow–wrist relationship and the rendered jacket/sleeve contour. Wrist spacing or bone coordinates alone are insufficient.
- Match the humanoid's posture behavior using Voight's own proportions and clothing. Do not demand identical pixel gaps or copy the humanoid's leg stance.
- Retain the accepted CHAR-116 lower-body behavior.

## Observation limits and unresolved mechanism
Voight's jacket fills more space around his chest and upper arms; the humanoid's narrower exposed waist exaggerates its openings. Clothing and proportions affect the visible gap and must be considered.

The elbow tips and cubital fossae are not clearly exposed in these frontal screenshots. The images establish the closed silhouette but do not determine which bone requires axial rotation, the correct rotation direction, or whether skinning contributes to the problem.

The previous numerical tests established joint positions and palm orientation, but Harmony's review found the visible elbow posture unresolved. This is evidence that those tests were insufficient for visual acceptance, not proof of a particular skinning defect.

Before any future implementation, inspect the actual rendered arm silhouette from matched standing and walking phases, including side/three-quarter views where needed, and trace the relevant joint frames and skin deformation. This document does not prescribe an unverified bone correction.

## Review record
Harmony's accepted standard: “The humanoid is the standard Voight should follow.”
This commit records observations only. Torso implementation awaits a further instruction.


## Subsequent acceptance — 2026-10-21
The observation-only record above is historical. Harmony authorized implementation, reviewed preview runtime 4ee747980aa3c7fb6383d246c353d730aff8f069, and fully accepted the standing/walking upper body. Merge and production deployment are now authorized. Lower-body stride refinement remains open. See [the accepted implementation and NPC reuse guide](GTD-CHAR-117-Upper-Body-Acceptance-and-NPC-Reuse-2026-10-21.md).
