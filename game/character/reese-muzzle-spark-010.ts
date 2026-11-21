/**
 * LMS-GUN-011 — Babylon adaptation of Claude-of-Duty's muzzle flash profile.
 * COD uses a separate Three.js atlas/particle renderer; AOB runs Babylon.
 * This preserves its effect structure and timing with pooled meshes/lights.
 */
import { Color3, Mesh, MeshBuilder, PointLight, StandardMaterial, Vector3, type Scene } from "@babylonjs/core";
type Part = { mesh: Mesh; life: number; duration: number; start: number; end: number };
export function createReeseMuzzleSpark010(scene: Scene) {
  const material = (name: string, color: Color3, alpha = 1) => {
    const m = new StandardMaterial(name, scene); m.disableLighting = true;
    m.emissiveColor = color; m.diffuseColor = color; m.alpha = alpha; return m;
  };
  const hotMat = material("lms-muzzle-hot", new Color3(1,.94,.78));
  const coreMat = material("lms-muzzle-core", new Color3(1,.66,.3));
  const gasMat = material("lms-muzzle-gas", new Color3(1,.31,.055), .92);
  const emberMat = material("lms-muzzle-ember", new Color3(1,.43,.1));
  const smokeMat = material("lms-muzzle-smoke", new Color3(.3,.27,.23), .2);
  const parts: Part[] = [];
  const part = (mesh: Mesh, duration: number, start: number, end: number, mat: StandardMaterial) => {
    mesh.material = mat; mesh.isPickable = false; mesh.isVisible = false;
    const p = {mesh, life:0, duration, start, end}; parts.push(p); return p;
  };
  const core = part(MeshBuilder.CreateSphere("lms-muzzle-core",{diameter:.13,segments:6},scene),.062,.66,1.05,coreMat);
  const hot = part(MeshBuilder.CreateSphere("lms-muzzle-hot-core",{diameter:.056,segments:6},scene),.046,.65,1,hotMat);
  const lobes = Array.from({length:4},(_,i)=>part(MeshBuilder.CreateCylinder("lms-muzzle-lobe-"+i,{height:.25,diameterTop:.012,diameterBottom:.085,tessellation:5},scene),.052,.55,1,gasMat));
  const jet = part(MeshBuilder.CreateCylinder("lms-muzzle-jet",{height:.28,diameterTop:.012,diameterBottom:.06,tessellation:5},scene),.044,.65,1,gasMat);
  const sparks = Array.from({length:8},(_,i)=>part(MeshBuilder.CreateCylinder("lms-muzzle-ember-"+i,{height:.12,diameterTop:.002,diameterBottom:.012,tessellation:4},scene),.20+(i%4)*.035,.7,.08,emberMat));
  const smoke = Array.from({length:3},(_,i)=>part(MeshBuilder.CreateSphere("lms-muzzle-smoke-"+i,{diameter:.1+i*.025,segments:5},scene),.38+i*.06,.22,1.05,smokeMat));
  // Fixed pool avoids adding/removing lights and recompiling scene shaders.
  const lights = Array.from({length:4},(_,i)=>{
    const light=new PointLight("lms-muzzle-light-"+i,Vector3.Zero(),scene);
    light.diffuse=new Color3(1,.58,.28); light.specular=new Color3(1,.72,.42);
    light.range=14; light.intensity=0; return {light,age:1,duration:.09,peak:200};
  });
  let cursor=0,emitted=0,closed=false;
  const activate=(p:Part,pos:Vector3,rot:Vector3)=>{
    p.life=p.duration; p.mesh.position.copyFrom(pos); p.mesh.rotation.copyFrom(rot);
    p.mesh.scaling.setAll(p.start); p.mesh.isVisible=true;
  };
  const clear=()=>{for(const p of parts){p.life=0;p.mesh.isVisible=false;}for(const e of lights){e.age=e.duration;e.light.intensity=0;}};
  return {
    emit(origin:Vector3,heading:number){
      if(closed)return; emitted++;
      const f=new Vector3(Math.sin(heading),0,Math.cos(heading)), r=new Vector3(f.z,0,-f.x);
      activate(core,origin,new Vector3(0,heading,0)); activate(hot,origin,new Vector3(0,heading,0));
      lobes.forEach((p,i)=>{
        const a=i*Math.PI/2+((emitted*.73)%1)*.8;
        const side=r.scale(Math.cos(a)*.075).add(Vector3.Up().scale(Math.sin(a)*.045));
        activate(p,origin.add(f.scale(.07)).add(side),new Vector3(Math.PI/2+Math.sin(a)*.48,heading,Math.cos(a)*.35));
      });
      activate(jet,origin.add(f.scale(.13)),new Vector3(Math.PI/2,heading,0));
      sparks.forEach((p,i)=>{
        const a=emitted*1.91+i*2.399;
        const d=f.scale(.72+(i%3)*.12).add(r.scale(Math.sin(a)*.16)).add(Vector3.Up().scale(Math.cos(a*1.31)*.12)).normalize();
        activate(p,origin.add(d.scale(.055)),new Vector3(Math.PI/2-Math.atan2(d.y,Math.sqrt(d.x*d.x+d.z*d.z)),heading,Math.atan2(d.x,d.z)));
      });
      smoke.forEach((p,i)=>activate(p,origin.add(f.scale(.035+i*.025)).add(Vector3.Up().scale(i*.018)),new Vector3(0,heading+i*1.7,0)));
      const e=lights[cursor++%lights.length]!;e.light.position.copyFrom(origin);e.age=0;e.duration=.09;e.peak=200;e.light.intensity=200;
    },
    update(dt:number){
      const step=Math.max(0,dt);
      for(const p of parts){if(p.life<=0)continue;p.life=Math.max(0,p.life-step);const t=1-p.life/p.duration;p.mesh.scaling.setAll(Math.max(.015,p.start+(p.end-p.start)*t));if(p.life===0)p.mesh.isVisible=false;}
      for(const e of lights){if(e.age>=e.duration){e.light.intensity=0;continue;}e.age+=step;const t=e.age;e.light.intensity=e.peak*Math.min(1,t/.004)*Math.exp(-16*t)*(1-Math.min(1,t/e.duration)**2);if(e.age>=e.duration)e.light.intensity=0;}
    },
    clear,
    get emitted(){return emitted;},
    dispose(){if(closed)return;closed=true;clear();for(const p of parts)p.mesh.dispose();for(const e of lights)e.light.dispose();hotMat.dispose();coreMat.dispose();gasMat.dispose();emberMat.dispose();smokeMat.dispose();},
  };
}
