'use client';
import type { Card } from '../../lib/types';

type FieldKey = 'k' | 'h' | 'v' | 't' | 'ej' | 'ev' | 'tip' | 'img';

interface Props {
    value: Partial<Card>;
    onChange: (next: Partial<Card>) => void;
    /**
     * Which fields are required for the form to submit. Defaults to
     * `['k', 'v']` to match the existing behaviour where only kanji +
     * meaning are mandatory.
     */
    required?: readonly FieldKey[];
}

const TYPES: Card['t'][] = [
    'Danh từ',
    'Động từ',
    'Tính từ い',
    'Tính từ な',
    'Phó từ',
    'Liên từ',
];

/**
 * Shared form body for both "Add card" and "Edit card" modals. The
 * surrounding `<form>` + submit button live in the parent so each
 * modal can customise its action row.
 */
export function CardForm({ value, onChange, required = ['k', 'h', 'v'] }: Props) {
    const set = <K extends FieldKey>(k: K, v: Card[K] | string | undefined) =>
        onChange({ ...value, [k]: v });

    return (
        <>
            <div className="form-group">
                <label>Từ (Kanji):</label>
                <input
                    required={required.includes('k')}
                    type="text"
                    value={value.k ?? ''}
                    onChange={(e) => set('k', e.target.value)}
                    placeholder="VD: 静か[な]"
                />
            </div>
            <div className="form-group">
                <label>Cách đọc (Hiragana):</label>
                <input
                    required={required.includes('h')}
                    type="text"
                    value={value.h ?? ''}
                    onChange={(e) => set('h', e.target.value)}
                    placeholder="VD: しずか"
                />
            </div>
            <div className="form-group">
                <label>Nghĩa VN:</label>
                <input
                    required={required.includes('v')}
                    type="text"
                    value={value.v ?? ''}
                    onChange={(e) => set('v', e.target.value)}
                    placeholder="VD: yên tĩnh"
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
                <label>Ví dụ JP (Tuỳ chọn):</label>
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
