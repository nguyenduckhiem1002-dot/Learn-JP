import type { Card } from '../types';
import { shuffle } from '../queue/shuffle';

/**
 * Pick `count` distractor cards plus the correct card and return them
 * in a randomised order suitable for a multiple-choice quiz.
 *
 * Comparison is done by *card identity* (object reference for legacy
 * fallback cards without an id; numeric id otherwise) so it stays
 * stable across array re-renders.
 *
 * If the pool is smaller than requested, returns whatever is available.
 */
export function buildQuizOptions(
    cards: readonly Card[],
    filteredMap: readonly number[],
    correct: Card,
    count: number = 4,
    rng: () => number = Math.random,
): Card[] {
    const distractorCount = Math.max(0, count - 1);

    const pool: Card[] = [];
    for (const idx of filteredMap) {
        const c = cards[idx];
        if (!c) continue;
        if (sameCard(c, correct)) continue;
        pool.push(c);
    }

    const distractors = shuffle(pool, rng).slice(0, distractorCount);
    return shuffle([...distractors, correct], rng);
}

function sameCard(a: Card, b: Card): boolean {
    if (a.id != null && b.id != null) return a.id === b.id;
    return a === b;
}
