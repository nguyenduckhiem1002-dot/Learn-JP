'use client';
import { useCallback } from 'react';

/**
 * Pronounce a Japanese string using the browser's Web Speech API.
 * Strips square-bracket annotations like "…[な]" before speaking and
 * cancels any currently-queued utterance.
 *
 * No-op when the API isn't available (e.g. SSR or older browsers).
 */
export function useSpeech() {
    return useCallback((text: string, e?: { stopPropagation: () => void }) => {
        if (e) e.stopPropagation();
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/\[|\]/g, ''));
        utterance.lang = 'ja-JP';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
    }, []);
}
