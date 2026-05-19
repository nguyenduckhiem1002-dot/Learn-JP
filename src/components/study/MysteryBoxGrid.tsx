'use client';
import { useState } from 'react';

interface Props {
    totalCards: number;
    onPickCard: (index: number) => void;
    /** Set of indices that have been completed. */
    completedSet: ReadonlySet<number>;
    /** Set of indices that were answered correctly. */
    correctSet: ReadonlySet<number>;
    /** The currently active card index (-1 if none). */
    activeIndex: number;
}

/**
 * A grid of mystery boxes representing cards in the queue.
 * Users click a box to reveal and test themselves on that card.
 * Adds excitement/gamification to the review process.
 */
export function MysteryBoxGrid({
    totalCards,
    onPickCard,
    completedSet,
    correctSet,
    activeIndex,
}: Props) {
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <div className="mystery-grid">
            {Array.from({ length: totalCards }, (_, i) => {
                const isCompleted = completedSet.has(i);
                const isCorrect = correctSet.has(i);
                const isActive = activeIndex === i;

                let boxClass = 'mystery-box';
                if (isActive) boxClass += ' active';
                else if (isCompleted && isCorrect) boxClass += ' correct';
                else if (isCompleted && !isCorrect) boxClass += ' wrong';
                else boxClass += ' unrevealed';

                return (
                    <button
                        key={i}
                        type="button"
                        className={boxClass}
                        onClick={() => !isCompleted && !isActive && onPickCard(i)}
                        disabled={isCompleted || isActive}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        {isCompleted ? (
                            <span className="box-result">
                                {isCorrect ? '✓' : '✗'}
                            </span>
                        ) : isActive ? (
                            <span className="box-active-icon">▶</span>
                        ) : (
                            <span className="box-mystery">
                                {hovered === i ? '👆' : '?'}
                            </span>
                        )}
                        <span className="box-number">{i + 1}</span>
                    </button>
                );
            })}
        </div>
    );
}
