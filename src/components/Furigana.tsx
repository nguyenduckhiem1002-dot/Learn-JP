import type { Card } from '../lib/types';

/**
 * Render a German word with optional article highlighting.
 * For nouns with articles (der/die/das), the article is shown
 * in a colored style to help memorization.
 */
export function Furigana({ card }: { card: Card }) {
    const word = card.k;
    const articleMatch = word.match(/^(der|die|das)\s+(.+)$/i);

    if (articleMatch) {
        const article = articleMatch[1];
        const noun = articleMatch[2];
        const articleClass =
            article.toLowerCase() === 'der'
                ? 'article-der'
                : article.toLowerCase() === 'die'
                  ? 'article-die'
                  : 'article-das';
        return (
            <div className="german-word-wrapper">
                <span className={`german-article ${articleClass}`}>{article}</span>{' '}
                <span className="german-noun">{noun}</span>
            </div>
        );
    }

    return (
        <div className="german-word-wrapper">
            <span>{word}</span>
        </div>
    );
}
