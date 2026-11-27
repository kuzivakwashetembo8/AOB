import {PistolIcon009} from "./pistol-icon-009";
import {useEffect,useState} from "react";
import {ArrowDown} from "lucide-react";
import {Button} from "@/components/ui/button";
import type {GameAction,GameCommand} from "@/game/core/types";
import {Joystick,visibleTouchActions} from "./touch-controls";

type Send=(command:GameCommand)=>void;

export function DesktopControls({
  send,
  onAction,
  driving=false,
  flying=false,
  passenger=false,
  armed=false,
  combatEnabled=true,
}:{
  send:Send;
  onAction:(action:GameAction)=>void;
  driving?:boolean;
  flying?:boolean;
  passenger?:boolean;
  armed?:boolean;
  combatEnabled?:boolean;
  canEnterVehicle?:boolean;
  canExitVehicle?:boolean;
}){
  const [lowCrouch,setLowCrouch]=useState(false);
  useEffect(()=>{if(!armed)setLowCrouch(false);},[armed]);
  const visibleActions=visibleTouchActions(driving||passenger,flying)
    .filter(action=>action.action!=="combat"||combatEnabled)
    .flatMap(action=>action.action==="sprint"&&armed&&!driving&&!passenger&&!flying
      ?[action,{action:"crouch" as GameAction,label:"Low crouch",icon:ArrowDown}]
      :[action]);
  return(
    <div className={`touch-controls desktop-controls ${driving?"gtd-driving":flying?"gtd-flying":"gtd-walking"}`} aria-label="Desktop on-screen controls">
      <Joystick send={send}/>
      <div className="touch-actions" aria-label="Action controls">
        {visibleActions.map(({action,label,icon:BaseIcon})=>{
          const Icon=action==="combat"&&armed?PistolIcon009:BaseIcon;
          const actualLabel=action==="combat"?(armed?"Fire pistol":"Punch"):label;
          return(
            <Button
              variant="control"
              className={`gtd-uniform-action gtd-action-${action}`}
              aria-label={actualLabel}
              title={actualLabel}
              aria-pressed={action==="crouch"?lowCrouch:undefined}
              key={action}
              onPointerDown={event=>{
                event.preventDefault();
                event.currentTarget.setPointerCapture(event.pointerId);
                if(action==="crouch"){
                  const next=!lowCrouch;setLowCrouch(next);
                  send({type:"action",action,pressed:next});
                }else send({type:"action",action,pressed:true});
                onAction(action);
              }}
              onPointerUp={()=>{if(action!=="crouch")send({type:"action",action,pressed:false});}}
              onPointerCancel={()=>{if(action!=="crouch")send({type:"action",action,pressed:false});}}
              onLostPointerCapture={()=>{if(action!=="crouch")send({type:"action",action,pressed:false});}}
              onClick={event=>{
                if(event.detail===0){
                  if(action==="crouch"){
                    const next=!lowCrouch;setLowCrouch(next);
                    send({type:"action",action,pressed:next});
                  }else{
                    send({type:"action",action,pressed:true});
                    send({type:"action",action,pressed:false});
                  }
                  onAction(action);
                }
              }}
            >
              <Icon size={19}/>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
