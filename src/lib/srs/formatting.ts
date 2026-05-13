import { MIN_PER_DAY } from './constants';

/**
 * Format a duration (in minutes) for display next to rating buttons.
 *
 * Examples:
 *   - 1.2  → "<1m"
 *   - 25   → "25m"
 *   - 90   → "1h"
 *   - 1440 → "1d"
 *   - 7200 → "5d"
 *   - 60*24*30 → "1mo"
 */
export function fmtInterval(min: number): string {
    if (!Number.isFinite(min) || min < 2) return '<1m';
    if (min < 60) return `${Math.round(min)}m`;
    if (min < MIN_PER_DAY) return `${Math.round(min / 60)}h`;
    const days = Math.round(min / MIN_PER_DAY);
    if (days < 30) return `${days}d`;
    const months = Math.round(days / 30);
    if (months < 12) return `${months}mo`;
    return `${Math.round(days / 365)}y`;
}
