import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import { Hand, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Crosshair, Footprints, Car, Zap, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameAction, GameCommand } from "@/game/core/types";
import type { Settings } from "@/ui/menus/settings-state";
import { DrivingArrowHolds, type DrivingArrow } from "./driving-arrow-holds";
type Send = (command: GameCommand) => void;
const arrows = [
  { direction: "left", label: "Steer left", Icon: ArrowLeft },
  { direction: "right", label: "Steer right", Icon: ArrowRight },
  { direction: "up", label: "Accelerate", Icon: ArrowUp },
  { direction: "down", label: "Brake / reverse", Icon: ArrowDown },
] as const;
export function DrivingArrowControls({ send, haptics }: { send: Send; haptics: boolean }) {
  const holds = useRef(new DrivingArrowHolds());
  const sendRef = useRef(send);
  sendRef.current = send;
  const sendIntent = (value: {x: number; y: number}) => {
    sendRef.current({type:"move",...value,source:"touch-arrows"});
  };
  useEffect(() => {
    const reset = () => sendRef.current({
      type:"move", ...holds.current.reset(), source:"touch-arrows",
    });
    const hidden = () => { if (document.hidden) reset(); };
    window.addEventListener("blur",reset);
    document.addEventListener("visibilitychange",hidden);
    return () => {
      window.removeEventListener("blur",reset);
      document.removeEventListener("visibilitychange",hidden);
      reset();
    };
  }, []);
  const begin = (direction: DrivingArrow, event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (holds.current.has(event.pointerId)) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    sendIntent(holds.current.press(event.pointerId,direction));
    if (haptics) navigator.vibrate?.(12);
  };
  const release = (event: PointerEvent<HTMLButtonElement>) => {
    if (!holds.current.has(event.pointerId)) return;
    event.preventDefault();
    sendIntent(holds.current.release(event.pointerId));
  };
  return (
    <div className="driving-arrow-pad" role="group" aria-label="Driving arrow controls">
      <div className="driving-arrows-steer" role="group" aria-label="Steering arrows">
        {arrows.slice(0,2).map(({direction,label,Icon}) => (
          <button type="button" key={direction} className="driving-arrow-button"
            aria-label={label} data-direction={direction}
            onPointerDown={(e)=>begin(direction,e)}
            onPointerUp={release} onPointerCancel={release}
            onLostPointerCapture={release}>
            <Icon aria-hidden="true" size={30}/>
          </button>
        ))}
      </div>
      <div className="driving-arrows-throttle" role="group" aria-label="Throttle and brake arrows">
        {arrows.slice(2).map(({direction,label,Icon}) => (
          <button type="button" key={direction} className="driving-arrow-button"
            aria-label={label} data-direction={direction}
            onPointerDown={(e)=>begin(direction,e)}
            onPointerUp={release} onPointerCancel={release}
            onLostPointerCapture={release}>
            <Icon aria-hidden="true" size={30}/>
          </button>
        ))}
      </div>
    </div>
  );
}
export function Joystick({ send }: { send: Send }) {
  const thumb = useRef<HTMLDivElement>(null);
  const active = useRef<number | null>(null);
  const sendRef = useRef(send);
  sendRef.current = send;
  useEffect(() => {
    const reset = () => {
      if (active.current === null) return;
      active.current = null;
      if (thumb.current) thumb.current.style.transform = "translate(0, 0)";
      sendRef.current({ type:"move",x:0,y:0,source:"touch-joystick" });
    };
    const hidden = () => {if(document.hidden)reset();};
    window.addEventListener("blur",reset);
    document.addEventListener("visibilitychange",hidden);
    return () => {
      window.removeEventListener("blur",reset);
      document.removeEventListener("visibilitychange",hidden);
      reset();
    };
  }, []);
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
// Keep Enter/Exit accessible while driving; on-foot and flight-only actions
// must never obstruct the windshield or lower screen in either drive layout.
export const visibleTouchActions = (driving: boolean) =>
  driving ? actions.filter((entry) => entry.action === "vehicle") : actions;

const actions: Array<{ action: GameAction; label: string; icon: typeof Hand }> = [
  { action: "interact", label: "Interact", icon: Hand },
  { action: "jump", label: "Jump", icon: ArrowUp },
  { action: "combat", label: "Combat", icon: Crosshair },
  { action: "sprint", label: "Sprint", icon: Footprints },
  { action: "vehicle", label: "Enter or exit vehicle", icon: Car },
  { action: "fly", label: "Toggle flight mode", icon: Plane },
  { action: "descend", label: "Descend while flying (hold)", icon: ArrowDown },
  { action: "context", label: "Context action", icon: Zap },
];
export function TouchControls({
  send,
  settings,
  onAction,
  driving = false,
}: {
  send: Send;
  settings: Settings;
  onAction: (action: GameAction) => void;
  driving?: boolean;
}) {
  const style = {
    "--control-opacity": settings.opacity / 100,
    "--control-scale": settings.scale / 100,
    "--joystick-size": `${settings.joystickSize}px`,
  } as CSSProperties;
  const arrowMode = driving && settings.drivingTouchLayout === "arrows";
  return (
    <div
      className={`touch-controls ${arrowMode ? "driving-arrow-mode" : ""} positions-${settings.position.toLowerCase()} ${!arrowMode && settings.handedness === "Left-handed" ? "left-handed" : ""}`}
      style={style}
    >
      {arrowMode ? <DrivingArrowControls send={send} haptics={settings.haptics}/> : <Joystick send={send} />}
      <div className="touch-actions">
        {visibleTouchActions(driving).map(({ action, label, icon: Icon }) => (
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
