import { useRef, type CSSProperties, type PointerEvent } from "react";
import { Hand, ArrowUp, Crosshair, Footprints, Car, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameAction, GameCommand } from "@/game/core/types";
import type { Settings } from "@/ui/menus/settings-state";
type Send = (command: GameCommand) => void;
export function Joystick({ send }: { send: Send }) {
  const thumb = useRef<HTMLDivElement>(null);
  const active = useRef<number | null>(null);
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (active.current !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = rect.width * 0.32;
    let x = (event.clientX - rect.left - rect.width / 2) / radius;
    let y = (event.clientY - rect.top - rect.height / 2) / radius;
    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    if (thumb.current)
      thumb.current.style.transform = `translate(${x * radius}px, ${y * radius}px)`;
    send({ type: "move", x, y, source: "touch-joystick" });
  };
  const release = (event: PointerEvent<HTMLDivElement>) => {
    if (active.current !== event.pointerId) return;
    active.current = null;
    if (thumb.current) thumb.current.style.transform = "translate(0, 0)";
    send({ type: "move", x: 0, y: 0, source: "touch-joystick" });
  };
  return (
    <div
      className="joystick joystick-left"
      role="group"
      aria-label="Movement joystick"
      onPointerDown={(event) => {
        if (active.current !== null) return;
        active.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        move(event);
      }}
      onPointerMove={move}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
    >
      <div ref={thumb} className="joystick-thumb" />
      <span className="joystick-label">MOVE</span>
    </div>
  );
}
const actions: Array<{ action: GameAction; label: string; icon: typeof Hand }> = [
  { action: "interact", label: "Interact", icon: Hand },
  { action: "jump", label: "Jump", icon: ArrowUp },
  { action: "combat", label: "Combat", icon: Crosshair },
  { action: "sprint", label: "Sprint", icon: Footprints },
  { action: "vehicle", label: "Enter or exit vehicle", icon: Car },
  { action: "context", label: "Context action", icon: Zap },
];
export function TouchControls({
  send,
  settings,
  onAction,
}: {
  send: Send;
  settings: Settings;
  onAction: (action: GameAction) => void;
}) {
  const style = {
    "--control-opacity": settings.opacity / 100,
    "--control-scale": settings.scale / 100,
    "--joystick-size": `${settings.joystickSize}px`,
  } as CSSProperties;
  return (
    <div
      className={`touch-controls positions-${settings.position.toLowerCase()} ${settings.handedness === "Left-handed" ? "left-handed" : ""}`}
      style={style}
    >
      <Joystick send={send} />
      <div className="touch-actions">
        {actions.map(({ action, label, icon: Icon }) => (
          <Button
            variant="control"
            aria-label={label}
            title={label}
            key={action}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              send({ type: "action", action, pressed: true });
              onAction(action);
              if (settings.haptics) navigator.vibrate?.(12);
            }}
            onPointerUp={() => send({ type: "action", action, pressed: false })}
            onPointerCancel={() => send({ type: "action", action, pressed: false })}
            onLostPointerCapture={() => send({ type: "action", action, pressed: false })}
            onClick={(event) => {
              if (event.detail === 0) {
                send({ type: "action", action, pressed: true });
                onAction(action);
                send({ type: "action", action, pressed: false });
              }
            }}
          >
            <Icon size={19} />
          </Button>
        ))}
      </div>
    </div>
  );
}
