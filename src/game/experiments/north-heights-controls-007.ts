/** Input adapter only: North Heights renders GTD's existing controls unchanged. */
import type {GameAction} from "@/game/core/types";
export type NorthHeightsControl007="up"|"down"|"fast";
export function northHeightsActionControl007(action:GameAction):NorthHeightsControl007|null {
  switch(action){
    case "jump":return "up";
    case "descend":return "down";
    case "sprint":return "fast";
    default:return null;
  }
}
/** A visible capability message is preferable to a silently dead button. */
export function northHeightsUnavailableAction007(action:GameAction):string {
  switch(action){
    case "interact":return "No interactive object is available in the North Heights trial.";
    case "vehicle":return "No drivable vehicle is present in North Heights yet.";
    case "combat":return "Combat is not enabled in this district trial.";
    case "context":return "No context action is available at this location.";
    default:return "Action unavailable here.";
  }
}
