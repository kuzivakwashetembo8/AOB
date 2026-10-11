# GTD-CHAR-001 — Meridian Live Humanoid Foundation Trial

**Status:** Reversible trial on `experiment/gtd-char001-meridia-humanoid`; **not** Voight's final artwork and **not** production. This deliberately accelerates Stage 3 experimental evidence without marking Stage 2 character-identity/asset qualification complete.

## How to compare

In the Vercel preview, open `/game?gtdCharacterTrial=ual&fl4Diagnostics=1` to import a temporary rigged humanoid from the fork's 2026-09-22 Universal Animation Library demo. The same preview `/game?fl4Diagnostics=1` provides the procedural Voight baseline. Both use GTD's **actual generated Meridian streets, world lighting, imported vehicle GLBs, Rapier kinematic capsule, camera and touch/keyboard controls**.

The experiment loads the GLB via Babylon.js glTF importer, normalizes the full character height to about 1.78 m visually, attaches it to the existing player root, and selects idle, walk, sprint and airborne animation groups from corrected Rapier displacement. Animations blend over approximately 180 ms. The ground and the actual imported character mesh remain mandatory first-frame draw witnesses **after** vehicle settlement; broken GLB import does not silently become a successful rigged-player test. No accepted world/vehicle procedural object is replaced by a demo environment.

### Technical provenance and gating

- Temporary demo asset: `ual.glb` from `interlinkglobal/three-player-controller` commit `ca82bbc76a3b9b0afa80c73b60167adf6123b9b6`, Git blob `e236f349526637a5c829c408d48ce9d8fcde9cff`, 3,749,364 Git-source bytes.
- The opt-in prototype retrieves the *pinned* GLB through the jsDelivr GitHub CDN at runtime rather than checking it into GTD. This makes network reachability, third-party CDN service and CORS an **explicit unverified experiment dependency**, not a production-ready asset-hosting strategy.
- The source HTML credits Quaternius's Universal Animation Library. Creator pack listing currently states CC0 commercial rights: https://quaternius.itch.io/universal-animation-library and https://quaternius.com/packs/universalanimationlibrary.html. Quaternius also maintains newer general QAL terms restricting *standalone asset redistribution*: https://quaternius.com/license.html. This fork's exact embedded GLB provenance and governing terms require reconciling before production hosting or any adoption.
- The original 2D approved South Sudanese-inspired Voight reference remains authority. This stylized yellow rig is **only a technical comparator**; neither rendering it nor its rig satisfies Voight identity acceptance.

### Measurements and next acceptance gate

On the preview, evaluate load success/failure, device conditions, first frame, real world/vehicles, terrain/curbs/garage, walking/sprinting/jumping, pause → Settings → Apply & Resume, camera and full physical render scale (100% and optional 125%). Collect `window.__GTD_CHARACTER_TRIAL_REPORT__?.()` for model geometry, bones, available clips, active clip and measured asset load time. For frame-time sampling use existing opt-in FL-4 diagnostics `window.__GTD_FL4_REPORT__?.()` and exported mobile report; compare the same camera path with and without `gtdCharacterTrial=ual`. Actual model bytes are from Git tree, **not** network timing.

**Scope boundary:** The adapted Babylon.js trial includes animation playback and state transitions, **not** Three.js Foot IK itself. Porting the two-bone solver, planted-foot phase logic and pelvis adjustment remains a separately measurable step after confirming import/rig compatibility. The original Three.js Foot IK profiler experiment lives in `interlinkglobal/three-player-controller` branch `experiment/gtd-char001-footik-cost`. No claims of real IK correction, measured FPS uplift, final Voight fidelity, or approved commercial release are made here.

**Rollback:** Close the preview or omit the query parameter. Branch changes are not merged into GTD main. A failed build or graphics/regression check blocks promotion.

## 2026-10-11 — Preview startup failure and guarded recovery

User screenshots of the first preview (`dpl_5P3SAEBGrcGqkRGxFf5bwVcunvz9`) show `STARTUP ERROR 7/8`, with `World not visible after 1 actual render attempts; ground drawn=false, Voight drawn=false`. The model checkpoint itself was marked done; that is not proof of a drawn humanoid. The watchdog began its post-vehicle 12-second deadline before the first real GLB/shader render could complete, allowing a single expensive frame to consume the entire window and immediately fail. This is the identified *code-path vulnerability*, not yet independent proof of the only root cause on the user's device.

**Experiment correction:** Require at least four genuine post-import scene-render attempts before enforcing a 45-second trial-only deadline. The normal baseline retains the existing nominal 12-second deadline (with minimum two attempts). The gate still requires **ground and the chosen real imported Voight mesh to render in the same post-settlement frame**. No synthetic completion signals, sky-only acceptance or hidden capsule fallback. A regression test simulates a single expensive 12.5-second shader-preparation frame and requires a subsequent real draw, plus a negative test for permanently missing geometry.

**Separate console issue:** The supplied screenshot also shows Vercel-preview PWA manifest requests redirected to a `vercel.com/sso-api` URL and then blocked by browser CORS. That is an authentication/manifest symptom of the protected preview domain and is *not demonstrated* to cause either world witness to be false; do not lower the visible-world acceptance gate because of it. Any remaining material/GLTF render errors must be investigated from the resulting browser evidence.

**Verification:** TypeScript, automated tests, Vercel READY deployment and user-device rendering are independent checks. The fix is not considered confirmed until the new preview visibly draws Meridian ground and the rigged character after vehicles load; no production or main-branch change is authorized.
