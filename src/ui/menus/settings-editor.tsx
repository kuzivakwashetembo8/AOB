import { useEffect, useState } from "react";
import { Check, RotateCcw, Monitor, Volume2, Gamepad2, Eye, PanelsTopLeft, Smartphone, Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { defaults, type Settings } from "@/ui/menus/settings-state";
import {updateGtdToPublishedRelease001,type GtdUpdateStage001} from "@/lib/gtd-update-001";
import { GameplayAnalyticsPanel } from "@/ui/menus/gameplay-analytics-panel";

declare const __GTD_RELEASE_ID__: string;

/** Shared form, mounted inside the paused game without navigating away. */
// OPT-05: controls without a connected runtime implementation must be
// discoverable, but must not accept changes or claim that they work.
const comingSoonSettings=new Set<keyof Settings>([
  "master","music","effects","muted","subtitles","vibration",
]);
const categories = [
  { name: "Graphics", icon: Monitor },
  { name: "Audio", icon: Volume2 },
  { name: "Controls", icon: Gamepad2 },
  { name: "Physics & Foot IK", icon: Activity },
  { name: "Accessibility", icon: Eye },
  { name: "Interface", icon: PanelsTopLeft },
  { name: "Mobile Controls", icon: Smartphone },
  { name: "System", icon: RefreshCw },
  { name: "Gameplay Analytics", icon: Activity },
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
  const [updating, setUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string|null>(null);
  const [updateError, setUpdateError] = useState(false);
  const queryRelease=typeof window!=="undefined"
    ?new URLSearchParams(window.location.search).get("gtd_update")?.slice(0,12)
    :undefined;
  const staleAfterUpdate=Boolean(queryRelease&&
    !__GTD_RELEASE_ID__.startsWith(queryRelease));
  const updateGame = () => {
    if(updating)return;
    setUpdating(true);setUpdateError(false);
    setUpdateStatus("Checking the published G.T.D release…");
    void updateGtdToPublishedRelease001((_stage:GtdUpdateStage001,detail)=>{
      setUpdateStatus(detail);
    }).catch((error:unknown)=>{
      setUpdating(false);setUpdateError(true);
      setUpdateStatus(error instanceof Error?error.message:"Update failed. Your saved game was preserved.");
    });
  };
  const [settings, setSettings] = useState<Settings>(initialSettings);
  // The standalone Settings route hydrates saved choices asynchronously.
  // Reflect that hydration without requiring a route reload.
  useEffect(() => setSettings(initialSettings), [initialSettings]);
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
  };
  const range = (key: keyof Settings, label: string, max = 100, min = 0, unit = "%", step = 1) => (
    <label className="setting-row" key={key} aria-disabled={comingSoonSettings.has(key)}>
      <span>{label}{comingSoonSettings.has(key)&&<small>Coming soon</small>}</span>
      <span className="range-control">
        <input
          aria-label={label}
          type="range"
          disabled={comingSoonSettings.has(key)}
          min={min}
          max={max}
          step={step}
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
          disabled={comingSoonSettings.has(key)}
          checked={Boolean(settings[key])}
          onChange={(event) => update(key, event.target.checked)}
        />
      </span>
    </label>
  );
  // Radix renders a real custom menu in the application surface on both
  // Android and desktop; never delegate control selection to the OS picker.
  const select = (key: keyof Settings, label: string, options: string[]) => (
    <div className="setting-row" key={key}>
      <span id={`setting-${key}`}>{label}</span>
      <Select
        value={String(settings[key])}
        onValueChange={(value) => {
          if (options.includes(value)) update(key, value);
        }}
      >
        <SelectTrigger
          aria-labelledby={`setting-${key}`}
          aria-label={label}
          className="game-setting-select-trigger"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          position="popper" sideOffset={4}
          className="game-setting-select-content"
        >
          {options.map((value) => (
            <SelectItem key={value} value={value} className="game-setting-select-option">
              {value === "drag" ? "Drag" : value === "arrows" ? "Arrows" : value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
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
                {toggle("enableCharacter", "Enable Character")}
                <p className="overlay-note">
                  Switch between the existing UAL development humanoid and
                  Voight (character.glb). This preference is shared by all
                  districts. Both use the current district's physics controller;
                  capabilities depend on available world interactions.
                </p>
                {range("sensitivity", "Mouse look sensitivity", 100, 10)}
                {range("thirdPersonCameraDistanceMeters", "Camera Distance", 8, 3, " m", .25)}
                {toggle("firstPersonShooting", "First-person shooting view")}
                <p className="overlay-note">Optional on-foot view for Reese. OFF keeps the standard third-person camera. Vehicle, elevator and Machine Camera contexts retain their own camera behavior.</p>
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
            {category === "Physics & Foot IK" && (
              <>
                <p className="overlay-note">Rapier physics remains active for the game. These options show the real character collision capsule and foot-ground queries while testing CHAR-110. The two-bone Foot IK solver is not yet enabled; target probes are diagnostic and do not alter physics or bone placement.</p>
                {toggle("physicsDebug", "Physics: ground contact probes")}
                {toggle("physicsCapsuleDebug", "Physics: player capsule geometry")}
                {toggle("footIKProbes", "Foot IK: inspect ground targets")}
                {toggle("footIKDebug", "Foot IK: show bone and target markers")}
                {toggle("footIKPrediction", "Foot IK: predictive landing probes")}
                {range("footIKReachCm", "Ground detection reach", 100, 15, " cm")}
                {range("footIKPredictionMs", "Landing prediction horizon", 500, 100, " ms")}
                <p className="overlay-note">The reference Foot IK uses predictive probes, sole contacts, stance phases and a two-bone solver. This stage exposes measured ground targets first; pelvis adjustment, planted-foot locking and reactive joint correction remain pending. All diagnostic meshes are optional.</p>
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
                {select("drivingTouchLayout", "Driving controls", ["drag", "arrows"])}
                <p className="overlay-note">Drag (existing) or four arrows while driving. Arrows: tap for a small turn; hold for progressively stronger steering. Walking controls are unchanged.</p>
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
            {category === "Gameplay Analytics" && <GameplayAnalyticsPanel />}
            {category === "System" && (
              <section className="space-y-3" aria-label="G.T.D release update">
                <div className="setting-row">
                  <span>Current game version<small>Update checks the newest published build on this site's domain.</small></span>
                  <span className="system-label" data-testid="gtd-installed-release">
                    {typeof __GTD_RELEASE_ID__==="string"?__GTD_RELEASE_ID__.slice(0,10):"DEVELOPMENT"}
                  </span>
                </div>
                <Button variant="menu" type="button" disabled={updating}
                  className="w-full justify-center" onClick={updateGame}
                  data-testid="gtd-update-button">
                  <RefreshCw size={17} className={updating?"animate-spin":""}/>
                  {updating?"Updating G.T.D…":"Update Game"}
                </Button>
                <p className="overlay-note">
                  Checks the latest deployed release, downloads its verified app shell,
                  removes outdated game caches and reloads with fresh assets.
                  Progress and settings are preserved. The full offline game pack
                  may require reinstallation. Unsaved in-session activity may be lost.
                </p>
                {staleAfterUpdate&&!updateStatus&&
                  <p className="text-destructive text-sm" role="alert">
                    The loaded game does not match the requested update.
                    Select Update Game again to retry.
                  </p>}
                {updateStatus&&<p className={updateError?"text-destructive text-sm":"toast-line"}
                  data-testid="gtd-update-status" role="status" aria-live="polite">
                  {updateStatus}
                </p>}
              </section>
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
