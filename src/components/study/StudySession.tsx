'use client';
import { useEffect, useRef, useState } from 'react';
import { useSpeech } from '../../hooks/useSpeech';
import type { Card, CardRating, SRSData } from '../../lib/types';
import { FlashcardView } from './FlashcardView';
import { QuizView } from './QuizView';
import { TypingView } from './TypingView';

export type StudyMode = 'flashcard' | 'typing' | 'quiz';

const cardKey = (c: Card) => `${c.id ?? c.k}`;

interface Props {
    studyMode: StudyMode;
    cards: readonly Card[];
    filteredMap: readonly number[];
    queue: readonly number[];
    queuePos: number;
    currentCard: Card | null;
    currentSrs: SRSData | null;
    isFlipped: boolean;
    hasRevealed: boolean;
    swipeDirection: 'left' | 'right' | null;
    isDone: boolean;
    sessionStats: { again: number; hard: number; good: number; easy: number };
    nextInterval: (s: SRSData, r: NonNullable<CardRating>) => number;
    fmtInterval: (m: number) => string;
    onToggleFlip: () => void;
    onRate: (r: NonNullable<CardRating>) => void;
    onExit: () => void;
    /** Whether any modal is open — used to suppress keyboard handlers. */
    modalOpen?: boolean;
}

/**
 * Wraps the three study modes plus the per-session chrome (progress
 * bar, "done" screen, rating buttons, keyboard shortcuts).
 */
