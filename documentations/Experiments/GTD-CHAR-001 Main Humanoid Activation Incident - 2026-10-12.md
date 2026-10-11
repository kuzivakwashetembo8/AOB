# GTD-CHAR-001 — Main route displays legacy proxy after humanoid merge

**Incident recorded:** 2026-10-12, approximately 00:58 SAST (UTC+02), according to the conversation's local timestamp. Uploaded screenshots show browser clocks 00:56–00:57; these are client-display readings, not independently validated telemetry.
**Reported by:** Project owner, after #12 was merged and Vercel promoted `af93d422926a91b04529b2bce4d6f7d3ac1ebeea`.
**Affected:** https://grand-theft-division.vercel.app/game (no query string); reference https://gtd-ftcryk3qr-interlinkglobaltech.vercel.app/game?gtdCharacterTrial=ual.
**Status:** Root cause identified; corrective branch `fix/char001-default-humanoid-production`; release pending verification.

## Verified findings

- GitHub `main` points to `af93d422926a91b04529b2bce4d6f7d3ac1ebeea`.
- Vercel resolves BOTH `grand-theft-division.vercel.app` and `gtd-interlinkglobaltech.vercel.app` to **READY** production deployment `dpl_8r8wLVQG9cqnyzc5raZUJ9uxnxCj` from precisely that SHA. The custom project domain is verified. This is not a stale alias or failed deployment.
- Screenshots show the ordinary main route rendering the brown spherical head/black capsule while a branch preview with the query string renders the yellow rigged humanoid, full Meridian buildings, cars and roads.
- Source-backed trigger: `src/game/character/voight-humanoid-trial.ts` returns `true` for `isMeridiaCharacterTrialRequested` **only** when `gtdCharacterTrial=ual`; the route `src/routes/game.tsx` independently repeats the query-only requirement. `src/game/core/gtd-runtime.ts` branches between actual rigged humanoid and `createVoightPrototype(scene)` according to that trigger.
- Previous release intentionally gated the still-provisional Quaternius UAL demonstration mannequin, despite the user's expectation that successfully merged humanoid mechanics would be visible on the canonical `/game`. The discrepancy is a **release-activation mistake**, not an animation/physics regression.

## Corrective contract

1. On canonical production `grand-theft-division.vercel.app/game`, as well as the production aliases `gtd-interlinkglobaltech.vercel.app` and `gtd-git-main-interlinkglobaltech.vercel.app`, select the current rigged humanoid by default, including its L1/L2 facing, animation coordination, contact/collision and startup gates.
2. Preview hostnames continue requiring explicit `?gtdCharacterTrial=ual` so regular preview behavior is not silently changed.
3. Provide a reversible `?gtdCharacterTrial=baseline` override (and `off` synonym) on any host that selects the original prototype on demand. It is a fallback, not a gamer-facing new feature.
4. Consolidate the selection predicate in a lightweight shared module and use it consistently in runtime and pause/diagnostic UI. Maintain the existing export and live heading controls when humanoid is active. Do not duplicate queries in the React route.
5. Retain the previous L2 151-test validation and add activation tests to cover canonical URLs, production aliases, preview explicit opt-in, preview default and baseline override. Run the complete TypeScript + tests + production build gates on the exact candidate SHA.
6. Merge and deploy `main` only on successful validation. Confirm `grand-theft-division.vercel.app` resolves to the exact resulting production SHA and returns HTTP 200. Visual/mobile acceptance remains with project owner.
7. The **UAL asset is a trial demonstration mannequin**, not the approved final Voight visual identity. This default promotion covers functionality and mobile QA; it does not confer or verify any third-party commercial redistribution rights.

## Regression prevention

Never equate `GitHub merged`, `Vercel READY`, and `desired game experience active on the default canonical URL`. Future release gates must explicitly evaluate the feature-selection path at the exact user URL as well as deployed SHA, and retain a tested rollback selection.
