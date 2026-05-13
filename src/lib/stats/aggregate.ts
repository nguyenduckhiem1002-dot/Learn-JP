import type { Card, SRSData } from '../types';
import type {
    AccuracyPoint,
    AnalyticsSnapshot,
    ForecastPoint,
    HeatmapPoint,
    RatingDistribution,
    ReviewLogEntry,
    StateBreakdown,
    TypeMastery,
} from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Local-time `YYYY-MM-DD` for a given epoch ms. */
export function toDateKey(ts: number): string {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/** Midnight (00:00) at the start of `ts`'s local day. */
function startOfDay(ts: number): number {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

export function isCorrect(rating: ReviewLogEntry['rating']): boolean {
    return rating === 'good' || rating === 'easy';
}

export function buildStateBreakdown(
    srsData: readonly SRSData[],
    now: number,
): StateBreakdown {
    const out: StateBreakdown = { new: 0, learn: 0, review: 0, dueReview: 0 };
    for (const s of srsData) {
        if (!s) continue;
        if (s.state === 'new') out.new++;
        else if (s.state === 'learn') out.learn++;
        else {
            out.review++;
            if ((s.dueDate ?? 0) <= now) out.dueReview++;
        }
    }
    return out;
}

export function buildTypeMastery(
    cards: readonly Card[],
    srsData: readonly SRSData[],
): TypeMastery[] {
    const map = new Map<string, TypeMastery>();
    for (let i = 0; i < cards.length; i++) {
        const c = cards[i];
        const s = srsData[i];
        if (!c) continue;
        const key = c.t || 'Khác';
        let row = map.get(key);
        if (!row) {
            row = { type: key, total: 0, mastered: 0, reviewing: 0, learning: 0, fresh: 0 };
            map.set(key, row);
        }
        row.total++;
        const state = s?.state ?? 'new';
        const lapses = s?.lapses ?? 0;
        if (state === 'new') row.fresh++;
        else if (state === 'learn') row.learning++;
        else {
            row.reviewing++;
            if (lapses === 0) row.mastered++;
        }
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
}

/**
 * Build a contiguous heatmap of the last `days` calendar days, ending
 * on the day containing `now`. Missing days have `reviews=0`.
 */
export function buildHeatmap(
    logs: readonly ReviewLogEntry[],
    now: number,
    days: number = 90,
): HeatmapPoint[] {
    const counts = new Map<string, { reviews: number; correct: number }>();
    for (const log of logs) {
        const key = toDateKey(log.ts);
        const c = counts.get(key) ?? { reviews: 0, correct: 0 };
        c.reviews++;
        if (isCorrect(log.rating)) c.correct++;
        counts.set(key, c);
    }

    const out: HeatmapPoint[] = [];
    const today = startOfDay(now);
    for (let i = days - 1; i >= 0; i--) {
        const ts = today - i * DAY_MS;
        const key = toDateKey(ts);
        const c = counts.get(key);
        out.push({
            date: key,
            reviews: c?.reviews ?? 0,
            accuracy: c && c.reviews > 0 ? c.correct / c.reviews : 0,
        });
    }
    return out;
}

/**
 * Forecast how many cards are scheduled to come due each of the next
 * `days` calendar days. Day 0 is today and includes overdue cards.
 */
export function buildForecast(
    srsData: readonly SRSData[],
    now: number,
    days: number = 14,
): ForecastPoint[] {
    const today = startOfDay(now);
    const buckets = new Array<number>(days).fill(0);

    for (const s of srsData) {
        if (!s || s.state === 'new' || !s.dueDate) continue;
        const dueDay = startOfDay(s.dueDate);
        const diff = Math.round((dueDay - today) / DAY_MS);
        if (diff < 0) buckets[0]++;
        else if (diff < days) buckets[diff]++;
    }

    const out: ForecastPoint[] = [];
    for (let i = 0; i < days; i++) {
        const ts = today + i * DAY_MS;
        out.push({ date: toDateKey(ts), dueCount: buckets[i] ?? 0 });
    }
    return out;
}

/** Per-day accuracy for the last `days` calendar days. */
export function buildAccuracyTrend(
    logs: readonly ReviewLogEntry[],
    now: number,
    days: number = 14,
): AccuracyPoint[] {
    const heat = buildHeatmap(logs, now, days);
    return heat.map((h) => ({ date: h.date, accuracy: h.accuracy }));
}

/**
 * Count consecutive days (ending today, or yesterday if today has no
 * reviews yet) with ≥ 1 review.
 */
export function computeStreak(logs: readonly ReviewLogEntry[], now: number): number {
    if (logs.length === 0) return 0;
    const days = new Set<string>();
    for (const log of logs) days.add(toDateKey(log.ts));

    const today = startOfDay(now);
    let cursor = today;
    if (!days.has(toDateKey(cursor)) && days.has(toDateKey(cursor - DAY_MS))) {
        cursor -= DAY_MS;
    }
    let streak = 0;
    while (days.has(toDateKey(cursor))) {
        streak++;
        cursor -= DAY_MS;
    }
    return streak;
}

export function buildRatingDistribution(
    logs: readonly ReviewLogEntry[],
    now: number,
    days: number = 30,
): RatingDistribution {
    const cutoff = now - days * DAY_MS;
    const out: RatingDistribution = { again: 0, hard: 0, good: 0, easy: 0 };
    for (const log of logs) {
        if (log.ts < cutoff) continue;
        out[log.rating]++;
    }
    return out;
}

/** Build the full {@link AnalyticsSnapshot}. Pure. */
export function buildAnalytics(input: {
    cards: readonly Card[];
    srsData: readonly SRSData[];
    logs: readonly ReviewLogEntry[];
    now: number;
}): AnalyticsSnapshot {
    const { cards, srsData, logs, now } = input;

    let correct = 0;
    for (const log of logs) {
        if (isCorrect(log.rating)) correct++;
    }

    return {
        totalCards: cards.length,
        totalReviews: logs.length,
        streakDays: computeStreak(logs, now),
        accuracyAllTime: logs.length > 0 ? correct / logs.length : 0,
        states: buildStateBreakdown(srsData, now),
        byType: buildTypeMastery(cards, srsData),
        heatmap90d: buildHeatmap(logs, now, 90),
        forecast14d: buildForecast(srsData, now, 14),
        accuracy14d: buildAccuracyTrend(logs, now, 14),
        ratingDistribution30d: buildRatingDistribution(logs, now, 30),
    };
}
