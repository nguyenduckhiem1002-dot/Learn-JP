'use client';
import { useState } from 'react';
import { useSpeech } from '../../hooks/useSpeech';
import type { Card } from '../../lib/types';
import { Furigana } from '../Furigana';
import { SpeakerIcon } from '../icons';
import { CardForm } from './CardForm';

interface Props {
    card: Card;
    onClose: () => void;
    onSave: (updated: Card) => Promise<void> | void;
}

export function ViewEditCardModal({ card, onClose, onSave }: Props) {
    const [isEdit, setIsEdit] = useState(false);
    const [draft, setDraft] = useState<Partial<Card>>(card);
    const speak = useSpeech();

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!draft.k || !draft.v) return;
        await onSave({ ...card, ...draft } as Card);
        setIsEdit(false);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{isEdit ? 'Chỉnh Sửa Từ' : 'Chi Tiết Từ Vựng'}</h3>
                    <button type="button" className="close-btn" onClick={onClose} aria-label="Đóng">
                        ×
                    </button>
                </div>

                {!isEdit ? (
                    <div className="card-detail-view">
                        <div className="detail-kanji-row">
                            <Furigana card={card} />
                            <button
                                type="button"
                                className="audio-btn"
                                onClick={() => speak(card.k)}
                                aria-label="Phát âm"
                            >
                                <SpeakerIcon />
                            </button>
                        </div>
                        <div className="detail-type">{card.t}</div>
                        <div className="detail-meaning">{card.v}</div>
                        {card.tip && <div className="detail-tip">{card.tip}</div>}
                        {card.img && <img className="detail-img" src={card.img} alt="" />}
                        <div className="detail-example">
                            {card.ej && <div className="ej">{card.ej}</div>}
                            {card.ev && <div className="ev">{card.ev}</div>}
                        </div>

                        <div className="action-bar" style={{ justifyContent: 'flex-end', margin: '20px 0 0 0' }}>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => {
                                    setDraft({ ...card });
                                    setIsEdit(true);
                                }}
                            >
                                Sửa từ này
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="modal-form">
                        <CardForm value={draft} onChange={setDraft} required={['k', 'v']} />
                        <div className="action-bar" style={{ justifyContent: 'flex-end', margin: '10px 0 0 0' }}>
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => setIsEdit(false)}
                            >
                                Hủy
                            </button>
                            <button type="submit" className="submit-btn" style={{ margin: 0 }}>
                                Lưu thay đổi
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
