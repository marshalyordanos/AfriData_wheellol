// contract.usecase.impl.ts
// Contract templates (built in the admin) and the contract sent for each
// booking request. The admin renders the HTML (admin views/contracts/renderContract.js);
// the backend stores it, serves it to the customer and records the e-signature.
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ContractStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { ContractRepository } from './contract.repository';
import { isValidSignature } from './signature.util';
import { NotifierService } from '../notification/notifier.service';
import {
  DEFAULT_TEMPLATE_DESCRIPTION,
  DEFAULT_TEMPLATE_TITLE,
  defaultTemplateDocument,
} from './default-template';
import {
  CreateContractTemplateDto,
  CreateRentalContractDto,
  DeclineContractDto,
  SaveRentalContractDto,
  SignContractDto,
  UpdateContractTemplateDto,
} from './contract.entity';

const fail = (message: string, statusCode = 400): never => {
  throw new RpcException({ statusCode, message });
};

const OPEN: ContractStatus[] = ['SENT', 'VIEWED'];
const EDITABLE: ContractStatus[] = ['DRAFT', 'SENT', 'VIEWED', 'DECLINED'];
const MAX_HTML = 2_000_000; // 2 MB of HTML is far more than any contract needs
const ACCEPTED: string[] = ['APPROVED', 'ACTIVE', 'COMPLETED'];
const round2 = (n: number) => Math.round(n * 100) / 100;
const fmtEtb = (n: number | null | undefined) =>
  `${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ETB`;

