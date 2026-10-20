/**
 * OFFLINE-003 pre-main Settings checklist.
 * Every counter is derived from real manifest URLs and files stored by the
 * SHA-256-verifying downloader. No placeholder numbers or simulated progress.
 */
export type OfflineChecklistSection = "application" | "engine" | "world" | "voight" | "vehicles";
export type OfflineVehicleId =
  "range-rover" | "hilux" | "defender" | "dodge" | "bmw" | "lamborghini";
export type OfflineChecklistEntry = {
  id: OfflineChecklistSection;
  title: string;
  installed: number;
  total: number;
  complete: boolean;
  detail: string;
};
export type OfflineListedResource = {url:string};
const VEHICLES:ReadonlyArray<OfflineVehicleId> = [
  "range-rover","hilux","defender","dodge","bmw","lamborghini",
];
const GROUPS:ReadonlyArray<{id:OfflineChecklistSection;title:string}> = [
  {id:"application",title:"Application files"},
  {id:"engine",title:"Game engine and physics"},
  {id:"world",title:"Meridian City and surfaces"},
  {id:"voight",title:"Voight and animations"},
  {id:"vehicles",title:"Vehicles"},
];

export function vehicleForResource(url:string):OfflineVehicleId|null {
  const path=decodeURIComponent(url).toLowerCase();
  if(path.includes("range rover sports 2018"))return "range-rover";
  if(path.includes("toyota hilux 002") || path.includes("glbs/cars/generated/toyota-hilux-002"))return "hilux";
  if(path.includes("land rover defender 001") || path.includes("glbs/cars/generated/land-rover-defender-001"))return "defender";
  if(path.includes("dodge_hp") || path.includes("glbs/cars/generated/dodge-hp"))return "dodge";
  if(path.includes("bmw_m4_competition") || path.includes("glbs/cars/generated/bmw-m4-competition"))return "bmw";
  if(path.includes("lamborghini+temerario"))return "lamborghini";
  return null;
}
export function groupForResource(url:string):OfflineChecklistSection {
  const path=decodeURIComponent(url).toLowerCase();
  if(vehicleForResource(url))return "vehicles";
  if(path.startsWith("/glbs/characters/"))return "voight";
  if(path.endsWith(".wasm") || path.startsWith("/offline001/draco/") ||
    /^\/assets\/(?:gtd-runtime|generated-first-light-world|gltf-|thinengine|physics-|rapier)/.test(path))
    return "engine";
  if((path.startsWith("/assets/") && /\.(?:js|css)$/.test(path)) ||
    path.startsWith("/offline001/fonts/") || path.startsWith("/icons/") ||
    path==="/_shell.html" || path==="/manifest.webmanifest")
    return "application";
  return "world";
}
/** installedURLs must contain only resources previously stored after hash
 * verification, or retrieved from the same release's verified content cache. */
export function createOfflineChecklist(
  resources:readonly OfflineListedResource[],
  installedURLs:ReadonlySet<string>,
):OfflineChecklistEntry[] {
  const grouped=new Map<OfflineChecklistSection,string[]>();
  for(const group of GROUPS)grouped.set(group.id,[]);
  const byVehicle=new Map<OfflineVehicleId,string[]>();
  for(const name of VEHICLES)byVehicle.set(name,[]);
  for(const resource of resources){
    const section=groupForResource(resource.url);
    grouped.get(section)!.push(resource.url);
    if(section==="vehicles"){
      const name=vehicleForResource(resource.url);
      if(name)byVehicle.get(name)!.push(resource.url);
    }
  }
  return GROUPS.map(group=>{
    if(group.id==="vehicles"){
      const total=[...byVehicle.values()].filter(files=>files.length>0).length;
      const installed=[...byVehicle.values()].filter(files=>files.length>0 &&
        files.every(file=>installedURLs.has(file))).length;
      return {id:group.id,title:group.title,installed,total,
        complete:total===VEHICLES.length && installed===total,
        detail:total?(installed+" of "+total+" vehicles installed"):"Waiting for vehicle list"};
    }
    const files=grouped.get(group.id)!;
    const total=files.length;
    const installed=files.filter(file=>installedURLs.has(file)).length;
    return {id:group.id,title:group.title,installed,total,
      complete:total>0&&installed===total,
      detail: total===0?"Not available in this release":
        installed===total?"Installed":
        installed===0?"Not installed":(installed+" of "+total+" files installed")};
  });
}
