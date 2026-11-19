/* eslint-disable */
// Puts back / repairs the starter data the app needs. Safe to run any time, as often as you like:
// it only adds what is missing and never changes or deletes existing values.
//
//   node scripts/seed-starter-data.js                 → everything below
//   node scripts/seed-starter-data.js --no-catalog    → skip car types/makes/models (they download pictures, slow)
//   node scripts/seed-starter-data.js --no-woredas    → skip regions + woredas
//
//   1. core roles            SUPER_ADMIN, ADMIN, GUEST, HOST
//   2. settings              SUPPLIER_COMMISSION_PERCENT = 10 (Wheellol's default cut)
//   3. contact info          one empty "Wheellol contact" row to fill in admin (if none exists)
//   4. car catalog           scripts/seed-car-catalog.js  (types, makes, models + Space pictures)
//   5. regions + woredas     scripts/import-woredas.js
// It does NOT create users — create the super admin separately.
require('dotenv').config();
const path = require('path');
const { spawnSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const has = (f) => process.argv.includes(f);
const run = (file) => {
  const r = spawnSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`${file} failed`);
};

const ROLES = [
  { name: 'SUPER_ADMIN', description: 'Full system access' },
  { name: 'ADMIN', description: 'Admin panel staff' },
  { name: 'GUEST', description: 'Customer who rents cars' },
  { name: 'HOST', description: 'Supplier who lists cars' },
];
const SETTINGS = [{ key: 'SUPPLIER_COMMISSION_PERCENT', value: '10' }];

async function main() {
  const r = await prisma.role.createMany({ data: ROLES, skipDuplicates: true });
  console.log(`✅ roles: ${r.count} added`);

  const s = await prisma.systemSetting.createMany({ data: SETTINGS, skipDuplicates: true });
  console.log(`✅ settings: ${s.count} added`);

  if (!(await prisma.platformContactInfo.count())) {
    await prisma.platformContactInfo.create({ data: { city: 'Addis Ababa', country: 'Ethiopia' } });
    console.log('✅ contact info: empty row created (fill it in admin)');
  }

  const admins = await prisma.user.count({ where: { isSuperAdmin: true } });
  if (!admins) console.log('⚠️  no super admin user exists yet');

  if (!has('--no-catalog')) run('seed-car-catalog.js');
  if (!has('--no-woredas')) run('import-woredas.js');
  console.log('✅ starter data ready');
}

main()
  .catch((e) => { console.error('❌', e.message || e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
