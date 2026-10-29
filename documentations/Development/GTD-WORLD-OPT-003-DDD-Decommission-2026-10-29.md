# DDD — WORLD-OPT-003 Optimization Branch Decommission (2026-10-29)

## Decision
Owner ordered DDD on `experiment/gtd-world-opt-003-asset-registry-20261029`. The experimental optimization implementation is rejected. Do not merge its gameplay, registry, or telemetry UI changes into production.

## Baseline and scope
- Main baseline at decommission inspection: `7abaad137f0037c6ebf53500540aef65bd9dd378`.
- Rejected branch last implementation commit: `11557268de5274abe106d3191935c635dd3ed620`.
- Branch was 13 commits ahead of main, zero behind, modifying registry, NPC and tree loading, preview telemetry/UI, environment sample and tests.
- OPT-001 instrumentation already present on main is **not** part of this rollback. Supabase historical performance snapshots remain available.

## Attempts
1. Introduced scene-local typed asset registry with ownership, in-flight promise deduplication, and eviction, initially without loader integration.
2. Merged experimental automatic Supabase telemetry into the same optimization branch (PR #69).
3. Integrated registry into NPC GLB appearance streaming and tree import.
4. Preview `dpl_6VymiJGUT4jPGNMHZ1VrNh4dTqqq` failed TypeScript: optional NPC byte metadata could be undefined under `exactOptionalPropertyTypes`. Corrected in `e186ac26`.
5. User observed progressive desktop lag. Supabase snapshots on 2026-10-29 showed session median frame time rising from 16.7 ms to 50.2 ms, p95 reaching 283.7 ms, and >50ms frames reaching 51.4% (cumulative snapshots).
6. Removed the performance panel and startup JSON export UI on branch commit `11557268`. This did not address observed lag.

## Outcome and evidence
The experimental branch was not accepted. The recorded frame-time degradation warrants a separate root-cause investigation before attempting another optimization. The telemetry does not identify the precise responsible subsystem; no root-cause fix was verified. Do not represent this work as an optimization success.

## Decommission action
Preserve this documentation on main; return the rejected branch reference to the documented main baseline via guarded force-with-lease. Historical commits remain retrievable by SHA. Do not deploy or merge rejected implementation. No new optimization branch is authorized by this DDD instruction.
