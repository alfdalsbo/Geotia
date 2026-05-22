const mutationLocks = new Map<string, Promise<void>>();

export async function withDataMutationLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = mutationLocks.get(key) ?? Promise.resolve();
  let release: () => void = () => {};
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  const queued = previous.catch(() => undefined).then(() => next);
  mutationLocks.set(key, queued);

  await previous.catch(() => undefined);

  try {
    return await operation();
  } finally {
    release();
    if (mutationLocks.get(key) === queued) {
      mutationLocks.delete(key);
    }
  }
}
