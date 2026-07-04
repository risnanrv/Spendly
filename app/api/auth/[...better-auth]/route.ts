import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { MigrationRunner } from '@/database/migrator';

export const dynamic = 'force-dynamic';

const handler = toNextJsHandler(auth);

export const GET = async (req: Request) => {
  try {
    await MigrationRunner.run();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Migration failed during GET request initialization:', err);
  }
  return handler.GET(req);
};

export const POST = async (req: Request) => {
  try {
    await MigrationRunner.run();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Migration failed during POST request initialization:', err);
  }
  return handler.POST(req);
};
