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
                <div className="stats-empty-emoji">📊</div>
                <div>Đang tải dữ liệu thống kê...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="stats-empty">
                <div className="stats-empty-emoji">⚠️</div>
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
