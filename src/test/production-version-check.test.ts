import {describe,it,expect} from "vitest";
import {decideDeployedRelease,validRelease} from "../lib/game-version-check";
const A="a".repeat(40), B="b".repeat(40);
const manifest=(id:string)=>({schema:"gtd-release-v1" as const,releaseId:id,environment:"production",builtAt:"2026-10-17T00:00:00Z"});
describe("REL-010 deployed version detection policy",()=>{
  it("never confuses unavailable metadata with a newer build",()=>{
    expect(decideDeployedRelease(A,null,false)).toBe("offline");
    expect(decideDeployedRelease(A,manifest("not-a-sha"),false)).toBe("offline");
    expect(validRelease("main")).toBe(false);
    expect(validRelease(A)).toBe(true);
  });
  it("only refreshes when deployed code differs from running release",()=>{
    expect(decideDeployedRelease(A,manifest(A),false)).toBe("current");
    expect(decideDeployedRelease(A,manifest(B),false)).toBe("reload");
    expect(decideDeployedRelease(A,manifest(B),true)).toBe("retry-needed");
  });
});
