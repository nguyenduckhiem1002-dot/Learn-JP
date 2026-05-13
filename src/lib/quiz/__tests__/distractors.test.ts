import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import { buildQuizOptions } from '../distractors';
import type { Card } from '../../types';

const makeCard = (id: number, k: string): Card => ({
    id,
    k,
    h: `h${id}`,
    v: `v${id}`,
    t: 'Danh từ',
    ej: '',
    ev: '',
    tip: '',
});

describe('buildQuizOptions', () => {
    const cards = [makeCard(1, 'one'), makeCard(2, 'two'), makeCard(3, 'three'), makeCard(4, 'four'), makeCard(5, 'five')];
    const filteredMap = [0, 1, 2, 3, 4];

    test('always includes the correct card', () => {
        const options = buildQuizOptions(cards, filteredMap, cards[2], 4, () => 0);
        assert.ok(options.some((c) => c.id === cards[2].id));
    });

    test('returns exactly `count` cards when pool is large enough', () => {
        const options = buildQuizOptions(cards, filteredMap, cards[0], 4, () => 0);
        assert.equal(options.length, 4);
    });

    test('does not include duplicates of the correct card', () => {
        const options = buildQuizOptions(cards, filteredMap, cards[0], 4, () => 0);
        const ids = options.map((c) => c.id!);
        assert.equal(new Set(ids).size, ids.length);
    });

    test('returns whatever is available if pool is smaller than requested', () => {
        const tiny = [makeCard(1, 'a'), makeCard(2, 'b')];
        const options = buildQuizOptions(tiny, [0, 1], tiny[0], 4, () => 0);
        assert.equal(options.length, 2);
    });
});
