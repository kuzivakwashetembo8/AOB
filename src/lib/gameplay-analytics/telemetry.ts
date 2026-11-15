import type { AnalyticsMemorySample } from "./database";

type PerformanceWithMemory = Performance & { memory?: { usedJSHeapSize?: number } };
let previousMemoryValue: number | null = null;
let repeatedMemoryCount = 0;

export function readMemorySample(performanceLike: PerformanceWithMemory): AnalyticsMemorySample {
  const memory = performanceLike.memory;
  if (!memory || typeof memory.usedJSHeapSize !== "number") {
    previousMemoryValue = null;
    repeatedMemoryCount = 0;
    return { jsHeapUsedBytes: null, source: "unavailable", availability: "unsupported", quality: "unavailable" };
  }
  const value = memory.usedJSHeapSize;
  if (!Number.isFinite(value) || value < 0) {
    previousMemoryValue = null;
    repeatedMemoryCount = 0;
    return { jsHeapUsedBytes: null, source: "performance.memory.usedJSHeapSize", availability: "available", quality: "invalid" };
  }
  repeatedMemoryCount = value === previousMemoryValue ? repeatedMemoryCount + 1 : 1;
  previousMemoryValue = value;
  return {
    jsHeapUsedBytes: value,
    source: "performance.memory.usedJSHeapSize",
    availability: "available",
    quality: repeatedMemoryCount >= 3 ? "repeated-value" : "browser-reported-unverified",
  };
}
