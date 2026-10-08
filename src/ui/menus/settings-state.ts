import { useEffect, useState } from 'react';
export type Settings = {
  quality: string; resolution: string; fps: string; shadows: boolean;
  master: number; music: number; effects: number; muted: boolean;
  sensitivity: number; invertY: boolean; vibration: boolean;
  reducedMotion: boolean; subtitles: boolean; contrast: boolean;
  hud: boolean; objective: boolean; textSize: string;
  opacity: number; scale: number; joystickSize: number; position: string; handedness: string; haptics: boolean; autoHide: boolean;
};
export const defaults: Settings = { quality: 'High', resolution: 'Native', fps: '60', shadows: true, master: 80, music: 65, effects: 85, muted: false, sensitivity: 50, invertY: false, vibration: true, reducedMotion: false, subtitles: true, contrast: false, hud: true, objective: true, textSize: 'Standard', opacity: 65, scale: 100, joystickSize: 110, position: 'Standard', handedness: 'Right-handed', haptics: true, autoHide: true };
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaults);
  useEffect(() => { try { const value = localStorage.getItem('gtd-interface-settings'); if (value) setSettings({ ...defaults, ...JSON.parse(value) }); } catch { /* Use defaults when settings storage is unavailable. */ } }, []);
  const save = (value: Settings) => { setSettings(value); try { localStorage.setItem('gtd-interface-settings', JSON.stringify(value)); } catch { /* Settings still apply for this session. */ } };
  return { settings, setSettings, save };
}
