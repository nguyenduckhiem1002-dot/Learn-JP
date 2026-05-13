import type { Card } from '../../lib/types';

const KATAKANA_K_RE = /^[ア-ン]+(?:\[.*?\])?$/;

/**
 * Visual tags shown on the back of a flashcard. Mirrors the original
 * `getTags` behaviour: maps Vietnamese POS labels to English-language
 * tags and detects katakana / loan-word origin.
 */
export function getCardTags(c: Card): string[] {
    const tags: string[] = [];
    if (c.t === 'Tính từ な') tags.push('Na-adjective');
    else if (c.t === 'Tính từ い') tags.push('I-adjective');
    else tags.push(c.t);

    if (c.tip && c.tip.toLowerCase().includes('mượn')) tags.push('Từ mượn tiếng Anh');
    else if (KATAKANA_K_RE.test(c.k)) tags.push('Katakana');
    return tags;
}
