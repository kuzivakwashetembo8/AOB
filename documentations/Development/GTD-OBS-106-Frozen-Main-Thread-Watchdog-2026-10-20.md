# GTD-OBS-106 — Crash-resistant loading diagnostics, 2026-10-20

Status: isolated investigation branch (not merged into main)
Accepted base: OBS-105 40639d196b; no world, car or player assets changed by default.

## Observed failure
Chrome desktop screenshot at ~11 seconds shows 295 measured operations, 283 loaded,
12 running, 0 reported failures, and 4.00 seconds of long tasks. Chrome explicitly
reports "Page Unresponsive", while Slow Roads continues moving in separate tab.
The observation implicates GTD main-thread/GPU work but does not establish which
subsystem causes the stall. No OBS-105 preview record was found in Supabase
before this implementation. A button/DevTools/JSON export inside the frozen tab
cannot be a diagnostic prerequisite.

## Implementation
- An independent same-origin browser Worker starts immediately when game route mounts.
- Game ledger sends sanitized operation begins/ends, resource transfers and long-task
  durations to that worker. The worker alone batches records to a server endpoint.
- Worker sends an elapsed, active-stage and last-main-thread-message heartbeat
  every 2.5 seconds. When the main thread stops signaling >3.5 seconds, state
  is marked stalled. A stalled heartbeat is a symptom, not evidence of which
  operation blocked. If browser kills the entire process, later heartbeats also stop;
  last persisted event and gap to end form the evidence.
- Server validates maximum 60 items/request, 25KB payload, same-origin restrictions,
  strips untrusted content and writes through server-only Supabase credentials
  to existing gtd_foundation_events. No browser database keys.
- Removes OBS-105 per-item console info which could independently amplify stalls.
- The in-browser ledger and downloadable JSON remain optional supplementary tools.
- `?gtdObsNoLeaves=1` keeps prior procedural tree cards and bypasses
  source-backed 3D canopy instantiation to isolate one suspected main-thread phase.
  `?gtdRangeRoverDrive=0` already exists and removes six parked GLB import duties.
  Test one variable at a time; these flags are diagnostics, never the accepted scene.

## Evidence contract and limitations
- First request may return HTTP 503 if secret env is unavailable on preview:
  **server receipt requires validation**, not merely successful deployment.
- Asset timing and GPU shader upload are not synonymous; CPU stalled/long-task
  timings are separate from renderer responsiveness and GPU driver hangs.
- Independent workers can persist while main thread is stuck, but do not survive
  complete renderer-process or operating-system termination.
- No overbroad traffic retries; bounded worker queue; no user-identifying tokens,
  URLs with queries, IPs or browser account data saved.
- Database foundation tables have RLS disabled per earlier experiment. This is an
  access-control risk despite server-only production writes; do not broaden public
  access or reveal privileged keys.
- Never claim completed root-cause finding without comparing real persisted samples
  from default run against no-leaves and then no-fleet runs.

## Gates
TypeScript, full tests, Vercel READY, worker static file accessible, endpoint responds
with expected method guard, and a real persisted heartbeat from a fresh preview run.
Preview implementation only; no production merge authorized.
