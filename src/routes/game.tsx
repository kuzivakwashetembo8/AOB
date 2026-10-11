import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useModalFocus } from "@/ui/menus/use-modal-focus";
import { GameCanvasHost } from "@/game/renderer/game-canvas-host";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Scene } from "@/ui/menus/shell";
import { pageHead } from "@/lib/page-head";
import { RuntimeBridge } from "@/game/bridge/runtime-bridge";
import { useGameSnapshot } from "@/game/bridge/use-game-bridge";
import { useInputMode } from "@/game/input/use-input-mode";
import { attachCanvasTouchCameraLook } from "@/game/input/touch-camera-drag";
import { useSettings } from "@/ui/menus/settings-state";
import { SettingsEditor } from "@/ui/menus/settings-editor";
import { GameHud } from "@/ui/hud/game-hud";
import { TouchControls } from "@/ui/hud/touch-controls";
import { DesktopControls } from "@/ui/hud/desktop-controls";
import { BootstrapOverlay } from "@/ui/menus/bootstrap";
import { downloadCharacterTrialEvidence } from "@/game/character/character-trial-download";
import {
  DEFAULT_TRAVEL_HEADING, normalizeHeadingSettings,
} from "@/game/character/locomotion/travel-heading";
import type { GameAction } from "@/game/core/types";
import { initialStartupChecklist, applyStartupCheckpoint } from "@/game/core/loading-checklist";
export const Route = createFileRoute("/game")({
  head: () =>
    pageHead(
      "Meridian viewport",
      "The GTD game viewport: mission objectives, contextual HUD, touch controls, and a clean future 3D runtime boundary.",
    ),
  component: GamePage,
});
function GamePage() {
  const [bridge] = useState(() => new RuntimeBridge());
  const snapshot = useGameSnapshot(bridge);
  const canvas = useRef<HTMLCanvasElement>(null);
  const mode = useInputMode();
  const { settings, save } = useSettings();
  const context = snapshot.context;
  const [paused, setPaused] = useState(false);
  const [panel, setPanel] = useState<"pause" | "objectives" | "save" | "settings" | "locomotion">("pause");
  const [headingSettings, setHeadingSettings] = useState(DEFAULT_TRAVEL_HEADING);
  const [checklist, setChecklist] = useState(initialStartupChecklist);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const trialBrowserErrors = useRef<string[]>([]);
  const trialEnabled = typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("gtdCharacterTrial") === "ual";
  const [loaded, setLoaded] = useState(false);
  const [runtimeDetail, setRuntimeDetail] = useState("INITIALIZING");
  const [interaction, setInteraction] = useState("");
  const [lastInput, setLastInput] = useState("STANDBY");
  const navigate = useNavigate();
  const closePause = useCallback(() => setPaused(false), []);
  useModalFocus(paused, closePause);
  const action = (value: GameAction) => {
    setLastInput(value.toUpperCase());
    setInteraction("");
  };
  useEffect(() => {
    if (!trialEnabled) return;
    const append = (message: string) => {
      trialBrowserErrors.current.push(message.slice(0, 1400));
      if (trialBrowserErrors.current.length > 25) trialBrowserErrors.current.shift();
    };
    const onError = (event: ErrorEvent) => append(
      "window.error: " + event.message + " at " + event.filename + ":" + event.lineno,
    );
    const onRejection = (event: PromiseRejectionEvent) => append(
      "unhandledrejection: " + String(event.reason instanceof Error ? event.reason.stack ?? event.reason.message : event.reason),
    );
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [trialEnabled]);
  useEffect(() => {
    let cancelled = false;
    const unsubscribe = bridge.subscribeEvent((event) => {
      if (event.type === "interaction") setInteraction(event.label ?? "");
      if (event.type === "load-checkpoint") {
        setChecklist((entries) => applyStartupCheckpoint(entries, event));
        setRuntimeDetail(event.detail?.toUpperCase() ?? event.id.replace(/-/g, " ").toUpperCase());
      }
      if (event.type === "error") {
        setRuntimeDetail(event.message.toUpperCase());
      }
    });
    void (async () => {
      try {
        const host = canvas.current;
        if (!host) return;
        const { GTDGameRuntime } = await import("@/game/core/gtd-runtime");
        if (cancelled) return;
        const runtime = new GTDGameRuntime();
        bridge.attach(runtime);
        await bridge.bootstrap(host);
        if (cancelled) return;
        setLoaded(true);
        bridge.start();
      } catch (error) {
        console.error("GTD runtime bootstrap failed", error);
        setRuntimeDetail("RUNTIME BOOT FAILED");
        setBootstrapError(error instanceof Error ? error.message : String(error));
      }
    })();
    return () => {
      cancelled = true;
      unsubscribe();
      bridge.destroy();
    };
  }, [bridge]);
  useEffect(() => {
    bridge.command({ type: "input-mode", mode });
  }, [bridge, mode]);
  useEffect(() => {
    if (!loaded) return;
    // Persisted graphics choices are applied after Babylon is initialized.
    // Auto is also the safe immediate bootstrap policy before hydration.
    bridge.command({ type: "render-clarity", mode: settings.renderClarity, scalePercent: settings.renderScalePercent });
  }, [bridge, loaded, settings.renderClarity, settings.renderScalePercent]);
  useEffect(() => {
    if (!loaded) return;
    bridge.command({
      type: "camera-settings",
      touchSensitivity: settings.touchSensitivity,
      invertY: settings.invertY,
    });
  }, [bridge, loaded, settings.touchSensitivity, settings.invertY]);

  useEffect(() => {
    if (!trialEnabled || !loaded) return;
    bridge.command({ type: "character-locomotion-tuning", settings: headingSettings });
  }, [bridge, trialEnabled, loaded, headingSettings]);

  const downloadLocomotionTrace = () => {
    if (!trialEnabled || typeof window === "undefined") return;
    const report = (window as Window & {
      __GTD_CHARACTER_LOCOMOTION_REPORT__?: () => unknown;
    }).__GTD_CHARACTER_LOCOMOTION_REPORT__?.();
    if (!report) return;
    const data = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gtd-char001-l1-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  useEffect(() => {
    const host = canvas.current;
    if (!host || !loaded) return;
    let lastPointerType = "mouse";
    const rememberPointer = (event: PointerEvent) => {
      lastPointerType = event.pointerType;
    };
    const requestLock = () => {
      // Touch taps never acquire desktop pointer lock.
      if (lastPointerType === "mouse" && mode === "keyboard" && document.pointerLockElement !== host) {
        void host.requestPointerLock?.();
      }
    };
    const mouseLook = (event: MouseEvent) => {
      if (document.pointerLockElement !== host || paused) return;
      // Desktop look slider remains independent of the mobile camera slider.
      const mouseGain = Math.max(0.2, Math.min(2, settings.sensitivity / 50));
      bridge.command({
        type: "look",
        x: Math.max(-1, Math.min(1, (event.movementX / 18) * mouseGain)),
        y: Math.max(-1, Math.min(1, (event.movementY / 18) * mouseGain)) *
          (settings.invertY ? -1 : 1),
      });
      requestAnimationFrame(() => bridge.command({ type: "look", x: 0, y: 0 }));
    };
    host.addEventListener("pointerdown", rememberPointer);
    host.addEventListener("click", requestLock);
    document.addEventListener("mousemove", mouseLook);
    return () => {
      host.removeEventListener("pointerdown", rememberPointer);
      host.removeEventListener("click", requestLock);
      document.removeEventListener("mousemove", mouseLook);
      if (document.pointerLockElement === host) document.exitPointerLock?.();
    };
  }, [bridge, loaded, mode, paused, settings.sensitivity, settings.invertY]);
  // One finger swipes the visible world to orbit Voight, while a second
  // finger can operate movement or action controls independently.
  useEffect(() => {
    const host = canvas.current;
    if (!host || !loaded || paused) return;
    return attachCanvasTouchCameraLook(host, (command) => bridge.command(command));
  }, [bridge, loaded, paused]);

  useEffect(() => {
    const held = new Set<string>();
    const actions: Record<string, GameAction> = {
      KeyE: "interact",
      KeyF: "vehicle",
      Space: "jump",
      ShiftLeft: "sprint",
      ShiftRight: "sprint",
      KeyC: "combat",
      KeyQ: "context",
    };
    const movement = (source: "keyboard" | "keyboard-reset" = "keyboard") =>
      bridge.command({
        type: "move",
        source,
        x:
          Number(held.has("ArrowRight") || held.has("KeyD")) -
          Number(held.has("ArrowLeft") || held.has("KeyA")),
        y:
          Number(held.has("ArrowDown") || held.has("KeyS")) -
          Number(held.has("ArrowUp") || held.has("KeyW")),
      });
    const keydown = (event: KeyboardEvent) => {
      if (event.code === "Escape") {
        event.preventDefault();
        if (loaded && !event.repeat) {
          setPaused((value) => !value);
          setPanel("pause");
        }
        return;
      }
      if (!loaded || paused) return;
      if (event.code === "Tab" && !event.repeat) {
        event.preventDefault();
        void navigate({ to: "/world" });
        return;
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) {
        event.preventDefault();
        held.add(event.code);
        movement();
      }
      const value = actions[event.code];
      if (value) {
        event.preventDefault();
        if (!event.repeat) {
          bridge.command({ type: "action", action: value, pressed: true });
          setLastInput(value.toUpperCase());
          setInteraction("");
        }
      }
    };
    const keyup = (event: KeyboardEvent) => {
      held.delete(event.code);
      movement();
      const value = actions[event.code];
      if (value) bridge.command({ type: "action", action: value, pressed: false });
    };
    const release = () => {
      held.clear();
      movement("keyboard-reset");
      Object.values(actions).forEach((value) =>
        bridge.command({ type: "action", action: value, pressed: false }),
      );
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", release);
    return () => {
      release();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", release);
    };
  }, [bridge, loaded, paused, navigate]);
  useEffect(() => {
    if (paused) bridge.pause();
    else if (loaded) bridge.resume();
  }, [bridge, paused, loaded]);
  const touch = mode === "touch" || !settings.autoHide;
  return (
    <main
      className={`game-shell game-viewport ${settings.reducedMotion ? "motion-reduced" : ""} ${settings.contrast ? "high-contrast" : ""} ${settings.textSize === "Large" ? "large-interface" : ""}`}
    >
      <Scene game />
      <GameCanvasHost ref={canvas} />
      {!loaded && (
        <div className="runtime-badge">
          <strong>MERIDIA // RUNTIME</strong>
          <div className="system-label">{runtimeDetail}</div>
          <div className="system-label text-system" aria-live="polite">
            INPUT // {lastInput}
          </div>
        </div>
      )}
      {loaded && settings.hud && (
        <GameHud
          snapshot={snapshot}
          context={context}
          mode={touch ? "touch" : mode}
          interaction={interaction}
          pause={() => {
            setPaused(true);
            setPanel("pause");
          }}
          showObjective={settings.objective}
          setMeridianTime={(minuteOfDay) =>
            bridge.command({ type: "set-meridian-time", minuteOfDay })
          }
          setMeridianTimeScale={(scale) =>
            bridge.command({ type: "set-meridian-time-scale", scale })
          }
        />
      )}
      {loaded && !settings.hud && (
        <Button
          variant="control"
          className="absolute top-5 right-5"
          aria-label="Pause menu"
          onClick={() => setPaused(true)}
        >
          II
        </Button>
      )}
      {loaded && touch && !paused && (
        <TouchControls
          settings={settings}
          send={(command) => bridge.command(command)}
          onAction={action}
        />
      )}
      {loaded && !touch && settings.desktopControls && !paused && (
        <DesktopControls
          send={(command) => bridge.command(command)}
          onAction={action}
        />
      )}
      {!loaded && (
        <BootstrapOverlay
          entries={checklist}
          error={bootstrapError}
          onDownloadDiagnostics={trialEnabled && bootstrapError
            ? () => downloadCharacterTrialEvidence(bootstrapError, checklist, trialBrowserErrors.current)
            : undefined}
        />
      )}
      {paused && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-label={
            panel === "pause"
              ? "Pause menu"
              : panel === "objectives"
                ? "Objectives"
                : panel === "settings"
                  ? "Settings"
                  : panel === "locomotion"
                    ? "Character locomotion trial"
                    : "Save and load"
          }
        >
          <div className={panel === "settings" || panel === "locomotion"
              ? "overlay-content game-settings-dialog max-h-[90vh] overflow-y-auto" : "overlay-content"}>
            <div className="flex justify-between items-center">
              <span className="system-label text-primary">SOUTH WARD // FIRST LIGHT // SESSION PAUSED</span>
              <Button
                variant="control"
                aria-label="Close pause menu"
                onClick={() => setPaused(false)}
              >
                <X />
              </Button>
            </div>
            <h1 className="overlay-title">
              {panel === "pause"
                ? "PAUSED."
                : panel === "objectives"
                  ? "OBJECTIVES."
                  : panel === "settings"
                    ? "SETTINGS."
                    : panel === "locomotion"
                      ? "LOCOMOTION TRIAL."
                      : "SAVE / LOAD."}
            </h1>
            {panel === "pause" ? (
              <nav className="pause-list" aria-label="Pause actions">
                <Button autoFocus variant="menu" onClick={() => setPaused(false)}>
                  Resume <ArrowRight />
                </Button>
                <Button variant="menu" asChild>
                  <Link to="/world">
                    Map <ArrowRight />
                  </Link>
                </Button>
                <Button variant="menu" onClick={() => setPanel("objectives")}>
                  Objectives <ArrowRight />
                </Button>
                <Button variant="menu" onClick={() => setPanel("settings")}>
                  Settings <ArrowRight />
                </Button>
                {trialEnabled && (
                  <Button variant="menu" onClick={() => setPanel("locomotion")}>
                    Character locomotion (L1) <ArrowRight />
                  </Button>
                )}
                <Button variant="menu" onClick={() => setPanel("save")}>
                  Save / Load <ArrowRight />
                </Button>
                <Button variant="menu" asChild>
                  <Link to="/">
                    Return to Main Menu <ArrowRight />
                  </Link>
                </Button>
              </nav>
            ) : panel === "settings" ? (
              <>
                <SettingsEditor
                  initialSettings={settings}
                  inGame
                  onApply={(next) => {
                    save(next);
                    // The existing Babylon scene remains mounted. The settings
                    // effect updates its hardware scale; resume uses the same
                    // runtime, camera, imports, physics and active position.
                    setPanel("pause");
                    setPaused(false);
                  }}
                />
                <Button variant="menu" className="mt-3" onClick={() => setPanel("pause")}>
                  Back to pause menu <ArrowRight />
                </Button>
              </>
            ) : panel === "locomotion" && trialEnabled ? (
              <div className="space-y-4" data-testid="gtd-l1-tuning">
                <p className="text-sm text-muted-foreground">
                  Experimental travel-facing movement. Changes apply to the same
                  running scene, without reloading. Values require in-game acceptance.
                </p>
                <label className="block text-sm">
                  <span className="flex justify-between"><span>Turn speed</span>
                    <strong>{headingSettings.turnRateDeg}°/s</strong></span>
                  <input aria-label="Turn speed" type="range" min="90" max="900" step="15"
                    className="w-full" value={headingSettings.turnRateDeg}
                    onChange={(event) => setHeadingSettings((old) => normalizeHeadingSettings({
                      ...old, turnRateDeg: Number(event.target.value),
                    }))} />
                </label>
                <label className="block text-sm">
                  <span className="flex justify-between"><span>Movement while turning</span>
                    <strong>{Math.round(headingSettings.turnMobility * 100)}%</strong></span>
                  <input aria-label="Movement while turning" type="range" min="0" max="100" step="5"
                    className="w-full" value={Math.round(headingSettings.turnMobility * 100)}
                    onChange={(event) => setHeadingSettings((old) => normalizeHeadingSettings({
                      ...old, turnMobility: Number(event.target.value) / 100,
                    }))} />
                </label>
                <label className="block text-sm">
                  <span className="block mb-1">Rig forward-axis correction</span>
                  <select aria-label="Model forward-axis correction"
                    className="w-full bg-background border border-border rounded-md p-2"
                    value={headingSettings.visualForwardDeg}
                    onChange={(event) => setHeadingSettings((old) => normalizeHeadingSettings({
                      ...old, visualForwardDeg: Number(event.target.value),
                    }))}>
                    <option value={-90}>-90°</option>
                    <option value={0}>0° (corrected trial candidate)</option>
                    <option value={90}>+90° (previous misalignment)</option>
                    <option value={180}>180°</option>
                  </select>
                </label>
                <p className="text-xs text-muted-foreground">
                  Test ↑, ←, → and ↓. Down turns 180° rather than walking
                  backward. Foot IK and stride calibration are not part of L1.
                </p>
                <Button variant="menu" onClick={() => setHeadingSettings(DEFAULT_TRAVEL_HEADING)}>
                  Reset trial settings <ArrowRight />
                </Button>
                <Button variant="menu" onClick={downloadLocomotionTrace}>
                  Download movement trace (JSON) <ArrowRight />
                </Button>
                <Button variant="menu" onClick={() => { setPanel("pause"); setPaused(false); }}>
                  Apply &amp; Resume <ArrowRight />
                </Button>
              </div>
            ) : (
              <>
                <div className="objective">
                  <span className="system-label text-primary">
                    {panel === "objectives" ? "CHAPTER 01 // THE LINE" : "NO SAVE DATA"}
                  </span>
                  <h2>
                    {panel === "objectives" ? snapshot.objective : "Save runtime not connected"}
                  </h2>
                  <p>
                    {panel === "objectives"
                      ? "Mission preview · Meridian Central"
                      : "Save and load become available with the game engine."}
                  </p>
                </div>
                <Button variant="menu" className="mt-6" onClick={() => setPanel("pause")}>
                  Back to pause menu <ArrowRight />
                </Button>
              </>
            )}
            <div className="overlay-note">
              VOIGHT // PROTECTOR
              <br />
              BUILD 0.3.0 · MERIDIA FIRST LIGHT
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
