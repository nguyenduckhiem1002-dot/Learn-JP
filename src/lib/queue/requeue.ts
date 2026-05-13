/**
 * When a card is rated `again` or `hard` during a study session, we want
 * to re-show it soon — but not at the very next position (the user just
 * saw it) and not all the way at the end (they'll forget by then).
 *
 * Anki's behaviour: re-show roughly 6 cards later. We mimic that with a
 * randomized offset in [`minAhead`, `maxAhead`] from the current position.
 *
 * If `fIdx` is already scheduled later in the queue (rated `again` twice
 * in a row), do not duplicate.
 */
export function reinsertForReview(
    queue: readonly number[],
    queuePos: number,
    fIdx: number,
    minAhead: number = 4,
    maxAhead: number = 8,
    rng: () => number = Math.random,
): number[] {
    if (queue.slice(queuePos + 1).includes(fIdx)) {
        return [...queue];
    }
    const remaining = queue.length - (queuePos + 1);
    const offset = Math.min(
        remaining + 1,
        minAhead + Math.floor(rng() * (maxAhead - minAhead + 1)),
    );
    const insertAt = queuePos + 1 + offset;
    const out = [...queue];
    if (insertAt >= out.length) {
        out.push(fIdx);
    } else {
        out.splice(insertAt, 0, fIdx);
    }
    return out;
}
