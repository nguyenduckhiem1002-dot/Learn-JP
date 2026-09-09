'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { buildQuizOptions } from '../../lib/quiz';
import { isTypingAnswerCorrect, stripBrackets } from '../../lib/typing';
import type { Card, CardRating } from '../../lib/types';

type TestType = 'quiz' | 'fillin';
type FillState = 'idle' | 'wrong' | 'revealed';

interface Props {
    card: Card;
    cards: readonly Card[];
    filteredMap: readonly number[];
    queuePos: number;
    onPlayAudio: (text: string) => void;
    onRate: (rating: NonNullable<CardRating>) => void;
    /** Selection signal driven by a parent (keyboard). */
    selectSignal?: { idx: number; nonce: number };
}

const CORRECT_DELAY_MS = 800;
const WRONG_DELAY_MS = 1500;
const REVEAL_DELAY_MS = 500;

function sameCard(a: Card, b: Card): boolean {
    if (a.id != null && b.id != null) return a.id === b.id;
    return a === b;
}

/**
 * Mixed test view: randomly chooses quiz (multiple choice) or fill-in
 * for each card. Fill-in mode has letter hints and rates as 'hard'
 * on correct (medium memory).
 */
export function MixedTestView({
    card,
    cards,
    filteredMap,
    queuePos,
    onPlayAudio,
    onRate,
    selectSignal,
}: Props) {
    const [testType] = useState<TestType>(() =>
        Math.random() < 0.5 ? 'quiz' : 'fillin',
    );

    if (testType === 'quiz') {
        return (
            <QuizPart
                card={card}
                cards={cards}
                filteredMap={filteredMap}
                queuePos={queuePos}
                onPlayAudio={onPlayAudio}
                onRate={onRate}
                selectSignal={selectSignal}
            />
        );
    }

    return (
        <FillInPart
            card={card}
            queuePos={queuePos}
            onPlayAudio={onPlayAudio}
            onRate={onRate}
        />
    );
}

function QuizPart({
    card,
    cards,
    filteredMap,
    queuePos,
    onPlayAudio,
    onRate,
    selectSignal,
}: Props) {
    const options = useMemo(
        () => buildQuizOptions(cards, filteredMap, card, 4),
        [card, cards, filteredMap],
    );
    const [selected, setSelected] = useState<number | null>(null);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectSignal?.nonce]);

    return (
        <div className="card-face card-quiz" onClick={(e) => e.stopPropagation()}>
            <span className="card-number">{String(queuePos + 1).padStart(2, '0')}</span>
            <span className="test-type-label quiz-label">Chọn đáp án</span>

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

function FillInPart({
    card,
    queuePos,
    onPlayAudio,
    onRate,
}: {
    card: Card;
    queuePos: number;
    onPlayAudio: (text: string) => void;
    onRate: (rating: NonNullable<CardRating>) => void;
}) {
    const [value, setValue] = useState('');
    const [fillState, setFillState] = useState<FillState>('idle');
    const [showHint, setShowHint] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const answer = stripBrackets(card.k);
    const hintText = useMemo(() => {
        const letters = answer.split('');
        return letters
            .map((ch, i) => (i === 0 || ch === ' ' ? ch : '_'))
            .join(' ');
    }, [answer]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (fillState === 'revealed') {
            onRate('again');
            return;
        }
        if (isTypingAnswerCorrect(value, card.k, card.h)) {
            onPlayAudio(card.k);
            onRate('hard');
            return;
        }
        setFillState('wrong');
        setTimeout(() => {
            setFillState('revealed');
            onPlayAudio(card.k);
        }, REVEAL_DELAY_MS);
    };

    return (
        <div className="card-face card-typing" onClick={(e) => e.stopPropagation()}>
            <span className="card-number">{String(queuePos + 1).padStart(2, '0')}</span>
            <span className="test-type-label fillin-label">Điền từ</span>
            <span className="card-type-badge">{card.t}</span>

            <div className="typing-prompt">
                <div className="meaning-vn">{card.v}</div>
            </div>

            {showHint && (
                <div className="fill-hint-box">
                    <span className="fill-hint-text">{hintText}</span>
                    <span className="fill-hint-count">({answer.replace(/\s/g, '').length} chữ cái)</span>
                </div>
            )}

            <form className="typing-form" onSubmit={submit}>
                <input
                    ref={inputRef}
                    type="text"
                    className={`typing-input ${fillState}`}
                    placeholder="Gõ từ tiếng Đức..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={fillState === 'revealed'}
                    aria-label="Đáp án"
                />
                {fillState === 'idle' && !showHint && (
                    <button
                        type="button"
                        className="hint-btn"
                        onClick={() => setShowHint(true)}
                    >
                        💡 Gợi ý
                    </button>
                )}
                {fillState === 'revealed' && (
                    <div className="typing-answer">
                        <span className="ans-k">{stripBrackets(card.k)}</span>
                        <span className="ans-h">{card.h}</span>
                        <button type="submit" className="next-btn-small">
                            Tiếp tục
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}
