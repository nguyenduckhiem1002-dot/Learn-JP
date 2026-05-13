'use client';
import type { AnalyticsSnapshot, RatingDistribution } from '../../lib/stats';

interface Props {
    states: AnalyticsSnapshot['states'];
    rating: RatingDistribution;
}

const SIZE = 160;
const RADIUS = 60;
const THICK = 22;

type Segment = { value: number; color: string; label: string };

/**
 * Render a single donut chart from a list of segments. Segments with
 * `value === 0` are skipped so they don't draw zero-length arcs.
 */
function Donut({ segments }: { segments: Segment[] }) {
    const total = segments.reduce((s, x) => s + x.value, 0);
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    let acc = 0;

    return (
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {total === 0 ? (
                <circle cx={cx} cy={cy} r={RADIUS} fill="none" stroke="var(--color-border-tertiary)" strokeWidth={THICK} />
            ) : (
                segments.map((s, i) => {
                    if (s.value === 0) return null;
                    const start = (acc / total) * Math.PI * 2;
                    acc += s.value;
                    const end = (acc / total) * Math.PI * 2;
                    const large = end - start > Math.PI ? 1 : 0;
                    const x1 = cx + RADIUS * Math.sin(start);
                    const y1 = cy - RADIUS * Math.cos(start);
                    const x2 = cx + RADIUS * Math.sin(end);
                    const y2 = cy - RADIUS * Math.cos(end);
                    return (
                        <path
                            key={i}
                            d={`M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${x2} ${y2}`}
                            fill="none"
                            stroke={s.color}
                            strokeWidth={THICK}
                            strokeLinecap="butt"
                        >
                            <title>
                                {s.label}: {s.value}
                            </title>
                        </path>
                    );
                })
            )}
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize={20} fontWeight={600} fill="var(--color-text-primary)">
                {total}
            </text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill="var(--color-text-tertiary)">
                tổng
            </text>
        </svg>
    );
}

/**
 * Two donuts side-by-side: card state distribution + rating mix in
 * the last 30 days. Together they answer "where do my cards live"
 * and "how am I rating them lately".
 */
export function StateDonut({ states, rating }: Props) {
    const stateSegs: Segment[] = [
        { value: states.new, color: '#bbb', label: 'Mới' },
        { value: states.learn, color: 'var(--again)', label: 'Học lại' },
        { value: states.dueReview, color: 'var(--hard)', label: 'Đến hạn' },
        { value: states.review - states.dueReview, color: 'var(--good)', label: 'Đã thuộc' },
    ];
    const ratingSegs: Segment[] = [
        { value: rating.again, color: 'var(--again)', label: 'Lại' },
        { value: rating.hard, color: 'var(--hard)', label: 'Khó' },
        { value: rating.good, color: 'var(--good)', label: 'Nhớ' },
        { value: rating.easy, color: 'var(--easy)', label: 'Dễ' },
    ];

    return (
        <div className="chart-card chart-card-row">
            <div className="donut-block">
                <div className="chart-title">Trạng thái bộ thẻ</div>
                <Donut segments={stateSegs} />
                <ul className="donut-legend">
                    {stateSegs.map((s) => (
                        <li key={s.label}>
                            <span className="legend-dot" style={{ background: s.color }} />
                            <span>{s.label}</span>
                            <span className="legend-val">{s.value}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <div className="donut-block">
                <div className="chart-title">Phân bố đánh giá (30 ngày)</div>
                <Donut segments={ratingSegs} />
                <ul className="donut-legend">
                    {ratingSegs.map((s) => (
                        <li key={s.label}>
                            <span className="legend-dot" style={{ background: s.color }} />
                            <span>{s.label}</span>
                            <span className="legend-val">{s.value}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
