import {describe,expect,it} from "vitest";
import {FIRST_LIGHT_CITY_SPEC} from "../game/world-generation/first-light-spec";
import {planStreetContext} from "../game/world-generation/street-context";
import {planUrbanForestry,parseForestryBudget} from "../game/world-generation/urban-forestry-plan";

describe("TREE-PLACE-001 Mercer woodland density experiment",()=>{
  it("recognizes optional stepped higher densities but leaves defaults unchanged",()=>{
    expect(parseForestryBudget("30")).toBe(30);
    expect(parseForestryBudget("36")).toBe(36);
    expect(parseForestryBudget("100")).toBe(6);
    const initial=planStreetContext(FIRST_LIGHT_CITY_SPEC);
    expect(initial.treeCount).toBe(3);
    expect(initial.forestry).toBeNull();
    expect(planStreetContext(FIRST_LIGHT_CITY_SPEC,{
      enableTreePlace001:true,treeBudget:24,
    }).forestry?.focus).toBe("balanced");
  });
  it("adds a substantial one-sided grove and only a few elsewhere",()=>{
    const city=FIRST_LIGHT_CITY_SPEC;
    const authored=planStreetContext(city).items;
    const grove=planUrbanForestry(city,authored,30,undefined,"mercer-open-side");
    expect(grove.focus).toBe("mercer-open-side");
    expect(grove.generated.length).toBeGreaterThanOrEqual(18);
    expect(grove.selectedOpenSideCount).toBeGreaterThanOrEqual(
      Math.ceil(grove.generated.length*0.7));
    expect(grove.selectedOtherCount).toBeGreaterThan(0);
    expect(grove.selectedOtherCount).toBeLessThanOrEqual(8);
    const ids=grove.generated.map(t=>t.item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(grove.estimate.cards).toBe(grove.generated.length*30);
    expect(grove.estimate.colliders).toBe(grove.generated.length);
    // Primary woodland anchors must remain on garage's open side of Mercer.
    const open=grove.generated.filter(t=>t.zoneId.includes("mercer-open-side"));
    expect(open.length).toBeGreaterThanOrEqual(16);
    expect(open.every(t=>t.item.position.z<-13.15)).toBe(true);
    expect(grove.generated.some(t=>!t.zoneId.includes("mercer-open-side")))
      .toBe(true);
    expect(planUrbanForestry(city,authored,30,undefined,"mercer-open-side"))
      .toEqual(grove);
  });
  it("preserves tree positions when expanding from 6 to 36 and keeps all authored trees",()=>{
    const budgets=[6,12,18,24,30,36] as const;
    const trials=budgets.map(treeBudget=>planStreetContext(FIRST_LIGHT_CITY_SPEC,{
      enableTreePlace001:true,treeBudget,treeDensityFocus:"mercer-open-side",
    }));
    for(let i=0;i<trials.length;i++){
      const current=trials[i]!;
      const forest=current.forestry!;
      expect(forest.generated.length).toBeLessThanOrEqual(budgets[i]!);
      expect(current.treeCount).toBe(3+forest.generated.length);
      if(i>0){
        const preceding=trials[i-1]!.forestry!.generated;
        expect(forest.generated.slice(0,preceding.length)).toEqual(preceding);
      }
    }
    expect(trials[0]?.forestry?.generated.length).toBeGreaterThanOrEqual(4);
  });
});
