// rental-request.repository.ts
import { Injectable } from '@nestjs/common';
import { Prisma, RentalRequestStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const carSummary = {
  select: {
    id: true,
    photos: true,
    year: true,
    color: true,
    seatingCapacity: true,
    transmission: true,
    licensePlate: true,
    make: { select: { id: true, name: true } },
    model: { select: { id: true, name: true } },
    carType: { select: { id: true, name: true } },
  },
};

// What the admin sees
export const adminInclude = {
  customer: {
    select: { id: true, firstName: true, lastName: true, phone: true, email: true },
  },
  cars: { include: { car: carSummary } },
  payments: {
    orderBy: { paidAt: 'asc' as const },
    include: {
      recordedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  },
  events: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      actor: { select: { id: true, firstName: true, lastName: true } },
    },
  },
} satisfies Prisma.RentalRequestInclude;

// What the customer sees (no internal admin data)
export const customerInclude = {
  cars: { include: { car: carSummary } },
  payments: {
    orderBy: { paidAt: 'asc' as const },
    select: { id: true, amount: true, method: true, paidAt: true, reference: true },
  },
} satisfies Prisma.RentalRequestInclude;

@Injectable()
export class RentalRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  countActiveCars(ids: string[]) {
    return this.prisma.car.count({ where: { id: { in: ids }, isActive: true } });
  }

  /** Pickup cities customers may choose (managed in admin → Locations). */
  async pickupLocationNames(): Promise<string[] | null> {
    const total = await this.prisma.location.count();
    if (!total) return null; // table not set up yet → accept any city
    const rows = await this.prisma.location.findMany({
      where: { isActive: true, isPickup: true },
      select: { name: true },
    });
    return rows.map((r) => r.name);
  }

  /** All active locations (destinations can be any of them). */
  async activeLocationNames(): Promise<string[] | null> {
    const total = await this.prisma.location.count();
    if (!total) return null; // table not set up yet → accept any place
    const rows = await this.prisma.location.findMany({
      where: { isActive: true },
      select: { name: true },
    });
    return rows.map((r) => r.name);
  }

  trackingCodeExists(code: string) {
    return this.prisma.rentalRequest
      .findUnique({ where: { trackingCode: code }, select: { id: true } })
      .then(Boolean);
  }

  create(data: {
    trackingCode: string;
    customerId?: string | null;
    contactName: string;
    contactPhone: string;
    contactEmail?: string | null;
    pickupCity: string;
    destinations: string[];
    purpose: string;
    ruralAccess: boolean;
    pickupDate: Date;
    days: number;
    note?: string | null;
    carIds: string[];
  }) {
    const { carIds, ...rest } = data;
    return this.prisma.rentalRequest.create({
      data: {
        ...rest,
        cars: { create: carIds.map((carId) => ({ carId })) },
        events: {
          create: {
            type: 'CREATED',
            message: 'Request submitted by the customer',
            actorId: rest.customerId ?? null,
          },
        },
      },
      include: customerInclude,
    });
  }

  findById(id: string) {
    return this.prisma.rentalRequest.findUnique({
      where: { id },
      include: adminInclude,
    });
  }

  findByCode(code: string) {
    return this.prisma.rentalRequest.findUnique({
      where: { trackingCode: code },
      include: customerInclude,
    });
  }

  async list(params: {
    page: number;
    pageSize: number;
    search?: string;
    status?: RentalRequestStatus;
    customerId?: string;
    forCustomer?: boolean;
  }) {
    const where: Prisma.RentalRequestWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.customerId) where.customerId = params.customerId;
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { trackingCode: { contains: q, mode: 'insensitive' } },
        { contactName: { contains: q, mode: 'insensitive' } },
        { contactPhone: { contains: q } },
        { pickupCity: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [models, total] = await Promise.all([
      this.prisma.rentalRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: params.forCustomer ? customerInclude : adminInclude,
      }),
      this.prisma.rentalRequest.count({ where }),
    ]);

    return {
      models,
      pagination: {
        total,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: Math.ceil(total / params.pageSize),
      },
    };
  }

  countByStatus() {
    return this.prisma.rentalRequest.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
  }

  update(id: string, data: Prisma.RentalRequestUpdateInput) {
    return this.prisma.rentalRequest.update({
      where: { id },
      data,
      include: adminInclude,
    });
  }

  addEvent(data: Prisma.RentalRequestEventUncheckedCreateInput) {
    return this.prisma.rentalRequestEvent.create({ data });
  }

  addPayment(data: Prisma.RentalPaymentUncheckedCreateInput) {
    return this.prisma.rentalPayment.create({ data });
  }

  findPayment(id: string) {
    return this.prisma.rentalPayment.findUnique({ where: { id } });
  }

  deletePayment(id: string) {
    return this.prisma.rentalPayment.delete({ where: { id } });
  }

  async listPayments(params: {
    page: number;
    pageSize: number;
    search?: string;
    method?: Prisma.RentalPaymentWhereInput['method'];
  }) {
    const where: Prisma.RentalPaymentWhereInput = {};
    if (params.method) where.method = params.method;
    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { reference: { contains: q, mode: 'insensitive' } },
        { request: { trackingCode: { contains: q, mode: 'insensitive' } } },
        { request: { contactName: { contains: q, mode: 'insensitive' } } },
        { request: { contactPhone: { contains: q } } },
      ];
    }
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [models, total, all, month, byMethod] = await Promise.all([
      this.prisma.rentalPayment.findMany({
        where,
        orderBy: { paidAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          recordedBy: { select: { id: true, firstName: true, lastName: true } },
          request: {
            select: {
              id: true,
              trackingCode: true,
              status: true,
              contactName: true,
              contactPhone: true,
              contactEmail: true,
              pickupCity: true,
              destinations: true,
              pickupDate: true,
              days: true,
              totalPrice: true,
              payments: {
                select: { id: true, amount: true, paidAt: true },
                orderBy: [{ paidAt: 'asc' }, { createdAt: 'asc' }],
              },
            },
          },
        },
      }),
      this.prisma.rentalPayment.count({ where }),
      this.prisma.rentalPayment.aggregate({
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.rentalPayment.aggregate({
        where: { paidAt: { gte: monthStart } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.rentalPayment.groupBy({
        by: ['method'],
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);
    return { models, total, all, month, byMethod };
  }
}
