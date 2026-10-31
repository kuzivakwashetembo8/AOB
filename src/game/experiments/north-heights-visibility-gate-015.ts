/** NH-VIS-015: suppress redundant GPU instance-buffer rebuilds until a
 * camera has moved appreciably in the horizontal world plane. This is one
 * shared optimization for the full, unchanged tree/streetlight population.
 */
export function createNorthHeightsVisibilityGate015(metres=8){
  if(!Number.isFinite(metres)||metres<=0)throw Error("Invalid movement threshold");
  const minimumSquared=metres*metres;
  let lastX=NaN,lastZ=NaN,dirty=true;
  return {
    shouldRefresh(position:{x:number;z:number}):boolean{
      if(!Number.isFinite(position.x)||!Number.isFinite(position.z))return false;
      if(!dirty&&(position.x-lastX)**2+(position.z-lastZ)**2<minimumSquared)
        return false;
      lastX=position.x;lastZ=position.z;dirty=false;
      return true;
    },
    invalidate(){dirty=true;},
  };
}
