// supplier.gateway.controller.ts
// Supplier app (mobile) + admin endpoints for supplier cars and commission.
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
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PATTERNS } from '../contracts';
import { uploadToSpaces } from '../config/cloudinary/upload';

// photos[] (car photos) + documentFiles[] (Libre, insurance… images or PDF)
const photosInterceptor = FileFieldsInterceptor(
  [
    { name: 'photos', maxCount: 20 }, // was 10 — 15 guide photos + extras
    { name: 'documentFiles', maxCount: 7 }, // was 6 — added licence back
  ],
  { storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } },
);
type CarUploads = { photos?: Express.Multer.File[]; documentFiles?: Express.Multer.File[] };

@ApiTags('Suppliers')
@ApiBearerAuth('access-token')
@Controller('supplier')
export class SupplierGatewayController {
  constructor(@Inject('RENTAL_SERVICE') private readonly client: ClientProxy) {}

  private headers(req) {
    return { authorization: req.headers['authorization'] || null };
  }

  private async upload(files?: Express.Multer.File[]) {
    if (!files?.length) return [];
    try {
      return await Promise.all(files.map((f) => uploadToSpaces(f, 'cars')));
    } catch (err) {
      throw new RpcException(err?.message || 'Could not upload the photos');
    }
  }

  /** Upload car documents; keeps the file name so the admin sees what it is. */
  private async uploadDocuments(files?: Express.Multer.File[]) {
    if (!files?.length) return [];
    try {
      return await Promise.all(
        files.map(async (f) => ({
          url: await uploadToSpaces(f, 'cars/documents'),
          name: f.originalname || null,
        })),
      );
    } catch (err) {
      throw new RpcException(err?.message || 'Could not upload the documents');
    }
  }

  // ---------------- supplier ----------------

  @Get('me')
  me(@Req() req) {
    return this.client.send(PATTERNS.SUPPLIER_ME, { headers: this.headers(req) });
  }

  @Get('cars')
  listCars(@Req() req) {
    return this.client.send(PATTERNS.SUPPLIER_CARS_LIST, { headers: this.headers(req) });
  }

  @Get('cars/:id')
  getCar(@Req() req, @Param('id') id: string) {
    return this.client.send(PATTERNS.SUPPLIER_CAR_GET, { headers: this.headers(req), id });
  }

  /** multipart: car fields + photos[] */
  @Post('cars')
  @UseInterceptors(photosInterceptor)
  async createCar(
    @Req() req,
    @UploadedFiles() files: CarUploads,
    @Body() body: any,
  ) {
    const photos = await this.upload(files?.photos);
    const documents = await this.uploadDocuments(files?.documentFiles);
    return this.client.send(PATTERNS.SUPPLIER_CAR_CREATE, {
      headers: this.headers(req),
      data: body,
      photos,
      documents,
    });
  }

  /** multipart: changed fields, keepPhotos (JSON list of URLs) + new photos[] */
  @Patch('cars/:id')
  @UseInterceptors(photosInterceptor)
  async updateCar(
    @Req() req,
    @Param('id') id: string,
    @UploadedFiles() files: CarUploads,
    @Body() body: any,
  ) {
    const photos = await this.upload(files?.photos);
    const documents = await this.uploadDocuments(files?.documentFiles);
    return this.client.send(PATTERNS.SUPPLIER_CAR_UPDATE, {
      headers: this.headers(req),
      id,
      data: body,
      photos,
      documents,
    });
  }

  @Patch('cars/:id/availability')
  availability(@Req() req, @Param('id') id: string, @Body() body: any) {
    return this.client.send(PATTERNS.SUPPLIER_CAR_AVAILABILITY, {
      headers: this.headers(req),
      id,
      isActive: body?.isActive === true || body?.isActive === 'true',
    });
  }

  @Delete('cars/:id')
  deleteCar(@Req() req, @Param('id') id: string) {
    return this.client.send(PATTERNS.SUPPLIER_CAR_DELETE, { headers: this.headers(req), id });
  }

