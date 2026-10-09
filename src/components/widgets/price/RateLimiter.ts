import { info } from "@tauri-apps/plugin-log";

const LIMITS = [
  { cap: 5, ms: 10 * 1000 },
  { cap: 15, ms: 60 * 1000 },
  { cap: 30, ms: 300 * 1000 },
  { cap: 600, ms: 21600 * 1000 },
];

let times: number[] = [];

const RateLimiter = () => {
  const now = Date.now();

  times = times.filter((t) => now - t < LIMITS[LIMITS.length - 1].ms);

  for (const limit of LIMITS) {
    const bucket = times.filter((t) => now - t < limit.ms);

    info(`bucket cap: ${limit.cap}, length: ${bucket.length}`);

    if (bucket.length >= limit.cap) {
      return limit.ms - (now - bucket[0]);
    }
  }

  times = [...times, now];
  return 0;
};

const updateTimes = async (state: string) => {
  const now = Date.now();
  const rates = state.split(",");
  const b = [
    rates[0].split(":")[0],
    rates[1].split(":")[0],
    rates[2].split(":")[0],
    rates[3].split(":")[0],
  ];

  for (let i = 0; i < LIMITS.length; i++) {
    const bucket = times.filter((t) => now - t < LIMITS[i].ms);

    if (bucket.length < Number(b[i])) {
      const diff = Number(b[i]) - bucket.length;

      for (let j = 0; j < diff; j++) {
        times = [...times, now - LIMITS[i - 1 < 0 ? i : i - 1].ms - 1000];
      }
    }
  }
};

export { RateLimiter, updateTimes };
