/**
 * FL4 real startup checkpoints. Labels describe planned work; a check mark is
 * never displayed until a real runtime callback reports terminal success.
 */
export const STARTUP_CHECKS = [
  { id: "renderer", label: "Initialize 3D renderer" },
  { id: "physics", label: "Initialize collision physics" },
  { id: "world", label: "Generate South Ward" },
  { id: "voight", label: "Place Voight" },
  { id: "vehicle-loader", label: "Initialize GLTF vehicle loader" },
  { id: "vehicle-offroad", label: "Load and place off-road vehicles" },
  { id: "vehicle-sports", label: "Load and place sports cars" },
  { id: "first-frame", label: "Render first completed scene" },
] as const;

export type StartupCheckpointId = (typeof STARTUP_CHECKS)[number]["id"];
export type StartupCheckpointState = "pending" | "running" | "done" | "failed" | "skipped";

export interface StartupCheckEntry {
  readonly id: StartupCheckpointId;
  readonly label: string;
  readonly status: StartupCheckpointState;
  readonly detail: string | null;
}

export function initialStartupChecklist(): StartupCheckEntry[] {
  return STARTUP_CHECKS.map(({ id, label }) => ({
    id, label, status: "pending" as const, detail: null,
  }));
}

export function applyStartupCheckpoint(
  entries: readonly StartupCheckEntry[],
  update: { id: StartupCheckpointId; status: Exclude<StartupCheckpointState, "pending">; detail?: string },
): StartupCheckEntry[] {
  return entries.map((entry) =>
    entry.id === update.id
      ? { ...entry, status: update.status, detail: update.detail ?? null }
      : entry,
  );
}

/** Completion means every planned checkpoint reached a real terminal outcome. */
export function startupCompletion(entries: readonly StartupCheckEntry[]) {
  const resolved = entries.filter(({ status }) => status === "done" || status === "failed" || status === "skipped").length;
  const failed = entries.filter(({ status }) => status === "failed").length;
  return {
    resolved,
    total: entries.length,
    failed,
    percent: entries.length > 0 ? Math.round((resolved / entries.length) * 100) : 0,
    settled: resolved === entries.length,
  };
}
