# GTD-AUDIO-022 — File-Based Vehicle Sound Banks
## Comprehensive Technical Implementation Plan — 31 October 2026

**Status:** DOCUMENTATION ONLY. Recorded-sample strategy reserved for future assessment and explicit owner approval.  
**Owner direction:** "Today we generate our own"; do not implement, download or commission files in this work package.  
**Companion:** [GTD-AUDIO-021 Procedural Vehicle Audio](./GTD-AUDIO-021-Procedural-Vehicle-Sound-Technical-Implementation-Plan-2026-10-31.md).  
**Goal:** Enable future substitution of carefully licensed and authored sound recordings without replacing car physics, traffic or audio settings.

## 1. Executive architecture decision

For higher physical timbral realism, use **recorded, synchronized multi-RPM loops** rather than a single engine MP3 sped up linearly. The external deep research found this the preferred short-term production realism route: idle/low/mid/high RPM samples, load-varying recording layers, small playback-rate correction, and smooth crossfade. The present owner decision nevertheless authorizes procedural generation first because authored audio banks do not yet exist and the generated path allows immediate control.

File-based audio should be a **pluggable renderer** of the exact same telemetry contract defined by AUDIO-021. Audio transport and waveform origin change; NH012 physics and game logic do not.

## 2. Real-world evidence and integration baseline

