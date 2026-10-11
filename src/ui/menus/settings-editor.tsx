import { useEffect, useState } from "react";
import { Check, RotateCcw, Monitor, Volume2, Gamepad2, Eye, PanelsTopLeft, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { defaults, type Settings } from "@/ui/menus/settings-state";

/** Shared form, mounted inside the paused game without navigating away. */
const categories = [
  { name: "Graphics", icon: Monitor },
  { name: "Audio", icon: Volume2 },
  { name: "Controls", icon: Gamepad2 },
  { name: "Accessibility", icon: Eye },
  { name: "Interface", icon: PanelsTopLeft },
  { name: "Mobile Controls", icon: Smartphone },
];
export function SettingsEditor({
  initialSettings, onApply, inGame = false,
}: {
  initialSettings: Settings;
  onApply: (next: Settings) => void;
  inGame?: boolean;
}) {
  const [category, setCategory] = useState("Graphics");
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<Settings>(initialSettings);
  // The standalone Settings route hydrates saved choices asynchronously.
  // Reflect that hydration without requiring a route reload.
  useEffect(() => setSettings(initialSettings), [initialSettings]);
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
  };
  const range = (key: keyof Settings, label: string, max = 100, min = 0, unit = "%") => (
    <label className="setting-row" key={key}>
      <span>{label}</span>
      <span className="range-control">
        <input
          aria-label={label}
          type="range"
          min={min}
          max={max}
          value={Number(settings[key])}
          onChange={(event) => update(key, Number(event.target.value))}
        />
        <output>
          {String(settings[key])}
          {unit}
        </output>
      </span>
    </label>
  );
  const toggle = (key: keyof Settings, label: string) => (
    <label className="setting-row" key={key}>
      <span>{label}</span>
      <span className="toggle-wrap">
        <input
          aria-label={label}
          type="checkbox"
          checked={Boolean(settings[key])}
          onChange={(event) => update(key, event.target.checked)}
        />
      </span>
    </label>
  );
  const select = (key: keyof Settings, label: string, options: string[]) => (
    <label className="setting-row" key={key}>
      <span>{label}</span>
      <select
        aria-label={label}
        value={String(settings[key])}
        onChange={(event) => update(key, event.target.value)}
      >
        {options.map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
    </label>
  );

  return (
    <div className={inGame ? "settings-editor settings-editor-ingame" : "settings-editor"}>
        <div className={inGame ? "settings-layout settings-layout-ingame" : "settings-layout"}>
          <nav className="settings-tabs" aria-label="Settings categories">
            {categories.map(({ name, icon: Icon }) => (
              <Button
                key={name}
                variant="menu"
                className="settings-tab"
                aria-pressed={category === name}
                onClick={() => setCategory(name)}
              >
                <Icon size={16} /> {name}
              </Button>
            ))}
          </nav>
          <div className="settings-panel">
            <h2>{category}</h2>
            {category === "Graphics" && (
              <>
                {select("quality", "Quality preset", ["Low", "Medium", "High", "Ultra"])}
                {select("renderClarity", "3D render clarity", ["Auto", "Balanced", "Sharper", "Native", "Custom"])}
                <label className="setting-row" htmlFor="physical-resolution-slider">
                  <span>
                    Physical display resolution
                    <small>
                      100% targets your screen's physical pixels. Above 100% is
                      supersampling and may lower frame rate. Move the slider
                      to choose Custom; Auto keeps the prior safe default.
                    </small>
                  </span>
                  <span className="range-control">
                    <input
                      id="physical-resolution-slider"
                      aria-label="Physical display resolution"
                      type="range"
                      min={50}
                      max={125}
                      step={5}
                      value={settings.renderScalePercent}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setSettings((previous) => ({
                          ...previous,
                          renderClarity: "Custom",
                          renderScalePercent: value,
                        }));
                        setSaved(false);
                      }}
                    />
                    <output htmlFor="physical-resolution-slider">{settings.renderScalePercent}%</output>
                  </span>
                </label>
                {select("fps", "Frame-rate limit", ["30", "60", "120", "Uncapped"])}
                {toggle("shadows", "Dynamic shadows")}
              </>
            )}
            {category === "Audio" && (
              <>
                {range("master", "Master volume")}
                {range("music", "Music volume")}
                {range("effects", "Effects volume")}
                {toggle("muted", "Mute all audio")}
              </>
            )}
            {category === "Controls" && (
              <>
                {range("sensitivity", "Mouse look sensitivity", 100, 10)}
                {toggle("invertY", "Invert look Y axis")}
                {toggle("vibration", "Controller vibration")}
                {toggle("desktopControls", "Show desktop on-screen controls")}
                <div className="setting-row">
                  <span>Movement</span>
                  <span className="system-label">ARROWS / W A S D / LEFT STICK</span>
                </div>
                <div className="setting-row">
                  <span>Interact / Enter vehicle</span>
                  <span className="system-label">E / F</span>
                </div>
              </>
            )}
            {category === "Accessibility" && (
              <>
                {toggle("subtitles", "Subtitles")}
                {toggle("contrast", "High-contrast interface")}
                {toggle("reducedMotion", "Reduce interface motion")}
                {select("textSize", "Text size", ["Standard", "Large"])}
              </>
            )}
            {category === "Interface" && (
              <>
                {toggle("hud", "Show HUD")}
                {toggle("objective", "Show objectives")}
                {select("textSize", "Text size", ["Standard", "Large"])}
              </>
            )}
            {category === "Mobile Controls" && (
              <>
                {range("touchSensitivity", "Touch camera sensitivity", 100, 10)}
                {toggle("invertY", "Invert vertical camera swipe")}
                {range("opacity", "Control opacity", 100, 20)}
                {range("scale", "Control scale", 120, 80)}
                {range("joystickSize", "Joystick size", 150, 80, "")}
                {select("position", "Button position", ["Standard", "Compact", "Wide"])}
                {select("handedness", "Control layout", ["Right-handed", "Left-handed"])}
                {toggle("haptics", "Touch haptics")}
                {toggle("autoHide", "Hide when keyboard is active")}
              </>
            )}
            <div className="settings-bottom">
              <Button
                variant="menu"
                onClick={() => {
                  setSettings(defaults);
                  setSaved(false);
                }}
              >
                <RotateCcw size={13} /> Reset defaults
              </Button>
              <Button
                variant="game"
                onClick={() => {
                  onApply(settings);
                  setSaved(true);
                }}
              >
                <Check size={15} /> {inGame ? "APPLY & RESUME" : "APPLY SETTINGS"}
              </Button>
            </div>
            <p className={saved ? "toast-line" : "overlay-note"} role="status">
              {saved
                ? "SETTINGS APPLIED"
                : "ENGINE-DEPENDENT OPTIONS APPLY WHEN THE RUNTIME IS CONNECTED."}
            </p>
          </div>
        </div>
    </div>
  );
}
