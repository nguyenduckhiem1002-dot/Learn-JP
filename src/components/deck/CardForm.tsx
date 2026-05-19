'use client';
import type { Card } from '../../lib/types';

type FieldKey = 'k' | 'h' | 'v' | 't' | 'ej' | 'ev' | 'tip' | 'img';

interface Props {
    value: Partial<Card>;
    onChange: (next: Partial<Card>) => void;
    required?: readonly FieldKey[];
}

const TYPES: string[] = [
    'Danh từ',
    'Động từ',
    'Tính từ',
    'Phó từ',
    'Giới từ',
    'Liên từ',
];

export function CardForm({ value, onChange, required = ['k', 'v'] }: Props) {
    const set = <K extends FieldKey>(k: K, v: Card[K] | string | undefined) =>
        onChange({ ...value, [k]: v });

    return (
        <>
            <div className="form-group">
                <label>Từ tiếng Đức:</label>
                <input
                    required={required.includes('k')}
                    type="text"
                    value={value.k ?? ''}
                    onChange={(e) => set('k', e.target.value)}
                    placeholder="VD: der Tisch"
                />
            </div>
            <div className="form-group">
                <label>Phiên âm / Ghi chú:</label>
                <input
                    required={required.includes('h')}
                    type="text"
                    value={value.h ?? ''}
                    onChange={(e) => set('h', e.target.value)}
                    placeholder="VD: /tɪʃ/"
                />
            </div>
            <div className="form-group">
                <label>Nghĩa VN:</label>
                <input
                    required={required.includes('v')}
                    type="text"
                    value={value.v ?? ''}
                    onChange={(e) => set('v', e.target.value)}
                    placeholder="VD: cái bàn"
                />
            </div>
            <div className="form-group">
                <label>Loại từ:</label>
                <select
                    value={value.t ?? 'Danh từ'}
                    onChange={(e) => set('t', e.target.value as Card['t'])}
                >
                    {TYPES.map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
            </div>
            <div className="form-group">
                <label>Ví dụ DE (Tuỳ chọn):</label>
                <input
                    type="text"
                    value={value.ej ?? ''}
                    onChange={(e) => set('ej', e.target.value)}
                />
            </div>
            <div className="form-group">
                <label>Ví dụ VN (Tuỳ chọn):</label>
                <input
                    type="text"
                    value={value.ev ?? ''}
                    onChange={(e) => set('ev', e.target.value)}
                />
            </div>
            <div className="form-group">
                <label>Tip nhớ (Tuỳ chọn):</label>
                <input
                    type="text"
                    value={value.tip ?? ''}
                    onChange={(e) => set('tip', e.target.value)}
                />
            </div>
            <div className="form-group">
                <label>Link Ảnh (Tuỳ chọn):</label>
                <input
                    type="text"
                    value={value.img ?? ''}
                    onChange={(e) => set('img', e.target.value)}
                    placeholder="https://..."
                />
            </div>
        </>
    );
}
