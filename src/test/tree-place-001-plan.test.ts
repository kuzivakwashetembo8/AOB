import {describe,expect,it} from "vitest";
import { FIRST_LIGHT_CITY_SPEC } from "../game/world-generation/first-light-spec";
import { planStreetContext } from "../game/world-generation/street-context";
import { planUrbanForestry,parseForestryBudget,FIRST_LIGHT_FORESTRY_BOUNDS } from "../game/world-generation/urban-forestry-plan";
import { resolveCityBuildings } from "../game/world-generation/defaults";

const city=FIRST_LIGHT_CITY_SPEC;
const base=planStreetContext(city);
const budgets=[6,12,18,24] as const;
const dist=(a:{x:number;z:number},b:{x:number;z:number})=>Math.hypot(a.x-b.x,a.z-b.z);

describe("TREE-PLACE-001 pure deterministic urban forestry",()=>{
 it("never changes the accepted three authored trees with default options",()=>{
   expect(base.treeCount).toBe(3);
   expect(base.forestry).toBeNull();
   expect(base.items.filter(x=>x.kind==="tree").map(x=>x.id).sort()).toEqual([
     "sw-fl-tree-garage-east","sw-fl-tree-pocket-east","sw-fl-tree-pocket-west",
   ]);
   expect(planStreetContext(city)).toEqual(base);
 });
 it("parses only bounded opt-in budgets",()=>{
   expect(parseForestryBudget(null)).toBe(6);
   expect(parseForestryBudget("0")).toBe(6);
   expect(parseForestryBudget("6")).toBe(6);
   expect(parseForestryBudget("12")).toBe(12);
   expect(parseForestryBudget("18")).toBe(18);
   expect(parseForestryBudget("24")).toBe(24);
   expect(parseForestryBudget("500")).toBe(6);
 });
 it("generates at least an initial pilot from geometry and keeps IDs nested across budgets",()=>{
   const runs=budgets.map(treeBudget=>
     planStreetContext(city,{enableTreePlace001:true,treeBudget}));
   expect(runs[0]!.forestry?.generated.length).toBeGreaterThanOrEqual(3);
   for(let i=0;i<runs.length;i++){
     const current=runs[i]!,forest=current.forestry!;
     expect(current.treeCount).toBe(3+forest.generated.length);
     expect(forest.generated.length).toBeLessThanOrEqual(budgets[i]!);
     expect(forest.generated.every(x=>x.item.id.startsWith("tree-place-001:"))).toBe(true);
     expect(forest.estimate.meshes).toBe(forest.generated.length*35);
     expect(forest.estimate.cards).toBe(forest.generated.length*30);
     expect(forest.estimate.colliders).toBe(forest.generated.length);
     expect(forest.generated.map(x=>x.item.id)).toEqual(
       forest.allAccepted.slice(0,forest.generated.length).map(x=>x.item.id));
     expect(new Set(current.items.map(x=>x.id)).size).toBe(current.items.length);
     const original=base.items.filter(x=>x.kind==="tree");
     expect(current.items.filter(x=>original.some(y=>y.id===x.id))).toEqual(original);
     if(i>0){
       const prior=runs[i-1]!.forestry!.generated;
       expect(forest.generated.slice(0,prior.length)).toEqual(prior);
     }
   }
 });
 it("never collides with road+sidewalk buffers, tower/building footprints or accepted trunks",()=>{
   const report=planStreetContext(city,{enableTreePlace001:true,treeBudget:24});
   const trees=report.forestry!.generated;
   const nodes=new Map(city.roads.nodes.map(n=>[n.id,n.position]));
   for(const tree of trees){
     const p=tree.item.position,r=tree.canopyRadius;
     expect(p.x).toBeGreaterThan(FIRST_LIGHT_FORESTRY_BOUNDS.left+r);
     expect(p.x).toBeLessThan(FIRST_LIGHT_FORESTRY_BOUNDS.right-r);
     expect(p.z).toBeGreaterThan(FIRST_LIGHT_FORESTRY_BOUNDS.north+r);
     expect(p.z).toBeLessThan(FIRST_LIGHT_FORESTRY_BOUNDS.south-r);
     for(const b of resolveCityBuildings(city)){
       const deltaX=p.x-b.position.x,deltaZ=p.z-b.position.z;
       const c=Math.cos(b.yawRadians),s=Math.sin(b.yawRadians);
       const dx=Math.max(0,Math.abs(c*deltaX+s*deltaZ)-b.parameters.width/2);
       const dz=Math.max(0,Math.abs(-s*deltaX+c*deltaZ)-b.parameters.depth/2);
       expect(Math.hypot(dx,dz)).toBeGreaterThanOrEqual(r+0.65-1e-6);
     }
     for(const road of city.roads.segments){
       const a=nodes.get(road.startNodeId)!,b=nodes.get(road.endNodeId)!;
       const ux=b.x-a.x,uz=b.z-a.z,len=Math.hypot(ux,uz);
       const q=Math.max(-12/len,Math.min(1+12/len,((p.x-a.x)*ux+(p.z-a.z)*uz)/(len*len)));
       expect(dist(p,{x:a.x+q*ux,z:a.z+q*uz})).toBeGreaterThanOrEqual(
         road.width/2+road.sidewalkWidth+0.8+0.55-1e-6);
     }
     for(const other of trees){
       if(other===tree)continue;
       expect(dist(p,other.item.position)).toBeGreaterThanOrEqual(6.2-1e-6);
     }
   }
 });
 it("reports woodland/architecture/corridor provenance and unresolved routes rather than inventing access",()=>{
   const report=planUrbanForestry(city,base.items,24);
   expect(report.attempted).toBeGreaterThanOrEqual(report.generated.length);
   expect(report.routes.length).toBeGreaterThanOrEqual(2);
   expect(report.routes.every(x=>x.status==="connected"||x.status==="unresolved")).toBe(true);
   expect(report.generated.every(x=>["architecture","woodland","corridor"].includes(x.zoneKind))).toBe(true);
   expect(report.perZone.architecture+report.perZone.woodland+report.perZone.corridor)
     .toBe(report.generated.length);
   expect(report.perZone.architecture).toBeGreaterThan(0);
   expect(report.perZone.woodland).toBeGreaterThan(0);
   expect(report.perZone.corridor).toBeGreaterThan(0);
   expect(planUrbanForestry(city,base.items,24)).toEqual(report);
 });
});
