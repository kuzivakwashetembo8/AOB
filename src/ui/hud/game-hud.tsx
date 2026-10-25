import { useState } from "react";
import { Crosshair, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameSnapshot, HudContext, InputMode } from "@/game/core/types";

function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

export function GameHud({
  snapshot,
  context,
  mode,
  interaction,
  pause,
  showObjective,
  setMeridianTime,
  setMeridianTimeScale,
}: {
  snapshot: GameSnapshot;
  context: HudContext;
  mode: InputMode;
  interaction: string;
  pause: () => void;
  showObjective: boolean;
  setMeridianTime: (minuteOfDay: number) => void;
  setMeridianTimeScale: (scale: number) => void;
}) {
  const [timeControlsOpen, setTimeControlsOpen] = useState(false);
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
          <div className="relative">
            <button
              type="button"
              className="rounded border border-white/20 bg-black/55 px-3 py-2 text-left backdrop-blur-sm"
              aria-expanded={timeControlsOpen}
              aria-label="Meridian time development controls"
              onClick={() => setTimeControlsOpen((value) => !value)}
            >
              <span className="system-label text-white block font-semibold tracking-wide"
                aria-label="Current Meridian location">
                {snapshot.location}
              </span>
              <span className="system-label text-primary block mt-1">
                MERIDIAN // {snapshot.meridianTime}
              </span>
              <span className="system-label block opacity-70">
                {snapshot.interiorState.toUpperCase()} · {snapshot.meridianTimeScale}×
              </span>
            </button>

            {timeControlsOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded border border-white/20 bg-black/90 p-3 backdrop-blur-md">
                <div className="system-label text-primary mb-2">
                  DEV TIME CONTROL
                </div>
                <input
                  type="time"
                  value={snapshot.meridianTime}
                  aria-label="Set Meridian time"
                  onChange={(event) => {
                    const minutes = parseTime(event.target.value);
                    if (minutes !== null) setMeridianTime(minutes);
                  }}
                  className="w-full rounded border border-white/20 bg-black/60 px-2 py-1 text-sm text-white"
                />
                <div className="mt-2 grid grid-cols-4 gap-1">
                  {[
                    ["Dawn", 6 * 60],
                    ["Noon", 12 * 60],
                    ["Dusk", 18 * 60],
                    ["Night", 0],
                  ].map(([label, minutes]) => (
                    <button
                      key={String(label)}
                      type="button"
                      className="rounded border border-white/15 px-1 py-1 text-[10px] uppercase tracking-wide"
                      onClick={() => setMeridianTime(Number(minutes))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="system-label mt-3 mb-1 opacity-70">CYCLE SPEED</div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    ["Pause", 0],
                    ["48m", 1],
                    ["24m", 2],
                    ["6m", 8],
                  ].map(([label, scale]) => (
                    <button
                      key={String(label)}
                      type="button"
                      className={`rounded border px-1 py-1 text-[10px] uppercase tracking-wide ${
                        snapshot.meridianTimeScale === Number(scale)
                          ? "border-primary text-primary"
                          : "border-white/15"
                      }`}
                      onClick={() => setMeridianTimeScale(Number(scale))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {snapshot.flying && (
            <span className="system-label self-center rounded border border-white/30 bg-black/60 px-2 py-1 text-white">
              FLIGHT / SURVEY
            </span>
          )}
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

          <Button
            variant="control"
            title="Pause menu"
            aria-label="Pause menu"
            onClick={pause}
          >
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
            <div
              style={{
                width: `${Math.max(0, Math.min(100, snapshot.health))}%`,
              }}
            />
          </div>
        </div>
      )}

      {context === "combat" && (
        <Crosshair className="crosshair-icon" aria-hidden="true" />
      )}
    </div>
  );
}
