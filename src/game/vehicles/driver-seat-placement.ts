/** VEH-SEAT-001 only: place the existing UAL humanoid at a car-relative
 * driver position without touching steering, speed, wheel or Rapier code.
 *
 * Ferrari L0 visual anchor is at road contact height and its local nose is
 * -Z. The anchor is already scaled to its authored vehicle instance; these
 * offsets are specified in normalized world metres, not multiplied by the
 * anchor's nonuniform GLB normalization scale.
 */
export interface SeatVehiclePose {
  readonly x:number;readonly y:number;readonly z:number;
  readonly yaw:number;
}
export interface SeatVehicleDimensions {
  readonly x:number;readonly y:number;readonly z:number;
}
export interface DriverWorldPose {
  readonly x:number;readonly y:number;readonly z:number;
  readonly yaw:number;
}
export const FERRARI_SEAT_POSITION = Object.freeze({
  driverSideFraction:0.20,
  cabinForwardFraction:-0.12,
  aboveRoadHeightFraction:0.56,
  // UAL authored character faces +Z when its pedestrian root yaw is zero.
  // The Ferrari's local front is -Z, requiring a 180-degree facing offset.
  headingOffsetRadians:Math.PI,
});
export function ferrariSeatWorldPose(
  vehicle:SeatVehiclePose, dimensions:SeatVehicleDimensions,
):DriverWorldPose {
  const values=[vehicle.x,vehicle.y,vehicle.z,vehicle.yaw,
    dimensions.x,dimensions.y,dimensions.z];
  if(!values.every(Number.isFinite)||
    dimensions.x<=0||dimensions.y<=0||dimensions.z<=0)
    throw new Error("Invalid Ferrari seat transform");
  const dx=dimensions.x*FERRARI_SEAT_POSITION.driverSideFraction;
  const dz=dimensions.z*FERRARI_SEAT_POSITION.cabinForwardFraction;
  const cos=Math.cos(vehicle.yaw),sin=Math.sin(vehicle.yaw);
  return {
    x:vehicle.x+cos*dx+sin*dz,
    y:vehicle.y+dimensions.y*FERRARI_SEAT_POSITION.aboveRoadHeightFraction,
    z:vehicle.z-sin*dx+cos*dz,
    yaw:vehicle.yaw+FERRARI_SEAT_POSITION.headingOffsetRadians,
  };
}
