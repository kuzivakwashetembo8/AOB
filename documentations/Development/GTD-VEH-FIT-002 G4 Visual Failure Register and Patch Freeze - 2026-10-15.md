# GTD-VEH-FIT-002 — G4 Visual Failure Register and Patch Freeze

**Date:** 2026-10-15 (South Africa time)  
**Status:** **G4 FAILED; DEVELOPMENT PATCHING PAUSED BY OWNER.**  
**Allowed while paused:** documentation, evidence preservation, discussion, conceptual diagnosis.  
**Not allowed while paused:** gameplay or physics source edits; corrective commits; implementation branches; preview deployments; merge into `main`; production releases; declaring G4 closed; opening G6.  
**Repository/branch:** `interlinkglobal/GTD` / `exp/veh-seat-001-ual-driving-loop-20261015`  
**Latest inspected experimental build:** `9fd9d76c092c8dea01a18fb945b9ff753522373c`  
**Latest tested Vercel preview:** https://gtd-f9qnp8sij-interlinkglobaltech.vercel.app/game?gtdFitPose002=1&gtdFitGround002=1&gtdSeat001=1&gtdVehFit002=1  
**Evidence supplied:** three owner screenshots (low / medium side-angle and road interaction) plus a 573-line live `gtd.veh-fit-002.contact.v1` JSON, copied from that preview. The original image and JSON attachments remain with the development conversation; these measurements are transcribed rather than claiming the binary attachments are committed to GitHub.  
**Parent source of truth:** `GTD-VEH-FIT-002 Driver Contact and Four-Wheel Road Integrity Technical Patch Plan - 2026-10-15.md`, especially sections 11–13.1.

## 1. Owner instruction and gate decision

The owner instructed: **“Document all the recent failure modes then pause patching.”** This instruction supersedes the previous authorization to continue implementing G1–G4 immediately. **No source patch is authorized until the owner explicitly resumes it.**

G0 actual-model telemetry is operational and useful. G1 footwell fit **fails**, G2 hand-to-wheel fit **fails**, G3 four-tire visual grounding **fails or remains unproven depending on metric**, and G4 integrated visual acceptance **fails**. **G6 remains closed and undefined**; do not infer or implement its contents.

The last automated build passed **287/287 tests across 72 files**, and the Vercel deployment was READY. This is evidence of build/unit-fixture readiness **only**, not real GLB scene acceptance. The failure modes below are directly demonstrated by user images and runtime values.

## 2. Exact reproduction scope and experimental switches

The latest user screenshot URL contained:
- `gtdFitPose002=1`: enabled combined leg and hand pose correction.
- `gtdFitGround002=1`: enabled tread/chassis road calibration.
- `gtdSeat001=1`: enabled the accepted in-car Voight seating setup.
- `gtdVehFit002=1`: enabled the read-only report.

**CRITICAL control detail:** the URL **does not contain `gtdFitWheel002=1`**. The report independently confirms `visualWheelSupportEnabled=false` and exactly **zero** independent wheel-travel displacement on all four wheel pivots. Consequently, this run **does not test the optional per-wheel visual suspension adapter**. The chassis/road-calibration path is nevertheless tested and visually problematic. Do **not** conflate these two mechanisms.

The Ferrari reported `speedMps=0`, `grounded=true`, `distanceMetres=99.6422705677239`, `yaw=4.567137930157853`, `visualAnchor=(-51.44822693,-0.05905987,17.48057175)`. World HUD identifies **South Ward / Mercer Street**. The values describe **one captured stopped frame after a drive**, not the complete drive or a repeated sample distribution.

## 3. Visual rejection record

### FM-001 — legs, boots and hands escape exterior bodywork (critical)

**Visible:** A leg/boot projects through the Ferrari's driver-side lower door/body panel. The low-side images also show an extended lower limb/foot below the undercarriage. An upper limb/hand appears outside the door skin where it should be inside the cockpit. The problem is visible from several near-side camera positions, with the car otherwise present and the character's head/upper torso visible in the seat.

