import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import { applyRating, emptySrs, nextInterval } from '../algorithm';
import { GRADUATE_INTERVAL, LEARNING_STEPS, MIN_EASE } from '../constants';

const M = 1.0;

describe('nextInterval — learning phase', () => {
    test('new card: again → 1 minute', () => {
        const srs = emptySrs();
        assert.equal(nextInterval(srs, 'again', M), LEARNING_STEPS.again);
    });

    test('new card: hard → 6 minutes', () => {
        const srs = emptySrs();
        assert.equal(nextInterval(srs, 'hard', M), LEARNING_STEPS.hard);
    });

    test('new card: good → 1 day (graduating interval), NOT 10 minutes', () => {
        const srs = emptySrs();
        assert.equal(nextInterval(srs, 'good', M), GRADUATE_INTERVAL);
    });

    test('new card: easy → 4 days', () => {
        const srs = emptySrs();
        assert.equal(nextInterval(srs, 'easy', M), 4 * 1440);
    });

    test('learn card with short interval graduates correctly on good', () => {
        // BUG REGRESSION: previously this returned interval*ease*m
        //   ⇒ a card that was just again'd at 10m would graduate
        //   at 25m. The fix is to use the fixed graduating interval.
        const srs = { ...emptySrs(), state: 'learn' as const, interval: 10, reps: 1 };
        assert.equal(nextInterval(srs, 'good', M), GRADUATE_INTERVAL);
    });
});

describe('nextInterval — review phase', () => {
    test('review good: base * ease * multiplier', () => {
        const srs = { ...emptySrs(), state: 'review' as const, interval: 1440, reps: 5, ease: 2.5 };
        assert.equal(nextInterval(srs, 'good', 1.0), 1440 * 2.5);
        assert.equal(nextInterval(srs, 'good', 1.2), 1440 * 2.5 * 1.2);
    });

    test('review hard: base * 1.2 * multiplier', () => {
        const srs = { ...emptySrs(), state: 'review' as const, interval: 1440, reps: 5 };
        assert.equal(nextInterval(srs, 'hard', 1.0), 1440 * 1.2);
    });

    test('review easy: base * ease * 1.3 * multiplier', () => {
        const srs = { ...emptySrs(), state: 'review' as const, interval: 1440, reps: 5, ease: 2.5 };
        assert.equal(nextInterval(srs, 'easy', 1.0), 1440 * 2.5 * 1.3);
    });

    test('review again: short lapse interval (10 minutes)', () => {
        const srs = { ...emptySrs(), state: 'review' as const, interval: 10000, reps: 5 };
        assert.equal(nextInterval(srs, 'again', 1.0), LEARNING_STEPS.good);
    });
});

describe('applyRating', () => {
    test('again on a review card increments lapses and re-enters learn', () => {
        const srs = { ...emptySrs(), state: 'review' as const, interval: 1440, reps: 4, lapses: 0 };
        const { next, isLapse } = applyRating(srs, 'again', 1.0, 1_700_000_000_000);
        assert.equal(isLapse, true);
        assert.equal(next.state, 'learn');
        assert.equal(next.lapses, 1);
        assert.equal(next.reps, 5);
    });

    test('good on a learn card graduates to review', () => {
        const srs = { ...emptySrs(), state: 'learn' as const, interval: 10, reps: 1 };
        const { next } = applyRating(srs, 'good', 1.0, 0);
        assert.equal(next.state, 'review');
        assert.equal(next.interval, GRADUATE_INTERVAL);
    });

    test('ease never drops below MIN_EASE', () => {
        const srs = { ...emptySrs(), ease: 1.4 };
        const { next } = applyRating(srs, 'again', 1.0, 0);
        assert.equal(next.ease, MIN_EASE);
    });

    test('easy bumps ease by 0.15', () => {
        const srs = { ...emptySrs(), state: 'review' as const, interval: 1440, reps: 3, ease: 2.5 };
        const { next } = applyRating(srs, 'easy', 1.0, 0);
        assert.equal(next.ease, 2.65);
    });

    test('dueDate = now + interval * 60_000', () => {
        const srs = { ...emptySrs(), state: 'review' as const, interval: 1440, reps: 3, ease: 2.5 };
        const now = 1_700_000_000_000;
        const { next } = applyRating(srs, 'good', 1.0, now);
        assert.equal(next.dueDate, now + (1440 * 2.5) * 60_000);
    });
});
