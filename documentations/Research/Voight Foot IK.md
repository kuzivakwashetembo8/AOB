# CHAR-110 Deep Research: Why Voight’s Walk Still Stumbles

## Executive finding

**The remaining defect is upstream of Foot IK. Voight does not yet have a correctly retargeted walking cycle. Foot IK should refine where an already-valid step lands; it should not be responsible for making the left leg take its missing forward step.**

Your latest three screenshots are consistent with the behaviour you described: the right leg performs the recognisable forward excursion, while the left leg advances primarily to recover the stance rather than becoming the next leading leg. Visually, that creates a repeated **step → catch-up → step → catch-up** cadence rather than an alternating human walk.

The repository audit explains why our existing automated gates failed to catch this. The current CHAR-110 pipeline verifies lateral leg separation, toe heading, quaternion validity and some arm movement, but it contains **no test that left and right feet alternate longitudinally in front of the pelvis**. A clip can therefore satisfy every existing CHAR-110C/D check while still producing exactly the gait visible in your screenshots. fileciteturn22file0L1-L2

More importantly, the history of your visual feedback suggests this is **not primarily caused by the most recent leg-lane patch**. Before that patch, you had already observed that the right leg was doing most of the forward crossing while the left remained comparatively stationary. CHAR-110C reduced the cross-body component; it did not create the asymmetry. The likely root problem therefore sits in **our custom UAL → Voight retargeting transform**, with the later corrections potentially masking or exacerbating it rather than originating it.

There is also a major architectural discovery: GTD already depends on **Babylon.js 9.29.0**, and Babylon 9 introduced a first-party `AnimatorAvatar.retargetAnimationGroup` system specifically designed to compensate for different humanoid rest poses, bone orientations, proportions and hierarchies. Our CHAR-110 retargeter predates our use of that facility and is currently reimplementing part of the problem ourselves. fileciteturn21file0L1-L13 citeturn3search0

**My recommendation is therefore to stop adding gait-shaping corrections to the current baked clip until we determine exactly where the left stride disappears.** Foot IK development should continue as infrastructure and diagnostics, but it should not be used to manufacture the missing alternation.

## What the three-player-controller Foot IK is actually doing

The fork is more sophisticated than our present `FootIK` debug layer, but the most important discovery is what it **does not** do.

The reference `example/footIK.js` loads `ual.glb` with its authored `Idle_Loop`, `Walk_Loop` and `Sprint_Loop`. It then identifies the UAL leg chains explicitly as `thigh_l → calf_l → foot_l → ball_l` and their right-side counterparts. Only **after the walking animation exists** does it attach `FootIK`, with predictive placement, sole dimensions, ground-follow speeds and straight-pole control. fileciteturn2file0L1-L2

That ordering is fundamental:

**Authored walk → animation playback → identify stance/swing → predict terrain → IK correction → final pose**

It is not:

**Movement input → Foot IK invents a walk**

The fork's foot-phase implementation makes this especially clear. Before runtime, it samples the actual locomotion animation repeatedly. The default analysis uses 96 samples and records each foot's height, horizontal position and local rotation. It determines planted frames by combining low foot height with low horizontal velocity, removes short false contact runs, identifies the principal contact interval, and derives separate **land**, **lift**, **planted**, **swing progress**, **time-to-land** and **next-landing** states for the left and right feet. fileciteturn19file0L1-L2

In other words, the system asks:

> “What is the authored left foot already trying to do at this point in the walking cycle?”

and then:

> “Given the terrain ahead, where should that intended landing actually occur?”

Its predictive-placement code stores an animated expected landing, evaluates possible support surfaces, retains the ground normal, scores landing candidates, maintains trajectory continuity and plans clearance through the swing. Its comments explicitly distinguish the animation's expected landing from the correction applied to that landing. fileciteturn20file0L1-L2

That distinction answers the central question raised by your screenshots:

**Predictive Foot IK cannot legitimately repair a source animation in which the left leg never performs its proper forward swing.** We could force the left IK target ahead, but then IK would be fighting the authored thigh/knee motion and effectively becoming another procedural walking generator—the exact trajectory we deliberately abandoned.

