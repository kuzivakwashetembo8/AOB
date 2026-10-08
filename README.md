# Meridian Shell

Build the foundational shell and UI for an original browser-native 3D open-world action game called "GTD — Grand Theft Division".

Do NOT build the actual game engine yet. This milestone is the professional game shell, UI system, PWA baseline, and clean runtime integration boundary that the future engine will plug into.

PRODUCT / WORLD
- GTD = Grand Theft Division.
- Setting: Meridia. First playable city: Meridian City.
- Protagonist: Voight (one name only).
- Narrative direction: mission-based urban action game centered on a protector/vigilante progression, not a criminal-rise fantasy.
- Visual identity must be original. Do not imitate GTA/Rockstar typography, trade dress, menus, logos, maps, or UI.
- Tone: cinematic, urban, grounded, technically sophisticated.

PRIMARY DESIGN DIRECTION
The shell must feel like a game executable first and a website second.
Dark-mode, landscape-first, designed for gamers and coders.
Avoid generic cyberpunk/neon dashboards and avoid generic SaaS cards.

Visual palette:
- near-black charcoal, graphite, dark steel, muted concrete, smoked/translucent panels
- restrained amber for primary action/selection/mission state
- white for core information
- restrained cool blue/teal for secondary/system state
- red only for danger/heat/threat
- subtle glow only for active/focus state
- thin dividers, compact uppercase system labels, legible sans-serif body copy

LANDSCAPE-FIRST RESPONSIVENESS
Landscape is canonical across desktop, laptop, tablet, and phone.
- Desktop/laptop: keyboard + mouse UI prompts.
- Tablet landscape: same composition, optionally touch-capable.
- Phone landscape: touch-first with ergonomic on-screen controls.
- Portrait: do NOT compress the full UI. Show a restrained "Rotate device to continue" interstitial with GTD branding and Meridian atmosphere.
- Respect mobile safe areas/notches/browser chrome.

ROUTES / SURFACES
Create these core surfaces:
1. "/" — GTD landing / launcher
2. "/game" — full-screen game viewport shell
3. "/world" — Meridian world/district presentation
4. "/settings" — game settings
Keep routing compile-safe and production-structured.

LANDING / LAUNCHER
This is the first and strongest screen.
- Full-viewport cinematic Meridian City background treatment.
- Voight as an off-center visual anchor, not a giant poster.
- GTD wordmark + "GRAND THEFT DIVISION".
- Dominant CTA: "ENTER MERIDIAN".
- Secondary actions: Continue, New Game, World, Settings, Development Build.
- Add restrained system details such as:
  MERIDIA // MERIDIAN CITY
  BUILD 0.1.0
  WORLD STATE: READY
  INPUT: KEYBOARD + CONTROLLER / TOUCH
- Hover/focus/selection should feel cinematic: subtle parallax, camera/background shift, contextual microcopy, restrained panel motion.
- Keyboard focus and touch selection must both be first-class.

GAME ROUTE
The /game route must already look like a real playable game shell before the engine exists.
Create:
- GameCanvasHost full-viewport placeholder
- HUD overlay layer
- mission/objective layer
- interaction prompt layer
- minimap placeholder
- player status layer
- reputation/heat area
- pause menu overlay
- loading/bootstrap overlay
- mobile touch-control layer
- desktop keyboard/mouse prompt layer

DO NOT run high-frequency game state through React. React owns UI/presentation only.

INPUT MODES
Desktop/laptop:
- no permanent virtual controls
- contextual prompts such as E Interact, F Enter Vehicle, Shift Sprint, Tab Map
- detect keyboard/mouse vs touch and swap prompt style

