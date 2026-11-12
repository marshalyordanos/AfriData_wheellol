// rental-request.gateway.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { uploadToSpaces } from '../config/cloudinary/upload';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PATTERNS } from '../contracts';
import {
  AddRentalPaymentDto,
  CreateRentalRequestDto,
  RentalPaymentListQueryDto,
  RentalRequestListQueryDto,
  UpdateRentalRequestDto,
} from '../rental-service/rental-request/rental-request.entity';

@ApiTags('Rental Requests')
@ApiBearerAuth('access-token')
@Controller('rental-requests')
export class RentalRequestGatewayController {
  constructor(@Inject('RENTAL_SERVICE') private readonly client: ClientProxy) {}

  private headers(req) {
    return { authorization: req.headers['authorization'] || null };
  }

  // ---------- customer ----------

  /** Signed in or not. If not signed in, contactName + contactPhone are required. */
  @Post()
  create(@Req() req, @Body() dto: CreateRentalRequestDto) {
    return this.client.send(PATTERNS.RENTAL_REQUEST_CREATE, {
      headers: this.headers(req),
      data: dto,
    });
  }

  @Get('my')
  getMine(@Req() req, @Query() query: RentalRequestListQueryDto) {
    return this.client.send(PATTERNS.RENTAL_REQUEST_GET_MY, {
      headers: this.headers(req),
      query,
    });
  }

  /** Guest lookup: GET /rental-requests/track/WL-2026-ABC123?phone=0911... */
  @Get('track/:code')
  track(@Req() req, @Param('code') code: string, @Query('phone') phone: string) {
    return this.client.send(PATTERNS.RENTAL_REQUEST_TRACK, {
      headers: this.headers(req),
      code,
      phone,
    });
  }

  // ---------- admin ----------

  @Get()
  getAll(@Req() req, @Query() query: RentalRequestListQueryDto) {
    return this.client.send(PATTERNS.RENTAL_REQUEST_GET_ALL, {
      headers: this.headers(req),
      query,
    });
  }

  // must stay above @Get(':id')
  @Get('payments/all')
  listPayments(@Req() req, @Query() query: RentalPaymentListQueryDto) {
    return this.client.send(PATTERNS.RENTAL_PAYMENT_LIST, {
      headers: this.headers(req),
      query,
    });
  }

  @Get(':id')
  getById(@Req() req, @Param('id') id: string) {
    return this.client.send(PATTERNS.RENTAL_REQUEST_GET_BY_ID, {
      headers: this.headers(req),
      id,
    });
  }

  @Patch(':id')
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateRentalRequestDto,
  ) {
    return this.client.send(PATTERNS.RENTAL_REQUEST_UPDATE, {
      headers: this.headers(req),
      id,
      data: dto,
    });
  }

  @UseInterceptors(
    FileInterceptor('receipt', { storage: multer.memoryStorage() }),
  )
  @Post(':id/payments')
  async addPayment(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: AddRentalPaymentDto,
    @UploadedFile() receipt?: Express.Multer.File,
  ) {
    let receiptUrl: string | undefined;
    if (receipt) {
      try {
        receiptUrl = await uploadToSpaces(receipt, 'rental-payments/receipts');
      } catch (err) {
        throw new RpcException(err.message || 'Error uploading receipt');
      }
    }
    return this.client.send(PATTERNS.RENTAL_REQUEST_ADD_PAYMENT, {
      headers: this.headers(req),
      id,
      data: dto,
      receiptUrl,
    });
  }

  @Delete(':id/payments/:paymentId')
  deletePayment(
    @Req() req,
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
  ) {
    return this.client.send(PATTERNS.RENTAL_REQUEST_DELETE_PAYMENT, {
      headers: this.headers(req),
      id,
      paymentId,
    });
  }
}
