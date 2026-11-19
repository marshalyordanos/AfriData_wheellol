/* eslint-disable */
// Imports Ethiopian regions + woredas from the 2025 woreda sheet into the Location table.
//
//   node scripts/import-woredas.js --dry-run     → show what would be added, change nothing
//   node scripts/import-woredas.js               → add the missing locations
//   node scripts/import-woredas.js --pickup      → woredas can be chosen as pickup city too
//   node scripts/import-woredas.js --file=/path/Woreda_2025.xls
//
// Regions → type REGION (Addis Ababa, Dire Dawa → CITY_ADMINISTRATION).
// Woredas → type CITY with region = its region. Woredas are NOT pickup cities unless --pickup
// (1,148 rows would flood the pickup picker). Existing locations are never changed or deleted;
// a name that already exists is skipped. Safe to run again.
require('dotenv').config();
const path = require('path');
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3);
const DRY = process.argv.includes('--dry-run');
const PICKUP = process.argv.includes('--pickup');
const FILE = arg('file') || path.join(__dirname, '..', 'prisma', 'seed-data', 'Woreda_2025.xls');
const CITY_ADMIN = ['Addis Ababa', 'Dire Dawa'];
const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

const prisma = new PrismaClient();

async function main() {
  const wb = XLSX.readFile(FILE);
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  console.log(`Read ${rows.length} rows from ${FILE}`);

  const existing = new Set((await prisma.location.findMany({ select: { name: true } })).map((l) => l.name));
  const last = await prisma.location.aggregate({ _max: { sortOrder: true } });
  let sort = (last._max.sortOrder ?? 0) + 1;

  const toAdd = [];
  const skipped = [];
  const add = (loc) => {
    if (!loc.name || existing.has(loc.name)) return skipped.push(loc.name);
    existing.add(loc.name);
    toAdd.push({ ...loc, sortOrder: sort++ });
  };

  const regions = [...new Set(rows.map((r) => clean(r.Region_name)).filter(Boolean))];
  for (const name of regions) {
    add({ name, type: CITY_ADMIN.includes(name) ? 'CITY_ADMINISTRATION' : 'REGION', region: null, isPickup: CITY_ADMIN.includes(name) });
  }
  for (const r of rows) {
    add({ name: clean(r.Woreda_name), type: 'CITY', region: clean(r.Region_name) || null, isPickup: PICKUP });
  }

  console.log(`To add: ${toAdd.length} (${regions.length} regions + woredas) · already there / duplicate: ${skipped.length}`);
  if (DRY) {
    console.log(toAdd.slice(0, 20).map((l) => `  ${l.type.padEnd(19)} ${l.name}  (${l.region ?? '-'})`).join('\n'), '\n  …');
    return console.log('Dry run — nothing saved.');
  }
  for (let i = 0; i < toAdd.length; i += 500) {
    await prisma.location.createMany({ data: toAdd.slice(i, i + 500), skipDuplicates: true });
  }
  console.log(`✅ Added ${toAdd.length} locations.`);
}

main()
  .catch((e) => { console.error('❌', e.message || e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
