// car-files.ts
// Car photos (fixed slots + extras) and car documents, shared by the admin
// car service and the supplier service. Everything is optional: a car can be
// saved with no photo and no document, and the admin can add them later.
//
// The apps send (multipart, as JSON strings):
//   photoSlots  { front: "<kept url>" | "new:<i>" | "" , ... }   "" = empty slot
//   extraPhotos [ "<kept url>" | "new:<i>", ... ]
//   documents   { libre: "<kept url>" | "new:<i>" | "", ... }    "" = remove
// "new:<i>" = the i-th uploaded file (photos[] or documentFiles[]).
// A slot / document that is not sent keeps its saved value.
import { Prisma } from '@prisma/client';

/* Old 6 slots (before 2026-11-18):
export const PHOTO_SLOTS = [
  { key: 'front', label: 'Front' },
  { key: 'back', label: 'Back' },
  { key: 'left', label: 'Left side' },
  { key: 'right', label: 'Right side' },
  { key: 'insideFront', label: 'Inside – front' },
  { key: 'insideBack', label: 'Inside – back' },
] as const;
*/
// The 15 photos of the WheeL LOL Vehicle Photo Guide, in its order (1–15).
// All optional. The old keys are kept: insideFront = #11, insideBack = #14.
// (Guide photos 16–20 are the papers → CAR_DOCUMENTS.)
export const PHOTO_SLOTS = [
  { key: 'front', label: 'Front' },
  { key: 'back', label: 'Back' },
  { key: 'left', label: 'Left side' },
  { key: 'right', label: 'Right side' },
  { key: 'doorFrontLeft', label: 'Front-left door' },
  { key: 'doorBackLeft', label: 'Back-left door' },
  { key: 'doorFrontRight', label: 'Front-right door' },
  { key: 'doorBackRight', label: 'Back-right door' },
  { key: 'plateFront', label: 'Front plate' },
  { key: 'plateBack', label: 'Back plate' },
  { key: 'insideFront', label: 'Dashboard and km' },
  { key: 'seatDriver', label: "Driver's seat" },
  { key: 'seatPassenger', label: 'Passenger seat' },
  { key: 'insideBack', label: 'Back seat' },
  { key: 'boot', label: 'Rear seats and boot' },
] as const;

// Cars saved before photoSlots existed: their first 6 photos were in this order.
const LEGACY_SLOT_KEYS = ['front', 'back', 'left', 'right', 'insideFront', 'insideBack'];

/* Old list (before 2026-11-18):
export const CAR_DOCUMENTS = [
  { key: 'libre', label: 'Vehicle registration (Libre)' },
  { key: 'insurance', label: 'Insurance certificate' },
  { key: 'inspection', label: 'Annual inspection (Bolo)' },
  { key: 'businessLicense', label: 'Business licence' },
  { key: 'vatCertificate', label: 'VAT registration certificate' },
  { key: 'driverLicense', label: "Driver's licence" },
] as const;
*/
// Papers of each car, all optional. The first 5 are photos 16–20 of the
// Vehicle Photo Guide; the last 2 come from the rental agreement (art. 3.2 / 5.2).
// driverLicense = the licence's front side (old key kept).
export const CAR_DOCUMENTS = [
  { key: 'libre', label: 'Libre (ownership book)' },
  { key: 'inspection', label: 'Bolo (yearly inspection)' },
  { key: 'insurance', label: 'Insurance' },
  { key: 'driverLicense', label: 'Driver licence – front' },
  { key: 'driverLicenseBack', label: 'Driver licence – back' },
  { key: 'businessLicense', label: 'Business licence' },
  { key: 'vatCertificate', label: 'VAT registration certificate' },
] as const;

// export const MAX_PHOTOS = 10;
export const MAX_PHOTOS = 20; // 15 guide photos + extras

export type DocEntry = { url: string; name?: string | null; uploadedAt: string };
export type Uploaded = { url: string; name?: string | null };

type CarFilesState = {
  photos?: string[] | null;
  photoSlots?: any;
  documents?: any;
  technicalInspectionCertificateUrl?: string | null;
};

export type CarFilesInput = {
  photoSlots?: any;
  extraPhotos?: any;
  documents?: any;
};

const SLOT_KEYS = PHOTO_SLOTS.map((s) => s.key) as string[];
const DOC_KEYS = CAR_DOCUMENTS.map((d) => d.key) as string[];

const parse = (v: any) => {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return undefined;
  }
};

/** Saved slots; old cars (no photoSlots) → the first 6 photos in order. */
export function slotsOf(car: CarFilesState): Record<string, string> {
  const out: Record<string, string> = {};
  const saved = car.photoSlots;
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
    for (const k of SLOT_KEYS) if (typeof saved[k] === 'string' && saved[k]) out[k] = saved[k];
    return out;
  }
  (car.photos || []).slice(0, LEGACY_SLOT_KEYS.length).forEach((url, i) => {
    if (url) out[LEGACY_SLOT_KEYS[i]] = url;
  });
  return out;
}

