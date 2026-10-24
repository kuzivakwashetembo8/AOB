/** NH-006: apply the accepted GTD render-clarity model to isolated North Heights. */
import {renderHardwareScale} from "@/game/renderer/render-clarity";
import type {Settings} from "@/ui/menus/settings-state";

export function northHeightsHardwareScale006(settings:Settings,input:{
  dpr:number;coarse:boolean;width:number;height:number;
}):number {
  const base=renderHardwareScale({
    mode:settings.renderClarity,
    renderScalePercent:settings.renderScalePercent,
    devicePixelRatio:input.dpr,
    coarsePointer:input.coarse,
    cssWidth:input.width,
    cssHeight:input.height,
  });
  // Render clarity is the user's explicit pixel-density selection.
  // Presets then scale GPU budget without replacing that preference.
  const multiplier=settings.quality==="Low"?1.5:
    settings.quality==="Medium"?1.22:
    settings.quality==="Ultra"?.85:1;
  return Math.max(.35,base*multiplier);
}
export function northHeightsFrameLimit006(value:string):number{
  if(value==="30")return 30;
  if(value==="60")return 60;
  if(value==="120")return 120;
  return Infinity;
}
export function northHeightsTouchStyle006(settings:Settings){
  return {
    "--control-opacity":settings.opacity/100,
    "--control-scale":settings.scale/100,
    "--joystick-size":`${settings.joystickSize}px`,
  };
}
