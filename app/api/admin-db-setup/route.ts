import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  if (!url) {
    return NextResponse.json({ error: 'DATABASE_URL is not defined in environment variables.' }, { status: 500 });
  }

  const client = createClient({ url, authToken });
  const logs: string[] = [];

  try {
    logs.push(`Connecting to database: ${url}`);
    
    // 1. Resolve migrations path and load SQL files
    const migrationsDir = path.join(process.cwd(), 'src/database/migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    logs.push(`Found SQL migration files: ${JSON.stringify(files)}`);

    // Create drizzle migrations tracker table if not exists
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT NOT NULL,
        created_at INTEGER
      );
    `);

    // 2. Apply migrations sequentially statement-by-statement
    for (const file of files) {
      const res = await client.execute({
        sql: 'SELECT id FROM "__drizzle_migrations" WHERE hash = ?',
        args: [file]
      });

      if (res.rows.length > 0) {
        logs.push(`Migration ${file} already applied. Skipping.`);
        continue;
      }

      logs.push(`Applying migration: ${file}`);
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      // Double-split logic to prevent SQL_MANY_STATEMENTS errors
      const statements: string[] = [];
      sqlContent.split('--> statement-breakpoint').forEach(block => {
        block.split(';').forEach(stmt => {
          const trimmed = stmt.trim();
          if (trimmed.length > 0 && !trimmed.startsWith('--')) {
            statements.push(trimmed);
          }
        });
      });

      for (const statement of statements) {
        await client.execute(statement);
      }

      await client.execute({
        sql: 'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES (?, ?)',
        args: [file, Date.now()]
      });
      logs.push(`Successfully applied: ${file}`);
    }

    // 3. Confirm table list
    const tableQuery = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
    const tables = tableQuery.rows.map(r => r.name);
    logs.push(`Current database tables: ${JSON.stringify(tables)}`);

    // 4. Verify count query succeeds on 'user' table
    let userCount = -1;
    if (tables.includes('user')) {
      const countQuery = await client.execute("SELECT COUNT(*) as count FROM user;");
      userCount = Number(countQuery.rows[0]?.count ?? 0);
      logs.push(`Verified SELECT COUNT(*) FROM user query succeeded. Count: ${userCount}`);
    } else {
      logs.push('WARNING: user table does not exist!');
    }

    return NextResponse.json({
      success: true,
      tables,
      userCount,
      logs
    });

  } catch (err: any) {
    logs.push(`FAILED: ${err?.message || err}`);
    return NextResponse.json({
      success: false,
      error: err?.message || String(err),
      logs
    }, { status: 500 });
  } finally {
    client.close();
  }
}
