/**
 * Concurrency helpers shared by the batch AI runners.
 */

/**
 * Runs `worker` over `items` with at most `concurrency` in flight at a time.
 * Each worker pulls from a shared index, so the pool stays full until the queue
 * drains — better throughput than chunked Promise.all when individual tasks
 * vary in duration.
 */
export async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0;
  const drain = async (): Promise<void> => {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) {
        return;
      }
      await worker(items[idx]!);
    }
  };
  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, drain));
}
