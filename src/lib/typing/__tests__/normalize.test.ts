import { strict as assert } from 'node:assert';
import { test, describe } from 'node:test';
import { isTypingAnswerCorrect, stripBrackets } from '../normalize';

describe('stripBrackets', () => {
    test('removes square brackets', () => {
        assert.equal(stripBrackets('静か[な]'), '静かな');
        assert.equal(stripBrackets('ハンサム[な]'), 'ハンサムな');
        assert.equal(stripBrackets('大きい'), '大きい');
    });
    test('trims whitespace', () => {
        assert.equal(stripBrackets('  きれい[な]  '), 'きれいな');
    });
});

describe('isTypingAnswerCorrect', () => {
    test('matches hiragana', () => {
        assert.equal(isTypingAnswerCorrect('しずか', '静か[な]', 'しずか'), true);
    });

    test('matches kanji', () => {
        assert.equal(isTypingAnswerCorrect('静かな', '静か[な]', 'しずか'), true);
    });

    test('ignores extra whitespace', () => {
        assert.equal(isTypingAnswerCorrect('  しずか  ', '静か[な]', 'しずか'), true);
    });

    test('treats hiragana and katakana of same word as equal', () => {
        assert.equal(isTypingAnswerCorrect('シズカ', '静か[な]', 'しずか'), true);
    });

    test('returns false on wrong answer', () => {
        assert.equal(isTypingAnswerCorrect('にぎやか', '静か[な]', 'しずか'), false);
    });

    test('empty input → false', () => {
        assert.equal(isTypingAnswerCorrect('', '静か', 'しずか'), false);
    });
});
