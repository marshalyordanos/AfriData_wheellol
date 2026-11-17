// rental-request.controller.ts (microservice side)
import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { PATTERNS } from '../../contracts';
import { IResponse } from '../../common/types';
import { handleCatch } from '../../common/handleCatch';
import { Public } from '../../common/decorator/public.decorator';
import { CheckPermission } from '../../common/decorator/check-permission.decorator';
import { PermissionActions } from '../../contracts/permission-actions.enum';
import { PermissionGuard } from '../../common/permission.guard';
import { RentalRequestUseCasesImpl } from './rental-request.usecase.impl';
import {
  AddRentalPaymentDto,
  RentalPaymentListQueryDto,
  CreateRentalRequestDto,
  RentalRequestListQueryDto,
  UpdateRentalRequestDto,
} from './rental-request.entity';

@Controller()
export class RentalRequestMessageController {
  constructor(
    private readonly usecases: RentalRequestUseCasesImpl,
    private readonly jwtService: JwtService,
  ) {}

  /** Public route, but if a valid token is sent we link the request to the user. */
  private async optionalUserId(payload: any): Promise<string | undefined> {
    const token = payload?.headers?.authorization?.replace('Bearer ', '');
    if (!token) return undefined;
    try {
      const decoded = await this.jwtService.verifyAsync(token);
      return decoded?.sub;
    } catch {
      return undefined; // expired/invalid token -> treat as guest
    }
  }

  @Public()
  @MessagePattern(PATTERNS.RENTAL_REQUEST_CREATE)
  async create(@Payload() payload: { data: CreateRentalRequestDto }) {
    try {
      const userId = await this.optionalUserId(payload);
      const res = await this.usecases.create(payload.data, userId);
      return IResponse.success(
        'Request sent. Our team will contact you soon.',
        res,
      );
    } catch (error) {
      handleCatch(error);
    }
  }

  @Public()
  @MessagePattern(PATTERNS.RENTAL_REQUEST_TRACK)
  async track(@Payload() payload: { code: string; phone: string }) {
    try {
      const res = await this.usecases.track(payload.code, payload.phone);
      return IResponse.success('Request fetched successfully', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @Public()
  @MessagePattern(PATTERNS.RENTAL_REQUEST_CUSTOMER_ACCEPT)
  async customerAccept(
    @Payload() payload: { id?: string; code?: string; phone?: string },
  ) {
    try {
      const userId = await this.optionalUserId(payload);
      const res = await this.usecases.customerAccept({
        id: payload.id,
        code: payload.code,
        phone: payload.phone,
        userId,
      });
      return IResponse.success(
        'Request accepted. Your booking is confirmed.',
        res,
      );
    } catch (error) {
      handleCatch(error);
    }
  }

  @MessagePattern(PATTERNS.RENTAL_REQUEST_GET_MY)
  async getMine(
    @Payload() payload: { query: RentalRequestListQueryDto; user: any },
  ) {
    try {
      const res = await this.usecases.listMine(
        payload.user?.sub,
        payload.query || {},
      );
      return IResponse.success(
        'Requests fetched successfully',
        res.models,
        res.pagination,
      );
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.READ)
  @MessagePattern(PATTERNS.RENTAL_REQUEST_GET_ALL)
  async getAll(@Payload() payload: { query: RentalRequestListQueryDto }) {
    try {
      const res = await this.usecases.listAll(payload.query || {});
      return {
        ...IResponse.success(
          'Requests fetched successfully',
          res.models,
          res.pagination,
        ),
        counts: res.counts,
      };
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.READ)
  @MessagePattern(PATTERNS.RENTAL_PAYMENT_LIST)
  async listPayments(@Payload() payload: { query: RentalPaymentListQueryDto }) {
    try {
      const res = await this.usecases.listPayments(payload.query || {});
      return {
        ...IResponse.success(
          'Payments fetched successfully',
          res.models,
          res.pagination,
        ),
        stats: res.stats,
      };
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.READ)
  @MessagePattern(PATTERNS.RENTAL_REQUEST_GET_BY_ID)
  async getById(@Payload() payload: { id: string }) {
    try {
      const res = await this.usecases.getById(payload.id);
      return IResponse.success('Request fetched successfully', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.RENTAL_REQUEST_UPDATE)
  async update(
    @Payload() payload: { id: string; data: UpdateRentalRequestDto; user: any },
  ) {
    try {
      const res = await this.usecases.update(
        payload.id,
        payload.data,
        payload.user?.sub,
      );
      return IResponse.success('Request updated successfully', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.RENTAL_REQUEST_ADD_PAYMENT)
  async addPayment(
    @Payload()
    payload: {
      id: string;
      data: AddRentalPaymentDto;
      receiptUrl?: string;
      user: any;
    },
  ) {
    try {
      const res = await this.usecases.addPayment(
        payload.id,
        payload.data,
        payload.user?.sub,
        payload.receiptUrl,
      );
      return IResponse.success('Payment recorded', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.RENTAL_REQUEST_DELETE_PAYMENT)
  async deletePayment(
    @Payload() payload: { id: string; paymentId: string; user: any },
  ) {
    try {
      const res = await this.usecases.deletePayment(
        payload.id,
        payload.paymentId,
        payload.user?.sub,
      );
      return IResponse.success('Payment removed', res);
    } catch (error) {
      handleCatch(error);
    }
  }
}
