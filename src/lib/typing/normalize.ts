/**
 * Strip square-bracket annotations and surrounding whitespace.
 */
export function stripBrackets(s: string): string {
    return s.replace(/\[|\]/g, '').trim();
}

/**
 * Normalise an answer for fuzzy comparison: trim, lowercase,
 * collapse German special chars for lenient matching.
 */
function normalize(s: string): string {
    return s.trim().toLowerCase();
}

/**
 * Check whether a typed answer matches a card's expected German word
 * or pronunciation. Comparison is lenient on whitespace / case.
 * For German nouns, articles (der/die/das) are optional in the answer.
 */
export function isTypingAnswerCorrect(
    input: string,
    expectedWord: string,
    expectedPronunciation: string,
): boolean {
    const got = normalize(input);
    if (!got) return false;
    const w = normalize(stripBrackets(expectedWord));
    const p = normalize(expectedPronunciation);

    if (got === w || got === p) return true;

    const withoutArticle = w.replace(/^(der|die|das)\s+/i, '');
    if (got === withoutArticle) return true;

    return false;
}