- Browser audio primitives: [Web Audio](https://webaudio.github.io/web-audio-api/), [AudioBufferSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode), [decodeAudioData](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData), [AudioBuffer](https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer), [PannerNode](https://developer.mozilla.org/en-US/docs/Web/API/PannerNode).
- File encoding and support must be confirmed on targeted browsers: [MDN audio-codec guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Audio_codecs).
- Multi-layer racing browser example: [LibreCorsa](https://github.com/KhazP/librecorsa).
- Middleware later: [FMOD HTML5](https://www.fmod.com/docs/2.04/api/platforms-html5.html) (WASM and Worklet/browser complexity; omit from initial implementation). Wwise browser support is unverified and not assumed.
- Existing G.T.D: `NH012TrafficSimulator` at 20Hz is the only traffic movement authority; 125 logical Sedan variants use one accepted visual archetype. RadioController streams station/primary music through separate `HTMLAudioElement`. Preserve it.
- Existing G.T.D Settings: `master, effects, music, muted`. File-based sounds participate in effects and master buses, while live radio remains unaffected by media-element rewiring.
- No assumption that usable licensed `engine*.mp3` assets are present: inventory must be proven through repository inspection before any implementation.

## 3. Source and licensing acceptance gate

Nothing is admitted into `/public/audio/vehicles/` without a provenance record containing creator, source URL, license, recording date (if available), modification rights, whether attribution is required, and an export manifest with SHA256. Reject unclear terms, non-commercial-only audio for a potentially public game, unlicensed game rips, trademarks implying vehicle endorsement, or sourced content whose download/redistribution conditions prohibit the repository's usage. Record whether the file is entirely synthesized by the game, independently recorded, or third-party licensed. Respect upstream licenses on cloned DSP/code examples as well.

Sound acquisition options:
1. Owner-created field recordings with written permission for vehicle, location and participants as applicable, and no copyrighted radio/music in the source.
2. Commissioned engineering recordings with assignment of distribution and derivative rights.
3. Reusable samples from licensed asset libraries after explicit license review.
4. Procedurally synthesized/printed-to-file offline derivatives with documented pipeline and owner-approved asset status.

Record 48kHz WAV/PCM masters in a private or approved source-assets location, not unnecessarily in publicly served static assets. Never commit the same multigigabyte raw session into Git just to test small delivery samples.

## 4. Sample manifest and format

```text
public/audio/vehicles/sedan-ice-v1/
  idle.webm        low-off.webm        low-on.webm
  mid-off.webm     mid-on.webm         high-off.webm high-on.webm
  shift-up.webm    shift-down.webm     tire-roll.webm
  scrub-01.webm    scrub-02.webm       impact-light-01.webm
  impact-medium-01.webm  impact-heavy-01.webm horn-01.webm
  *.mp3             (fallback subset only)
  bank.json         (approved authoring manifest)
documentations/Audio/vehicle-sound-license-register.md
```

All filenames and distribution files are **proposed**, not existing paths. Store mono engine loops for 3D panning, typically 3–5 s each; annotate recording RPM, true loop start/end sample positions, tonal/loudness normalization, source vehicle archetype, load axis, loudness calibration, source format, SHA256, and compression/codec variants. Distinguish interior and exterior microphones once supported; not all engine-bank recordings can be spatially rendered from the same stereo file.

Initial minimum bank for one Sedan engine class: 4 RPM layers (idle at ~850, low at ~1800, mid ~3200, high ~5200); add on/off-load pairs in next stage. Asset budget estimates, not guaranteed: 1–3 MB compressed startup bank; compressed mono Opus/WebM or Ogg where supported, MP3 fallback. Short one-shots decoded. Large ambience and vehicle radio streamed separately. At 48kHz, float32 mono PCM is ~192kB per second after decode: a 5s loop is ~0.96MB in RAM regardless of 30kB download.

A stored, auditable manifest schema:
```ts
interface EngineBankManifest {
 id:string; revision:string; archetype:"sedan-ice";
 author:string; licenseId:string; attributionText:string;
 samples:{role:"idle"|"low-on"|"low-off"|"mid-on"|"mid-off"|"high-on"|"high-off"|
    "shift-up"|"shift-down"|"rolling"|"impact"|"horn";
   src:string; fallbackSrc?:string; mime:string; rpm?:number;
   loopStartSec?:number;loopEndSec?:number;sha256:string; gainDb?:number
 }[];
}
```
Manifest validation must be a CI gate: every referenced file exists and size/format/hash checks pass. Missing/invalid file must fail bank admission; runtime can fall back to AUDIO-021 procedural instead of silently losing all car sounds.

## 5. Playback engine and shared telemetry

Prefer one shared `AudioContext`, explicit `vehicle`, `traffic`, `SFX`, `radio` only when media routing is intentionally adopted, and master gain/compressor; no second context per car. A dedicated `RecordedEngineVoice` consumes the same immutable `VehicleAudioTelemetry` defined in AUDIO-021.

For RPM-indexed playback:
- RPM from actual drivetrain when it exists; until then the **same acoustically estimated RPM/gear output** of AUDIO-021.
- Select two adjacent recorded RPM layers and equal-power crossfade them. Small pitch shift only (proposed 0.78–1.28 playbackRate clamp); shifting an 1800rpm sample to 6200rpm would be artificial.
- Throttle/load controls separate `on/off` layer weights or dynamic EQ/lowpass if only neutral loops are available. Avoid pitch-only treatment of throttle.
- Use `AudioParam` ramps to avoid clicks; implement seamless loop points, zero-crossing edits, and controlled gain fade before disposing.
- Gear changes use real events when physics provides them, otherwise acoustically simulated gearbox events clearly identified as synthetic placeholders.
- Tire skid tied to slip ratio, not steering angle. Braking friction, reverse whine and collisions use discrete events, not naive sudden-speed detection.
- Collision sound levels use actual impulse from the existing solid collision solver, short per-pair cooldown, variation and gain ceiling.
- For sound bank switches while driving, crossfade engines over ~150–300ms and avoid one-off node spikes.

Keep player car selected by NH012 `ridingSedanId`, not a second actor or visual template. AI audio follows exact `agent.id` and `(x,y,z)`.

## 6. 3D spatialization, traffic voice budget and radio balance

Borrow the procedural mixer infrastructure: camera as `AudioListener`, moving exterior engine `PannerNode`, inverse-distance attenuation, lowpass on actual occluded paths, optional modest manual Doppler for passing AI only, and effects/master settings. **Do not ever decode 125 complete multi-layer banks per agent.** Decode audio files once per archetype and reuse `AudioBuffer` objects; make live `AudioBufferSourceNode`/Gain/Panner voices only for audible agents.

Proposed budgets:
- Desktop: full player + 8 nearest full-detail traffic voices; mobile: full player + 4; exact capacity determined by test device.
- Medium tier: simplified one loop, max desktop 12/mobile 6. Virtualize or mix a distant traffic bed beyond that.
- Decoded SFX bank memory desktop ≤48MB, Android ≤24MB. Avoid loading the full matrix at bootstrap. Start by loading the active driver's 4-loop bank on demand while other assets stream or remain absent.
- Mobile initial audio download ≤3MB, desktop ≤5MB. CPU audio average <5% Android, <3% desktop; main thread audio update <1ms/frame.
- Repeatable output-level measurement; radio should remain intelligible at normal master/music settings without hard ducking every accelerator press.

## 7. Browser playback, network and offline policy

Request media only after the user has initiated play; `AudioContext.resume()` must occur from a real user gesture due to autoplay restrictions. `fetch` + `decodeAudioData` for small buffers; let the browser choose media formats via capability tests, not extension guessing. `AudioBufferSourceNode` can play a buffer repeatedly but each source node instance starts only once—allocate again on reactivation, reuse decoded `AudioBuffer`.

Prioritize network errors: absent asset / unsupported codec → use AUDIO-021 generator if enabled, not repeated downloads. Set content-type and CORS correctly. Never fetch station streams as engine loops. For PWA, add active-bank files to an explicitly versioned offline pack with integrity and budget checks. During intermittent connectivity, keep the already decoded engine playing and defer new sound-bank loads. Avoid stalling first-playable scene on sound download.

Audio lifecycle and mute semantics must match procedural plan: no leaks across tabs/routes, pause/visibility and resuming, no duplicated sound after re-boarding, no audible device autoplay violation.

## 8. Implementation stages (future; NOT authorized today)

**F0 — Acquisition/licensing:** Inventory real assets and confirm redistribution rights, establish manifest, hash, master recording/export format, codec matrix, signed source register.

**F1 — Minimal recorded Sedan:** Implement `RecordedEngineVoice` with 4 mono seamless RPM-indexed loops sharing AUDIO-021 telemetry, mixer, lifecycle and 3D panners. Switch via runtime provider factory; initially use one player car only. Validate the actual profile on desktop and Android. No automatic switch from approved procedural audio without owner consent.

**F2 — Throttle/load and transients:** Author on/off load, gear shifts, tire, friction, horn and physically emitted collision impacts. Test timing/loop seams and one-shot concurrency.

**F3 — Spatial AI and congestion:** Nearby 4–8 vehicles with audio LOD, road-segment or district ambient beds streamed, occlusion, modest Doppler, and sound during naturally formed (future owner-approved) early-morning jams. Do not fake congestion by freezing NH012.

**F4 — Multiple archetypes and cockpit acoustics:** Alternative engine banks only after their actual models enter accepted traffic, camera-dependent interior/exterior mix, tunnels, parked/engine-off logic, culling and audio memory audits.

**F5 — Middleware evaluation:** Evaluate FMOD WASM after sufficient authored content justifies it; measure downloaded WASM and banks, browser build constraints, no-geometry HTML5 limitations, AudioWorklet/pthread/CORS requirements. Reject Wwise until verified HTML5 support, legal terms and operational costs.

## 9. Required tests, regression gates and failure modes

| Area | Acceptance | Critical failures |
|---|---|---|
| Loop seams | No audible transient at boundaries under sustained RPM | Clicks, time drift, zero-crossing discontinuity |
| RPM interpolation | Smooth gradual blend between idle/low/mid/high | Sudden jumps or exaggerated pitch shifts |
| Load axis | Throttle adds credible rasp; coast remains softer | Loudness-only illusion with no timbre change |
| Inputs | Brake/reverse/pass-by audibly reflect actual state | Speed tied to frame rate |
| Collision | Cue scheduled at physical impact, once per pair | Brake causing impact sound |
| Traffic | 125 agents continue unaffected; voice allocation bounded | 125 decoded banks or duplicated voices |
| Volume | Existing master/effects/mute and radio unaffected | radio silenced/second context leaked |
| Browser | Chrome/Edge/Firefox/Safari compatibility matrix | Invalid MIME or unsupported codec |
| Mobile | Android 20–30Hz telemetry, no audio stutter | CPU spike during scene streaming |
| Offline | Active vehicle bank available after cold offline install | Unbounded cache/failed gameplay |
| License | Audit manifest and owner sign-off | Unlicensed recording or repository leak |
| Fallback | Missing bank gracefully returns to procedural | No vehicle audio without user awareness |

The tests must include fake audio graph, manifest parser, codec selection, LOD promotion and lifecycle plus browser/manual listen tests. Keep autoplay unlocking manual and visible to developer diagnostics if necessary; no new mandatory splash screen.

## 10. Comparative decision / migration contract

Procedural `GTD-AUDIO-021` is the immediate development engine. Recorded `GTD-AUDIO-022` is a later quality upgrade. Both MUST implement a common `VehicleSoundRenderer` interface:
```ts
interface VehicleSoundRenderer {
 unlockFromGesture():Promise<void>;
 sync(cars:readonly VehicleAudioTelemetry[],listener:ListenerPose,dt:number):void;
 applySettings(master:number,effects:number,muted:boolean):void;
 pause(paused:boolean):void;
 dispose():void;
}
```
Keep public APIs small and do not add a generic middleware framework prematurely. A later explicit user selection could choose generated, file-based or a hybrid per vehicle class; switching provider must preserve radio, HUD, physics, traffic IDs and settings.

**Rollback:** disable the new recorded provider, return to procedural with same telemetry; there must be no changes to NH012 vehicle movement.

## 11. References and evidence classification

Authoritative interfaces: https://webaudio.github.io/web-audio-api/ ; https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode ; https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/decodeAudioData ; https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer ; https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Audio_codecs  
Developer reference: https://github.com/KhazP/librecorsa ; https://threejs.org/examples/  
Middleware: https://www.fmod.com/docs/2.04/api/platforms-html5.html  
**Evidence label:** Browser audio mechanisms and references are documented by their maintainers; G.T.D sound-bank list, sizes, RPM values, voice limits and scheduling are engineering proposals to validate, not measured assets.

**Final status:** This document confers no approval to import third-party sounds, alter production, or start file-based implementation. Proceed only after owner explicitly authorizes F0/F1.
