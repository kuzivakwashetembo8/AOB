# GTD-CHAR-002 — Flight Posture L1 (Directional Hover vs Accelerated Flight)

**Date:** 2026-10-13 | **Stage:** visual preview, pending owner approval.

## Observed regression

In the first CHAR-002 preview, ascending/descending worked but ordinary horizontal input immediately switched the UAL humanoid to a near-horizontal prone flying animation. The user expects subtle forward/back lean when moving at normal airborne speed, with the prone high-speed pose only under Shift acceleration.

## Verified mechanism

The GTD flight playback selected `clips.fly` whenever planar translation was nonzero. The pinned fork `interlinkglobal/three-player-controller@ca82bbc76a3b9b0afa80c73b60167adf6123b9b6` uses:
- ordinary forward: `flyHoverForward`
- ordinary backward: `flyHoverBack`
- left/right: `flyHoverLeft`/`flyHoverRight`
- vertical: `flyHoverUp`/`flyHoverDown`
- no movement: `flyIdle`
- forward + Shift: `fly` (fast aerodynamic/horizontal pose)

GTD preserves its F/Ferrari binding, using G for flight. GTD permits fast backward too, so **Shift + backward** intentionally selects `fly` in this preview.

## Change

A pure `selectFlightPose` decision function maps explicit camera-relative directional input and sprint state to the matching imported UAL animation group. Missing directional clips fall back to the upright `flyIdle` (or ordinary idle), never to prone `fly`. The existing 0.18s GLB animation blend remains unchanged. No manual model-root tilt, collision bypass, speed, vehicle, world, camera or Rapier changes.

## Acceptance

In flight, verify normal W/S modestly lean forward/backward; A/D lean sideways; hold Shift+W or Shift+S for aerodynamic prone posture; releasing Shift immediately returns to upright moving hover; releasing movement restores hover idle; rising and descending still work. Do not merge to production before owner accepts this preview.