Our own CHAR-110D documentation already recognised this boundary. The current GTD implementation is intentionally an inspection/prediction layer: it draws contacts, future landing probes and physics geometry but does not yet implement two-bone leg solving, planted-foot locking or pelvis compensation. fileciteturn14file0L1-L2

The correct lesson from the fork is therefore not “turn on predictive placement and the walk will become human.” It is:

> **First preserve a valid authored gait. Then analyse its phases. Then let IK adapt that gait to the world.**

## Where the current GTD retargeting pipeline is losing fidelity

The present `char110-bake-ual-walk.mjs` is thoughtful and substantially better than our rejected procedural walker. It maps 22 meaningful UAL joints onto Voight, uses UAL's `Idle_Loop` as a baseline, samples the 1.33-second walk into 41 frames, computes a source/target anatomical frame and transfers rotational deltas into Voight's skeleton. fileciteturn16file0L1-L2

But deep inspection exposes four structural weaknesses.

### A single body frame is compensating for many different bone frames

Our retargeter calculates one anatomical source frame from the pelvis, thighs and feet and one corresponding target frame. That global alignment is then used while converting every mapped joint's motion. fileciteturn16file0L1-L2

That works when corresponding bones have sufficiently compatible local coordinate frames. But Voight and UAL do not.

We already have empirical evidence of this:

- the right forearm's bend arrived with the wrong sense and had to be explicitly inverted;
- the hand then needed a compensating rotation to preserve palm orientation;
- the feet required independent post-retarget yaw correction;
- an earlier shoe correction initially used the wrong assumed axis and later had to be changed to the actual parent-transformed pelvis-up axis. fileciteturn22file0L1-L2

Those are not unrelated cosmetic defects. **They are evidence that corresponding UAL and Voight joints do not share sufficiently equivalent local axes for a single global anatomical alignment to preserve every rotation correctly.**

This makes the latest left-leg behaviour much less mysterious. A hip flexion rotation that produces a clean forward swing in UAL can contain unwanted abduction, twist or reduced flexion when expressed through a differently oriented target thigh frame. Because left and right skeleton joints are mirrored, an imperfect basis conversion can manifest asymmetrically: one side may still look plausible while the other loses the intended sagittal swing.

Babylon's native retargeting facility solves the problem at the more appropriate level. With `retargetAnimationKeys`, it uses source and target **reference transformations for the corresponding bones**, rather than assuming one whole-character correction can adequately describe every joint. Babylon explicitly describes reference-pose compensation as the core of its retargeting process. citeturn3search0

### We transfer rotations only

The current bake script explicitly ignores every UAL animation channel whose target path is not `rotation`. fileciteturn16file0L1-L2

That is an important limitation because glTF animations are allowed to animate a node's `translation`, `rotation`, `scale` and morph weights independently. Root, pelvis or other skeletal translation is therefore legitimate authored animation information. citeturn5search1turn5search3

I have **not yet established that UAL's `Walk_Loop` contains essential pelvis/root translation channels**. That needs to be measured rather than assumed. But our present pipeline discards any such channels without even reporting them.

That should become an audit item immediately:

**How many translation channels exist in `Walk_Loop`, which nodes do they animate, and how much excursion do they contain?**

If meaningful pelvis motion exists, dropping it could contribute to the “start, stop, start” quality because the legs and pelvis would no longer reproduce the source clip's complete spatial relationship.

Babylon's retargeting system can also correct root-position motion for differently sized characters through `fixRootPosition`, and it has ground-reference correction for cases where the retargeted feet otherwise float or penetrate. citeturn3search0

### Our post-processing validates sideways correctness, not walking correctness

After retargeting, CHAR-110C deliberately alters the upper-thigh animation until knee, ankle and toe positions remain on their own sides of the pelvis. It then performs interpolation checks to ensure they do not cross the centreline. CHAR-110D subsequently changes right-forearm motion and foot yaw. fileciteturn22file0L1-L2

