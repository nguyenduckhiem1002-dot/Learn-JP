'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildQuizOptions } from '../../lib/quiz';
import { stripBrackets } from '../../lib/typing';
import type { Card, CardRating } from '../../lib/types';

interface Props {
    card: Card;
    cards: readonly Card[];
    filteredMap: readonly number[];
    queuePos: number;
    onPlayAudio: (text: string) => void;
    onRate: (rating: NonNullable<CardRating>) => void;
    /** Exposes the current options so a parent can bind 1–4 hotkeys. */
    onOptionsChange?: (options: Card[]) => void;
    /** Selection signal driven by a parent (keyboard). */
    selectSignal?: { idx: number; nonce: number };
}

const CORRECT_DELAY_MS = 800;
const WRONG_DELAY_MS = 1500;

function sameCard(a: Card, b: Card): boolean {
    if (a.id != null && b.id != null) return a.id === b.id;
    return a === b;
}

/**
 * The parent re-mounts this component via a `key` whenever the card
 * changes, so the option list shuffles once per card without any
 * memo-invalidation tricks.
 */
export function QuizView({
    card,
    cards,
    filteredMap,
    queuePos,
    onPlayAudio,
    onRate,
    onOptionsChange,
    selectSignal,
}: Props) {
    const options = useMemo(
        () => buildQuizOptions(cards, filteredMap, card, 4),
        [card, cards, filteredMap],
    );
    const [selected, setSelected] = useState<number | null>(null);

    // Notify parent about option order whenever it changes (DOM/side-effect
    // synchronization, not internal state).
    useEffect(() => {
        onOptionsChange?.(options);
    }, [options, onOptionsChange]);

    const pick = (idx: number) => {
        if (selected !== null) return;
        setSelected(idx);
        onPlayAudio(card.k);
        const isCorrect = sameCard(options[idx], card);
        const delay = isCorrect ? CORRECT_DELAY_MS : WRONG_DELAY_MS;
        setTimeout(() => onRate(isCorrect ? 'good' : 'again'), delay);
    };

    const lastNonceRef = useRef<number | null>(null);
    useEffect(() => {
        if (!selectSignal) return;
        if (lastNonceRef.current === selectSignal.nonce) return;
        lastNonceRef.current = selectSignal.nonce;
        pick(selectSignal.idx);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only respond to a new nonce
    }, [selectSignal?.nonce]);

    return (
        <div className="card-face card-quiz" onClick={(e) => e.stopPropagation()}>
            <span className="card-number">{String(queuePos + 1).padStart(2, '0')}</span>

            <div className="quiz-prompt">
                <div className="meaning-vn">{card.v}</div>
                {card.img && (
                    <div className="card-img-container back-img" style={{ marginTop: 10 }}>
                        <img src={card.img} alt="" />
                    </div>
                )}
            </div>

            <div className="quiz-grid">
                {options.map((opt, idx) => {
                    const isSelected = selected === idx;
                    const isCorrectCard = sameCard(opt, card);
                    const showCorrect = selected !== null && isCorrectCard;
                    const showWrong = isSelected && !isCorrectCard;

                    let btnClass = 'quiz-btn';
                    if (showCorrect) btnClass += ' correct';
                    else if (showWrong) btnClass += ' wrong';
                    else if (selected !== null) btnClass += ' disabled';

                    return (
                        <button
                            key={opt.id ?? idx}
                            type="button"
                            className={btnClass}
                            onClick={() => pick(idx)}
                        >
                            {showCorrect && <span className="q-icon q-icon-correct">✓</span>}
                            {showWrong && <span className="q-icon q-icon-wrong">✗</span>}
                            <span className="q-k">{stripBrackets(opt.k)}</span>
                            {selected !== null && <span className="q-h">{opt.h}</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