export function extrasOf(car: CarFilesState): string[] {
  const inSlots = new Set(Object.values(slotsOf(car)));
  return (car.photos || []).filter((p) => p && !inSlots.has(p));
}

/** Saved documents (+ the old inspection certificate field). */
export function documentsOf(car: CarFilesState): Record<string, DocEntry> {
  const out: Record<string, DocEntry> = {};
  const saved = car.documents;
  if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
    for (const k of DOC_KEYS) {
      const d = saved[k];
      if (d?.url) out[k] = { url: d.url, name: d.name ?? null, uploadedAt: d.uploadedAt || new Date().toISOString() };
    }
  }
  if (!out.inspection && car.technicalInspectionCertificateUrl) {
    out.inspection = { url: car.technicalInspectionCertificateUrl, name: null, uploadedAt: new Date(0).toISOString() };
  }
  return out;
}

/** Does the request change photos / documents at all? */
export function hasFilesInput(input: CarFilesInput) {
  return input.photoSlots !== undefined || input.extraPhotos !== undefined || input.documents !== undefined;
}

/**
 * Work out the new photos, slots and documents.
 * Returns only the columns that change (spread it into prisma `data`).
 */
export function composeCarFiles(
  input: CarFilesInput,
  uploads: { photos?: string[]; documents?: Uploaded[] },
  current: CarFilesState = {},
): {
  photos?: string[];
  photoSlots?: Prisma.InputJsonValue;
  documents?: Prisma.InputJsonValue;
  technicalInspectionCertificateUrl?: string | null;
} {
  const out: any = {};
  const newPhotos = uploads.photos || [];
  const newDocs = uploads.documents || [];

  // ---------------- photos ----------------
  const slotsIn = parse(input.photoSlots);
  const extrasIn = parse(input.extraPhotos);
  if (slotsIn !== undefined || extrasIn !== undefined || newPhotos.length) {
    const savedSlots = slotsOf(current);
    const savedExtras = extrasOf(current);
    const known = new Set([...(current.photos || []), ...Object.values(savedSlots)]);
    const used = new Set<number>();
    const resolve = (v: any): string | null => {
      if (typeof v !== 'string' || !v) return null;
      const m = /^new:(\d+)$/.exec(v);
      if (m) {
        const i = Number(m[1]);
        if (!newPhotos[i] || used.has(i)) return null;
        used.add(i);
        return newPhotos[i];
      }
      return known.has(v) ? v : null;
    };

    const slots: Record<string, string> = {};
    for (const k of SLOT_KEYS) {
      if (slotsIn && typeof slotsIn === 'object' && k in slotsIn) {
        const url = resolve(slotsIn[k]);
        if (url) slots[k] = url;
      } else if (savedSlots[k]) {
        slots[k] = savedSlots[k];
      }
    }
    let extras: string[] = Array.isArray(extrasIn)
      ? (extrasIn.map(resolve).filter(Boolean) as string[])
      : savedExtras;
    // uploads that were not placed anywhere become extra photos
    newPhotos.forEach((url, i) => {
      if (!used.has(i)) extras.push(url);
    });
    const inSlots = new Set(Object.values(slots));
    extras = [...new Set(extras.filter((p) => !inSlots.has(p)))];

    const photos = [...SLOT_KEYS.map((k) => slots[k]).filter(Boolean), ...extras];
    out.photos = photos.slice(0, MAX_PHOTOS);
    out.photoSlots = slots;
  }

  // ---------------- documents ----------------
  const docsIn = parse(input.documents);
  if (docsIn !== undefined && typeof docsIn === 'object' && !Array.isArray(docsIn)) {
    const saved = documentsOf(current);
    const docs: Record<string, DocEntry> = {};
    for (const k of DOC_KEYS) {
      if (!(k in docsIn)) {
        if (saved[k]) docs[k] = saved[k];
        continue;
      }
      const v = docsIn[k];
      const m = typeof v === 'string' ? /^new:(\d+)$/.exec(v) : null;
      if (m) {
        const up = newDocs[Number(m[1])];
        if (up?.url) docs[k] = { url: up.url, name: up.name ?? null, uploadedAt: new Date().toISOString() };
        else if (saved[k]) docs[k] = saved[k];
      } else if (typeof v === 'string' && v && saved[k]?.url === v) {
        docs[k] = saved[k]; // kept
      }
      // "" or unknown → removed
    }
    out.documents = docs;
    out.technicalInspectionCertificateUrl = docs.inspection?.url ?? null;
  }

  return out;
}

/** Short text for the car history, e.g. "3 of 6 documents". */
export const documentsSummary = (docs: any) =>
  `${Object.keys(documentsOf({ documents: docs })).length} of ${CAR_DOCUMENTS.length} documents`;
