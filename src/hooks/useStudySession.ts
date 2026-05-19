'use client';
import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react';
import { buildStudyQueue, reinsertForReview } from '../lib/queue';
import { applyRating, nextInterval as srsNextInterval } from '../lib/srs';
import type { Card, CardRating, SRSData, StudySettings } from '../lib/types';

export interface SessionStats {
    again: number;
    hard: number;
    good: number;
    easy: number;
}

const EMPTY_STATS: SessionStats = { again: 0, hard: 0, good: 0, easy: 0 };

/** How long the swipe animation runs before we advance to the next card. */
const SWIPE_ANIM_MS = 300;

interface UseStudySessionInput {
    cards: readonly Card[];
    srsData: SRSData[];
    setSrsData: Dispatch<SetStateAction<SRSData[]>>;
    filteredMap: readonly number[];
    settings: StudySettings;
}

/**
 * Owns the in-progress study session: queue, queue position, flip
 * state, rating logic and the swipe animation. Persists each rating
 * to the server via `/api/progress`.
 */
export function useStudySession({
    cards,
    srsData,
    setSrsData,
    filteredMap,
    settings,
}: UseStudySessionInput) {
    const [queue, setQueue] = useState<number[]>([]);
    const [queuePos, setQueuePos] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [hasRevealed, setHasRevealed] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
    const [sessionStats, setSessionStats] = useState<SessionStats>(EMPTY_STATS);

    const startSession = useCallback(() => {
        const q = buildStudyQueue(filteredMap, srsData, settings);
        setQueue(q);
        setQueuePos(0);
        setSessionStats(EMPTY_STATS);
        setIsFlipped(false);
        setHasRevealed(false);
    }, [filteredMap, srsData, settings]);

    const toggleFlip = useCallback(() => {
        setIsFlipped((prev) => {
            const next = !prev;
            if (next) setHasRevealed(true);
            return next;
        });
    }, []);

    const nextInterval = useCallback(
        (srs: SRSData, rating: NonNullable<CardRating>) =>
            srsNextInterval(srs, rating, settings.easeMultiplier),
        [settings.easeMultiplier],
    );

    const jumpTo = useCallback((queueIndex: number) => {
        setQueuePos(queueIndex);
        setIsFlipped(false);
        setHasRevealed(false);
    }, []);

    const handleRate = useCallback(
        (rating: NonNullable<CardRating>) => {
            if (swipeDirection) return;
            const dir = rating === 'again' || rating === 'hard' ? 'left' : 'right';
            setSwipeDirection(dir);

            setTimeout(() => {
                const fIdx = queue[queuePos];
                const allIdx = filteredMap[fIdx];
                const prevSrs = srsData[allIdx];
                if (!prevSrs) {
                    setSwipeDirection(null);
                    return;
                }

                const { next } = applyRating(prevSrs, rating, settings.easeMultiplier);

                setSrsData((prev) => {
                    const arr = [...prev];
                    arr[allIdx] = next;
                    return arr;
                });

                const card = cards[allIdx];
                if (card?.id) {
                    void fetch('/api/progress', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            cardId: card.id,
                            prevState: prevSrs.state,
                            prevInterval: prevSrs.interval,
                            ...next,
                        }),
                    }).catch((err) => console.error('Failed to save progress', err));
                }

                setSessionStats((prev) => ({ ...prev, [rating]: prev[rating] + 1 }));

                if (rating === 'again') {
                    setQueue((prevQueue) => reinsertForReview(prevQueue, queuePos, fIdx));
                }

                setQueuePos((p) => p + 1);
                setIsFlipped(false);
                setHasRevealed(false);
                setSwipeDirection(null);
            }, SWIPE_ANIM_MS);
        },
        [queue, queuePos, filteredMap, srsData, cards, settings.easeMultiplier, swipeDirection, setSrsData],
    );

    const isDone = queue.length > 0 && queuePos >= queue.length;
    const currentCardIndex = isDone || queue.length === 0 ? -1 : filteredMap[queue[queuePos]];
    const currentCard = currentCardIndex === -1 ? null : cards[currentCardIndex];
    const currentSrs = currentCardIndex === -1 ? null : srsData[currentCardIndex];

    const session = useMemo(
        () => ({
            queue,
            queuePos,
            isFlipped,
            hasRevealed,
            swipeDirection,
            sessionStats,
            isDone,
            currentCard,
            currentSrs,
            currentCardIndex,
        }),
        [
            queue,
            queuePos,
            isFlipped,
            hasRevealed,
            swipeDirection,
            sessionStats,
            isDone,
            currentCard,
            currentSrs,
            currentCardIndex,
        ],
    );

    return {
        ...session,
        startSession,
        toggleFlip,
        handleRate,
        nextInterval,
        jumpTo,
    };
}
