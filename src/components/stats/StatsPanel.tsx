'use client';
import { useAnalytics } from '../../hooks/useAnalytics';
import { AccuracyLine } from './AccuracyLine';
import { ForecastChart } from './ForecastChart';
import { HeatmapChart } from './HeatmapChart';
import { KPIStrip } from './KPIStrip';
import { StateDonut } from './StateDonut';
import { TypeBars } from './TypeBars';

/**
 * Top-level analytics dashboard. Fetches the {@link AnalyticsSnapshot}
 * lazily (on tab focus) and renders a stack of six charts.
 *
 * Each chart is a small SVG component — no external chart library is
 * pulled in, keeping bundle size minimal.
 */
export function StatsPanel({ version }: { version: number }) {
    const { data, isLoading, error, refresh } = useAnalytics(version);

    if (isLoading && !data) {
        return (
            <div className="stats-empty" role="status">
                <div className="stats-empty-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                </div>
                <div>Đang tải dữ liệu thống kê...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="stats-empty">
                <div className="stats-empty-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </div>
                <div>Không tải được dữ liệu thống kê: {error}</div>
                <button type="button" className="btn-secondary" onClick={refresh} style={{ marginTop: 12 }}>
                    Thử lại
                </button>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="stats-panel">
            <KPIStrip snapshot={data} />
            <HeatmapChart data={data.heatmap90d} />
            <div className="chart-grid">
                <ForecastChart data={data.forecast14d} />
                <AccuracyLine data={data.accuracy14d} />
            </div>
            <StateDonut states={data.states} rating={data.ratingDistribution30d} />
            <TypeBars data={data.byType} />
        </div>
    );
}
