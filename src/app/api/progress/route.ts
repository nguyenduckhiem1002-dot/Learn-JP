import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const USER_ID = 'default_user';

export async function POST(req: Request) {
    const body = await req.json();
    const { cardId, state, rating, ease, interval, reps, dueDate } = body;

    await prisma.userProgress.upsert({
        where: { cardId_userId: { cardId, userId: USER_ID } },
        update: { state, rating, ease, interval, reps, dueDate: dueDate ?? null },
        create: { cardId, userId: USER_ID, state, rating, ease, interval, reps, dueDate: dueDate ?? null },
    });

    return NextResponse.json({ ok: true });
}
