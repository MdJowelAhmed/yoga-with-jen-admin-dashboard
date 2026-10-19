export const mockServerHealth = {
  status: "healthy",
  database: {
    status: "connected",
    readyState: 1,
  },
  redis: {
    status: "connected",
  },
  cpuCores: 8,
  loadAverage: {
    "1min": 0.65,
    "5min": 0.82,
    "15min": 0.74,
  },
  memory: {
    totalMemory: { GB: 16.0, MB: 16384 },
    freeMemory: { GB: 6.8, MB: 6963 },
    usedMemory: { GB: 9.2, MB: 9421 },
    usedMemoryPercentage: 57.5,
  },
  uptime: {
    days: 4,
    hours: 18,
    minutes: 42,
  },
  timestamp: new Date().toISOString(),
};

export const mockQueueAndCache = {
  redis: {
    connected: true,
    pingMs: 2.4,
    usedMemoryHuman: "38.2 MB",
    totalKeys: 1845,
    appCacheKeys: 520,
    bullKeys: 1325,
    uptimeSeconds: 412920,
    version: "7.2.4",
  },
  queues: [
    {
      name: "email-queue",
      isPaused: false,
      counts: {
        waiting: 5,
        active: 2,
        completed: 14820,
        failed: 3,
        delayed: 1,
        paused: 0,
      },
    },
    {
      name: "notification-queue",
      isPaused: false,
      counts: {
        waiting: 12,
        active: 4,
        completed: 28940,
        failed: 0,
        delayed: 0,
        paused: 0,
      },
    },
    {
      name: "sms-queue",
      isPaused: false,
      counts: {
        waiting: 0,
        active: 0,
        completed: 3120,
        failed: 0,
        delayed: 0,
        paused: 0,
      },
    },
    {
      name: "cleanup-queue",
      isPaused: true,
      counts: {
        waiting: 1,
        active: 0,
        completed: 480,
        failed: 0,
        delayed: 10,
        paused: 1,
      },
    },
    {
      name: "meta-capi-queue",
      isPaused: false,
      counts: {
        waiting: 3,
        active: 1,
        completed: 9240,
        failed: 2,
        delayed: 0,
        paused: 0,
      },
    },
  ],
};
