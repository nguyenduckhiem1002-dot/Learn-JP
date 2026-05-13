import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import { fmtInterval } from '../formatting';

describe('fmtInterval', () => {
    test('< 2 minutes → "<1m"', () => {
        assert.equal(fmtInterval(0), '<1m');
        assert.equal(fmtInterval(1.5), '<1m');
    });

    test('minutes', () => {
        assert.equal(fmtInterval(25), '25m');
        assert.equal(fmtInterval(59), '59m');
    });

    test('hours', () => {
        assert.equal(fmtInterval(90), '2h');
        assert.equal(fmtInterval(60), '1h');
    });

    test('days', () => {
        assert.equal(fmtInterval(1440), '1d');
        assert.equal(fmtInterval(7200), '5d');
    });

    test('months', () => {
        assert.equal(fmtInterval(60 * 24 * 60), '2mo');
    });

    test('years', () => {
        assert.equal(fmtInterval(60 * 24 * 400), '1y');
    });
});
