import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Core system roles. They must exist for sign-up (GUEST / HOST) and for the
 * admin panel (SUPER_ADMIN / ADMIN). Created on startup if missing; existing
 * rows are never modified.
 */
export const CORE_ROLES = [
  { name: 'SUPER_ADMIN', description: 'Full system access' },
  { name: 'ADMIN', description: 'Admin panel staff' },
  { name: 'GUEST', description: 'Customer who rents cars' },
  { name: 'HOST', description: 'Supplier who lists cars' },
];

@Injectable()
export class RoleSeeder implements OnApplicationBootstrap {
  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    try {
      const { count } = await this.prisma.role.createMany({
        data: CORE_ROLES,
        skipDuplicates: true,
      });
      console.log(
        count > 0
          ? `✅ Seeded ${count} core role(s)`
          : '✅ Core roles already present',
      );
    } catch (err) {
      console.error('❌ Failed to seed core roles:', err?.message ?? err);
    }
  }
}
