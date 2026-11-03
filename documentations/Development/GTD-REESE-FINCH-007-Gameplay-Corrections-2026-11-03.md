# GTD-REESE-FINCH-007 — Owner Gameplay Corrections

Date: 2026-11-03
Branch: `feature/gtd-reese-finch-polish-20261103`
Starting point: production main `636bd32073d149960c5f16500699f59ab21a29d8`
Status: code committed for preview; no merge or visual acceptance.

## Seven requested corrections
1. **Door transition:** a temporary Rapier loss of grounded status must not trigger visual falling onto Reese's back. Until a deliberately authored fall mechanic exists, the live visual clip selector may use idle, walking and running only; physics remain unmodified.
2. **First step:** begin authored Walk or Run clip at the first moving frame, not after the former 0.18 s stability hold. Crossfade reduced to 0.075 s. Preserve alternating feet and sustained-clip continuity.
3. **Floor counter:** elevator state reports current floor 1–53, mapping carriage height fraction to physical floor indices. The HUD reports FLOOR n OF 53, never a height percentage.
4. **Reese gun:** remove the model-independent procedural pistol entirely. The hand selector toggles existing, individually addressable GLB gun mesh or weapon-designated material primitives; never add duplicate weapon geometry. **Asset constraint:** when original gun vertices are welded into an otherwise unnamed body mesh or share an indistinguishable material, code must not hide the whole character to simulate holstering. The GLB needs an independently named gun mesh or material slot for full acceptance. Runtime warning discloses that limitation.
5. **Finch dialogue:** use Finch.glb's imported talking clip while Finch is the speaker and restore his original idle clip when dialogue ends. The first report line is Reese, so Finch stays idle for that line. Dialogue moved down near screen footer, with extra clearance above touch controls.
6. **Top-right HUD:** hand/info/pause use same 44 px control size, top alignment and 9 px gaps, including safe-area offsets.
7. **Expanded map:** visible live game behind a subtle dark `backdrop-blur-[4px]`; map remains sharp in a centered, bounded panel with the existing markers and pan/zoom behavior.

## Verification
- Full TypeScript, Vitest and asset build; deploy preview from HEAD.
- Player acceptance: doorway entry standing, first footstep, 1→53 and 53→1 counter, original weapon disappears and reappears, Finch talking clip and restoration, three aligned header controls, map/game backdrop.
- No production merge until owner authorization.
