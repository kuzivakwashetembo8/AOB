import { Crosshair, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameSnapshot, HudContext, InputMode } from "@/game/core/types";

export function GameHud({
  snapshot,
  context,
  mode,
  interaction,
  pause,
  showObjective,
}: {
  snapshot: GameSnapshot;
  context: HudContext;
  mode: InputMode;
  interaction: string;
  pause: () => void;
  showObjective: boolean;
}) {
  const showHeat = snapshot.heat > 0;
  const showHealth = snapshot.health < 100;
  const showInteraction = interaction.trim().length > 0;

  return (
    <div className={`hud ${mode === "touch" ? "touch" : ""}`}>
      <div className="hud-top">
        {showObjective ? (
          <div className="objective">
            <span className="system-label text-primary">OBJECTIVE</span>
            <p>{snapshot.objective}</p>
          </div>
        ) : (
          <div />
        )}
        <div className="hud-top-right">
          {showHeat && (
            <div aria-label={`Heat ${snapshot.heat}`}>
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
          )}
          <Button variant="control" title="Pause menu" aria-label="Pause menu" onClick={pause}>
            <Pause size={18} />
          </Button>
        </div>
      </div>

      {showInteraction && (
        <div className="hud-prompt" aria-live="polite">
          {mode === "keyboard" && <span className="key">E</span>}
          {interaction}
        </div>
      )}

      {showHealth && (
        <div className="hud-health" aria-label={`Health ${snapshot.health}`}>
          <span className="system-label">HEALTH</span>
          <div className="health-track">
            <div style={{ width: `${Math.max(0, Math.min(100, snapshot.health))}%` }} />
          </div>
        </div>
      )}

      {context === "combat" && <Crosshair className="crosshair-icon" aria-hidden="true" />}
    </div>
  );
}
