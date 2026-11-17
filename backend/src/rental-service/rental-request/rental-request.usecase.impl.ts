// rental-request.usecase.impl.ts
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { RentalRequestStatus } from '@prisma/client';
import { RentalRequestRepository } from './rental-request.repository';
import { NotifierService } from '../notification/notifier.service';
import { CommissionService } from '../supplier/commission.service';
import {
  AddRentalPaymentDto,
  RentalPaymentListQueryDto,
  CreateRentalRequestDto,
  RentalRequestListQueryDto,
  UpdateRentalRequestDto,
} from './rental-request.entity';

// Statuses that only make sense once a price has been agreed
const NEEDS_PRICE: RentalRequestStatus[] = ['APPROVED', 'ACTIVE', 'COMPLETED'];

const fmtEtb = (n: number | null | undefined) =>
  n === null || n === undefined
    ? 'none'
    : `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })} ETB`;

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'New',
  UNDER_NEGOTIATION: 'Negotiating',
  APPROVED: 'Approved',
  ACTIVE: 'On trip',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const round2 = (n: number) => Math.round(n * 100) / 100;

const fail = (message: string, statusCode = 400): never => {
  throw new RpcException({ statusCode, message });
};

/** Adds paidAmount / balance / paidPercent so clients don't re-calculate. */
export function withPaymentSummary<
  T extends { totalPrice: number | null; payments: { amount: number }[] },
>(request: T) {
  const paidAmount = round2(
    request.payments.reduce((sum, p) => sum + p.amount, 0),
  );
  const total = request.totalPrice;
  const hasPrice = total !== null && total !== undefined && total > 0;
  return {
    ...request,
    paidAmount,
    balance: hasPrice ? round2(Math.max(total - paidAmount, 0)) : null,
    paidPercent: hasPrice
      ? Math.min(round2((paidAmount / total) * 100), 100)
      : null,
  };
}

@Injectable()
export class RentalRequestUseCasesImpl {
  constructor(
    private readonly repo: RentalRequestRepository,
    private readonly notifier: NotifierService,
    private readonly commission: CommissionService,
  ) {}

  // In-app links (see admin LayoutRouting and mobile app/request/trip.jsx)
  private adminLink = (id: string) => `/dash/requests/${id}`;
  private appLink = (id: string) => `/request/trip?id=${id}`;

