'use client';
import { useState } from 'react';
import type { Card } from '../../lib/types';
import { CardForm } from './CardForm';

interface Props {
    onClose: () => void;
    onSubmit: (card: Card) => Promise<void> | void;
}

export function AddCardModal({ onClose, onSubmit }: Props) {
    const [draft, setDraft] = useState<Partial<Card>>({ t: 'Danh từ' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!draft.k || !draft.v) return;
        await onSubmit({
            k: draft.k,
            h: draft.h ?? '',
            v: draft.v,
            t: draft.t ?? 'Danh từ',
            ej: draft.ej ?? '',
            ev: draft.ev ?? '',
            tip: draft.tip ?? '',
            img: draft.img || undefined,
        });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Thêm Từ Mới</h3>
                    <button type="button" className="close-btn" onClick={onClose} aria-label="Đóng">
                        ×
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <CardForm value={draft} onChange={setDraft} required={['k', 'v']} />
                    <button type="submit" className="submit-btn">
                        Lưu thẻ
                    </button>
                </form>
            </div>
        </div>
    );
}
