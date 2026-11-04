/** PED-001: additional marked crossings needed to connect all 100 city blocks.
 * Keep the accepted every-third-junction zebras, add a deterministic minimal
 * connectivity extension. Shared by geometry paint and pedestrian graph. */
const ADDITIONAL_ZEBRAS=new Set(["6,4","1,1","3,1","4,1","6,1","7,1","9,1","9,2","1,3","5,3","7,4","3,5","9,5","1,6","5,6","7,7","3,8","9,8","1,9","5,9","1,0","2,2","0,4","9,4","0,7","9,7","7,9"]);
export function northHeightsPedestrianZebra001(ix:number,iz:number){
 if(ix<0||iz<0||ix>9||iz>9)return false;
 return (ix>0&&iz>0&&(ix+iz)%3===0)||ADDITIONAL_ZEBRAS.has(ix+","+iz);
}
