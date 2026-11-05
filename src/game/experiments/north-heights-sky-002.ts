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
  // Preserve the accepted day/dusk/night palettes. Only the transitions
  // between them gain a dawn phase and continuous optical interpolation.
  type Palette={color:Color3;horizon:Color3;star:number;alpha:number;ambient:number;
   ambientColor:Color3;ground:Color3;sun:number;sunColor:Color3;fog:number};
  const palettes:Record<NorthHeightsTime|"dawn",Palette>={
   day:{color:new Color3(.34,.56,.78),horizon:new Color3(.68,.72,.73),
    star:0,alpha:0,ambient:.86,ambientColor:new Color3(.66,.75,.86),
    ground:new Color3(.17,.15,.13),sun:1.08,sunColor:new Color3(1,.9,.78),fog:.0012},
   dawn:{color:new Color3(.30,.42,.62),horizon:new Color3(.80,.53,.41),
    star:.07,alpha:.06,ambient:.60,ambientColor:new Color3(.66,.57,.54),
    ground:new Color3(.15,.12,.11),sun:.46,sunColor:new Color3(1,.68,.43),fog:.00140},
   dusk:{color:new Color3(.11,.15,.27),horizon:new Color3(.20,.16,.22),
    star:.32,alpha:.32,ambient:.55,ambientColor:new Color3(.36,.43,.55),
    ground:new Color3(.09,.085,.1),sun:.34,sunColor:new Color3(.98,.63,.42),fog:.00155},
   night:{color:new Color3(.03,.065,.15),horizon:new Color3(.14,.115,.12),
    star:.78,alpha:.68,ambient:.44,ambientColor:new Color3(.23,.29,.42),
    ground:new Color3(.09,.085,.1),sun:.055,sunColor:new Color3(.52,.45,.48),fog:.0019},
  };
  const interpolate=(a:Palette,b:Palette,t:number):Palette=>{
   const f=Math.max(0,Math.min(1,t)),n=(x:number,y:number)=>x+(y-x)*f;
   return {color:Color3.Lerp(a.color,b.color,f),
    horizon:Color3.Lerp(a.horizon,b.horizon,f),
    star:n(a.star,b.star),alpha:n(a.alpha,b.alpha),
    ambient:n(a.ambient,b.ambient),
    ambientColor:Color3.Lerp(a.ambientColor,b.ambientColor,f),
    ground:Color3.Lerp(a.ground,b.ground,f),
    sun:n(a.sun,b.sun),sunColor:Color3.Lerp(a.sunColor,b.sunColor,f),fog:n(a.fog,b.fog)};
  };
  const skyAtMinute=(value:number):Palette=>{
   const m=((value%1440)+1440)%1440;
   if(m<330||m>=1200)return palettes.night;
   if(m<390)return interpolate(palettes.night,palettes.dawn,(m-330)/60);
   if(m<450)return interpolate(palettes.dawn,palettes.day,(m-390)/60);
   if(m<1010)return palettes.day;
   if(m<1110)return interpolate(palettes.day,palettes.dusk,(m-1010)/100);
   return interpolate(palettes.dusk,palettes.night,(m-1110)/90);
  };
  let target=palettes.dusk;
  let initialized=false,minuteControlled=false;
  const apply=(p:Palette,weight:number)=>{
   const lerp=(a:number,b:number)=>a+(b-a)*weight;
   const color=(to:Color3,from:Color3)=>{
    to.set(lerp(to.r,from.r),lerp(to.g,from.g),lerp(to.b,from.b));
   };
   color(skyMaterial.emissiveColor,p.color);
   color(skyMaterial.diffuseColor,p.color);
   starMesh.visibility=lerp(starMesh.visibility,p.star);
   starMaterial.alpha=lerp(starMaterial.alpha,p.alpha);
   ambient.intensity=lerp(ambient.intensity,p.ambient);
   color(ambient.diffuse,p.ambientColor);color(ambient.groundColor,p.ground);
   sun.intensity=lerp(sun.intensity,p.sun);color(sun.diffuse,p.sunColor);
   scene.fogMode=Scene.FOGMODE_EXP2;scene.fogDensity=lerp(scene.fogDensity,p.fog);
   color(scene.fogColor,p.horizon);
   scene.clearColor.set(Math.max(.022,skyMaterial.emissiveColor.r*.72),
    Math.max(.04,skyMaterial.emissiveColor.g*.76),
    Math.max(.09,skyMaterial.emissiveColor.b*.84),1);
  };
  const setTime=(time:NorthHeightsTime)=>{
   // On the legacy API, presets remain exact. When a clock is bound,
   // the new smooth minute profile owns sky presentation instead.
   if(minuteControlled)return;
   target=palettes[time];apply(target,1);initialized=true;
  };
  const setMinuteOfDay=(minute:number)=>{
   if(!Number.isFinite(minute))return;
   target=skyAtMinute(minute);
   if(!minuteControlled||!initialized){apply(target,1);initialized=true;}
   minuteControlled=true;
  };
  const update=()=>{
   if(!minuteControlled)return;
   const dt=Math.min(.05,scene.getEngine().getDeltaTime()/1000);
   apply(target,1-Math.exp(-dt/5));
  };
  const observer=scene.onBeforeRenderObservable.add(update);
  setTime("dusk");
  return {setTime,setMinuteOfDay,dispose(){
    scene.onBeforeRenderObservable.remove(observer);
    starMesh.dispose();sky.dispose();
    starMaterial.diffuseTexture=null;starMaterial.emissiveTexture=null;starMaterial.opacityTexture=null;
    stars.dispose();starMaterial.dispose();skyMaterial.dispose();
  }};
}
