const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
const isVercel = !!process.env.VERCEL;

if (url && (url.startsWith('libsql://') || url.startsWith('https://') || url.startsWith('http://'))) {
  console.log('Production Turso database detected. Running Drizzle Kit migrations...');
  try {
    execSync('npx drizzle-kit migrate', { stdio: 'inherit' });
    console.log('Migrations completed successfully.');
  } catch (err) {
    console.error('Error running migrations:', err);
    if (isVercel) {
      console.error('Failing build due to migration failure in Vercel environment.');
      process.exit(1);
    }
  }
} else {
  console.log('Local or no remote database URL configured. Skipping build-time migrations.');
}
