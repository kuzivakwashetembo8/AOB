# GTD-NH-ATM-022 — Living North Heights Sky & [i] Information Control Centre
## Comprehensive Technical Implementation Plan — 2026-11-05

**State: PLAN WRITTEN — OWNER APPROVAL REQUIRED; implementation NOT authorized.**  
**Project:** G.T.D / Grand Theft Division — North Heights, Meridian City.  
**Repository:** `interlinkglobal/GTD` (private).  
**Documentation-only branch:** `feature/nh-misty-clouds-recovery-20261105`.  
**Current inspected recovered-cloud implementation:** `163a9002bd892c21389eb9f3a50dbf9e4cb364a6`; inherited from `main` at `4912d19bc6ff7ca2c869856d2a7d2289376b9558`. Revalidate branch heads before implementation.  
**Recovered historical inspiration:** `4fb2b17fe3e5017fbf08e85c7c586ac8a8d33baf`, cloud-only source from *decommissioned* NH-OPT-011.  
**Status of baseline:** User visually accepted the corrected zenith and current cloud style on 2026-11-05. This plan must NOT erase that acceptance.  
**Owner directive:** Put a custom category select inside the existing [i] information modal (not an additional HUD element); organize time, weather, vehicle controls and extensible categories; configure all principal cloud types; evolve sky naturally on the in-game daily cycle; allow overrides and independent pausing. Design first, approval second, code third.

> **Authorization fence:** Only this Markdown plan may be created/committed now. Do not change runtime source, tests, assets, UI, production branches, Vercel settings or deployments under the present instruction. After explicit plan approval, implement on an isolated branch and supply a preview for user inspection; no automatic merge to `main` or production promotion. Historical DDD artifacts are negative evidence, not a wholesale implementation to cherry-pick.

---

## 1. Executive decision and desired gameplay

North Heights already has a convincing, visually accepted static cloud texture. The next objective is to turn it into an **evolving, non-repeating atmospheric simulation** with credible cloud morphology and weather/diurnal variation, while giving the gamer **one discreet [i] entry point** to control the clock, weather and existing vehicle preferences.

Expected player experience:
1. Walk or drive through the city with no new permanent HUD noise.
2. Look upward at any point; encounter a coherent sky whose cloud distribution evolves over minutes and days, not an instantaneous camera-triggered random image.
3. See different cloud genera and mixtures: wispy cirrus/cirrostratus, rounded fair-weather cumulus, broken stratocumulus, rain-bearing nimbostratus and other principal types.
4. Observe fair-weather mornings, warm dawn/dusk colour, variable daytime cover, cloud darkening ahead of rain, and variable nighttime coverage revealing or obscuring the existing star field.
5. Tap the **existing [i]** button, select **Overview, Time, Weather, Vehicles or Settings** from a game-styled select. View only that category; change real, wired controls; close to continue without losing input state.
6. Independently pause the **clock** and **atmosphere**. A paused clock does not imply frozen clouds; a frozen atmosphere does not imply stopped time. The existing Pause button remains the only general gameplay pause.
7. Select **Auto** to return to plausible daily cycling without jolting visible cloud positions. Manual overrides remain in force until explicitly changed.

**Out of scope:** New traffic vehicles, mission logic, character changes, physical volumetric weather simulation, global sound redesign, live geolocation or real meteorological API ingestion, season simulation, an additional persistent HUD widget, other district redesign, automatic deploy/merge.

## 2. Locked owner decisions / source of truth

| ID | Binding requirement | Consequence |
|---|---|---|
| ATM-01 | Existing corrected misty sky is an accepted baseline | Snapshot/preserve white-grey softness, blue gaps, horizon behaviour and zenith cap; visual deltas must be purposeful |
| ATM-02 | No recognizable repeating cloud pattern | Persistent seeded spatial variation, temporally smooth morphing, differing daily schedules and wind; never regenerate on camera look |
| ATM-03 | All principal cloud types should be represented | Support ten WMO cloud genera using a bounded number of efficient rendering families; mixed scenes supported |
| ATM-04 | Natural automatic daily cycle is default | Weather schedule responds to in-game time/day and prior state, not real-world clock or every frame's random roll |
| ATM-05 | Manual weather/cloud choices available from [i] | Distinguish condition (Clear/Rain/etc.) from visible genus; manual overrides are explicit and reversible |
| ATM-06 | Weather evolution pause independent of game time | Expose Freeze/Resume Atmosphere; separate from 0× clock and whole-game Pause |
| ATM-07 | Time control inside [i] | Consolidate existing developer time input/presets/speeds; remove the redundant nested time popover |
| ATM-08 | Vehicle settings accessible inside [i] | Reuse real current vehicle/control/music state; do not create fake or unsafe vehicle functions |
| ATM-09 | No HUD clutter | Keep existing [i], camera, hand, pause, minimap and contextual action controls; category content only in modal |
| ATM-10 | Mobile and desktop parity | Same conceptual choices, touch-sized controls, keyboard focus/escape, no OS-native dropdown replacement |
| ATM-11 | Existing stars and street lighting protected | Stars visible based on cloud extinction; cloud visuals must not silently relight the city |
| ATM-12 | Preview approval before merge | Feature branch, tests and mobile visual validation precede any production decision |

