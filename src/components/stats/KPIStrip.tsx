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
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c.5 3.5 2 6 4 8 1.5 1.5 2 3.5 2 6a8 8 0 1 1-16 0c0-2.5.5-4.5 2-6 2-2 3.5-4.5 4-8z" /></svg>,
        },
        {
            label: 'Tổng lượt ôn',
            value: snapshot.totalReviews,
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>,
        },
        {
            label: 'Độ chính xác',
            value: pct(snapshot.accuracyAllTime),
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
        },
        {
            label: 'Đến hạn hôm nay',
            value: dueToday,
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
        },
    ];

    return (
        <div className="kpi-strip">
            {items.map((it) => (
                <div className="kpi-card" key={it.label}>
                    <div className="kpi-icon" aria-hidden="true">{it.icon}</div>
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