Those gates solved real visible defects. The problem is that our validation dimensions are incomplete.

Today we essentially test:

| Property | Current gate |
|---|---|
| Left leg stays left | Yes |
| Right leg stays right | Yes |
| Toe/foot heading bounded | Yes |
| Arm tracks exist | Yes |
| Right palm preserved after elbow change | Yes |
| Left foot becomes leading foot | **No** |
| Right foot becomes leading foot | **No** |
| Lead alternates every half-cycle | **No** |
| Left/right stride amplitudes comparable | **No** |
| Each foot has a coherent plant → lift → swing → land sequence | **No** |
| Retargeted phase matches source UAL phase | **No** |

The verifier works heavily in the pelvis-local lateral `X` dimension. There is no equivalent invariant for the longitudinal walking dimension. fileciteturn22file0L1-L2

That is precisely how a “right stride, left catch-up” animation can pass.

One additional risk deserves attention. The leg-lane repair describes its correction as pelvic-forward hip abduction, but the correction itself is generated around `Vector3.Forward()` in the animation-delta coordinate space. Unlike the later shoe fix, that axis is not derived from each thigh's actual parent/rest frame. fileciteturn22file0L1-L2

I do **not** think this created the original left-leg defect—the chronology of your visual feedback suggests the asymmetry was already present—but it can distort forward stride while solving lateral position. It therefore has to be included in the before/after audit.

### Runtime playback has no concept of gait phase

Once the 41-frame JSON reaches the game, `retargeted-walk-110.ts` simply advances a clock, interpolates between neighbouring quaternion samples and blends each result with Voight's accepted neutral pose. It knows whether the player is moving, but it does not know whether the left foot is planted, whether the right is swinging or whether one foot has ever passed the other. fileciteturn18file0L1-L13

That is reasonable for playback of a **known-good** walking clip.

It is insufficient as a quality gate for a retargeting experiment.

The fork explicitly derives that missing semantic layer—left/right contact phases—from the animation itself. fileciteturn19file0L1-L2

## The stronger architecture already exists in our engine

There is a significant opportunity here: **we no longer need to own the full mathematical burden of skeletal retargeting.**

GTD currently pins Babylon.js `9.29.0`. fileciteturn21file0L1-L13 Babylon introduced `AnimatorAvatar.retargetAnimationGroup` in version 9 specifically to transfer animations between characters with different skeletal structures, proportions, naming conventions and reference poses. It provides:

- explicit `mapNodeNames` correspondence;
- `retargetAnimationKeys` for reference-pose compensation;
- `checkHierarchy` to reject structurally incompatible mappings;
- `fixRootPosition`;
- `fixGroundReference`;
- source and target rest-pose handling;
- an official retargeting inspection tool that can display each skeleton's **local bone axes** and apply rest-pose corrections before transfer. citeturn3search0

The rest-pose point is particularly relevant to CHAR-110.

Our script deliberately uses **UAL `Idle_Loop` frame 0** as its baseline because UAL's original bind configuration did not correspond visually to Voight's accepted down-arm neutral posture. fileciteturn16file0L1-L2

That was a pragmatic solution. It is not the same as establishing a mathematically normalised retarget reference pose.

Babylon's documentation explicitly warns that a source must be returned to its genuine reference/rest pose before retargeting and that frame zero is only valid if frame zero actually represents that rest pose. The target similarly needs a correct recorded skeleton rest reference. citeturn3search0

That means our right-elbow reversal may not merely be “a bad elbow animation”. It may be evidence that our neutral/reference compensation itself is incomplete.

### Why this matches how mature game locomotion is built

The same layering appears in other established game-engine systems.

Epic's current locomotion architecture separates authored animation from **stride warping** and **Leg IK**. Stride Warping adjusts the spacing of existing animated foot positions to match actual capsule speed; the subsequent leg IK stage resolves those adjusted targets through the leg chain. Epic also retains pelvis motion and can clamp IK using the underlying FK leg to avoid destroying the original pose. citeturn3search1turn3search5

