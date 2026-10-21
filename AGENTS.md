## GTD architecture

- Keep the four public surfaces in TanStack file routes and shared presentation under `src/ui`; this preserves compile-safe navigation and independent page metadata.
- Connect the game engine exclusively through `GameRuntime` and `RuntimeBridge`; React consumes low-frequency snapshots/events and sends commands, never simulation ticks.
- Keep engine subsystems under `src/game` and workers under `src/workers`.
- Store only device-local interface preferences locally; saved game state belongs to the runtime save system.
- Register the generated app-shell worker only through the guarded wrapper; development must not register it and large world assets must not be indiscriminately precached.
- GitHub `main` is the canonical source. Vercel deployments are intentional milestones only; normal commits must not deploy.

## Next city/building directive

For the next building-import or district-expansion directive, read [NEXT-DIRECTIVE.md](NEXT-DIRECTIVE.md) and its linked WORLD-IMPORT-001 handoff before implementation.
