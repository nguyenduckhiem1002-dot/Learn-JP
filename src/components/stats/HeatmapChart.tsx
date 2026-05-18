'use client';
import type { HeatmapPoint } from '../../lib/stats';

interface Props {
    data: HeatmapPoint[];
}

const CELL = 10;
const GAP = 3;
const WEEKS = 13; // 13 weeks ≈ 90 days
const DAYS = 7;
const LABEL_W = 22;
const SVG_W = LABEL_W + WEEKS * (CELL + GAP);
const SVG_H = DAYS * (CELL + GAP) + 2;

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/**
 * Pick a cell colour based on how active the day was.
 * 5 buckets, GitHub-style green ramp adapted to the app's palette.
 */
function colorFor(reviews: number): string {
    if (reviews === 0) return 'var(--color-border-tertiary)';
    if (reviews < 5) return '#cfe9d5';
    if (reviews < 15) return '#86c89a';
    if (reviews < 30) return '#3aa168';
    return 'var(--good)';
}

/**
 * GitHub-style contribution heatmap. Each column is a week (Sun→Sat).
 * The right-most column ends on today.
 */
export function HeatmapChart({ data }: Props) {
    if (data.length === 0) {
        return <EmptyChart title="Heatmap 90 ngày" />;
    }

    // Compute weekday offset of the FIRST date so the heatmap aligns
    // to Sunday columns.
    const firstDate = new Date(data[0].date + 'T00:00:00');
    const leadingBlanks = firstDate.getDay(); // 0..6

    return (
        <div className="chart-card">
            <div className="chart-title">Hoạt động 90 ngày qua</div>
            <div className="chart-subtitle">Số lượt ôn mỗi ngày</div>
            <div className="chart-svg-wrap">
                <svg width={SVG_W} height={SVG_H} role="img" aria-label="Heatmap hoạt động">
                    {WEEKDAY_LABELS.map((label, i) => (
                        <text
                            key={i}
                            x={2}
                            y={i * (CELL + GAP) + CELL - 1}
                            fontSize={8}
                            fill="var(--color-text-tertiary)"
                        >
                            {label}
                        </text>
                    ))}
                    {data.map((d, i) => {
                        const flat = i + leadingBlanks;
                        const col = Math.floor(flat / DAYS);
                        const row = flat % DAYS;
                        return (
                            <rect
                                key={d.date}
                                x={LABEL_W + col * (CELL + GAP)}
                                y={row * (CELL + GAP)}
                                width={CELL}
                                height={CELL}
                                rx={3}
                                fill={colorFor(d.reviews)}
                            >
                                <title>
                                    {d.date}: {d.reviews} lượt
                                    {d.reviews > 0
                                        ? ` · chính xác ${Math.round(d.accuracy * 100)}%`
                                        : ''}
                                </title>
                            </rect>
                        );
                    })}
                </svg>
            </div>
            <div className="heatmap-legend">
                <span>Ít</span>
                {[0, 1, 5, 15, 30].map((v) => (
                    <span key={v} className="legend-cell" style={{ background: colorFor(v) }} />
                ))}
                <span>Nhiều</span>
            </div>
        </div>
    );
}

function EmptyChart({ title }: { title: string }) {
    return (
        <div className="chart-card">
            <div className="chart-title">{title}</div>
            <div className="chart-empty">Chưa có dữ liệu.</div>
        </div>
    );
}
