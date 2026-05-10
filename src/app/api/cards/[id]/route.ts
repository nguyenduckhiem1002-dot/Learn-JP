import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
}
