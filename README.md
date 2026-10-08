# G.T.D — Grand Theft Division

G.T.D is a browser-native, landscape-first 3D open-world action game set in Meridia, beginning in Meridian City.

The current repository contains the completed application shell and the clean runtime boundary for the game engine. The shell includes the launcher, world and settings surfaces, PWA support, landscape mobile handling, touch controls, HUD scaffolding, pause/loading states, and the React-to-runtime bridge.

## Product direction

- Protagonist: Voight.
- Structure: mission-based urban action game.
- Character direction: protector/vigilante progression rather than criminal ascent.
- First city: Meridian City, Meridia.
- Visual philosophy: perceptual fidelity over geometric purity, with conventional infrastructure supporting unconventional rendering and world-representation techniques.

## Stack

- TanStack Start
- React
- TypeScript
- Vite
- Tailwind CSS
- Nitro
- Vite PWA
- Vercel

The 3D runtime is intentionally not implemented yet. React owns application UI and presentation; the future game runtime owns simulation, rendering, physics, frame timing, and world state.

## Routes

- `/` — launcher
- `/game` — game viewport/runtime host
- `/world` — Meridian world interface
- `/settings` — settings

## Runtime boundary

The existing `RuntimeBridge` accepts a `GameRuntime` implementing:

- `bootstrap(host)`
- `start()`
- `pause()`
- `resume()`
- `destroy()`
- `command(command)`
- snapshot subscription
- event subscription

The engine must remain outside React's high-frequency render cycle.

## Local development

```sh
npm install
npm run dev
```

Validation:

```sh
npm run lint
npm run test
npm run build
```

## Deployment policy

Git commits do not automatically deploy this project.

Vercel production deployment is intentional only. The repository-level `vercel.json` disables Git-triggered deployments, and the Vercel project is also configured to ignore Git builds. When a playable milestone is ready, deploy explicitly through Vercel CLI/API.

Production: https://grand-theft-division.vercel.app

## Current milestone

The shell is complete. The next milestone is the first real 3D runtime: an empty world, camera, placeholder Voight, movement/look input, collision, pause/resume, and live runtime snapshots feeding the existing HUD.