Mobile landscape:
Implement a polished virtual gamepad overlay inspired by modern mobile open-world games, but original:
LEFT:
- large movement joystick
- optional directional/D-pad cluster
- auxiliary shoulder-style action buttons if useful
RIGHT:
- large look/camera joystick
- Interact
- Jump
- Combat
- Sprint
- Enter/Exit Vehicle
- context action
TOP:
- Pause/Menu
- Back where relevant
Controls must be translucent, scalable, safe-area-aware, ergonomic, and visually secondary to the world.
They should be functional components, not decorative controller illustrations.

HUD CONTEXT
Walking:
- objective
- minimap
- location
- contextual interaction
- health/status
- restrained reputation/heat
Driving:
- navigation/route
- speed/vehicle state placeholders
- enter/exit context
Combat:
- weapon/status placeholders
- aim/focus/threat feedback
Create the component architecture so the HUD can switch context later without redesign.

WORLD SURFACE
Present Meridian City as a place, not just a map.
Include district UI placeholders for:
- Meridian Central
- South Ward
- Old Meridian
- Harbor District
- North Heights
- East Market
- The Strip
- Ironworks
- West End
- Meridian University District
- Civic Square
- Outer Ring
Selecting/focusing a district should alter the visual context or detail panel.

SETTINGS / PAUSE
Pause:
- Resume
- Map
- Objectives
- Settings
- Save / Load
- Return to Main Menu

Settings:
- Graphics
- Audio
- Controls
- Accessibility
- Interface
- Mobile Controls

Mobile control settings placeholders:
- opacity
- scale
- joystick size
- button position
- left/right-handed layout
- haptics
- auto-hide

LOADING / BOOTSTRAP
Create an intentional loading surface:
- GTD mark
- Meridian location imagery/treatment
- progress state
- runtime diagnostics
- short world copy
This will later cover engine initialization, capability checks, and asset loading.

MOTION LANGUAGE
Use restrained:
- slow background parallax
- subtle camera drift
- panel fades/slides
- hover/focus depth
- active amber strokes
- contextual HUD transitions
Avoid bouncy cards, SaaS motion, excessive blur, and flashy neon.

TECHNICAL FOUNDATION
Preferred stack:
- TanStack Start + React + strict TypeScript
- Tailwind CSS
- PWA-ready
If TanStack Start is not supported by the current Lovable runtime, preserve the same route boundaries and architecture in the supported React stack and make migration/isolation straightforward.

Create a clean runtime bridge layer, compile-safe only:
- GameRuntime interface
- GameSnapshot type
- GameCommand type
- GameEvent type
- bootstrap / start / pause / resume / destroy lifecycle
- event/snapshot flow from engine -> UI
- command flow from UI -> engine
- no actual engine implementation yet

Project organization should reserve clear areas such as:
src/game/core
src/game/bridge
src/game/renderer
src/game/ecs
src/game/physics
src/game/world
src/game/streaming
src/game/asset-synthesis
src/game/impostors
src/game/depth-cards
src/game/procedural-variation
src/game/representation-lod
src/game/world-composition
src/game/character
src/game/vehicles
src/game/pedestrians
src/game/traffic
src/game/combat
src/game/police
src/game/missions
src/game/audio
src/game/input
src/game/camera
src/game/save
src/game/debug
src/ui/hud
src/ui/menus
src/ui/map
src/ui/inventory
src/workers

These can contain compile-safe placeholders/interfaces only; do not invent heavy simulation.

PWA
- installable shell
- manifest
- standalone display
- placeholder icons
- service worker/app-shell caching baseline
- do NOT indiscriminately precache future large game assets

QUALITY BAR
- desktop-first visual polish but fully landscape-mobile aware
- accessible focus states
- touch targets sized correctly
- no auth/backend/database yet
- no fake multiplayer/store
- no heavy engine packages unless needed for the empty canvas host
- strict lint/type checks
- build must compile cleanly
- landing page must look intentional and immediately interactive

The milestone succeeds if the app already looks and behaves like the front door and control room of a premium game, while the actual 3D engine remains cleanly pluggable later.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://grand-civic-launch.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b1b03839-d41e-4411-8c08-28f7c132cc6e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
