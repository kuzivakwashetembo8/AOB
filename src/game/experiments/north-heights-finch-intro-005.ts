/** POI-005: approved first-contact words. Keep exactly as owner accepted. */
export const FINCH_INTRO_005 = [
 "Mr. Voight. I'm Harold Finch. Thank you for coming.",
 "I asked you here because I have a problem that neither money nor information can solve alone.",
 "There's a system called The Machine. It analyses patterns in people's lives and sometimes identifies violent events before they happen.",
 "But it gives us very little information. Sometimes nothing more than a number belonging to a person.",
 "We don't know whether that person is about to become a victim, or whether they're the one responsible. That's what makes this work difficult.",
 "That's where you come in. I'll provide the assignments. You'll find these people, discover what's happening, and do whatever you reasonably can to prevent the crime.",
 "Occasionally, a public telephone will ring while you're investigating. Answer it. The Machine may have discovered something that could help you.",
 "I'll provide the resources you need, and you'll be compensated. But remember, Mr. Voight, these aren't merely numbers. They're human lives.",
 "If you're willing, we can begin. There's someone in Meridia who may be running out of time.",
] as const;
export const FINCH_INTRO_STORAGE_KEY_005 = "gtd:poi005:finch-intro-completed:v1";
export const FINCH_START_005 = {
 buildingId:"NH-04-06-L2",
 spawn:{x:47.4,z:-73.2},
 starterCar:{x:52,z:-69.25,heading:-Math.PI/2},
} as const;
export function finchProximity005(
 player:{x:number;y:number;z:number}|null,
 finch:{x:number;y:number;z:number},ready:boolean,
){
 if(!player||!ready)return false;
 const horizontal=Math.hypot(player.x-finch.x,player.z-finch.z);
 return horizontal<=3.8&&Math.abs(player.y-finch.y)<2.5;
}
