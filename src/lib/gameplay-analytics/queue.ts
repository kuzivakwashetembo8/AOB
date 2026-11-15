export function createSerialQueue() {
  let tail: Promise<void> = Promise.resolve();
  return function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = tail.then(operation);
    tail = result.then(() => undefined, () => undefined);
    return result;
  };
}

export async function flushUntilDrained(
  flush: () => Promise<void>,
  hasPending: () => boolean,
): Promise<void> {
  do {
    await flush();
  } while (hasPending());
}
