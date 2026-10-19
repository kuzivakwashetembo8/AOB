/** VEH-016 — isolated, provisional original-coupe seating calibration.
 * The four accepted GLBs retain RANGE_ROVER_STREET_PROFILE seat logic.
 * These are character presentation offsets, never visual or Rapier chassis offsets.
 */
import type {SeatVehiclePose,SeatVehicleDimensions,DriverWorldPose} from "./driver-seat-placement";

export type Coupe016="BMW M4"|"Lamborghini Temerario";

export const COUPE_SEAT_016=Object.freeze({
  "BMW M4":{lateralFraction:-.22,forwardFraction:.035,verticalFraction:.57},
  "Lamborghini Temerario":{lateralFraction:.22,forwardFraction:.04,verticalFraction:.30},
} as const);

/** BMW uses the opposite side of the accepted Rover's generic seat.
 * The compact Lamborghini cockpit requires a lower character ROOT to avoid
 * the roof, but its authored 1.78m skeleton and animations are unchanged.
 */
export function coupeDriverSeatWorldPose(
  name:Coupe016,vehicle:SeatVehiclePose,dimensions:SeatVehicleDimensions,
):DriverWorldPose{
  const values=[vehicle.x,vehicle.y,vehicle.z,vehicle.yaw,
    dimensions.x,dimensions.y,dimensions.z];
  if(!values.every(Number.isFinite)||dimensions.x<=0||dimensions.y<=0||dimensions.z<=0)
    throw Error("VEH-016 invalid source-calibrated coupe dimensions");
  const spec=COUPE_SEAT_016[name];
  const dx=dimensions.x*spec.lateralFraction;
  const dz=dimensions.z*spec.forwardFraction;
  const cs=Math.cos(vehicle.yaw),sn=Math.sin(vehicle.yaw);
  return {
    x:vehicle.x+cs*dx+sn*dz,
    y:vehicle.y+dimensions.y*spec.verticalFraction,
    z:vehicle.z-sn*dx+cs*dz,
    yaw:vehicle.yaw,
  };
}

/** Adapt the accepted provisional SUV footwell workflow to the BMW, using
 * actual imported chassis height, never a fake dimension or hidden feet.
 * Only thigh/calf IK target coordinates change; real-shoe measurement and
 * the fail-closed contact solver still decide whether a pose is accepted.
 */
export function bmw016FootwellHeight(vehicleY:number,chassisHeight:number):number{
  if(!Number.isFinite(vehicleY)||!Number.isFinite(chassisHeight)||chassisHeight<=0)
    throw Error("VEH-016 invalid BMW footwell dimensions");
  return vehicleY+chassisHeight*.50;
}
