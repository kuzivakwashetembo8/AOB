/**
 * NH-REBUILD-002: North Heights night/day sky derived from the accepted South
 * Ward createSky, createStarTexture and light-palette implementation.
 * Isolated from createMeridianEnvironment: that runtime hardcodes Mercer lights.
 * Sky geometry is created once, then only color/visibility changes.
 */
import {
  Color3, DirectionalLight, HemisphericLight, Material, MeshBuilder, RawTexture,
  Scene, StandardMaterial, Texture,
} from "@babylonjs/core";

export type NorthHeightsTime = "day" | "dusk" | "night";

function makeStars(scene: Scene, mobile: boolean): RawTexture {
  const width=mobile?1024:2048, height=width/2;
  const pixels=new Uint8Array(width*height*4);
  let seed=0x47544431;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  // Same deterministic Gaussian star splats, sizes, horizon extinction and
  // photometry as South Ward; the mobile variant halves the texture resolution.
  const smooth=(a:number,b:number,t:number)=>{
    const f=Math.max(0,Math.min(1,(t-a)/(b-a)));
    return f*f*(3-2*f);
  };
  const splat=(cx:number,cy:number,brightness:number,opacity:number,sigma:number)=>{
    const reach=Math.ceil(2.6*sigma+.5);
    for(let dy=-reach;dy<=reach;dy++) {
      const y=Math.floor(cy)+dy;
      if(y<0||y>=height)continue;
      for(let dx=-reach;dx<=reach;dx++) {
        const px=Math.floor(cx)+dx;
        const x=((px%width)+width)%width;
        const radius=(px+.5-cx)**2+(y+.5-cy)**2;
        const alpha=Math.round(opacity*Math.exp(-radius/(2*sigma*sigma)));
        if(alpha<2)continue;
        const i=(y*width+x)*4;
        if(alpha<=pixels[i+3]!)continue;
        pixels[i]=brightness;
        pixels[i+1]=Math.min(255,brightness+3);
        pixels[i+2]=Math.min(255,brightness+9);
        pixels[i+3]=alpha;
      }
    }
  };
  for(let i=0;i<(mobile?6500:10000);i++) {
    const v=random()*.5;
    const extinction=1-smooth(.29,.5,v);
    if(random()>extinction)continue;
    const roll=random(),halo=roll>.997,bright=roll>.935;
    const brightness=Math.round(halo?211+random()*34:bright?156+random()*57:88+random()*64);
    const opacity=Math.round((halo?176+random()*50:bright?119+random()*65:58+random()*82)*
      (.45+.55*extinction));
    const sigma=halo?1.15:bright?.76:.54;
    splat(random()*width,v*height,brightness,opacity,sigma);
  }
  const texture=RawTexture.CreateRGBATexture(
    pixels,width,height,scene,true,false,Texture.TRILINEAR_SAMPLINGMODE);
  texture.name="nh002-south-ward-star-field";
  texture.hasAlpha=true;
  texture.wrapU=Texture.WRAP_ADDRESSMODE;
  texture.wrapV=Texture.CLAMP_ADDRESSMODE;
  return texture;
}
export function createNorthHeightsSky(
  scene:Scene, sun:DirectionalLight, ambient:HemisphericLight,mobile:boolean,
) {
  const skyMaterial=new StandardMaterial("nh002-meridian-sky",scene);
  skyMaterial.backFaceCulling=false;
  skyMaterial.disableLighting=true;
  skyMaterial.disableDepthWrite=true;
  skyMaterial.fogEnabled=false;
  skyMaterial.specularColor=Color3.Black();
  const sky=MeshBuilder.CreateSphere("nh002-sky-dome",{diameter:7000,segments:20},scene);
  sky.infiniteDistance=true;
  sky.isPickable=false;
  sky.material=skyMaterial;
  sky.applyFog=false;
  sky.renderingGroupId=0;

  const stars=makeStars(scene,mobile);
  const starMaterial=new StandardMaterial("nh002-meridian-stars",scene);
  starMaterial.backFaceCulling=false;
  starMaterial.disableLighting=true;
  starMaterial.disableDepthWrite=true;
  starMaterial.fogEnabled=false;
  starMaterial.diffuseColor=Color3.White();
  starMaterial.emissiveColor=Color3.White();
  starMaterial.specularColor=Color3.Black();
  starMaterial.diffuseTexture=stars;
  starMaterial.emissiveTexture=stars;
  starMaterial.opacityTexture=stars;
  starMaterial.useAlphaFromDiffuseTexture=true;
  starMaterial.transparencyMode=Material.MATERIAL_ALPHABLEND;
  const starMesh=MeshBuilder.CreateSphere("nh002-star-dome",{diameter:6950,segments:20},scene);
  starMesh.infiniteDistance=true;
  starMesh.isPickable=false;
  starMesh.material=starMaterial;
  starMesh.applyFog=false;
  starMesh.renderingGroupId=0;
  const setTime=(time:NorthHeightsTime)=>{
    const day=time==="day",dusk=time==="dusk";
    const color=day?new Color3(.34,.56,.78):dusk?new Color3(.11,.15,.27):new Color3(.03,.065,.15);
    const horizon=day?new Color3(.68,.72,.73):dusk?new Color3(.20,.16,.22):new Color3(.14,.115,.12);
    skyMaterial.emissiveColor=color;
    skyMaterial.diffuseColor=color;
    starMesh.visibility=day?0:dusk?.32:.78;
    starMaterial.alpha=day?0:dusk?.32:.68;
    ambient.intensity=day?.86:dusk?.55:.44;
    ambient.diffuse=day?new Color3(.66,.75,.86):dusk?new Color3(.36,.43,.55):new Color3(.23,.29,.42);
    ambient.groundColor=day?new Color3(.17,.15,.13):new Color3(.09,.085,.1);
    sun.intensity=day?1.08:dusk?.34:.055;
    sun.diffuse=day?new Color3(1,.9,.78):dusk?new Color3(.98,.63,.42):new Color3(.52,.45,.48);
    scene.fogMode=Scene.FOGMODE_EXP2;
    scene.fogDensity=day?.0012:dusk?.00155:.0019;
    scene.fogColor=horizon;
    scene.clearColor.set(Math.max(.022,color.r*.72),Math.max(.04,color.g*.76),Math.max(.09,color.b*.84),1);
  };
  setTime("dusk");
  return {setTime,dispose(){
    starMesh.dispose();sky.dispose();
    starMaterial.diffuseTexture=null;starMaterial.emissiveTexture=null;starMaterial.opacityTexture=null;
    stars.dispose();starMaterial.dispose();skyMaterial.dispose();
  }};
}
