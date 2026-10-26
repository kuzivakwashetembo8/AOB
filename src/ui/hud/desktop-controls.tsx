import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Car,
  Plane,
  Crosshair,
  Footprints,
  Hand,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameAction, GameCommand } from "@/game/core/types";

type Send = (command: GameCommand) => void;

type ActionSpec = {
  action: GameAction;
  label: string;
  keyHint: string;
  icon: typeof Hand;
};

const actionSpecs: ActionSpec[] = [
  { action: "interact", label: "Interact", keyHint: "E", icon: Hand },
  { action: "jump", label: "Jump", keyHint: "SPACE", icon: ArrowUp },
  { action: "sprint", label: "Sprint", keyHint: "SHIFT", icon: Footprints },
  { action: "combat", label: "Aim / combat", keyHint: "C", icon: Crosshair },
  { action: "vehicle", label: "Enter / exit vehicle", keyHint: "F", icon: Car },
  { action: "fly", label: "Toggle flight", keyHint: "G", icon: Plane },
  { action: "descend", label: "Descend while flying", keyHint: "CTRL", icon: ArrowDown },
  { action: "context", label: "Context action", keyHint: "Q", icon: Zap },
];

function MovementButton({
  x,
  y,
  label,
  keyHint,
  icon: Icon,
  send,
}: {
  x: number;
  y: number;
  label: string;
  keyHint: string;
  icon: typeof ArrowUp;
  send: Send;
}) {
  const release = (source: "desktop-pointer-up" | "desktop-pointer-cancel" | "desktop-pointer-lost") =>
    send({ type: "move", x: 0, y: 0, source });
  return (
    <Button
      variant="control"
      className="desktop-control-button"
      aria-label={`${label} (${keyHint})`}
      data-tooltip={`${label} · ${keyHint}`}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        send({ type: "move", x, y, source: "desktop-pointer-down" });
      }}
      onPointerUp={() => release("desktop-pointer-up")}
      onPointerCancel={() => release("desktop-pointer-cancel")}
      onLostPointerCapture={() => release("desktop-pointer-lost")}
    >
      <Icon size={18} />
    </Button>
  );
}

export function DesktopControls({
  send,
  onAction,
  driving = false, flying = false, canEnterVehicle = false, canExitVehicle = true,
}: {
  send: Send;
  onAction: (action: GameAction) => void;
  driving?: boolean; flying?: boolean; canEnterVehicle?: boolean; canExitVehicle?: boolean;
}) {
  return (
    <div className="desktop-controls" aria-label="Desktop game controls">
      <div className="desktop-movement-pad" aria-label="Movement controls">
        <div />
        <MovementButton x={0} y={-1} label="Move forward" keyHint="↑ / W" icon={ArrowUp} send={send} />
        <div />
        <MovementButton x={-1} y={0} label="Move left" keyHint="← / A" icon={ArrowLeft} send={send} />
        <MovementButton x={0} y={1} label="Move back" keyHint="↓ / S" icon={ArrowDown} send={send} />
        <MovementButton x={1} y={0} label="Move right" keyHint="→ / D" icon={ArrowRight} send={send} />
      </div>

      <div className="desktop-action-pad" aria-label="Action controls">
        {actionSpecs.filter(({action}) =>
          driving ? action==="vehicle"&&canExitVehicle :
          flying ? ["sprint","jump","descend","fly"].includes(action) :
          ["sprint","jump","fly"].includes(action)||(action==="vehicle"&&canEnterVehicle)
        ).map(({ action, label, keyHint, icon: Icon }) => (
          <Button
            variant="control"
            className={`desktop-control-button gtd-priority-action gtd-action-${action}`}
            aria-label={`${label} (${keyHint})`}
            data-tooltip={`${label} · ${keyHint}`}
            key={action}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              send({ type: "action", action, pressed: true });
              onAction(action);
            }}
            onPointerUp={() => send({ type: "action", action, pressed: false })}
            onPointerCancel={() => send({ type: "action", action, pressed: false })}
            onLostPointerCapture={() => send({ type: "action", action, pressed: false })}
          >
            <Icon size={18} />
          </Button>
        ))}
      </div>
    </div>
  );
}
