// contract.controller.ts (microservice side)
import { Controller, UseGuards } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PATTERNS } from '../../contracts';
import { IResponse } from '../../common/types';
import { handleCatch } from '../../common/handleCatch';
import { Public } from '../../common/decorator/public.decorator';
import { CheckPermission } from '../../common/decorator/check-permission.decorator';
import { PermissionActions } from '../../contracts/permission-actions.enum';
import { PermissionGuard } from '../../common/permission.guard';
import { ContractUseCasesImpl } from './contract.usecase.impl';
import {
  CreateContractTemplateDto,
  CreateRentalContractDto,
  DeclineContractDto,
  SaveRentalContractDto,
  SaveSignatureDto,
  SignContractDto,
  UpdateContractTemplateDto,
} from './contract.entity';

// Contracts belong to booking requests, so they use the BOOKING permissions.
@Controller()
export class ContractMessageController {
  constructor(private readonly usecases: ContractUseCasesImpl) {}

  // ---------------- templates ----------------

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.READ)
  @MessagePattern(PATTERNS.CONTRACT_TEMPLATE_LIST)
  async listTemplates(
    @Payload() payload: { all?: string | boolean; user: any },
  ) {
    try {
      const all = payload.all === true || payload.all === 'true';
      const res = await this.usecases.listTemplates(all, payload.user?.sub);
      return IResponse.success('Contracts fetched successfully', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.READ)
  @MessagePattern(PATTERNS.CONTRACT_TEMPLATE_GET)
  async getTemplate(@Payload() payload: { id: string }) {
    try {
      return IResponse.success(
        'Contract fetched successfully',
        await this.usecases.getTemplate(payload.id),
      );
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.CONTRACT_TEMPLATE_CREATE)
  async createTemplate(
    @Payload() payload: { data: CreateContractTemplateDto; user: any },
  ) {
    try {
      const res = await this.usecases.createTemplate(
        payload.data,
        payload.user?.sub,
      );
      return IResponse.success('Contract created', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.CONTRACT_TEMPLATE_UPDATE)
  async updateTemplate(
    @Payload() payload: { id: string; data: UpdateContractTemplateDto },
  ) {
    try {
      const res = await this.usecases.updateTemplate(payload.id, payload.data);
      return IResponse.success('Contract saved', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.CONTRACT_TEMPLATE_DUPLICATE)
  async duplicateTemplate(@Payload() payload: { id: string; user: any }) {
    try {
      const res = await this.usecases.duplicateTemplate(
        payload.id,
        payload.user?.sub,
      );
      return IResponse.success('Contract duplicated', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.CONTRACT_TEMPLATE_SET_DEFAULT)
  async setDefault(@Payload() payload: { id: string }) {
    try {
      const res = await this.usecases.setDefaultTemplate(payload.id);
      return IResponse.success('Default contract changed', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.CONTRACT_TEMPLATE_DELETE)
  async deleteTemplate(@Payload() payload: { id: string }) {
    try {
      const res = await this.usecases.deleteTemplate(payload.id);
      return IResponse.success(
        res.archived
          ? 'Contract archived (it is used by bookings)'
          : 'Contract deleted',
        res,
      );
    } catch (error) {
      handleCatch(error);
    }
  }

  // ---------------- contracts of a booking request ----------------

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.READ)
  @MessagePattern(PATTERNS.RENTAL_CONTRACT_LIST)
  async listContracts(@Payload() payload: { requestId: string }) {
    try {
      return IResponse.success(
        'Contracts fetched successfully',
        await this.usecases.listContracts(payload.requestId),
      );
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.READ)
  @MessagePattern(PATTERNS.RENTAL_CONTRACT_GET)
  async getContract(@Payload() payload: { id: string }) {
    try {
      return IResponse.success(
        'Contract fetched successfully',
        await this.usecases.getContract(payload.id),
      );
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.RENTAL_CONTRACT_CREATE)
  async createContract(
    @Payload()
    payload: {
      requestId: string;
      data: CreateRentalContractDto;
      user: any;
    },
  ) {
    try {
      const res = await this.usecases.createContract(
        payload.requestId,
        payload.data || {},
        payload.user?.sub,
      );
      return IResponse.success('Contract prepared', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.RENTAL_CONTRACT_SAVE)
  async saveContract(
    @Payload() payload: { id: string; data: SaveRentalContractDto; user: any },
  ) {
    try {
      const res = await this.usecases.saveContract(
        payload.id,
        payload.data,
        payload.user?.sub,
      );
      return IResponse.success(
        payload.data?.action === 'send'
          ? 'Contract sent to the customer'
          : 'Contract saved',
        res,
      );
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.RENTAL_CONTRACT_VOID)
  async voidContract(@Payload() payload: { id: string; user: any }) {
    try {
      return IResponse.success(
        'Contract voided',
        await this.usecases.voidContract(payload.id, payload.user?.sub),
      );
    } catch (error) {
      handleCatch(error);
    }
  }

  @UseGuards(PermissionGuard)
  @CheckPermission('BOOKING', PermissionActions.UPDATE)
  @MessagePattern(PATTERNS.RENTAL_CONTRACT_DELETE)
  async deleteContract(@Payload() payload: { id: string }) {
    try {
      return IResponse.success(
        'Draft deleted',
        await this.usecases.deleteContract(payload.id),
      );
    } catch (error) {
      handleCatch(error);
    }
  }

  // ---------------- customer (public link) ----------------

  @Public()
  @MessagePattern(PATTERNS.RENTAL_CONTRACT_PUBLIC_VIEW)
  async view(@Payload() payload: { token: string }) {
    try {
      return IResponse.success(
        'Contract fetched successfully',
        await this.usecases.viewByToken(payload.token),
      );
    } catch (error) {
      handleCatch(error);
    }
  }

  @Public()
  @MessagePattern(PATTERNS.RENTAL_CONTRACT_PUBLIC_SIGN)
  async sign(
    @Payload()
    payload: {
      token: string;
      data: SignContractDto;
      ip?: string;
      agent?: string;
    },
  ) {
    try {
      const res = await this.usecases.signByToken(payload.token, payload.data, {
        ip: payload.ip,
        agent: payload.agent,
      });
      return IResponse.success('Contract signed. Thank you!', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @Public()
  @MessagePattern(PATTERNS.RENTAL_CONTRACT_PUBLIC_DECLINE)
  async decline(
    @Payload() payload: { token: string; data: DeclineContractDto },
  ) {
    try {
      const res = await this.usecases.declineByToken(
        payload.token,
        payload.data || {},
      );
      return IResponse.success(
        'We let our team know. They will contact you.',
        res,
      );
    } catch (error) {
      handleCatch(error);
    }
  }

  // ---------------- saved signature (signed-in customer) ----------------

  @MessagePattern(PATTERNS.MY_SIGNATURE_GET)
  async getMySignature(@Payload() payload: { user: any }) {
    try {
      const res = await this.usecases.getMySignature(payload.user?.sub);
      return IResponse.success('Signature fetched', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @MessagePattern(PATTERNS.MY_SIGNATURE_SAVE)
  async saveMySignature(
    @Payload() payload: { data: SaveSignatureDto; user: any },
  ) {
    try {
      const res = await this.usecases.saveMySignature(
        payload.user?.sub,
        payload.data?.signature,
      );
      return IResponse.success('Signature saved', res);
    } catch (error) {
      handleCatch(error);
    }
  }

  @MessagePattern(PATTERNS.MY_SIGNATURE_DELETE)
  async deleteMySignature(@Payload() payload: { user: any }) {
    try {
      const res = await this.usecases.deleteMySignature(payload.user?.sub);
      return IResponse.success('Signature removed', res);
    } catch (error) {
      handleCatch(error);
    }
  }
}