**Interpretation of “all cloud types”:** implement the **ten principal cloud genera**—not every formal species, variety, accessory or supplementary feature. Genera may share a rendering primitive but must be visibly distinguishable. Cirrus/cirrostratus **fibratus**-like streaks in owner photographs are a high-priority visual variant.

## 3. Repository inspection: verified present architecture

| Source | Current evidence | Technical implication |
|---|---|---|
| `src/ui/hud/game-hud.tsx` | Existing `Info` button (`gtd-header-reveal`) toggles metadata; a second popover `timeControlsOpen` contains a time input and Dawn/Noon/Dusk/Night presets plus 0/1/2/8 speed buttons | Replace split state with one [i] control-centre trigger; preserve metadata in Overview; move time controls |
| `src/routes/north-heights-preview.tsx` | React owns `meridianMinute` (initial 14:53), `meridianSpeed` (initial 2), increments via interval; calls `controller.setTime` according to hour bands; also owns vehicle, radio, mission, map, pause state | This route remains the authority for user time commands; send low-frequency clock/weather snapshots to engine; do not duplicate React/engine ticking |
| `src/game/experiments/north-heights-sky-002.ts` | Accepts `"day"|"dusk"|"night"`; draws star dome with deterministic radial splats and changes sky/fog/sun/ambient at time transitions | Introduce a dawn/twilight **appearance** profile carefully; preserve accepted night lighting, star morphology and fog |
| `src/game/experiments/north-heights-clouds-011.ts` | Static 256×128 seeded noise (`17071`), RGBA cloudy dome and accepted planar cap blending at pole; `setTime` switches simple visibility, with 0 at night | Refactor behind reusable cloud visual API, retaining original look as explicit accepted preset; no camera-dependent regeneration |
| `src/game/experiments/north-heights-city-8.ts` | Creates sky/clouds near scene start, `setTime` fans out to sky/clouds/lamps/signals, scene observer and render loop honor game pause, vehicle state is also here | Inject one independent atmosphere controller with explicit `advance`/`setClock`/`setOverrides`/`dispose`; keep Rapier/traffic untouched |
| `src/ui/menus/settings-state.ts` | Shared interface preferences stored in `gtd-interface-settings`; types include `drivingTouchLayout`, camera, graphics and audio preferences | Do not mix runtime weather checkpoint with shared preferences. Vehicle layout can reuse existing `save/applySettings` |
| `src/ui/menus/settings-editor.tsx` | Already uses Radix custom `Select` with game-specific triggers/content; several audio preferences intentionally disabled as “Coming soon” | Reuse component and styling, not an HTML `select` that invokes the mobile OS picker; avoid falsely claiming disabled audio features work |
| `src/ui/menus/session-overlays.tsx` | Existing game Pause/Settings overlay is separate and intentionally shared across districts | Preserve pause/settings continuity. [i] must not mount a competing full settings editor |
| `src/game/audio/radio/radio-controller.ts` and route metadata | Route owns radio enabled state and vehicle-specific music status | In the Vehicles panel, delegate to actual radio controller rather than duplicating music state |
| `src/game/save/` | Only `README.md` present; no active North Heights full-world checkpoint in this inspected branch | A minimal, versioned atmosphere state checkpoint needs its own adapter; do not claim full game saving |
| `documentations/DDD/GTD-NH-OPT-011-North-Heights-Optimization-Decommission-2026-10-27.md` | Rejected branch had misplaced grass/lamps, broken vehicle handoff and buzzing audio; misty cloud visual was only a partial positive | Recover only reviewed cloud concept. No historical weather/vehicle/audio wholesale merge |

**Baseline risk:** [i] currently opens/hides metadata rather than a real modal. The clock has discrete hour boundaries and a React wall-clock interval. React re-renders must not be used for every rendered cloud frame. Those contracts must be redesigned intentionally, not patched by adding a second state owner.

## 4. UI/UX: one [i] information control centre

### 4.1 Structure and visual language

