import { describe, expect, it } from "vitest";
import { mapDriverLimbs, normalizeDriverBone } from "../game/character/driver-limb-landmarks";

describe("VEH-FIT-002 real UAL bone naming",()=>{
  it("maps Unreal-standard thigh/calf/hand names without Mixamo assumptions",()=>{
    const names=["root","pelvis","spine_01","thigh_l","calf_l","foot_l","ball_l",
      "thigh_r","calf_r","foot_r","ball_r",
      "upperarm_l","lowerarm_l","hand_l","upperarm_r","lowerarm_r","hand_r"];
    const {found,missing}=mapDriverLimbs(names.map(name=>({name})));
    expect(missing).toEqual([]);
    expect(found.leftThigh?.name).toBe("thigh_l");
    expect(found.rightCalf?.name).toBe("calf_r");
    expect(found.leftForearm?.name).toBe("lowerarm_l");
    expect(found.rightHand?.name).toBe("hand_r");
    expect(found.hips?.name).toBe("pelvis");
  });
  it("handles importer prefixes and reports foreign rig missing joints",()=>{
    expect(normalizeDriverBone("trial:spine_01")).toBe("spine01");
    const one=mapDriverLimbs([{name:"import:spine_01"}]);
    expect(one.found.spine?.name).toBe("import:spine_01");
    expect(one.missing).toContain("leftHand");
    expect(one.missing).toContain("leftThigh");
  });
});
