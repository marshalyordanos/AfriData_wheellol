// notifier.service.ts
// Creates in-app notifications (saved in the DB) and pushes them in real time:
// Redis "notifications" channel → notify-hub socket server → room user_<id>.
import { Inject, Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { Redis } from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../../notify-hub/redis/redis.constants';

export type NotifyInput = {
  type: NotificationType;
  title: string;
  message: string;
  link?: string | null;
  data?: Record<string, any> | null;
};

const SELECT = {
  id: true,
  type: true,
  title: true,
  message: true,
  link: true,
  data: true,
  audience: true,
  isRead: true,
  createdAt: true,
} as const;

@Injectable()
export class NotifierService {
  private readonly log = new Logger('Notifier');

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  private async push(userId: string, notification: any) {
    try {
      await this.redis.publish(
        'notifications',
        JSON.stringify({ userId, notification }),
      );
    } catch (err) {
      this.log.warn(`Realtime push failed for ${userId}: ${err?.message}`);
    }
  }

  /** One customer (mobile app). Never throws — notifications must not break the main action. */
  async toCustomer(userId: string | null | undefined, n: NotifyInput) {
    if (!userId) return;
    try {
      const row = await this.prisma.notification.create({
        data: {
          userId,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link ?? null,
          data: (n.data as any) ?? undefined,
          audience: 'CUSTOMER',
        },
        select: SELECT,
      });
      await this.push(userId, row);
    } catch (err) {
      this.log.warn(`toCustomer failed: ${err?.message}`);
    }
  }

  /** Every active staff member / super admin (admin panel), optionally except the one who acted. */
  async toAdmins(n: NotifyInput, exceptUserId?: string | null) {
    try {
      const admins = await this.prisma.user.findMany({
        where: {
          isActive: true,
          OR: [{ isStaff: true }, { isSuperAdmin: true }],
          ...(exceptUserId ? { id: { not: exceptUserId } } : {}),
        },
        select: { id: true },
      });
      await Promise.all(
        admins.map(async ({ id }) => {
          const row = await this.prisma.notification.create({
            data: {
              userId: id,
              type: n.type,
              title: n.title,
              message: n.message,
              link: n.link ?? null,
              data: (n.data as any) ?? undefined,
              audience: 'ADMIN',
            },
            select: SELECT,
          });
          await this.push(id, row);
        }),
      );
    } catch (err) {
      this.log.warn(`toAdmins failed: ${err?.message}`);
    }
  }

  // ---------------------------------------------------------------- reading

  async listMine(
    userId: string,
    { page = 1, pageSize = 20, unread = false } = {},
  ) {
    const where = { userId, ...(unread ? { isRead: false } : {}) };
    const [models, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: SELECT,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return {
      models,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
      unreadCount,
    };
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    return { unreadCount: await this.unreadCount(userId) };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { unreadCount: 0 };
  }
}
