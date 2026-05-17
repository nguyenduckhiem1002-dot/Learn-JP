'use client';
import { useCallback, useEffect, useState } from 'react';
import { dbCardToCard, dbProgressToSrs } from '../lib/mappers';
import { emptySrs } from '../lib/srs';
import type { Card, SRSData } from '../lib/types';

/**
 * Load all cards + their SRS state from the API and expose CRUD
 * helpers. Returns optimistic local state — server is treated as
 * source of truth on next load.
 */
export function useCardsData() {
    const [cards, setCards] = useState<Card[]>([]);
    const [srsData, setSrsData] = useState<SRSData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/cards');
                if (!res.ok) {
                    console.error('API /api/cards returned', res.status);
                    return;
                }
                const data: Record<string, unknown>[] = await res.json();
                if (cancelled || !Array.isArray(data)) return;
                const nextCards = data.map(dbCardToCard);
                const nextSrs = data.map((c) => {
                    const prog = (c.progress as Record<string, unknown>[])?.[0];
                    return dbProgressToSrs(prog);
                });
                setCards(nextCards);
                setSrsData(nextSrs);
            } catch (err) {
                console.error('Failed to load cards from DB', err);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
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
        const created: Record<string, unknown> = await res.json();
        const mapped = dbCardToCard(created);
        setCards((prev) => [...prev, mapped]);
        setSrsData((prev) => [...prev, emptySrs()]);
    }, []);

    const editCard = useCallback(async (index: number, updatedCard: Card) => {
        setCards((prev) => {
            const id = prev[index]?.id;
            if (!id) return prev;
            // Fire-and-forget — the local state below is what the UI sees
            // until the next full refresh.
            fetch(`/api/cards/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedCard),
            }).catch((err) => console.error('Failed to update card', err));
            const next = [...prev];
            next[index] = { ...updatedCard, id };
            return next;
        });
    }, []);

    return {
        cards,
        srsData,
        setSrsData,
        isLoading,
        addCard,
        editCard,
    };
}
