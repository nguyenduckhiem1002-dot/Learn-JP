/**
 * Lightweight schema migration that runs during Vercel build.
 * Uses raw SQL via the `pg` library (already a project dependency)
 * to ensure the database has all required columns and tables.
 *
 * This is more reliable than `prisma db push` on Vercel because it
 * doesn't require resolving prisma.config.ts or TypeScript execution.
 */
import pg from 'pg';

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!url) {
    console.log('[migrate] No DATABASE_URL or DIRECT_URL found — skipping.');
    process.exit(0);
}

const client = new pg.Client({ connectionString: url });

async function run() {
    await client.connect();
    console.log('[migrate] Connected to database.');

    // Ensure schema exists
    await client.query(`CREATE SCHEMA IF NOT EXISTS learn_jp`);

    // Ensure UserProgress.lapses column exists
    const colCheck = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'learn_jp'
          AND table_name = 'UserProgress'
          AND column_name = 'lapses'
    `);
    if (colCheck.rows.length === 0) {
        console.log('[migrate] Adding "lapses" column to UserProgress...');
        await client.query(`
            ALTER TABLE learn_jp."UserProgress"
            ADD COLUMN "lapses" INTEGER NOT NULL DEFAULT 0
        `);
        console.log('[migrate] Done.');
    } else {
        console.log('[migrate] UserProgress.lapses already exists.');
    }

    // Ensure ReviewLog table exists
    const tableCheck = await client.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'learn_jp'
          AND table_name = 'ReviewLog'
    `);
    if (tableCheck.rows.length === 0) {
        console.log('[migrate] Creating "ReviewLog" table...');
        await client.query(`
            CREATE TABLE learn_jp."ReviewLog" (
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
                    FOREIGN KEY ("cardId") REFERENCES learn_jp."Card"("id")
                    ON DELETE CASCADE
            )
        `);
        await client.query(`
            CREATE INDEX "ReviewLog_userId_ts_idx"
            ON learn_jp."ReviewLog" ("userId", "ts")
        `);
        await client.query(`
            CREATE INDEX "ReviewLog_cardId_userId_idx"
            ON learn_jp."ReviewLog" ("cardId", "userId")
        `);
        console.log('[migrate] Done.');
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
