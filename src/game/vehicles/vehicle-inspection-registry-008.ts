/** GEN-VEH-008: original-source extraction review inventory.
 * QA states are owner evidence, not automatic claims made by the build.
 */
export const GALLERY_VEHICLES_008 = [
  {id:"sedan",name:"Four Door Sedan",status:"IN REVIEW",note:"Front axis and glazing repair; owner acceptance pending",paint:"#B7353B"},
  {id:"hatchback",name:"Fourd Confusion Hatchback",status:"REPAIR REQUIRED",note:"Manual source-informed exterior reconstruction pending",paint:"#F0F1EB"},
  {id:"dodge",name:"Dodge HP",status:"REPAIR REQUIRED",note:"Incomplete body shell in GEN-VEH-007 preview",paint:"#B63232"},
  {id:"rover",name:"Range Rover Sport 2018",status:"ACCEPTED BASELINE",note:"GEN-VEH-005 accepted source extraction; paint variation pending",paint:"#BFC9D1"},
  {id:"hilux",name:"Toyota Hilux",status:"REVIEW REQUIRED",note:"Source-native extraction not yet approved",paint:"#D6D9D7"},
  {id:"defender",name:"Land Rover Defender",status:"REVIEW REQUIRED",note:"Source-native extraction not yet approved",paint:"#A6B2A7"},
  {id:"taxi",name:"Taxi",status:"REVIEW REQUIRED",note:"Unqualified source wheels; visual review pending",paint:"#E2CB6F"},
  {id:"kangoo",name:"Renault Kangoo",status:"REVIEW REQUIRED",note:"Unqualified source wheels; visual review pending",paint:"#C4C9CE"},
  {id:"temerario",name:"Lamborghini Temerario",status:"BODY ACCEPTED",note:"GEN-VEH-002 accepted body; original rim fidelity pending",paint:"#E9C72A"},
] as const;
export type GalleryVehicle008 = (typeof GALLERY_VEHICLES_008)[number];
export type GalleryVehicleId008 = GalleryVehicle008["id"];
export function galleryVehicleAt008(index:number):GalleryVehicle008 {
 const count=GALLERY_VEHICLES_008.length;
 return GALLERY_VEHICLES_008[((index%count)+count)%count]!;
}
