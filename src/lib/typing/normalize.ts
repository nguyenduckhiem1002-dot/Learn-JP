/**
 * Strip square-bracket reading annotations and surrounding whitespace.
 *   "静か[な]" → "静かな"
 *   "  さくら " → "さくら"
 */
export function stripBrackets(s: string): string {
    return s.replace(/\[|\]/g, '').trim();
}

const HIRAGANA_TO_KATAKANA_OFFSET = 0x60;

/**
 * Convert hiragana to katakana for lenient comparison. Leaves other
 * characters untouched.
 */
function hiraganaToKatakana(s: string): string {
    return s.replace(/[\u3041-\u3096]/g, (c) =>
        String.fromCharCode(c.charCodeAt(0) + HIRAGANA_TO_KATAKANA_OFFSET),
    );
}

/**
 * Normalise an answer for fuzzy comparison: trim, lowercase ascii,
 * collapse katakana to hiragana so that both inputs ("サクラ", "さくら")
 * compare equal.
 */
function normalize(s: string): string {
    return hiraganaToKatakana(s.trim().toLowerCase());
}

/**
 * Check whether a typed answer matches a card's expected kanji or
 * hiragana. Comparison is lenient on whitespace / case / kana family.
 */
export function isTypingAnswerCorrect(
    input: string,
    expectedKanji: string,
    expectedHiragana: string,
): boolean {
    const got = normalize(input);
    if (!got) return false;
    const k = normalize(stripBrackets(expectedKanji));
    const h = normalize(expectedHiragana);
    return got === k || got === h;
}
