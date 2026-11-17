// supplier.controller.ts (microservice side)
import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../../contracts';
import { IResponse } from '../../common/types';
import { handleCatch } from '../../common/handleCatch';
import { CheckPermission } from '../../common/decorator/check-permission.decorator';
import { PermissionActions } from '../../contracts/permission-actions.enum';
import { PermissionGuard } from '../../common/permission.guard';
import { SupplierUseCases } from './supplier.usecase';

@Controller()
export class SupplierMessageController {
  constructor(private readonly usecases: SupplierUseCases) {}

  private async run(message: string, fn: () => Promise<any>) {
    try {
      return IResponse.success(message, await fn());
    } catch (error) {
      handleCatch(error);
    }
  }

  // ---------------- supplier (HOST role, checked in the use case) ----------------

  @MessagePattern(PATTERNS.SUPPLIER_ME)
  me(@Payload() p: { user: any }) {
    return this.run('Supplier fetched', () => this.usecases.me(p.user?.sub));
  }

  @MessagePattern(PATTERNS.SUPPLIER_CARS_LIST)
  listCars(@Payload() p: { user: any }) {
    return this.run('Cars fetched', () => this.usecases.listCars(p.user?.sub));
  }

  @MessagePattern(PATTERNS.SUPPLIER_CAR_GET)
  getCar(@Payload() p: { user: any; id: string }) {
    return this.run('Car fetched', () => this.usecases.getCar(p.user?.sub, p.id));
  }

  @MessagePattern(PATTERNS.SUPPLIER_CAR_CREATE)
  createCar(@Payload() p: { user: any; data: any; photos: string[]; documents?: any[] }) {
    return this.run('Car sent for review', () =>
      this.usecases.createCar(p.user?.sub, p.data || {}, p.photos || [], p.documents || []),
    );
  }

  @MessagePattern(PATTERNS.SUPPLIER_CAR_UPDATE)
  updateCar(@Payload() p: { user: any; id: string; data: any; photos: string[]; documents?: any[] }) {
    return this.run('Car updated and sent for review', () =>
      this.usecases.updateCar(p.user?.sub, p.id, p.data || {}, p.photos || [], p.documents || []),
    );
  }

  @MessagePattern(PATTERNS.SUPPLIER_CAR_AVAILABILITY)
  availability(@Payload() p: { user: any; id: string; isActive: boolean }) {
    return this.run(p.isActive ? 'Car is visible again' : 'Car hidden', () =>
      this.usecases.setAvailability(p.user?.sub, p.id, p.isActive),
    );
  }

  @MessagePattern(PATTERNS.SUPPLIER_CAR_DELETE)
  deleteCar(@Payload() p: { user: any; id: string }) {
    return this.run('Car deleted', () => this.usecases.deleteCar(p.user?.sub, p.id));
  }

  @MessagePattern(PATTERNS.SUPPLIER_REPORT)
  report(@Payload() p: { user: any; query: any }) {
    return this.run('Report fetched', () =>
      this.usecases.report(p.user?.sub, p.query || {}),
    );
  }

  // ---------------- admin ----------------

  @UseGuards(PermissionGuard)
  @CheckPermission('CAR', PermissionActions.READ)
  @MessagePattern(PATTERNS.SUPPLIER_ADMIN_SETTINGS_GET)
  getSettings() {
    return this.run('Settings fetched', () => this.usecases.getSettings());
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('CAR', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.SUPPLIER_ADMIN_SETTINGS_SET)
  setSettings(@Payload() p: { data: any }) {
    return this.run('Commission saved', () => this.usecases.setSettings(p.data));
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('CAR', PermissionActions.READ)
  @MessagePattern(PATTERNS.SUPPLIER_ADMIN_LIST)
  async list(@Payload() p: { query: any }) {
    try {
      const res = await this.usecases.adminListSuppliers(p.query || {});
      return {
        ...IResponse.success('Suppliers fetched', res.models, res.pagination),
        globalPercent: res.globalPercent,
      };
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('CAR', PermissionActions.READ)
  @MessagePattern(PATTERNS.SUPPLIER_ADMIN_GET)
  get(@Payload() p: { id: string }) {
    return this.run('Supplier fetched', () => this.usecases.adminGetSupplier(p.id));
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('CAR', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.SUPPLIER_ADMIN_SET_COMMISSION)
  setCommission(@Payload() p: { id: string; data: any }) {
    return this.run('Commission saved', () =>
      this.usecases.adminSetCommission(p.id, p.data?.commissionRate ?? null),
    );
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('CAR', PermissionActions.READ)
  @MessagePattern(PATTERNS.SUPPLIER_ADMIN_CARS)
  async cars(@Payload() p: { query: any }) {
    try {
      const res = await this.usecases.adminListCars(p.query || {});
      return {
        ...IResponse.success('Cars fetched', res.models, res.pagination),
        counts: res.counts,
      };
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('CAR', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.SUPPLIER_ADMIN_CAR_REVIEW)
  review(@Payload() p: { id: string; data: any; user: any }) {
    return this.run(
      p.data?.decision === 'APPROVED' ? 'Car approved' : 'Car rejected',
      () => this.usecases.adminReviewCar(p.id, p.data, p.user?.sub),
    );
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('CAR', PermissionActions.READ)
  @MessagePattern(PATTERNS.SUPPLIER_ADMIN_CAR_GET)
  adminGetCar(@Payload() p: { id: string }) {
    return this.run('Car fetched', () => this.usecases.adminGetCar(p.id));
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('CAR', PermissionActions.CREATE)
  @MessagePattern(PATTERNS.SUPPLIER_ADMIN_CAR_CREATE)
  adminCreateCar(@Payload() p: { hostId: string; data: any; photos: string[]; documents?: any[]; user: any }) {
    return this.run('Car added', () =>
      this.usecases.adminCreateCar(p.hostId, p.data || {}, p.photos || [], p.user?.sub, p.documents || []),
    );
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('CAR', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.SUPPLIER_ADMIN_CAR_UPDATE)
  adminUpdateCar(@Payload() p: { id: string; data: any; photos: string[]; documents?: any[]; user: any }) {
    return this.run('Car saved', () =>
      this.usecases.adminUpdateCar(p.id, p.data || {}, p.photos || [], p.user?.sub, p.documents || []),
    );
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.RENTAL_REQUEST_SET_CAR_PRICE)
  setCarPrice(@Payload() p: { id: string; carId: string; data: any; user: any }) {
    return this.run('Car price saved', () =>
      this.usecases.adminSetRequestCarPrice(p.id, p.carId, p.data || {}, p.user?.sub),
    );
  }
}
