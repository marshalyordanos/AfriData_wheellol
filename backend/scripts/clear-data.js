/* eslint-disable */
// DANGER — wipes (almost) all data. Keeps the people: users, roles, permissions,
// guest/host profiles and login tokens (super admin, staff, customers, suppliers stay).
// Deletes: cars, rental requests, payments, contracts, notifications, messages, bookings,
// reviews … and also the starter data (car catalog, locations, settings, contract templates)
// unless --keep-config. Afterwards run scripts/seed-starter-data.js to put the starter data back.
//
//   node scripts/clear-data.js                              → shows the database + row counts, deletes nothing
//   node scripts/clear-data.js --yes --confirm=<db name>    → really deletes
//   node scripts/clear-data.js --yes --confirm=<db name> --keep-config
//
// Runs in ONE transaction: if any kept table changed in size, everything is rolled back.
// There is no undo — take a backup first (pg_dump).
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3);
const YES = process.argv.includes('--yes');
const KEEP_CONFIG = process.argv.includes('--keep-config');

const KEEP_ALWAYS = ['User', 'Role', 'Permission', 'RolePermission', 'GuestProfile', 'HostProfile', 'RefreshToken', '_prisma_migrations'];
const CONFIG = ['CarType', 'CarMake', 'CarModel', 'Location', 'SystemSetting', 'PlatformContactInfo', 'ContractTemplate', 'CancellationPolicy', 'PromoCode'];

const prisma = new PrismaClient();
const q = (n) => `"${n.replace(/"/g, '""')}"`;

async function counts(tables) {
  const out = {};
  for (const t of tables) out[t] = Number((await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM ${q(t)}`))[0].n);
  return out;
}

async function main() {
  const [{ db }] = await prisma.$queryRawUnsafe('SELECT current_database() AS db');
  const url = new URL(process.env.DATABASE_URL);
  const all = (await prisma.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`)).map((r) => r.tablename);
  const keep = new Set([...KEEP_ALWAYS, ...(KEEP_CONFIG ? CONFIG : [])]);
  const wipe = all.filter((t) => !keep.has(t));
  const before = await counts(all);

  console.log(`Database: ${db} @ ${url.hostname}\n`);
  console.log('KEEP  :', all.filter((t) => keep.has(t)).map((t) => `${t}(${before[t]})`).join(', '));
  console.log('DELETE:', wipe.map((t) => `${t}(${before[t]})`).join(', '), '\n');

  if (!YES || arg('confirm') !== db) {
    console.log(`Nothing deleted. To delete run again with:  --yes --confirm=${db}`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`TRUNCATE ${wipe.map(q).join(', ')} RESTART IDENTITY CASCADE`);
    for (const t of keep) {
      if (!all.includes(t)) continue;
      const n = Number((await tx.$queryRawUnsafe(`SELECT COUNT(*)::int AS n FROM ${q(t)}`))[0].n);
      if (n !== before[t]) throw new Error(`Kept table ${t} changed (${before[t]} → ${n}) — rolled back, nothing deleted.`);
    }
  }, { timeout: 120000 });
  console.log('✅ Done. Users, roles and profiles were kept. Next: node scripts/seed-starter-data.js');
}

main()
  .catch((e) => { console.error('❌', e.message || e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
