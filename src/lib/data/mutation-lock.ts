let mutationLock: Promise<void> = Promise.resolve();

export async function withDataMutationLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  void key;
  const previous = mutationLock;
  let release: () => void = () => {};
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  const queued = previous.catch(() => undefined).then(() => next);
  mutationLock = queued;

  await previous.catch(() => undefined);

  try {
    return await operation();
  } finally {
    release();
    if (mutationLock === queued) {
      mutationLock = Promise.resolve();
    }
  }
}
