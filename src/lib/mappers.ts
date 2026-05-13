import type { Card, CardRating, SRSData, SRSState } from './types';
import { emptySrs } from './srs/algorithm';

/**
 * Convert a row from the Prisma `Card` table (snake_case-ish, full
 * column names) into the compact in-app {@link Card} shape.
 */
export function dbCardToCard(c: Record<string, unknown>): Card {
    return {
        id: c.id as number,
        k: c.kanji as string,
        h: c.hiragana as string,
        v: c.meaning as string,
        t: c.type as string,
        ej: (c.exJp as string) ?? '',
        ev: (c.exVn as string) ?? '',
        tip: (c.tip as string) ?? '',
        img: (c.img as string | null) ?? undefined,
    };
}

/**
 * Convert a `UserProgress` row into in-memory {@link SRSData}. When the
 * row is missing (card has never been reviewed), returns a fresh empty
 * SRS record.
 */
export function dbProgressToSrs(
    prog: Record<string, unknown> | undefined,
): SRSData {
    if (!prog) return emptySrs();
    return {
        rating: (prog.rating as CardRating) ?? null,
        state: ((prog.state as SRSState) ?? 'new') as SRSState,
        ease: (prog.ease as number) ?? 2.5,
        interval: (prog.interval as number) ?? 0,
        reps: (prog.reps as number) ?? 0,
        lapses: (prog.lapses as number) ?? 0,
        dueDate: (prog.dueDate as number) ?? 0,
    };
}
