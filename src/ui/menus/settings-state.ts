import { useEffect, useState } from "react";
import { normalizeRenderClarity, normalizeRenderScalePercent, type RenderClarityMode } from "@/game/renderer/render-clarity";
/** One third-person on-foot/flight camera radius shared by all GTD districts. */
export const CAMERA_DISTANCE_DEFAULT=4.5;
export function normalizeThirdPersonCameraDistance(value:unknown):number{
  return typeof value==="number"&&Number.isFinite(value)
    ?Math.max(3,Math.min(8,value)):CAMERA_DISTANCE_DEFAULT;
}
export type DrivingTouchLayout = "drag" | "arrows";
export function normalizeDrivingTouchLayout(value: unknown): DrivingTouchLayout {
  return value === "arrows" ? "arrows" : "drag";
}
export type Settings = {
  enableCharacter: boolean;
  physicsDebug: boolean;
  physicsCapsuleDebug: boolean;
  footIKProbes: boolean;
  footIKDebug: boolean;
  footIKPrediction: boolean;
  footIKReachCm: number;
  footIKPredictionMs: number;
  drivingTouchLayout: DrivingTouchLayout;
  quality: string;
  renderClarity: RenderClarityMode;
  renderScalePercent: number;
  fps: string;
  shadows: boolean;
  master: number;
  music: number;
  effects: number;
  muted: boolean;
  sensitivity: number;
  touchSensitivity: number;
  thirdPersonCameraDistanceMeters: number;
  firstPersonShooting: boolean;
  invertY: boolean;
  vibration: boolean;
  reducedMotion: boolean;
  subtitles: boolean;
  contrast: boolean;
  hud: boolean;
  objective: boolean;
  textSize: string;
  opacity: number;
  scale: number;
  joystickSize: number;
  position: string;
  handedness: string;
  haptics: boolean;
  autoHide: boolean;
  desktopControls: boolean;
};
export const defaults: Settings = {
  enableCharacter: true,
  physicsDebug: false,
  physicsCapsuleDebug: false,
  footIKProbes: false,
  footIKDebug: false,
  footIKPrediction: false,
  footIKReachCm: 50,
  footIKPredictionMs: 220,
  drivingTouchLayout: "drag",
  quality: "High",
  renderClarity: "Auto",
  renderScalePercent: 100,
  fps: "60",
  shadows: true,
  master: 80,
  music: 65,
  effects: 85,
  muted: false,
  sensitivity: 50,
  touchSensitivity: 60,
  thirdPersonCameraDistanceMeters: CAMERA_DISTANCE_DEFAULT,
  firstPersonShooting: false,
  invertY: false,
  vibration: true,
  reducedMotion: false,
  subtitles: true,
  contrast: false,
  hud: true,
  objective: true,
  textSize: "Standard",
  opacity: 65,
  scale: 100,
  joystickSize: 110,
  position: "Standard",
  handedness: "Right-handed",
  haptics: true,
  autoHide: true,
  desktopControls: true,
};
export function useSettings(active = true) {
  const [settings, setSettings] = useState<Settings>(defaults);
  useEffect(() => {
    if (!active) return;
    try {
      const value = localStorage.getItem("gtd-interface-settings");
      if (value) {
        const stored = JSON.parse(value) as Partial<Settings>;
        // The original "Enable Character: OFF" was a legacy default, not
        // proof of an explicit UAL choice. Migrate once to Voight on existing
        // devices. After migration, an explicitly saved OFF remains respected.
        const charDefaultVersionKey = "gtd-voight-default-v1";
        const alreadyMigrated = localStorage.getItem(charDefaultVersionKey) === "1";
        const enableCharacter = alreadyMigrated
          ? stored.enableCharacter !== false
          : true;
        if (!alreadyMigrated) {
          localStorage.setItem(charDefaultVersionKey, "1");
          localStorage.setItem("gtd-interface-settings",
            JSON.stringify({ ...stored, enableCharacter }));
        }
        // The old "resolution: Native" setting had no runtime effect. Do
        // not silently turn an old user's ignored choice into expensive
        // physical-DPR rendering during the first upgraded mobile session.
        setSettings({
          ...defaults,
          ...stored,
          enableCharacter,
          physicsDebug: stored.physicsDebug === true,
          physicsCapsuleDebug: stored.physicsCapsuleDebug === true,
          footIKProbes: stored.footIKProbes === true,
          footIKDebug: stored.footIKDebug === true,
          footIKPrediction: stored.footIKPrediction === true,
          footIKReachCm: Number.isFinite(stored.footIKReachCm) ? Math.max(15,Math.min(100,Number(stored.footIKReachCm))) : 50,
          footIKPredictionMs: Number.isFinite(stored.footIKPredictionMs) ? Math.max(100,Math.min(500,Number(stored.footIKPredictionMs))) : 220,
          drivingTouchLayout: normalizeDrivingTouchLayout(stored.drivingTouchLayout),
          thirdPersonCameraDistanceMeters: normalizeThirdPersonCameraDistance(stored.thirdPersonCameraDistanceMeters),
          firstPersonShooting: stored.firstPersonShooting === true,
          renderClarity: normalizeRenderClarity(stored.renderClarity),
          renderScalePercent: normalizeRenderScalePercent(stored.renderScalePercent),
        });
      }
    } catch {
      /* Use defaults when settings storage is unavailable. */
    }
  }, [active]);
  const save = (value: Settings) => {
    setSettings(value);
    try {
      localStorage.setItem("gtd-voight-default-v1", "1");
      localStorage.setItem("gtd-interface-settings", JSON.stringify(value));
    } catch {
      /* Settings still apply for this session. */
    }
  };
  return { settings, setSettings, save };
}
