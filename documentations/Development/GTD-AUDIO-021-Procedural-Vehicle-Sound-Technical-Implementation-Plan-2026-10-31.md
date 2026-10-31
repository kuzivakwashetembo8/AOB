# GTD-AUDIO-021 — Procedural Vehicle Movement Audio
## Comprehensive Technical Implementation Plan — 31 October 2026

**Decision:** APPROVED DIRECTION (owner: "Today we generate our own"); implement in a dedicated branch and request preview acceptance before merge.  
**Type:** Runtime sound synthesis; no prerecorded engine, tyre or collision audio dependencies.  
**Area:** North Heights initially, reusable G.T.D city-wide.  
**Alternative:** [GTD-AUDIO-022 File-Based Vehicle Audio](./GTD-AUDIO-022-File-Based-Vehicle-Sound-Technical-Implementation-Plan-2026-10-31.md).  
**Release gate:** No merge/production deployment without owner acceptance.

## 1. Problem statement, decision rationale and evidence

G.T.D's accepted 125 source-native Sedans drive using NH012 simulated traffic at 20 Hz with one optional manual free-driving owner. Vehicles presently have no dependable motion-derived motor and road noise. To support convincing urban gameplay, a car must respond audibly to ignition/idle, forward and reverse, accelerator, coasting, braking, nearby pass-bys and eventually physical impacts. Sounds are outputs of mechanical state, not looped ambient music or wheel mesh animation.

