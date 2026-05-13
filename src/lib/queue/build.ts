import type { SRSData, StudySettings } from '../types';
import { shuffle } from './shuffle';

/**
 * Decide whether a card is "due for review" right now. A card is due if:
 *   - it is in the `learn` phase (re-show ASAP), OR
 *   - it has no scheduled date yet, OR
 *   - its scheduled date has already passed.
 */
export function isDue(srs: SRSData, now: number): boolean {
    if (srs.state === 'learn') return true;
    if (!srs.dueDate) return true;
    return srs.dueDate <= now;
}

/**
 * Build a study queue from a list of candidate filtered card indices.
 *
 * Returns a queue of `fIdx` values (positions inside `filteredMap`),
 * matching the existing convention in `useFlashcards`.
 *
 * Rules:
 *   - At most `settings.dailyNew` cards in `new` state.
 *   - At most `settings.dailyReview` due (review or learn) cards.
 *   - Final order is shuffled with Fisher–Yates.
 */
export function buildStudyQueue(
    filteredMap: readonly number[],
    srsData: readonly SRSData[],
    settings: StudySettings,
    now: number = Date.now(),
    rng: () => number = Math.random,
): number[] {
    let newCount = 0;
    let reviewCount = 0;
    const queue: number[] = [];

    filteredMap.forEach((allIdx, fIdx) => {
        const srs = srsData[allIdx];
        if (!srs) return;

        if (srs.state === 'new') {
            if (newCount < settings.dailyNew) {
                queue.push(fIdx);
                newCount++;
            }
        } else if (isDue(srs, now)) {
            if (reviewCount < settings.dailyReview) {
                queue.push(fIdx);
                reviewCount++;
            }
        }
    });

    return shuffle(queue, rng);
}
