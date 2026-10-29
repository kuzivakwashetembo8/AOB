# GTD-WORLD-OPT-001 — Acceptance, Deployment and Remaining OpenSA-Inspired Optimization
Date: 2026-10-29
Status: OPT-001 owner visually accepted and merged. Production deployment verification pending at time of this record.
PR: #68; merge SHA a667413380ac007fc57b235c9751f173a477b911.
Preview: dpl_2AQdUGsZRjjD7xKo48yejRfnxVNN (READY); owner reports smoother gameplay.
Implementation: src/game/performance/world-opt-001-collector.ts, world-opt-001-browser.ts, src/routes/north-heights-preview.tsx, src/test/world-opt-001-collector.test.ts.
Feature flag: ?worldPerf=1; bounded frame buffer; median/p95/p99, >50ms frames; local JSON export; background tab exclusions. NPC=100 and Sedan=125 panel values are static reference figures, NOT observed runtime metrics. No benchmark proving causation or measured speedup yet.

## Architectural origin
OpenSA concepts used as inspiration: separate logical entity state, simulation, visibility/rendering, animation and physics; stream world and assets by locality; preserve entity continuity. Do not copy AGPL-licensed code into GTD without licensing review.

## Approved remaining sequence
OPT-003 Centralized asset registry (NEXT): typed schema of assets, dependencies, content hash, source, cache/ref count, size and cell ownership; deduplicate downloads and resource creation; deterministic cleanup; telemetry of registry hit/miss.
OPT-004 Priority loading: critical player/terrain/roads/collisions/controls before nearby vehicles/NPCs and distant decor; safe background loading; preserve resumability and no visible placeholder dots.
OPT-005 Composite building LOD: near detailed geometry, mid simplified geometry, far merged district proxies, with camera/flight-aware transitions and independent collisions.
OPT-006 Geographic streaming: district/cell index, camera- and velocity-aware prefetch, collision-safe handoff, reference-counted unloading, no gaps or disappearing traffic.
OPT-007 NPC simulation tiers: full/reduced/simulated/dormant; preserve 100 unique identities, locations and animation continuity; minimize animation and skinning work when unseen.
OPT-008 Traffic separation: 125 Sedan agents retain simulation, routes, manual driving, universal entry and wheel behavior independent of visibility/LOD.
OPT-009 Selective physics activation: simplify distant dynamic bodies while retaining nearby static collision fidelity and safe vehicle interaction.
OPT-002 Adaptive budgets: apply measured frame-time controller with hysteresis to existing LOD, streaming and animation knobs, gradual quality recovery, no entity deletion.
OPT-010 Unified district architecture: shared gameplay systems; data-driven district content and streaming configuration; regression test across South Ward/North Heights and future Meridia.

## Outstanding OPT-001 instrumentation debt
Replace hard-coded NPC and Sedan labels with actual runtime counters; add draw calls, triangles, active meshes, GPU timing where supported, physics body counts and CPU subsystem timings; loading waterfall; export metadata including build SHA, device/browser and missing-data explanations; quantify profiler on/off overhead. Preserve local-only data policy and strict opt-in.
Important: OPT-001 instrumentation itself should not be claimed to accelerate gameplay. Owner's positive experience is subjective until measured.

## Acceptance and DDD gates
Each package: inspect -> baseline -> document -> implement -> tests -> preview -> owner acceptance or DDD. Compare stationary/walking/driving/flying/rapid-turn/dense-NPC/dense-traffic on desktop and mobile. Proposed targets (not measured): >=30% fewer >50ms frames; >=20% lower p95; >=25% faster time-to-playable; no population reduction; no gameplay regression.
Do not automatically merge later experimental packages. This report records the approved roadmap, not implementation of the remaining packages.
