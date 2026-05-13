import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import { buildStudyQueue, isDue } from '../build';
import { reinsertForReview } from '../requeue';
import { shuffle } from '../shuffle';
import { emptySrs } from '../../srs/algorithm';
import type { SRSData, StudySettings } from '../../types';

function srs(state: 'new' | 'learn' | 'review', due?: number, extras: Partial<SRSData> = {}): SRSData {
    return { ...emptySrs(), state, dueDate: due, ...extras };
}

describe('isDue', () => {
    test('learn → always due', () => {
        assert.equal(isDue(srs('learn'), 1000), true);
    });
    test('no dueDate → due', () => {
        assert.equal(isDue({ ...emptySrs(), state: 'review' }, 1000), true);
    });
    test('due in past → due', () => {
        assert.equal(isDue(srs('review', 500), 1000), true);
    });
    test('due in future → not due', () => {
        assert.equal(isDue(srs('review', 2000), 1000), false);
    });
});

describe('buildStudyQueue', () => {
    const SETTINGS: StudySettings = { dailyNew: 2, dailyReview: 3, easeMultiplier: 1 };
    const NOW = 10_000;

    test('honors dailyNew and dailyReview caps', () => {
        const srsData: SRSData[] = [
            srs('new'),       // 0
            srs('new'),       // 1
            srs('new'),       // 2  (dropped — over dailyNew)
            srs('learn'),     // 3
            srs('review', 1), // 4 due
            srs('review', 1), // 5 due
            srs('review', 1), // 6 due (dropped — over dailyReview, 4 already counts)
        ];
        const filteredMap = [0, 1, 2, 3, 4, 5, 6];
        // Deterministic rng (no shuffling)
        const q = buildStudyQueue(filteredMap, srsData, SETTINGS, NOW, () => 0);
        assert.equal(q.length, 2 + 3);
        const setQ = new Set(q);
        assert.ok(setQ.has(0));
        assert.ok(setQ.has(1));
        assert.ok(!setQ.has(2)); // new cap
        assert.ok(setQ.has(3)); // learn
    });

    test('skips review cards that are not due yet', () => {
        const srsData: SRSData[] = [
            srs('review', 100_000), // not due
            srs('review', 1),       // due
        ];
        const q = buildStudyQueue([0, 1], srsData, SETTINGS, NOW, () => 0);
        assert.deepEqual(q, [1]);
    });
});

describe('shuffle (Fisher-Yates)', () => {
    test('seeded rng → deterministic permutation', () => {
        const vals = [0, 1, 2, 3, 4];
        // PRNG cycle
        const seq = [0.1, 0.9, 0.4, 0.7, 0.2, 0.6];
        let i = 0;
        const rng = () => seq[i++ % seq.length];
        const a = shuffle(vals, rng);
        i = 0;
        const b = shuffle(vals, rng);
        assert.deepEqual(a, b);
        assert.equal(a.length, vals.length);
        assert.deepEqual([...a].sort(), [...vals].sort());
    });

    test('does not mutate input', () => {
        const vals = [1, 2, 3];
        shuffle(vals);
        assert.deepEqual(vals, [1, 2, 3]);
    });
});

describe('reinsertForReview', () => {
    test('inserts ahead of the current position, not at the end', () => {
        const q = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const out = reinsertForReview(q, /*queuePos*/ 0, /*fIdx*/ 0, 4, 4, () => 0);
        // queuePos=0, offset=4 → inserted at index 5
        assert.equal(out[5], 0);
        assert.equal(out.length, q.length + 1);
    });

    test('does not duplicate if fIdx already pending in queue', () => {
        const q = [10, 11, 12, 13];
        const out = reinsertForReview(q, 0, 12, 4, 4, () => 0);
        assert.deepEqual(out, q);
    });

    test('falls back to pushing at end if queue is short', () => {
        const q = [99];
        const out = reinsertForReview(q, 0, 42, 4, 4, () => 0);
        assert.equal(out[out.length - 1], 42);
    });
});
