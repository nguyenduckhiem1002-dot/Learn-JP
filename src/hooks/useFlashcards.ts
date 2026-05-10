import { useState, useCallback, useMemo, useEffect } from 'react';
import { SRSData, CardRating, Card, StudySettings } from '../lib/types';

const DEFAULT_SETTINGS: StudySettings = {
    dailyNew: 10,
    dailyReview: 50,
    easeMultiplier: 1.0
};

function dbCardToCard(c: Record<string, unknown>): Card {
    return {
        id: c.id as number,
        k: c.kanji as string,
        h: c.hiragana as string,
        v: c.meaning as string,
        t: c.type as string,
        ej: c.exJp as string,
        ev: c.exVn as string,
        tip: c.tip as string,
        img: (c.img as string | null) ?? undefined,
    };
}

function dbProgressToSrs(prog: Record<string, unknown> | undefined): SRSData {
    if (!prog) return { rating: null, state: 'new', ease: 2.5, interval: 0, reps: 0, dueDate: 0 };
    return {
        rating: (prog.rating as CardRating) ?? null,
        state: (prog.state as SRSData['state']) ?? 'new',
        ease: (prog.ease as number) ?? 2.5,
        interval: (prog.interval as number) ?? 0,
        reps: (prog.reps as number) ?? 0,
        dueDate: (prog.dueDate as number) ?? 0,
    };
}

