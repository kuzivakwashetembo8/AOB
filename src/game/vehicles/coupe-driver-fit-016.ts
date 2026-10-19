/** VEH-017 — adopt the accepted Range Rover seated driving template.
 *
 * Preserve precisely the UAL Driving_Loop, leg IK, sole correction, and
 * +Z/anchor yaw used by the Rover. Coupe offsets are cabin POSITION only:
 * the BMW's verified driver side is opposite the Rover's, and the shorter
 * Lamborghini roof cannot safely accept a full-size SUV root height.
 * No wheel mesh, chassis orientation, steering or input controls change.
 */
import type {SeatVehiclePose,SeatVehicleDimensions,DriverWorldPose}
  from "./driver-seat-placement";
import {rangeRoverDriverSeatWorldPose}
  from "./range-rover-drive-007";

export type Coupe016="BMW M4"|"Lamborghini Temerario";

/** Deltas measured in actual fitted dimensions, applied to the Rover pose
 * in the vehicle's local frame (x=lateral, z=longitudinal, y=height).
 *
 * Longitudinal corrections keep the pelvis toward the seat-back instead of
 * pushing both thighs into the dashboard; they do not solve leg IK.
 * The Lamborghini height is a bounded provisional roof-clearance offset.
 */
export const ROVER_TEMPLATE_COUPE_ADJUSTMENTS=Object.freeze({
  "BMW M4":{
    lateralFraction:-.44, // Rover +.22 -> BMW -.22; preserve correct side
    longitudinalFraction:-.075, // Rover +.11 -> BMW +.035
    heightFraction:0, // Same accepted Rover .57 fitted-height rule
  },
  "Lamborghini Temerario":{
    lateralFraction:0, // Same side as Rover
    longitudinalFraction:-.07, // Rover +.11 -> Lamborghini +.04
    heightFraction:-.14, // Rover .57 -> .43 to accommodate low roof
  },
} as const);

export function coupeDriverSeatWorldPose(
  name:Coupe016,vehicle:SeatVehiclePose,dimensions:SeatVehicleDimensions,
):DriverWorldPose{
  // The accepted Rover function remains the one source of truth.
  const reference=rangeRoverDriverSeatWorldPose(vehicle,dimensions);
  const adjustment=ROVER_TEMPLATE_COUPE_ADJUSTMENTS[name];
  const dx=dimensions.x*adjustment.lateralFraction;
  const dz=dimensions.z*adjustment.longitudinalFraction;
  const cs=Math.cos(vehicle.yaw),sn=Math.sin(vehicle.yaw);
  return {
    x:reference.x+cs*dx+sn*dz,
    y:reference.y+dimensions.y*adjustment.heightFraction,
    z:reference.z-sn*dx+cs*dz,
    yaw:reference.yaw,
  };
}
