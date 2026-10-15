/** GTD-VEH-FIT-002: map source skeleton naming to canonical driver limbs.
 * UAL specimen uses Unreal-style `thigh_l`, `calf_l`, `hand_r`, etc.
 * Never infer a joint solely from its position. Missing joints fail closed.
 */
import type { Bone, Skeleton } from "@babylonjs/core";
export type DriverLimbRole = "hips" | "spine" |
  "leftThigh" | "leftCalf" | "leftFoot" | "leftToe" |
  "rightThigh" | "rightCalf" | "rightFoot" | "rightToe" |
  "leftUpperArm" | "leftForearm" | "leftHand" |
  "rightUpperArm" | "rightForearm" | "rightHand";
export const DRIVER_LIMB_ALIASES: Record<DriverLimbRole, readonly string[]> = {
  hips: ["pelvis", "hips", "rootpelvis"],
  spine: ["spine01", "spine1", "spine"],
  leftThigh: ["thighl", "leftupleg", "leftthigh", "upperlegl"],
  leftCalf: ["calfl", "leftleg", "leftcalf", "lowerlegl", "shinl"],
  leftFoot: ["footl", "leftfoot", "anklel"],
  leftToe: ["balll", "toel", "lefttoebase", "lefttoe"],
  rightThigh: ["thighr", "rightupleg", "rightthigh", "upperlegr"],
  rightCalf: ["calfr", "rightleg", "rightcalf", "lowerlegr", "shinr"],
  rightFoot: ["footr", "rightfoot", "ankler"],
  rightToe: ["ballr", "toer", "righttoebase", "righttoe"],
  leftUpperArm: ["upperarml", "leftarm", "leftupperarm"],
  leftForearm: ["lowerarml", "forearml", "leftforearm", "leftlowerarm"],
  leftHand: ["handl", "lefthand", "wristl"],
  rightUpperArm: ["upperarmr", "rightarm", "rightupperarm"],
  rightForearm: ["lowerarmr", "forearmr", "rightforearm", "rightlowerarm"],
  rightHand: ["handr", "righthand", "wristr"],
};
export const DRIVER_LIMB_ROLES = Object.keys(DRIVER_LIMB_ALIASES) as DriverLimbRole[];
export function normalizeDriverBone(name: string): string {
  return name.split(":").pop()!.toLowerCase().replace(/[^a-z0-9]/g,"");
}
export function mapDriverLimbs<T extends {name:string}>(
  bones: readonly T[],
): { found: Partial<Record<DriverLimbRole, T>>; missing: DriverLimbRole[] } {
  const found: Partial<Record<DriverLimbRole,T>> = {};
  const missing: DriverLimbRole[] = [];
  for(const role of DRIVER_LIMB_ROLES) {
    const aliases = DRIVER_LIMB_ALIASES[role];
    const bone = bones.find(b => aliases.some(alias => {
      const n = normalizeDriverBone(b.name);
      return n === alias || n.endsWith(alias);
    }));
    if(bone) found[role] = bone;
    else missing.push(role);
  }
  return {found,missing};
}
export function findDriverBones(skeleton: Skeleton):
  {found: Partial<Record<DriverLimbRole,Bone>>; missing: DriverLimbRole[]} {
  return mapDriverLimbs(skeleton.bones);
}
