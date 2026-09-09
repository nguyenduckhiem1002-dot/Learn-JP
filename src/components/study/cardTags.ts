import type { Card } from '../../lib/types';

/**
 * Visual tags shown on the back of a flashcard for German words.
 */
export function getCardTags(c: Card): string[] {
    const tags: string[] = [];
    const TYPE_MAP: Record<string, string> = {
        'Danh từ': 'Nomen',
        'Động từ': 'Verb',
        'Tính từ': 'Adjektiv',
        'Phó từ': 'Adverb',
        'Giới từ': 'Präposition',
        'Liên từ': 'Konjunktion',
    };
    tags.push(TYPE_MAP[c.t] ?? c.t);

    if (c.k.startsWith('der ')) tags.push('Maskulin');
    else if (c.k.startsWith('die ')) tags.push('Feminin');
    else if (c.k.startsWith('das ')) tags.push('Neutrum');

    return tags;
}
