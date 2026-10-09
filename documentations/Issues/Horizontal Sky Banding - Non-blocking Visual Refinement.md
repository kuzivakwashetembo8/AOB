# Horizontal Sky Banding — Non-blocking Visual Refinement

**Issue ID:** GTD-VIS-001  
**Recorded:** 2026-10-09  
**Status:** ACKNOWLEDGED — OPEN FOR PROGRESSIVE REFINEMENT  
**Severity:** LOW / COSMETIC  
**Milestone impact:** NON-BLOCKING for FL-4 development and its eventual acceptance, unless the impact materially changes.  
**Source of Truth:** `documentations/Meridia First Light Implementation Plan.md`  
**Supporting evidence:** `documentations/FL-4 Evidence/Progress and Blocking Matrix.md`  
**Branch at documentation:** `development/meridian-fl4-optimization`

## Observed phenomenon

Fine, closely spaced horizontal lines or banding are visible in the blue daytime sky/background in GTD. The appearance is somewhat unnatural compared with the intended cohesive atmospheric rendering. It was initially emphasized by the user as a concern on mobile, but the user's installed mobile PWA has not received the newest development code; the comparative screenshots supplied during FL-4 diagnosis were taken on desktop Chrome.

The user explicitly classifies the phenomenon as **not an error**, **not a gameplay obstruction**, and **not a meaningful UX impairment**. It does not prevent movement, collisions, camera use, entering/exiting the South Ward garage, or enjoying First Light. The objective is to improve it progressively when evidence and development opportunities justify doing so, not to fixate on it or prevent other work.

## Evidence collected

1. **Night-sky correction:** FL-3 star morphology and city-night illumination were accepted. Daytime horizontal banding remains a separate observation and is not grounds to reopen the approved stellar correction.
2. **Resolution A/B:** Baseline Babylon hardware scaling was visually preferred to experimental `fl4Scale=1.25` (reduced pixel workload) and `fl4Scale=0.75` (increased pixel workload). Banding was still visible across tested variants; these tests did not identify the source or produce a satisfactory remedy.
3. **Sky isolation:** `fl4Probe=noSky` disabled named sky/star dome meshes for a diagnostic view, but the user still observed banding.
4. **Shadow isolation:** `fl4Probe=noShadows` disabled scene shadows for a diagnostic view, but the user still observed banding.
5. **Early startup frame:** A fully blue, horizontally banded frame appears temporarily before Meridian's other geometry renders. The screenshot of this frame happened during a no-shadow test, but the user explicitly clarified that it occurs during regular startup, independent of that diagnostic mode.
6. **Scene behavior:** Normal gameplay continues. No established physics, camera, input or garage traversal defect has been attributed to the banding.
7. **Measurement limitation:** The 811 × 633 desktop canvas report used Chrome DevTools docked beside the game (DPR 1); it is not a native mobile PWA measurement. The desktop frame-time measurements similarly reflect that constrained desktop session.

## What has NOT been established

- No confirmed root cause in the sky shader/material, gradients, texture generation, fog, framebuffer, GPU driver, browser compositing, device display or screen capture.
- No proof that the banding appears identically on the newest mobile PWA build.
- No proof that either sky-dome visibility or shadow-pass activation causes the artifact.
- No measured FPS improvement from the diagnostic isolation probes.
- No basis to alter the approved night lighting, realistic stars, default rendering resolution, or game physics as a speculative remedy.

## Disposition / operating rules

**Acknowledge, document and proceed.** FL-4 should continue with its canonical priorities: representative device testing, measured CPU/GPU/render work, evidence-driven optimization, stability checks and final First Light acceptance.

This issue is **not a prerequisite** for continuing FL4-01 through FL4-06, moving to evidence-supported optimization, or preparing a reviewed release. It should appear transparently as a known cosmetic limitation in acceptance/release notes rather than being silently represented as solved.

Potential future investigation, **only if warranted by available time and evidence**: identify which layer produces the first blue frame; compare flat clear-color output, atmospheric geometry/materials and browser capture; inspect source gradients and filtering; validate the latest landscape-mobile build. Keep trials isolated, measurable and reversible.

**Escalate** only if new evidence shows substantially degraded readability, flicker or motion sickness, device-specific gameplay interference, major rendering cost, or a change in user acceptance. Otherwise, retain LOW / NON-BLOCKING classification.

## User decision

On 2026-10-09 the user directed:

> The banding is not an error, it does not stand in the way of the game nor does it ruin the UX, it is just an unnatural phenomena we can solve progressively without fixating on it. We must proceed post acknowledgement of its existence.

**Decision:** Accepted as a documented, non-blocking visual imperfection. Do not hold FL-4 or other game-development progress for a banding fix.
