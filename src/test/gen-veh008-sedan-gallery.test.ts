import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {GALLERY_VEHICLES_008,galleryVehicleAt008} from "@/game/vehicles/vehicle-inspection-registry-008";
describe("GEN-VEH-008 sedan repair and isolated review",()=>{
 it("tracks reviewed sedan, accepted Rover and pending hatchback/Dodge separately",()=>{
   expect(GALLERY_VEHICLES_008[0].id).toBe("sedan");
   expect(GALLERY_VEHICLES_008.find(x=>x.id==="rover")?.status).toBe("NEEDS WORK");
   expect(GALLERY_VEHICLES_008.find(x=>x.id==="sedan")?.status).toBe("ACCEPTED");
   expect(GALLERY_VEHICLES_008.filter(x=>x.status==="ACCEPTED")).toHaveLength(1);
   expect(GALLERY_VEHICLES_008.find(x=>x.id==="hatchback")?.status).toBe("REPAIR REQUIRED");
   expect(GALLERY_VEHICLES_008.find(x=>x.id==="dodge")?.status).toBe("REPAIR REQUIRED");
   expect(galleryVehicleAt008(-1).id).toBe("temerario");
   expect(galleryVehicleAt008(GALLERY_VEHICLES_008.length).id).toBe("sedan");
   expect(GALLERY_VEHICLES_008.some(x=>String(x.id)==="bmw")).toBe(false);
 });
 it("preserves sedan forward and all mandatory source glazing from the offline extractor",()=>{
   const script=readFileSync("scripts/genveh007-extract-seven.mjs","utf8");
   expect(script).toContain('forward:"-x"');
   expect(script).toContain('keptParts.glass!==parts.glass.length');
   expect(script).toContain('keptParts.paint!==parts.paint.length');
   expect(script).toContain('"public/vehicle-gallery/"');
   expect(script).toContain('for(const model of models)');
 });
 it("uses isolated lazy Babylon gallery without simulating North Heights",()=>{
   const route=readFileSync("src/routes/vehicles.tsx","utf8");
   const scene=readFileSync("src/game/vehicles/vehicle-inspection-scene-008.ts","utf8");
   const menu=readFileSync("src/routes/index.tsx","utf8");
   expect(route).toContain('createFileRoute("/vehicles")');
   expect(menu).toContain('to="/vehicles"');
   expect(scene).toContain('"/vehicle-gallery/"+model.id+".json"');
   expect(scene).not.toContain("NH012TrafficSimulator");
   expect(scene).not.toContain("loadAssetContainerAsync");
 });
});
