// notification.controller.ts (microservice side) — the signed-in user's own notifications
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../../contracts';
import { IResponse } from '../../common/types';
import { handleCatch } from '../../common/handleCatch';
import { NotifierService } from './notifier.service';

const userOf = (payload: any): string => {
  const id = payload?.user?.sub;
  if (!id) throw new Error('Please sign in');
  return id;
};

@Controller()
export class NotificationMessageController {
  constructor(private readonly notifier: NotifierService) {}

  @MessagePattern(PATTERNS.MY_NOTIFICATIONS_LIST)
  async list(@Payload() payload: { query?: any; user: any }) {
    try {
      const q = payload.query || {};
      const res = await this.notifier.listMine(userOf(payload), {
        page: Math.max(1, Number(q.page) || 1),
        pageSize: Math.min(100, Math.max(1, Number(q.pageSize) || 20)),
        unread: q.unread === 'true' || q.unread === true,
      });
      return {
        ...IResponse.success('Notifications fetched', res.models, res.pagination),
        unreadCount: res.unreadCount,
      };
    } catch (error) {
      handleCatch(error);
    }
  }

  @MessagePattern(PATTERNS.MY_NOTIFICATIONS_UNREAD_COUNT)
  async unread(@Payload() payload: { user: any }) {
    try {
      const count = await this.notifier.unreadCount(userOf(payload));
      return IResponse.success('Unread count', { count });
    } catch (error) {
      handleCatch(error);
    }
  }

  @MessagePattern(PATTERNS.MY_NOTIFICATIONS_READ)
  async read(@Payload() payload: { id: string; user: any }) {
    try {
      const res = await this.notifier.markRead(userOf(payload), payload.id);
      return IResponse.success('Marked as read', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @MessagePattern(PATTERNS.MY_NOTIFICATIONS_READ_ALL)
  async readAll(@Payload() payload: { user: any }) {
    try {
      const res = await this.notifier.markAllRead(userOf(payload));
      return IResponse.success('All marked as read', res);
    } catch (error) {
      handleCatch(error);
    }
  }
}
