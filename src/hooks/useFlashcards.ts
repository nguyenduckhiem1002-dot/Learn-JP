'use client';
import { useCallback, useMemo, useState } from 'react';
import { fmtInterval as srsFmt } from '../lib/srs';
import { useCardsData } from './useCardsData';
import { useNow } from './useNow';
import { useSettings } from './useSettings';
import { useStudySession } from './useStudySession';

/**
 * Façade hook composing the three smaller hooks
 * ({@link useCardsData}, {@link useSettings}, {@link useStudySession})
 * so existing call-sites in `Home` can keep their shape.
 *
 * Look at the underlying hooks if you only need a slice — they are
 * lighter and have fewer re-render triggers.
 */
export function useFlashcards() {
    const cardsApi = useCardsData();
    const { settings, updateSettings } = useSettings();

    const [filterType, setFilterType] = useState<string>('all');

    const filteredMap = useMemo(() => {
        const map: number[] = [];
        cardsApi.cards.forEach((c, i) => {
            if (filterType === 'all' || c.t === filterType) map.push(i);
        });
        return map;
    }, [filterType, cardsApi.cards]);

    const session = useStudySession({
        cards: cardsApi.cards,
        srsData: cardsApi.srsData,
        setSrsData: cardsApi.setSrsData,
        filteredMap,
        settings,
    });

    const now = useNow();
    const stats = useMemo(() => {
        let nN = 0;
        let nL = 0;
        let nR = 0;
        let nDue = 0;
        for (const i of filteredMap) {
            const s = cardsApi.srsData[i];
            if (!s) continue;
            if (s.state === 'new') {
                nN++;
            } else if (s.state === 'learn') {
                nL++;
            } else {
                nR++;
                if ((s.dueDate ?? 0) <= now) nDue++;
            }
        }
        return { nN, nL, nR, nDue };
    }, [filteredMap, cardsApi.srsData, now]);

    const changeFilter = useCallback((type: string) => setFilterType(type), []);

    return {
        // cards & data
        cards: cardsApi.cards,
        srsData: cardsApi.srsData,
        isLoading: cardsApi.isLoading,
        addCard: cardsApi.addCard,
        editCard: cardsApi.editCard,
        deleteCards: cardsApi.deleteCards,

        // filter
        filterType,
        changeFilter,
        filteredMap,

        // settings
        settings,
        updateSettings,

        // session (queue + ratings)
        queue: session.queue,
        queuePos: session.queuePos,
        isFlipped: session.isFlipped,
        hasRevealed: session.hasRevealed,
        swipeDirection: session.swipeDirection,
        sessionStats: session.sessionStats,
        isDone: session.isDone,
        currentCard: session.currentCard,
        currentSrs: session.currentSrs,
        currentCardIndex: session.currentCardIndex,
        startSession: session.startSession,
        toggleFlip: session.toggleFlip,
        handleRate: session.handleRate,
        nextInterval: session.nextInterval,
        fmtInterval: srsFmt,

        // stats
        stats,
    };
}
