import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { USER_ID } from '@/lib/auth';

export async function GET() {
    try {
        const cards = await prisma.card.findMany({
            include: {
                progress: { where: { userId: USER_ID }, take: 1 },
            },
            orderBy: { id: 'asc' },
        });
        return NextResponse.json(cards);
    } catch (err) {
        console.error('[GET /api/cards]', err);
        return NextResponse.json(
            { error: 'Failed to fetch cards' },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    const body = await req.json();
    const card = await prisma.card.create({
        data: {
            kanji: body.k,
            hiragana: body.h || '',
            meaning: body.v,
            type: body.t || 'Danh từ',
            exJp: body.ej || '',
            exVn: body.ev || '',
            tip: body.tip || '',
            img: body.img || null,
        },
    });
    return NextResponse.json(card, { status: 201 });
}

export async function DELETE(req: Request) {
    try {
        const { ids } = await req.json() as { ids: number[] };
        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'ids array required' }, { status: 400 });
        }
        await prisma.card.deleteMany({ where: { id: { in: ids } } });
        return NextResponse.json({ ok: true, deleted: ids.length });
    } catch (err) {
        console.error('[DELETE /api/cards]', err);
        return NextResponse.json(
            { error: 'Failed to delete cards' },
            { status: 500 },
        );
    }
}
