'use client';
import { useCallback, useMemo, useState } from 'react';
import { useNow } from '../../hooks/useNow';
import type { Card, SRSData } from '../../lib/types';
import { CARD_TYPES } from '../../lib/types';
import { stripBrackets } from '../../lib/typing';

const PAGE_SIZE = 60;

interface Props {
    cards: readonly Card[];
    srsData: readonly SRSData[];
    filteredMap: readonly number[];
    filterType: string;
    onChangeFilter: (t: string) => void;
    onOpenCard: (allIdx: number) => void;
    onOpenAdd: () => void;
    onDeleteCards: (indices: number[]) => Promise<void>;
}

export function DeckBrowser({
    cards,
    srsData,
    filteredMap,
    filterType,
    onChangeFilter,
    onOpenCard,
    onOpenAdd,
    onDeleteCards,
}: Props) {
    const now = useNow();
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [selectMode, setSelectMode] = useState(false);
    const [page, setPage] = useState(1);
    const [isDeleting, setIsDeleting] = useState(false);

    const searchedMap = useMemo(() => {
        if (!search.trim()) return filteredMap as readonly number[];
        const q = search.trim().toLowerCase();
        return filteredMap.filter((allIdx) => {
            const c = cards[allIdx];
            if (!c) return false;
            return (
                c.k.toLowerCase().includes(q) ||
                c.h.toLowerCase().includes(q) ||
                c.v.toLowerCase().includes(q) ||
                stripBrackets(c.k).toLowerCase().includes(q)
            );
        });
    }, [filteredMap, search, cards]);

    const visibleMap = useMemo(
        () => searchedMap.slice(0, page * PAGE_SIZE),
        [searchedMap, page],
    );
    const hasMore = visibleMap.length < searchedMap.length;

    const toggleSelect = useCallback((allIdx: number) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(allIdx)) next.delete(allIdx);
            else next.add(allIdx);
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        if (selected.size === searchedMap.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(searchedMap as unknown as number[]));
        }
    }, [searchedMap, selected.size]);

    const exitSelectMode = useCallback(() => {
        setSelectMode(false);
        setSelected(new Set());
    }, []);

    const handleDelete = useCallback(async () => {
        if (selected.size === 0) return;
        const confirmed = window.confirm(
            `Xoá ${selected.size} thẻ? Hành động này không thể hoàn tác.`,
        );
        if (!confirmed) return;
        setIsDeleting(true);
        try {
            await onDeleteCards(Array.from(selected));
            setSelected(new Set());
            setSelectMode(false);
        } finally {
            setIsDeleting(false);
        }
    }, [selected, onDeleteCards]);

    return (
        <>
            <div className="action-bar" style={{ marginTop: 20, maxWidth: 520 }}>
                <div className="section-title" style={{ margin: 0, flex: 1 }}>
                    Tổng quan bộ thẻ ({searchedMap.length})
                </div>
                {selectMode ? (
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={exitSelectMode}
                        style={{ flex: 'none' }}
                    >
                        Huỷ
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setSelectMode(true)}
                            style={{ flex: 'none' }}
                        >
                            Chọn
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={onOpenAdd}
                            style={{ flex: 'none' }}
                        >
                            <span className="mode-icon">+</span> Thêm
                        </button>
                    </>
                )}
            </div>

            {/* Search bar */}
            <div className="deck-search-wrap">
                <svg className="deck-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    type="text"
                    className="deck-search-input"
                    placeholder="Tìm kiếm từ vựng..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
                {search && (
                    <button
                        type="button"
                        className="deck-search-clear"
                        onClick={() => setSearch('')}
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="filter-bar">
                {['all', ...CARD_TYPES.filter((t) => t !== 'Động từ')].map((t) => (
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

            {/* Bulk action bar */}
            {selectMode && (
                <div className="bulk-action-bar">
                    <button
                        type="button"
                        className="bulk-select-all"
                        onClick={toggleSelectAll}
                    >
                        {selected.size === searchedMap.length ? 'Bỏ chọn' : 'Chọn tất cả'} ({selected.size})
                    </button>
                    <button
                        type="button"
                        className="bulk-delete-btn"
                        onClick={handleDelete}
                        disabled={selected.size === 0 || isDeleting}
                    >
                        {isDeleting ? 'Đang xoá...' : `Xoá (${selected.size})`}
                    </button>
                </div>
            )}

            <div className="mini-grid">
                {visibleMap.map((allIdx, fIdx) => {
                    const c = cards[allIdx];
                    const srs = srsData[allIdx];
                    if (!c || !srs) return null;
                    const due = srs.state === 'learn' || (srs.dueDate && srs.dueDate <= now);
                    const color = srs.state === 'new' ? '#ccc' : due ? 'var(--again)' : 'var(--good)';
                    const isSelected = selected.has(allIdx);
                    return (
                        <button
                            key={fIdx}
                            type="button"
                            className={`mini-card${isSelected ? ' mini-card-selected' : ''}`}
                            onClick={() => selectMode ? toggleSelect(allIdx) : onOpenCard(allIdx)}
                        >
                            {selectMode && (
                                <span className={`mini-checkbox${isSelected ? ' checked' : ''}`}>
                                    {isSelected ? '\u2713' : ''}
                                </span>
                            )}
                            <span className="mk">{stripBrackets(c.k)}</span>
                            <span className="mh">{c.h}</span>
                            <span className="mv">{c.v}</span>
                            <span className="mini-dot" style={{ background: color }} />
                        </button>
                    );
                })}
            </div>

            {hasMore && (
                <button
                    type="button"
                    className="btn-secondary load-more-btn"
                    onClick={() => setPage((p) => p + 1)}
                >
                    Xem thêm ({searchedMap.length - visibleMap.length} còn lại)
                </button>
            )}
        </>
    );
}
