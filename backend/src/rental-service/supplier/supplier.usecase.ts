// supplier.usecase.ts
// Suppliers (users with the HOST role) list cars from the mobile app.
//  - their cars start as PENDING and are hidden from customers until an admin approves
//  - all talking / contracts / payments with customers stay with Wheellol
//  - the supplier only sees a report: which car was rented, when, and THEIR amount
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CarApprovalStatus, Prisma, Transmission } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotifierService } from '../notification/notifier.service';
import { CommissionService } from './commission.service';

const fail = (message: string, statusCode = 400): never => {
  throw new RpcException({ statusCode, message });
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Suppliers may sign up without a name: fall back to business name / phone */
const displayName = (u: {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  hostProfile?: { businessName?: string | null } | null;
}) =>
  u.hostProfile?.businessName ||
  [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
  u.phone ||
  'A supplier';

import {
  CAR_DOCUMENTS,
  PHOTO_SLOTS,
  Uploaded,
  composeCarFiles,
  documentsSummary,
} from '../../common/car-files';

// The app shows a slot for each of these 6 photos (all optional since
// 2026-11-14 — the admin can add missing photos and documents later).
// Any extra photos come after them.
export const REQUIRED_PHOTOS = [
  'Front',
  'Back',
  'Left side',
  'Right side',
  'Inside – front',
  'Inside – back',
];
// const MAX_PHOTOS = 10;
const MAX_PHOTOS = 20; // 15 guide photos + extras (same as car-files.ts)

// Request statuses that count as a real rental for the supplier
const RENTED = ['APPROVED', 'ACTIVE', 'COMPLETED'] as const;

const carSelect = {
  id: true,
  photos: true,
  photoSlots: true,
  documents: true,
  technicalInspectionCertificateUrl: true,
  year: true,
  color: true,
  licensePlate: true,
  vin: true,
  transmission: true,
  mileage: true,
  seatingCapacity: true,
  features: true,
  description: true,
  location: true,
  isActive: true,
  approvalStatus: true,
  rejectionReason: true,
  submittedAt: true,
  reviewedAt: true,
  createdAt: true,
  makeId: true,
  modelId: true,
  carTypeId: true,
  make: { select: { id: true, name: true } },
  model: { select: { id: true, name: true } },
  carType: { select: { id: true, name: true } },
} satisfies Prisma.CarSelect;

const supplierUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
  profilePhoto: true,
  isActive: true,
  isVerified: true,
  createdAt: true,
  hostProfile: {
    select: {
      businessName: true,
      nationalId: true,
      commissionRate: true,
      isVerified: true,
    },
  },
} satisfies Prisma.UserSelect;

/** Car fields the supplier sends (multipart → everything arrives as strings). */
export type SupplierCarInput = {
  makeId?: string;
  modelId?: string;
  carTypeId?: string;
  year?: string | number;
  color?: string;
  licensePlate?: string;
  vin?: string;
  transmission?: string;
  mileage?: string | number;
  seatingCapacity?: string | number;
  features?: string | string[];
  description?: string;
  location?: string;
  keepPhotos?: string | string[]; // on edit: existing photo URLs to keep (old app)
  // Final photo order: each item is a saved URL to keep or "new:<i>" = the i-th uploaded file
  photoOrder?: string | string[];
  // New apps (see common/car-files.ts): JSON strings
  photoSlots?: string;
  extraPhotos?: string;
  documents?: string;
};

const toList = (v?: string | string[]): string[] => {
  if (v === undefined || v === null || v === '') return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    /* comma separated */
  }
  return String(v)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

// Car fields shown in the history when they change (in this order)
const FIELD_LABELS: Record<string, string> = {
  makeId: 'Brand',
  modelId: 'Model',
  carTypeId: 'Car type',
  year: 'Year',
  color: 'Colour',
  licensePlate: 'Plate',
  vin: 'VIN',
  transmission: 'Transmission',
  mileage: 'Mileage',
  seatingCapacity: 'Seats',
  location: 'Location',
  features: 'Features',
  description: 'Description',
  photos: 'Photos',
  documents: 'Documents',
  isActive: 'Visible to customers',
};

const eventActorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: { select: { name: true } },
} satisfies Prisma.UserSelect;

const toBool = (v: any) => v === true || v === 'true' || v === '1' || v === 1;

const toInt = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : NaN;
};

