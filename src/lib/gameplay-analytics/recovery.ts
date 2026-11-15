import type { AnalyticsEvent, AnalyticsSession } from "./database";

export function createRecoveryRecord(
  previous: AnalyticsSession,
  recoverySessionId: string,
  at: string,
  eventId: string,
): { session: AnalyticsSession; event: AnalyticsEvent } {
  const sequence = previous.recorder.lastSequence + 1;
  const interrupted: AnalyticsSession = {
    ...previous,
    state: "interrupted",
    updatedAt: at,
    endedAt: at,
    // Downtime is not gameplay time; preserve the last committed monotonic duration.
    elapsedMs: previous.elapsedMs,
    recorder: { ...previous.recorder, lastSequence: sequence, persistenceFailures: previous.recorder.persistenceFailures ?? null, checkpointAt: previous.recorder.checkpointAt },
  };
  return {
    session: interrupted,
    event: {
      id: eventId,
      sessionId: previous.id,
      sequence,
      at,
      elapsedMs: previous.elapsedMs,
      type: "session.recovery-detected",
      data: {
        recoverySessionId,
        lastCommittedSequence: previous.recorder.lastSequence,
        lastCheckpointAt: previous.recorder.checkpointAt,
        recoveryDetectedAt: at,
        downtimeMs: null,
        elapsedDurationSource: "last-committed-monotonic-checkpoint",
      },
    },
  };
}
