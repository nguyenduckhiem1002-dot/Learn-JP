/**
 * Unbiased Fisher–Yates shuffle. Mutates a *copy*; the input array is
 * not modified.
 *
 * @param rng - injected for testability (default `Math.random`).
 */
export function shuffle<T>(arr: readonly T[], rng: () => number = Math.random): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}