@Injectable()
export class SupplierUseCases {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: NotifierService,
    private readonly commission: CommissionService,
  ) {}

  private adminCarLink = (id: string) => `/dash/supplier-cars/${id}`;
  private appCarLink = (id: string) => `/supplier/car?id=${id}`;

  // ------------------------------------------------------------ helpers

  private async assertSupplier(userId?: string) {
    if (!userId) fail('Please sign in', 401);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...supplierUserSelect,
        role: { select: { name: true } },
      },
    });
    if (!user || !CommissionService.isSupplier(user)) {
      fail('Only supplier accounts can do this', 403);
    }
    return user!;
  }

  private async ownCar(userId: string, carId: string) {
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      select: { id: true, hostId: true, photos: true, approvalStatus: true },
    });
    if (!car || car.hostId !== userId) fail('Car not found', 404);
    return car!;
  }

  /** Validate + normalise the car form. `partial` = edit (only sent fields). */
  private async parseCar(input: SupplierCarInput, partial = false) {
    const data: Record<string, any> = {};
    const has = (k: keyof SupplierCarInput) =>
      input[k] !== undefined && input[k] !== null && input[k] !== '';
    const need = (k: keyof SupplierCarInput, label: string) => {
      if (!partial && !has(k)) fail(`${label} is required`);
      return has(k);
    };

    if (need('makeId', 'Brand')) data.makeId = String(input.makeId);
    if (need('modelId', 'Model')) data.modelId = String(input.modelId);
    if (need('carTypeId', 'Car type')) data.carTypeId = String(input.carTypeId);

    if (need('year', 'Year')) {
      const year = toInt(input.year);
      const max = new Date().getFullYear() + 1;
      if (!(year >= 1980 && year <= max)) fail(`Year must be between 1980 and ${max}`);
      data.year = year;
    }
    if (need('color', 'Colour')) data.color = String(input.color).trim();
    if (need('licensePlate', 'Plate number')) {
      data.licensePlate = String(input.licensePlate).trim().toUpperCase();
    }
    if (need('transmission', 'Transmission')) {
      const t = String(input.transmission).toUpperCase();
      if (!Object.values(Transmission).includes(t as Transmission)) {
        fail('Transmission must be Automatic or Manual');
      }
      data.transmission = t;
    }
    if (need('seatingCapacity', 'Seats')) {
      const seats = toInt(input.seatingCapacity);
      if (!(seats >= 1 && seats <= 80)) fail('Seats must be between 1 and 80');
      data.seatingCapacity = seats;
    }
    if (has('mileage') || !partial) {
      const km = has('mileage') ? toInt(input.mileage) : 0;
      if (!(km >= 0)) fail('Mileage must be a positive number');
      data.mileage = km;
    }
    if (input.vin !== undefined) data.vin = String(input.vin).trim() || null;
    if (input.description !== undefined) {
      data.description = String(input.description).trim() || null;
    }
    if (input.location !== undefined && String(input.location).trim()) {
      data.location = String(input.location).trim();
    }
    if (input.features !== undefined) data.features = toList(input.features);

    // Brand / model / type must exist and belong together
    if (data.modelId || data.makeId) {
      const model = data.modelId
        ? await this.prisma.carModel.findUnique({
            where: { id: data.modelId },
            select: { makeId: true },
          })
        : null;
      if (data.modelId && !model) fail('Model not found');
      if (data.makeId && model && model.makeId !== data.makeId) {
        fail('The model does not belong to the selected brand');
      }
      if (!data.makeId && model) data.makeId = model.makeId;
    }
    if (data.carTypeId) {
      const type = await this.prisma.carType.findUnique({
        where: { id: data.carTypeId },
        select: { id: true },
      });
      if (!type) fail('Car type not found');
    }
    return data;
  }

  /**
   * Build the final photo list from `photoOrder` (kept URLs + "new:<i>" uploads).
   * Without photoOrder: kept photos first, then the new uploads.
   */
  private composePhotos(
    input: SupplierCarInput,
    uploaded: string[],
    current: string[] = [],
  ): string[] {
    if (input.photoOrder !== undefined) {
      const order = toList(input.photoOrder);
      const used = new Set<number>();
      const list: string[] = [];
      for (const item of order) {
        const m = /^new:(\d+)$/.exec(item);
        if (m) {
          const i = Number(m[1]);
          if (uploaded[i] && !used.has(i)) {
            list.push(uploaded[i]);
            used.add(i);
          }
        } else if (current.includes(item)) {
          list.push(item);
        }
      }
      return [...new Set(list)];
    }
    const keep =
      input.keepPhotos !== undefined
        ? toList(input.keepPhotos).filter((p) => current.includes(p))
        : current;
    return [...keep, ...uploaded];
  }

  /**
   * Photos + documents for create/update.
   * New apps send photoSlots / extraPhotos / documents; the old app sends
   * photoOrder (all 6 slots in order) — then the slots follow the order.
   */
  private carFiles(
    input: SupplierCarInput,
    uploadedPhotos: string[],
    uploadedDocs: Uploaded[],
    current: any = {},
  ) {
    const usesSlots =
      input.photoSlots !== undefined || input.extraPhotos !== undefined;
    let out: any = composeCarFiles(
      usesSlots ? input : { documents: input.documents },
      { photos: usesSlots ? uploadedPhotos : [], documents: uploadedDocs },
      current,
    );
    if (
      !usesSlots &&
      (input.photoOrder !== undefined ||
        input.keepPhotos !== undefined ||
        uploadedPhotos.length)
    ) {
      out = {
        ...out,
        photos: this.composePhotos(input, uploadedPhotos, current.photos || []),
        photoSlots: Prisma.DbNull, // old order: first 6 = the slots
      };
    }
    if (out.photos) this.checkPhotos(out.photos);
    return out;
  }

  /** Field-by-field changes between two `carSelect` rows (for the history). */
  private diffCar(before: any, after: any) {
    const show = (c: any, f: string) => {
      switch (f) {
        case 'makeId':
          return c.make?.name ?? null;
        case 'modelId':
          return c.model?.name ?? null;
        case 'carTypeId':
          return c.carType?.name ?? null;
        case 'features':
          return (c.features || []).join(', ') || null;
        case 'photos':
          return `${c.photos?.length || 0} photos`;
        case 'documents':
          return documentsSummary(c.documents);
        case 'isActive':
          return c.isActive ? 'Yes' : 'No';
        case 'transmission':
          return c.transmission === 'AUTOMATIC' ? 'Automatic' : 'Manual';
        default:
          return c[f] ?? null;
      }
    };
    const changes: any[] = [];
    for (const [field, label] of Object.entries(FIELD_LABELS)) {
      const list = field === 'photos' || field === 'features' || field === 'documents';
      const same = list
        ? JSON.stringify(before[field] || []) === JSON.stringify(after[field] || [])
        : (before[field] ?? null) === (after[field] ?? null);
      if (same) continue;
      const change: any = { field, label, from: show(before, field), to: show(after, field) };
      if (field === 'photos') {
        change.fromList = before.photos || [];
        change.toList = after.photos || [];
      }
      changes.push(change);
    }
    return changes;
  }

  /** Write one line in the car history (never breaks the main action). */
  private async logEvent(
    carId: string,
    type: string,
    message: string,
    details?: any,
    actorId?: string | null,
  ) {
    try {
      await this.prisma.carEvent.create({
        data: {
          carId,
          type,
          message,
          details: details ?? undefined,
          actorId: actorId ?? null,
        },
      });
    } catch {
      /* history is best effort */
    }
  }

  private checkPhotos(photos: string[]) {
    /* Photos are optional now (admin can add them later)
    if (photos.length < REQUIRED_PHOTOS.length) {
      fail(
        `Add all ${REQUIRED_PHOTOS.length} photos: ${REQUIRED_PHOTOS.join(', ')}`,
      );
    }
    */
    if (photos.length > MAX_PHOTOS) fail(`You can add up to ${MAX_PHOTOS} photos`);
  }

  /** Per-car rental numbers for the supplier (their amount only). */
  private async carStats(carIds: string[]) {
    if (!carIds.length) return new Map<string, any>();
    const rows = await this.prisma.rentalRequestCar.findMany({
      where: {
        carId: { in: carIds },
        request: { status: { in: [...RENTED] } },
      },
      select: {
        carId: true,
        supplierAmount: true,
        request: { select: { status: true, days: true } },
      },
    });
    const map = new Map<string, any>();
    for (const r of rows) {
      const s = map.get(r.carId) || {
        rentals: 0,
        days: 0,
        earned: 0,
        onTrip: false,
      };
      s.rentals += 1;
      s.days += r.request.days;
      s.earned = round2(s.earned + (r.supplierAmount || 0));
      if (r.request.status === 'ACTIVE') s.onTrip = true;
      map.set(r.carId, s);
    }
    return map;
  }

  // ------------------------------------------------------------ supplier

  async me(userId: string) {
    const user = await this.assertSupplier(userId);
    const [byStatus, inactive] = await Promise.all([
      this.prisma.car.groupBy({
        by: ['approvalStatus'],
        where: { hostId: userId },
        _count: { _all: true },
      }),
      this.prisma.car.count({ where: { hostId: userId, isActive: false } }),
    ]);
    const counts = { PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<string, number>;
    byStatus.forEach((r) => (counts[r.approvalStatus] = r._count._all));

    const report = await this.report(userId, {});
    // never expose the commission % to the supplier
    const { hostProfile, role, ...rest } = user as any;
    return {
      ...rest,
      businessName: hostProfile?.businessName ?? null,
      cars: {
        total: counts.PENDING + counts.APPROVED + counts.REJECTED,
        ...counts,
        hidden: inactive,
      },
      totals: report.totals,
    };
  }

  async listCars(userId: string) {
    await this.assertSupplier(userId);
    const cars = await this.prisma.car.findMany({
      where: { hostId: userId },
      orderBy: { createdAt: 'desc' },
      select: carSelect,
    });
    const stats = await this.carStats(cars.map((c) => c.id));
    return cars.map((c) => ({
      ...c,
      stats: stats.get(c.id) || { rentals: 0, days: 0, earned: 0, onTrip: false },
    }));
  }

  async getCar(userId: string, carId: string) {
    await this.assertSupplier(userId);
    await this.ownCar(userId, carId);
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      select: carSelect,
    });
    const stats = await this.carStats([carId]);
    return {
      ...car,
      stats: stats.get(carId) || { rentals: 0, days: 0, earned: 0, onTrip: false },
    };
  }

  async createCar(
    userId: string,
    input: SupplierCarInput,
    photos: string[],
    documents: Uploaded[] = [],
  ) {
    const user = await this.assertSupplier(userId);
    const data = await this.parseCar(input);
    // const finalPhotos = this.composePhotos(input, photos || []);
    // this.checkPhotos(finalPhotos);
    const files = this.carFiles(input, photos || [], documents || []);

    const car = await this.prisma.car.create({
      data: {
        ...(data as any),
        hostId: userId,
        photos: [],
        ...files,
        approvalStatus: 'PENDING',
        submittedAt: new Date(),
        isActive: true,
      },
      select: carSelect,
    });

    await this.logEvent(car.id, 'CREATED', 'Car added and sent for review', null, userId);

    void this.notifier.toAdmins({
      type: 'SYSTEM',
      title: 'New supplier car to review',
      message: `${displayName(user)} added ${car.make.name} ${car.model.name} ${car.year} (${car.licensePlate}). Review and approve it before customers can book it.`,
      link: this.adminCarLink(car.id),
      data: { carId: car.id, kind: 'SUPPLIER_CAR_SUBMITTED' },
    });
    return car;
  }

  /** Any edit sends the car back for review (it stays hidden until approved again). */
  async updateCar(
    userId: string,
    carId: string,
    input: SupplierCarInput,
    newPhotos: string[],
    newDocuments: Uploaded[] = [],
  ) {
    const user = await this.assertSupplier(userId);
    const current = await this.ownCar(userId, carId);
    const data = await this.parseCar(input, true);
    const before = await this.prisma.car.findUnique({
      where: { id: carId },
      select: carSelect,
    });

    // Photos + documents: what the supplier kept + the new uploads
    const files = this.carFiles(input, newPhotos || [], newDocuments || [], before);

    const car = await this.prisma.car.update({
      where: { id: carId },
      data: {
        ...(data as any),
        ...files,
        approvalStatus: 'PENDING',
        rejectionReason: null,
        submittedAt: new Date(),
        reviewedAt: null,
      },
      select: carSelect,
    });

    const changes = this.diffCar(before, car);
    await this.logEvent(
      carId,
      'UPDATED',
      changes.length
        ? `Supplier changed ${changes.map((c) => c.label.toLowerCase()).join(', ')} and sent it for review again`
        : 'Supplier sent the car for review again',
      { changes, previousStatus: current.approvalStatus },
      userId,
    );

    void this.notifier.toAdmins({
      type: 'SYSTEM',
      title: 'Supplier car updated · review again',
      message: `${displayName(user)} changed ${car.make.name} ${car.model.name} (${car.licensePlate}). It is hidden from customers until you approve it again.`,
      link: this.adminCarLink(car.id),
      data: { carId: car.id, kind: 'SUPPLIER_CAR_SUBMITTED' },
    });
    return car;
  }

  /** Show / hide the car for customers (no new review needed). */
  async setAvailability(userId: string, carId: string, isActive: boolean) {
    await this.assertSupplier(userId);
    await this.ownCar(userId, carId);
    const before = await this.prisma.car.findUnique({
      where: { id: carId },
      select: { isActive: true },
    });
    const car = await this.prisma.car.update({
      where: { id: carId },
      data: { isActive: !!isActive },
      select: carSelect,
    });
    if (before?.isActive !== car.isActive) {
      await this.logEvent(
        carId,
        car.isActive ? 'SHOWN' : 'HIDDEN',
        car.isActive ? 'Supplier made the car visible again' : 'Supplier hid the car from customers',
        null,
        userId,
      );
    }
    return car;
  }

  async deleteCar(userId: string, carId: string) {
    await this.assertSupplier(userId);
    await this.ownCar(userId, carId);
    const used =
      (await this.prisma.rentalRequestCar.count({ where: { carId } })) +
      (await this.prisma.booking.count({ where: { carId } }));
    if (used > 0) {
      fail(
        'This car already has bookings, so it cannot be deleted. Hide it instead to stop new bookings.',
      );
    }
    await this.prisma.car.delete({ where: { id: carId } });
    return { id: carId };
  }

  /**
   * Rental report: which car, when, how long, status and the SUPPLIER's amount.
   * No customer details, no customer price, no commission.
   */
  async report(
    userId: string,
    query: { from?: string; to?: string; carId?: string; status?: string },
  ) {
    await this.assertSupplier(userId);

    const requestWhere: Prisma.RentalRequestWhereInput = {
      status: { in: [...RENTED] },
    };
    if (query.status && (RENTED as readonly string[]).includes(query.status)) {
      requestWhere.status = query.status as any;
    }
    const pickup: Prisma.DateTimeFilter = {};
    if (query.from && !isNaN(Date.parse(query.from))) pickup.gte = new Date(query.from);
    if (query.to && !isNaN(Date.parse(query.to))) {
      const to = new Date(query.to);
      to.setHours(23, 59, 59, 999);
      pickup.lte = to;
    }
    if (pickup.gte || pickup.lte) requestWhere.pickupDate = pickup;

    const rows = await this.prisma.rentalRequestCar.findMany({
      where: {
        car: { hostId: userId },
        ...(query.carId ? { carId: query.carId } : {}),
        request: requestWhere,
      },
      orderBy: { request: { pickupDate: 'desc' } },
      select: {
        id: true,
        supplierAmount: true,
        car: {
          select: {
            id: true,
            photos: true,
            year: true,
            color: true,
            licensePlate: true,
            make: { select: { name: true } },
            model: { select: { name: true } },
          },
        },
        request: {
          select: {
            trackingCode: true,
            status: true,
            pickupDate: true,
            days: true,
            pickupCity: true,
            destinations: true,
          },
        },
      },
    });

    const rentals = rows.map((r) => {
      const end = new Date(r.request.pickupDate);
      end.setDate(end.getDate() + r.request.days);
      return {
        id: r.id,
        car: r.car,
        reference: r.request.trackingCode,
        status: r.request.status,
        pickupDate: r.request.pickupDate,
        endDate: end,
        days: r.request.days,
        route: [r.request.pickupCity, ...r.request.destinations],
        amount: r.supplierAmount, // null = Wheellol hasn't set the price yet
      };
    });

    const sum = (list: typeof rentals) =>
      round2(list.reduce((t, r) => t + (r.amount || 0), 0));
    const completed = rentals.filter((r) => r.status === 'COMPLETED');
    const upcoming = rentals.filter((r) => r.status !== 'COMPLETED');

    // Per-car breakdown
    const byCar = new Map<string, any>();
    for (const r of rentals) {
      const c = byCar.get(r.car.id) || {
        car: r.car,
        rentals: 0,
        days: 0,
        amount: 0,
      };
      c.rentals += 1;
      c.days += r.days;
      c.amount = round2(c.amount + (r.amount || 0));
      byCar.set(r.car.id, c);
    }

    return {
      totals: {
        rentals: rentals.length,
        days: rentals.reduce((t, r) => t + r.days, 0),
        earned: sum(completed), // finished trips
        upcoming: sum(upcoming), // approved / on trip
        total: sum(rentals),
        pricePending: rentals.filter((r) => r.amount === null).length,
      },
      byCar: [...byCar.values()].sort((a, b) => b.amount - a.amount),
      rentals,
    };
  }

  // ------------------------------------------------------------ admin

  async getSettings() {
    return { commissionPercent: await this.commission.getGlobalPercent() };
  }

  async setSettings(body: { commissionPercent: number }) {
    const percent = Number(body?.commissionPercent);
    await this.commission.setGlobalPercent(percent);
    return this.getSettings();
  }

  async adminListSuppliers(query: {
    search?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10));
    const q = query.search?.trim();
    const where: Prisma.UserWhereInput = {
      role: { name: 'HOST' },
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q } },
              { hostProfile: { businessName: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [users, total, globalPercent] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: supplierUserSelect,
      }),
      this.prisma.user.count({ where }),
      this.commission.getGlobalPercent(),
    ]);

    const ids = users.map((u) => u.id);
    const carCounts = ids.length
      ? await this.prisma.car.groupBy({
          by: ['hostId', 'approvalStatus'],
          where: { hostId: { in: ids } },
          _count: { _all: true },
        })
      : [];

    const models = users.map((u) => {
      const cars = { total: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<string, number>;
      carCounts
        .filter((c) => c.hostId === u.id)
        .forEach((c) => {
          cars[c.approvalStatus] = c._count._all;
          cars.total += c._count._all;
        });
      const override = u.hostProfile?.commissionRate ?? null;
      return {
        ...u,
        cars,
        commission: {
          override,
          effective: override ?? globalPercent,
          global: globalPercent,
        },
      };
    });

    return {
      models,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
      globalPercent,
    };
  }

  async adminGetSupplier(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { ...supplierUserSelect, role: { select: { name: true } } },
    });
    if (!user || !CommissionService.isSupplier(user)) fail('Supplier not found', 404);

    const [cars, globalPercent, rentals] = await Promise.all([
      this.prisma.car.findMany({
        where: { hostId: id },
        orderBy: { createdAt: 'desc' },
        select: carSelect,
      }),
      this.commission.getGlobalPercent(),
      this.prisma.rentalRequestCar.findMany({
        where: { car: { hostId: id }, request: { status: { in: [...RENTED] } } },
        orderBy: { request: { pickupDate: 'desc' } },
        select: {
          id: true,
          price: true,
          commissionRate: true,
          commissionAmount: true,
          supplierAmount: true,
          car: {
            select: {
              id: true,
              licensePlate: true,
              year: true,
              make: { select: { name: true } },
              model: { select: { name: true } },
            },
          },
          request: {
            select: {
              id: true,
              trackingCode: true,
              status: true,
              pickupDate: true,
              days: true,
              contactName: true,
            },
          },
        },
      }),
    ]);
    const stats = await this.carStats(cars.map((c) => c.id));
    const override = user!.hostProfile?.commissionRate ?? null;
    const sum = (k: 'price' | 'commissionAmount' | 'supplierAmount') =>
      round2(rentals.reduce((t, r) => t + (r[k] || 0), 0));

    const { role, ...rest } = user as any;
    return {
      ...rest,
      commission: { override, effective: override ?? globalPercent, global: globalPercent },
      cars: cars.map((c) => ({
        ...c,
        stats: stats.get(c.id) || { rentals: 0, days: 0, earned: 0, onTrip: false },
      })),
      rentals,
      totals: {
        rentals: rentals.length,
        customerPaid: sum('price'),
        commission: sum('commissionAmount'),
        supplier: sum('supplierAmount'),
      },
    };
  }

  /** null / '' = remove the override and use the global default */
  async adminSetCommission(id: string, rate: number | string | null) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: { select: { name: true } } },
    });
    if (!user || !CommissionService.isSupplier(user)) fail('Supplier not found', 404);

    let value: number | null = null;
    if (rate !== null && rate !== undefined && rate !== '') {
      value = Number(rate);
      if (!Number.isFinite(value) || value < 0 || value >= 100) {
        fail('Commission must be between 0 and 99.99 %');
      }
    }
    await this.prisma.hostProfile.upsert({
      where: { userId: id },
      create: { userId: id, commissionRate: value },
      update: { commissionRate: value },
    });
    return this.adminGetSupplier(id);
  }

  async adminListCars(query: {
    status?: string;
    search?: string;
    hostId?: string;
    page?: number | string;
    pageSize?: number | string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10));
    const status = (Object.values(CarApprovalStatus) as string[]).includes(
      query.status || '',
    )
      ? (query.status as CarApprovalStatus)
      : undefined;
    const q = query.search?.trim();

    const base: Prisma.CarWhereInput = {
      host: { role: { name: 'HOST' } }, // supplier cars only
      ...(query.hostId ? { hostId: query.hostId } : {}),
      ...(q
        ? {
            OR: [
              { licensePlate: { contains: q, mode: 'insensitive' } },
              { make: { name: { contains: q, mode: 'insensitive' } } },
              { model: { name: { contains: q, mode: 'insensitive' } } },
              { host: { firstName: { contains: q, mode: 'insensitive' } } },
              { host: { lastName: { contains: q, mode: 'insensitive' } } },
              { host: { phone: { contains: q } } },
            ],
          }
        : {}),
    };
    const where = { ...base, ...(status ? { approvalStatus: status } : {}) };

    const [models, total, counts] = await Promise.all([
      this.prisma.car.findMany({
        where,
        orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          ...carSelect,
          host: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              hostProfile: { select: { businessName: true } },
            },
          },
        },
      }),
      this.prisma.car.count({ where }),
      this.prisma.car.groupBy({
        by: ['approvalStatus'],
        where: base,
        _count: { _all: true },
      }),
    ]);
    const statusCounts = { PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<string, number>;
    counts.forEach((c) => (statusCounts[c.approvalStatus] = c._count._all));

    return {
      models,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
      counts: statusCounts,
    };
  }

  async adminReviewCar(
    carId: string,
    body: { decision: 'APPROVED' | 'REJECTED'; reason?: string },
    adminId?: string,
  ) {
    const decision = body?.decision;
    if (decision !== 'APPROVED' && decision !== 'REJECTED') {
      fail('Decision must be APPROVED or REJECTED');
    }
    const reason = body.reason?.trim() || null;
    if (decision === 'REJECTED' && !reason) {
      fail('Tell the supplier why the car was rejected');
    }

    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      select: { id: true, hostId: true, approvalStatus: true },
    });
    if (!car) fail('Car not found', 404);
    if (car!.approvalStatus === decision) {
      fail(decision === 'APPROVED' ? 'This car is already approved' : 'This car is already rejected');
    }

    const updated = await this.prisma.car.update({
      where: { id: carId },
      data: {
        approvalStatus: decision,
        rejectionReason: decision === 'REJECTED' ? reason : null,
        reviewedAt: new Date(),
      },
      select: carSelect,
    });

    const name = `${updated.make.name} ${updated.model.name} (${updated.licensePlate})`;
    const was = car!.approvalStatus;
    await this.logEvent(
      carId,
      decision,
      decision === 'APPROVED'
        ? was === 'REJECTED'
          ? 'Approved again after being rejected · visible to customers'
          : 'Approved · visible to customers'
        : was === 'APPROVED'
          ? `Unpublished and rejected: ${reason}`
          : `Rejected: ${reason}`,
      { from: was, to: decision, reason },
      adminId,
    );

    void this.notifier.toCustomer(car!.hostId, {
      type: 'SYSTEM',
      title: decision === 'APPROVED' ? 'Your car is approved 🎉' : 'Your car needs changes',
      message:
        decision === 'APPROVED'
          ? `${name} is now visible to customers on Wheellol.`
          : `${name} was not approved: ${reason}. Edit the car and send it again.`,
      link: this.appCarLink(carId),
      data: { carId, kind: 'SUPPLIER_CAR_REVIEWED', decision },
    });
    return updated;
  }

  /** One supplier car for the admin detail page: car, supplier, rentals and history. */
  async adminGetCar(carId: string) {
    const car = await this.prisma.car.findUnique({
      where: { id: carId },
      select: {
        ...carSelect,
        host: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            profilePhoto: true,
            hostProfile: { select: { businessName: true } },
          },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            message: true,
            details: true,
            createdAt: true,
            actor: { select: eventActorSelect },
          },
        },
      },
    });
    if (!car) fail('Car not found', 404);

    const [stats, rentals] = await Promise.all([
      this.carStats([carId]),
      this.prisma.rentalRequestCar.findMany({
        where: { carId },
        orderBy: { request: { pickupDate: 'desc' } },
        select: {
          id: true,
          price: true,
          commissionAmount: true,
          supplierAmount: true,
          request: {
            select: {
              id: true,
              trackingCode: true,
              status: true,
              pickupDate: true,
              days: true,
              contactName: true,
            },
          },
        },
      }),
    ]);
    return {
      ...car!,
      stats: stats.get(carId) || { rentals: 0, days: 0, earned: 0, onTrip: false },
      rentals,
    };
  }

  /**
   * Admin adds a car for a supplier (car details, photos 1–15, papers 16–20 —
   * all files optional). Wheellol made it, so it is approved straight away;
   * the supplier is told and can see it in the app.
   */
  async adminCreateCar(
    hostId: string,
    input: SupplierCarInput & { isActive?: any },
    photos: string[],
    adminId?: string,
    documents: Uploaded[] = [],
  ) {
    const host = await this.assertSupplier(hostId);
    const data = await this.parseCar(input);
    const files = this.carFiles(input, photos || [], documents || []);
    const isActive =
      input.isActive !== undefined && input.isActive !== '' ? toBool(input.isActive) : true;

    const car = await this.prisma.car.create({
      data: {
        ...(data as any),
        hostId,
        photos: [],
        ...files,
        approvalStatus: 'APPROVED',
        submittedAt: new Date(),
        reviewedAt: new Date(),
        isActive,
      },
      select: carSelect,
    });

    await this.logEvent(
      car.id,
      'CREATED',
      `Added by Wheellol for ${displayName(host)} · approved`,
      null,
      adminId,
    );

    void this.notifier.toCustomer(hostId, {
      type: 'SYSTEM',
      title: 'Wheellol added a car for you',
      message: `${car.make.name} ${car.model.name} ${car.year} (${car.licensePlate}) is now on your account.`,
      link: this.appCarLink(car.id),
      data: { carId: car.id, kind: 'SUPPLIER_CAR_ADMIN_UPDATED' },
    });
    return this.adminGetCar(car.id);
  }

  /**
   * Admin edits any field or photo of a supplier car.
   * The approval status stays as it is (no new review needed); the supplier is told.
   */
  async adminUpdateCar(
    carId: string,
    input: SupplierCarInput & { isActive?: any },
    newPhotos: string[],
    adminId?: string,
    newDocuments: Uploaded[] = [],
  ) {
    const before = await this.prisma.car.findUnique({
      where: { id: carId },
      select: { ...carSelect, hostId: true },
    });
    if (!before) fail('Car not found', 404);
    const data = await this.parseCar(input, true);

    /* Old: at least one photo was required
    let photos: string[] | undefined;
    if (input.photoOrder !== undefined || input.keepPhotos !== undefined || newPhotos?.length) {
      photos = this.composePhotos(input, newPhotos || [], before!.photos);
      if (!photos.length) fail('Keep at least one photo');
      if (photos.length > MAX_PHOTOS) fail(`You can add up to ${MAX_PHOTOS} photos`);
    }
    */
    const files = this.carFiles(input, newPhotos || [], newDocuments || [], before);
    if (input.isActive !== undefined && input.isActive !== '') {
      data.isActive = toBool(input.isActive);
    }

    const after = await this.prisma.car.update({
      where: { id: carId },
      data: { ...(data as any), ...files },
      select: carSelect,
    });

    const changes = this.diffCar(before, after);
    if (changes.length) {
      await this.logEvent(
        carId,
        'ADMIN_UPDATED',
        `Admin changed ${changes.map((c) => c.label.toLowerCase()).join(', ')}`,
        { changes },
        adminId,
      );
      void this.notifier.toCustomer(before!.hostId, {
        type: 'SYSTEM',
        title: 'Wheellol updated your car',
        message: `We changed ${changes.map((c) => c.label.toLowerCase()).join(', ')} on ${after.make.name} ${after.model.name} (${after.licensePlate}).`,
        link: this.appCarLink(carId),
        data: { carId, kind: 'SUPPLIER_CAR_ADMIN_UPDATED' },
      });
    }
    return this.adminGetCar(carId);
  }

  /** Admin sets the price of one car in a booking request (stores the commission split). */
  async adminSetRequestCarPrice(
    requestId: string,
    carId: string,
    body: { price?: number | string | null; supplierAmount?: number | string | null },
    adminId?: string,
  ) {
    const num = (v: any) =>
      v === undefined ? undefined : v === null || v === '' ? null : Number(v);
    const price = num(body?.price);
    const supplierAmount = num(body?.supplierAmount);
    if (price !== undefined && price !== null && !(price >= 0)) fail('Price must be a positive number');
    if (supplierAmount !== undefined && supplierAmount !== null && !(supplierAmount >= 0)) {
      fail('Supplier price must be a positive number');
    }

    const before = await this.prisma.rentalRequestCar.findUnique({
      where: { requestId_carId: { requestId, carId } },
      select: { price: true, supplierAmount: true },
    });
    const row = await this.commission.setRequestCarPrice(requestId, carId, {
      price,
      supplierAmount,
    });

    if (
      (before?.price ?? null) !== (row.price ?? null) ||
      (before?.supplierAmount ?? null) !== (row.supplierAmount ?? null)
    ) {
      const car = await this.prisma.car.findUnique({
        where: { id: carId },
        select: { licensePlate: true, make: { select: { name: true } }, model: { select: { name: true } } },
      });
      const fmt = (n: number | null) =>
        n === null ? 'none' : `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} ETB`;
      await this.prisma.rentalRequestEvent.create({
        data: {
          requestId,
          type: 'CAR_PRICE_CHANGED',
          message: `${car?.make.name} ${car?.model.name} (${car?.licensePlate}) price set to ${fmt(row.price)}${
            row.supplierAmount !== null ? ` · supplier ${fmt(row.supplierAmount)}, Wheellol keeps ${fmt(row.commissionAmount)}` : ''
          }`,
          details: { carId, from: before?.price ?? null, to: row.price } as any,
          actorId: adminId ?? null,
        },
      });
    }
    return row;
  }
}
