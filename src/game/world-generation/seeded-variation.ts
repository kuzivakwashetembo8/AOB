/**
 * Stateless, feature-keyed variation. Inserting a new feature does not reshuffle
 * existing results, unlike a shared sequential PRNG. Never use Math.random here.
 */
export function stableFeatureHash(seed: string | number, generatorVersion: number, featureKey: string): number {
  const input = `${typeof seed}:${String(seed)}|v${generatorVersion}|${featureKey}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

/** Stable in [0,1); featureKey should include a stable local index/semantic name. */
export function featureRandom(seed: string | number, generatorVersion: number, featureKey: string): number {
  if (!Number.isSafeInteger(generatorVersion) || generatorVersion < 1 || !featureKey) {
    throw new Error("A positive integer generatorVersion and nonempty featureKey are required");
  }
  if ((typeof seed === "number" && !Number.isSafeInteger(seed)) || (typeof seed === "string" && !seed)) {
    throw new Error("Seed must be a nonempty string or safe integer");
  }
  // Final avalanche reduces FNV's low-bit correlation for nearby feature keys.
  let h = stableFeatureHash(seed, generatorVersion, featureKey);
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 0x100000000;
}

export function featureRange(
  seed: string | number,
  generatorVersion: number,
  featureKey: string,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum < minimum) {
    throw new Error("Variation range must be finite and ordered");
  }
  return minimum + featureRandom(seed, generatorVersion, featureKey) * (maximum - minimum);
}

export function featureChoice<T>(
  seed: string | number,
  generatorVersion: number,
  featureKey: string,
  choices: readonly T[],
): T {
  if (choices.length === 0) throw new Error("Variation choices cannot be empty");
  return choices[Math.floor(featureRandom(seed, generatorVersion, featureKey) * choices.length)]!;
}
