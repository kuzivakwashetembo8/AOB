# GTD-LOAD-060 — Sixty-second first-playable-frame performance gate

**Directive date:** 2026-10-17
**Status:** Implemented on isolated GTD preview branch; owner measurement pending.
**Acceptance standard:** An initial game load **greater than 60 real seconds** is outside the gamer's attention-span window and MUST be classified as an unacceptable startup-latency regression. Exactly 01:00 is the bound, 01:01 is a failed budget. This is a performance SLO, not permission to hide assets or mark unfinished startup complete.

## Contract
- Start the counter as soon as the game route begins the visible bootstrap/loading sequence, **before** the version check, Babylon/WebGL startup, physics, generated-world work or remote GLB imports. Time resolution derives from `performance.now()`, a monotonic elapsed clock rather than counting intervals. Timer UI updates on a 250ms scheduler, rounded down to whole seconds and displayed `MM:SS / 01:00` (e.g. `00:01 / 01:00`).
- Stop ONLY at GTD's existing `first-frame: done` bridge checkpoint, emitted after ALL required imported vehicles settle and a real post-import ground/Voight frame renders. Never stop when renderer initializes, progress hits an arbitrary percentage, HTTP succeeds, or the browser has merely constructed a scene. Preserve the existing loading checklist.
- Until 60s inclusive: display remaining seconds. After 60s: show `OUTSIDE ATTENTION WINDOW +MM:SS`, mark budget breach visually. Do not artificially kill ongoing loading at the threshold; distinguish late success from network/runtime errors.
- For 15 seconds after first playable frame, show a compact final result in the viewport (e.g. `LOAD 01:13 / 01:00 • OVER TARGET +00:13`) so gamers can actually see the measured performance, with no pointer interception. No UI clutter persisted during gameplay.
- Browser background throttling must not undercount: derive elapsed from timestamps, not the number of interval callbacks. Errors do not count as successful first-playable frames. No user data is cleared or player settings changed.

## Diagnosis and QA
- A failure above 60s must be tracked as a real performance defect even if the game eventually runs. GPU, JS processing, physical device characteristics, network transfer, the accepted Rover (~24MB) and Toyota (~17MB) and any further model files are candidates, but do **not** assert root cause solely because Toyota was recently added. Measure before optimizing.
- Verify 0,1,59,60,61,75,>120s edge cases; timestamp-based timer, first-frame stop semantics, StrictMode duplicate effect handling, route cleanup, mobile landscape, installed PWA, repeated cached runs vs fresh loads, slow network, slow GPUs, version-check mismatch and offline startup.
- Capture mobile observations including the hardware/browser/network, cold-cache and warm-cache time, time before/after GLB imports, time to first rendered post-import frame and the overage. Do not treat Vercel build duration as game startup latency; they are different metrics.
- Acceptance remains failing for any sampled startup exceeding 60s until genuine loading work is reduced. Do not remove accepted vehicles, lower render fidelity or compromise safe version checks as a hidden workaround. No production merge until owner approves actual performance.
