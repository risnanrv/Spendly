const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

// Load environment variables from .env
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
  console.error('Error: DATABASE_URL is not defined.');
  process.exit(1);
}

const client = createClient({ url, authToken });

async function verify() {
  try {
    console.log('Querying existing database tables...');
    const tableQuery = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
    const tables = tableQuery.rows.map(r => r.name);
    console.log('Tables found:', tables);

    console.log('Executing test query: SELECT COUNT(*) FROM user;');
    const countQuery = await client.execute("SELECT COUNT(*) as count FROM user;");
    console.log('Test query succeeded. User count:', countQuery.rows[0].count);

  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  } finally {
    client.close();
  }
}

verify();