  private async newTrackingCode() {
    const year = new Date().getFullYear();
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
    for (let attempt = 0; attempt < 5; attempt++) {
      let suffix = '';
      for (let i = 0; i < 6; i++) {
        suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      const code = `WL-${year}-${suffix}`;
      if (!(await this.repo.trackingCodeExists(code))) return code;
    }
    return fail('Could not generate a tracking code, please try again');
  }

  async create(dto: CreateRentalRequestDto, userId?: string) {
    const carIds = [...new Set(dto.carIds)];
    const activeCars = await this.repo.countActiveCars(carIds);
    if (activeCars !== carIds.length) {
      fail('One or more selected cars are no longer available');
    }

    // Pickup city must be one of the active pickup locations
    let pickupCity = dto.pickupCity.trim();
    const allowed = await this.repo.pickupLocationNames();
    if (allowed) {
      const match = allowed.find(
        (n) => n.toLowerCase() === pickupCity.toLowerCase(),
      );
      if (!match)
        fail(
          `We don't pick up from "${pickupCity}" yet. Please choose another city`,
        );
      pickupCity = match!;
    }

    let destinations = [
      ...new Set(dto.destinations.map((d) => d.trim()).filter(Boolean)),
    ];
    if (!destinations.length) fail('Choose at least one destination');

    // Destinations must be picked from the Locations list
    const places = await this.repo.activeLocationNames();
    if (places) {
      const byLower = new Map(places.map((n) => [n.toLowerCase(), n]));
      const unknown = destinations.filter((d) => !byLower.has(d.toLowerCase()));
      if (unknown.length) {
        fail(
          `Please choose destinations from the list. Not available: ${unknown.join(', ')}`,
        );
      }
      destinations = [
        ...new Set(destinations.map((d) => byLower.get(d.toLowerCase())!)),
      ];
    }

    const pickupDate = new Date(dto.pickupDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (pickupDate < today) fail('Pickup date cannot be in the past');

    // Contact info: from the account if signed in, otherwise from the form
    let contactName = dto.contactName?.trim();
    let contactPhone = dto.contactPhone?.trim();
    let contactEmail = dto.contactEmail?.trim() || null;
    let customerId: string | null = null;

    if (userId) {
      const user = await this.repo.findUserById(userId);
      if (user) {
        customerId = user.id;
        contactName = `${user.firstName} ${user.lastName}`.trim();
        contactPhone = user.phone;
        contactEmail = user.email ?? contactEmail;
      }
    }

    if (!contactName) fail('Your name is required so we can contact you');
    if (!contactPhone)
      fail('Your phone number is required so we can contact you');

    const request = await this.repo.create({
      trackingCode: await this.newTrackingCode(),
      customerId,
      contactName: contactName!,
      contactPhone: contactPhone!,
      contactEmail,
      pickupCity,
      destinations,
      purpose: dto.purpose.trim(),
      ruralAccess: dto.ruralAccess ?? false,
      pickupDate,
      days: dto.days,
      note: dto.note?.trim() || null,
      carIds,
    });

    // Real-time notifications (fire and forget)
    const carCount = carIds.length;
    void this.notifier.toAdmins({
      type: 'BOOKING',
      title: `New booking request · ${request.trackingCode}`,
      message: `${contactName} wants ${carCount} car${carCount > 1 ? 's' : ''} · ${pickupCity} → ${destinations.join(', ')} · ${dto.days} day${dto.days > 1 ? 's' : ''}. Set the agreement, then send the contract to the customer.`,
      link: this.adminLink(request.id),
      data: {
        requestId: request.id,
        trackingCode: request.trackingCode,
        kind: 'REQUEST_CREATED',
      },
    });
    void this.notifier.toCustomer(customerId, {
      type: 'BOOKING',
      title: 'Request received',
      message: `We got your request ${request.trackingCode}. Our team will call you soon to agree the price.`,
      link: this.appLink(request.id),
      data: {
        requestId: request.id,
        trackingCode: request.trackingCode,
        kind: 'REQUEST_CREATED',
      },
    });

    return withPaymentSummary(request);
  }

  async listMine(userId: string, query: RentalRequestListQueryDto) {
    if (!userId) fail('Please sign in', 401);
    const res = await this.repo.list({
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10,
      status: query.status,
      customerId: userId,
      forCustomer: true,
    });
    return { ...res, models: res.models.map(withPaymentSummary) };
  }

  /** Public lookup for customers who were not signed in. */
  async track(code: string, phone: string) {
    const request = await this.repo.findByCode(
      (code || '').trim().toUpperCase(),
    );
    const digits = (s: string) => (s || '').replace(/\D/g, '').slice(-9);
    if (!request || !phone || digits(request.contactPhone) !== digits(phone)) {
      fail('No request found with that code and phone number', 404);
    }
    return withPaymentSummary(request!);
  }

  /**
   * The customer accepts the agreed price from the mobile app.
   * Signed in: must own the request. Guest: tracking code + phone must match.
   */
  async customerAccept(params: {
    id?: string;
    code?: string;
    phone?: string;
    userId?: string;
  }) {
    let request;
    if (params.code) {
      request = await this.track(params.code, params.phone || '');
    } else {
      if (!params.userId) fail('Please sign in', 401);
      request = await this.repo.findById(params.id || '');
      if (!request || request.customerId !== params.userId) {
        fail('Request not found', 404);
      }
    }
    if (request.status !== 'UNDER_NEGOTIATION') {
      fail('This request cannot be accepted right now');
    }
    // When a contract was sent, the price is accepted by signing it
    if (await this.repo.findOpenContract(request.id)) {
      fail('Please review and sign the contract to accept the price');
    }
    if (!(request.totalPrice && request.totalPrice > 0)) {
      fail('The price has not been agreed yet');
    }
    await this.repo.update(request.id, { status: 'APPROVED' });
    await this.repo.addEvent({
      requestId: request.id,
      type: 'CUSTOMER_ACCEPTED',
      message: `Customer accepted the price of ${fmtEtb(request.totalPrice)}`,
      details: {
        from: request.status,
        to: 'APPROVED',
        price: request.totalPrice,
      },
      actorId: params.userId ?? null,
    });
    const fresh = await this.repo.findByCode(request.trackingCode);
    void this.notifier.toAdmins({
      type: 'BOOKING',
      title: `Customer accepted · ${request.trackingCode}`,
      message: `${request.contactName} accepted ${fmtEtb(request.totalPrice)}. You can now arrange the trip and collect payment.`,
      link: this.adminLink(request.id),
      data: {
        requestId: request.id,
        trackingCode: request.trackingCode,
        kind: 'CUSTOMER_ACCEPTED',
      },
    });
    return withPaymentSummary(fresh!);
  }

  async listAll(query: RentalRequestListQueryDto) {
    const res = await this.repo.list({
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 10,
      search: query.search,
      status: query.status,
    });
    const counts = await this.repo.countByStatus();
    return {
      models: res.models.map(withPaymentSummary),
      pagination: res.pagination,
      counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
    };
  }

  async listPayments(query: RentalPaymentListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const res = await this.repo.listPayments({
      page,
      pageSize,
      search: query.search,
      method: query.method,
    });
    const models = res.models.map((p) => {
      const { request, ...rest } = p;
      const price = request.totalPrice;
      const hasPrice = !!price && price > 0;
      const idx = request.payments.findIndex((x) => x.id === p.id);
      const paidSoFar = request.payments
        .slice(0, idx + 1)
        .reduce((sum, x) => sum + x.amount, 0);
      const paidTotal = request.payments.reduce((sum, x) => sum + x.amount, 0);
      return {
        ...rest,
        invoiceNo: `INV-${request.trackingCode}-${String(idx + 1).padStart(2, '0')}`,
        paymentNumber: idx + 1,
        request: {
          id: request.id,
          trackingCode: request.trackingCode,
          status: request.status,
          contactName: request.contactName,
          contactPhone: request.contactPhone,
          contactEmail: request.contactEmail,
          pickupCity: request.pickupCity,
          destinations: request.destinations,
          pickupDate: request.pickupDate,
          days: request.days,
          totalPrice: price,
          paidTotal: round2(paidTotal),
          paymentCount: request.payments.length,
        },
        sharePercent: hasPrice ? round2((p.amount / price) * 100) : null,
        cumulativePercent: hasPrice
          ? Math.min(round2((paidSoFar / price) * 100), 100)
          : null,
        balanceAfter: hasPrice ? round2(Math.max(price - paidSoFar, 0)) : null,
      };
    });
    return {
      models,
      pagination: {
        page,
        pageSize,
        total: res.total,
        totalPages: Math.ceil(res.total / pageSize),
      },
      stats: {
        totalCollected: round2(res.all._sum.amount ?? 0),
        paymentCount: res.all._count._all,
        thisMonth: round2(res.month._sum.amount ?? 0),
        thisMonthCount: res.month._count._all,
        byMethod: res.byMethod.map((m) => ({
          method: m.method,
          amount: round2(m._sum.amount ?? 0),
          count: m._count._all,
        })),
      },
    };
  }

  async getById(id: string) {
    const request = await this.repo.findById(id);
    if (!request) fail('Request not found', 404);
    return withPaymentSummary(request!);
  }

  async update(id: string, dto: UpdateRentalRequestDto, adminId?: string) {
    const current = await this.getById(id);

    const totalPrice =
      dto.totalPrice !== undefined ? dto.totalPrice : current.totalPrice;
    const status = dto.status ?? current.status;

    // Only the customer can accept (from the mobile app)
    if (dto.status === 'APPROVED' && current.status !== 'APPROVED') {
      fail('Only the customer can accept the request, from the mobile app');
    }

    if (NEEDS_PRICE.includes(status) && !(totalPrice && totalPrice > 0)) {
      fail('Set the agreed price before moving the request to this status');
    }
    if (dto.totalPrice !== undefined && dto.totalPrice < current.paidAmount) {
      fail(
        `Price cannot be lower than the amount already paid (${current.paidAmount} ETB)`,
      );
    }

    const updated = await this.repo.update(id, {
      status: dto.status,
      totalPrice: dto.totalPrice,
      adminNote: dto.adminNote,
      pickupDate: dto.pickupDate ? new Date(dto.pickupDate) : undefined,
      days: dto.days,
    });

    // Record what actually changed
    const log = (type: string, message: string, details?: object) =>
      this.repo.addEvent({
        requestId: id,
        type,
        message,
        details: details as any,
        actorId: adminId ?? null,
      });
    if (dto.status && dto.status !== current.status) {
      await log(
        'STATUS_CHANGED',
        `Status changed from ${STATUS_LABEL[current.status]} to ${STATUS_LABEL[dto.status]}`,
        { from: current.status, to: dto.status },
      );
    }
    if (dto.totalPrice !== undefined && dto.totalPrice !== current.totalPrice) {
      // one-car request: the total is that car's price → update the supplier split
      await this.commission.syncSingleCarRequest(id, dto.totalPrice ?? null);
      await log(
        'PRICE_CHANGED',
        `Agreed price ${current.totalPrice ? `changed from ${fmtEtb(current.totalPrice)} to` : 'set to'} ${fmtEtb(dto.totalPrice)}`,
        { from: current.totalPrice, to: dto.totalPrice },
      );
    }
    if (
      dto.adminNote !== undefined &&
      (dto.adminNote || '') !== (current.adminNote || '')
    ) {
      await log('NOTE_CHANGED', 'Internal note updated', {
        from: current.adminNote,
        to: dto.adminNote,
      });
    }
    if (
      dto.pickupDate &&
      new Date(dto.pickupDate).getTime() !==
        new Date(current.pickupDate).getTime()
    ) {
      await log('DATES_CHANGED', 'Pickup date changed', {
        from: current.pickupDate,
        to: dto.pickupDate,
      });
    }
    if (dto.days !== undefined && dto.days !== current.days) {
      await log(
        'DATES_CHANGED',
        `Trip length changed from ${current.days} to ${dto.days} days`,
        {
          from: current.days,
          to: dto.days,
        },
      );
    }

    // Tell the customer what changed (one notification per save)
    const statusChanged = !!dto.status && dto.status !== current.status;
    const priceChanged =
      dto.totalPrice !== undefined &&
      dto.totalPrice !== current.totalPrice &&
      !!dto.totalPrice;
    const customerMsg = this.customerUpdateMessage(
      updated.trackingCode,
      statusChanged ? dto.status! : null,
      priceChanged ? dto.totalPrice! : null,
      status,
    );
    if (customerMsg) {
      void this.notifier.toCustomer(updated.customerId, {
        type: 'BOOKING',
        ...customerMsg,
        link: this.appLink(id),
        data: {
          requestId: id,
          trackingCode: updated.trackingCode,
          status,
          kind: 'REQUEST_UPDATED',
        },
      });
    }
    return this.getById(id);
  }

  private customerUpdateMessage(
    code: string,
    newStatus: string | null,
    newPrice: number | null,
    status: string,
  ): { title: string; message: string } | null {
    if (newPrice && status === 'UNDER_NEGOTIATION') {
      return {
        title: 'Your price is ready',
        message: `${code}: the agreed price is ${fmtEtb(newPrice)}. Tap to review and accept it.`,
      };
    }
    const byStatus: Record<string, { title: string; message: string }> = {
      UNDER_NEGOTIATION: {
        title: 'We are agreeing the price',
        message: `${code}: our team is working on the price for your trip.`,
      },
      ACTIVE: {
        title: 'Your trip has started',
        message: `${code}: have a safe trip!`,
      },
      COMPLETED: {
        title: 'Trip completed',
        message: `${code}: thank you for travelling with us.`,
      },
      CANCELLED: {
        title: 'Request cancelled',
        message: `${code} was cancelled. Call us if this is a mistake.`,
      },
      PENDING: {
        title: 'Request reopened',
        message: `${code} is open again. We will call you soon.`,
      },
    };
    if (newStatus && byStatus[newStatus]) return byStatus[newStatus];
    if (newPrice) {
      return {
        title: 'Price updated',
        message: `${code}: the agreed price is now ${fmtEtb(newPrice)}.`,
      };
    }
    return null;
  }

  async addPayment(
    id: string,
    dto: AddRentalPaymentDto,
    adminId?: string,
    receiptUrl?: string,
  ) {
    const current = await this.getById(id);
    if (current.status === 'CANCELLED') {
      fail('Cannot add a payment to a cancelled request');
    }
    // No payment before the customer accepts (signs the contract / accepts the price)
    if (!NEEDS_PRICE.includes(current.status)) {
      fail(
        'The customer has not accepted the agreement yet. Payments can be recorded after they sign the contract.',
      );
    }
    if (current.balance !== null && dto.amount > current.balance + 0.001) {
      fail(
        `Amount is more than the remaining balance (${current.balance} ETB). Increase the price first if the trip was extended.`,
      );
    }

    await this.repo.addPayment({
      requestId: id,
      amount: round2(dto.amount),
      method: dto.method,
      reference: dto.reference?.trim() || null,
      note: dto.note?.trim() || null,
      receiptUrl: receiptUrl ?? null,
      paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
      recordedById: adminId ?? null,
    });
    await this.repo.addEvent({
      requestId: id,
      type: 'PAYMENT_ADDED',
      message: `Payment of ${fmtEtb(round2(dto.amount))} recorded (${dto.method})`,
      details: {
        amount: round2(dto.amount),
        method: dto.method,
        reference: dto.reference || null,
      },
      actorId: adminId ?? null,
    });
    const after = await this.getById(id);
    const pct =
      after.paidPercent !== null
        ? ` · ${Math.round(after.paidPercent)}% paid`
        : '';
    void this.notifier.toCustomer(after.customerId, {
      type: 'PAYMENT',
      title: 'Payment received',
      message: `${after.trackingCode}: we received ${fmtEtb(round2(dto.amount))}${pct}.${after.balance ? ` Balance ${fmtEtb(after.balance)}.` : ''}`,
      link: this.appLink(id),
      data: {
        requestId: id,
        trackingCode: after.trackingCode,
        kind: 'PAYMENT_ADDED',
      },
    });
    void this.notifier.toAdmins(
      {
        type: 'PAYMENT',
        title: `Payment recorded · ${after.trackingCode}`,
        message: `${fmtEtb(round2(dto.amount))} (${dto.method}) from ${after.contactName}${pct}`,
        link: this.adminLink(id),
        data: {
          requestId: id,
          trackingCode: after.trackingCode,
          kind: 'PAYMENT_ADDED',
        },
      },
      adminId,
    );
    return after;
  }

  async deletePayment(id: string, paymentId: string, adminId?: string) {
    const payment = await this.repo.findPayment(paymentId);
    if (!payment || payment.requestId !== id) fail('Payment not found', 404);
    await this.repo.deletePayment(paymentId);
    await this.repo.addEvent({
      requestId: id,
      type: 'PAYMENT_REMOVED',
      message: `Payment of ${fmtEtb(payment!.amount)} (${payment!.method}) removed`,
      details: { amount: payment!.amount, method: payment!.method },
      actorId: adminId ?? null,
    });
    return this.getById(id);
  }
}
