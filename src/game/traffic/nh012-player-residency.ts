/** Player-centred render residency policy for NH-012 visual representations.
 * Logical agents and authoritative traffic simulation are never removed here.
 */
export const NH012_PLAYER_RENDER_ENTER_RADIUS=92;
export const NH012_PLAYER_RENDER_EXIT_RADIUS=112;

export function nh012IsRenderResident(
  agent:Readonly<{x:number;z:number}>,
  centre:Readonly<{x:number;z:number}>|null|undefined,
  wasResident:boolean,
  pinned=false,
):boolean{
  if(!centre||pinned)return true;
  const dx=agent.x-centre.x,dz=agent.z-centre.z;
  const radius=wasResident
    ?NH012_PLAYER_RENDER_EXIT_RADIUS
    :NH012_PLAYER_RENDER_ENTER_RADIUS;
  return dx*dx+dz*dz<=radius*radius;
}
