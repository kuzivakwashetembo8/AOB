# GTD-VEH-CABIN-FIT-003 — Visual Rejection and Failure Modes

**Recorded:** 2026-10-15  
**Decision:** **FAILED — OWNER REJECTED VISUAL IMPLEMENTATION.**  
**Priority:** Primary = protruding lower limbs; secondary = vehicle tire/road clearance.  
**Next action:** Preserve accepted AR1 and pause further patching until a new directive.  
**Experiment:** `exp/veh-cabin-fit-003-20261015`  
**Tested source commit:** `0c46cfb14a5a6bd74d5ebfca1988dc70b343eed8`  
**Vercel deployment:** `dpl_AFEW4AWeGS7use8yQ6Z7usevh7pT`  
**Tested preview:** https://gtd-jmuh4d25r-interlinkglobaltech.vercel.app/game?gtdCabinFit003=1&gtdSeat001=1&gtdVehFit002=1&gtdFitPose002=1&gtdFitGround002=1

## 1. Decision and scope

The user reviewed five live browser screenshots of the new Cabin Fit 003 experiment at South Ward / Mercer Street and explicitly instructed:

> Document the implementation as failed. Driving forward caused the car to float. Note that the viewpoint matters, from above or directly beside the car there seems to be a no visible but from the bottom looking up: there is no wheel and floor connection. This is a secondary error, the dominant one is the poking legs issue.

The outcome is a **visual rejection, not a successfully finished adjustment**. Automated TypeScript, Vitest and deployment gates were green: 74 test files / 297 tests passed and Vercel READY. Those results remain historically correct, but they **must not** be interpreted as success of the actual driver/vehicle contact constraints.

No diagnosis JSON or synchronized physical wheel/road support measurement accompanied these screenshots; the report must **not invent clearance distances, definite defective limbs, or root causes**.

## 2. Primary failure FM-FIT003-01 — lower-limb geometry still exits through Ferrari underside

**Observed:** Yellow/orange leg, shoe, or foot geometry remains visible beneath the car's lower body in multiple submitted views. The broad side screenshot at scene time approximately 16:18 exposes a pronounced yellow segment underneath the driver's cabin. The nearer, low-angle screenshot around scene time 16:18 and elevated side screenshot around 16:00 likewise show exposed yellow geometry. Even as the camera moves, the visible leaked portion persists in one or more views.

**Expected:** Every exposed shoe, heel, sole and lower-leg mesh vertex stays within the physical interior envelope of the Ferrari; when the feet approach the pedals, no section passes through the underbody into external road space. Preservation of accepted seated head/torso/back alignment is mandatory.

**Result:** **FAIL**. Cabin Fit 003's new imported `carpet` floor map and CPU-skinned foot/toe sample mechanism did not achieve the required rendered containment in this preview. The previous residual leak was not eliminated to the owner's satisfaction.

**Origin not yet proved:** Screenshots alone cannot distinguish whether the visible yellow shape originates from (a) a foot/toe skin region, (b) calf or other lower-leg skin deformation, (c) an incorrect reference footwell support surface, (d) an IK correction rejected by its conservative cap/rollback or (e) a mismatch between skin deformation and the floor sample. The **lowest sole Y** alone is not proof that the whole shin/calf is contained by an underside surface. In fact the experimental source currently selects vertices strongly weighted to foot/ball bones, while the screenshots may show an adjoining limb segment; this is a testable design limitation, not a verified root cause.

**Severity:** Dominant gameplay/visual defect; do not downgrade merely because its visible area is localized. **G4 fails primarily on this issue.**

## 3. Secondary failure FM-FIT003-02 — vehicle floats after forward movement

**Observed:** User reports that driving forward caused the Ferrari to float over the road. In several submitted screenshots a visible open air gap separates wheels/vehicle underside and rendered ground; the most decisive evidence comes from a low view looking upward beneath the Ferrari, particularly the angle captured around scene time 17:52. The vehicle appears suspended with no convincing tire-to-road contact.

**Viewpoint dependence is essential, not incidental:**

| Camera position | Evidence interpretation |
| --- | --- |
| Above the Ferrari | Elevated surfaces, body and tires can mask the separation; *apparent* contact is not proof |
| Ordinary direct side view | The gap may look small or visually absent depending on camera and road perspective |
| **Below / looking upward** | **Disconnection between wheels and road becomes conspicuous** |
| During/after driving forward | User reports the car floating after forward motion; stationary correctness cannot be inferred from moving state |