- **Entry:** existing info glyph in its accepted top-right position and exact `variant="control"` (same family as Pause). No new persistent tab/gear/weather control or rearrangement of three action buttons.
- **Presentation:** one dark translucent / partially blurred “POI glass” surface using the existing `poi-game-glass-panel` style, predictable maximum viewport size and internal scroll. Safe-area-aware Android landscape and desktop sizing; never obscure the entire game unnecessarily.
- **Header:** “NORTH HEIGHTS // INFORMATION” + compact **custom select** with current category and one Close control.
- **Select options:** `Overview`, `Time`, `Weather`, `Vehicles`, `Settings` (last is a link/action into existing paused settings, not a duplicate settings implementation). Future entries require actual wired functionality.
- **Selected category only:** one panel visible. No parallel nested dropdown containing other category's controls. Keep modal dimensions stable where practical; internally scroll rather than stretching over virtual buttons.
- **Overview:** current time/clock speed, present weather and cloud family, location, vehicle/occupancy status and concise mission information. Existing optional music metadata relocated appropriately; keep useful existing feedback. No permanent debug chatter.
- **Time:** 24-hour `HH:mm` control, Dawn/Noon/Dusk/Night shortcuts, current clock speed and genuine **Pause Clock / Resume Clock**. Reuse known 0/1/2/8 values, preserve prior positive speed when pausing and restoring. Preserve safe value parsing and prevent invalid times.
- **Weather:** display **Auto / Manual** condition state, condition selection, cloud-family selector (Auto / Mixed / ten genera), Freeze/Resume Atmosphere, current coverage (read-only initially), and a brief label for “Auto: following daily cycle” or “Manual: override active”. Rain and thunderstorm choices must be honest about their implemented visuals.
- **Vehicles:** read-only vehicle identity and whether driving; use already available driving-input preference (`drag`/`arrows`), radio enabled toggle when applicable, and existing Manual/Autopilot action **only when supported by active vehicle**. Outside a vehicle, show explanatory “Enter a vehicle to access active driving options” rather than misleading action buttons. Other vehicle settings are future slots, not fabricated functionality.
- **Settings:** a single “Open full game settings” command calls the existing Pause → Settings pathway. Do not duplicate the entire SettingsEditor or activate disabled audio options.

### 4.2 Interaction and accessibility contract

- On [i], open and show Overview (or optionally the last selected section within the current open session). The same icon closes it. Existing header auto-hide must not unexpectedly dismiss an actively open control panel.
- Opening [i] **does not pause gameplay or its clock**. It suppresses player movement/action input while interactive focus is in the modal; engine traffic/mission/world rendering continues unless the actual game Pause is invoked. On close, clear held input to avoid stuck arrows/throttle.
- The existing `setUiBlocked` should include `infoOpen`. Reconcile with expanded minimap, dialogue, elevator keypad, mission banner, Pause overlay, Machine camera and vehicle entry: never layer competing dialogs.
- When opening another higher-priority modal, close/suspend [i] and return focus appropriately. When gameplay is paused via Pause, no second [i] modal may steal focus.
- Custom Radix Select: pointer/touch keyboard-operable, portal overlays above the glass panel, correctly z-indexed, safe-area-aware, visually consistent with `game-setting-select-*`. Support Arrow keys, Enter/Space, Escape, descriptive labels and live status without noisy announcements.
- Provide a correctly labelled dialog, focus management and return-focus to [i]. Clicking the close affordance or Escape closes the control centre; Escape from an expanded Select first closes the Select.
- On devices with a small landscape viewport, width ≤ available safe-area width, height constrained, scroll regions remain touch-responsive; do not trap the screen behind a large panel.
- Keep original [i] information access intact by moving information into Overview. Preserve current camera, hand and Pause button roles; avoid breaking regression assertions on Info/Pause icon styling.

### 4.3 Suggested state at React level (proposal, not a write)

```ts
type InformationCategory022 = "overview"|"time"|"weather"|"vehicles"|"settings";
type InformationPanel022 = {open:boolean; category:InformationCategory022};
// Existing route clock values remain the single UI-facing time source.
```

There must be one primary [i] open flag, not independent `headerVisible`, `timeControlsOpen` and new popovers that can contradict one another.

## 5. Atmospheric taxonomy and appearance grammar

Cloud genera (cloud family controls should use the accepted easy-to-read names):

| Genus | Distinguishing form / rendering direction | Typical use |
|---|---|---|
| **Cirrus (Ci)** | Very high, sparse, feather-like thin fibres and hooked wisps; anisotropic noise stretched along wind | Clear/fair and transitional days |
| **Cirrostratus (Cs)** | Delicate high-level translucent fibrous veils, wide feathered streaks; **fibratus** look from owner photos | Mostly fair/pre-frontal, dawn and daytime |
| **Cirrocumulus (Cc)** | Fine, numerous high-level grains/ripples, small-scale mottles | Fair/transitional mix |
| **Altostratus (As)** | Broad mid-level grey-blue translucent sheets, muted sun region | Thickening pre-rain |
| **Altocumulus (Ac)** | Mid-level round islands, clusters and irregular patch banks | Variable cover |
| **Stratus (St)** | Flat low sheet with smooth fog-like texture, little sky windowing | Overcast/drizzle |
| **Stratocumulus (Sc)** | Large uneven rolling patches, soft rounded cells and broad gaps | Common fair/overcast transitions |
| **Nimbostratus (Ns)** | Thick dark continuous rain-bearing layer with diffuse underside | Sustained rain |
| **Cumulus (Cu)** | Distinct soft puffy lobes, flatter bases, unequal size and spacing | Fair weather, building convection |
| **Cumulonimbus (Cb)** | Tall convective dark storm mass, powerful lobes and upper anvil silhouette where feasible in sky representation | Thunderstorm |

