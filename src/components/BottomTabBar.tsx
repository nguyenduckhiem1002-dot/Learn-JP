'use client';
import type { ReactNode } from 'react';

export type TabName = 'study' | 'deck' | 'stats' | 'settings';

interface Props {
    active: TabName;
    onChange: (t: TabName) => void;
}

const svgProps = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const StudyIcon = () => (
    <svg {...svgProps}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
);
const DeckIcon = () => (
    <svg {...svgProps}><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 3H8l-2 4h12l-2-4z" /></svg>
);
const StatsIcon = () => (
    <svg {...svgProps}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
);
const SettingsIcon = () => (
    <svg {...svgProps}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
);

const TABS: { id: TabName; icon: ReactNode; label: string }[] = [
    { id: 'study', icon: <StudyIcon />, label: 'Học' },
    { id: 'deck', icon: <DeckIcon />, label: 'Bộ thẻ' },
    { id: 'stats', icon: <StatsIcon />, label: 'Thống kê' },
    { id: 'settings', icon: <SettingsIcon />, label: 'Cài đặt' },
];

export function BottomTabBar({ active, onChange }: Props) {
    return (
        <nav className="bottom-tab-bar" aria-label="Thanh điều hướng chính">
            {TABS.map((t) => (
                <button
                    key={t.id}
                    type="button"
                    className={`tab-btn ${active === t.id ? 'active' : ''}`}
                    onClick={() => onChange(t.id)}
                    aria-current={active === t.id ? 'page' : undefined}
                >
                    <span className="tab-icon">{t.icon}</span>
                    <span>{t.label}</span>
                </button>
            ))}
        </nav>
    );
}
