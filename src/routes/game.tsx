import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Scene, pageHead } from "@/ui/menus/shell";
import { RuntimeBridge } from "@/game/bridge/runtime-bridge";
import { useGameSnapshot } from "@/game/bridge/use-game-bridge";
import { useInputMode } from "@/game/input/use-input-mode";
import { useSettings } from "@/ui/menus/settings-state";
import { GameHud } from "@/ui/hud/game-hud";
import { TouchControls } from "@/ui/hud/touch-controls";
import { BootstrapOverlay } from "@/ui/menus/bootstrap";
import type { GameAction, HudContext } from "@/game/core/types";
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
  const { settings } = useSettings();
  const [context, setContext] = useState<HudContext>("walking");
  const [paused, setPaused] = useState(false);
  const [panel, setPanel] = useState<"pause" | "objectives" | "save">("pause");
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [interaction, setInteraction] = useState("Observe Meridian City");
  const [lastInput, setLastInput] = useState("STANDBY");
  const changeContext = (value: HudContext) => {
    setContext(value);
    bridge.command({ type: "set-context", context: value });
    setInteraction(
      value === "driving"
        ? "Exit vehicle · runtime not connected"
        : value === "combat"
          ? "Focus · runtime not connected"
          : "Observe Meridian City",
    );
  };
  const action = (value: GameAction) => {
    setLastInput(value.toUpperCase());
    setInteraction(
      `${value === "vehicle" ? "Vehicle" : value.charAt(0).toUpperCase() + value.slice(1)} · runtime not connected`,
    );
  };
  useEffect(() => {
    const host = canvas.current;
    if (host) void bridge.bootstrap(host);
    const stages = [
      setTimeout(() => setProgress(34), 180),
      setTimeout(() => setProgress(72), 480),
      setTimeout(() => setProgress(100), 800),
      setTimeout(() => {
        setLoaded(true);
        bridge.start();
      }, 1150),
    ];
    const unsubscribe = bridge.subscribeEvent((event) => {
      if (event.type === "interaction") setInteraction(event.label ?? "");
    });
    return () => {
      stages.forEach(clearTimeout);
      unsubscribe();
      bridge.destroy();
    };
  }, [bridge]);
  useEffect(() => {
    bridge.command({ type: "input-mode", mode });
  }, [bridge, mode]);
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
    const movement = () =>
      bridge.command({
        type: "move",
        x: Number(held.has("KeyD")) - Number(held.has("KeyA")),
        y: Number(held.has("KeyS")) - Number(held.has("KeyW")),
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
        setPaused(true);
        setPanel("objectives");
        return;
      }
      if (["KeyW", "KeyA", "KeyS", "KeyD"].includes(event.code)) {
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
          setInteraction(
            `${value === "vehicle" ? "Vehicle" : value.charAt(0).toUpperCase() + value.slice(1)} · runtime not connected`,
          );
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
      movement();
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
  }, [bridge, loaded, paused]);
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
      <canvas
        ref={canvas}
        className="canvas-host"
        aria-label="GameCanvasHost — awaiting 3D engine"
      />
      <div className="runtime-badge">
        <strong>MERIDIAN CITY // FOUNDATION</strong>
        <div className="system-label">3D RUNTIME NOT ATTACHED</div>
        <div className="system-label text-system" aria-live="polite">
          INPUT // {lastInput}
        </div>
      </div>
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
          setContext={changeContext}
          showObjective={settings.objective}
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
      {!loaded && <BootstrapOverlay progress={progress} />}
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
                : "Save and load"
          }
        >
          <div className="overlay-content">
            <div className="flex justify-between items-center">
              <span className="system-label text-primary">MERIDIAN CENTRAL // SESSION PAUSED</span>
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
                <Button variant="menu" asChild>
                  <Link to="/settings">
                    Settings <ArrowRight />
                  </Link>
                </Button>
                <Button variant="menu" onClick={() => setPanel("save")}>
                  Save / Load <ArrowRight />
                </Button>
                <Button variant="menu" asChild>
                  <Link to="/">
                    Return to Main Menu <ArrowRight />
                  </Link>
                </Button>
              </nav>
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
              BUILD 0.1.0 · PRESENTATION SHELL
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