These are **screen-space appearance families**, not claims of volumetric meteorological simulation. No requirement to simulate actual droplet thermodynamics, precise cloud altitudes or meteorological forecast skill. Blend one dominant and at most one or two secondary genera to prevent a ten-layer render explosion.

**Visual acceptance:** Ci/Cs must look wispy and fibrous like the owner's photos, Cu/Sc genuinely rounded and irregular, Ns/Cb visibly weighty/dark, while the original accepted white-grey cloud texture remains a “Misty / Soft overcast” material variant. Cloud families must not be only ten menu labels fed into one identical texture.

## 6. Architecture: climate state vs renderer vs game clock

Proposed modules (new filenames are **proposals**; no such files are asserted to exist):

| Proposed module | Responsibility |
|---|---|
| `src/game/atmosphere/nh022-cloud-presets.ts` | Pure cloud-genus parameter library, weather suitability, density/height/wind descriptors |
| `src/game/atmosphere/nh022-atmosphere-model.ts` | Deterministic weather state machine, daily schedule, seed mixing, transitions, manual override and pause semantics |
| `src/game/atmosphere/nh022-cloud-sampler.ts` | Directional noise/FBM, anisotropic wisps, rounded puff masks, multi-scale opacity and stable wind offsets |
| `src/game/atmosphere/nh022-atmosphere-controller.ts` | Single scene-facing `update(dt)` and `applyState(snapshot)`; interpolation; disposal and resource budgets |
| `src/game/save/nh022-atmosphere-checkpoint.ts` | Small versioned state snapshot; seed/day/clock/weather/phase with strict validation; no render textures |
| `src/ui/hud/nh022-information-centre.tsx` | Modal, custom category select and selected panel only |
| `src/ui/hud/game-hud.tsx` | Preserve [i]/Pause positions and metadata style, delegate info-click to route |
| `src/routes/north-heights-preview.tsx` | Own open state and clock commands, wire weather/vehicle settings and gameplay input suppression |
| `src/game/experiments/north-heights-city-8.ts` | Instantiate/dispose atmosphere; expose typed commands and low-frequency read-only status |
| `src/game/experiments/north-heights-sky-002.ts` | Dawn/dusk/horizon/star occlusion integration without global lighting regression |
| `src/game/experiments/north-heights-clouds-011.ts` | Preserve/reuse accepted cloud pattern and pole-safe projection, extracting renderer adapter as required |

**One authoritative clock:** existing route-owned `meridianMinute`/`meridianSpeed` remains the time source during this staged implementation. Introduce an explicit monotonically advancing `simulationDayIndex` and pass normalized minutes and day index to weather controller only on state changes or bounded cadence. For every render frame, the engine advances cloud phase with `dt`; React must not render on every cloud animation update.

```ts
type CloudGenus022 =
  | "Cirrus" | "Cirrostratus" | "Cirrocumulus"
  | "Altostratus" | "Altocumulus" | "Stratus"
  | "Stratocumulus" | "Nimbostratus" | "Cumulus" | "Cumulonimbus";
type CloudChoice022 = "Auto" | "Mixed" | CloudGenus022;
type WeatherCondition022 = "Clear" | "Partly Cloudy" | "Overcast" | "Rain" | "Thunderstorm";
type WeatherMode022 = "Auto" | "Manual";
type AtmosphereCommand022 =
  | {type:"setWeatherMode";mode:WeatherMode022}
  | {type:"setCondition";condition:WeatherCondition022}
  | {type:"setCloudChoice";choice:CloudChoice022}
  | {type:"setAtmosphereFrozen";frozen:boolean}
  | {type:"setClock";dayIndex:number;minuteOfDay:number;timeScale:number};
```

Do not infer that the current `NorthHeightsInspection` already has these methods; it currently exposes `setTime` but no weather commands. Add typed methods once in the coordination layer after approval.

## 7. Daily weather scheduling, randomization and continuity

### 7.1 Never re-roll clouds on look direction

Camera rotation must reveal **the same world sky**, not trigger random replacement or jump between textures. The pattern evolves spatially and temporally. A player who looks upward, turns away and returns seconds later must see the same recognizable cloud masses, shifted subtly by wind. Over hours and across in-game days, combinations and positions diverge enough that the overall sky does not become memorably static.

### 7.2 Deterministic inputs and daily identity

