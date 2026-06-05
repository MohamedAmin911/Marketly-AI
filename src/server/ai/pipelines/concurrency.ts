type QueueItem = {
  resolve: () => void;
  timeout: ReturnType<typeof setTimeout>;
};

const maxConcurrentAiRequests = Number(process.env.AI_MAX_CONCURRENCY ?? 4);
const queueTimeoutMs = Number(process.env.AI_QUEUE_TIMEOUT_MS ?? 20_000);
let active = 0;
const queue: QueueItem[] = [];

export async function runWithAiConcurrency<T>(task: () => Promise<T>): Promise<T> {
  const release = await acquireSlot();

  try {
    return await task();
  } finally {
    release();
  }
}

function acquireSlot(): Promise<() => void> {
  if (active < maxConcurrentAiRequests) {
    active += 1;
    return Promise.resolve(releaseSlot);
  }

  return new Promise((resolve, reject) => {
    const item: QueueItem = {
      resolve: () => {
        clearTimeout(item.timeout);
        active += 1;
        resolve(releaseSlot);
      },
      timeout: setTimeout(() => {
        const index = queue.indexOf(item);
        if (index >= 0) queue.splice(index, 1);
        reject(new Error("AI request queue timed out. Please retry when generation load drops."));
      }, queueTimeoutMs),
    };

    queue.push(item);
  });
}

function releaseSlot() {
  active = Math.max(0, active - 1);
  const next = queue.shift();
  next?.resolve();
}
