# GTD-LOAD-061 — Automatic Supabase telemetry release

**Date:** 2026-10-17. **Status:** Code staged; real Android performance acceptance pending.

## Server-only deployment environment variables

- `SUPABASE_URL` = `https://ekdsnlforqcliafpmuye.supabase.co`
- `SUPABASE_SECRET_KEY` = GTD Analytics Supabase Project Settings → API Keys → server secret (`sb_secret_...`). A legacy `SUPABASE_SERVICE_ROLE_KEY` is also supported.

Set these on Vercel **before deployment**. Never use `VITE_` or `NEXT_PUBLIC_` for privileged keys; never commit credentials. The browser posts only to same-origin `POST /api/telemetry/startup`.

## Collection contract

Every `/game` boot creates a transient UUID and records real first-playable completion, failure, or pagehide abort. The server validates the bounded JSON and upserts into the existing RLS-protected `gtd_startup_runs`, `gtd_startup_spans`, and `gtd_asset_observations` tables. Telemetry delivery never blocks gameplay. Unauthorized public direct database reads/writes remain denied by RLS.

Stage spans derive from the existing eight engine checkpoints and version handshake. Remote car source timing is reported by the existing asset probe. Rover and Toyota container loading and instantiate/fit phases are timed in the original GLB loader. Network transferred bytes are recorded only if browser Resource Timing exposes them, otherwise null.

No IP address, persistent device ID, raw user-agent, URL parameters, user actions, or character positions are included. The 60,000ms budget remains exact; rounded timer UI is not evidence of compliance.

## Deployment acceptance check

1. Deploy the approved new `main` SHA with the two server environment variables.
2. Visit normal `/game`, finish the real startup, then confirm `POST /api/telemetry/startup` returns HTTP 202.
3. Supabase SQL: `select run_id,release_sha,outcome,duration_ms,over_budget from public.gtd_startup_runs order by ingested_at desc limit 10;`
4. Check `run_id` matches rows in both child tables, including Rover/Toyota asset observations.
5. Repeat three cold and three warm Android launches and a desktop launch. Earlier Android 414s and 448s timings remain P0 failures until optimized.

## Boundaries

These three startup tables do **not** yet store continuous gameplay FPS, GPU frame time, draw calls or VRAM. Browser cross-origin transfer timing may be opaque. Same-origin ingress is schema bounded but not resistant to sophisticated scripted spoofing; use edge rate limits before opening broadly.