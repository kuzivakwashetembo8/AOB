import { Pause, Shield, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameSnapshot, HudContext, InputMode } from "@/game/core/types";
import { Minimap } from "@/ui/map/minimap";
export function GameHud({
  snapshot,
  context,
  mode,
  interaction,
  pause,
  setContext,
  showObjective,
}: {
  snapshot: GameSnapshot;
  context: HudContext;
  mode: InputMode;
  interaction: string;
  pause: () => void;
  setContext: (context: HudContext) => void;
  showObjective: boolean;
}) {
  return (
    <div className={`hud ${mode === "touch" ? "touch" : ""}`}>
      <div className="hud-top">
        <div>
          {showObjective && (
            <div className="objective">
              <span className="system-label text-primary">CHAPTER 01 // THE LINE</span>
              <h2>
                {context === "driving"
                  ? "FOLLOW THE ROUTE"
                  : context === "combat"
                    ? "HOLD YOUR GROUND"
                    : "A CITY WORTH PROTECTING"}
              </h2>
              <p>
                {context === "driving"
                  ? "Navigation awaiting world runtime"
                  : context === "combat"
                    ? "Threat assessment awaiting runtime"
                    : snapshot.objective}
              </p>
            </div>
          )}
          <div className="hud-context" aria-label="HUD preview context">
            {(["walking", "driving", "combat"] as const).map((value) => (
              <Button
                variant="menu"
                aria-pressed={context === value}
                onClick={() => setContext(value)}
                key={value}
              >
                {value.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
        <div className="hud-top-right">
          <div>
            <span className="system-label">HEAT / {snapshot.heat}</span>
            <div className="heat-dots">
              {[1, 2, 3, 4, 5].map((level) => (
                <span
                  key={level}
                  className={`heat-dot ${level <= snapshot.heat ? "active" : ""}`}
                />
              ))}
            </div>
          </div>
          <Button variant="control" title="Pause menu" aria-label="Pause menu" onClick={pause}>
            <Pause size={18} />
          </Button>
        </div>
      </div>
      <div className="hud-prompt" aria-live="polite">
        {mode === "keyboard" && <span className="key">{context === "driving" ? "F" : "E"}</span>}
        {interaction}
      </div>
      <div className="hud-bottom">
        <div>
          <Minimap context={context} />
          <div className="status-bars" aria-label={`Health ${snapshot.health}`}>
            <div />
            <div />
          </div>
          <div className="hud-location">{snapshot.location.toUpperCase()}</div>
          <div className="system-label">
            <Shield size={9} className="inline mr-1" /> VOIGHT // PROTECTOR
          </div>
        </div>
        <div>
          {context === "driving" && (
            <div className="vehicle-state">
              <strong>{snapshot.speed.toString().padStart(3, "0")}</strong>
              <span className="system-label ml-2">KM/H</span>
              <div className="system-label">VEHICLE // NOT CONNECTED</div>
            </div>
          )}
          {context === "combat" && (
            <div className="vehicle-state">
              <Crosshair className="inline mr-2 text-destructive" />
              <span className="system-label">WEAPON // NOT CONNECTED</span>
            </div>
          )}
          <div className="system-label text-system mb-3">
            REPUTATION // {snapshot.reputation === 0 ? "UNESTABLISHED" : snapshot.reputation}
          </div>
          {mode !== "touch" && (
            <div className="desktop-prompts">
              <span>
                <span className="key">{mode === "controller" ? "A" : "E"}</span>Interact
              </span>
              <span>
                <span className="key">{mode === "controller" ? "Y" : "F"}</span>Vehicle
              </span>
              <span>
                <span className="key">{mode === "controller" ? "LS" : "SHIFT"}</span>Sprint
              </span>
              <span>
                <span className="key">{mode === "controller" ? "VIEW" : "TAB"}</span>Map
              </span>
            </div>
          )}
        </div>
      </div>
      {context === "combat" && <div className="crosshair" />}
    </div>
  );
}
