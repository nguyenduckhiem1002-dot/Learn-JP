'use client';
import { useNow } from '../../hooks/useNow';
import type { Card, SRSData } from '../../lib/types';
import { CARD_TYPES } from '../../lib/types';
import { stripBrackets } from '../../lib/typing';

interface Props {
    cards: readonly Card[];
    srsData: readonly SRSData[];
    filteredMap: readonly number[];
    filterType: string;
    onChangeFilter: (t: string) => void;
    onOpenCard: (allIdx: number) => void;
    onOpenAdd: () => void;
}

export function DeckBrowser({
    cards,
    srsData,
    filteredMap,
    filterType,
    onChangeFilter,
    onOpenCard,
    onOpenAdd,
}: Props) {
    const now = useNow();
    return (
        <>
            <div className="action-bar" style={{ marginTop: 20, maxWidth: 520 }}>
                <div className="section-title" style={{ margin: 0, flex: 1 }}>
                    Tổng quan bộ thẻ ({filteredMap.length})
                </div>
                <button
                    type="button"
                    className="btn-secondary"
                    onClick={onOpenAdd}
                    style={{ flex: 'none' }}
                >
                    <span className="mode-icon">＋</span> Thêm từ
                </button>
            </div>

            <div className="filter-bar">
                {['all', ...CARD_TYPES].map((t) => (
                    <button
                        key={t}
                        type="button"
                        className={`filter-btn ${filterType === t ? 'active' : ''}`}
                        onClick={() => onChangeFilter(t)}
                    >
                        {t === 'all' ? 'Tất cả' : t}
                    </button>
                ))}
            </div>

            <div className="mini-grid">
                {filteredMap.map((allIdx, fIdx) => {
                    const c = cards[allIdx];
                    const srs = srsData[allIdx];
                    if (!c || !srs) return null;
                    const due = srs.state === 'learn' || (srs.dueDate && srs.dueDate <= now);
                    const color = srs.state === 'new' ? '#ccc' : due ? 'var(--again)' : 'var(--good)';
                    return (
                        <button
                            key={fIdx}
                            type="button"
                            className="mini-card"
                            onClick={() => onOpenCard(allIdx)}
                        >
                            <span className="mk">{stripBrackets(c.k)}</span>
                            <span className="mh">{c.h}</span>
                            <span className="mv">{c.v}</span>
                            <span className="mini-dot" style={{ background: color }} />
                        </button>
                    );
                })}
            </div>
        </>
    );
}
