/**
 * NH-REBUILD-005: Actual Rapier terrain/street/sidewalk + building collision.
 * Separate from South Ward's runtime; uses its accepted MeridianPhysics
 * controller and kinematic capsule, not Babylon mesh collision flags.
 */
import RAPIER from "@dimforge/rapier3d-compat";
import { Mesh, Scene, VertexBuffer } from "@babylonjs/core";
import { MeridianPhysics } from "@/game/physics/rapier-world";
import type { BuildingSpec } from "@/game/world-generation/schema";
import { northHeightsGround } from "./north-heights-reconstruction-001";
import {northHeightsDoorway010,NORTH_HEIGHTS_PORTAL_HEIGHT_010}
  from "./north-heights-spatial-plan-010";

export interface NorthHeightsWalk005 {
  readonly physics: MeridianPhysics;
  readonly buildingCount: number;
  readonly surfaceCount: number;
  step(input:{x:number;z:number;speed:number;dt:number;jump:boolean}):{
    position:{x:number;y:number;z:number};
    grounded:boolean;
    speed:number;
    verticalVelocity:number;
  };
  reset(x:number,z:number):void;
  dispose():void;
}
export function northHeightsBuildingCollision005(lots:readonly BuildingSpec[]){
  return lots.map(lot=>{
    const w=lot.overrides?.width??12;
    const d=lot.overrides?.depth??12;
    const floors=lot.overrides?.floors??4;
    const floorHeight=lot.overrides?.floorHeight??3.1;
    const height=Math.max(2,floors*floorHeight);
    const x=lot.position.x,z=lot.position.z,y=northHeightsGround(x,z);
    return {id:lot.id,
      position:{x,y:y+height/2+.8,z},
      halfExtents:{x:Math.max(1,w/2),y:height/2,z:Math.max(1,d/2)},
      yaw:lot.yawRadians??0,
    };
  });
}

