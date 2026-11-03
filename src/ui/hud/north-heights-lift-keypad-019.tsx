import {X} from "lucide-react";

/** NH-LIFT-019 — shared transparent game-control keypad for ANY floor count.
 * The actual floor count comes from the procedural building metadata.
 */
export type LiftKeypadView019={
 buildingId:string;label:string;floors:number;currentFloor:number;
 available:boolean;moving:boolean;finch:boolean;
};
export function NorthHeightsLiftKeypad019({lift,onSelect,onClose}:{
 lift:LiftKeypadView019;onSelect:(floor:number)=>void;onClose:()=>void;
}){
 return <section className="absolute right-[5.5rem] top-1/2 z-[70] flex max-h-[74vh] w-[min(310px,72vw)] -translate-y-1/2 flex-col rounded-xl border border-white/30 bg-[#111c29]/90 p-3 text-white shadow-2xl backdrop-blur-md"
  aria-label="Elevator floor keypad" data-testid="nh019-lift-keypad">
  <div className="mb-2 flex items-center justify-between gap-2">
   <div>
    <div className="text-[10px] font-semibold tracking-widest text-white/60">SELECT FLOOR</div>
    <div className="text-sm font-semibold">{lift.label} · {lift.currentFloor} / {lift.floors}</div>
   </div>
   <button type="button" aria-label="Close elevator keypad"
    className="flex h-9 w-9 items-center justify-center rounded border border-white/25 bg-black/55"
    onClick={onClose}><X size={17}/></button>
  </div>
  <div className="grid min-h-0 grid-cols-5 gap-2 overflow-y-auto p-1"
   role="group" aria-label="Available floors">
   {Array.from({length:lift.floors},(_,i)=>i+1).map(number=>
    <button key={number} type="button" aria-label={`Go to floor ${number}`}
     data-testid={`nh019-floor-${number}`}
     className={`flex h-10 items-center justify-center rounded border text-sm font-semibold transition-colors ${number===lift.currentFloor?"border-white/60 bg-white/20 text-white":"border-white/20 bg-black/55 text-white/90 hover:bg-white/20"}`}
     disabled={!lift.available||lift.moving||number===lift.currentFloor}
     onClick={()=>onSelect(number)}>{number}</button>)}
  </div>
  <p className="mt-2 text-[10px] text-white/65">
   {lift.moving?"Lift in motion":"Choose any floor in this building"}
  </p>
 </section>;
}
