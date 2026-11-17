// commission.service.ts
// Wheellol commission on supplier cars.
//
// NOW (2026-11-14): the admin agrees the customer price AND the supplier
// price for each car; Wheellol keeps the difference (see setRequestCarPrice).
// The % settings below are no longer used for new prices.
//
// OLD:
//   The admin agrees a price with the customer (e.g. 200,000 ETB).
//   Wheellol keeps commission % of that price (10% → 20,000),
//   the supplier gets the rest (180,000).
//
// The % comes from the supplier's own override (HostProfile.commissionRate)
// or, if not set, the global default (SystemSetting SUPPLIER_COMMISSION_PERCENT).
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaService } from '../../prisma/prisma.service';

export const COMMISSION_KEY = 'SUPPLIER_COMMISSION_PERCENT';
export const DEFAULT_COMMISSION = 10;

const round2 = (n: number) => Math.round(n * 100) / 100;

const fail = (message: string, statusCode = 400): never => {
  throw new RpcException({ statusCode, message });
};

export type PriceSplit = {
  price: number | null;
  commissionRate: number | null;
  commissionAmount: number | null;
  supplierAmount: number | null;
};

@Injectable()
export class CommissionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Global default commission % */
  async getGlobalPercent(): Promise<number> {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key: COMMISSION_KEY },
    });
    const n = row ? Number(row.value) : NaN;
    return Number.isFinite(n) ? n : DEFAULT_COMMISSION;
  }

  async setGlobalPercent(percent: number) {
    if (!Number.isFinite(percent) || percent < 0 || percent >= 100) {
      fail('Commission must be between 0 and 99.99 %');
    }
    await this.prisma.systemSetting.upsert({
      where: { key: COMMISSION_KEY },
      create: { key: COMMISSION_KEY, value: String(percent) },
      update: { value: String(percent) },
    });
    return percent;
  }

  /** Is this user a supplier (HOST role)? */
  static isSupplier(user?: { role?: { name?: string | null } | null } | null) {
    return user?.role?.name === 'HOST';
  }

  /** Effective % for a supplier: their override, else the global default. */
  async rateForSupplier(hostId: string): Promise<number> {
    const profile = await this.prisma.hostProfile.findUnique({
      where: { userId: hostId },
      select: { commissionRate: true },
    });
    if (profile?.commissionRate !== null && profile?.commissionRate !== undefined) {
      return profile.commissionRate;
    }
    return this.getGlobalPercent();
  }

  /**
   * Work out the split for one car.
   *  - give `price` (what the customer pays)  → supplier gets price − commission
   *  - or give `supplierAmount` (what the supplier asked for) → price is grossed
   *    up so that after commission the supplier still gets that amount
   * Wheellol's own cars (owner is not a supplier) have no split.
   */
  split(
    input: { price?: number | null; supplierAmount?: number | null },
    rate: number | null,
  ): PriceSplit {
    const empty = {
      price: null,
      commissionRate: null,
      commissionAmount: null,
      supplierAmount: null,
    };

    // Wheellol's own car: only the price matters
    if (rate === null) {
      const price = input.price ?? null;
      return { ...empty, price: price && price > 0 ? round2(price) : null };
    }

    if (input.supplierAmount !== undefined && input.supplierAmount !== null) {
      if (input.supplierAmount <= 0) return empty;
      const price = round2(input.supplierAmount / (1 - rate / 100));
      return {
        price,
        commissionRate: rate,
        commissionAmount: round2(price - input.supplierAmount),
        supplierAmount: round2(input.supplierAmount),
      };
    }

    const price = input.price ?? null;
    if (!price || price <= 0) return empty;
    const commissionAmount = round2((price * rate) / 100);
    return {
      price: round2(price),
      commissionRate: rate,
      commissionAmount,
      supplierAmount: round2(price - commissionAmount),
    };
  }

  /**
   * Set the price of one car in a request and store the split.
   *
   * Since 2026-11-14 there is no commission %: the admin agrees two prices,
   * what the customer pays and what the supplier gets. Wheellol keeps the
   * difference. A field that is not sent keeps its stored value.
   */
  async setRequestCarPrice(
    requestId: string,
    carId: string,
    input: { price?: number | null; supplierAmount?: number | null },
  ) {
    const row = await this.prisma.rentalRequestCar.findUnique({
      where: { requestId_carId: { requestId, carId } },
      include: {
        car: {
          select: {
            hostId: true,
            host: { select: { role: { select: { name: true } } } },
          },
        },
      },
    });
    if (!row) fail('This car is not part of the request', 404);

    const supplierCar = CommissionService.isSupplier(row!.car.host);
    const pick = (v: number | null | undefined, stored: number | null) =>
      v === undefined ? stored : v && v > 0 ? round2(v) : null;
    const price = pick(input.price, row!.price);
    const supplierAmount = supplierCar
      ? pick(input.supplierAmount, row!.supplierAmount)
      : null;

    if (price !== null && supplierAmount !== null && supplierAmount > price) {
      fail('The supplier price cannot be more than the customer price');
    }

    const commissionAmount =
      price !== null && supplierAmount !== null
        ? round2(price - supplierAmount)
        : null;
    const split: PriceSplit = {
      price,
      supplierAmount,
      commissionAmount,
      // not a setting any more: just the share Wheellol keeps, for reports
      commissionRate:
        commissionAmount !== null && price ? round2((commissionAmount / price) * 100) : null,
    };

    return this.prisma.rentalRequestCar.update({
      where: { id: row!.id },
      data: split,
    });
  }

  /* Old % model (kept for reference, no longer used):
   *   const rate = supplierCar ? await this.rateForSupplier(row.car.hostId) : null;
   *   const split = this.split(input, rate);
   */

  /**
   * A request with exactly one car: the agreed total IS that car's price,
   * so keep the car's split in step whenever the admin changes the total.
   */
  async syncSingleCarRequest(requestId: string, totalPrice: number | null) {
    const cars = await this.prisma.rentalRequestCar.findMany({
      where: { requestId },
      select: { carId: true },
    });
    if (cars.length !== 1) return;
    await this.setRequestCarPrice(requestId, cars[0].carId, {
      price: totalPrice,
    });
  }
}
