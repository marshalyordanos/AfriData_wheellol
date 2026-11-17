// notification.gateway.controller.ts — the signed-in user's in-app notifications
// (admin panel and mobile app). Real-time delivery is via the notify-hub socket.
import { Controller, Get, Inject, Param, Patch, Query, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PATTERNS } from '../contracts';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationGatewayController {
  constructor(@Inject('RENTAL_SERVICE') private readonly client: ClientProxy) {}

  private headers(req) {
    return { authorization: req.headers['authorization'] || null };
  }

  /** GET /notifications?page=1&pageSize=20&unread=true */
  @Get()
  list(@Req() req, @Query() query: any) {
    return this.client.send(PATTERNS.MY_NOTIFICATIONS_LIST, {
      headers: this.headers(req),
      query: {
        page: query?.page,
        pageSize: query?.pageSize,
        unread: query?.unread,
      },
    });
  }

  @Get('unread-count')
  unreadCount(@Req() req) {
    return this.client.send(PATTERNS.MY_NOTIFICATIONS_UNREAD_COUNT, {
      headers: this.headers(req),
    });
  }

  @Patch('read-all')
  readAll(@Req() req) {
    return this.client.send(PATTERNS.MY_NOTIFICATIONS_READ_ALL, {
      headers: this.headers(req),
    });
  }

  @Patch(':id/read')
  read(@Req() req, @Param('id') id: string) {
    return this.client.send(PATTERNS.MY_NOTIFICATIONS_READ, {
      headers: this.headers(req),
      id,
    });
  }
}
