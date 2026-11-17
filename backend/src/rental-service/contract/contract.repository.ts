// contract.repository.ts
import { Injectable } from '@nestjs/common';
import { ContractStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const author = { select: { id: true, firstName: true, lastName: true } };

/** Contract list rows (no heavy document / html / signature). */
export const contractSummarySelect = {
  id: true,
  contractNo: true,
  title: true,
  status: true,
  templateId: true,
  sentAt: true,
  viewedAt: true,
  signedAt: true,
  declinedAt: true,
  declineReason: true,
  signerName: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RentalContractSelect;

@Injectable()
export class ContractRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------- templates ----------------

  countTemplates() {
    return this.prisma.contractTemplate.count();
  }

  listTemplates(includeInactive: boolean) {
    return this.prisma.contractTemplate.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
      include: { createdBy: author, _count: { select: { contracts: true } } },
    });
  }

  findTemplate(id: string) {
    return this.prisma.contractTemplate.findUnique({
      where: { id },
      include: { createdBy: author, _count: { select: { contracts: true } } },
    });
  }

  findDefaultTemplate() {
    return this.prisma.contractTemplate.findFirst({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  createTemplate(data: Prisma.ContractTemplateUncheckedCreateInput) {
    return this.prisma.contractTemplate.create({ data });
  }

  updateTemplate(
    id: string,
    data: Prisma.ContractTemplateUncheckedUpdateInput,
  ) {
    return this.prisma.contractTemplate.update({ where: { id }, data });
  }

  deleteTemplate(id: string) {
    return this.prisma.contractTemplate.delete({ where: { id } });
  }

  /** Exactly one default. */
  setDefault(id: string) {
    return this.prisma.$transaction([
      this.prisma.contractTemplate.updateMany({
        where: { isDefault: true, NOT: { id } },
        data: { isDefault: false },
      }),
      this.prisma.contractTemplate.update({
        where: { id },
        data: { isDefault: true, isActive: true },
      }),
    ]);
  }

  // ---------------- contracts ----------------

  findRequest(id: string) {
    return this.prisma.rentalRequest.findUnique({
      where: { id },
      select: {
        id: true,
        trackingCode: true,
        customerId: true,
        contactName: true,
        contactPhone: true,
        status: true,
        totalPrice: true,
        payments: { select: { amount: true } },
      },
    });
  }

  updateRequest(id: string, data: Prisma.RentalRequestUncheckedUpdateInput) {
    return this.prisma.rentalRequest.update({ where: { id }, data });
  }

  /** A contract the customer can still sign (blocks accepting the price without it). */
  findOpenContract(requestId: string) {
    return this.prisma.rentalContract.findFirst({
      where: {
        requestId,
        status: { in: [ContractStatus.SENT, ContractStatus.VIEWED] },
      },
      select: { id: true, contractNo: true },
    });
  }

  // ---------------- saved signature (profile) ----------------

  getUserSignature(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { signatureImage: true, signatureUpdatedAt: true },
    });
  }

  setUserSignature(userId: string, signatureImage: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        signatureImage,
        signatureUpdatedAt: signatureImage ? new Date() : null,
      },
      select: { signatureImage: true, signatureUpdatedAt: true },
    });
  }

  listForRequest(requestId: string) {
    return this.prisma.rentalContract.findMany({
      where: { requestId },
      orderBy: { createdAt: 'desc' },
      select: {
        ...contractSummarySelect,
        createdBy: author,
        template: { select: { id: true, title: true } },
      },
    });
  }

  findContract(id: string) {
    return this.prisma.rentalContract.findUnique({
      where: { id },
      include: {
        createdBy: author,
        template: { select: { id: true, title: true } },
      },
    });
  }

  findByToken(token: string) {
    return this.prisma.rentalContract.findUnique({
      where: { publicToken: token },
      include: {
        request: {
          select: {
            id: true,
            trackingCode: true,
            customerId: true,
            contactName: true,
            contactPhone: true,
            status: true,
            totalPrice: true,
            days: true,
            pickupDate: true,
          },
        },
      },
    });
  }

  contractNoExists(contractNo: string) {
    return this.prisma.rentalContract
      .findUnique({ where: { contractNo }, select: { id: true } })
      .then(Boolean);
  }

  countCreatedSince(date: Date) {
    return this.prisma.rentalContract.count({
      where: { createdAt: { gte: date } },
    });
  }

  createContract(data: Prisma.RentalContractUncheckedCreateInput) {
    return this.prisma.rentalContract.create({ data });
  }

  updateContract(id: string, data: Prisma.RentalContractUncheckedUpdateInput) {
    return this.prisma.rentalContract.update({ where: { id }, data });
  }

  /** Other open contracts of the same request become VOID when a new one is sent. */
  voidOthers(requestId: string, keepId: string) {
    return this.prisma.rentalContract.updateMany({
      where: {
        requestId,
        id: { not: keepId },
        status: {
          in: [
            ContractStatus.DRAFT,
            ContractStatus.SENT,
            ContractStatus.VIEWED,
          ],
        },
      },
      data: { status: ContractStatus.VOID },
    });
  }

  deleteContract(id: string) {
    return this.prisma.rentalContract.delete({ where: { id } });
  }

  addEvent(data: Prisma.RentalRequestEventUncheckedCreateInput) {
    return this.prisma.rentalRequestEvent.create({ data });
  }
}
