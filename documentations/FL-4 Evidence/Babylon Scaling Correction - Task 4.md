# Babylon hardware-scaling correction — FL-4

2026-10-10. This **supersedes** the numeric DPR examples in GTD-VIS-002 section 4 and the opening of FL-4 Evidence/Progress and Blocking Matrix. Those estimates were incorrect.

Babylon's upstream abstractEngine.pure.ts initializes adaptive hardware scale at 1/DPR, but GTD overrides it with max(1,DPR/1.5). Babylon resize uses render width approximately CSS width / hardware scale, NOT CSS width times DPR divided by scale. See https://github.com/BabylonJS/Babylon.js/blob/master/packages/dev/core/src/Engines/abstractEngine.pure.ts .

Predicted native pixel-area coverage: DPR 1 = 100%; DPR 2 (scale 1.333) = 14.1%, NOT 56.25%; DPR 3 (scale 2) = 2.8%, NOT 25%. These are source-based examples, NOT measured phone values. Confirm on Babylon 9.29.0 through opt-in diagnostics before changing policy. Preserve desktop/production behavior and benchmark frame-time tradeoffs first. Mobile root cause and hardware headroom remain unverified. GTD-VIS-001 sky banding remains nonblocking.
