/** NH-009: deterministic named streets and areas for every 10x10 block. */
export const NORTH_HEIGHTS_COORDS=Array.from({length:11},(_,i)=>-320+64*i) as readonly number[];
export const NORTH_HEIGHTS_X_STREETS=["Westcrest Lane","Founders Avenue","Willowmere Road","Terrace Street","Observatory Drive","Meridian Boulevard","Civic Avenue","Beacon Street","Eastbank Road","Glassway Avenue","Horizon Parkway"] as const;
export const NORTH_HEIGHTS_Z_STREETS=["Gateway Road","Quarry Street","Foundry Avenue","Exchange Street","Commerce Way","Skyline Avenue","Civic Square Road","Overlook Street","Highland Avenue","Garden Terrace","Summit Road"] as const;
export type NorthHeightsArea="South Gateway"|"West Terrace"|"Glass Exchange"|"Eastview Quarter"|"Ridge Gardens"|"Summit Crest";
export function northHeightsAreaAt(row:number,col:number):NorthHeightsArea{
  if(row<=2)return "South Gateway";
  if(row>=10)return "Summit Crest";
  if(row>=8)return "Ridge Gardens";
  if(col<=3)return "West Terrace";
  if(col>=8)return "Eastview Quarter";
  return "Glass Exchange";
}
export interface NorthHeightsLocation{area:NorthHeightsArea;street:string;blockId:string;streetId:string;text:string;}
export function northHeightsLocationAt(pos:{x:number;z:number},previousStreetId?:string):NorthHeightsLocation{
  const x=Number.isFinite(pos.x)?pos.x:0,z=Number.isFinite(pos.z)?pos.z:0;
  const ix=Math.max(0,Math.min(9,Math.floor((x+320)/64))),iz=Math.max(0,Math.min(9,Math.floor((z+320)/64)));
  const sx=Math.max(0,Math.min(10,Math.round((x+320)/64))),sz=Math.max(0,Math.min(10,Math.round((z+320)/64)));
  let axis:"x"|"z"=Math.abs(x-NORTH_HEIGHTS_COORDS[sx]!)<=Math.abs(z-NORTH_HEIGHTS_COORDS[sz]!)?"x":"z";
  let index=axis==="x"?sx:sz;
  if(previousStreetId){
    const match=/^nh-road-([xz])-(\d+)$/.exec(previousStreetId);
    if(match){
      const prevAxis=match[1] as "x"|"z",prevIndex=Number(match[2]);
      const best=Math.min(Math.abs(x-NORTH_HEIGHTS_COORDS[sx]!),Math.abs(z-NORTH_HEIGHTS_COORDS[sz]!));
      if(prevIndex>=0&&prevIndex<=10&&Math.abs((prevAxis==="x"?x:z)-NORTH_HEIGHTS_COORDS[prevIndex]!)<best+2.5){
        axis=prevAxis;index=prevIndex;
      }
    }
  }
  const area=northHeightsAreaAt(iz+1,ix+1);
  const street=axis==="x"?NORTH_HEIGHTS_X_STREETS[index]!:NORTH_HEIGHTS_Z_STREETS[index]!;
  return {area,street,blockId:"NH-"+String(iz+1).padStart(2,"0")+"-"+String(ix+1).padStart(2,"0"),
    streetId:"nh-road-"+axis+"-"+index,text:"NORTH HEIGHTS // "+area.toUpperCase()+" // "+street.toUpperCase()};
}