export function StudySession(props: Props) {
    const {
        studyMode,
        cards,
        filteredMap,
        queue,
        queuePos,
        currentCard,
        currentSrs,
        isFlipped,
        hasRevealed,
        swipeDirection,
        isDone,
        sessionStats,
        nextInterval,
        fmtInterval,
        onToggleFlip,
        onRate,
        onExit,
        modalOpen,
    } = props;

    const speak = useSpeech();
    const [quizSelectSignal, setQuizSelectSignal] = useState<{ idx: number; nonce: number } | null>(null);
    const quizOptionsRef = useRef<Card[]>([]);

    // Auto-pronounce the front of a flashcard.
    useEffect(() => {
        if (modalOpen) return;
        if (!currentCard || isFlipped) return;
        if (studyMode === 'flashcard') speak(currentCard.k);
    }, [currentCard, isFlipped, studyMode, modalOpen, speak]);

    // Keyboard shortcuts.
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (modalOpen) return;
            if (studyMode === 'typing') return; // input handles its own keys

            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                if (studyMode === 'flashcard') onToggleFlip();
            } else if (studyMode === 'flashcard' && hasRevealed) {
                if (e.key === '1') onRate('again');
                else if (e.key === '2') onRate('hard');
                else if (e.key === '3') onRate('good');
            } else if (studyMode === 'quiz') {
                const idx = Number(e.key) - 1;
                if (idx >= 0 && idx < quizOptionsRef.current.length) {
                    setQuizSelectSignal({ idx, nonce: Date.now() });
                }
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [modalOpen, studyMode, hasRevealed, onToggleFlip, onRate]);

    return (
        <div className="study-view">
            <div className="study-header">
                <button type="button" className="btn-secondary" onClick={onExit}>
                    ← Trang chủ
                </button>
            </div>

            {isDone ? (
                <DoneScreen sessionStats={sessionStats} onExit={onExit} />
            ) : queue.length === 0 ? (
                <EmptySession onExit={onExit} />
            ) : currentCard && currentSrs ? (
                <>
                    <div className="progress-bar-wrap">
                        <div className="progress-info">
                            <span>
                                {queuePos + 1} / {queue.length}
                            </span>
                        </div>
                        <div className="progress-dots">
                            {queue.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`progress-seg ${
                                        idx < queuePos ? 'done' : idx === queuePos ? 'active' : ''
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="card-scene">
                        <div className={`card-slide ${swipeDirection ? `swipe-${swipeDirection}` : 'anim'}`} key={queuePos}>
                            <div
                                className={`card ${isFlipped && studyMode === 'flashcard' ? 'flipped' : ''}`}
                                onClick={() => studyMode === 'flashcard' && onToggleFlip()}
                            >
                                {studyMode === 'flashcard' && (
                                    <FlashcardView
                                        card={currentCard}
                                        srs={currentSrs}
                                        queuePos={queuePos}
                                        onPlayAudio={speak}
                                        onFlipBack={(e) => {
                                            e.stopPropagation();
                                            onToggleFlip();
                                        }}
                                    />
                                )}
                                {studyMode === 'typing' && (
                                    <TypingView
                                        key={cardKey(currentCard)}
                                        card={currentCard}
                                        queuePos={queuePos}
                                        onPlayAudio={speak}
                                        onRate={onRate}
                                    />
                                )}
                                {studyMode === 'quiz' && (
                                    <QuizView
                                        key={cardKey(currentCard)}
                                        card={currentCard}
                                        cards={cards}
                                        filteredMap={filteredMap}
                                        queuePos={queuePos}
                                        onPlayAudio={speak}
                                        onRate={onRate}
                                        onOptionsChange={(opts) => {
                                            quizOptionsRef.current = opts;
                                        }}
                                        selectSignal={quizSelectSignal ?? undefined}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {studyMode === 'flashcard' && (
                        <div className="anki-area">
                            {!hasRevealed ? (
                                <button type="button" className="show-answer-btn" onClick={onToggleFlip}>
                                    Hiện đáp án &nbsp;·&nbsp; Space
                                </button>
                            ) : (
                                <div className="anki-row visible">
                                    <button
                                        type="button"
                                        className="anki-btn btn-again"
                                        onClick={() => onRate('again')}
                                    >
                                        <div className="icon-box">↻</div>
                                        <span className="anki-label">Lại</span>
                                        <span className="anki-interval">Ôn lại ngay</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="anki-btn btn-hard"
                                        onClick={() => onRate('hard')}
                                    >
                                        <div className="icon-box">⏱</div>
                                        <span className="anki-label">Khó</span>
                                        <span className="anki-interval">
                                            Sau {fmtInterval(nextInterval(currentSrs, 'hard'))}
                                        </span>
                                    </button>
                                    <button
                                        type="button"
                                        className="anki-btn btn-good"
                                        onClick={() => onRate('good')}
                                    >
                                        <div className="icon-box">✓</div>
                                        <span className="anki-label">Nhớ</span>
                                        <span className="anki-interval">
                                            Sau {fmtInterval(nextInterval(currentSrs, 'good'))}
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}

function DoneScreen({
    sessionStats,
    onExit,
}: {
    sessionStats: Props['sessionStats'];
    onExit: () => void;
}) {
    const total =
        sessionStats.good + sessionStats.easy + sessionStats.hard + sessionStats.again;
    const accuracy = total === 0 ? 0 : (sessionStats.good + sessionStats.easy) / total;

    return (
        <div className="session-done visible" id="sessionDone">
            <div className="done-emoji">🎉</div>
            <div className="done-title">Hoàn thành phiên học!</div>
            <div className="done-sub">Bạn đã ôn xong số thẻ mục tiêu trong ngày.</div>
            <div className="done-stats">
                <div className="done-stat">
                    <div className="n" style={{ color: 'var(--good)' }}>
                        {sessionStats.good + sessionStats.easy}
                    </div>
                    <div className="l">Nhớ</div>
                </div>
                <div className="done-stat">
                    <div className="n" style={{ color: 'var(--hard)' }}>
                        {sessionStats.hard}
                    </div>
                    <div className="l">Khó</div>
                </div>
                <div className="done-stat">
                    <div className="n" style={{ color: 'var(--again)' }}>
                        {sessionStats.again}
                    </div>
                    <div className="l">Quên</div>
                </div>
            </div>
            <div className="done-accuracy">Độ chính xác: {Math.round(accuracy * 100)}%</div>
            <button type="button" className="btn-restart" onClick={onExit}>
                Về trang chủ
            </button>
        </div>
    );
}

function EmptySession({ onExit }: { onExit: () => void }) {
    return (
        <div className="session-done visible">
            <div className="done-emoji">✨</div>
            <div className="done-title">Không có thẻ nào đến hạn!</div>
            <div className="done-sub">
                Bạn đã hoàn thành mọi mục tiêu của ngày hôm nay. Hãy quay lại vào ngày mai nhé.
            </div>
            <button type="button" className="btn-restart" onClick={onExit}>
                Về trang chủ
            </button>
        </div>
    );
}
