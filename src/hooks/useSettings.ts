'use client';
import { useCallback, useState } from 'react';
import type { StudySettings } from '../lib/types';

const STORAGE_KEY = 'study_settings';

export const DEFAULT_SETTINGS: StudySettings = {
    dailyNew: 10,
    dailyReview: 50,
    easeMultiplier: 1.0,
};

function loadInitialSettings(): StudySettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<StudySettings>) };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

/**
 * Manage the user's study preferences. Persisted in `localStorage` —
 * loaded once on mount via a lazy initializer, written eagerly on
 * every update.
 */
export function useSettings() {
    const [settings, setSettings] = useState<StudySettings>(loadInitialSettings);

    const updateSettings = useCallback((next: StudySettings) => {
        setSettings(next);
        if (typeof window !== 'undefined') {
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {
                // ignore quota errors
            }
        }
    }, []);

    return { settings, updateSettings };
}
