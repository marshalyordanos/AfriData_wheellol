/* eslint-disable */
// Seeds car types, makes and models (with Ethiopian local names) and their pictures.
//
//   npm run seed:catalog              → add/update data, download pictures that are missing
//   npm run seed:catalog -- --force   → download every picture again
//   npm run seed:catalog -- --only=vitz,cruiser → download again only for matching items
//   npm run seed:catalog -- --no-upload → keep pictures on disk only (no Spaces upload, DB image not set)
//
// Pictures: Wikipedia lead image / Wikimedia Commons search (free licences),
// resized with sharp, saved to prisma/seed-data/images/ and uploaded to the
// DigitalOcean Space (public). Credits → prisma/seed-data/car-catalog-credits.json.
// Safe to run again: matches by name, never duplicates, never deletes.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { PrismaClient } = require('@prisma/client');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { types, makes } = require('../prisma/seed-data/car-catalog');

const FORCE = process.argv.includes('--force');
// --only=vitz,cruiser → download the pictures again only for items whose label contains one of these words
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').slice(7).toLowerCase().split(',').filter(Boolean);
const redo = (label) => FORCE || ONLY.some((w) => label.toLowerCase().includes(w));
const UPLOAD = !process.argv.includes('--no-upload');
const BUCKET = 'wheellol';
const UA = 'WheellolCatalogSeed/1.0 (car rental catalog seed script)';
const DATA_DIR = path.join(__dirname, '..', 'prisma', 'seed-data');
const IMG_DIR = path.join(DATA_DIR, 'images');
const CREDITS_FILE = path.join(DATA_DIR, 'car-catalog-credits.json');

const prisma = new PrismaClient();
const s3 = UPLOAD
  ? new S3Client({
      endpoint: 'https://sfo3.digitaloceanspaces.com',
      region: 'sfo3',
      forcePathStyle: true,
      credentials: {
        accessKeyId: (process.env.DO_SPACES_KEY || '').trim(),
        secretAccessKey: (process.env.DO_SPACES_SECRET || '').trim(),
      },
    })
  : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const strip = (html) => (html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

async function getJson(url) {
  for (let i = 0; i < 6; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 4000 * (i + 1);
      await sleep(wait);
    } else throw new Error(`HTTP ${res.status} for ${url}`);
  }
  throw new Error(`Too many retries: ${url}`);
}

const WIKI = 'https://en.wikipedia.org/w/api.php';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const qs = (o) => new URLSearchParams({ format: 'json', ...o }).toString();

/** credit info for a file (works for Commons and local enwiki files) */
async function fileCredit(api, fileTitle) {
  const j = await getJson(`${api}?${qs({ action: 'query', titles: fileTitle, prop: 'imageinfo', iiprop: 'extmetadata|url' })}`);
  const page = Object.values(j.query?.pages || {})[0];
  const ii = page?.imageinfo?.[0];
  const m = ii?.extmetadata || {};
  return {
    file: fileTitle,
    page: ii?.descriptionurl,
    author: strip(m.Artist?.value),
    license: strip(m.LicenseShortName?.value),
    licenseUrl: m.LicenseUrl?.value,
  };
}

/** Lead picture of an English Wikipedia article */
async function fromWiki(title, width = 900) {
  const j = await getJson(
    `${WIKI}?${qs({ action: 'query', titles: title, prop: 'pageimages', piprop: 'thumbnail|name', pithumbsize: String(width), redirects: '1' })}`,
  );
  const page = Object.values(j.query?.pages || {})[0];
  if (!page?.thumbnail?.source) return null;
  const credit = await fileCredit(WIKI, `File:${page.pageimage}`);
  return { url: page.thumbnail.source, credit: { ...credit, article: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}` } };
}

/** An exact Commons file (e.g. "File:Toyota carlogo.svg"); null when it doesn't exist */
async function fromCommonsFile(fileTitle, { logo = false, width = 900 } = {}) {
  const j = await getJson(
    `${COMMONS}?${qs({ action: 'query', titles: fileTitle, prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: String(logo ? 400 : width) })}`,
  );
  const page = Object.values(j.query?.pages || {})[0];
  const ii = page?.imageinfo?.[0];
  if (!ii) return null;
  const m = ii.extmetadata || {};
  return {
    url: ii.thumburl || ii.url,
    credit: { file: page.title, page: ii.descriptionurl, author: strip(m.Artist?.value), license: strip(m.LicenseShortName?.value), licenseUrl: m.LicenseUrl?.value },
  };
}

/** First picture on Wikimedia Commons matching the search (logo: SVG/PNG only) */
async function fromCommons(search, { logo = false, width = 900 } = {}) {
  const j = await getJson(
    `${COMMONS}?${qs({
      action: 'query',
      generator: 'search',
      gsrsearch: logo ? `${search} filetype:svg` : `${search} filetype:bitmap`,
      gsrnamespace: '6',
      gsrlimit: '8',
      prop: 'imageinfo',
      iiprop: 'url|mime|extmetadata',
      iiurlwidth: String(logo ? 400 : width),
    })}`,
  );
  const pages = Object.values(j.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
  const ok = logo ? /svg|png/ : /jpeg|png/;
  const hit = pages.find((p) => ok.test(p.imageinfo?.[0]?.mime || ''));
  if (!hit) return null;
  const ii = hit.imageinfo[0];
  const m = ii.extmetadata || {};
  return {
    url: ii.thumburl || ii.url,
    credit: {
      file: hit.title,
      page: ii.descriptionurl,
      author: strip(m.Artist?.value),
      license: strip(m.LicenseShortName?.value),
      licenseUrl: m.LicenseUrl?.value,
    },
  };
}

/** download → resize → save on disk → upload; returns the public URL (or null) */
async function storePicture(found, key, { logo = false } = {}) {
  const res = await fetch(found.url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`download ${res.status}`);
  const input = Buffer.from(await res.arrayBuffer());
  const img = sharp(input).rotate();
  const out = logo
    ? await img.resize({ width: 400, height: 400, fit: 'inside', withoutEnlargement: true }).png().toBuffer()
    : await img.resize({ width: 900, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  const file = `${key}.${logo ? 'png' : 'jpg'}`;
  fs.mkdirSync(path.join(IMG_DIR, path.dirname(file)), { recursive: true });
  fs.writeFileSync(path.join(IMG_DIR, file), out);
  if (!UPLOAD) return null;
  const objectKey = `catalog/${file}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
      Body: out,
      ACL: 'public-read',
      ContentType: logo ? 'image/png' : 'image/jpeg',
      CacheControl: 'public, max-age=31536000',
    }),
  );
  return `https://${BUCKET}.sfo3.digitaloceanspaces.com/${objectKey}`;
}

