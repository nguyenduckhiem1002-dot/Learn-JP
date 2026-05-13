/**
 * SRS algorithm constants — kept here so they're easy to tune without
 * digging into the hook. All time values are in minutes for consistency
 * with how `SRSData.interval` is stored.
 */

export const MIN_PER_DAY = 1440;

/** Initial ease factor for a brand-new card (SM-2 default). */
export const INITIAL_EASE = 2.5;

/** Ease factor lower bound — same as Anki, prevents runaway shrinkage. */
export const MIN_EASE = 1.3;

/** Per-rating delta applied to ease after a review. */
export const EASE_DELTA = {
    again: -0.2,
    hard: -0.15,
    good: 0,
    easy: +0.15,
} as const;

/**
 * Intervals (minutes) used for cards in the early `learn` phase.
 * The card is only graduated to `review` after a `good` or `easy`.
 */
export const LEARNING_STEPS = {
    again: 1,
    hard: 6,
    good: 10,
} as const;

/**
 * Interval (minutes) used the moment a card graduates from `learn`
 * to `review`. Equivalent to Anki's "graduating interval".
 */
export const GRADUATE_INTERVAL = MIN_PER_DAY;

/** Interval (minutes) used when rating a `new`/`learn` card as `easy`. */
export const EASY_GRADUATE_INTERVAL = 4 * MIN_PER_DAY;

/**
 * Hard multiplier — Anki uses 1.2. Applied on top of `easeMultiplier`.
 */
export const HARD_MULT = 1.2;

/** Easy bonus — Anki uses 1.3. Applied on top of `easeMultiplier`. */
export const EASY_BONUS = 1.3;
