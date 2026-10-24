/**
 * GTD-NH-REBUILD-003 organic greenery parity from South Ward.
 * Procedural leaf-spray alpha cards and tapered trunks are thin-instanced,
 * not imported leaves.glb and not placeholder foliage cubes.
 */
import {
  Color3, DynamicTexture, Material, Matrix, MeshBuilder, Quaternion, Scene,
  StandardMaterial, Texture, Vector3,
} from "@babylonjs/core";

type Placement={x:number;y:number;z:number;size:number};
const rand=(seed:number)=>{let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};};
function foliageTexture(scene:Scene){
  const size=256;
  const tex=new DynamicTexture("nh003-south-ward-leaf-spray",{width:size,height:size},scene,false);
  const ctx=tex.getContext() as CanvasRenderingContext2D;
  ctx.clearRect(0,0,size,size);
  const rng=rand(41721),colors=["#25482a","#315b34","#3e693c","#4f7542","#5b8149"];
  // Same two-pass organic strokes / leaf splats used by South Ward's
  // street-context renderer, adapted for shared thin-instance cards.
  const drawLeaf=(x:number,y:number,angle:number,len:number,width:number)=>{
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);
    ctx.fillStyle=colors[Math.floor(rng()*colors.length)]!;
    ctx.globalAlpha=.85+rng()*.15;
    ctx.beginPath();
    ctx.moveTo(-len/2,0);
    ctx.quadraticCurveTo(0,-width,len/2,0);
    ctx.quadraticCurveTo(0,width,-len/2,0);
    ctx.fill();ctx.restore();
  };
  for(let spray=0;spray<65;spray++){
    const sx=52+rng()*152, sy=55+rng()*145,angle=rng()*Math.PI*2;
    const len=20+rng()*55;
    const ex=sx+Math.cos(angle)*len,ey=sy+Math.sin(angle)*len;
    ctx.strokeStyle="rgba(52,68,38,0.62)";ctx.lineWidth=1.3+rng()*1.8;
    ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();
    const count=5+Math.floor(rng()*5);
    for(let n=0;n<count;n++){
      const t=(n+1)/(count+1),px=sx+(ex-sx)*t+(rng()-.5)*11;
      const py=sy+(ey-sy)*t+(rng()-.5)*11;
      drawLeaf(px,py,angle+(rng()-.5)*1.8,9+rng()*16,4+rng()*6);
    }
  }
  for(let i=0;i<140;i++)
    drawLeaf(35+rng()*186,35+rng()*186,rng()*Math.PI*2,7+rng()*14,3+rng()*6);
  tex.hasAlpha=true;
  tex.wrapU=Texture.CLAMP_ADDRESSMODE;
  tex.wrapV=Texture.CLAMP_ADDRESSMODE;
  tex.update(false);
  return tex;
}
export function createNorthHeightsGreenery003(
  scene:Scene,
  options:{
    readonly middle:readonly number[];
    readonly occupied:ReadonlySet<string>;
    readonly ground:(x:number,z:number)=>number;
    readonly grass:StandardMaterial;
    readonly mobile:boolean;
  },
):{trees:number;foliageCards:number;dispose:()=>void}{
  const rng=rand(313957);
  // Borrow the accepted South Ward grass-pixel distribution, not an image rug.
  const px=new Uint8Array(64*64*4);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++){
    const i=(y*64+x)*4;
    const n=rng(),b=rng();
    px[i]=45+Math.round(n*18+b*10);
    px[i+1]=78+Math.round(n*28+b*18);
    px[i+2]=42+Math.round(n*16);
    px[i+3]=255;
  }
  const grassTexture=Texture.CreateFromBase64String;
  // RawTexture avoids data URLs and canvas allocations for patch/terrain grass.
  const { RawTexture } = requireNever();
  const gt=RawTexture.CreateRGBATexture(px,64,64,scene,true,false,Texture.TRILINEAR_SAMPLINGMODE);
  gt.name="nh003-south-ward-grass";
  gt.wrapU=Texture.WRAP_ADDRESSMODE;
  gt.wrapV=Texture.WRAP_ADDRESSMODE;
  gt.uScale=3.2;gt.vScale=2.4;
  options.grass.diffuseTexture=gt;options.grass.diffuseColor=Color3.White();
  const nodes:Placement[]=[];
  const middle=options.middle;
  for(let j=0;j<middle.length;j++)for(let i=0;i<middle.length;i++){
    const block="NH-"+String(j+1).padStart(2,"0")+"-"+String(i+1).padStart(2,"0");
    const x=middle[i]!,z=middle[j]!;
    if(!options.occupied.has(block)){
      for(let t=0;t<6;t++){
        const tx=x+(rng()-.5)*36,tz=z+(rng()-.5)*36;
        nodes.push({x:tx,y:options.ground(tx,tz),z:tz,size:0.82+rng()*.35});
      }
    }
    // Unified walking-street verge trees: plant only inside lot/green setback,
    // not on the asphalt or inside a raised sidewalk.
    if((i+j)%2===0){
      for(const side of [-1,1]){
        const tx=x+side*22,tz=z+(rng()-.5)*21;
        nodes.push({x:tx,y:options.ground(tx,tz),z:tz,size:.78+rng()*.26});
      }
    }
  }
  const bark=new StandardMaterial("nh003-south-ward-bark",scene);
  bark.diffuseColor=new Color3(.38,.29,.20);
  bark.specularColor=Color3.Black();
  const foliage=foliageTexture(scene);
  const leaf=new StandardMaterial("nh003-south-ward-foliage",scene);
  leaf.diffuseColor=Color3.White();
  leaf.diffuseTexture=foliage;
  leaf.opacityTexture=foliage;
  leaf.useAlphaFromDiffuseTexture=true;
  leaf.backFaceCulling=false;
  leaf.transparencyMode=Material.MATERIAL_ALPHATEST;
  leaf.specularColor=Color3.Black();
  const tree=MeshBuilder.CreateCylinder("nh003-organic-trunks",{
    height:5.1,diameterTop:.55,diameterBottom:.80,tessellation:9,
  },scene);
  tree.material=bark;tree.isPickable=false;tree.alwaysSelectAsActiveMesh=true;
  const trunkMatrices=new Float32Array(nodes.length*16);
  nodes.forEach((n,i)=>{
    Matrix.Compose(new Vector3(n.size,n.size,n.size),Quaternion.Identity(),
      new Vector3(n.x,n.y+2.55*n.size,n.z)).copyToArray(trunkMatrices,i*16);
  });
  tree.thinInstanceSetBuffer("matrix",trunkMatrices,16,true);
  tree.thinInstanceRefreshBoundingInfo();
  const branch=MeshBuilder.CreateCylinder("nh003-organic-branch",{
    height:2.3,diameterTop:.14,diameterBottom:.32,tessellation:6,
  },scene);
  branch.material=bark;branch.isPickable=false;branch.alwaysSelectAsActiveMesh=true;
  const branchMatrices=new Float32Array(nodes.length*4*16);
  nodes.forEach((n,i)=>{for(let b=0;b<4;b++){
    const yaw=(b/4)*Math.PI*2;
    Matrix.Compose(new Vector3(n.size,n.size,n.size),
      Quaternion.RotationYawPitchRoll(yaw,0,(b%2===0?1:-1)*.72),
      new Vector3(n.x+Math.cos(yaw)*1.0*n.size,n.y+(4.5+b*.28)*n.size,
        n.z+Math.sin(yaw)*1.0*n.size)).copyToArray(branchMatrices,(i*4+b)*16);
  }});
  branch.thinInstanceSetBuffer("matrix",branchMatrices,16,true);
  branch.thinInstanceRefreshBoundingInfo();
  const leaves=MeshBuilder.CreatePlane("nh003-south-ward-leaf-cards",{
    width:3.8,height:2.9,sideOrientation:2,
  },scene);
  leaves.material=leaf;leaves.isPickable=false;leaves.alwaysSelectAsActiveMesh=true;
  const crowns=options.mobile?8:13;
  const leafMatrices=new Float32Array(nodes.length*crowns*16);
  nodes.forEach((n,i)=>{for(let c=0;c<crowns;c++){
    const angle=(c/crowns)*Math.PI*2+rng()*.5;
    const radius=(.6+rng()*1.05)*n.size;
    const h=(5.8+rng()*2.4)*n.size;
    Matrix.Compose(new Vector3(n.size*(.92+rng()*.38),n.size*(.90+rng()*.35),1),
      Quaternion.RotationYawPitchRoll(angle,rng()*.35-.17,rng()*.2-.1),
      new Vector3(n.x+Math.cos(angle)*radius,n.y+h,n.z+Math.sin(angle)*radius))
      .copyToArray(leafMatrices,(i*crowns+c)*16);
  }});
  leaves.thinInstanceSetBuffer("matrix",leafMatrices,16,true);
  leaves.thinInstanceRefreshBoundingInfo();
  return {trees:nodes.length,foliageCards:nodes.length*crowns,dispose(){
    leaves.dispose();branch.dispose();tree.dispose();foliage.dispose();bark.dispose();leaf.dispose();gt.dispose();
  }};
}
// Imported directly here to retain native Babylon APIs without async module load.
import { RawTexture } from "@babylonjs/core";
function requireNever(){ return {RawTexture}; }
