const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

// Manually parse .env to guarantee variables are read
const dotenvPath = path.join(__dirname, '..', '.env');
const env = {};
if (fs.existsSync(dotenvPath)) {
  const content = fs.readFileSync(dotenvPath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.\-_]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[match[1]] = value.trim();
    }
  });
}

const url = env.DATABASE_URL || process.env.DATABASE_URL;
const authToken = env.DATABASE_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

if (!url) {
  console.error('Error: DATABASE_URL is not defined in environment or .env file.');
  process.exit(1);
}

console.log('Connecting to database:', url);
const client = createClient({ url, authToken });

async function run() {
  try {
    const migrationsDir = path.join(__dirname, '..', 'src', 'database', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.error(`Error: Migrations folder not found at ${migrationsDir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log('Found SQL migration files:', files);

    // Clean up partial creations from previous failed run
    console.log('Cleaning up partial tables from failed run...');
    await client.execute('DROP TABLE IF EXISTS "categories";');
    await client.execute('DROP TABLE IF EXISTS "expenses";');
    await client.execute('DROP TABLE IF EXISTS "_meta";');
    await client.execute('DROP TABLE IF EXISTS "monthly_budgets";');
    await client.execute('DROP TABLE IF EXISTS "settings";');
    await client.execute('DROP TABLE IF EXISTS "sync_queue";');
    await client.execute('DROP TABLE IF EXISTS "user_preferences";');
    await client.execute('DROP TABLE IF EXISTS "__drizzle_migrations";');
    await client.execute('DROP TABLE IF EXISTS "user";');
    await client.execute('DROP TABLE IF EXISTS "session";');
    await client.execute('DROP TABLE IF EXISTS "account";');
    await client.execute('DROP TABLE IF EXISTS "verification";');
    console.log('Cleanup completed.');

    // Create drizzle migrations tracker table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT NOT NULL,
        created_at INTEGER
      );
    `);

    for (const file of files) {
      // Check if migration has already been applied
      const res = await client.execute({
        sql: 'SELECT id FROM "__drizzle_migrations" WHERE hash = ?',
        args: [file]
      });

      if (res.rows.length > 0) {
        console.log(`Migration ${file} already applied. Skipping.`);
        continue;
      }

      console.log(`Applying migration: ${file}`);
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      // Double-split logic: first by statement-breakpoint, then by semicolon
      const statements = [];
      sqlContent.split('--> statement-breakpoint').forEach(block => {
        block.split(';').forEach(stmt => {
          const trimmed = stmt.trim();
          if (trimmed.length > 0 && !trimmed.startsWith('--')) {
            statements.push(trimmed);
          }
        });
      });

      // Execute statements sequentially to prevent SQL_MANY_STATEMENTS error
      for (const statement of statements) {
        console.log(` > Executing statement: ${statement.substring(0, 60)}...`);
        await client.execute(statement);
      }

      // Record migration success
      await client.execute({
        sql: 'INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES (?, ?)',
        args: [file, Date.now()]
      });
      console.log(`Successfully applied: ${file}`);
    }

    console.log('All migrations applied successfully to Turso cloud!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.close();
  }
}

run();
