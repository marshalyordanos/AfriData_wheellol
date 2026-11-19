/* eslint-disable */
// Adds the 11 supplier cars (and their owners as HOST users) with photos uploaded to the Space.
// Run `npm run seed:catalog` first — the car type / make / model must exist.
//
//   node scripts/add-supplier-cars.js --dry-run            → check everything, change nothing
//   node scripts/add-supplier-cars.js                       → upload photos + create owners and cars
//   node scripts/add-supplier-cars.js --only=umer,tadele    → only these keys
//   node scripts/add-supplier-cars.js --photos="/path/Wheellol Vehicle Full Documents"
//   node scripts/add-supplier-cars.js --no-upload           → skip Spaces (cars get no photos)
//
// Data: prisma/seed-data/supplier-cars.js (edit plate/year/phone there before running).
// Photos: resized (max 1600px, jpeg) → Space "wheellol" at cars/<key>/<n>.jpg (public-read).
// Only .jpg/.jpeg are used (no PDFs / videos). Duplicate photos are skipped, max 10 per car.
// Cars are APPROVED straight away. Safe to run again: a car is recognised by vin = "IMPORT:<key>".
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const cars = require('../prisma/seed-data/supplier-cars');

const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3);
const DRY = process.argv.includes('--dry-run');
const UPLOAD = !process.argv.includes('--no-upload');
const ONLY = arg('only').split(',').map((s) => s.trim()).filter(Boolean);
const PHOTOS = arg('photos') || path.join(__dirname, '..', '..', '..', 'test', 'Wheellol Vehicle Full Documents');
const MAX_PHOTOS = 10;
const BUCKET = 'wheellol';

const prisma = new PrismaClient();
const s3 = new S3Client({
  endpoint: 'https://sfo3.digitaloceanspaces.com',
  region: 'sfo3',
  forcePathStyle: true,
  credentials: { accessKeyId: (process.env.DO_SPACES_KEY || '').trim(), secretAccessKey: (process.env.DO_SPACES_SECRET || '').trim() },
});

function listPhotos(folder) {
  const dir = path.join(PHOTOS, folder);
  if (!fs.existsSync(dir)) throw new Error(`Photo folder not found: ${dir}`);
  const seen = new Set();
  const out = [];
  for (const f of fs.readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f)).sort()) {
    const buf = fs.readFileSync(path.join(dir, f));
    const h = crypto.createHash('sha1').update(buf).digest('hex');
    if (seen.has(h)) continue;
    seen.add(h);
    out.push(buf);
    if (out.length >= MAX_PHOTOS) break;
  }
  return out;
}

async function uploadPhotos(key, buffers) {
  const urls = [];
  for (let i = 0; i < buffers.length; i++) {
    const body = await sharp(buffers[i]).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
    const objectKey = `cars/${key}/${i + 1}.jpg`;
    await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: objectKey, Body: body, ACL: 'public-read', ContentType: 'image/jpeg', CacheControl: 'public, max-age=31536000' }));
    urls.push(`https://${BUCKET}.sfo3.digitaloceanspaces.com/${objectKey}`);
  }
  return urls;
}

async function main() {
  const list = cars.filter((c) => !ONLY.length || ONLY.includes(c.key));
  const hostRole = await prisma.role.findUnique({ where: { name: 'HOST' } });
  if (!hostRole) throw new Error('HOST role missing — run scripts/seed-starter-data.js first.');

  // 1. check the catalog + photos before changing anything
  const problems = [];
  const prepared = [];
  for (const c of list) {
    const make = await prisma.carMake.findUnique({ where: { name: c.make } });
    const model = make && (await prisma.carModel.findFirst({ where: { makeId: make.id, name: c.model } }));
    const type = await prisma.carType.findUnique({ where: { name: c.carType } });
    if (!make || !model || !type) problems.push(`${c.key}: catalog missing ${!make ? 'make ' + c.make : !model ? 'model ' + c.model : 'type ' + c.carType}`);
    let photos = [];
    try { photos = listPhotos(c.folder); } catch (e) { problems.push(`${c.key}: ${e.message}`); }
    if (!photos.length) problems.push(`${c.key}: no .jpg photos found`);
    prepared.push({ c, make, model, type, photos });
  }
  if (problems.length) throw new Error('Fix first:\n  - ' + problems.join('\n  - '));
  console.log(`Checked ${list.length} cars, ${prepared.reduce((n, p) => n + p.photos.length, 0)} photos.`);
  if (DRY) {
    prepared.forEach((p) => console.log(`  ${p.c.key.padEnd(16)} ${p.c.make} ${p.c.model} · ${p.c.plate} · ${p.photos.length} photos · owner ${p.c.owner}`));
    return console.log('Dry run — nothing uploaded or saved.');
  }

  // 2. owners (HOST users, one per owner name) + cars
  const owners = new Map();
  let phoneNo = 0;
  const ownerFor = async (c) => {
    if (owners.has(c.owner)) return owners.get(c.owner);
    const [firstName, ...rest] = c.owner.split(' ');
    let phone = c.phone;
    if (!phone) { // placeholder number, unique; replace later in admin
      do { phone = `09000000${String(++phoneNo).padStart(2, '0')}`; } while (await prisma.user.findUnique({ where: { phone } }));
    }
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: { firstName, lastName: rest.join(' ') || '-', phone, roleId: hostRole.id, isVerified: true, hostProfile: { create: { isVerified: true } } },
      });
      console.log(`  + owner ${c.owner} (${phone})`);
    }
    owners.set(c.owner, user);
    return user;
  };

  const report = [];
  for (const { c, make, model, type, photos } of prepared) {
    const vin = `IMPORT:${c.key}`;
    const found = await prisma.car.findFirst({ where: { vin }, select: { id: true } });
    if (found) { console.log(`= ${c.key} already added`); continue; }
    const host = await ownerFor(c);
    const urls = UPLOAD ? await uploadPhotos(c.key, photos) : [];
    await prisma.car.create({
      data: {
        hostId: host.id, makeId: make.id, modelId: model.id, carTypeId: type.id,
        year: c.year, color: c.color, licensePlate: c.plate, vin,
        transmission: c.transmission, mileage: 0, seatingCapacity: c.seats,
        dailyRate: 0, rentalPricePerDay: 0, // price is negotiated per request
        approvalStatus: 'APPROVED', photos: urls, isActive: true,
      },
    });
    console.log(`✅ ${c.key}: ${c.make} ${c.model} · ${urls.length} photos`);
    if (c.check) report.push(c.key);
  }
  if (report.length) console.log(`\n⚠️  Please confirm model/year/plate/seats/owner phone for: ${report.join(', ')}`);
}

main()
  .catch((e) => { console.error('❌', e.message || e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
