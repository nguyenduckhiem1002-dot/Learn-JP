'use client';
import { useEffect, useRef, useState } from 'react';
import { isTypingAnswerCorrect, stripBrackets } from '../../lib/typing';
import type { Card, CardRating } from '../../lib/types';

type TypingState = 'idle' | 'wrong' | 'revealed';

interface Props {
    card: Card;
    queuePos: number;
    onPlayAudio: (text: string) => void;
    onRate: (rating: NonNullable<CardRating>) => void;
}

const REVEAL_DELAY_MS = 500;

/**
 * The parent re-mounts this component via a `key` whenever the card
 * changes, so all internal state (input value, focus, reveal flag)
 * starts fresh for every prompt without any reset effect.
 */
export function TypingView({ card, queuePos, onPlayAudio, onRate }: Props) {
    const [value, setValue] = useState('');
    const [typingState, setTypingState] = useState<TypingState>('idle');
    const inputRef = useRef<HTMLInputElement>(null);

    // Autofocus once on mount. (DOM side-effect, not state — safe in effect.)
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (typingState === 'revealed') {
            onRate('again');
            return;
        }
        if (isTypingAnswerCorrect(value, card.k, card.h)) {
            onPlayAudio(card.k);
            onRate('good');
            return;
        }
        setTypingState('wrong');
        setTimeout(() => {
            setTypingState('revealed');
            onPlayAudio(card.k);
        }, REVEAL_DELAY_MS);
    };

    return (
        <div className="card-face card-typing" onClick={(e) => e.stopPropagation()}>
            <span className="card-number">{String(queuePos + 1).padStart(2, '0')}</span>
            <span className="card-type-badge">{card.t}</span>

            <div className="typing-prompt">
                <div className="meaning-vn">{card.v}</div>
            </div>

            <form className="typing-form" onSubmit={submit}>
                <input
                    ref={inputRef}
                    type="text"
                    className={`typing-input ${typingState}`}
                    placeholder="Gõ Hiragana hoặc Kanji..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={typingState === 'revealed'}
                    aria-label="Đáp án"
                />
                {typingState === 'revealed' && (
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
