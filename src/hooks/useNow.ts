'use client';
import { useEffect, useState } from 'react';

/**
 * Subscribe to a periodically-ticking `now` value. Lets components
 * derive "due card" state without calling `Date.now()` inside render
 * (which React 19's purity lint flags).
 *
 * Default tick is one minute, which is sufficient for SRS scheduling
 * because intervals are stored in whole minutes.
 */
export function useNow(intervalMs: number = 60_000): number {
    const [now, setNow] = useState(() =>
        typeof Date !== 'undefined' ? Date.now() : 0,
    );

    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), intervalMs);
        return () => window.clearInterval(id);
    }, [intervalMs]);

    return now;
}
