'use client';
import type { ForecastPoint } from '../../lib/stats';

interface Props {
    data: ForecastPoint[];
}

const W = 360;
const H = 140;
const PAD = { top: 10, right: 8, bottom: 28, left: 28 };

const LABEL_VI = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/**
 * 14-day bar chart of upcoming due cards. The bar for "today" is
 * highlighted in the accent colour to make it stand out.
 */
export function ForecastChart({ data }: Props) {
    const max = Math.max(1, ...data.map((d) => d.dueCount));
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const bw = innerW / data.length;

    return (
        <div className="chart-card">
            <div className="chart-title">Lịch ôn 14 ngày tới</div>
            <div className="chart-subtitle">Số thẻ đến hạn</div>
            <svg width={W} height={H} role="img" aria-label="Lịch ôn 14 ngày">
                {/* y axis grid */}
                {[0, 0.5, 1].map((p) => (
                    <line
                        key={p}
                        x1={PAD.left}
                        x2={W - PAD.right}
                        y1={PAD.top + innerH * (1 - p)}
                        y2={PAD.top + innerH * (1 - p)}
                        stroke="var(--color-border-tertiary)"
                        strokeDasharray={p === 0 ? undefined : '2 3'}
                    />
                ))}
                <text x={4} y={PAD.top + 8} fontSize={9} fill="var(--color-text-tertiary)">
                    {max}
                </text>

                {data.map((d, i) => {
                    const h = (d.dueCount / max) * innerH;
                    const x = PAD.left + i * bw;
                    const y = PAD.top + innerH - h;
                    const isToday = i === 0;
                    return (
                        <g key={d.date}>
                            <rect
                                x={x + 2}
                                y={y}
                                width={Math.max(2, bw - 4)}
                                height={h}
                                rx={2}
                                fill={isToday ? 'var(--vermillion)' : '#5a8acf'}
                                opacity={0.85}
                            >
                                <title>
                                    {d.date}: {d.dueCount} thẻ
                                </title>
                            </rect>
                            {i % 2 === 0 && (
                                <text
                                    x={x + bw / 2}
                                    y={H - 12}
                                    fontSize={9}
                                    fill="var(--color-text-tertiary)"
                                    textAnchor="middle"
                                >
                                    {LABEL_VI[new Date(d.date + 'T00:00:00').getDay()]}
                                </text>
                            )}
                            {d.dueCount > 0 && (
                                <text
                                    x={x + bw / 2}
                                    y={y - 3}
                                    fontSize={9}
                                    fill="var(--color-text-secondary)"
                                    textAnchor="middle"
                                >
                                    {d.dueCount}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
