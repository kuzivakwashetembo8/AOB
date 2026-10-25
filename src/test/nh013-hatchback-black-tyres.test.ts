import {describe,it,expect} from "vitest";
import {NullEngine,Scene,PBRMaterial,StandardMaterial,Color3} from "@babylonjs/core";
import {NH013_TYRE_RUBBER_COLOR,blackenHatchbackTyreMaterial013}
 from "@/game/vehicles/nh013-hatchback-tyre-material";

describe("NH-013 accepted hatchback tyre black rubber only",()=>{
 it("darkens real tyre PBR material and keeps body, rim and window materials unchanged",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   const tyre=new PBRMaterial("nh013:car: M_Wheel_Tire",scene);
   tyre.metallic=.85;tyre.roughness=.4;
   const rim=new PBRMaterial("M_Wheel_Rim_0",scene),glass=new PBRMaterial("M_Glass_Rubber",scene);
   const body=new PBRMaterial("M_Body_ColorMain",scene);
   const rimOriginal=rim.albedoColor.clone(),bodyOriginal=body.albedoColor.clone();
   expect(blackenHatchbackTyreMaterial013(tyre)).toBe(true);
   expect(tyre.albedoColor.equals(NH013_TYRE_RUBBER_COLOR)).toBe(true);
   expect(tyre.metallic).toBe(0);
   expect(tyre.roughness).toBeGreaterThanOrEqual(.9);
   expect(blackenHatchbackTyreMaterial013(rim)).toBe(false);
   expect(blackenHatchbackTyreMaterial013(glass)).toBe(false);
   expect(blackenHatchbackTyreMaterial013(body)).toBe(false);
   expect(rim.albedoColor.equals(rimOriginal)).toBe(true);
   expect(body.albedoColor.equals(bodyOriginal)).toBe(true);
   scene.dispose();engine.dispose();
 });
 it("also supports standard materials without retexturing nonrubber parts",()=>{
   const engine=new NullEngine(),scene=new Scene(engine);
   const tyre=new StandardMaterial("M_Wheel_Tire",scene);
   expect(blackenHatchbackTyreMaterial013(tyre)).toBe(true);
   expect(tyre.diffuseColor.equals(NH013_TYRE_RUBBER_COLOR)).toBe(true);
   expect(tyre.specularColor.equals(new Color3(.015,.015,.015))).toBe(true);
   expect(blackenHatchbackTyreMaterial013(null)).toBe(false);
   scene.dispose();engine.dispose();
 });
});
