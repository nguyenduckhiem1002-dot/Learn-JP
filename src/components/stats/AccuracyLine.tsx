'use client';
import type { AccuracyPoint } from '../../lib/stats';

interface Props {
    data: AccuracyPoint[];
}

const W = 360;
const H = 140;
const PAD = { top: 16, right: 8, bottom: 24, left: 32 };

/**
 * 14-day accuracy line chart. Days with no reviews are rendered as a
 * gap to avoid misleading "100%" or "0%" lines.
 */
export function AccuracyLine({ data }: Props) {
    if (data.length === 0) {
        return (
            <div className="chart-card">
                <div className="chart-title">Độ chính xác 14 ngày</div>
                <div className="chart-empty">Chưa có dữ liệu.</div>
            </div>
        );
    }

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const step = innerW / Math.max(1, data.length - 1);

    const points: { x: number; y: number; v: number | null }[] = data.map((d, i) => ({
        x: PAD.left + i * step,
        y: PAD.top + innerH * (1 - d.accuracy),
        v: d.accuracy,
    }));

    // Build a path that "lifts the pen" on zero-review days.
    let path = '';
    let penDown = false;
    data.forEach((d, i) => {
        const hasData = d.accuracy > 0 || d.date === data[data.length - 1].date;
        const p = points[i];
        if (!hasData) {
            penDown = false;
            return;
        }
        path += penDown ? ` L ${p.x} ${p.y}` : ` M ${p.x} ${p.y}`;
        penDown = true;
    });

    return (
        <div className="chart-card">
            <div className="chart-title">Độ chính xác 14 ngày</div>
            <div className="chart-subtitle">Tỉ lệ &quot;Nhớ/Dễ&quot; trên tổng số lượt ôn</div>
            <svg width={W} height={H} role="img" aria-label="Độ chính xác 14 ngày">
                {[0, 0.5, 1].map((p) => (
                    <g key={p}>
                        <line
                            x1={PAD.left}
                            x2={W - PAD.right}
                            y1={PAD.top + innerH * (1 - p)}
                            y2={PAD.top + innerH * (1 - p)}
                            stroke="var(--color-border-tertiary)"
                            strokeDasharray={p === 0 || p === 1 ? undefined : '2 3'}
                        />
                        <text
                            x={4}
                            y={PAD.top + innerH * (1 - p) + 3}
                            fontSize={9}
                            fill="var(--color-text-tertiary)"
                        >
                            {Math.round(p * 100)}%
                        </text>
                    </g>
                ))}

                <path d={path} fill="none" stroke="var(--good)" strokeWidth={2} strokeLinejoin="round" />

                {points.map((p, i) =>
                    data[i].accuracy > 0 ? (
                        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="var(--good)">
                            <title>
                                {data[i].date}: {Math.round((p.v ?? 0) * 100)}%
                            </title>
                        </circle>
                    ) : null,
                )}
            </svg>
        </div>
    );
}
