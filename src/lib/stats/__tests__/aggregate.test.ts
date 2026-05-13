import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import {
    buildAccuracyTrend,
    buildForecast,
    buildHeatmap,
    buildRatingDistribution,
    buildStateBreakdown,
    buildTypeMastery,
    computeStreak,
    toDateKey,
} from '../aggregate';
import type { ReviewLogEntry } from '../types';
import { emptySrs } from '../../srs/algorithm';
import type { Card, SRSData } from '../../types';

const DAY = 24 * 60 * 60 * 1000;
// Pick a deterministic "now" near noon local time so we don't fall on
// a day boundary regardless of timezone.
const NOW = new Date(2026, 4, 15, 12, 0, 0).getTime();

function log(daysAgo: number, rating: ReviewLogEntry['rating'] = 'good'): ReviewLogEntry {
    return {
        cardId: 1,
        rating,
        prevState: 'review',
        prevInterval: 1440,
        newInterval: 1440,
        ease: 2.5,
        ts: NOW - daysAgo * DAY,
    };
}

describe('toDateKey', () => {
    test('uses local time, not UTC', () => {
        const key = toDateKey(NOW);
        assert.equal(key.length, 10);
        assert.match(key, /^\d{4}-\d{2}-\d{2}$/);
    });
});

describe('buildStateBreakdown', () => {
    test('separates due-review from future-review', () => {
        const srsData: SRSData[] = [
            { ...emptySrs(), state: 'new' },
            { ...emptySrs(), state: 'learn' },
            { ...emptySrs(), state: 'review', dueDate: NOW - DAY }, // due
            { ...emptySrs(), state: 'review', dueDate: NOW + DAY }, // not due
        ];
        const b = buildStateBreakdown(srsData, NOW);
        assert.equal(b.new, 1);
        assert.equal(b.learn, 1);
        assert.equal(b.review, 2);
        assert.equal(b.dueReview, 1);
    });
});

describe('buildTypeMastery', () => {
    test('counts mastered = review with no lapses', () => {
        const cards: Card[] = [
            { id: 1, k: 'a', h: 'a', v: 'A', t: 'Danh từ', ej: '', ev: '', tip: '' },
            { id: 2, k: 'b', h: 'b', v: 'B', t: 'Danh từ', ej: '', ev: '', tip: '' },
            { id: 3, k: 'c', h: 'c', v: 'C', t: 'Danh từ', ej: '', ev: '', tip: '' },
        ];
        const srsData: SRSData[] = [
            { ...emptySrs(), state: 'review', lapses: 0 },
            { ...emptySrs(), state: 'review', lapses: 2 },
            { ...emptySrs(), state: 'new' },
        ];
        const m = buildTypeMastery(cards, srsData);
        assert.equal(m.length, 1);
        const row = m[0];
        assert.equal(row.total, 3);
        assert.equal(row.mastered, 1);
        assert.equal(row.reviewing, 2);
        assert.equal(row.fresh, 1);
    });
});

describe('buildHeatmap', () => {
    test('produces a contiguous array of `days` entries ending today', () => {
        const logs = [log(0), log(0), log(2, 'again')];
        const heat = buildHeatmap(logs, NOW, 5);
        assert.equal(heat.length, 5);
        // last entry should be today
        const todayKey = toDateKey(NOW);
        assert.equal(heat[heat.length - 1].date, todayKey);
        assert.equal(heat[heat.length - 1].reviews, 2);
        assert.equal(heat[heat.length - 1].accuracy, 1);
        // entry for 2 days ago: 1 review, 0 accuracy
        assert.equal(heat[heat.length - 3].reviews, 1);
        assert.equal(heat[heat.length - 3].accuracy, 0);
    });
});

describe('buildForecast', () => {
    test('day 0 includes overdue cards', () => {
        const FOUR_H = 4 * 60 * 60 * 1000;
        const srsData: SRSData[] = [
            { ...emptySrs(), state: 'review', dueDate: NOW - 10 * DAY }, // very overdue
            { ...emptySrs(), state: 'review', dueDate: NOW + FOUR_H }, // still today
            { ...emptySrs(), state: 'review', dueDate: NOW + 2 * DAY }, // day 2
            { ...emptySrs(), state: 'new' }, // ignored
        ];
        const f = buildForecast(srsData, NOW, 5);
        assert.equal(f.length, 5);
        // first bucket includes the overdue card AND the one due later today.
        assert.equal(f[0].dueCount, 2);
        assert.equal(f[2].dueCount, 1);
    });
});

describe('buildAccuracyTrend', () => {
    test('matches heatmap accuracy', () => {
        const logs = [log(0, 'good'), log(0, 'again'), log(1, 'good')];
        const acc = buildAccuracyTrend(logs, NOW, 3);
        assert.equal(acc.length, 3);
        assert.equal(acc[acc.length - 1].accuracy, 0.5);
        assert.equal(acc[acc.length - 2].accuracy, 1);
    });
});

describe('computeStreak', () => {
    test('0 when no logs', () => {
        assert.equal(computeStreak([], NOW), 0);
    });
    test('consecutive days starting today', () => {
        const logs = [log(0), log(1), log(2), log(4)];
        assert.equal(computeStreak(logs, NOW), 3);
    });
    test('counts streak ending yesterday if today has no reviews', () => {
        const logs = [log(1), log(2)];
        assert.equal(computeStreak(logs, NOW), 2);
    });
});

describe('buildRatingDistribution', () => {
    test('only counts logs in window', () => {
        const logs = [log(1, 'good'), log(2, 'hard'), log(40, 'again')];
        const d = buildRatingDistribution(logs, NOW, 30);
        assert.equal(d.good, 1);
        assert.equal(d.hard, 1);
        assert.equal(d.again, 0);
        assert.equal(d.easy, 0);
    });
});
