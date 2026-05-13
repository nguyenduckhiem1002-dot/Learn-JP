'use client';
import { Furigana } from '../Furigana';
import { SpeakerIcon } from '../icons';
import { getCardTags } from './cardTags';
import type { Card, SRSData } from '../../lib/types';

interface Props {
    card: Card;
    srs: SRSData;
    queuePos: number;
    onPlayAudio: (text: string, e?: React.MouseEvent) => void;
    onFlipBack: (e: React.MouseEvent) => void;
}

const STATE_LABEL: Record<SRSData['state'], string> = {
    new: 'Mới',
    learn: 'Học lại',
    review: 'Ôn tập',
};

export function FlashcardView({ card, srs, queuePos, onPlayAudio, onFlipBack }: Props) {
    const isLoanWord = !!card.tip && card.tip.toLowerCase().includes('mượn');
    return (
        <>
            <div className="card-face card-front">
                <span className="card-number">{String(queuePos + 1).padStart(2, '0')}</span>
                <span className="card-type-badge">{card.t}</span>

                <div className="kanji-area">
                    <Furigana card={card} />
                    <button
                        type="button"
                        className="audio-btn"
                        onClick={(e) => onPlayAudio(card.k, e)}
                        aria-label="Phát âm"
                    >
                        <SpeakerIcon />
                    </button>
                </div>

                {card.img && (
                    <div className="card-img-container">
                        <img src={card.img} alt="" />
                    </div>
                )}

                <span className={`srs-badge ${srs.state}`}>{STATE_LABEL[srs.state]}</span>
                <div className="flip-hint">Nhấn lật thẻ</div>
            </div>
            <div className="card-face card-back">
                <div className="card-tags">
                    {getCardTags(card).map((t) => (
                        <span key={t} className="tag-pill">
                            {t}
                        </span>
                    ))}
                </div>

                <div className="meaning-block">
                    <div className="meaning-vn">{card.v}</div>
                    {card.tip && !isLoanWord && <div className="meaning-sub">{card.tip}</div>}
                    {card.tip && isLoanWord && (
                        <div className="meaning-sub muted">
                            {card.tip.replace(/Từ mượn ?/i, '').replace(/["']/g, '')}
                        </div>
                    )}
                </div>

                {card.img && (
                    <div className="card-img-container back-img">
                        <img src={card.img} alt="" />
                    </div>
                )}

                <div className="example-block">
                    <div className="example-jp">{card.ej}</div>
                    <div className="example-vn">{card.ev}</div>
                </div>

                <button type="button" className="flip-back-btn" onClick={onFlipBack}>
                    ⟲ Xem mặt trước
                </button>
            </div>
        </>
    );
}
