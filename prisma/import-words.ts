import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

// Direct connection without schema for reading from public schema
const sourcePool = new Pool({
    connectionString: process.env.DIRECT_URL!.replace('&schema=learn_jp', ''),
});

// Target: learn_jp schema
const targetAdapter = new PrismaPg(
    { connectionString: process.env.DIRECT_URL! },
    { schema: 'learn_jp' }
);
const prisma = new PrismaClient({ adapter: targetAdapter });

interface OldWord {
    id: string;
    term: string;
    reading: string;
    meaning: string;
    pos: string;
    example: string;
}

function parseTerm(term: string, reading: string): { k: string; h: string } {
    // Pattern: "漢字 (よみ)" or "漢字(よみ)"
    const match = term.match(/^(.+?)\s*\((.+?)\)$/);
    if (match) {
        return { k: match[1].trim(), h: reading || match[2].trim() };
    }
    // Plain hiragana/katakana term
    return { k: term.trim(), h: reading || term.trim() };
}

async function main() {
    const { rows: oldWords } = await sourcePool.query<OldWord>(
        'SELECT id, term, reading, meaning, pos, example FROM public.words ORDER BY id::int'
    );
    console.log(`Found ${oldWords.length} words in public.words`);

    // Get existing kanji to avoid exact duplicates
    const existing = await prisma.card.findMany({ select: { kanji: true } });
    const existingKanji = new Set(existing.map(c => c.kanji));
    console.log(`Already have ${existingKanji.size} cards in learn_jp`);

    const toInsert = oldWords
        .map(w => {
            const { k, h } = parseTerm(w.term, w.reading);
            return {
                kanji: k,
                hiragana: h,
                meaning: w.meaning || '',
                type: w.pos || 'Danh từ',
                exJp: w.example || '',
                exVn: '',
                tip: '',
            };
        })
        .filter(c => !existingKanji.has(c.kanji));

    console.log(`Inserting ${toInsert.length} new cards (skipping ${oldWords.length - toInsert.length} duplicates)...`);

    if (toInsert.length > 0) {
        // Insert in batches of 100 to avoid timeout
        const batchSize = 100;
        for (let i = 0; i < toInsert.length; i += batchSize) {
            const batch = toInsert.slice(i, i + batchSize);
            await prisma.card.createMany({ data: batch });
            console.log(`  Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(toInsert.length / batchSize)}`);
        }
    }

    const total = await prisma.card.count();
    console.log(`Done. Total cards in learn_jp: ${total}`);
}

main()
    .then(() => Promise.all([prisma.$disconnect(), sourcePool.end()]))
    .catch(async e => {
        console.error(e.message);
        await Promise.all([prisma.$disconnect(), sourcePool.end()]);
        process.exit(1);
    });