- On first creation, establish a random `worldWeatherSeed` **once per local world/session identity**, with an explicit deterministic test seed path; do not use fixed global `17071` as the world weather seed.
- Evolve each simulated day with a hashed tuple (`worldWeatherSeed`, `simulationDayIndex`, `weatherEpisodeIndex`). Persist the seed/index/state, not generated pixel arrays. Never let ordinary camera position affect seed.
- Use position-stable continuous 3D/directional noise and time-shifted wind offsets; when generating textures, use neighboring/crossfaded seeds rather than fully replacing at hard transition boundaries.
- Avoid obvious mirrored repeats, UV seam wrapping patterns, pole spokes, a static central eye, repeated directional bursts and synchronized movement of all cloud types.
- Keep local randomness isolated from traffic/NPC/mission RNG; weather updates must not perturb their deterministic behaviour.
- **Clock edits are not day rollovers.** Only automatic progression through 24:00 increments `simulationDayIndex`. Manual time setting changes time-of-day palette without erroneously counting an additional day or reseeding the sky.
- With clock speed set to 0×, weather may still move when atmosphere is running (separate `dt`); automatic *daily schedule progression* does not advance until game time advances. Morph/drift can continue with a paused clock, respecting the owner's independence requirement.

### 7.3 Weather state machine

Prefer bounded-duration episodes and weighted transitions to per-frame random selection. Example transitions: `Clear → Partly Cloudy → Overcast → Rain → Overcast`; `Rain → Thunderstorm` only via suitable convective buildup. Every condition has dwell limits and memory/hysteresis, so the game avoids clear/rain/clear flicker.

Proposed default distribution varies by day/seed rather than forcing the same exact timetable each day. Time of day modifies cloud colour and optical contrast; weather mode controls dominant genera, coverage, opacity, wind and future precipitation.

| Condition | Allowed dominant genera | Coverage / progression |
|---|---|---|
| Clear | Ci, Cs, sparse Cc | 0–20%; stars bright at night |
| Partly Cloudy | Cu, Sc, Ac, Cs/Ci mix | 15–60%; variable gaps |
| Overcast | St, As, Sc, Ns precursor | 65–100%; muted sunlight |
| Rain | Ns, As, low St | High dark coverage, progressive pre-rain darkening |
| Thunderstorm | Cb, Cu buildup, dark Sc/As | High variable coverage, staged storm onset/decay |

Percentage bands are **initial tuning hypotheses**, not visual-acceptance thresholds or measured atmospheric realism. Tune against player screenshots; keep rare clear nights and occasional almost-clear cloudless days.

### 7.4 Manual override semantics and resume

- `Weather: Auto` uses natural schedule; `Weather: Manual` pins the selected condition, but cloud noise may continue drifting unless frozen.
- `Cloud Family: Auto` uses condition-appropriate mix; picking a named genus overrides appearance while weather condition/colour remains independently selected. `Mixed` enables a deliberate bounded mixture, not “render all ten”.
- `Freeze Atmosphere` holds condition phase, cloud advection, morphing and transition interpolation at their **current visible values**; clock and traffic remain unaffected. Resume continues from identical values with no catch-up jump, even if hours elapsed during freeze.
- The pre-freeze state is retained. Switching to Auto while frozen changes the requested mode but does not visibly jump until Resume; the UI must explain this.
- Switching from Manual to Auto **crossfades into** the current naturally computed schedule rather than instant hard-cut.
- Whole-game Pause remains authoritative for stopping simulation/rendering per existing contract. The [i] control centre itself does not call whole-game pause.

## 8. Rendering method and performance design

### 8.1 Preserve accepted visual baseline first

Use the current RGBA noise/dome approach as a known-safe base. Retain corrected zenith's planar cap or introduce a superior direction-based sampling path **only if an A/B proves identical-or-better appearance across zenith and horizon**. No reverting the pole pinch.

Build distinct genus procedural kernels with:
- multi-octave low-cost fractal noise,
- anisotropic/stretched components and curl/warping for Ci/Cs,
- isolated rounded, heterogeneous masks for Cu/Ac/Sc,
- diffuse smooth sheets for St/As/Ns,
- broad dark density structures and occasional anvil-like silhouette for Cb,
- high-level and low-level layers with different drift vectors,
- soft alpha, varied scale, density and smooth edges.

Use a bounded **1–3 active layers** rather than one draw per genus. Design a two-texture crossfade or uniform-driven shader where appropriate. All procedural texture generation should occur at initialization/weather-transition preparation, **not every frame**. Reuse buffers/materials and dispose replaced GPU resources; defer nonessential compilation until the first playable frame if necessary to preserve loading budget.

### 8.2 Stable projection and morphology

