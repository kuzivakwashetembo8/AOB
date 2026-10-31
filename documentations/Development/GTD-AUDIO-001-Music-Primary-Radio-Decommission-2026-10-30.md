# GTD-AUDIO-001 — In-Vehicle Music Baseline / Radio Decommission (2026-10-30)

Status: Live radio attempt DECOMMISSIONED as an active feature; future implementation only. Do not merge the experimental live-radio streaming controller, empty station registry, or radio-specific HUD as a production feature.

## Evidence
The radio registry was empty and the preview displayed STATIONS PENDING; no station was playable. Multiple preview deployments failed TypeScript compilation, including TS2379 from exactOptionalPropertyTypes in telemetry. The user rejected the obstructive metadata HUD and required the info-button toggle to gate metadata. A Supabase radio events table and Edge Function were created but playback telemetry has not been verified end to end.

## Production replacement
Play the repository-owned public/Watchamacallit.mp3 as primary music when Voight enters a vehicle. Use the local /Watchamacallit.mp3 asset URL, not a remote GitHub raw URL. Pause/stop on vehicle exit, game pause, or backgrounding. Honor the existing music ON/OFF state and volume; ensure Android user gesture constraints are handled. The UI must never obstruct the camera; informational controls belong behind the info-button toggle. Do not claim successful playback until tested on Android.

## Future live-radio work
Revisit broadcaster streaming only after verified HTTPS MP3/AAC endpoints, redistribution/embedding permission, Android playback tests, retry behavior, and secure telemetry are proven. Retain this plan and radio-specific telemetry as research; do not expose a broken station selector in production.

## Integration gate
The streetlights, trees, grass, building illumination, and other work on separate branches require independent review. Experimental single-tower night pilots were rejected by the user and must not be silently merged. Build/test preview before production deployment.