**Expected:** Legs positioned within the footwell, feet forward toward pedals, hands touching the wheel from inside the cockpit, back/torso remaining against the accepted seatback. No external mesh penetration from any camera angle.

**Evidence:** Three screenshots of the second corrective preview, approximately scene clock 15:51–16:08. `Driving_Loop` is active. Named left/right thigh, calf, foot, toe, upperarm, forearm and hand bones all resolve (no missing aliases). Thus **missing joint identification is not the present cause**.

**Impact:** A clear and severe character/vehicle integration failure, visible during standard gameplay. **G1 and G2 do not pass.**

### FM-002 — IK solver reports nonconvergence; none of four intended contact chains applied (critical)

**Actual live report:**
| Limb | Target residual distance (m) |
| --- | ---: |
| Left foot | 0.8887168987 |
| Right foot | 0.7127634920 |
| Left hand | 0.8220463817 |
| Right hand | 0.7378817011 |

`fittedDrivingPose.status="out-of-tolerance"`; `appliedLimbs=[]`; `missing=[]`; `correctionMode="both"`. The intended `<=0.06 m` per-contact success threshold is missed by a large margin.

**What improved:** The new status correctly **rejects false success** instead of treating an attempted IK call as successful. The bone alias mapping now reaches real `pelvis`, `thigh_l/r`, `calf_l/r`, `foot_l/r`, `upperarm_l/r`, `lowerarm_l/r`, `hand_l/r`.

**What has not improved:** The actual pose does not converge to the desired contacts. The previous rejected preview showed residual foot errors `1.2953 / 0.9881 m` and hand errors `0.4711 / 0.2931 m`. In the **latest** sample, feet error values are smaller while hand target errors are **larger**. Because the target geometry was revised between previews, those error changes must not be construed as a controlled before/after improvement or deterioration in overall visual quality.

**Source-level mechanism/uncertainty:** `driver-cabin-pose.ts` uses a bounded two-link rotational solver on imported linked bones during a scene pre-render callback. Successful bone *lookup*, achievable synthetic target distances and zero compiler errors do not establish compatible bone rotation axes, animation update order, reachable posture, or mesh/footwell containment. The exact reason the real linked-bone pose is not moving to the targets **is not verified**. Potential overwritten animation values, reference-frame errors, joint solver geometry and reach constraints remain hypotheses requiring a separately authorized investigation.

### FM-003 — hand separation from actual steering wheel remains unacceptable (critical)

`steeringWheel.found=true`, real mesh `steering_carbon`, centre `(-51.14249585,0.81943440,17.89192006)`, reported radius `0.18165284m`. Actual hand-bone distances **to wheel centre**, explicitly **not** the grip-point residual, are `0.99171980 m` and `0.89751038 m`. Both hand contact solver residuals remain above `0.73 m` (FM-002). The exterior screenshots show a hand passing through the outside of the door rather than resting plausibly at the steering wheel.

**Root state:** The steering wheel reference is found. G2 fails because hands are not fitted to it. Whether the wheel centre/radius's AABB is an anatomically accurate grip surface remains unresolved; do not add finger IK or declare a grasp.

### FM-004 — vehicle-road visual alignment remains visibly wrong (critical)

**Visible:** Front and rear tires and the Ferrari body appear elevated/suspended relative to asphalt in the low-side captures, with conspicuous negative space beneath the car. Contact consistency is not visually believable.

**Actual report:**
| Tire | World-space mesh tread bottom Y (m) | Rapier support Y (m) | Visible road top found? |
| --- | ---: | ---: | --- |
| Front left | -0.18043542 | ≈0.00000002 | No |
| Front right | -0.17754227 | ≈0.00000000 | No |
| Rear left | -0.18044701 | ≈0.00000002 | No |
| Rear right | -0.18044737 | ≈0.00000002 | No |

