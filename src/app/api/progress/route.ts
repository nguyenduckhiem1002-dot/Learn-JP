import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { USER_ID } from '@/lib/auth';

interface ProgressPayload {
    cardId: number;
    state: string;
    rating: string;
    ease: number;
    interval: number;
    reps: number;
    lapses?: number;
    dueDate?: number | null;
    /** Optional metadata used for ReviewLog. */
    prevState?: string;
    prevInterval?: number;
}

export async function POST(req: Request) {
    const body = (await req.json()) as ProgressPayload;
    const {
        cardId,
        state,
        rating,
        ease,
        interval,
        reps,
        lapses = 0,
        dueDate,
        prevState,
        prevInterval,
    } = body;

    await prisma.$transaction([
        prisma.userProgress.upsert({
            where: { cardId_userId: { cardId, userId: USER_ID } },
            update: { state, rating, ease, interval, reps, lapses, dueDate: dueDate ?? null },
            create: { cardId, userId: USER_ID, state, rating, ease, interval, reps, lapses, dueDate: dueDate ?? null },
        }),
        prisma.reviewLog.create({
            data: {
                cardId,
                userId: USER_ID,
                rating,
                prevState: prevState ?? state,
                prevInterval: prevInterval ?? 0,
                newInterval: interval,
                ease,
            },
        }),
    ]);

    return NextResponse.json({ ok: true });
}