  /** ?from=2026-01-01&to=2026-12-31&carId=&status=COMPLETED */
  @Get('report')
  report(@Req() req, @Query() query: any) {
    return this.client.send(PATTERNS.SUPPLIER_REPORT, { headers: this.headers(req), query });
  }

  // ---------------- admin ----------------

  @Get('admin/settings')
  getSettings(@Req() req) {
    return this.client.send(PATTERNS.SUPPLIER_ADMIN_SETTINGS_GET, { headers: this.headers(req) });
  }

  /** { commissionPercent: 10 } */
  @Patch('admin/settings')
  setSettings(@Req() req, @Body() body: any) {
    return this.client.send(PATTERNS.SUPPLIER_ADMIN_SETTINGS_SET, {
      headers: this.headers(req),
      data: body,
    });
  }

  @Get('admin/suppliers')
  list(@Req() req, @Query() query: any) {
    return this.client.send(PATTERNS.SUPPLIER_ADMIN_LIST, { headers: this.headers(req), query });
  }

  @Get('admin/suppliers/:id')
  get(@Req() req, @Param('id') id: string) {
    return this.client.send(PATTERNS.SUPPLIER_ADMIN_GET, { headers: this.headers(req), id });
  }

  /** { commissionRate: 8 } or { commissionRate: null } to use the global default */
  @Patch('admin/suppliers/:id/commission')
  setCommission(@Req() req, @Param('id') id: string, @Body() body: any) {
    return this.client.send(PATTERNS.SUPPLIER_ADMIN_SET_COMMISSION, {
      headers: this.headers(req),
      id,
      data: body,
    });
  }

  /** Admin adds a car for this supplier. multipart: car fields, photoSlots / extraPhotos / documents + files */
  @Post('admin/suppliers/:id/cars')
  @UseInterceptors(photosInterceptor)
  async adminCreateCar(
    @Req() req,
    @Param('id') hostId: string,
    @UploadedFiles() files: CarUploads,
    @Body() body: any,
  ) {
    const photos = await this.upload(files?.photos);
    const documents = await this.uploadDocuments(files?.documentFiles);
    return this.client.send(PATTERNS.SUPPLIER_ADMIN_CAR_CREATE, {
      headers: this.headers(req),
      hostId,
      data: body,
      photos,
      documents,
    });
  }

  /** ?status=PENDING|APPROVED|REJECTED&search=&hostId=&page=&pageSize= */
  @Get('admin/cars')
  cars(@Req() req, @Query() query: any) {
    return this.client.send(PATTERNS.SUPPLIER_ADMIN_CARS, { headers: this.headers(req), query });
  }

  /** Car + supplier + rentals + history */
  @Get('admin/cars/:id')
  adminGetCar(@Req() req, @Param('id') id: string) {
    return this.client.send(PATTERNS.SUPPLIER_ADMIN_CAR_GET, { headers: this.headers(req), id });
  }

  /** multipart: any car field, isActive, photoOrder (JSON: kept URLs + "new:<i>") + new photos[] */
  @Patch('admin/cars/:id')
  @UseInterceptors(photosInterceptor)
  async adminUpdateCar(
    @Req() req,
    @Param('id') id: string,
    @UploadedFiles() files: CarUploads,
    @Body() body: any,
  ) {
    const photos = await this.upload(files?.photos);
    const documents = await this.uploadDocuments(files?.documentFiles);
    return this.client.send(PATTERNS.SUPPLIER_ADMIN_CAR_UPDATE, {
      headers: this.headers(req),
      id,
      data: body,
      photos,
      documents,
    });
  }

  /** { decision: 'APPROVED' | 'REJECTED', reason?: string } */
  @Patch('admin/cars/:id/review')
  review(@Req() req, @Param('id') id: string, @Body() body: any) {
    return this.client.send(PATTERNS.SUPPLIER_ADMIN_CAR_REVIEW, {
      headers: this.headers(req),
      id,
      data: body,
    });
  }
}
