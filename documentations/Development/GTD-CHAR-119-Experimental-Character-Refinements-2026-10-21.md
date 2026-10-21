# CHAR-119 — Experimental Character Refinements

Date: 2026-10-21. Branch: Experimental-Character-Refinements.
Baseline: e469d50cdcf1c19edf6058fa11df7fb339f84d45 (accepted CHAR-118).
Status: all three refinements fully accepted by Harmony after preview review; merge to main and production deployment authorized.

## Confirmed intent
1. Add restrained elbow articulation while the complete arm swings, avoiding a rigid straight-arm impression or forearms held in front of the torso.
2. Increase actual walking travel speed by at least 10 percent and coordinate animation cadence.
3. Add understated idle life: slight movement of the back, occasional head/arm adjustments and blinking where the GLB supports it.
Preserve accepted CHAR-117 arm clearance and CHAR-118 five-degree walking back inclination.

## Actual implementation
- retargeted-walk-110.ts: after the accepted walking playback and spine inclination, aim each elbow-to-wrist vector slightly toward actor-forward in its audited parent frame. Added direction strength varies smoothly from 0.035 to 0.080, with opposite half-cycle timing on each side. Cap correction at 0.09 radians (5.2 degrees) times locomotion weight. This is additive flex, not a wrist twist or an extra shoulder reach. Wrist local facing is retained.
- gtd-runtime.ts: imported-character walking travel speed increases from 1.5 to 1.65 m/s (+10%). This constant is used in actual displacement, not only visual playback. Existing actual-speed/1.5 cadence scaling produces a corresponding 10% faster cycle at unobstructed full walking speed. Other actors, sprint, vehicles and flight retain their existing policies.
- Idle uses the same player after locomotion fades out. Each idle frame starts from captured accepted bases, avoiding accumulated offsets. Delay 0.6 seconds then fade idle activity in over 1.2 seconds.
- Gentle spine breathing has a 4.8-second period and 0.004-radian primary amplitude. Head adjustment is a smooth 2.8-second event within an 11-second schedule (maximum 0.035 rad yaw and 0.025 rad pitch). A right-arm adjustment lasts 3.2 seconds within a 14-second schedule (0.012 rad upper-arm and 0.045 rad forearm maximum). These schedules are bounded and deterministic rather than per-frame random jitter.
- Actual character.glb contains eyeBlinkLeft/eyeBlinkRight morphs on the head and eyelashes. mercer-static-character-103.ts gathers those targets from the cloned instance's meshes and passes them to the player. Both sides close/reopen with 0.20/0.18-second smooth pulses within a 9.3-second schedule. Source container morphs are not modified. Babylon's instantiateModelsToScene clones each mesh morph manager.
- Moving clears idle time and restores blink bases immediately. Stop allows the normal walk fade before idle begins. reset, control switch and disposal restore the accepted rotations and original blink influences. Static showcase character remains unchanged while not controlled.
- No GLB edits, new assets, new physics bodies or React simulation loop.

## Verification
- Four regression files / eight tests passed. Tests cover the previous accepted pose, five-degree spine inclination, lower-body transforms, bounded variable elbow flex, wrist facing, idle movement limits, synchronous blink closing/reopening, stopping, movement interruption and reset.
- CHAR-118's arm preservation test still protects shoulder/upper-arm/hand local rotations; forearm is deliberately excluded there because its flex is this experiment. A separate regression caps and checks the new varying forearm correction.
- Targeted TypeScript check of the changed player and regression passed. Vercel additionally runs the repository-wide type check and test suite before building.
- Actual-GLB CPU-skinned side/three-quarter comparison inspected across walking phases: the added bend is modest and the accepted back/upper-arm silhouette remains. This is diagnostic evidence, not browser visual acceptance.
- Preview is required for Harmony's acceptance or denial. Do not merge or deploy production until instructed.

## Acceptance gate — 2026-10-21
Harmony: “The experiments were all successful. Document the additions, merge with main then deploy.”

Accepted runtime: 08294f8ec43f0fee60d89cfae47f2001bf51daef.
Reviewed preview: https://gtd-mrnfrvp19-interlinkglobaltech.vercel.app/game .

Accepted additions: gentle phase-varying forearm flex; 10% faster imported-character walking (1.65 m/s with actual-speed cadence synchronization); subtle idle breathing, occasional head/arm adjustments and synchronized authored head/eyelash blinking. Preserve the previously accepted arm clearance, wrist facing and five-degree distributed walking back inclination. No further runtime modifications are included in this acceptance commit.

Eight targeted regression tests passed, followed by the repository-wide type check, test suite and successful Vercel preview build. The reviewed preview /game and build-version.json both returned HTTP 200 and reported the exact runtime above. Harmony's visual review closes the experimental gate. Earlier experimental-only/no-release instructions in this document are historical and superseded by the explicit merge/deploy authorization.
