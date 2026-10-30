import type {RadioStation} from "./radio-stations";
export type RadioStatus = "off" | "connecting" | "playing" | "buffering" | "error";
export interface RadioPreferences { enabled: boolean; selectedStationId: string | null; volume: number; }
const KEY = "gtd.radio.preferences.v1";
const defaults: RadioPreferences = {enabled:true,selectedStationId:null,volume:0.5};
export class RadioController {
  private audio: HTMLAudioElement | null = null;
  private generation = 0;
  private inVehicle = false;
  private paused = false;
  private hidden = false;
  private status: RadioStatus = "off";
  private prefs: RadioPreferences = {...defaults};
  private station: RadioStation | null = null;
  private listeners = new Set<() => void>();
  constructor() {
    if(typeof window !== "undefined") {
      try { const value = JSON.parse(localStorage.getItem(KEY) || "null"); if(value && typeof value === "object") this.prefs = {enabled:value.enabled !== false, selectedStationId:typeof value.selectedStationId === "string" ? value.selectedStationId : null, volume:typeof value.volume === "number" && Number.isFinite(value.volume) ? Math.max(0,Math.min(1,value.volume)) : 0.5}; } catch { /* ignore corrupt preferences */ }
    }
  }
  subscribe(listener:()=>void) { this.listeners.add(listener); return ()=>{this.listeners.delete(listener);}; }
  getSnapshot() { return {status:this.status,station:this.station,preferences:{...this.prefs}}; }
  private notify() { for(const listener of this.listeners) listener(); }
  private persist() { try { localStorage.setItem(KEY,JSON.stringify(this.prefs)); } catch { /* storage optional */ } this.notify(); }
  private ensureAudio() { if(!this.audio) { this.audio = new Audio(); this.audio.preload = "none"; this.audio.addEventListener("waiting",()=>{if(this.status==="playing"){this.status="buffering";this.notify();}}); this.audio.addEventListener("playing",()=>{if(this.inVehicle&&!this.paused&&!this.hidden){this.status="playing";this.notify();}}); this.audio.addEventListener("error",()=>{if(this.inVehicle){this.status="error";this.notify();}}); } return this.audio; }
  private stop() { this.generation++; if(this.audio){this.audio.pause();this.audio.removeAttribute("src");this.audio.load();} this.status="off";this.notify(); }
  async tune(station:RadioStation) { if(!station.streamUrl.startsWith("https://")) return; this.station=station;this.prefs.selectedStationId=station.id;this.persist();await this.play(); }
  private async play() { if(!this.station||!this.prefs.enabled||!this.inVehicle||this.paused||this.hidden)return;const audio=this.ensureAudio();const generation=++this.generation;audio.pause();audio.src=this.station.streamUrl;audio.volume=this.prefs.volume;this.status="connecting";this.notify();try {await audio.play();if(generation!==this.generation||!this.inVehicle||this.paused||this.hidden){audio.pause();return;}this.status="playing";this.notify();}catch {if(generation===this.generation){this.status="error";this.notify();}} }
  enterVehicle(){this.inVehicle=true;void this.play();}
  exitVehicle(){this.inVehicle=false;this.stop();}
  setPaused(value:boolean){this.paused=value;if(value)this.stop();else void this.play();}
  setHidden(value:boolean){this.hidden=value;if(value)this.stop();else void this.play();}
  setEnabled(value:boolean){this.prefs.enabled=value;this.persist();if(!value)this.stop();else void this.play();}
  setVolume(value:number){this.prefs.volume=Math.max(0,Math.min(1,value));if(this.audio)this.audio.volume=this.prefs.volume;this.persist();}
  dispose(){this.stop();this.listeners.clear();this.audio=null;}
}