const credits = fs.existsSync(CREDITS_FILE) ? JSON.parse(fs.readFileSync(CREDITS_FILE, 'utf8')) : {};
const report = { created: 0, updated: 0, images: 0, imageFailed: [] };

/** find + store a picture for one item; returns URL or undefined */
async function picture(label, key, src, opts = {}) {
  try {
    let found = null;
    for (const f of src.files || []) {
      if (!found) found = await fromCommonsFile(f, opts);
    }
    if (!found && src.wiki) found = await fromWiki(src.wiki);
    if (!found && src.commons) found = await fromCommons(src.commons, opts);
    if (!found && src.logo) found = await fromCommons(src.logo, { logo: true });
    if (!found) {
      report.imageFailed.push(`${label} (no picture found)`);
      return undefined;
    }
    const url = await storePicture(found, key, opts);
    credits[key] = { for: label, ...found.credit, storedAt: url || `local:${key}` };
    report.images += 1;
    console.log(`   🖼  ${label} ← ${found.credit.file} (${found.credit.license || 'see page'})`);
    await sleep(1200); // be gentle with Wikimedia (it rate-limits)
    return url || undefined;
  } catch (e) {
    report.imageFailed.push(`${label} (${e.message})`);
    return undefined;
  }
}

async function main() {
  console.log(`Seeding car catalog${FORCE ? ' (force pictures)' : ''}${UPLOAD ? '' : ' (no upload)'}…\n`);

  // ---- types
  console.log('Car types');
  for (const t of types) {
    const existing = await prisma.carType.findUnique({ where: { name: t.name } });
    const needImage = redo(`type: ${t.name}`) || !existing?.image;
    const image = needImage ? await picture(`type: ${t.name}`, `types/${slug(t.name)}`, t) : undefined;
    const data = { description: t.description, ...(image ? { image } : {}) };
    if (existing) {
      await prisma.carType.update({ where: { id: existing.id }, data });
      report.updated += 1;
    } else {
      await prisma.carType.create({ data: { name: t.name, ...data } });
      report.created += 1;
    }
    console.log(` ${existing ? '↻' : '+'} ${t.name}`);
  }

  // ---- makes + models
  for (const mk of makes) {
    console.log(`\n${mk.name}`);
    let make = await prisma.carMake.findUnique({ where: { name: mk.name } });
    const logo = redo(`make: ${mk.name}`) || !make?.logo ? await picture(`make: ${mk.name}`, `makes/${slug(mk.name)}`, { logo: mk.logo, files: mk.logoFiles }, { logo: true }) : undefined;
    if (make) {
      if (logo) make = await prisma.carMake.update({ where: { id: make.id }, data: { logo } });
      report.updated += 1;
    } else {
      make = await prisma.carMake.create({ data: { name: mk.name, ...(logo ? { logo } : {}) } });
      report.created += 1;
    }

    for (const md of mk.models) {
      const existing = await prisma.carModel.findFirst({ where: { makeId: make.id, name: md.name } });
      const image =
        redo(`model: ${mk.name} ${md.name}`) || !existing?.image ? await picture(`model: ${mk.name} ${md.name}`, `models/${slug(mk.name)}-${slug(md.name)}`, md) : undefined;
      const data = { localName: md.localName ?? null, ...(image ? { image } : {}) };
      if (existing) {
        await prisma.carModel.update({ where: { id: existing.id }, data });
        report.updated += 1;
      } else {
        await prisma.carModel.create({ data: { name: md.name, makeId: make.id, ...data } });
        report.created += 1;
      }
      console.log(` ${existing ? '↻' : '+'} ${md.name}${md.localName ? `  (${md.localName})` : ''}`);
    }
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CREDITS_FILE, JSON.stringify(credits, null, 2));

  console.log(`\nDone: ${report.created} created, ${report.updated} updated, ${report.images} pictures.`);
  if (report.imageFailed.length) console.log(`No picture for:\n - ${report.imageFailed.join('\n - ')}`);
  console.log(`Credits: ${path.relative(process.cwd(), CREDITS_FILE)}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