Epic's Distance Matching similarly changes animation playback rate to keep motion and animation synchronised, and recommends Stride Warping when playback-rate adjustment alone is insufficient. citeturn3search4

This gives us a useful general architecture:

**Authored gait**
→ **retarget accurately**
→ **synchronise speed/cadence**
→ **warp stride if necessary**
→ **identify plant/swing phases**
→ **IK ground contact**
→ **predictive terrain placement**

The key principle is that every later stage preserves the semantic structure of the original gait. None of them should have to decide that “the left leg ought to take a step now” because that information should already exist in the animation.

## The experiment that will locate the defect conclusively

Before modifying another quaternion, CHAR-110 needs a **sagittal stride audit**.

The same measurement should be run against three versions of the motion:

| Stage | What it tells us |
|---|---|
| UAL's untouched `Walk_Loop` | Establishes the source truth |
| Raw UAL → Voight output before CHAR-110C/D | Tells us whether retargeting destroys alternation |
| Current corrected CHAR-110D output | Tells us whether post-processing damages it further |

For each sample, measure the left and right ankle/toe in **pelvis-local coordinates** and record forward displacement. Define a signed separation such as:

`lead(t) = leftFootForward(t) - rightFootForward(t)`

A valid alternating walk must contain both states:

`lead(t) > 0` — left foot is ahead

and later:

`lead(t) < 0` — right foot is ahead.

The sign should alternate in a stable cycle. If the source UAL clip exhibits both states but the raw Voight retarget does not, we have proved that CHAR-110's transfer mathematics—not Foot IK and not gameplay movement—is responsible.

We should simultaneously port the fork's phase-analysis idea: classify each foot from its height plus horizontal velocity into **plant** or **swing**, then derive lift and landing events. The fork already demonstrates this approach and keeps left and right phases separately. fileciteturn19file0L1-L2

The initial engineering gate should be approximately:

| Metric | CHAR-110 acceptance intent |
|---|---|
| Left foot leads during cycle | Required |
| Right foot leads during cycle | Required |
| Lead changes sign cleanly | Required |
| One principal plant interval per foot | Required |
| One principal swing interval per foot | Required |
| Left/right swing centres separated by roughly half a cycle | Required |
| Left/right stride excursion broadly comparable | Required |
| Existing lane crossings | Zero |
| Feet remain generally forward | Required |
| Idle restores CHAR-109 posture | Required |

I would deliberately avoid locking exact biological percentages at this stage. We first need **symmetry and alternation**, not a biomechanics laboratory model.

There is one extremely useful consequence of this three-stage audit:

**If raw retargeting passes but the corrected clip fails, we repair CHAR-110C/D. If raw retargeting already fails, we stop tuning the corrections and replace the retargeting method.**

Given the earlier visual checkpoint where the left leg was already comparatively stationary, my present assessment is that the **raw retarget will probably fail**. That is an inference from the observed chronology, not yet a measured result.

## What CHAR-110 should do next

I recommend a controlled A/B test rather than another corrective patch.

**Path A** preserves the current retargeter untouched as our comparison baseline.

**Path B** loads the same UAL `Walk_Loop` through Babylon 9.29's native `AnimatorAvatar.retargetAnimationGroup`, maps the same anatomical joints, enables reference-key compensation and hierarchy validation, and first evaluates it **without** our CHAR-110C/D thigh, foot or elbow mutations. Babylon provides those facilities in the engine version already installed in GTD, so this experiment does not require changing rendering engines or adding another runtime dependency. fileciteturn21file0L1-L13 citeturn3search0

The order I would test is:

`retargetAnimationKeys: true`

`checkHierarchy: true`

explicit UAL → Voight `mapNodeNames`

correct source reference pose

correct target reference pose

then inspect raw walk.

Only once basic alternation passes should we evaluate `fixRootPosition` and ground-reference correction. citeturn3search0

This is important because otherwise we will not know which feature fixed—or damaged—the gait.