- Sample by sky direction or explicitly pole-safe UV + cap, not by a low-segment uncorrected sphere with converging UV at zenith.
- Preserve no translation parallax using `infiniteDistance` or equivalent.
- Confirm seams at U=0/1, continuity in both hemispheres and non-repeating zenith regardless of yaw/pitch.
- Blend layers by alpha with correct colour space and avoid cumulative opaque white washout.
- Wind must move clouds smoothly; do not rotate the entire cloud sphere with camera or tie motion to player yaw.
- Keep cloud geometry non-pickable, depth-write disabled and fog treatment controlled.

### 8.3 Atmospheric lighting, dawn, rain and stars

- Add a **dawn visual phase** (separate from day/dusk/night) to current North Heights time-of-day mapping. Use a bounded sky/cloud palette transition rather than rebuilding the star dome.
- At dawn warm the **cloud tint** with gentle peach/orange, chiefly near the low sun/horizon; avoid uniformly making every cloud saturated orange. At dusk similarly transition into muted blue/amber and then the accepted night sky.
- Ahead of rain gradually darken cloud albedo/tint and increase optical thickness/coverage, rather than abruptly recolouring the entire scene; let rain condition follow the visible buildup.
- At night, naturally reduce cloud luminance to slate/blue-grey, permit 0–low cover on some nights, and attenuate **background star visibility directionally** beneath actual cloud coverage. A night with no clouds retains the existing accepted star field.
- Sky-cloud palette changes must not rewrite the previously accepted practical streetlights, neon windows, traffic signals or interior light intensities. Changes to scene-wide sun/hemi lighting require separate regression comparisons and explicit evidence.
- Rain/Thunderstorm controls cannot become fictional controls. Minimum implementation must provide a **bounded and visually verified local precipitation indicator** when Rain is chosen. Thunderstorm requires visible cloud/sky condition and clearly staged lightning, but adding new thunder audio is deferred to the independently approved sound workstream. If precipitation cannot be qualified for this release, clearly label the initial panel “Cloud Conditions” and do not falsely advertise working rain/storm simulation.

### 8.4 Performance targets / mobile tier

Initial nonbinding budgets pending baseline measurement:
- No GLBs, videos, remote weather APIs or giant sky photographs; all-cloud procedural resources bounded and deterministic.
- Target ≤3 active cloud layers plus a small zenith patch when retained; no per-cloud GameObjects/physics bodies.
- Target ≤8 MiB incremental atmosphere CPU+GPU persistent assets; instrument actual resource allocations and texture sizes.
- Weather scheduling at low frequency (e.g. 1–4 Hz); frame-time cloud drift via uniforms/very small transforms without CPU texture reallocation per tick.
- Aim for no more than **5% mobile p95 frame-time regression** relative to identical baseline scenes on the same device, and no material increase in first playable frame load. If baseline has near-zero headroom, stricter profiling and fallback apply.
- Adaptive quality tiers: lower octave count/texture dimensions on mobile, fewer layers at Low quality, but preserve genus silhouette and selected condition. User preferences remain respected.
- On WebGL context loss/restore, reconstruct atmosphere textures from seed/state; never leak material/observable handles on route re-entry.

These are provisional engineering budgets, not claimed measured results.

## 9. Clock, settings and persistence contracts

### 9.1 Clock

Existing time input/presets migrate to Time section. Preserve actual `meridianMinute`/`meridianSpeed` behavior and exact speed labels. Implement normalized bounded progression and `simulationDayIndex`. The clock must not use React component remount as implicit day reset; on refresh reload known settings/checkpoint where supported.

Explicit test cases:
- At 23:59 automatic running reaches 00:00 and increments day by exactly one.
- Manually changing 03:00 to 22:00 changes daylight, **not** day index.
- 0× freezes time but `Freeze Atmosphere=false` allows cloud drift.
- `Freeze Atmosphere=true` freezes clouds/condition while 2× time still moves and streetlights follow time.
- Whole-game Pause temporarily stops both according to game's existing pause rules, and Resume restores each subsystem's chosen pause state.

### 9.2 Save boundaries

- Interface preferences such as selected vehicle input layout remain in existing `useSettings` storage, preserving shared-district settings.
- Atmospheric world runtime uses an **independent versioned checkpoint** in `src/game/save`. Minimum saved fields: schema version, world seed, day index, normalized clock, condition episode and transition phase, RNG state, primary/secondary genera, wind offsets, weather mode/override, cloud choice, freeze state and timestamp/consistency marker.
- Persist no full GPU textures, GLBs, scene materials or audio contexts. Maintain atomic save validation and safe version migration; avoid writing every frame.
- IndexedDB is the preferred runtime storage; scoped fallback may preserve only explicit user preferences if unavailable. Failure must never block gameplay. Do **not** imply that general North Heights mission/position/traffic saves are implemented—this plan is atmospheric only.
- Save on deliberate user changes and pagehide/visibility checkpoints subject to platform support. Restore deterministically, including cloud direction/phase, with no reset flash.
- Reopening [i] within a session must show real current state, not stale initial defaults.

## 10. Integration with vehicle settings and game controls

