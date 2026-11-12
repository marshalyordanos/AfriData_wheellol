import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../../contracts';
import { IResponse } from '../../common/types';
import { handleCatch } from '../../common/handleCatch';
import { Public } from '../../common/decorator/public.decorator';
import { PermissionGuard } from '../../common/permission.guard';
import { CheckPermission } from '../../common/decorator/check-permission.decorator';
import { PermissionActions } from '../../contracts/permission-actions.enum';
import { LocationUseCasesImpl } from './location.usecase.impl';
import {
  LocationDto,
  LocationListQuery,
  LocationUpdateDto,
} from './location.entity';

@Controller()
export class LocationMessageController {
  constructor(private readonly usecases: LocationUseCasesImpl) {}

  @Public()
  @MessagePattern(PATTERNS.LOCATION_FIND_ALL)
  async findAll(@Payload() payload: { query: LocationListQuery }) {
    try {
      const res = await this.usecases.list(payload.query || {});
      return {
        ...IResponse.success(
          'Locations fetched successfully',
          res.models,
          res.pagination,
        ),
        counts: res.counts,
      };
    } catch (error) {
      handleCatch(error);
    }
  }

  @Public()
  @MessagePattern(PATTERNS.LOCATION_FIND_BY_ID)
  async findById(@Payload() payload: { id: string }) {
    try {
      const res = await this.usecases.getById(payload.id);
      return IResponse.success('Location fetched successfully', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('LOCATION', PermissionActions.CREATE)
  @MessagePattern(PATTERNS.LOCATION_CREATE)
  async create(@Payload() payload: { data: LocationDto }) {
    try {
      const res = await this.usecases.create(payload.data);
      return IResponse.success('Location created successfully', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('LOCATION', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.LOCATION_UPDATE)
  async update(@Payload() payload: { id: string; data: LocationUpdateDto }) {
    try {
      const res = await this.usecases.update(payload.id, payload.data);
      return IResponse.success('Location updated successfully', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('LOCATION', PermissionActions.DELETE)
  @MessagePattern(PATTERNS.LOCATION_DELETE)
  async delete(@Payload() payload: { id: string }) {
    try {
      const res = await this.usecases.delete(payload.id);
      return IResponse.success('Location deleted successfully', res);
    } catch (error) {
      handleCatch(error);
    }
  }
}
