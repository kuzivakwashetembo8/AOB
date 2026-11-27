import {PistolIcon009} from "./pistol-icon-009";
import {useEffect,useState} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Car,
  Crosshair,
  Footprints,
  Hand,
  HandFist,
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
  { action: "combat", label: "Punch", keyHint: "C", icon: HandFist },
  { action: "vehicle", label: "Enter / exit vehicle", keyHint: "F", icon: Car },
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
  driving = false, flying = false,
  passenger = false,
  armed = false,
  combatEnabled = true,
}: {
  send: Send;
  onAction: (action: GameAction) => void;
  driving?: boolean; flying?: boolean; canEnterVehicle?: boolean; canExitVehicle?: boolean;
  passenger?: boolean;
  armed?: boolean;
  combatEnabled?: boolean;
  elevator?:{direction:"up"|"down";label:string;onClick:()=>void}|undefined;
}) {
  const [lowCrouch,setLowCrouch]=useState(false);
  useEffect(()=>{if(!armed)setLowCrouch(false);},[armed]);
  return (
    <div className="desktop-controls" aria-label="Desktop game controls">
      {passenger&&<div className="desktop-movement-pad" aria-label="Manual Sedan free driving controls">
        <div/>
        <MovementButton x={0} y={-1} label="Hold to accelerate Sedan" keyHint="↑ / W"
          icon={ArrowUp} send={send}/>
        <div/>
        <MovementButton x={-1} y={0} label="Steer Sedan left anywhere" keyHint="← / A"
          icon={ArrowLeft} send={send}/>
        <MovementButton x={0} y={1} label="Hold to brake Sedan then reverse" keyHint="↓ / S"
          icon={ArrowDown} send={send}/>
        <MovementButton x={1} y={0} label="Steer Sedan right anywhere" keyHint="→ / D"
          icon={ArrowRight} send={send}/>
      </div>}
      {!passenger&&<div className="desktop-movement-pad" aria-label="Movement controls">
        <div />
        <MovementButton x={0} y={-1} label="Move forward" keyHint="↑ / W" icon={ArrowUp} send={send} />
        <div />
        <MovementButton x={-1} y={0} label="Move left" keyHint="← / A" icon={ArrowLeft} send={send} />
        <MovementButton x={0} y={1} label="Move back" keyHint="↓ / S" icon={ArrowDown} send={send} />
        <MovementButton x={1} y={0} label="Move right" keyHint="→ / D" icon={ArrowRight} send={send} />
      </div>}

      <div className="desktop-action-pad" aria-label="Action controls">
        {actionSpecs.filter(({action}) =>
          driving ? false :
          flying ? ["sprint","jump","descend"].includes(action) :
          ["jump","sprint","combat"].includes(action)
        ).filter(a=>a.action!=="combat"||combatEnabled)
          .flatMap(a=>a.action==="sprint"&&armed&&!driving&&!flying?[a,{action:"crouch" as GameAction,label:"Low crouch",keyHint:"LOW",icon:ArrowDown}]:[a])
          .map(({ action, label, keyHint, icon: BaseIcon }) => {
          const Icon=action==="combat"&&armed?PistolIcon009:BaseIcon;
          const actualLabel=action==="combat"?(armed?"Fire pistol":"Punch"):label;
          return (
          <Button
            variant="control"
            className={`desktop-control-button gtd-uniform-action gtd-action-${action}`}
            aria-label={`${actualLabel} (${keyHint})`}
            data-tooltip={`${actualLabel} · ${keyHint}`}
            aria-pressed={action==="crouch"?lowCrouch:undefined}
            key={action}
            onPointerDown={(event) => {
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              if(action==="crouch"){
                const next=!lowCrouch;setLowCrouch(next);
                send({ type: "action", action, pressed: next });
              }else send({ type: "action", action, pressed: true });
              onAction(action);
            }}
            onPointerUp={() => {if(action!=="crouch")send({ type: "action", action, pressed: false });}}
            onPointerCancel={() => {if(action!=="crouch")send({ type: "action", action, pressed: false });}}
            onLostPointerCapture={() => {if(action!=="crouch")send({ type: "action", action, pressed: false });}}
          >
            <Icon size={18} />
          </Button>
        );})}

      </div>
    </div>
  );
}
