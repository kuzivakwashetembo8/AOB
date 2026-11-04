/** GTD-AUDIO-021: real-time, file-free vehicle sound renderer for NH012 traffic.
 * All oscillators/noise are created IN the browser; no samples fetched.
 * This module is never the owner of vehicle movement, traffic or radio.
 */
import {
  acousticStep021,generateAudioNoise021,selectAudibleVehicles021,
  type AcousticState021,type VehicleAudioTelemetry021,type VehicleAudioListener021,
} from "./vehicle-audio-model-021";

export interface ProceduralVehicleSoundSettings021 {
  master:number;effects:number;muted:boolean;
}
type EnginePartial021={state:AcousticState021;lastSpeed:number};
const bounded=(v:number,a:number,b:number)=>Number.isFinite(v)?Math.max(a,Math.min(b,v)):a;
const fade=(param:AudioParam,level:number,time:number,tau=.055)=>
  param.setTargetAtTime(level,time,tau);

/** Stable audio graph per audible traffic identity, NOT one graph per 125 cars. */
class ProceduralVoice021 {
  readonly panner:PannerNode;
  readonly output:GainNode;
  readonly engineFilter:BiquadFilterNode;
  readonly engineOsc:OscillatorNode[]=[];
  readonly engineGain:GainNode[]=[];
  readonly rollingGain:GainNode;
  readonly rollingSource:AudioBufferSourceNode;
  readonly rollingFilter:BiquadFilterNode;
  private isPlayer=false;
  private dead=false;
  private tone:AcousticState021|undefined;
  private lastSpeed=0;
  private driveCycle=0;
  constructor(
    readonly id:string,
    private readonly ctx:AudioContext,
    private readonly playerBus:AudioNode,
    private readonly trafficBus:AudioNode,
    noise:AudioBuffer,
  ){
    this.output=ctx.createGain();this.output.gain.value=0;
    this.panner=ctx.createPanner();
    this.panner.panningModel="equalpower";
    this.panner.distanceModel="inverse";
    this.panner.refDistance=4;
    this.panner.maxDistance=90;
    this.panner.rolloffFactor=1.45;
    this.output.connect(this.panner);
    this.panner.connect(trafficBus);
    this.engineFilter=ctx.createBiquadFilter();
    this.engineFilter.type="lowpass";this.engineFilter.frequency.value=420;
    this.engineFilter.Q.value=.35;this.engineFilter.connect(this.output);
    for(const [kind,gain] of [
      ["sine",.36],["triangle",.19],["sawtooth",.032],
    ] as const){
      const oscillator=ctx.createOscillator();
      oscillator.type=kind;
      const g=ctx.createGain();g.gain.value=gain;
      oscillator.connect(g);g.connect(this.engineFilter);
      oscillator.start();
      this.engineOsc.push(oscillator);this.engineGain.push(g);
    }
    this.rollingSource=ctx.createBufferSource();
    this.rollingSource.buffer=noise;
    this.rollingSource.loop=true;
    this.rollingFilter=ctx.createBiquadFilter();
    this.rollingFilter.type="bandpass";
    this.rollingFilter.frequency.value=400;
    this.rollingFilter.Q.value=.28;
    this.rollingGain=ctx.createGain();
    this.rollingGain.gain.value=0;
    this.rollingSource.connect(this.rollingFilter);
    this.rollingFilter.connect(this.rollingGain);
    this.rollingGain.connect(this.output);
    this.rollingSource.start();
  }
  update(input:VehicleAudioTelemetry021,dt:number):void{
    if(this.dead)return;
    const now=this.ctx.currentTime;
    if(this.isPlayer!==input.isPlayer){
      this.isPlayer=input.isPlayer;
      this.panner.disconnect();
      this.panner.connect(input.isPlayer?this.playerBus:this.trafficBus);
    }
    // Audio "gear" and engine RPM are *virtual estimates*; they do not feed
    // back to the authoritative NH012 traffic simulator.
    let throttle=bounded(input.throttle,0,1);
    if(!throttle){
      const accel=(Math.abs(input.signedSpeedMps)-this.lastSpeed)/Math.max(.02,dt);
      throttle=bounded(accel/3,0,1);
    }
    this.tone=acousticStep021({...input,throttle},this.tone,dt);
    this.lastSpeed=Math.abs(input.signedSpeedMps);
    const {firingHz,load,roadLevel,rpm}=this.tone;
    // POI-008: a smooth, repeating low→moderate→high→moderate→low
    // phrase while driving, over the *real speed/load* drivetrain envelope.
    // Time-based, no oscillator restarts or frame-rate dependent steps.
    if(this.tone.speedMps>.6)this.driveCycle=(this.driveCycle+Math.max(0,dt)/5.8)%1;
    const phrase=this.tone.speedMps>.6?(1-Math.cos(this.driveCycle*Math.PI*2))*.5:0;
    const f=Math.max(20,firingHz*(1+.12*phrase));
    fade(this.engineOsc[0]!.frequency,f,now,.07);
    fade(this.engineOsc[1]!.frequency,f*2.1,now,.07);
    fade(this.engineOsc[2]!.frequency,f*3.8,now,.07);
    const bright=bounded((rpm-850)/5300,0,1);
    fade(this.engineFilter.frequency,300+bright*1200+load*1500+phrase*950,now,.075);
    fade(this.engineGain[0]!.gain,.28+load*.15+phrase*.11,now);
    fade(this.engineGain[1]!.gain,.115+load*.15+phrase*.085,now);
    fade(this.engineGain[2]!.gain,.012+load*.045,now);
    fade(this.rollingFilter.frequency,230+roadLevel*1200,now);
    fade(this.rollingGain.gain,roadLevel*(.04+.028*roadLevel),now);
    // A car at zero velocity still idles. Avoid toggling source nodes.
    fade(this.output.gain,input.isPlayer?.60:.27,now,.085);
    this.panner.positionX.setTargetAtTime(input.x,now,.045);
    this.panner.positionY.setTargetAtTime(input.y+.65,now,.045);
    this.panner.positionZ.setTargetAtTime(input.z,now,.045);
  }
  stop():void{
    if(this.dead)return;this.dead=true;
    const now=this.ctx.currentTime;
    fade(this.output.gain,0,now,.035);
    const ending=now+.18;
    // Sources can start only once. Stop on eviction and recreate on promotion;
    // cached generated noise buffer itself is safely reusable.
    for(const osc of this.engineOsc){try{osc.stop(ending);}catch{/* closed context */}}
    try{this.rollingSource.stop(ending);}catch{/* closed context */}
    this.rollingSource.onended=()=>{
      this.engineFilter.disconnect();
      this.rollingFilter.disconnect();
      this.rollingGain.disconnect();
      this.output.disconnect();
      this.panner.disconnect();
    };
  }
}
export class ProceduralVehicleAudio021 {
  private ctx:AudioContext|null=null;
  private playerBus:GainNode|null=null;
  private trafficBus:GainNode|null=null;
  private masterBus:GainNode|null=null;
  private noise:AudioBuffer|null=null;
  private voices=new Map<string,ProceduralVoice021>();
  private enabled=false;
  private closed=false;
  private paused=false;
  private hidden=false;
  private volume:ProceduralVehicleSoundSettings021={master:80,effects:85,muted:false};
  private selectionElapsed=.2;
  private selections:string[]=[];
  private readonly lastHorn=new Map<string,number>();
  private readonly budget:number;
  constructor(mobile:boolean){this.budget=mobile?3:6;}
  get isUnlocked():boolean{return !!this.ctx&&this.enabled&&this.ctx.state==="running";}
  get statistics(){return {
    active:this.voices.size,budget:this.budget,
    context:this.ctx?.state??"not-created",
  }; }
  /** Must be called synchronously from an actual keyboard/pointer game action.
   * Never construct an AudioContext at module import or during scene loading. */
  unlockFromGesture():void{
    if(this.closed)return;
    try{
      if(!this.ctx){
        const ctx=new AudioContext({latencyHint:"interactive"});
        this.ctx=ctx;
        const comp=ctx.createDynamicsCompressor();
        comp.threshold.value=-18;comp.knee.value=16;
        comp.ratio.value=3;comp.attack.value=.006;comp.release.value=.21;
        this.masterBus=ctx.createGain();
        this.playerBus=ctx.createGain();
        this.trafficBus=ctx.createGain();
        this.playerBus.gain.value=.75;
        this.trafficBus.gain.value=.55;
        this.playerBus.connect(this.masterBus);
        this.trafficBus.connect(this.masterBus);
        this.masterBus.connect(comp);
        comp.connect(ctx.destination);
        const frames=Math.round(ctx.sampleRate*1.15);
        const buffer=ctx.createBuffer(1,frames,ctx.sampleRate);
        // TS typed-array generics differ between ArrayBuffer and
        // SharedArrayBuffer; getChannelData().set accepts an ArrayLike safely.
        buffer.getChannelData(0).set(generateAudioNoise021(frames));
        this.noise=buffer;
        this.applyVolume();
      }
      if(this.ctx?.state==="suspended"){
        void this.ctx.resume().then(()=>{
          if(!this.closed)this.enabled=true;
        }).catch(()=>{this.enabled=false;});
      }else this.enabled=this.ctx?.state==="running";
    }catch{
      // Sound failure must not alter locomotion, traffic or RadioController.
      this.enabled=false;
    }
  }
  setSettings(next:ProceduralVehicleSoundSettings021):void{
    this.volume=next;this.applyVolume();
  }
  setPaused(value:boolean):void{this.paused=value;this.applyVolume();}
  setHidden(value:boolean):void{this.hidden=value;this.applyVolume();}
  private applyVolume():void{
    const ctx=this.ctx,bus=this.masterBus;
    if(!ctx||!bus)return;
    const audible=!this.volume.muted&&!this.paused&&!this.hidden;
    const master=bounded(this.volume.master,0,100)/100;
    const effects=bounded(this.volume.effects,0,100)/100;
    // Reserved headroom: live radio uses an independent HTMLAudioElement.
    fade(bus.gain,audible?master*effects*.42:0,ctx.currentTime,.06);
  }
  /** Procedural impact transients: one physical contact = one audible step.
   * Caller provides grounded, gait-synchronized contacts; no free-running loop. */
  playFootstep(running:boolean):void{
    const ctx=this.ctx,noise=this.noise,bus=this.playerBus;
    if(!ctx||!noise||!bus||!this.isUnlocked||this.paused||this.hidden||this.volume.muted)return;
    const now=ctx.currentTime,src=ctx.createBufferSource(),filter=ctx.createBiquadFilter();
    const gain=ctx.createGain();
    src.buffer=noise;src.playbackRate.value=running?1.28:.93;
    filter.type="lowpass";filter.frequency.value=running?930:640;
    gain.gain.setValueAtTime(.001,now);
    gain.gain.exponentialRampToValueAtTime(running?.22:.16,now+.012);
    gain.gain.exponentialRampToValueAtTime(.001,now+(running?.12:.17));
    src.connect(filter);filter.connect(gain);gain.connect(bus);
    src.onended=()=>{src.disconnect();filter.disconnect();gain.disconnect();};
    src.start(now);src.stop(now+.19);
  }
  /** POI-009: gesture-unlocked, zero-download glass-map interface cue. */
  playMapCue(kind:"open"|"close"):void{
    this.unlockFromGesture();
    const ctx=this.ctx,bus=this.playerBus;
    if(!ctx||!bus||this.paused||this.hidden||this.volume.muted)return;
    const now=ctx.currentTime;
    const oscillator=ctx.createOscillator(),gain=ctx.createGain();
    oscillator.type="sine";
    oscillator.frequency.setValueAtTime(kind==="open"?560:740,now);
    oscillator.frequency.exponentialRampToValueAtTime(kind==="open"?820:460,now+.11);
    gain.gain.setValueAtTime(.001,now);
    gain.gain.linearRampToValueAtTime(.08,now+.012);
    gain.gain.exponentialRampToValueAtTime(.001,now+.14);
    oscillator.connect(gain);gain.connect(bus);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    oscillator.start(now);oscillator.stop(now+.145);
  }
  /** POI-009: synthesized melee and pistol cues, no network assets or impacts. */
  playCombatCue(kind:"punch"|"shoot"):void{
    this.unlockFromGesture();
    const ctx=this.ctx,bus=this.playerBus,noise=this.noise;
    if(!ctx||!bus||!noise||this.paused||this.hidden||this.volume.muted)return;
    const now=ctx.currentTime,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter();
    const gain=ctx.createGain();
    source.buffer=noise;
    filter.type=kind==="shoot"?"bandpass":"lowpass";
    filter.frequency.value=kind==="shoot"?1500:460;
    filter.Q.value=kind==="shoot"?.7:.3;
    gain.gain.setValueAtTime(.001,now);
    gain.gain.linearRampToValueAtTime(kind==="shoot"?.43:.18,now+.003);
    gain.gain.exponentialRampToValueAtTime(.001,now+(kind==="shoot"?.22:.15));
    source.connect(filter);filter.connect(gain);gain.connect(bus);
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
    source.start(now);source.stop(now+(kind==="shoot"?.23:.16));
    if(kind==="shoot"){
      const osc=ctx.createOscillator(),tone=ctx.createGain();
      osc.type="triangle";osc.frequency.setValueAtTime(180,now);
      osc.frequency.exponentialRampToValueAtTime(70,now+.13);
      tone.gain.setValueAtTime(.10,now);
      tone.gain.exponentialRampToValueAtTime(.001,now+.15);
      osc.connect(tone);tone.connect(bus);
      osc.onended=()=>{osc.disconnect();tone.disconnect();};
      osc.start(now);osc.stop(now+.16);
    }
  }
  /** Positional vehicle horn for a genuine obstruction, rate-limited per car. */
  playHorn(id:string,x:number,y:number,z:number):boolean{
    const ctx=this.ctx,bus=this.trafficBus;
    if(!ctx||!bus||!this.isUnlocked||this.paused||this.hidden||this.volume.muted)return false;
    const now=ctx.currentTime;
    if(now-(this.lastHorn.get(id)??-100)<3.2)return false;
    this.lastHorn.set(id,now);
    const panner=ctx.createPanner(),gain=ctx.createGain();
    panner.panningModel="equalpower";panner.distanceModel="inverse";
    panner.refDistance=6;panner.maxDistance=65;panner.rolloffFactor=1.4;
    panner.positionX.value=x;panner.positionY.value=y+1;panner.positionZ.value=z;
    gain.gain.setValueAtTime(.001,now);
    gain.gain.linearRampToValueAtTime(.18,now+.025);
    gain.gain.setValueAtTime(.18,now+.19);
    gain.gain.exponentialRampToValueAtTime(.001,now+.34);
    gain.connect(panner);panner.connect(bus);
    let ended=0;
    for(const hz of [370,440]){
      const osc=ctx.createOscillator();osc.type="sawtooth";osc.frequency.value=hz;
      osc.connect(gain);osc.onended=()=>{osc.disconnect();if(++ended===2){gain.disconnect();panner.disconnect();}};
      osc.start(now);osc.stop(now+.36);
    }
    return true;
  }
  /** Audio-LOD selection is independent of Babylon mesh LOD.
   * Call on a bounded cadence (20Hz max), not on every physics substep. */
  sync(cars:readonly VehicleAudioTelemetry021[],
      listener:VehicleAudioListener021,dtSeconds:number):void{
    const ctx=this.ctx;
    if(!ctx||!this.isUnlocked||this.closed||this.paused||this.hidden||
      !this.playerBus||!this.trafficBus||!this.noise)return;
    const dt=bounded(dtSeconds,.005,.2);
    const now=ctx.currentTime;
    const ear=ctx.listener;
    ear.positionX.setTargetAtTime(listener.x,now,.06);
    ear.positionY.setTargetAtTime(listener.y,now,.06);
    ear.positionZ.setTargetAtTime(listener.z,now,.06);
    const fx=listener.forwardX,fy=listener.forwardY,fz=listener.forwardZ;
    ear.forwardX.setTargetAtTime(fx,now,.06);
    ear.forwardY.setTargetAtTime(fy,now,.06);
    ear.forwardZ.setTargetAtTime(fz,now,.06);
    ear.upX.setTargetAtTime(0,now,.06);
    ear.upY.setTargetAtTime(1,now,.06);
    ear.upZ.setTargetAtTime(0,now,.06);
    this.selectionElapsed+=dt;
    const playerId=cars.find(c=>c.isPlayer)?.id??null;
    if(this.selectionElapsed>.14||
       (playerId&&!this.selections.includes(playerId))){
      this.selectionElapsed=0;
      this.selections=selectAudibleVehicles021(cars,listener,playerId,this.budget);
      const selected=new Set(this.selections);
      for(const [id,v] of this.voices){
        if(!selected.has(id)){v.stop();this.voices.delete(id);}
      }
    }
    const index=new Map(cars.map(c=>[c.id,c]));
    for(const id of this.selections){
      const data=index.get(id);
      if(!data)continue;
      let voice=this.voices.get(id);
      if(!voice){
        voice=new ProceduralVoice021(id,ctx,this.playerBus,this.trafficBus,this.noise);
        this.voices.set(id,voice);
      }
      voice.update(data,dt);
    }
  }
  dispose():void{
    if(this.closed)return;this.closed=true;
    for(const voice of this.voices.values())voice.stop();
    this.voices.clear();this.selections=[];this.lastHorn.clear();
    this.playerBus?.disconnect();
    this.trafficBus?.disconnect();
    this.masterBus?.disconnect();
    if(this.ctx){void this.ctx.close().catch(()=>{});}
    this.ctx=null;this.noise=null;this.playerBus=null;
    this.trafficBus=null;this.masterBus=null;this.enabled=false;
  }
}
