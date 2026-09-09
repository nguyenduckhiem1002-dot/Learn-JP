'use client';
import { useCallback, useEffect, useState } from 'react';
import { FALLBACK_CARDS } from '../lib/data';
import { dbCardToCard, dbProgressToSrs } from '../lib/mappers';
import { emptySrs } from '../lib/srs';
import type { Card, SRSData } from '../lib/types';

type DbCard = Record<string, unknown>;

function fallbackState() {
    return {
        cards: FALLBACK_CARDS,
        srsData: FALLBACK_CARDS.map(() => emptySrs()),
    };
}

async function readJson<T>(res: Response, label: string): Promise<T> {
    if (!res.ok) {
        throw new Error(`${label} failed with HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
}

/**
 * Owns card persistence and keeps the UI usable when the API is unavailable.
 * Network side effects are kept outside React state setters so state updates
 * stay pure and predictable.
 */
export function useCardsData() {
    const [cards, setCards] = useState<Card[]>([]);
    const [srsData, setSrsData] = useState<SRSData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const res = await fetch('/api/cards');
                const data = await readJson<DbCard[]>(res, 'GET /api/cards');
                if (cancelled || !Array.isArray(data)) return;

                setCards(data.map(dbCardToCard));
                setSrsData(
                    data.map((card) => {
                        const progress = (card.progress as DbCard[] | undefined)?.[0];
                        return dbProgressToSrs(progress);
                    }),
                );
            } catch (err) {
                console.error('Failed to load cards; using fallback cards', err);
                if (!cancelled) {
                    const fallback = fallbackState();
                    setCards(fallback.cards);
                    setSrsData(fallback.srsData);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    const addCard = useCallback(async (newCard: Card) => {
        const res = await fetch('/api/cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCard),
        });
        const created = await readJson<DbCard>(res, 'POST /api/cards');
        const mapped = dbCardToCard(created);

        setCards((prev) => [...prev, mapped]);
        setSrsData((prev) => [...prev, emptySrs()]);
    }, []);

    const editCard = useCallback(async (index: number, updatedCard: Card) => {
        const id = cards[index]?.id;
        if (!id) return;

        const res = await fetch(`/api/cards/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCard),
        });
        await readJson<DbCard>(res, `PATCH /api/cards/${id}`);

        setCards((prev) => {
            if (!prev[index] || prev[index].id !== id) return prev;
            const next = [...prev];
            next[index] = { ...updatedCard, id };
            return next;
        });
    }, [cards]);

    const deleteCards = useCallback(async (indices: number[]) => {
        const ids = indices
            .map((index) => cards[index]?.id)
            .filter((id): id is number => id != null);
        if (ids.length === 0) return;

        const res = await fetch('/api/cards', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
        });
        if (!res.ok) {
            throw new Error(`DELETE /api/cards failed with HTTP ${res.status}`);
        }

        const removeSet = new Set(indices);
        setCards((prev) => prev.filter((_, index) => !removeSet.has(index)));
        setSrsData((prev) => prev.filter((_, index) => !removeSet.has(index)));
    }, [cards]);

    return {
        cards,
        srsData,
        setSrsData,
        isLoading,
        addCard,
        editCard,
        deleteCards,
    };
}