export function useFlashcards() {
    const [cards, setCards] = useState<Card[]>([]);
    const [filterType, setFilterType] = useState<string>('all');
    const [settings, setSettings] = useState<StudySettings>(DEFAULT_SETTINGS);
    const [srsData, setSrsData] = useState<SRSData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });
    const [queue, setQueue] = useState<number[]>([]);
    const [queuePos, setQueuePos] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [hasRevealed, setHasRevealed] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

    useEffect(() => {
        const savedSettings = localStorage.getItem('study_settings');
        if (savedSettings) {
            try { setSettings(JSON.parse(savedSettings)); } catch {}
        }

        fetch('/api/cards')
            .then(r => r.json())
            .then((data: Record<string, unknown>[]) => {
                const loadedCards = data.map(dbCardToCard);
                const loadedSrs = data.map(c => {
                    const prog = (c.progress as Record<string, unknown>[])?.[0];
                    return dbProgressToSrs(prog);
                });
                setCards(loadedCards);
                setSrsData(loadedSrs);
            })
            .catch(e => console.error('Failed to load cards from DB', e))
            .finally(() => setIsLoading(false));
    }, []);

    const updateSettings = useCallback((newSettings: StudySettings) => {
        setSettings(newSettings);
        localStorage.setItem('study_settings', JSON.stringify(newSettings));
    }, []);

    const filteredMap = useMemo(() => {
        const map: number[] = [];
        cards.forEach((c, i) => {
            if (filterType === 'all' || c.t === filterType) map.push(i);
        });
        return map;
    }, [filterType, cards]);

    const addCard = useCallback(async (newCard: Card) => {
        const res = await fetch('/api/cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCard),
        });
        const created: Record<string, unknown> = await res.json();
        setCards(prev => [...prev, dbCardToCard(created)]);
        setSrsData(prev => [...prev, { rating: null, state: 'new', ease: 2.5, interval: 0, reps: 0, dueDate: 0 }]);
    }, []);

    const editCard = useCallback(async (index: number, updatedCard: Card) => {
        const card = cards[index];
        if (!card.id) return;
        const res = await fetch(`/api/cards/${card.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedCard),
        });
        const updated: Record<string, unknown> = await res.json();
        setCards(prev => {
            const next = [...prev];
            next[index] = dbCardToCard(updated);
            return next;
        });
    }, [cards]);

    const nextInterval = useCallback((srs: SRSData, rating: CardRating) => {
        const m = settings.easeMultiplier;
        if (srs.reps === 0) {
            if (rating === 'again') return 1;
            if (rating === 'hard') return 6;
            if (rating === 'good') return 10;
            if (rating === 'easy') return 4 * 1440;
        }
        const base = srs.interval || 1440;
        if (rating === 'again') return 10;
        if (rating === 'hard') return base * 1.2 * m;
        if (rating === 'good') return base * srs.ease * m;
        if (rating === 'easy') return base * srs.ease * 1.3 * m;
        return 0;
    }, [settings.easeMultiplier]);

    const fmtInterval = useCallback((min: number) => {
        if (min < 2) return '<1m';
        if (min < 1440) return Math.round(min) + 'm';
        return Math.round(min / 1440) + 'd';
    }, []);

    const handleRate = useCallback((rating: NonNullable<CardRating>) => {
        if (swipeDirection) return;

        const dir = (rating === 'again' || rating === 'hard') ? 'left' : 'right';
        setSwipeDirection(dir);

        setTimeout(() => {
            const fIdx = queue[queuePos];
            const allIdx = filteredMap[fIdx];

            setSrsData(prev => {
                const next = [...prev];
                const s = { ...next[allIdx] };
                s.rating = rating;
                s.interval = nextInterval(s, rating);
                s.dueDate = Date.now() + (s.interval * 60 * 1000);
                s.reps++;

                if (rating === 'again') { s.state = 'learn'; s.ease = Math.max(1.3, s.ease - 0.2); }
                if (rating === 'hard') { s.state = 'learn'; s.ease = Math.max(1.3, s.ease - 0.15); }
                if (rating === 'good') { s.state = 'review'; }
                if (rating === 'easy') { s.state = 'review'; s.ease += 0.15; }

                next[allIdx] = s;

                const card = cards[allIdx];
                if (card?.id) {
                    fetch('/api/progress', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cardId: card.id, ...s }),
                    }).catch(err => console.error('Failed to save progress', err));
                }

                return next;
            });

            setSessionStats(prev => ({ ...prev, [rating]: prev[rating as keyof typeof prev] + 1 }));

            setQueue(prevQueue => {
                const nextQ = [...prevQueue];
                if ((rating === 'again' || rating === 'hard') && !nextQ.slice(queuePos + 1).includes(fIdx)) {
                    nextQ.push(fIdx);
                }
                return nextQ;
            });

            setQueuePos(p => p + 1);
            setIsFlipped(false);
            setHasRevealed(false);
            setSwipeDirection(null);
        }, 300);
    }, [queue, queuePos, filteredMap, nextInterval, swipeDirection, cards]);

    const changeFilter = useCallback((type: string) => {
        setFilterType(type);
    }, []);

    const startSession = useCallback(() => {
        const now = Date.now();
        let newCount = 0;
        let reviewCount = 0;
        const newQueue: number[] = [];

        filteredMap.forEach((allIdx, fIdx) => {
            const srs = srsData[allIdx];
            if (!srs) return;

            if (srs.state === 'new') {
                if (newCount < settings.dailyNew) {
                    newQueue.push(fIdx);
                    newCount++;
                }
            } else {
                if (!srs.dueDate || srs.dueDate <= now || srs.state === 'learn') {
                    if (reviewCount < settings.dailyReview) {
                        newQueue.push(fIdx);
                        reviewCount++;
                    }
                }
            }
        });

        for (let i = newQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newQueue[i], newQueue[j]] = [newQueue[j], newQueue[i]];
        }

        setQueue(newQueue);
        setQueuePos(0);
        setSessionStats({ again: 0, hard: 0, good: 0, easy: 0 });
        setIsFlipped(false);
        setHasRevealed(false);
    }, [filteredMap, srsData, settings]);

    const toggleFlip = useCallback(() => {
        setIsFlipped(prev => {
            const next = !prev;
            if (next) setHasRevealed(true);
            return next;
        });
    }, []);

    const stats = useMemo(() => {
        let nN = 0, nL = 0, nR = 0;
        const now = Date.now();
        filteredMap.forEach(i => {
            const s = srsData[i];
            if (!s) return;
            if (s.state === 'new') nN++;
            else if (s.state === 'learn' || (s.dueDate && s.dueDate <= now)) nL++;
            else nR++;
        });
        return { nN, nL, nR };
    }, [filteredMap, srsData]);

    const isDone = queuePos >= queue.length && queue.length > 0;
    const currentCardIndex = isDone || queue.length === 0 ? -1 : filteredMap[queue[queuePos]];
    const currentCard = currentCardIndex === -1 ? null : cards[currentCardIndex];
    const currentSrs = currentCardIndex === -1 ? null : srsData[currentCardIndex];

    return {
        cards, filterType, changeFilter,
        srsData, sessionStats, stats,
        queue, queuePos, isDone,
        isFlipped, hasRevealed, toggleFlip, swipeDirection,
        currentCard, currentSrs, currentCardIndex,
        handleRate, nextInterval, fmtInterval,
        startSession, updateSettings, settings,
        filteredMap, addCard, editCard,
        isLoading,
    };
}
