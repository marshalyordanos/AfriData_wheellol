import { Injectable } from '@nestjs/common';
import { Location, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LocationRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: Prisma.LocationCreateInput): Promise<Location> {
    return this.prisma.location.create({ data });
  }

  findById(id: string): Promise<Location | null> {
    return this.prisma.location.findUnique({ where: { id } });
  }

  async findAll(
    skip: number,
    take: number,
    where: Prisma.LocationWhereInput,
  ): Promise<[Location[], number]> {
    return Promise.all([
      this.prisma.location.findMany({
        skip,
        take,
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.location.count({ where }),
    ]);
  }

  /** Overall counts for the admin summary strip. */
  async counts() {
    const [total, active, pickup, regions] = await Promise.all([
      this.prisma.location.count(),
      this.prisma.location.count({ where: { isActive: true } }),
      this.prisma.location.count({ where: { isActive: true, isPickup: true } }),
      this.prisma.location.count({ where: { type: 'REGION' } }),
    ]);
    return { total, active, pickup, regions };
  }

  /** How many rental requests were picked up in each of these places. */
  async requestCounts(names: string[]): Promise<Record<string, number>> {
    if (!names.length) return {};
    const rows = await this.prisma.rentalRequest.groupBy({
      by: ['pickupCity'],
      where: { pickupCity: { in: names } },
      _count: { _all: true },
    });
    return Object.fromEntries(rows.map((r) => [r.pickupCity, r._count._all]));
  }

  update(id: string, data: Prisma.LocationUpdateInput): Promise<Location> {
    return this.prisma.location.update({ where: { id }, data });
  }

  delete(id: string): Promise<Location> {
    return this.prisma.location.delete({ where: { id } });
  }
}
