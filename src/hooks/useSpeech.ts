'use client';
import { useCallback } from 'react';

/**
 * Pronounce a German string using the browser's Web Speech API.
 * Cancels any currently-queued utterance.
 *
 * No-op when the API isn't available (e.g. SSR or older browsers).
 */
export function useSpeech() {
    return useCallback((text: string, e?: { stopPropagation: () => void }) => {
        if (e) e.stopPropagation();
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/\[|\]/g, ''));
        utterance.lang = 'de-DE';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }, []);
}
