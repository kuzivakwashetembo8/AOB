# GTD-CHAR-120A — Sprint Arm-Swing Isolation / First Refinement

**Date:** 2026-10-22 (Africa/Johannesburg)  
**Branch:** `feat/char-120-natural-athletic-sprinting-20261022`  
**Parent technical schema:** `GTD-CHAR-120-Natural-Athletic-Sprinting-Technical-Implementation-Schema-2026-10-22.md`  
**Status:** User-authorized isolated upper-limb refinement; **not accepted visually**, no merge or production deployment authorized.  
**Baseline preview:** `https://gtd-5j9jbhml4-interlinkglobaltech.vercel.app/game`, release `a8ca516e0197aba65dcdc89a8231796c0bcedebb`.

## Owner observations and preservation decision

On the baseline CHAR-120 sprint preview, the owner reviewed two South Ward/Mercer Street running screenshots against three Payback 2 running references, then three additional 3D running-posture reference images. The owner explicitly accepted the **sprinting legs**: knee drive, alternating strides and extension appear correct. However, the arms and elbows still hang too straight and close to the hips; upper-body athletic action is insufficient.

The owner directed: **preserve the already accepted lower-body sprint, torso inclination, and shoulder/clavicle motion**; only adjust the swing and bending of the upper arms, elbows and forearms. Observe how that one factor blends with the existing leg motion before touching any other parameter. The running references specify pronounced forward/back arm drive, visible elbow bend, and opposite-arm/opposite-leg coordination, without clenched/rotated wrists or shoulders being lifted.

## Evidence-based root-cause candidate

In `src/game/character/retargeted-walk-110.ts`, `sprintDelta()` centers `Left/RightArm`, `Left/RightForeArm`, and `Left/RightShoulder` using the average (hemisphere-consistent quaternion) of each UAL `Sprint_Loop` track. It then plays only the cycle deviation at gains 0.85 (upper arm), 0.70 (forearm) and 0.65 (shoulder). The accepted CHAR-119 supplementary walking forearm flex is also faded to zero at full sprint. This removes the authored sprint's average elbow flex as well as attenuating its swing.

The deployed, generated `char120-ual-sprint.json` was read from the verified preview. Measurements of averaged cycle quaternions (relative to the same source UAL `Idle_Loop`; **not screen-space arm angles**) are:

| Joint | Mean source-relative rotation magnitude | Maximum authored cycle excursion around mean | Playback before refinement |
| --- | ---: | ---: | --- |
| RightArm | 0.381 rad (21.8°) | 0.247 rad (14.2°) | zero mean; 0.85 × excursion |
| LeftArm | 0.381 rad (21.8°) | 0.270 rad (15.5°) | centered; symmetric playback reflects opposite-phase right |
| RightForeArm | 0.956 rad (54.8°) | 0.566 rad (32.4°) | zero mean; 0.70 × excursion |
| LeftForeArm | 0.983 rad (56.3°) | 0.541 rad (31.0°) | centered; symmetric playback reflects opposite-phase right |
| RightShoulder | 0.064 rad | 0.053 rad | **must not change** |
| LeftShoulder | 0.145 rad | 0.052 rad | **must not change** |

**Hypothesis:** resetting ~55° of authored source-relative elbow bend to a cycle-centered zero produces a relatively straight forearm during sprint. It should be tested by restoring a **bounded fraction** of the native authored mean alongside enough of the oscillation to reveal natural arm pumping. This is a candidate cause, not an assertion that restoring source poses automatically produces anatomically correct target poses.

## Authorized scope of the next code change

1. In `sprintDelta()` only, leave `Left/RightShoulder` calculations, `Spine/Spine1/Spine2`, `Hips`, `Neck/Head`, every leg/foot/toe, and all runtime movement/input code unchanged.
2. For **Arm** and **ForeArm** only, reconstruct `authored cycle deviation × controlled authored mean bias` in the current retarget-relative joint frame, with fixed clearly named gains. Keep the 0.22-second sprint crossfade, cycle timing and mirrored bilateral arm phase as-is. **Do not** introduce a new sine-wave, procedural pose author, elbow-axis roll, or a new joint calibration pass.
3. Start conservatively: upper-arm oscillation amplification around 1.35 and a partial (around 0.50) source-average bias; forearm oscillation around 1.10 and partial (around 0.65) source-average bend. These are **experimental tuning coefficients**, not acceptance criteria or joint angle commands. Measure resulting skin silhouette rather than assume the quaternion axes match an anatomical elbow flex angle.
4. Right and left hands stay anchored to their existing accepted wrist orientation; continue to inherit forearm rotation. `flexWalkingForearms()` remains unchanged and gated to walking.
5. Verify side profile: leading elbow bends forward, rear elbow tracks behind torso, leading hand rises nearer lower chest, opposite hand goes back, arm drive counter-phased to lead leg, no inward crumpling, wrist twist or shoulder shrug. Verify front/rear silhouette too.
6. Regression gates: the sprinting **non-arm transforms** must match the baseline (Hips, legs, spine, shoulders, neck, head, hands as local quaternions); walk-only and standing poses must match exactly. Check crossfade to walk, reset and disposal. Existing 424-test suite must pass; G2 retarget gait symmetry audit must remain successful.
7. Preview **after** refinement and successful deployment only; no intermediate or unrelated preview. Visual acceptance remains with the owner. No merge to `main` or production deployment.

## Execution log

- **2026-10-22:** Observation and isolation strategy authorized. Existing CHAR-120 running legs declared visually successful; arm motion remains developmental. Offline running source and retargeted foot symmetry previously passed. This entry is committed **before** the authorized runtime refinement.
- **Refinement implementation:** pending when this document was first written. Subsequent runtime commits and preview build status should be appended only after verified.

**Do not mark CHAR-120 sprint posture accepted until the owner reviews the refined preview.**