Confirmed current vehicle paths:
- Route owns `vehicle`, `vehicleSpeed`, `RadioController` state.
- `NorthHeightsInspection` exposes `toggleSedanAutopilot` and actual vehicle control state through route callbacks.
- `Settings` includes `drivingTouchLayout` (drag/arrows) which is applied by existing touch controls.
- Visible contextual vehicle boarding/exit control stays where currently accepted.

Proposed controls in Vehicles panel:
1. **Control layout:** Drag / Arrows, only where relevant; routes to existing `save/applySettings` with no duplicate preference owner.
2. **Autopilot / Manual:** only when supported by the player's current accessible vehicle; reuse `toggleSedanAutopilot` with honest state label. If vehicle type unsupported or ownership ambiguous, omit/disable with explanation; do not silently force a mode.
3. **Vehicle music:** existing RadioController enabled state, conditional on in-vehicle status; respect browser gesture policy and no new audio assets.
4. **Read-only context:** current vehicle, moving/stopped indication and a short explanation of controls. No traffic simulation edits.

Do not touch `NH012TrafficSimulator`, collision rules, steering, vehicle mesh loaders or source-derived traffic visuals for this project. Vehicle model diversity is a separate upcoming priority.

## 11. Concrete staged implementation and gates

### Gate 0 — preflight / baseline documentation
- Re-read latest `main` and feature branch heads; examine cloud diff, accepted zenith screenshot, current route HUD and settings contracts.
- Capture reproducible day (including zenith), 06:00, 12:00, 18:00, midnight frames; note renderer quality, p50/p95 timing, memory, mobile first-playable time.
- Confirm no concurrent edits to `game-hud.tsx` or North Heights route; resolve conflicts explicitly, not by overwriting.

### Gate 1 — [i] UI refactor only
- Add one controlled information modal and Radix custom category select; move Overview and existing time controls; wire the known vehicle settings.
- Keep weather panel as truthful disabled placeholder only if its engine commands are not yet implemented (never a working-looking inert control).
- Regression test old Info/Pause positions, focus, collision with map/dialogue, clock input, keyboard/touch and no additional HUD elements.
- Preview independently if UI conflicts with mobile controls.

### Gate 2 — cloud taxonomy / manually selectable static appearances
- Extract reusable sampler/presets; implement ten genera + Mixed using ≤3 active layers; lock original misty clouds and pole correction as A/B references.
- Initially switch forms manually via instrumentation; require clear visual differences and acceptable mobile frame time.
- Check zenith, seam, horizon, street look and nighttime background.

### Gate 3 — evolving cloud positions / seeded daily climate
- Add weather model, independent cloud advection, transition graph, world seed/dayIndex and low-frequency state progression.
- Verify that looking up repeatedly neither regenerates clouds nor exposes recognizably looping patterns; verify smooth day-to-day evolution.
- Build Auto/Manual, family select and Freeze/Resume semantics; wire to [i] panel.

### Gate 4 — time, tint, star and precipitation integration
- Add dawn/dusk transitions and cloud tints; darken pre-rain; provide variable nightly coverage and directional star extinction.
- Validate rainy/storm states honestly, with bounded weather effects only when visually qualified; sound remains separate.
- Preserve existing scene/traffic lighting while testing dusk, midnight and sunrise.

### Gate 5 — persistence, quality tiers and regression
- Versioned atmosphere snapshot, lifecycle restore, context cleanup; Low/Medium/High visual tiers; no asset churn or memory growth.
- Run targeted tests, available typecheck/lint/Vitest/build, and device benchmark. Record any existing unrelated failures.
- Check at least one real Android landscape device and one desktop browser, with camera moving while cloud evolution occurs.

### Gate 6 — review / owner acceptance (no automatic release)
- Publish exactly one **isolated preview** after an approved implementation, with branch SHA, build state, known limitations and user inspection instructions.
- Collect visual acceptance of all ten genera, random continuity, dawn, storm lead-up, star coverage, modal controls and independent pause semantics.
- Owner may accept/reject stages independently; changes to main and production require separate explicit direction. On failure, revert only the current work package and preserve the accepted static cloud baseline.

## 12. Test matrix (minimum explicit acceptance contract)

