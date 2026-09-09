/**
 * Lightweight schema migration that runs during Vercel build.
 * Uses raw SQL via the `pg` library (already a project dependency)
 * to ensure the database has all required tables in the learn_de schema.
 */
import pg from 'pg';

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!url) {
    console.log('[migrate] No DATABASE_URL or DIRECT_URL found — skipping.');
    process.exit(0);
}

const client = new pg.Client({ connectionString: url });

async function tableExists(schema, table) {
    const res = await client.query(`
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = $1 AND table_name = $2
    `, [schema, table]);
    return res.rows.length > 0;
}

async function columnExists(schema, table, column) {
    const res = await client.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2 AND column_name = $3
    `, [schema, table, column]);
    return res.rows.length > 0;
}

async function run() {
    await client.connect();
    console.log('[migrate] Connected to database.');

    // 1. Ensure schema exists
    await client.query(`CREATE SCHEMA IF NOT EXISTS learn_de`);
    console.log('[migrate] Schema learn_de ensured.');

    // 2. Ensure Card table exists
    if (!(await tableExists('learn_de', 'Card'))) {
        console.log('[migrate] Creating "Card" table...');
        await client.query(`
            CREATE TABLE learn_de."Card" (
                "id" SERIAL PRIMARY KEY,
                "kanji" TEXT NOT NULL,
                "hiragana" TEXT NOT NULL,
                "meaning" TEXT NOT NULL,
                "type" TEXT NOT NULL,
                "exJp" TEXT NOT NULL DEFAULT '',
                "exVn" TEXT NOT NULL DEFAULT '',
                "tip" TEXT NOT NULL DEFAULT '',
                "img" TEXT,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `);
        console.log('[migrate] Card table created.');
    } else {
        console.log('[migrate] Card table already exists.');
    }

    // 3. Ensure UserProgress table exists
    if (!(await tableExists('learn_de', 'UserProgress'))) {
        console.log('[migrate] Creating "UserProgress" table...');
        await client.query(`
            CREATE TABLE learn_de."UserProgress" (
                "id" SERIAL PRIMARY KEY,
                "cardId" INTEGER NOT NULL,
                "userId" TEXT NOT NULL DEFAULT 'default_user',
                "state" TEXT NOT NULL DEFAULT 'new',
                "rating" TEXT,
                "ease" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
                "interval" DOUBLE PRECISION NOT NULL DEFAULT 0,
                "reps" INTEGER NOT NULL DEFAULT 0,
                "lapses" INTEGER NOT NULL DEFAULT 0,
                "dueDate" DOUBLE PRECISION,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT "UserProgress_cardId_fkey"
                    FOREIGN KEY ("cardId") REFERENCES learn_de."Card"("id")
                    ON DELETE CASCADE,
                CONSTRAINT "UserProgress_cardId_userId_key"
                    UNIQUE ("cardId", "userId")
            )
        `);
        console.log('[migrate] UserProgress table created.');
    } else {
        // Ensure lapses column exists (incremental migration)
        if (!(await columnExists('learn_de', 'UserProgress', 'lapses'))) {
            console.log('[migrate] Adding "lapses" column to UserProgress...');
            await client.query(`
                ALTER TABLE learn_de."UserProgress"
                ADD COLUMN "lapses" INTEGER NOT NULL DEFAULT 0
            `);
            console.log('[migrate] lapses column added.');
        }
    }

    // 4. Ensure ReviewLog table exists
    if (!(await tableExists('learn_de', 'ReviewLog'))) {
        console.log('[migrate] Creating "ReviewLog" table...');
        await client.query(`
            CREATE TABLE learn_de."ReviewLog" (
                "id" SERIAL PRIMARY KEY,
                "cardId" INTEGER NOT NULL,
                "userId" TEXT NOT NULL DEFAULT 'default_user',
                "rating" TEXT NOT NULL,
                "prevState" TEXT NOT NULL,
                "prevInterval" DOUBLE PRECISION NOT NULL,
                "newInterval" DOUBLE PRECISION NOT NULL,
                "ease" DOUBLE PRECISION NOT NULL,
                "ts" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT "ReviewLog_cardId_fkey"
                    FOREIGN KEY ("cardId") REFERENCES learn_de."Card"("id")
                    ON DELETE CASCADE
            )
        `);
        await client.query(`
            CREATE INDEX "ReviewLog_userId_ts_idx"
            ON learn_de."ReviewLog" ("userId", "ts")
        `);
        await client.query(`
            CREATE INDEX "ReviewLog_cardId_userId_idx"
            ON learn_de."ReviewLog" ("cardId", "userId")
        `);
        console.log('[migrate] ReviewLog table created.');
    } else {
        console.log('[migrate] ReviewLog table already exists.');
    }

    await client.end();
    console.log('[migrate] Migration complete.');
}

run().catch((err) => {
    console.error('[migrate] Error:', err.message);
    process.exit(0); // Don't fail the build
});
