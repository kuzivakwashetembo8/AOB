/** LMS-GUN-001: procedural weapon models extracted from Claude-of-Duty. */
export const GUNS_001 = [
 {id:"m4a1",name:"M4A1",category:"ASSAULT CARBINE",description:"AR-pattern carbine with free-float handguard, collapsible stock and tube optic.",sourceLabel:"M4A1",builder:"rifle"},
 {id:"mpx9",name:"MPX-9",category:"SUBMACHINE GUN",description:"Compact 9 mm submachine gun with folding stock, vertical foregrip and reflex optic.",sourceLabel:"MPX-9",builder:"smg"},
 {id:"p19",name:"P-19",category:"SIDEARM",description:"Striker-fired 9 mm pistol with polymer frame and slide-mounted mini-reflex sight.",sourceLabel:"P-19",builder:"pistol"}
] as const;
export type Gun001=(typeof GUNS_001)[number];
export function gunAt001(index:number):Gun001{
 const count=GUNS_001.length;
 return GUNS_001[((index%count)+count)%count]!;
}
