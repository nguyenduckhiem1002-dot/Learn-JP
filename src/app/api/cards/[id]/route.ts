import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const card = await prisma.card.update({
            where: { id: parseInt(id) },
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
        return NextResponse.json(card);
    } catch (err) {
        console.error('[PATCH /api/cards/:id]', err);
        return NextResponse.json(
            { error: 'Failed to update card' },
            { status: 500 },
        );
    }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.card.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[DELETE /api/cards/:id]', err);
        return NextResponse.json(
            { error: 'Failed to delete card' },
            { status: 500 },
        );
    }
}
