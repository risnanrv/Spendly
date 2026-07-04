import { SeedService } from '../src/database/seed';

async function main() {
  console.log('Seeding database...');
  await SeedService.seed();
  console.log('Seeding complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding script failed:', err);
  process.exit(1);
});
