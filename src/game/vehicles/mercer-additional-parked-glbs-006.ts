/**
 * VEH-007: Stage the owner-supplied Range Rover for a real driving trial.
 * The original Sedan is delegated/pending and not rendered. The secondary
 * ergoninane-fast-71 asset is deliberately unloaded until Rover acceptance.
 * Reuses the original world and physics rather than a replacement game.
 */
import {AbstractMesh,Mesh,TransformNode,loadAssetContainerAsync} from "@babylonjs/core";
import type {AssetContainer,Scene} from "@babylonjs/core";
import type {MeridianPhysics,StaticCollisionHandle} from "../physics/rapier-world";
import type {StreetContextItem} from "../world-generation/street-context";
import {loadLocalGLBWithRecovery,LocalGLBImportError} from "./local-glb-retry-062";
import type {LocalGLBLoadErrorCode} from "./local-glb-retry-062";


export type MercerExtra006Spec=Readonly<{
  id:string;label:string;url:string;x:number;z:number;
  width:number;height:number;length:number;yaw:number;
  /** False in VEH-011 trial: an original GLB can receive the shared drive actor. */
  visualOnly?:boolean;
  /** Correct source GLB front/back independently of the Rapier +Z actor. */
  visualHeadingCorrectionRadians?:number;
  sourceBytesKnown?:number;
}>;

export const MERCER_EXTRA_GLB_SPECS:readonly MercerExtra006Spec[]=[
  {
    id:"gtd-veh006-mercer-range-rover",label:"Range Rover Sport 2018",
    url:"/GLBs/Cars/Range%20Rover%20Sports%202018%20(.GLB).glb",
    x:-5.45,z:10.55,width:2.03,height:1.80,length:4.85,yaw:Math.PI/2,
    sourceBytesKnown:24349788,
  },
  {
    id:"gtd-veh008-mercer-toyota-hilux",label:"Toyota Hilux 002",
    url:"/GLBs/Cars/toyota%20hilux%20002.glb",
    // Same Mercer lane as the Rover, separated by a full vehicle length
    // plus a clearance gap for walking around both parking specimens.
    x:-13.45,z:10.55,width:2.15,height:1.87,length:5.25,yaw:Math.PI/2,
    visualOnly:false,
    sourceBytesKnown:17214188,
  },
  {
    // Owner-accepted original Defender model, now eligible for drive trials.
    id:"gtd-veh009-mercer-land-rover-defender",label:"Land Rover Defender 001",
    url:"/GLBs/Cars/Land%20rover%20defender%20001.glb",
    x:-31.9,z:10.55,width:2.10,height:2.02,length:4.75,yaw:Math.PI/2,
    visualOnly:false,
    sourceBytesKnown:426228,
  },
  {
    // Source name is Dodge HP; exact variant not yet verified.
    id:"gtd-veh010-mercer-dodge-hp",label:"Dodge HP",
    url:"/GLBs/Cars/dodge_HP.glb",
    x:-39.7,z:10.55,width:2.06,height:1.87,length:5.10,yaw:Math.PI/2,
    visualOnly:false,
    sourceBytesKnown:1954504,
  },
  {
    // Sixth physical traffic-review specimen; static until separately authorized.
    id:"gtd-veh014-mercer-bmw-m4",label:"BMW M4 Competition M Package",
    url:"/GLBs/Cars/bmw_m4_competition_m_package%20(1).glb",
    // South Ward Mercer roadway, clear of the procedural car near x=-20.5.
    x:-25.95,z:10.55,width:1.93,height:1.46,length:4.80,yaw:Math.PI/2,
    visualOnly:false,
    sourceBytesKnown:1928276,
  },
  {
    // Original Temerario GLB with source materials, no traffic AI or driving rig.
    id:"gtd-veh014-mercer-lamborghini-temerario",label:"Lamborghini Temerario",
    url:"/GLBs/Cars/Lamborghini%2BTemerario.glb",
    // VEH-016: source-labelled front control nodes are at negative X.
    // The accepted parking fit displayed the bonnet behind the +Z chassis;
    // a 180-degree VISUAL correction aligns it with real forward throttle.
    visualHeadingCorrectionRadians:Math.PI,
    x:-47.55,z:10.55,width:2.00,height:1.28,length:4.75,yaw:Math.PI/2,
    visualOnly:false,
    sourceBytesKnown:4499268,
  },
] as const;

