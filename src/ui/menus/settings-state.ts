import { useEffect, useState } from "react";
import { normalizeRenderClarity, type RenderClarityMode } from "@/game/renderer/render-clarity";
export type Settings = {
  quality: string;
  renderClarity: RenderClarityMode;
  fps: string;
  shadows: boolean;
  master: number;
  music: number;
  effects: number;
  muted: boolean;
  sensitivity: number;
  touchSensitivity: number;
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
  quality: "High",
  renderClarity: "Auto",
  fps: "60",
  shadows: true,
  master: 80,
  music: 65,
  effects: 85,
  muted: false,
  sensitivity: 50,
  touchSensitivity: 60,
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
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaults);
  useEffect(() => {
    try {
      const value = localStorage.getItem("gtd-interface-settings");
      if (value) {
        const stored = JSON.parse(value) as Partial<Settings>;
        // The old "resolution: Native" setting had no runtime effect. Do
        // not silently turn an old user's ignored choice into expensive
        // physical-DPR rendering during the first upgraded mobile session.
        setSettings({
          ...defaults,
          ...stored,
          renderClarity: normalizeRenderClarity(stored.renderClarity),
        });
      }
    } catch {
      /* Use defaults when settings storage is unavailable. */
    }
  }, []);
  const save = (value: Settings) => {
    setSettings(value);
    try {
      localStorage.setItem("gtd-interface-settings", JSON.stringify(value));
    } catch {
      /* Settings still apply for this session. */
    }
  };
  return { settings, setSettings, save };
}
