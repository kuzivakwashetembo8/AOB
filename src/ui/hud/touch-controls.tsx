import { useEffect, useRef, type CSSProperties, type PointerEvent } from "react";
import { Hand, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Crosshair, Footprints, Car, Zap } from "lucide-react";
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
/** NH-OPT2 Stages 2/3/4: hold-only brake/accelerator and one-shot
 * legal next-junction turning requests. Reuse multi-pointer holds.
 * On release, blur, or page-hide, no traffic pedal request remains active. */
export function SedanPassengerPedals({send,haptics}:{send:Send;haptics:boolean}){
  const holds=useRef(new DrivingArrowHolds());
  const sendRef=useRef(send);sendRef.current=send;
  const sendPedals=()=>{
    const next=holds.current.intent();
    // When two fingers hold Gas and Brake, Brake MUST win: the generic
    // arrow helper otherwise resolves opposite directions to neutral.
    sendRef.current({type:"move",x:next.x,
      y:holds.current.pressed("down")?1:next.y,source:"touch-arrows"});
  };
  useEffect(()=>{
    const reset=()=>{holds.current.reset();sendRef.current({
      type:"move",x:0,y:0,source:"touch-arrows",
    });};
    const hidden=()=>{if(document.hidden)reset();};
    window.addEventListener("blur",reset);
    document.addEventListener("visibilitychange",hidden);
    return()=>{
      window.removeEventListener("blur",reset);
      document.removeEventListener("visibilitychange",hidden);
      reset();
    };
  },[]);
  const release=(event:PointerEvent<HTMLButtonElement>)=>{
    if(!holds.current.has(event.pointerId))return;
    event.preventDefault();
    holds.current.release(event.pointerId);
    sendPedals();
  };
  const begin=(event:PointerEvent<HTMLButtonElement>,direction:DrivingArrow)=>{
    event.preventDefault();event.stopPropagation();
    if(holds.current.has(event.pointerId))return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    holds.current.press(event.pointerId,direction);
    sendPedals();
    if(haptics)navigator.vibrate?.(12);
  };
  return (
    <div className="driving-arrow-pad" role="group" aria-label="Sedan free steering and driving controls">
      <div className="driving-arrows-steer" role="group" aria-label="Sedan continuous steering">
        <button type="button" className="driving-arrow-button" data-direction="left"
          data-testid="nh-opt2-sedan-left-turn"
          aria-label="Hold to steer Sedan left anywhere"
          onPointerDown={event=>begin(event,"left")}
          onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
          <ArrowLeft aria-hidden="true" size={30}/>
          <span className="text-[10px]">LEFT</span>
        </button>
        <button type="button" className="driving-arrow-button" data-direction="right"
          data-testid="nh-opt2-sedan-right-turn"
          aria-label="Hold to steer Sedan right anywhere"
          onPointerDown={event=>begin(event,"right")}
          onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
          <ArrowRight aria-hidden="true" size={30}/>
          <span className="text-[10px]">RIGHT</span>
        </button>
      </div>
      <div className="driving-arrows-throttle">
        <button type="button" className="driving-arrow-button"
          data-testid="nh-opt2-sedan-accelerator" data-direction="up"
          aria-label="Hold to accelerate Sedan forward"
          onPointerDown={event=>begin(event,"up")}
          onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
          <ArrowUp aria-hidden="true" size={30}/>
          <span className="text-[10px]">GAS</span>
        </button>
        <button type="button" className="driving-arrow-button"
          data-testid="nh-opt2-sedan-brake" data-direction="down"
          aria-label="Hold to brake Sedan then reverse"
          onPointerDown={event=>begin(event,"down")}
          onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
          <ArrowDown aria-hidden="true" size={30}/>
          <span className="text-[10px]">BRAKE</span>
        </button>
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
// OPT-03/04: only implemented actions, selected from actual locomotion/capabilities.
const actions: Array<{ action: GameAction; label: string; icon: typeof Hand }> = [
  { action: "jump", label: "Jump or ascend", icon: ArrowUp },
  { action: "sprint", label: "Sprint or speed boost", icon: Footprints },
  { action: "vehicle", label: "Enter or exit vehicle", icon: Car },
  { action: "descend", label: "Descend while flying", icon: ArrowDown },
];
export function visibleTouchActions(driving:boolean,flying=false,canEnterVehicle=false,canExitVehicle=true){
  if(driving)return canExitVehicle?actions.filter(a=>a.action==="vehicle"):[];
  if(flying)return actions.filter(a=>["sprint","jump","descend"].includes(a.action));
  return actions.filter(a=>["sprint","jump"].includes(a.action)||
    (a.action==="vehicle"&&canEnterVehicle));
}
export function TouchControls({
  send,
  settings,
  onAction,
  driving = false,
  flying = false,
  canEnterVehicle = false,
  canExitVehicle = true,
  passenger = false,
  elevator,
}: {
  send: Send;
  settings: Settings;
  onAction: (action: GameAction) => void;
  driving?: boolean;
  flying?: boolean;
  canEnterVehicle?: boolean;
  canExitVehicle?: boolean;
  passenger?: boolean;
  elevator?:{direction:"up"|"down";label:string;onClick:()=>void}|undefined;
}) {
  const style = {
    "--control-opacity": settings.opacity / 100,
    "--control-scale": settings.scale / 100,
    "--joystick-size": `${settings.joystickSize}px`,
  } as CSSProperties;
  const arrowMode = driving && !passenger && settings.drivingTouchLayout === "arrows";
  return (
    <div
      className={`touch-controls ${arrowMode ? "driving-arrow-mode" : ""} ${driving ? "gtd-driving" : flying ? "gtd-flying" : "gtd-walking"} positions-${settings.position.toLowerCase()} ${!arrowMode && settings.handedness === "Left-handed" ? "left-handed" : ""}`}
      style={style}
    >
      {passenger ? <SedanPassengerPedals send={send} haptics={settings.haptics}/> : arrowMode ? <DrivingArrowControls send={send} haptics={settings.haptics}/> : <Joystick send={send} />}
      <div className="touch-actions">
        {visibleTouchActions(driving,flying,canEnterVehicle,canExitVehicle).map(({ action, label, icon: Icon }) => (
          <Button
            variant="control"
            className={`gtd-uniform-action gtd-action-${action}`}
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
        {elevator&&<Button variant="control"
          className="gtd-uniform-action gtd-action-elevator"
          data-testid="poi005-lift-touch"
          aria-label={elevator.label} title={elevator.label}
          onClick={elevator.onClick}>
            {elevator.direction==="up"?<ArrowUp size={19}/>:<ArrowDown size={19}/>}
          </Button>}
      </div>
    </div>
  );
}
