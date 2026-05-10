import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const USER_ID = 'default_user';

export async function GET() {
    const cards = await prisma.card.findMany({
        include: {
            progress: { where: { userId: USER_ID }, take: 1 },
        },
        orderBy: { id: 'asc' },
    });
    return NextResponse.json(cards);
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
