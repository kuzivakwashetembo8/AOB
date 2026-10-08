<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## GTD architecture
- Keep the four public surfaces in TanStack file routes and shared presentation under `src/ui`; this preserves compile-safe navigation and independent page metadata.
- Connect future engines exclusively through `GameRuntime` and `RuntimeBridge`; React consumes low-frequency snapshots/events and sends commands, never simulation ticks.
- Keep all engine subsystem reservations under `src/game` and workers under `src/workers`; the shell must not introduce simulation dependencies.
- Store only device-local interface preferences locally; saved game state must come from the future runtime save system, never fabricated shell data.
- Register the generated app-shell worker only through the guarded wrapper; preview/dev must never register and future world assets must not be precached.
