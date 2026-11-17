# Error Logs

This document records the recent Vercel deployment and CI failures investigated on 17 November 2026. All times are South African Standard Time (SAST, UTC+02:00). Times are taken from Vercel deployment events or the corresponding API request timestamp. Where a timestamp is only available to the minute, it is labelled accordingly.

## 17 November 2026

### 11:04:30–11:15:17 — Baseline deployment failed

- **System:** Vercel deployment `dpl_H1qJ8ZEv5MEzfc4eN7s2JvDnKDy1`
- **Source:** `main`, commit `4c98954c93378266f5695c5d462ecea4fb06ef84`
- **Result:** Build failed during `npx vitest run`.
- **Log summary:** Two test files failed and 188 passed (190 total). Twelve individual tests failed and 767 passed (779 total).
- **Affected suites:** `src/test/loading-persistence.test.tsx` and `src/test/ped002-default-voight-info-button.test.tsx`.
- **Error descriptions:** `TypeError: Cannot read properties of undefined (reading 'clear')` and `TypeError: Cannot read properties of undefined (reading 'setItem')`. The failing tests attempted to clear or write browser storage.
- **Root cause identified:** Node exposed a native `localStorage` global that was unavailable without a configured storage file. Vitest 4's jsdom environment population skipped the jsdom storage property because a property with that name already existed on the Node global. Consequently, the test global did not receive jsdom's usable `Storage` instance.
- **Impact:** Vercel could not complete the deployment because the test command exited with status 1.

### 11:23:54–11:31:54 — First remediation deployment failed

- **System:** Vercel deployment `dpl_8qBV5H9S9p8bJztbeNT5rfRfWHzT`
- **Source:** `main`, commit `3712105dbd4bca06da00739f56e0cdef86f481e1`.
- **Result:** Build failed at the same Vitest stage.
- **Log summary:** The same two test files failed; 188 of 190 files and 767 of 779 individual tests passed.
- **Error descriptions:** The same undefined-storage `clear()` and `setItem()` TypeErrors.
- **Why the remediation was insufficient:** The setup attempted to assign `window.localStorage` to `globalThis.localStorage`. Vitest had already skipped the jsdom storage property during global population, so `window.localStorage` in that populated context was itself unavailable. The assignment therefore did not supply a valid storage object.
- **Additional build-command adjustment:** The Vercel build command was also changed to avoid running the `prebuild` lifecycle twice. That adjustment did not address the storage failure.
- **Impact:** Deployment remained blocked; no application-code or test-assertion failure was implicated.

### 12:13:58 — Preview deployment request rejected (orchestration)

- **System:** Vercel deployment API request.
- **Error description:** HTTP 400 `bad_request`: the supplied `target` value `preview` was rejected. The API accepts `production`, `staging`, or a configured custom environment identifier; preview is the default when `target` is omitted.
- **Resolution:** The request was retried without the `target` field and Vercel created the preview deployment successfully.
- **Impact:** The first API request did not create a deployment. This was a request-parameter issue, not an application build failure.

### 12:14:05–12:21:57 — Corrected preview deployment succeeded

- **System:** Vercel deployment `dpl_DQBzrMgTxhYsgyvt1TBCK1j6YHVt`
- **Source:** Branch `fix/vitest-jsdom-webstorage`, commit `a6ac4d6e1098e9383d6196332ea6b45e45c0207c`.
- **Result:** Deployment reached `READY`; Vercel logged `Build Completed` at 12:21:51 and `Deployment completed` at 12:21:57.
- **Remediation:** Test setup now reads `localStorage` and `sessionStorage` from the underlying Vitest jsdom instance (`globalThis.jsdom.window`) and exposes those Storage objects on the test global. The override is conditional on a jsdom instance being present, so non-jsdom test environments are not modified.
- **Verification evidence:** The Vercel build command completed successfully with the Vitest run included in the configured build sequence. The retained deployment event excerpt does not expose the individual Vitest pass totals, so no exact passing-test count is asserted here.
- **Non-blocking warnings observed:**
  - At approximately 12:14:13, npm warned that the `cache-dir` environment configuration is unknown and may stop working in a future npm major version.
  - At approximately 12:21:48, Vite warned that `vite-tsconfig-paths` is detected while Vite now has native tsconfig path resolution support. The warning suggested considering `resolve.tsconfigPaths: true`.
- **Impact:** The preview build and deployment completed. The two earlier storage-related test failures did not recur as a deployment blocker.

## Follow-up notes

- The confirmed failure was in the test environment's browser-storage global setup, not in the game's persistence implementation.
- The npm `cache-dir` and Vite `vite-tsconfig-paths` messages were warnings, not causes of the failed deployments.
- The Vercel `Running "exit 1"` line observed during the build was the configured ignore-build-step check; the build proceeded afterward. It was not the cause of the Vitest failures.
- The successful preview is not a production deployment. No production promotion is recorded in this log.
