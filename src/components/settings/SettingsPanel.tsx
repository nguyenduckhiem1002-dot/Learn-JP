'use client';
import { useState } from 'react';
import type { StudySettings } from '../../lib/types';

interface Props {
    settings: StudySettings;
    onSave: (next: StudySettings) => void;
}

const EASE_OPTIONS: { value: number; label: string }[] = [
    { value: 0.8, label: '0.8 (Khó nhớ, lặp lại nhiều)' },
    { value: 1.0, label: '1.0 (Tiêu chuẩn)' },
    { value: 1.2, label: '1.2 (Dễ nhớ, giãn cách nhanh)' },
    { value: 1.5, label: '1.5 (Rất dễ nhớ)' },
];

/**
 * Wrapper: re-mounts the form whenever the parent's `settings` object
 * identity changes, so the inner draft state starts fresh without
 * any "setState in effect" anti-pattern.
 */
export function SettingsPanel(props: Props) {
    return <SettingsForm key={settingsKey(props.settings)} {...props} />;
}

function settingsKey(s: StudySettings): string {
    return `${s.dailyNew}|${s.dailyReview}|${s.easeMultiplier}`;
}

function SettingsForm({ settings, onSave }: Props) {
    const [draft, setDraft] = useState<StudySettings>(settings);

    return (
        <div style={{ marginTop: 20 }}>
            <div className="section-title">Cài Đặt Ôn Tập</div>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onSave(draft);
                }}
                className="modal-form"
                style={{ marginTop: 10 }}
            >
                <div className="form-group">
                    <label>Số thẻ mới tối đa mỗi ngày:</label>
                    <input
                        type="number"
                        min={1}
                        max={100}
                        value={draft.dailyNew}
                        onChange={(e) => setDraft({ ...draft, dailyNew: Number(e.target.value) })}
                    />
                </div>
                <div className="form-group">
                    <label>Số thẻ ôn tối đa mỗi ngày:</label>
                    <input
                        type="number"
                        min={1}
                        max={500}
                        value={draft.dailyReview}
                        onChange={(e) =>
                            setDraft({ ...draft, dailyReview: Number(e.target.value) })
                        }
                    />
                </div>
                <div className="form-group">
                    <label>Hệ số thuật toán (Ease Multiplier):</label>
                    <select
                        value={draft.easeMultiplier}
                        onChange={(e) =>
                            setDraft({ ...draft, easeMultiplier: Number(e.target.value) })
                        }
                    >
                        {EASE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="submit-btn" style={{ marginTop: 20 }}>
                    Lưu Cài Đặt
                </button>
            </form>
        </div>
    );
}