**Important measurement distinction:** The four sampled *wheel mesh AABB minima* are approximately **0.18 m below the Rapier support plane**, whereas the screenshots make the car look high over the road. These are **different witnesses**, and their contradiction is itself an unresolved geometry/reference-frame defect. Because the visual surface probe returned `null` at all four wheel positions, **do not claim that a verified signed tire-to-rendered-road gap equals −0.18 m** or that the real tread is necessarily 18 cm underground. Four precise visual-ground gaps are unavailable from this run.

**Impact:** G3 is not accepted. The result is not fixed simply because `grounded=true` or `wheelRigReady=true`.

### FM-005 — road probe loses visual surface despite valid physical ground (high)

All four `wheelContact[].visualSupportKind="unknown"`, `supportStatus="no-road"`, `visualSupportTopY=null`, and `visualSupportGapMetres=null`. Consequently:
- `wheelContactSummary.samples=0`
- `allFourWheelsMeasured=false`
- `acceptableFlatRoad=false`
- `minimumGapMetres=null`, `maximumGapMetres=null`

But each wheel's downward Rapier ray finds a ground contact at approximately Y=0. Physical support exists; the diagnostic fails to identify its corresponding **rendered** road surface.

**Source-level finding:** `vehicle-fit-diagnostics.ts` recognizes only selected `generated-parity-...-road` boxes whose AABB encloses each wheel, and ignores `generated-asphalt:` polygons for precise containment; diagnostic accuracy depends on the street render naming and coverage. The exact reason the real wheel locations were not matched in this frame (bounds, mesh lifetime, segment naming, alternate road construction, or other scene state) is **not yet determined**.

**Consequence:** The G0 witness cannot currently certify the purported real road-contact fix at this stopped position. A missing witness must not default to success or zero.

### FM-006 — road calibration is declared verified when visual-road evidence is absent (high)

Report:
- `treadAligned=true`
- `roadContactCalibrationVerified=true`
- `roadCalibrationCorrectionMetres=-0.0732750264`
- `chassisFloorOffsetMetres=+0.0732754337`
- `visualAnchor.y=-0.0590598663`
- `grounded=true`, `speedMps=0`

**Proved implementation limitation:** `first-drive-trial.ts::settleMeasuredTireFloor` checks four Rapier support rays near the expected ground plane, requires roughly level tire bottoms, then uses **hardcoded `roadTop=0.030`** to apply a one-time anchor/chassis visual offset and sets `contactCalibrationVerified=true`. It **does not require** a successful sampled visible road mesh at all four wheels. Therefore the boolean means “its internal calibration conditions fired,” not “tire/road visual contact has been independently verified.”

**Failure:** The calibration produced a correction around −73 mm and marked success, while the submitted screenshot remains visually wrong and the diagnostic exposes no visual surface. Treat “verified” as **uncorroborated** by the required end-to-end invariant.

**Potential issue (not a confirmed cause):** Visual anchor offsets, repeated anchor/body synchronization, model AABB mins, and geometry orientation might not share a stable reference frame; independently confirm their transform composition only after patching resumes.

### FM-007 — independent wheel contact system not exercised in final screenshots (coverage failure)

Because `gtdFitWheel002=1` was not present, `visualWheelSupportEnabled=false` and all four `visualWheelTravel.travel=0`. Hence these images evaluate **pose + ground calibration**, **not** the additional independent visual wheel-travel module.

**Not justified:** claiming that the G3 per-wheel visual subsystem passed or failed in the final screenshots. Its earlier enabled preview was visually rejected and its real-world four-wheel behavior remains unaccepted. The final missing flag is a test-coverage fact, **not an owner mistake**.

### FM-008 — headless green tests did not detect recurring live-scene regressions (process-critical)

History:
1. **G0 preview `gtd-7hem47h4u`:** accepted rearward seat-root placement survived; feet leaked; hand grip missing; two road-side wheels reported +14.6–17.5 mm floating and opposite-side feet/wheels encountered raised sidewalk support.
2. **First combined preview `gtd-ap7tug0i3`:** all-four visible-road tire gaps reported approximately **−0.12876 m**; feet and hands continued through body; pose solver originally returned optimistic `active` despite foot target errors ~0.99–1.30 m.
3. **Second corrective preview `gtd-f9qnp8sij`:** automated suite **287/287**, Vercel READY, yet owner screenshots again show exposed limbs and implausible car-road clearance; live pose reports `out-of-tolerance` (none applied) and **zero of four** visual road witnesses. This run lacked independent wheel support flag (FM-007).

