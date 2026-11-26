# AOB — Long-Gun Holding Stance: Issue and Implementation Plan

**Date:** November 26, 2026  
**Status:** Proposed — awaiting approval  
**Priority:** High — player combat foundation  
**Scope:** Player character weapon handling; rifles and long machine guns

## 1. Problem statement

The current in-game screenshot shows Reese holding a rifle using a pistol-like aiming posture.

Although the rifle is attached to the character and visually present, the character's pose does not reflect the physical handling of a long firearm.

The current presentation lacks the coordinated two-handed grip and shouldered weapon posture expected when holding a rifle or long machine gun.

This is a player-facing combat presentation issue, not merely a cosmetic adjustment to the weapon mesh.

## 2. Expected result

Long firearms must use a coherent two-handed handling stance.

The expected posture includes:

- **Dominant hand:** Firmly positioned on the weapon's pistol grip.
- **Support hand:** Positioned on the handguard or fore-end, at an appropriate distance from the dominant hand.
- **Shoulder:** Weapon stock seated against the dominant-side shoulder.
- **Arms:** Naturally bent and positioned to support and control the weapon.
- **Torso:** Positioned to accommodate the weapon and aiming direction.
- **Head:** Aligned naturally with the weapon's sighting direction.
- **Weapon:** Oriented consistently with the character's grip and body posture.

The pose must look intentional and physically coherent from the game's third-person camera.

## 3. Required handling states

### A. Long-gun ready stance

The character holds the weapon with both hands and the stock against the shoulder.

The muzzle faces generally forward, but the character is not necessarily tracking a specific target.

### B. Long-gun aiming stance

The character maintains the same fundamental grip while aligning the weapon toward the aiming direction.

The upper body, arms, head and weapon must adjust together. The weapon must not simply rotate independently while the character retains an unrelated pose.

### C. Weapon transition

When switching between a pistol and a long gun, the character must transition to the appropriate handling pose.

A pistol must retain its pistol-specific handling. A rifle or long machine gun must use the long-gun handling system.

## 4. Proposed implementation approach

### Phase 1 — Inspect the existing character and weapon systems

Before changing code:

- Inspect Reese's actual imported GLB hierarchy and skeleton.
- Identify the available animation clips, bone names and relevant upper-body joints.
- Inspect the existing weapon attachment and grip alignment implementation.
- Identify how the current player controller selects weapon poses and aiming states.
- Inspect the three existing weapons: M4A1, MPX-9 and P-19.
- Determine whether suitable long-gun animations already exist or whether new animation assets are required.

**Deliverable:** A verified map of the existing rig, animations, weapon attachment points and relevant runtime responsibilities.

No assumptions about bone names, animation availability or existing code structure should be made before this inspection.

### Phase 2 — Establish long-gun grip metadata

Define a consistent weapon handling contract for long firearms.

Where supported by the weapon models, this should describe:

- Dominant-hand grip location.
- Support-hand grip location.
- Stock or shoulder contact reference.
- Weapon forward and sighting directions.
- Any weapon-specific alignment offsets.

The M4A1 and MPX-9 should use the same general handling system, with weapon-specific alignment data where necessary.

The P-19 must retain a separate pistol handling configuration.

### Phase 3 — Implement the long-gun character pose

Use the inspected rig and available animation resources to establish the correct posture.

Preferred implementation order:

1. Reuse an appropriate existing animation if one is available and suitable.
2. Adapt or blend existing animations if that produces a coherent result.
3. Introduce a dedicated long-gun animation if the existing animation library cannot satisfy the requirements.

The weapon attachment must follow the resulting hand and body pose. Do not compensate for an incorrect character pose by applying arbitrary weapon rotations.

### Phase 4 — Integrate aiming and weapon transitions

Connect the long-gun pose to the existing player combat state.

Ensure that:

- Equipping a long gun selects the long-gun handling state.
- Aiming transitions into the long-gun aiming pose.
- Releasing aim returns to the ready stance.
- Switching to a pistol restores the pistol-specific pose.
- Weapon switching does not leave the character in an incorrect or partially blended pose.

### Phase 5 — Validate visually and functionally

Test the result in the actual game runtime.

Validation must include:

- M4A1 equipped and held in the ready stance.
- M4A1 aiming.
- MPX-9 equipped and held in the ready stance.
- MPX-9 aiming.
- P-19 equipped to verify that pistol handling remains correct.
- Switching repeatedly between pistol and long guns.
- Movement while holding a long gun.
- Camera inspection from multiple third-person angles.

Capture visual evidence of the resulting poses.

## 5. Acceptance criteria

The work is complete only when:

1. Both hands visibly occupy appropriate positions on the long firearm.
2. The weapon stock is correctly seated against the shoulder.
3. The arms form a believable supporting posture.
4. The weapon, hands and upper body remain aligned during aiming.
5. The ready and aiming states are visually distinct and coherent.
6. Both the M4A1 and MPX-9 use the long-gun handling system.
7. The P-19 retains appropriate pistol handling.
8. Weapon switching does not produce persistent pose or attachment errors.
9. The result is verified in the actual game runtime, not just in an animation preview or static model viewer.

## 6. Risks and implementation constraints

- The current GLB may not contain the necessary animation clips or suitable hand poses.
- The skeleton may require animation retargeting or additional animation assets.
- Weapon grip points may differ between models.
- Incorrect animation blending could cause hand penetration, shoulder separation or weapon misalignment.
- Camera perspective can conceal alignment problems that become obvious from other angles.

The implementation must use the existing Babylon.js/Rapier runtime boundaries. React and UI components should not become responsible for character animation or weapon simulation.

Do not introduce unrelated AI, NPC, multiplayer or new weapon-family work as part of this fix.

## 7. Scope boundary

**Included:** Player long-gun grip, shoulder mounting, ready stance, aiming stance, weapon transitions and visual validation.

**Excluded:** New weapon families, NPC combat behaviour, expanded AI, multiplayer, new gameplay modes and unrelated character redesign.

## 8. Release priority

This work supports the existing LMS objective and the broader combat-first direction.

The first milestone is a convincing, correctly aligned long-gun stance for the player. Further combat features should build on that foundation rather than compensate for incorrect weapon handling.

**No implementation or test completion is implied by this proposal.**