**Expected:** Correct wheel tread-to-rendered-surface contact from all meaningful camera positions, both stopped and after driving; no unexplained floating or road penetration. Support must be measured for **each wheel individually** against the actual visible road and its matching Rapier collider.

**Result:** **FAIL — SECONDARY**, and must be independently diagnosed without using a character-pose workaround.

**Causality limitation:** The screenshot proves an unacceptable appearance, and the owner reports its emergence while driving forward. The evidence does **not** prove whether Cabin Fit 003 changed physics, whether the inherited AR1 calibration caused this behavior, whether the road is sloped/elevated at the sampled location, or whether a visual-anchor mismatch accumulated. Do not claim a code-level mechanism without A/B motion data and actual live witness output.

The tested query did **not** enable optional `gtdFitWheel002=1`; do not count this preview as an acceptance test of independent visual wheel-travel. Nevertheless, the standard combined vehicle/road presentation failed the user's actual visual requirement.

## 4. Preserved success and control conditions

- The previously accepted **AR1 seated character posture** remains the recovery baseline. This failure is of the **additional Cabin Fit 003 experiment**, not retrospective rejection of AR1's accepted principal seat alignment.
- No globally translated/shrunk/hidden humanoid, new Ferrari Y offset, random IK target or physics tweak should be used to conceal the failed rendering.
- Accepted preview: https://gtd-7r0gftpf1-interlinkglobaltech.vercel.app/game?gtdSeat001=1&gtdVehFit002=1&gtdFitPose002=1&gtdFitGround002=1
- New Cabin Fit 003 test URL includes `gtdCabinFit003=1`. For a controlled A/B **within the same deployment**, omit only that one flag. That comparison was not supplied with this particular rejection and should be performed only if later authorized.
- All five source screenshots are in the originating chat; this Git commit records their observations but does **not** claim the binary images were embedded in repository docs.

## 5. Required future investigation (not authorization to patch)

First establish the **primary** defect:
1. Capture `window.__GTD_VEH_FIT_002_REPORT__?.().character.fittedDrivingPose.cabinFit003` after entering/driving/stopping and capture corresponding front, side, underside and overhead frames. Include `floor.evidence`, `footResults`, identified foot, sole source mesh, `penetrationMetres` and `acceptedLiftMetres`.
2. Check the actual skinned *leg and shoe* polygon geometry against the Ferrari's **real underbody volume**, not only a shoe-sole point against `carpet` height. Distinguish an exterior ankle, leaked toe, shin/calf deformation, and missing floor support. A floor mesh does not by itself define all sidewalls or a closed 3D cabin.
3. Compare actual before/after bone transforms and sampled skin vertices with a fixed AR1 baseline, preserving the approved head/back/torso pose. If the nominal 80-mm correction cap rejects a genuine error, report that as a failed candidate—not permission to enlarge it arbitrarily.

Then establish the **secondary** defect separately:
4. At identical physical spots before/after forward driving, collect four wheel-tread minima, four matched rendered-road support heights, physics support and body/visual-anchor Y, under the same flags.
5. Compare unchanged AR1 and Cabin Fit 003, then test independently with/without optional wheel visual-travel feature; do not conflate a camera occlusion effect with real contact.
6. Include low-angle underside screenshots as a **mandatory acceptance witness**: top/side views alone can hide the floating gap.

**Do not start corrective coding or a deployment from this rejection message.** The owner requested documentation of failure, not another patch. Once a new directive is issued, isolate the primary fitting defect first, then the independent road-grounding failure.

## 6. Release gate and next decision

| Gate | Status |
| --- | --- |
| Static typecheck, unit tests and Vercel build | **PASS — historical 297/297** |
| Ferrari interior containment / visible legs | **FAIL — primary** |
| Tire/road connection during/after driving | **FAIL — secondary** |
| AR1 accepted seated head/back posture | **PRESERVE** |
| Buggy/future vehicle interior calibration | **NOT VERIFIED** |
| G4 visual acceptance of Cabin Fit 003 | **FAILED / STOP** |
| G6 and main promotion | **CLOSED / NOT AUTHORIZED** |

**Final disposition:** Cabin Fit 003 was technically integrated but **failed real-world visual evaluation**. Preserve the working AR1 baseline and this rejected preview for forensic comparison; no additional code patch or deployment until explicit authorization.
