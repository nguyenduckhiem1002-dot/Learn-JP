'use client';

export type TabName = 'study' | 'deck' | 'stats' | 'settings';

interface Props {
    active: TabName;
    onChange: (t: TabName) => void;
}

const TABS: { id: TabName; icon: string; label: string }[] = [
    { id: 'study', icon: '◈', label: 'Học' },
    { id: 'deck', icon: '☰', label: 'Bộ thẻ' },
    { id: 'stats', icon: '◒', label: 'Thống kê' },
    { id: 'settings', icon: '⚙︎', label: 'Cài đặt' },
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