const escapeHtml = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const fmtDateTime = (d: Date) =>
  `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/** Put the customer's e-signature into the signature slot of the rendered contract. */
type DocField = {
  key: string;
  label?: string;
  type?: string;
  required?: boolean;
  default?: string;
  options?: string[];
  help?: string;
  source?: 'admin' | 'customer' | 'signer';
};

/** Fields the customer fills when signing. */
export const customerFieldsOf = (document: any): DocField[] =>
  ((document?.fields || []) as DocField[]).filter(
    (f) => f && (f.source === 'customer' || f.source === 'signer'),
  );

// Must match renderContract.js (admin): a blank line the customer's value replaces
const CF_RE =
  /<span class="wlc-cf" data-cf="([\w-]+)"><span class="wlc-blank">&nbsp;<\/span><\/span>/g;

export function withSignature(
  html: string,
  c: {
    status: string;
    signerName?: string | null;
    signatureImage?: string | null;
    signedAt?: Date | null;
    customerValues?: any;
    document?: any;
  },
) {
  if (!html) return '';
  if (c.status === 'SIGNED') {
    const signerKeys = new Set(
      customerFieldsOf(c.document)
        .filter((f) => f.source === 'signer')
        .map((f) => f.key),
    );
    const vals = (c.customerValues || {}) as Record<string, string>;
    html = html.replace(CF_RE, (whole, key: string) => {
      if (key === '__signed_date') {
        return c.signedAt
          ? `<span class="wlc-cf">${fmtDateTime(new Date(c.signedAt)).slice(0, 10)}</span>`
          : whole;
      }
      const v = signerKeys.has(key) ? c.signerName : vals[key];
      return v && String(v).trim()
        ? `<span class="wlc-cf">${escapeHtml(String(v).trim())}</span>`
        : whole;
    });
  }
  if (
    c.status !== 'SIGNED' ||
    !c.signatureImage ||
    !isValidSignature(c.signatureImage)
  ) {
    return html;
  }
  const block =
    `<img class="wlc-sig-img" src="${c.signatureImage}" alt="Signature" />` +
    `<div class="wlc-sig-meta">Signed electronically by ${escapeHtml(c.signerName || '')}` +
    `${c.signedAt ? ` · ${fmtDateTime(new Date(c.signedAt))}` : ''}</div>`;
  return html.split('<!--SIG:customer-->').join(block);
}

@Injectable()
export class ContractUseCasesImpl {
  constructor(
    private readonly repo: ContractRepository,
    private readonly notifier: NotifierService,
  ) {}

  private adminLink = (requestId: string) => `/dash/requests/${requestId}`;
  private appLink = (requestId: string) => `/request/trip?id=${requestId}`;

  // =====================================================================
  // Templates
  // =====================================================================

  /** First run: create the WHEELLOL agreement as the default template. */
  private async ensureDefaultTemplate(adminId?: string) {
    if ((await this.repo.countTemplates()) > 0) {
      await this.upgradeTemplates();
      return;
    }
    await this.repo.createTemplate({
      title: DEFAULT_TEMPLATE_TITLE,
      description: DEFAULT_TEMPLATE_DESCRIPTION,
      document: defaultTemplateDocument() as any,
      isDefault: true,
      createdById: adminId ?? null,
    });
  }

  /**
   * v1 → v2: the lessee representative name/position are now filled by the
   * customer when signing (name = the name they sign with).
   */
  private upgraded = false;
  private async upgradeTemplates() {
    if (this.upgraded) return;
    this.upgraded = true;
    const rows = await this.repo.listTemplates(true);
    for (const t of rows) {
      await this.fixBrandSpelling(t);
    }
    for (const t of rows) {
      const doc: any = t.document;
      if (!doc || (doc.version ?? 1) >= 2) continue;
      const fields = (doc.fields || []).map((f: DocField) => {
        if (f.key === 'lessee_representative' && !f.source) {
          return {
            ...f,
            label: 'Full name',
            source: 'signer',
            required: true,
            default: '{{customer.name}}',
          };
        }
        if (f.key === 'lessee_position' && !f.source) {
          return {
            ...f,
            label: 'Position / title',
            source: 'customer',
            help: 'e.g. Director, Project Manager',
          };
        }
        return f;
      });
      await this.repo.updateTemplate(t.id, {
        document: { ...doc, version: 2, fields },
      });
    }

    // v2 → v3: prices are VAT exclusive by default (admin can switch VAT on
    // per template and per contract).
    const again = await this.repo.listTemplates(true);
    for (const t of again) {
      const doc: any = t.document;
      if (!doc || (doc.version ?? 1) >= 3) continue;
      await this.repo.updateTemplate(t.id, {
        document: {
          ...doc,
          version: 3,
          settings: { ...(doc.settings || {}), pricesIncludeVat: false },
        },
      });
    }
  }

  /** The brand is "Wheellol" (double L). Old templates were saved as "WHEELOL". */
  private async fixBrandSpelling(t: any) {
    const fix = (v: string) =>
      v
        .replace(/\bWHEELOL\b/g, 'WHEELLOL')
        .replace(/\bWheelol\b/g, 'Wheellol')
        .replace(/\bwheelol\b/g, 'wheellol');
    const docText = t.document ? JSON.stringify(t.document) : '';
    const fixedDoc = fix(docText);
    const title = t.title ? fix(t.title) : t.title;
    const description = t.description ? fix(t.description) : t.description;
    if (
      fixedDoc === docText &&
      title === t.title &&
      description === t.description
    )
      return;
    const document = fixedDoc ? JSON.parse(fixedDoc) : t.document;
    await this.repo.updateTemplate(t.id, { title, description, document });
    t.document = document;
    t.title = title;
    t.description = description;
  }

  private blankDocument() {
    const base = defaultTemplateDocument();
    return {
      version: 3,
      settings: base.settings,
      fields: [],
      blocks: [
        {
          id: 'b1',
          type: 'header',
          company: '{{company.name}}',
          title: 'AGREEMENT',
          subtitle: '{{customer.name}}',
          showLogo: true,
        },
        {
          id: 'b2',
          type: 'details',
          rows: [
            { id: 'r1', label: 'Contract No.', value: '{{contract.number}}' },
            {
              id: 'r2',
              label: 'Agreement Date',
              value: '{{contract.agreementDate}}',
            },
          ],
        },
        {
          id: 'b3',
          type: 'article',
          title: 'PARTIES',
          intro: '',
          clauses: [{ id: 'c1', html: '<p></p>' }],
          outro: '',
        },
        base.blocks.find((b: any) => b.type === 'signatures'),
      ],
    };
  }

  async listTemplates(includeInactive = false, adminId?: string) {
    await this.ensureDefaultTemplate(adminId);
    const rows = await this.repo.listTemplates(includeInactive);
    // Lightweight stats for the list cards (the document itself is sent too: it is small)
    return rows.map((t) => {
      const blocks: any[] = (t.document as any)?.blocks || [];
      return {
        ...t,
        stats: {
          articles: blocks.filter((b) => b.type === 'article').length,
          clauses: blocks.reduce((n, b) => n + (b.clauses?.length || 0), 0),
          fields: ((t.document as any)?.fields || []).length,
          hasSchedule: blocks.some((b) => b.type === 'schedule'),
        },
      };
    });
  }

  async getTemplate(id: string) {
    const t = await this.repo.findTemplate(id);
    if (!t) fail('Contract template not found', 404);
    return t!;
  }

  async createTemplate(dto: CreateContractTemplateDto, adminId?: string) {
    await this.ensureDefaultTemplate(adminId);
    let document: any = dto.document;
    if (!document) {
      if (!dto.from || dto.from === 'blank') document = this.blankDocument();
      else if (dto.from === 'default') document = defaultTemplateDocument();
      else document = (await this.getTemplate(dto.from)).document;
    }
    const isFirst = (await this.repo.countTemplates()) === 0;
    return this.repo.createTemplate({
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      document,
      isDefault: isFirst,
      createdById: adminId ?? null,
    });
  }

  async updateTemplate(id: string, dto: UpdateContractTemplateDto) {
    const current = await this.getTemplate(id);
    if (dto.isActive === false && current.isDefault) {
      fail(
        'This is the default contract. Make another contract the default first.',
      );
    }
    if (dto.document && !Array.isArray((dto.document as any).blocks)) {
      fail('The contract has no content');
    }
    await this.repo.updateTemplate(id, {
      title: dto.title?.trim(),
      description:
        dto.description !== undefined
          ? dto.description.trim() || null
          : undefined,
      document: dto.document as any,
      isActive: dto.isActive,
    });
    return this.getTemplate(id);
  }

  async duplicateTemplate(id: string, adminId?: string) {
    const t = await this.getTemplate(id);
    return this.repo.createTemplate({
      title: `${t.title} (copy)`.slice(0, 160),
      description: t.description,
      document: t.document as any,
      isDefault: false,
      createdById: adminId ?? null,
    });
  }

  async setDefaultTemplate(id: string) {
    await this.getTemplate(id);
    await this.repo.setDefault(id);
    return this.getTemplate(id);
  }

  /** Templates already used by bookings are archived instead of deleted. */
  async deleteTemplate(id: string) {
    const t = await this.getTemplate(id);
    if (t.isDefault) {
      fail(
        'This is the default contract. Make another contract the default first.',
      );
    }
    if (t._count.contracts > 0) {
      await this.repo.updateTemplate(id, { isActive: false });
      return { archived: true };
    }
    await this.repo.deleteTemplate(id);
    return { deleted: true };
  }

  // =====================================================================
  // Contracts for a booking request
  // =====================================================================

  private async newContractNo(
    format: string | undefined,
    trackingCode: string,
  ) {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    let seq = (await this.repo.countCreatedSince(yearStart)) + 1;
    const pattern =
      (format || 'WCR/CRA/{seq}/{year}').trim() || 'WCR/CRA/{seq}/{year}';
    for (let attempt = 0; attempt < 50; attempt++, seq++) {
      let no = pattern
        .replace(/\{seq\}/g, String(seq).padStart(3, '0'))
        .replace(/\{year\}/g, String(now.getFullYear()))
        .replace(/\{month\}/g, String(now.getMonth() + 1).padStart(2, '0'))
        .replace(/\{code\}/g, trackingCode);
      if (!pattern.includes('{seq}') && attempt > 0)
        no = `${no}-${attempt + 1}`;
      if (!(await this.repo.contractNoExists(no))) return no;
    }
    return fail('Could not create a contract number, please try again');
  }

  async listContracts(requestId: string) {
    const request = await this.repo.findRequest(requestId);
    if (!request) fail('Request not found', 404);
    return this.repo.listForRequest(requestId);
  }

  async getContract(id: string) {
    const c = await this.repo.findContract(id);
    if (!c) fail('Contract not found', 404);
    return { ...c!, previewHtml: withSignature(c!.html || '', c!) };
  }

  /** Step 1: the admin picks a template for the booking → a draft is created. */
  async createContract(
    requestId: string,
    dto: CreateRentalContractDto,
    adminId?: string,
  ) {
    const request = await this.repo.findRequest(requestId);
    if (!request) fail('Request not found', 404);
    await this.ensureDefaultTemplate(adminId);
    const template = dto.templateId
      ? await this.repo.findTemplate(dto.templateId)
      : await this.repo.findDefaultTemplate();
    if (!template) fail('Contract template not found', 404);
    if (!template!.isActive) fail('This contract template is archived');

    const document: any = template!.document;
    const contractNo = await this.newContractNo(
      document?.settings?.numberFormat,
      request!.trackingCode,
    );
    const created = await this.repo.createContract({
      contractNo,
      title: template!.title,
      requestId,
      templateId: template!.id,
      document,
      values: {}, // the admin form fills defaults from the booking on first open
      publicToken: randomBytes(24).toString('base64url'),
      createdById: adminId ?? null,
    });
    await this.repo.addEvent({
      requestId,
      type: 'CONTRACT_CREATED',
      message: `Contract ${contractNo} prepared from “${template!.title}”`,
      details: { contractId: created.id, contractNo },
      actorId: adminId ?? null,
    });
    return this.getContract(created.id);
  }

  /** Save the filled contract; with action "send" it goes to the customer. */
  async saveContract(id: string, dto: SaveRentalContractDto, adminId?: string) {
    const current = await this.getContract(id);
    if (!EDITABLE.includes(current.status)) {
      fail(
        current.status === 'SIGNED'
          ? 'This contract is already signed and cannot be changed. Void it and prepare a new one if needed.'
          : 'This contract was voided. Prepare a new one.',
      );
    }
    if (dto.html && dto.html.length > MAX_HTML)
      fail('The contract is too large');

    const sending = dto.action === 'send';
    const html = dto.html ?? current.html;
    if (sending && !html) fail('Open the contract preview before sending');

    // Every detail the admin fills is required before sending
    // (fields the customer fills when signing are checked at signing time)
    if (sending) {
      const doc: any = dto.document ?? current.document;
      const vals: any = dto.values ?? current.values ?? {};
      const empty = ((doc?.fields || []) as DocField[])
        .filter((f) => !f.source || f.source === 'admin')
        .filter((f) => !String(vals?.fields?.[f.key] ?? '').trim())
        .map((f) => f.label || f.key);
      if (empty.length) fail(`Fill in before sending: ${empty.join(', ')}`);
      if (!(dto.title ?? current.title)?.trim())
        fail('Give the contract a title');
    }

    const wasOpen = OPEN.includes(current.status);

    // The contract carries the price: signing it = accepting this price.
    let price: number | null = null;
    let request = await this.repo.findRequest(current.requestId);
    if (sending) {
      if (!request) fail('Request not found', 404);
      if (request!.status === 'CANCELLED' || request!.status === 'COMPLETED') {
        fail('This booking is closed. Reopen it before sending a contract.');
      }
      price =
        dto.totalPrice !== undefined && dto.totalPrice !== null
          ? round2(dto.totalPrice)
          : request!.totalPrice;
      if (!(price && price > 0)) {
        fail('Set the agreed price before sending the contract');
      }
      const paid = round2(
        request!.payments.reduce((sum, p) => sum + p.amount, 0),
      );
      if (price! < paid) {
        fail(
          `The price cannot be lower than the amount already paid (${fmtEtb(paid)})`,
        );
      }
      if (ACCEPTED.includes(request!.status) && price !== request!.totalPrice) {
        fail(
          `The customer already accepted ${fmtEtb(request!.totalPrice)}. Send the contract with that price, or agree a new price with the customer first.`,
        );
      }
    }

    await this.repo.updateContract(id, {
      title: dto.title?.trim() || undefined,
      document: dto.document as any,
      values: dto.values as any,
      // A sent contract keeps the version the customer sees until it is re-sent
      html: sending || current.status === 'DRAFT' ? dto.html : undefined,
      ...(sending
        ? {
            status: 'SENT',
            sentAt: new Date(),
            viewedAt: null,
            declinedAt: null,
            declineReason: null,
          }
        : {}),
    });

    if (sending) {
      await this.repo.voidOthers(current.requestId, id);
      const before = request!;
      const patch: Record<string, any> = {};
      if (price !== before.totalPrice) patch.totalPrice = price;
      if (before.status === 'PENDING') patch.status = 'UNDER_NEGOTIATION';
      if (Object.keys(patch).length) {
        await this.repo.updateRequest(current.requestId, patch);
        if (patch.totalPrice !== undefined) {
          await this.repo.addEvent({
            requestId: current.requestId,
            type: 'PRICE_CHANGED',
            message: `Agreed price ${before.totalPrice ? `changed from ${fmtEtb(before.totalPrice)} to` : 'set to'} ${fmtEtb(price)} (sent with the contract)`,
            details: { from: before.totalPrice, to: price },
            actorId: adminId ?? null,
          });
        }
        if (patch.status) {
          await this.repo.addEvent({
            requestId: current.requestId,
            type: 'STATUS_CHANGED',
            message: 'Status changed from New to Negotiating',
            details: { from: 'PENDING', to: 'UNDER_NEGOTIATION' },
            actorId: adminId ?? null,
          });
        }
        request = await this.repo.findRequest(current.requestId);
      }
      await this.repo.addEvent({
        requestId: current.requestId,
        type: 'CONTRACT_SENT',
        message: `Contract ${current.contractNo} ${wasOpen || current.status === 'DECLINED' ? 're-sent' : 'sent'} to the customer`,
        details: { contractId: id, contractNo: current.contractNo },
        actorId: adminId ?? null,
      });
      void this.notifier.toCustomer(request?.customerId, {
        type: 'BOOKING',
        title: wasOpen
          ? 'Your contract was updated'
          : 'Your contract and price are ready',
        message: `${request?.trackingCode}: ${fmtEtb(price)}. Review and sign contract ${current.contractNo} to confirm your booking.`,
        link: this.appLink(current.requestId),
        data: {
          requestId: current.requestId,
          trackingCode: request?.trackingCode,
          contractId: id,
          kind: 'CONTRACT_SENT',
        },
      });
    }
    return this.getContract(id);
  }

  async voidContract(id: string, adminId?: string) {
    const c = await this.getContract(id);
    if (c.status === 'VOID') return c;
    await this.repo.updateContract(id, { status: 'VOID' });
    await this.repo.addEvent({
      requestId: c.requestId,
      type: 'CONTRACT_VOIDED',
      message: `Contract ${c.contractNo} voided`,
      details: { contractId: id, contractNo: c.contractNo, from: c.status },
      actorId: adminId ?? null,
    });
    return this.getContract(id);
  }

  /** Only drafts that were never sent can be deleted. */
  async deleteContract(id: string) {
    const c = await this.getContract(id);
    if (c.status !== 'DRAFT')
      fail('Only drafts can be deleted. Void the contract instead.');
    await this.repo.deleteContract(id);
    return { deleted: true, requestId: c.requestId };
  }

  // =====================================================================
  // Customer (public link, no sign-in needed: the token is the secret)
  // =====================================================================

  private async byToken(token: string) {
    const c = token ? await this.repo.findByToken(token) : null;
    if (!c || c.status === 'DRAFT')
      fail('This contract link is not valid', 404);
    return c!;
  }

  private publicView(
    c: Awaited<ReturnType<ContractRepository['findByToken']>>,
  ) {
    const doc: any = c!.document || {};
    return {
      contractNo: c!.contractNo,
      title: c!.title,
      status: c!.status,
      html: withSignature(c!.html || '', c!),
      sentAt: c!.sentAt,
      viewedAt: c!.viewedAt,
      signedAt: c!.signedAt,
      declinedAt: c!.declinedAt,
      signerName: c!.signerName,
      companyName: doc?.settings?.company?.name || 'WheeL LOL',
      accent: doc?.settings?.accent || '#09234c',
      trackingCode: c!.request.trackingCode,
      customerName: c!.request.contactName,
      customerFields: customerFieldsOf(doc).map((f) => ({
        key: f.key,
        label: f.label || f.key,
        type: f.type || 'text',
        required: !!f.required,
        source: f.source,
        help: f.help || null,
        options: f.options || null,
        default: String(f.default ?? '')
          .replace(
            /\{\{\s*customer\.name\s*\}\}/g,
            c!.request.contactName || '',
          )
          .replace(
            /\{\{\s*customer\.phone\s*\}\}/g,
            c!.request.contactPhone || '',
          )
          .replace(/\{\{[^}]*\}\}/g, ''),
      })),
      customerValues: c!.customerValues || null,
      totalPrice: c!.request.totalPrice,
      currency: doc?.settings?.currency || 'ETB',
      days: c!.request.days,
      pickupDate: c!.request.pickupDate,
      requestStatus: c!.request.status,
    };
  }

  async viewByToken(token: string) {
    const c = await this.byToken(token);
    if (c.status === 'SENT') {
      const viewedAt = new Date();
      await this.repo.updateContract(c.id, { status: 'VIEWED', viewedAt });
      await this.repo.addEvent({
        requestId: c.requestId,
        type: 'CONTRACT_VIEWED',
        message: `Customer opened contract ${c.contractNo}`,
        details: { contractId: c.id },
      });
      return this.publicView({ ...c, status: 'VIEWED', viewedAt });
    }
    return this.publicView(c);
  }

  async signByToken(
    token: string,
    dto: SignContractDto,
    meta: { ip?: string; agent?: string },
  ) {
    const c = await this.byToken(token);
    if (c.status === 'SIGNED') fail('This contract is already signed');
    if (!OPEN.includes(c.status)) fail('This contract can no longer be signed');
    if (!dto.agree)
      fail('Please confirm that you have read and agree to the contract');
    const name = dto.name.trim();
    if (name.length < 3) fail('Type your full name');
    if (!isValidSignature(dto.signature)) {
      fail('Please draw your signature again');
    }
    // Fields the customer fills when signing (position, etc.)
    const given = (dto.fields || {}) as Record<string, unknown>;
    const customerValues: Record<string, string> = {};
    for (const f of customerFieldsOf(c.document)) {
      if (f.source === 'signer') continue; // = the signing name
      const v = String(given[f.key] ?? '')
        .trim()
        .slice(0, 300);
      if (f.required && !v) fail(`Please fill in: ${f.label || f.key}`);
      if (v && f.options?.length && !f.options.includes(v)) {
        fail(`Choose a valid option for: ${f.label || f.key}`);
      }
      if (v) customerValues[f.key] = v;
    }
    const signedAt = new Date();
    await this.repo.updateContract(c.id, {
      status: 'SIGNED',
      signedAt,
      customerValues,
      signerName: name,
      signatureImage: dto.signature,
      signerIp: meta.ip?.slice(0, 100) || null,
      signerAgent: meta.agent?.slice(0, 300) || null,
    });
    await this.repo.addEvent({
      requestId: c.requestId,
      type: 'CONTRACT_SIGNED',
      message: `Contract ${c.contractNo} signed by ${name}`,
      details: { contractId: c.id, contractNo: c.contractNo, signerName: name },
      actorId: c.request.customerId ?? null,
    });

    // Signing the contract also accepts the price that was sent with it
    const price = c.request.totalPrice;
    const accepts =
      ['PENDING', 'UNDER_NEGOTIATION'].includes(c.request.status) &&
      !!price &&
      price > 0;
    if (accepts) {
      await this.repo.updateRequest(c.requestId, { status: 'APPROVED' });
      await this.repo.addEvent({
        requestId: c.requestId,
        type: 'CUSTOMER_ACCEPTED',
        message: `Customer accepted the price of ${fmtEtb(price)} by signing the contract`,
        details: { from: c.request.status, to: 'APPROVED', price },
        actorId: c.request.customerId ?? null,
      });
    }

    void this.notifier.toAdmins({
      type: 'BOOKING',
      title: `Contract signed · ${c.request.trackingCode}`,
      message: accepts
        ? `${name} signed ${c.contractNo} and accepted ${fmtEtb(price)}. You can now record payments.`
        : `${name} signed contract ${c.contractNo}.`,
      link: this.adminLink(c.requestId),
      data: {
        requestId: c.requestId,
        trackingCode: c.request.trackingCode,
        contractId: c.id,
        kind: 'CONTRACT_SIGNED',
      },
    });
    void this.notifier.toCustomer(c.request.customerId, {
      type: 'BOOKING',
      title: accepts ? 'Booking confirmed' : 'Contract signed',
      message: accepts
        ? `${c.request.trackingCode}: thank you! Your contract is signed and your booking is confirmed.`
        : `${c.request.trackingCode}: thank you, contract ${c.contractNo} is signed.`,
      link: this.appLink(c.requestId),
      data: {
        requestId: c.requestId,
        trackingCode: c.request.trackingCode,
        kind: 'CONTRACT_SIGNED',
      },
    });
    return this.viewByToken(token);
  }

  // =====================================================================
  // Saved signature (customer profile)
  // =====================================================================

  async getMySignature(userId?: string) {
    if (!userId) fail('Please sign in', 401);
    const row = await this.repo.getUserSignature(userId!);
    if (!row) fail('User not found', 404);
    return row!;
  }

  async saveMySignature(userId: string | undefined, signature: string) {
    if (!userId) fail('Please sign in', 401);
    if (!isValidSignature(signature)) fail('Please draw your signature again');
    return this.repo.setUserSignature(userId!, signature);
  }

  async deleteMySignature(userId?: string) {
    if (!userId) fail('Please sign in', 401);
    return this.repo.setUserSignature(userId!, null);
  }

  async declineByToken(token: string, dto: DeclineContractDto) {
    const c = await this.byToken(token);
    if (!OPEN.includes(c.status))
      fail('This contract can no longer be declined');
    const reason = dto.reason?.trim() || null;
    await this.repo.updateContract(c.id, {
      status: 'DECLINED',
      declinedAt: new Date(),
      declineReason: reason,
    });
    await this.repo.addEvent({
      requestId: c.requestId,
      type: 'CONTRACT_DECLINED',
      message: `Customer declined contract ${c.contractNo}`,
      details: { contractId: c.id, reason },
      actorId: c.request.customerId ?? null,
    });
    void this.notifier.toAdmins({
      type: 'BOOKING',
      title: `Contract declined · ${c.request.trackingCode}`,
      message: `${c.request.contactName} declined ${c.contractNo}${reason ? `: “${reason}”` : ''}. Call them to agree the changes.`,
      link: this.adminLink(c.requestId),
      data: {
        requestId: c.requestId,
        trackingCode: c.request.trackingCode,
        contractId: c.id,
        kind: 'CONTRACT_DECLINED',
      },
    });
    return this.viewByToken(token);
  }
}
