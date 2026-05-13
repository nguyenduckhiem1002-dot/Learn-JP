'use client';
import { useEffect, useState } from 'react';
import type { AnalyticsSnapshot } from '../lib/stats';

interface AnalyticsState {
    data: AnalyticsSnapshot | null;
    isLoading: boolean;
    error: string | null;
}

interface UseAnalyticsResult extends AnalyticsState {
    /** Trigger an immediate re-fetch (e.g. after the user rates cards). */
    refresh: () => void;
}

/**
 * Fetch the server-side aggregated analytics snapshot. The server does
 * the heavy lifting (joins, date-bucketing) so the client just renders.
 */
export function useAnalytics(version: number = 0): UseAnalyticsResult {
    const [state, setState] = useState<AnalyticsState>({
        data: null,
        isLoading: true,
        error: null,
    });
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/stats', { cache: 'no-store' });
                if (cancelled) return;
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json: AnalyticsSnapshot = await res.json();
                if (!cancelled) setState({ data: json, isLoading: false, error: null });
            } catch (err) {
                if (cancelled) return;
                setState((prev) => ({
                    data: prev.data,
                    isLoading: false,
                    error: err instanceof Error ? err.message : String(err),
                }));
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [version, tick]);

    return {
        ...state,
        refresh: () => setTick((t) => t + 1),
    };
}