**Failure class:** the deterministic tests (dummy geometry, synthetic skeletons, transform math and isolated Rapier ground) did not enforce geometric contact with the real Ferrari/UAL assets at render time, the actual road mesh and all feature-flag combinations. A green test count must not replace owner-visible approval.

## 4. Preserved successful or neutral mechanisms

- `gtdSeat001=1` remains the accepted rearward **seat-back/torso** root calibration (historical `cabinForwardFraction=-0.04`); **do not revert it incidentally**.
- Real wheel pivots remain discoverable: `wheelCount=4`, `wheelRigReady=true`, `missingWheelPivots=[]`.
- All required UAL limb aliases resolve: `bones.missing=[]`; `Driving_Loop` is active.
- Real Ferrari steering rim geometry is discoverable; the failure is positioning/contact, not a totally missing steering wheel.
- Diagnostic now truthfully uses `out-of-tolerance` and empty `appliedLimbs` rather than overclaiming pose success.
- The report shows `speedMps=0` and `grounded=true` in this sample; those facts do **not** certify real tire support, mobility quality or safety.
- No independent evidence in the latest owner submission establishes a regression of driving inputs, exit, camera, mobile performance, no-step garage behavior, or production `main`. Their status is **not tested**, not PASS.

## 5. Unresolved technical questions — investigation only after explicit restart

1. Whether the UAL `Driving_Loop` overwrites linked-bone rotation writes before render, and which bone-local axes genuinely drive knees/elbows in the pinned GLB.
2. Whether IK limb lengths, target coordinates and mesh collision envelopes correspond to the actual seated skeleton under imported transform normalization.
3. Whether the steering-wheel rim geometry exposes usable grip-plane and wheel rotation landmarks, beyond a bounding-sphere approximation.
4. Where the Ferrari tire mesh minimum Y, visual anchor Y, full-body cuboid bottom, and exact rendered asphalt support diverge; whether wheel AABB minima include incorrect descendant geometry.
5. Which actual street mesh(s) are drawn beneath the four physical wheel positions and why the G0 mesh probe returns no road for all four.
6. Why the one-time road calibration accepts inferred hardcoded asphalt height despite absent matching visible geometry, and how to make this evidence-dependent without breaking Rapier.
7. Whether the visually exaggerated air gap is caused by body/chassis geometry, wheel contact geometry, camera parallax, or contradictory offsets; this cannot be resolved from a single Y scalar.
8. How to design **real imported GLB** and **real generated-world** automated/image-based acceptance tests without shipping synthetic-only false positives.

These are **questions for a future authorized review**, NOT permission to apply changes now.

## 6. Freeze instructions and release policy

**Effective immediately on this documentation commit:**
- **NO CODE PATCHES**, no corrective tuning, no new gameplay behavior, no experimental branch deployment, no Vercel redeploy, and no merge to `main` without a fresh owner directive.
- Maintain the current experiment branch as-is aside from this documentation record; do not quietly toggle experimental flags on a public environment.
- G1, G2 and G3 remain **FAILED / NOT ACCEPTED**; G4 overall **FAILED / ON HOLD**. The old automated 287/287 result remains historical and does not count as closure.
- **G6 gate CLOSED.** Its definition/scope will only be considered in documentation after G1–G4 pass the required testing and owner visual review, per owner's prior instruction.
- When work resumes, start with an evidence-based review of FM-001 through FM-008 and a new explicit patch scope; prefer isolated corrections with before/after comparison against the accepted seat-back baseline.

**Owner-facing one-line conclusion:** The geometry and calibration attempts have not produced a convincingly seated driver or reliably grounded Ferrari, despite multiple successful automated builds. **Pause implementation and retain these failure witnesses as the next decision baseline.**