| Area | Automated assertion / proof | Manual in-browser inspection |
|---|---|---|
| Existing look | Original mist texture seeded golden reference and no removed zenith-cap invariants | Same camera sky images; no starburst |
| Cloud taxonomy | Ten distinct enum names, valid preset parameters and bounded active layer count | Every type visibly differentiable; fibratus softness |
| Spatial stability | Same seed/time/direction always produces same cloud field; camera orientation never enters seed | Look up, look away, return: slow drift only |
| Daily diversity | Adjacent in-game days yield differing schedule/seed mixes; bounded condition transition graph | Multiple simulated days not memorably repetitive |
| Clock | Speed and manual setters, 24h wrap, 0× pause, day count | No flickering dusk/dawn; clock correct |
| Weather pause | Freeze preserves phase/offset; resume no catch-up jump | Cloud remains still with active clock; inverse also works |
| Manual override | Condition and genus stick until Auto; changes crossfade | No abrupt rain-to-clear snap |
| Star occlusion | Clouds attenuate stars proportionally in covered directions; clear night unchanged | Night sky remains atmospheric, not flat opaque dome |
| Pre-rain / dawn | Bounded tint and opacity transitions, valid colour ranges | Darkening lead-in and subtle warm rim without global overlight |
| Modal UX | One [i] trigger, select keyboard support, focus return, section-only DOM, no duplicate time popover | Mobile safe areas and no touch/joystick overlap |
| Vehicle category | Controls delegate to existing settings/radio/autopilot; absent actions disabled | Driving and walking panel behaviours truthful |
| Mission/input safety | `setUiBlocked` includes info overlay; controls unstick on close | Traffic continues; Reese does not move while navigating modal |
| Resources | Dispose observers, textures, shaders; context restore; no GPU growth across route remount | 10× close/open, map/pause transitions |
| Performance | P95 comparison, load budget and texture count report | Android landscape rotation and mid-game FPS stable |
| Storage | Checkpoint versioning, invalid-data fallback, no textures serialized | Refresh/return restores cloud phase and user choice |

Tests must verify behaviour, not just source strings. An automated pass **never substitutes** for screenshots or real gameplay inspection.

## 13. Failure modes, mitigation and rollback

| Failure | Detection | Safeguard |
|---|---|---|
| Zenith spokes return | Camera straight up, yaw sweep, seam tests | Preserve accepted polar cap or switch to pole-free directional sampling only after visual A/B |
| Clouds change on every look | Seed dependence on camera, visual flicker | World-space deterministic sampling, no view-triggered RNG |
| Sky visually repetitive | Repeated daily episode patterns | Hash day/episode seed, vary type, density, wind and layered distribution |
| Time + weather diverge | Incorrect dawn label or frozen condition advancing | One route clock, explicit weather freeze semantics, unit tests |
| Random weather jumps | Condition generated per frame | Duration-based state machine, minimum dwell + crossfade |
| Star field disappears | Cloud alpha excessively opaque | Directional transmittance with clear-night invariant |
| Night/facade lights regress | Exposure/fog/light changes | Sky material only first, compare streets/windows at night |
| UI obstructs gameplay | Overlay/z-index/touch ownership | Existing [i] location, bounded modal, `setUiBlocked`, focus coordination |
| Vehicle settings conflict | Duplicate controls or false capability | Delegate to existing domain owners, omit unsupported options |
| Cloud visuals slow mobile | High octave count, texture regen per frame | Fixed layer/texture quota, quality tiers, frame-time gate |
| Atmosphere persists incorrectly | Broken checkpoint migration | Schema validation, isolated rollback to defaults, never corrupt save |
| Historical DDD regressions | Accidentally cherry-picked whole weather/audio branch | No bulk merge; standalone review of each extracted algorithm |
| Preview rejected | Visual mismatch | Feature-branch revert to accepted `163a9002` sky and independent staged retries |

## 14. Deliverables and repository change register (after approval)

1. Core atmosphere model, cloud-family renderer, time/weather coordination and small versioned checkpoint.
2. One compact [i] modal with category select and functional Time, Weather, Vehicles and Overview sections.
3. Ten visually distinct cloud genera, mixed coverage, coherent continuous drift, daily variation, manual override, independent clock/weather pause.
4. Dawn/dusk colour, pre-rain darkening, variable nighttime coverage and cloud-consistent star visibility.
5. Vitest + integration tests, mobile/desktop screenshots, comparative frame-time results and a source diff.
6. Preview URL and exact commit SHA after verified build; an owner acceptance record and an explicit separate merge/deploy decision.

**Documentation provenance:** This plan is written on the recovered-cloud feature branch, not `main`. If approved, use this artifact as the controlling scope; preserve the decommission record and current accepted sky as rollback points. Do not cherry-pick other NH-OPT-011 experiments.

---

## 15. Approval gates

**Current gate: PLAN ONLY — AWAIT OWNER'S EXPLICIT FULL PLAN APPROVAL.**

No runtime code, gameplay, UI controls, textures, test files, scene state, Vercel deployment, GitHub merge or production release is authorized by this document's existence.

On approval, implement Gates 0–5 sequentially and create an isolated preview for Gate 6 inspection. “Accepted” applies only to the owner-reviewed stage; “merge and deploy” is a distinct permission.

**Success sentence:** A gamer opens [i] and can adjust time, weather, cloud family and applicable vehicle settings without cluttering the screen; North Heights' skies evolve naturally and non-repetitively through simulated days, preserve the accepted zenith and stars, and remain smooth on Android landscape.