Owner selected a procedural-first experiment. The deep-research report recommends recorded RPM samples for maximum immediate realism, but establishes that browser generation is technically feasible, with [Engine_Sim](https://github.com/YigitSalihEmecen/Engine_Sim) as a combustion/AudioWorklet reference and [Velocity Rush](https://github.com/prashant371/velocity-rush) as a lighter-weight browser oscillator/filter example. **This plan consciously trades recorded timbral fidelity for zero sound-bank download, direct control, open-source-friendly provenance, and rapid authoring.** It must not claim a single sine wave recreates a real four-cylinder engine.

Verified platform primitives: [Web Audio API](https://webaudio.github.io/web-audio-api/), [MDN Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API), [AudioContext](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext), [PannerNode](https://developer.mozilla.org/en-US/docs/Web/API/PannerNode), and [Chrome autoplay policy](https://developer.chrome.com/blog/autoplay/).

## 2. Current source-of-truth integration

- `src/game/traffic/nh012-traffic-simulator.ts`: authoritative mutable NH012Agent state `id, x, z, heading, speed, state`, signed velocity for the single manual agent via `manualSignedSpeed()`, `tick`; **no actual engine RPM, transmission, torque, slip sensors or acoustic events**. Avoid fabricating their existence.
- `src/game/experiments/north-heights-city-8.ts`: single Babylon Scene/FreeCamera, 125 identity-stable traffic agents, 20 Hz traffic loop and frame callbacks. `ridingSedanId` is the only driver identity. Integration must follow that ID, not instantiate a second vehicle.
- `src/routes/north-heights-preview.tsx`: owner-accepted HUD and touch/keyboard controls; settings persist via `useSettings`.
- `src/ui/menus/settings-state.ts`: `master`, `effects`, `music`, `muted`; reuse their existing ranges. Audio must respond to changes immediately and use `master*effects` without adding a second settings system.
- `src/game/audio/radio/radio-controller.ts`: `HTMLAudioElement` streaming or music fallback, separate from engine DSP. **Do not edit/decommission/mute it**; trim procedural game SFX master level so vehicle music remains audible. `music` remains independent. No radio src as DSP input.
- `src/game/vehicles/nh-solid-vehicle-collision-017.ts` and NH-TRAFFIC-019: real collisions/impact impulses; future one-shots must originate from these events, never sudden speed drops that could be braking.
- `northHeightsGround`/road pose sampling provides Y coordinates. Audio must sample the same physical vehicle position, and listener position/orientation comes from the camera, not an arbitrary screen center.

## 3. Architecture / contracts

```text
NH012 Agent & manual controls (20Hz) + camera pose
  -> immutable VehicleAudioTelemetry (runtime adapter)
  -> synthetic acoustic drivetrain (pure deterministic math)
  -> WebAudio voice allocator (distance, priority, hysteresis)
  -> procedural Oscillator/Noise/Filter envelopes per audible voice
  -> PannerNode/equalpower spatial field + lowpass + Gain
  -> Traffic bus / Player vehicle bus
  -> Effects bus (settings.master * settings.effects * !settings.muted)
  -> DynamicsCompressor -> AudioContext.destination
```

Contract:
```ts
interface VehicleAudioTelemetry {
 id: string;
 position: {x:number;y:number;z:number};
 velocity: {x:number;z:number};
 heading: number;
 signedSpeedMps: number;       // source manual velocity if driven, else +agent.speed
 throttle: number;             // manual input 0..1; AI approximation via acceleration
 braking: number;              // actual input if available; AI via state
 isPlayerVehicle: boolean;
 dtSeconds: number;
}
interface AcousticDrivetrainState {
 rpm:number; gear:number; normalizedLoad:number; firingHz:number;
 wheelHz:number; longitudinalAcceleration:number;
}
```
Export pure, bounded models and tests. A virtual automatic gear/RPM profile is **sound-only metadata**, never rewrites real NH012 traffic. Establish `idleRpm≈850`, `redline≈6200`, four-cylinder 4-stroke base firing frequency `rpm/60*(4/2)`, load-dependent harmonics and smooth hysteretic virtual shifts. Derived speed → wheel/road noise independent of ignition RPM. Stop must not be silent when player occupies an idling running vehicle.

## 4. Procedural DSP

**Engine oscillator stack** for each audible full-detail voice: firing-rate fundamental/subharmonic plus shaped harmonics (e.g. second and fourth) using sine/triangle/sawtooth blend and a lowpass/bandpass chain; load controls harmonic brightness, not only amplitude. A seeded, cached **procedurally generated** noise `AudioBuffer` with continuous playback supplies low-level intake/friction and tire texture; the noise is created in memory once at runtime, never fetched over network. Keep engine and noise gain nodes separately automatable.

**Idle** keeps low RPM and cyclic irregularity; smooth to accelerator RPM rather than switching an oscillator on/off. **Acceleration** raises virtual RPM as speed/load changes. **Gear changes** use hysteresis and a brief amplitude/RPM dip; absent real drivetrain, label this an acoustic approximation. **Deceleration/coast** removes load and lowers pitch smoothly. **Reverse** remains a low-load acoustic variant, not an implausible high-RPM forward rev. **Road and tires** rise with physical speed, using filtered noise; no squeal just because steering changes. Future slip-driven tire squeal is deferred until an actual slip proxy is available.

**Collision transient stage**: emit a semantic event from the solver with impulse, two IDs, and contact position, and use a short procedural low-frequency thud + filtered noise burst with cooldown by pair. Do not attempt in Stage A unless the event contract is explicitly added and tested. Do not play a crash because a car brakes.

Use `AudioParam.setTargetAtTime` / ramps for every speed/load/distance transition. Do not modulate sample rate from render FPS; never create/release oscillators per frame.

## 5. Spatial audio and mixing

Follow `FreeCamera` position and facing direction via `AudioListener`; listener points where the *actual* third-person camera points. Per-vehicle `PannerNode` with inverse-distance rolloff, a 4–120 m audible field, and dynamic orientation; low-cost equalpower is first-stage default, HRTF only after device profiling. Prioritize full player voice and nearby sources. User in another car must not hear its own sound as a distant AI sound: single agent ID is rebound from traffic to player mix. Gradual crossfade as rider boards/exits. Never allocate 125 full synthesizers.

**Engineering starting budgets, to measure:** Desktop player+max 6 nearby full voices; mobile player+max 3; at most 16–24 mobile voices total after future SFX; 20 Hz telemetry, ~10 Hz voice selection, <1 ms audio main-thread work/frame, negligible audio downloads, no more than 5% mobile audio CPU (profiling proxy). Reuse nodes; hysteresis and 0.15–0.3 s fade prevent popping when traffic crosses the LOD radius. A late player board supersedes the lowest-priority traffic voice immediately.

Source virtualisation: rank `(distance, player status, perceptual importance)`; distant/invisible may be inaudible but must remain active in the traffic simulator. Simplified oscillator tier at medium distance later; a procedural low-volume district traffic bed in Phase B only. Do not implement Doppler exaggeration or HRTF for every vehicle. Use clamp/distance limiting and gain compression to prevent loud 125-car traffic.

## 6. Runtime lifecycle

Create exactly one `AudioContext` in a reusable vehicle audio manager *only after meaningful user interaction*. Calls to `resume()` must be invoked within pointer/keyboard/real gamepad interaction when possible; do not autoplay or assume audio from page load. An unavailable/denied context must leave gameplay functional without retry storms. Avoid console spam.

Visibility hidden / game paused: ramp output to zero and optionally suspend; on resume obtain user gesture where required and restore engine parameters without restart clicks. Exit vehicle: stop treating that vehicle as player priority, but if within earshot it can continue as ordinary audible AI. Page unmount: disconnect/stop sources, close context if owned, clear active node maps and listeners. Do not leak an AudioContext on repeated route navigation or settings toggles. Ensure mute and volume changes apply to both player and world SFX; do not alter radio behavior.

## 7. Implementation packages — ordered with explicit gates

**A. Foundation and one audible Sedan (TODAY)**: Add `src/game/audio/vehicle/procedural-vehicle-audio.ts` (lifecycle, buses, voice pool), `src/game/audio/vehicle/vehicle-audio-model.ts` (pure speed/load→virtual RPM/gear/tone model). Hook North Heights frame after NH012 simulation update; derive signed manual speed from NH012; compute player selection from ridingSedanId; place AI sound origins at accepted road poses; forward settings; activate on user gesture; connect pause/hidden/dispose. Only nearby vehicles get nodes. **No changes to car physics, traffic routing, radio, game loading critical path, or HUD clutter.**

**B. Causal events**: Introduce physical collision-event dispatch with actual contact impulse and debounce; synth impact thuds, horn event, brake texture and true tire slip if available. Prove collisions do not double-fire and traffic following never sounds like a crash.

**C. Acoustic realism**: Add better engine order/firing irregularity, procedural intake/exhaust resonators, off-load timbre, spatial tire noise, limited manual Doppler on AI pass-bys, simple building occlusion using existing geometry with 8–15 Hz ray budgets.

**D. Scale and portability**: Benchmark low-end Android, desktop and PWA session: volume controls, audio unlock, resume, radio balance, voice promotion/eviction, page transitions, CPU FPS delta, stable 125 traffic agents; tune voice budgets from real hardware evidence. Only consider AudioWorklet when normal node graph cannot meet target sound or CPU budget. AudioWorklet would require HTTPS and worklet module lifecycle.

No stage is accepted solely because it builds: owner listens to actual browser output.

## 8. Acceptance test matrix and failure response

| Test | Required observable | Failure response |
|---|---|---|
| Idle | Stable low motor pulse in occupied stationary Sedan | Tune tone; never silence at zero speed |
| Forward | Frequency/intensity rise continuously with acceleration | Fix telemetry mapping; no frame-rate coupling |
| Coast/brake | Audible change and smooth drop without clicks | Smooth AudioParams, fix load parameter |
| Reverse | Moving sound tracks absolute velocity with subdued rpm | Separate sign from intensity |
| Passing AI | Perceptual left-right and near-far movement | Correct Panner/listener coordinates |
| 125 traffic | All traffic/physics remains active; only bounded audible voices | Tighten voice budget, never lower population |
| Mobile + PWA | User-gesture unlock; stable after switch tab and resume | Fix lifecycle without replacing radio |
| Radio simultaneous | Vehicle music still plays and remains audible | Reduce FX bus gain, preserve RadioController |
| Settings | master/effects/muted apply immediately; no music setting regression | Correct bus wiring |
| 10 route remounts | No leaked active AudioContexts/nodes | Dispose resource graph |
| Traffic impact | Stage B only; true contact event, no false braking crash | Gate collision cues on solver |
| Offline | Engine sounds work with zero downloaded sound assets | Eliminate network audio dependencies |

Unit test `AcousticDrivetrainState` finite bounds, neutral/speed limits, shift hysteresis, positive/negative velocity, smooth curves and nonzero idle. Fake AudioContext nodes or browser-based tests verify one allocation per car and lifecycle; run project build and full Vitest suite plus manual sound tests on desktop/Android.

## 9. Rollback, observability and release protocol

New system lives only behind a dedicated feature branch until owner greenlights it. If audio errors occur, fail closed to silence, not to failed gameplay. No new settings flags unless existing configuration cannot safely govern sound. Put debug stats in development diagnostics only (active voices, allocations, suppressed voices, context state, time since resume); no new always-on overlay. Provide preview URL and clear A/B test instructions. On rejection withdraw/decommission branch under existing GTD DDD policy; do not silently change accepted sound.

## 10. References and qualification

- Web Audio 1.1 spec: https://webaudio.github.io/web-audio-api/
- MDN: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- AudioContext/autoplay: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext ; https://developer.chrome.com/blog/autoplay/
- PannerNode: https://developer.mozilla.org/en-US/docs/Web/API/PannerNode
- Procedural examples: https://github.com/YigitSalihEmecen/Engine_Sim ; https://github.com/prashant371/velocity-rush ; https://github.com/KhazP/librecorsa
- Research on multidimensional engine timbre: https://aes.org/publications/elibrary-page/?id=22623 ; https://arxiv.org/abs/2603.07584

**Evidence label:** Web Audio API support and cited browser-game examples are externally verified. Cylinder count, virtual gear algorithm, frequencies, acoustic character, performance budgets and staged thresholds are **proposed G.T.D design choices**, not measured engine specifications. Today’s generated tones cannot be represented as indistinguishable from a recorded real sedan.
