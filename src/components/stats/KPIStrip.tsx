'use client';
import type { AnalyticsSnapshot } from '../../lib/stats';

interface Props {
    snapshot: AnalyticsSnapshot;
}

function pct(x: number): string {
    return `${Math.round(x * 100)}%`;
}

/**
 * Top-of-page KPI row: streak, total reviews, accuracy, due today.
 * Designed to be the first thing the user sees — fast, glanceable,
 * meant to drive motivation.
 */
export function KPIStrip({ snapshot }: Props) {
    const dueToday = snapshot.forecast14d[0]?.dueCount ?? 0;
    const items = [
        {
            label: 'Streak',
            value: snapshot.streakDays,
            suffix: snapshot.streakDays === 1 ? ' ngày' : ' ngày',
            icon: '🔥',
        },
        {
            label: 'Tổng lượt ôn',
            value: snapshot.totalReviews,
            icon: '📚',
        },
        {
            label: 'Độ chính xác',
            value: pct(snapshot.accuracyAllTime),
            icon: '🎯',
        },
        {
            label: 'Đến hạn hôm nay',
            value: dueToday,
            icon: '⏰',
        },
    ];

    return (
        <div className="kpi-strip">
            {items.map((it) => (
                <div className="kpi-card" key={it.label}>
                    <div className="kpi-icon" aria-hidden>{it.icon}</div>
                    <div className="kpi-body">
                        <div className="kpi-value">
                            {it.value}
                            {'suffix' in it ? it.suffix : ''}
                        </div>
                        <div className="kpi-label">{it.label}</div>
                    </div>
                </div>
            ))}
        </div>
    );
}