export function validateMercerExtraPlacements(items:readonly StreetContextItem[]){
  const slots=[...MERCER_EXTRA_GLB_SPECS];
  for(const p of MERCER_EXTRA_GLB_SPECS){
    if(p.z-p.width/2<8||p.z+p.width/2>12)
      throw Error("VEH006 extra GLB leaves Mercer asphalt: "+p.id);
    for(const item of items){
      const dx=Math.abs(item.position.x-p.x),dz=Math.abs(item.position.z-p.z);
      if(item.kind==="parked-car"&&dx<p.length/2+2.4&&dz<p.width/2+1)
        throw Error("VEH006 extra GLB overlaps existing parked car "+item.id);
      if(["streetlight","tree","bench","bin"].includes(item.kind)&&
         dx<p.length/2+0.6&&dz<p.width/2+0.8)
        throw Error("VEH006 extra GLB obstructs street prop "+item.id);
    }
  }
  for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++){
    const a=slots[i]!,b=slots[j]!;
    if(Math.abs(a.x-b.x)<(a.length+b.length)/2+0.65&&
       Math.abs(a.z-b.z)<(a.width+b.width)/2+.35)
      throw Error("VEH006 parked review cars lack clearance "+a.id+" / "+b.id);
  }
  return MERCER_EXTRA_GLB_SPECS;
}
export type Bounds006=Readonly<{minX:number;maxX:number;minY:number;maxY:number;
  minZ:number;maxZ:number}>;