/** A single Rapier trimesh per independently owned visible ground layer. */
export async function createNorthHeightsWalk005(
  scene:Scene,lots:readonly BuildingSpec[],spawn:{x:number;z:number},
):Promise<NorthHeightsWalk005>{
  const physics=await MeridianPhysics.create();
  const handles:{dispose:()=>void}[]=[];
  let surfaceCount=0,buildingCount=0;
  let verticalVelocity=0, grounded=false, jumpHeld=false, disposed=false;
  const addSurface=(name:string)=>{
    const mesh=scene.getMeshByName(name);
    if(!(mesh instanceof Mesh))throw Error("NH-005 physical surface missing: "+name);
    // These generated meshes are already in world coordinates with unit
    // transforms. Collision exactly matches the triangles visible on screen.
    const coords=mesh.getVerticesData(VertexBuffer.PositionKind);
    const inds=mesh.getIndices();
    if(!coords?.length||!inds?.length)throw Error("NH-005 surface empty: "+name);
    const vertices=new Float32Array(coords);
    const triangles=new Uint32Array(inds);
    const body=physics.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    try {
      physics.world.createCollider(RAPIER.ColliderDesc.trimesh(vertices,triangles),body);
    } catch(error){physics.world.removeRigidBody(body);throw error;}
    handles.push({dispose:()=>physics.world.removeRigidBody(body)});
    surfaceCount++;
  };
  try {
    addSurface("nh-ridge-terrain");
    addSurface("nh003-road:asphalt");
    addSurface("nh003-road:pavement");
    // New park lawns and building-lot concrete become real walkable surfaces.
    // Legacy NH-005 isolated tests omit them; they are optional at that level.
    for(const block of ["nh008-block:grass","nh008-block:concrete"]){
      if(scene.getMeshByName(block))addSurface(block);
    }
    // Painted crossings have no independent collision surface. Curbs are
    // <=0.205m and covered by the existing Rapier 0.28m autostep.
    // NH-010: the original one-solid-box collider blocked the door AND every
    // room. Use physical wall segments with a +Z opening plus pure-white
    // supporting floor slabs. Keep complete building footprints vehicle-only.
    for(const lot of lots){
      const w=lot.overrides?.width??12,d=lot.overrides?.depth??12;
      const floors=lot.overrides?.floors??4,fh=lot.overrides?.floorHeight??3.1;
      const h=Math.max(2,floors*fh);
      const x=lot.position.x,z=lot.position.z,y=northHeightsGround(x,z)+.8;
      const portal=northHeightsDoorway010(lot),gap=portal.width,openingH=Math.min(h-.2,NORTH_HEIGHTS_PORTAL_HEIGHT_010);
      const t=.22;
      const wall=(px:number,py:number,pz:number,hw:number,hh:number,hd:number)=>{
        if(hw<=0||hh<=0||hd<=0)return;
        handles.push(physics.addStaticBox({x:px,y:py,z:pz},
          {x:hw,y:hh,z:hd},lot.yawRadians??0));
      };
      // Four walls, +Z face split to leave a real door-width gap.
      wall(x,y+h/2,z-d/2,w/2,h/2,t/2);
      wall(x-w/2,y+h/2,z,t/2,h/2,d/2);
      wall(x+w/2,y+h/2,z,t/2,h/2,d/2);
      const flank=(w-gap)/2;
      wall(x-(gap+flank)/2,y+h/2,z+d/2,flank/2,h/2,t/2);
      wall(x+(gap+flank)/2,y+h/2,z+d/2,flank/2,h/2,t/2);
      if(h>openingH)
        wall(x,y+openingH+(h-openingH)/2,z+d/2,gap/2,(h-openingH)/2,t/2);
      // White, empty level surfaces match visual slabs; no black core.
      wall(x,y+.07,z,(w-.6)/2,.07,(d-.6)/2);
      for(let f=1;f<floors;f++)
        wall(x,y+f*fh,z,(w-.6)/2,.07,(d-.6)/2);
      wall(x,y+h-.12,z,(w-.6)/2,.12,(d-.6)/2);
      // A planar envelope stops cars taking the pedestrian passage without
      // making any artificial invisible collider for Voight.
      handles.push(physics.addVehiclePlanarBarrier({
        x,z,halfX:w/2+.25,halfZ:d/2+.25,yaw:lot.yawRadians??0,
      }));
      buildingCount++;
    }
    const reset=(x:number,z:number)=>{
      verticalVelocity=0;grounded=false;jumpHeld=false;
      // The shared capsule uses a centre 0.92 m above foot position.
      physics.setPlayerPosition({x,y:northHeightsGround(x,z)+.075+.92+.18,z});
    };
    reset(spawn.x,spawn.z);
    return {
      physics,buildingCount,surfaceCount,
      reset,
      step(input){
        if(disposed)throw Error("NH-005: physics stepped after disposal");
        const dt=Math.min(1/30,Math.max(0,input.dt));
        const planar=Math.hypot(input.x,input.z);
        const speed=input.speed;
        const factor=planar>1?1/planar:1;
        if(input.jump && !jumpHeld && grounded){
          verticalVelocity=5.2;
          grounded=false;
        }
        jumpHeld=input.jump;
        verticalVelocity=Math.max(-30,verticalVelocity-9.81*dt);
        const result=physics.movePlayer({
          x:input.x*factor*speed*dt,
          y:verticalVelocity*dt,
          z:input.z*factor*speed*dt,
        });
        grounded=result.grounded;
        if(grounded&&verticalVelocity<0)verticalVelocity=0;
        const actual=Math.hypot(result.movement.x,result.movement.z)/Math.max(.001,dt);
        return {position:physics.playerPosition(),grounded,speed:actual,verticalVelocity};
      },
      dispose(){
        if(disposed)return;
        disposed=true;
        for(const handle of handles.reverse())handle.dispose();
        physics.destroy();
      },
    };
  } catch(error){
    for(const handle of handles.reverse())handle.dispose();
    physics.destroy();
    throw error;
  }
}
