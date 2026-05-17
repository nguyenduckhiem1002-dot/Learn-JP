import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { USER_ID } from '@/lib/auth';
import { dbCardToCard, dbProgressToSrs } from '@/lib/mappers';
import { buildAnalytics, type ReviewLogEntry } from '@/lib/stats';
import type { Card, CardRating, SRSData, SRSState } from '@/lib/types';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export async function GET() {
    try {
        const now = Date.now();

        const [cardsRows, logsRows] = await Promise.all([
            prisma.card.findMany({
                include: {
                    progress: { where: { userId: USER_ID }, take: 1 },
                },
                orderBy: { id: 'asc' },
            }),
            prisma.reviewLog.findMany({
                where: {
                    userId: USER_ID,
                    ts: { gte: new Date(now - NINETY_DAYS_MS) },
                },
                orderBy: { ts: 'asc' },
            }),
        ]);

        const cards: Card[] = cardsRows.map((c) =>
            dbCardToCard(c as unknown as Record<string, unknown>),
        );
        const srsData: SRSData[] = cardsRows.map((c) =>
            dbProgressToSrs(
                (c.progress as unknown as Record<string, unknown>[])?.[0],
            ),
        );

        const logs: ReviewLogEntry[] = logsRows.map((l) => ({
            cardId: l.cardId,
            rating: l.rating as NonNullable<CardRating>,
            prevState: l.prevState as SRSState,
            prevInterval: l.prevInterval,
            newInterval: l.newInterval,
            ease: l.ease,
            ts: l.ts.getTime(),
        }));

        const snapshot = buildAnalytics({ cards, srsData, logs, now });
        return NextResponse.json(snapshot);
    } catch (err) {
        console.error('[GET /api/stats]', err);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 },
        );
    }
}
