import type { SRSData, CardRating, SRSState } from '../types';
import {
    EASE_DELTA,
    EASY_BONUS,
    EASY_GRADUATE_INTERVAL,
    GRADUATE_INTERVAL,
    HARD_MULT,
    INITIAL_EASE,
    LEARNING_STEPS,
    MIN_EASE,
} from './constants';

export type Rating = NonNullable<CardRating>;

export function emptySrs(): SRSData {
    return {
        rating: null,
        state: 'new',
        ease: INITIAL_EASE,
        interval: 0,
        reps: 0,
        dueDate: 0,
    };
}

/**
 * Pure: compute the next interval (in minutes) for a card given its
 * current SRS data and the user's rating.
 *
 * Differs from the previous implementation in one important way:
 * graduation from `learn`/`new` uses a FIXED graduating interval
 * (1 day for good, 4 days for easy) instead of `interval * ease`.
 * This matches SM-2 / Anki and prevents the "10m → 25m" graduation bug
 * that occurred when a card was rated `again` (interval=10m) and then
 * `good` on the very next try.
 */
export function nextInterval(
    srs: SRSData,
    rating: Rating,
    easeMultiplier: number,
): number {
    const isLearning = srs.state === 'new' || srs.state === 'learn';

    if (isLearning) {
        switch (rating) {
            case 'again':
                return LEARNING_STEPS.again;
            case 'hard':
                return LEARNING_STEPS.hard;
            case 'good':
                return GRADUATE_INTERVAL;
            case 'easy':
                return EASY_GRADUATE_INTERVAL;
        }
    }

    // Card is already in `review`. Use SM-2 multiplicative formula.
    const base = srs.interval > 0 ? srs.interval : GRADUATE_INTERVAL;

    switch (rating) {
        case 'again':
            // Lapse → re-enter learning with a short step.
            return LEARNING_STEPS.good;
        case 'hard':
            return base * HARD_MULT * easeMultiplier;
        case 'good':
            return base * srs.ease * easeMultiplier;
        case 'easy':
            return base * srs.ease * EASY_BONUS * easeMultiplier;
    }
}

function nextState(prev: SRSState, rating: Rating): SRSState {
    if (rating === 'again') return 'learn';
    if (rating === 'hard') return prev === 'review' ? 'review' : 'learn';
    return 'review';
}

function updateEase(prevEase: number, rating: Rating): number {
    const next = prevEase + EASE_DELTA[rating];
    return Math.max(MIN_EASE, next);
}

export interface ApplyRatingResult {
    next: SRSData;
    /** Whether the card is a lapse (was due, then again'd). */
    isLapse: boolean;
}

/**
 * Pure: take a card's current SRS data + a rating and return the next
 * SRS data. Does not touch React state or perform any I/O.
 *
 * @param now - injected for testability (default `Date.now()`).
 */
export function applyRating(
    srs: SRSData,
    rating: Rating,
    easeMultiplier: number,
    now: number = Date.now(),
): ApplyRatingResult {
    const interval = nextInterval(srs, rating, easeMultiplier);
    const wasReview = srs.state === 'review';
    const isLapse = wasReview && rating === 'again';

    const next: SRSData = {
        rating,
        state: nextState(srs.state, rating),
        ease: updateEase(srs.ease, rating),
        interval,
        reps: srs.reps + 1,
        lapses: (srs.lapses ?? 0) + (isLapse ? 1 : 0),
        dueDate: now + interval * 60_000,
    };

    return { next, isLapse };
}
