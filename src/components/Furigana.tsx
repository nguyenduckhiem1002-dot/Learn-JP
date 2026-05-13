import type { Card } from '../lib/types';

const KANJI_RE = /[一-鿿]/;
const BRACKET_RE = /^(.*?)\[(.*?)\]$/;

const hasKanjiChar = (s: string) => KANJI_RE.test(s);

/**
 * Render a card's headword with optional furigana annotations.
 *
 * Behaviour matches the original `renderKanji` in the legacy page:
 *   - If `k` ends with `…[suffix]`, the bracketed suffix is shown in a
 *     subdued bracketed style next to the main reading.
 *   - Furigana is only shown when the main portion of `k` actually
 *     contains a kanji character and the card has a hiragana reading.
 */
export function Furigana({ card }: { card: Card }) {
    const k = card.k;
    const match = k.match(BRACKET_RE);
    const main = match ? match[1] : k;
    const suffix = match ? match[2] : null;
    const showFurigana = hasKanjiChar(main) && !!card.h;

    return (
        <div className={suffix ? 'kanji-wrapper has-bracket' : 'kanji-wrapper'}>
            {showFurigana ? (
                <ruby>
                    {main}
                    <rt>{card.h}</rt>
                </ruby>
            ) : (
                <span>{main}</span>
            )}
            {suffix && <span className="kanji-bracket">[{suffix}]</span>}
        </div>
    );
}
