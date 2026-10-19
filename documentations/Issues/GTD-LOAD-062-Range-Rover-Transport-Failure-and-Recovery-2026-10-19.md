# GTD-LOAD-062 — Range Rover GLB transport failure; bounded recovery and evidence
Date: 2026-10-19
Incident preview: VEH-018/WORLD-018, commit 4d5454f3a1272a15f459e514fe74fe6c298c09e3
Status: **Incident confirmed, cause unproven; bounded isolated patch authorized by follow-up context; owner review required.**
Do not merge until source integrity and real device validation.

## User screenshot, 17:00 South Africa
- Loading overlay: 07:52 / 01:00, deadline exceeded +06:53.
- Startup error: `Unable to load /Range%20Rover%20Sports%202018%20(.GLB).glb: LoadFileError: Error status: 0`.
- Renderer, Rapier, South Ward, Voight all passed; `vehicle-loader` still WORKING and final first scene WAITING. No false first playable frame.
- Range Rover original at `public/Range Rover Sports 2018 (.GLB).glb` is **24,349,788 bytes** in the exact Git tree for this deployment. Toyota is 17,214,188 bytes; all six originals collectively ~50.37 MB. Source presence **does not prove HTTP delivery** from that preview URL.
- Vercel preview has status READY, but READY validates compilation/deployment only. Git deployments' Vercel source file-tree endpoint returned 404 `File tree not found`; this is not a missing GLB HTTP result. Direct same-origin GLB HTTP status could not be established with available network tools. Do not claim 404 or 200 for the actual file.
- HTTP-like `status:0` in Babylon's `LoadFileError` is an *ambiguous transport failure*, not an HTTP response status proving missing file. Browser network interruption, cancellation, cache/service-worker issues, and client-side request restrictions remain competing explanations. The affected attempt's network throughput/cache status are not available.
- All six GLB requests are initiated concurrently; `Promise.all` makes any rejected asset fatal to boot. One transport error blocks all other successful imports.

## Supabase diagnostic gap
- Live `public.gtd_startup_runs` query returned **zero Oct 19 runs**. No same-build accepted network comparison is available.
- Vercel project environment metadata (values not read): `SUPABASE_URL` and `SUPABASE_SECRET_KEY` target **production only**. The preview telemetry endpoint therefore cannot write to Supabase, regardless of browser speed. Do not infer that an absent row means startup succeeded or failed.
- Existing VEH-018 runtime emits `asset-observation` only once `await rangeRoverReviewReady` succeeds; a failed asset goes unrecorded. The UI only offers character-trial JSON; loading failures need a non-character diagnostic export.
- **Do not copy production credentials to preview without explicit approval and security review.** Client must never receive the Supabase privileged key.

## Recovery implementation (bounded / fail closed)
1. Add transport-classifier and retry runner for failed **fetch/loading only** (before scene instantiation). Retry only explicit status=0 / browser transport failures, at most one additional attempt, with brief backoff. Do not retry HTTP 403/404, corrupted glTF, invalid geometry, out-of-memory, security/permission failures. Never loop indefinitely or drop an accepted source/vehicle to fake startup success.
2. Preserve the same original URL and browser cache across retry; no `cache:reload` and no cache-busting query. Successful vehicle imports stay loaded; never discard already-playable/offline resources.
3. Emit sanitized per-asset failure event with logical ID, source bytes, elapsed loader wall time and finite retry count; record error code through existing strict Supabase schema (not full URLs or user data). Mark vehicle-loader FAILED on final rejection; keep first frame WAITING and no game start.
4. Add user-initiated `Download startup diagnostics (JSON)` to the error overlay, available even when Supabase preview ingestion is unconfigured. Include source asset names / sanitized IDs, checkpoint states, retry outcome, release SHA, wall-clock latency, coarse network class, no IP, detailed User-Agent, location, cookies or secrets. Do not upload on button press.
5. Automated tests cover recoverable status 0 exactly once, immediate rejection on HTTP 404 and malformed GLB, no retries of instantiation/material errors, one loading failure record, and local export callback. Keep existing six original GLBs, BMW seating, Lamborghini front direction, 10x grass/road extension unchanged.
6. Vercel READY + unit/type/test gates; real network review still required. A 60-second limit remains hard acceptance. This patch improves recovery/observability; it cannot make a 24 MB transfer over a poor connection meet that budget.

## Future performance work kept separate
Source-level GLB compression, offline resource manifest/version updates OFFLINE-000 through OFFLINE-007, staged full fleet acquisition, and environmental secrets changes require separate plans and approvals. No silent behavior change where first playable loads without required accepted vehicles.