If Babylon's native retarget preserves the source left/right phases, we can still keep our current deployment architecture: retarget or bake the motion as an **offline/build-time operation** and ship only the compact Voight animation. We do not need UAL to remain an additional rendered runtime character merely because it supplied the motion.

The first acceptance question should therefore become much simpler than our current large collection of geometric thresholds:

> **When UAL's left foot becomes the leading foot, does Voight's left foot also become the leading foot? When UAL's right foot leads, does Voight's right foot lead?**

Until that is true, CHAR-110 has not actually completed skeletal locomotion retargeting.

## Where Foot IK belongs after the gait is repaired

Once the alternating base walk passes, the work you requested on **Physics & Foot IK** becomes highly valuable.

The existing Settings geometry debug layer should evolve from showing only raw contacts and predictions into a real gait debugger. It should expose, for each foot:

`PLANTED / SWING`

normalized gait phase

next authored landing

predicted terrain landing

current ankle target

actual Rapier ground hit

shoe support polygon

knee pole direction

IK correction magnitude

and current pelvis offset.

The fork already exposes runtime left/right phase, landing/IK state, predictive target state, pelvis adjustment, foot reach, sole dimensions and predictive clearance in its debugging interface. fileciteturn2file0L1-L2

For actual leg solving, Babylon already supplies a two-bone `BoneIKController`. It accepts an end target plus a pole target; the pole determines the direction in which the intermediate joint bends. That is directly relevant to preventing knees from collapsing sideways or backwards. citeturn4search0

Because Babylon's glTF loader links imported bones to their corresponding transform nodes, Babylon also warns that modifying a linked bone directly can be overwritten by its TransformNode. That matches the design decision we already reached in CHAR-109/110 to treat linked nodes as authoritative. citeturn4search8

So our production version may use the mathematical structure of a two-bone solver while applying final corrections through Voight's linked TransformNodes, rather than blindly attaching `BoneIKController` and fighting the loader.

The Foot IK pipeline should ultimately become:

**walk animation evaluated**

→ detect current left/right phase

→ if planted, maintain believable contact

→ if swinging, retain authored swing trajectory

→ near landing, evaluate predictive target

→ solve thigh/knee/ankle toward corrected target

→ adjust pelvis only enough to keep both legs reachable

→ orient shoe toward support normal

→ render.

That is also consistent with the fork: predictive placement tracks the authored landing and adds a correction relative to it rather than replacing the animation's entire swing. fileciteturn20file0L1-L2

And on flat ground, a crucial acceptance rule should apply:

**Turning Foot IK off must still leave Voight with a recognisable, alternating human walk.**

If disabling IK causes the left leg to stop taking steps, then the underlying animation is still defective.

## CHAR-110 research conclusion

The latest visual failure changes the diagnosis more than the implementation objective.

We do **not** need to teach the left leg to step using another procedural rule.

We need to preserve the left step that already exists in UAL's authored walk.

The fork confirms that Foot IK is a post-animation terrain/contact system, not its walk generator. fileciteturn19file0L1-L2 Modern engine practice reaches the same conclusion: retarget first, synchronise/warp stride second, apply leg IK afterward. citeturn3search1turn3search4

The strongest evidence inside GTD is the accumulating set of axis-specific repairs: right forearm inversion, wrist compensation, lateral thigh corrections and foot-yaw corrections. fileciteturn22file0L1-L2 Those fixes improved the picture, but collectively they indicate that our custom retargeter is not fully accounting for the local reference frames of the two rigs.

Babylon 9.29—the version already in GTD—now has a first-party solution designed around precisely that problem. fileciteturn21file0L1-L13 citeturn3search0

**Decision:** freeze further gait-shaping patches to the current clip. The next CHAR-110 engineering pass should first instrument source/raw/corrected stride phase, then A/B the existing retarget against Babylon's native per-bone retargeting. Only after Voight alternates left and right lead steps should we promote predictive Foot IK from visual diagnostics into an active two-bone/pelvis solver.

No runtime or repository changes were made during this research pass.