export function resolveMercerGLBFit(bounds:Bounds006,spec:MercerExtra006Spec){
  const sx=bounds.maxX-bounds.minX,sy=bounds.maxY-bounds.minY,
    sz=bounds.maxZ-bounds.minZ;
  if(![sx,sy,sz].every(v=>Number.isFinite(v)&&v>.0001))
    throw Error("VEH006 asset has degenerate/invalid 3D bounds "+spec.id);
  // The longest horizontal axis of the imported asset becomes vehicle +Z.
  const turn=sx>sz?Math.PI/2:0;
  const rawLength=Math.max(sx,sz),rawWidth=Math.min(sx,sz);
  // Fit the major axis to the selected parking footprint and cap height/width.
  const scale=Math.min(spec.length/rawLength,spec.width/rawWidth,
    spec.height/sy);
  if(!Number.isFinite(scale)||scale<.00001||scale>1000)
    throw Error("VEH006 asset cannot be fitted safely: "+spec.id);
  return {turn,scale,source:{width:rawWidth,height:sy,length:rawLength},
    dimensions:{width:rawWidth*scale,height:sy*scale,length:rawLength*scale}};
}
function boundsOf(meshes:readonly AbstractMesh[]):Bounds006{
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,
    minZ=Infinity,maxZ=-Infinity;
  for(const mesh of meshes){
    mesh.computeWorldMatrix(true);
    if(mesh.getTotalVertices()===0)continue;
    const b=mesh.getBoundingInfo().boundingBox;
    minX=Math.min(minX,b.minimumWorld.x);maxX=Math.max(maxX,b.maximumWorld.x);
    minY=Math.min(minY,b.minimumWorld.y);maxY=Math.max(maxY,b.maximumWorld.y);
    minZ=Math.min(minZ,b.minimumWorld.z);maxZ=Math.max(maxZ,b.maximumWorld.z);
  }
  if(!Number.isFinite(minX))throw Error("VEH006 GLB contains no visible geometry");
  return {minX,maxX,minY,maxY,minZ,maxZ};
}
export function createMercerExtraParkedGLBs(
  scene:Scene,physics:Pick<MeridianPhysics,"addStaticBox">,
  items:readonly StreetContextItem[],
  load?:(url:string,scene:Scene)=>Promise<AssetContainer>,
){
  const specs=validateMercerExtraPlacements(items);
  const instances=specs.map(spec=>{
    const anchor=new TransformNode("mercer-extra-anchor:"+spec.id,scene);
    // Do not create colliders until the actual mesh is loaded and validated.
    let collider:StaticCollisionHandle|null=null,container:AssetContainer|null=null;
    let inst:ReturnType<AssetContainer["instantiateModelsToScene"]>|null=null;
    let closed=false;
    let drivingDimensions:{readonly x:number;readonly y:number;readonly z:number}|null=null;
    let containerReadyMs:number|null=null,instantiateMs:number|null=null;
    let loadAttempts=0,loaderElapsedMs:number|null=null;
    let errorCode:LocalGLBLoadErrorCode|null=null;
    let importPhase=true;
    const loadStartedAt=performance.now();
    const modelRoot=new TransformNode("mercer-extra-visual:"+spec.id,scene);
    modelRoot.parent=anchor;
    const ready=(async()=>{
      if(!load)await import("@babylonjs/loaders/glTF");
      // WHEEL-001: Only use build-time rigged derivatives on the isolated
      // review preview; in local development/custom loader tests retain the
      // exact original URL. The build always generates this pathname,
      // including an unchanged original fallback on failed qualification.
      const derivative:Record<string,string>={
        "gtd-veh008-mercer-toyota-hilux":
          "/GLBs/Cars/Generated/toyota-hilux-002.glb",
        "gtd-veh009-mercer-land-rover-defender":
          "/GLBs/Cars/Generated/land-rover-defender-001.glb",
        "gtd-veh010-mercer-dodge-hp":
          "/GLBs/Cars/Generated/dodge-hp.glb",
        "gtd-veh014-mercer-bmw-m4":
          "/GLBs/Cars/Generated/bmw-m4-competition.glb",
      };
      const runtimeUrl=import.meta.env.PROD
        ?(derivative[spec.id]??spec.url):spec.url;
      const glb=await loadLocalGLBWithRecovery(spec.label,
        ()=>load?load(spec.url,scene):loadAssetContainerAsync(runtimeUrl,scene),{
          cancelled:()=>closed,
          onAttempt:attempt=>{loadAttempts=attempt;},
        });
      importPhase=false;
      loaderElapsedMs=performance.now()-loadStartedAt;
      if(closed){glb.dispose();return;}
      container=glb;
      containerReadyMs=performance.now()-loadStartedAt;
      const instantiationStartedAt=performance.now();
      // A single independent owner GLB per slot. Leave embedded paint,
      // windows, wheel shaders and textures untouched.
      // A drivable GLB needs independent wheel Mesh nodes, not InstancedMesh
      // sharing transforms/source geometry with an otherwise parked template.
      // Preserve the owner asset's source textures, materials and hierarchy.
      inst=glb.instantiateModelsToScene(name=>spec.id+":"+name,true);
      if(closed){inst.dispose();return;}
      for(const node of inst.rootNodes)node.parent=modelRoot;
      const all=new Set<AbstractMesh>();
      for(const node of inst.rootNodes){
        if(node instanceof AbstractMesh)all.add(node);
        for(const mesh of node.getChildMeshes(false))all.add(mesh);
      }
      const meshes=[...all].filter(m=>m.getTotalVertices()>0);
      if(!meshes.length)throw Error("VEH006 extra asset has no render meshes "+spec.id);
      const initial=boundsOf(meshes);
      const fit=resolveMercerGLBFit(initial,spec);
      drivingDimensions={x:fit.dimensions.width,y:fit.dimensions.height,z:fit.dimensions.length};
      modelRoot.rotation.y=fit.turn+(spec.visualHeadingCorrectionRadians??0);
      modelRoot.scaling.setAll(fit.scale);
      // This measures the actual hierarchy, including glTF coordinate roots.
      const fitted=boundsOf(meshes);
      modelRoot.position.set(
        -(fitted.minX+fitted.maxX)/2,
        .05-fitted.minY,
        -(fitted.minZ+fitted.maxZ)/2,
      );
      anchor.position.set(spec.x,0,spec.z);
      anchor.rotation.y=spec.yaw;
      for(const mesh of meshes){
        mesh.isPickable=false;
        mesh.receiveShadows=true;
        mesh.alwaysSelectAsActiveMesh=true;
      }
      if(closed)return;
      collider=physics.addStaticBox(
        {x:spec.x,y:fit.dimensions.height/2,z:spec.z},
        {x:fit.dimensions.width/2,y:fit.dimensions.height/2,
          z:fit.dimensions.length/2},
        spec.yaw,
      );
      instantiateMs=performance.now()-instantiationStartedAt;
    })().catch(error=>{
      // A failing member blocks the authentic six-car boot, but now carries
      // a sanitized per-model terminal reason into user-exportable telemetry.
      errorCode=error instanceof LocalGLBImportError?error.code:
        importPhase?"loader_failure":"asset_instantiation_failed";
      loaderElapsedMs=performance.now()-loadStartedAt;
      throw error;
    });
    return {spec,anchor,ready,
      get loadTelemetry(){return {containerReadyMs,instantiateMs,
        loadAttempts,loaderElapsedMs,errorCode};},
      get drivingDimensions(){return drivingDimensions;},
      /** Transfer physical ownership to StreetVehicleActor only AFTER the
       * live Rapier actor has been successfully constructed. Idempotent. */
      releaseStaticCollider(){
        if(spec.visualOnly)throw Error("Visual-only GLB cannot transfer its static collider");
        if(closed||!drivingDimensions||!collider)
          throw Error("Imported vehicle static collider is not ready for transfer");
        collider.dispose();collider=null;
      },
      dispose(){
      if(closed)return;
      closed=true;
      collider?.dispose();
      inst?.dispose();
      container?.dispose();
      modelRoot.dispose();
      anchor.dispose();
    }};
  });
  return {placements:specs,instances,
    ready:Promise.all(instances.map(x=>x.ready)).then(()=>{}),
    dispose(){for(const x of instances)x.dispose();}};
}
