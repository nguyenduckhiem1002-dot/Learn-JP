'use client';
import type { TypeMastery } from '../../lib/stats';

interface Props {
    data: TypeMastery[];
}

/**
 * Stacked-progress bar of mastery by part-of-speech. Shows mastered
 * vs reviewing vs learning vs new for each card type so the user can
 * see *where* they're strongest and which categories still need work.
 */
export function TypeBars({ data }: Props) {
    if (data.length === 0) {
        return (
            <div className="chart-card">
                <div className="chart-title">Tiến độ theo loại từ</div>
                <div className="chart-empty">Chưa có dữ liệu.</div>
            </div>
        );
    }
    return (
        <div className="chart-card">
            <div className="chart-title">Tiến độ theo loại từ</div>
            <div className="chart-subtitle">Đã thuộc / đang ôn / đang học / mới</div>
            <ul className="type-bars">
                {data.map((row) => {
                    const total = Math.max(1, row.total);
                    return (
                        <li key={row.type}>
                            <div className="type-bars-head">
                                <span>{row.type}</span>
                                <span className="type-bars-count">
                                    {row.mastered}/{row.total}
                                </span>
                            </div>
                            <div className="type-bars-track">
                                <span
                                    className="seg seg-mastered"
                                    style={{ width: `${(row.mastered / total) * 100}%` }}
                                    title={`Đã thuộc: ${row.mastered}`}
                                />
                                <span
                                    className="seg seg-review"
                                    style={{ width: `${((row.reviewing - row.mastered) / total) * 100}%` }}
                                    title={`Đang ôn: ${row.reviewing - row.mastered}`}
                                />
                                <span
                                    className="seg seg-learn"
                                    style={{ width: `${(row.learning / total) * 100}%` }}
                                    title={`Đang học: ${row.learning}`}
                                />
                                <span
                                    className="seg seg-new"
                                    style={{ width: `${(row.fresh / total) * 100}%` }}
                                    title={`Chưa học: ${row.fresh}`}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
