import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LocationRepository } from './location.repository';
import {
  LocationDto,
  LocationListQuery,
  LocationUpdateDto,
} from './location.entity';

const clean = (s?: string | null) =>
  typeof s === 'string' ? s.trim().replace(/\s+/g, ' ') || null : s;

@Injectable()
export class LocationUseCasesImpl {
  constructor(private readonly repo: LocationRepository) {}

  private normalize<T extends Partial<LocationDto>>(data: T): T {
    const out: any = { ...data };
    if ('name' in out) out.name = clean(out.name);
    if ('nameAm' in out) out.nameAm = clean(out.nameAm);
    if ('region' in out) out.region = clean(out.region);
    if (out.type && out.type !== 'CITY') out.region = null;
    return out;
  }

  create(data: LocationDto) {
    return this.repo.create(this.normalize(data) as Prisma.LocationCreateInput);
  }

  getById(id: string) {
    return this.repo.findById(id);
  }

  async list(query: LocationListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    // the app loads the whole list at once; cap it so nobody pulls thousands
    const pageSize = Math.min(Math.max(1, Number(query.pageSize) || 10), 200);
    const where: Prisma.LocationWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { nameAm: { contains: query.search, mode: 'insensitive' } },
        { region: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.type) where.type = query.type;
    if (query.active === 'true') where.isActive = true;
    if (query.active === 'false') where.isActive = false;
    if (query.pickup === 'true') where.isPickup = true;

    const [rows, total] = await this.repo.findAll(
      (page - 1) * pageSize,
      pageSize,
      where,
    );
    const [requests, counts] = await Promise.all([
      this.repo.requestCounts(rows.map((r) => r.name)),
      this.repo.counts(),
    ]);

    return {
      models: rows.map((r) => ({ ...r, requestCount: requests[r.name] || 0 })),
      counts,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  update(id: string, data: LocationUpdateDto) {
    return this.repo.update(id, this.normalize(data));
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
