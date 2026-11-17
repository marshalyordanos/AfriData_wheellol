// Fields that can be placed in a contract as {{key}}. Values come from the
// database (booking request, customer, cars, payments), the template settings
// (company), the contract itself, or custom fields the admin fills per booking.
import dayjs from "dayjs";

export const uid = (p = "x") => `${p}${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;

const DATE = "DD/MM/YYYY";
export const fmtDate = (d) => (d ? dayjs(d).format(DATE) : "");
export const fmtMoney = (n) =>
  n === null || n === undefined || Number.isNaN(Number(n))
    ? ""
    : Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/* ------------------------------------------------------------------ number → words */
const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const under1000 = (n) => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (r) parts.push(r < 20 ? ONES[r] : `${TENS[Math.floor(r / 10)]}${r % 10 ? `-${ONES[r % 10]}` : ""}`);
  return parts.join(" ");
};
export const numberToWords = (value) => {
  const num = Math.abs(Number(value) || 0);
  let whole = Math.floor(num);
  const cents = Math.round((num - whole) * 100);
  if (!whole && !cents) return "Zero";
  const scales = ["", "Thousand", "Million", "Billion", "Trillion"];
  const parts = [];
  for (let i = 0; whole > 0 && i < scales.length; i++) {
    const chunk = whole % 1000;
    if (chunk) parts.unshift(`${under1000(chunk)}${scales[i] ? ` ${scales[i]}` : ""}`);
    whole = Math.floor(whole / 1000);
  }
  const words = parts.join(" ") || "Zero";
  return cents ? `${words} and ${String(cents).padStart(2, "0")}/100` : words;
};

/* ------------------------------------------------------------------ vehicle schedule */
export const SCHEDULE_COLUMNS = {
  no: { label: "S/No.", align: "center" },
  driver: { label: "Driver Name" },
  plate: { label: "Plate No." },
  vehicle: { label: "Vehicle" },
  carType: { label: "Car Type" },
  location: { label: "Assigned Location" },
  days: { label: "Number of Days", align: "center" },
  rate: { label: "Price Per Day", align: "right" },
  amount: { label: "Amount", align: "right" },
};
export const SCHEDULE_COLUMN_ORDER = Object.keys(SCHEDULE_COLUMNS);

const carLabel = (car) => [car?.make?.name, car?.model?.name, car?.year].filter(Boolean).join(" ");

/** One row per requested car; the agreed price is split evenly as a starting point. */
export const defaultScheduleRows = (request) => {
  const cars = request?.cars?.length ? request.cars.map((c) => c.car) : [null];
  const days = Math.max(Number(request?.days) || 1, 1);
  const evenRate = request?.totalPrice > 0 ? round2(request.totalPrice / days / cars.length) : 0;
  // Per-car customer prices from the agreement are used when every car has one
  const perCar = request?.cars?.length && request.cars.every((c) => c.price > 0);
  return cars.map((car, i) => ({
    id: uid("row"),
    carId: car?.id || null,
    vehicle: carLabel(car),
    driver: "",
    plate: car?.licensePlate || "",
    carType: car?.carType?.name || "",
    location: (request?.destinations || []).join(", "),
    days,
    rate: perCar ? round2(request.cars[i].price / days) : evenRate,
  }));
};

/** VAT is excluded unless the contract switches it on. */
export const isVatIncluded = (settings = {}) => settings.pricesIncludeVat === true;

export const scheduleTotals = (rows = [], settings = {}) => {
  const vatRate = Number(settings.vatRate ?? 15) || 0;
  const whRate = Number(settings.withholdingRate ?? 0) || 0;
  const sum = round2(rows.reduce((s, r) => s + (Number(r.days) || 0) * (Number(r.rate) || 0), 0));
  // The total is always the sum of the rows (= the agreed price).
  // VAT included → the VAT is shown inside that total.
  // VAT exclusive (default) → no VAT is added; the contract says so clearly.
  const vatIncluded = isVatIncluded(settings);
  const gross = sum;
  const beforeVat = vatIncluded ? round2(sum / (1 + vatRate / 100)) : sum;
  /* Old: VAT exclusive added VAT on top of the rows
  if (settings.pricesIncludeVat !== false) { gross = sum; beforeVat = sum / (1 + vat) }
  else { beforeVat = sum; gross = sum * (1 + vat) }
  */
  const vat = round2(gross - beforeVat);
  const withholding = round2(beforeVat * (whRate / 100));
  return {
    sum,
    gross,
    beforeVat,
    vat,
    withholding,
    net: round2(gross - withholding),
    vatRate: vatIncluded ? vatRate : 0,
    whRate,
    vatIncluded,
  };
};

/* ------------------------------------------------------------------ catalog */
// `sample` is used in the template builder preview.
export const FIELD_GROUPS = [
  {
    key: "company",
    label: "Company (Lessor)",
    fields: [
      { key: "company.name", label: "Company name", sample: "WHEELLOL CAR RENTALS PLC" },
      { key: "company.shortName", label: "Company short name", sample: "WHEELLOL" },
      { key: "company.address", label: "Company address", sample: "Salite Mihret, Drara Mall, Addis Ababa" },
      { key: "company.phone", label: "Company phone", sample: "+251 912 842 224" },
      { key: "company.email", label: "Company email", sample: "info@wheellol.com" },
      { key: "company.tin", label: "Company TIN", sample: "0012345678" },
    ],
  },
  {
    key: "contract",
    label: "Contract",
    fields: [
      { key: "contract.number", label: "Contract number", sample: "WCR/CRA/001/2026" },
      { key: "contract.title", label: "Contract title", sample: "Car Rental Service Agreement" },
      { key: "contract.agreementDate", label: "Agreement date", sample: "13/11/2026" },
      { key: "contract.effectiveDate", label: "Effective date", sample: "01/12/2026" },
      { key: "contract.expiryDate", label: "Expiry date", sample: "15/12/2026" },
      { key: "contract.today", label: "Today's date", sample: "13/11/2026" },
    ],
  },
  {
    key: "customer",
    label: "Customer (Lessee)",
    fields: [
      { key: "customer.name", label: "Customer name", sample: "Sample Customer PLC" },
      { key: "customer.phone", label: "Customer phone", sample: "0911 223 344" },
      { key: "customer.email", label: "Customer email", sample: "customer@example.com" },
    ],
  },
  {
    key: "booking",
    label: "Booking request",
    fields: [
      { key: "booking.code", label: "Request code", sample: "WL-2026-ABC123" },
      { key: "booking.pickupCity", label: "Pickup city", sample: "Addis Ababa" },
      { key: "booking.destinations", label: "Destinations", sample: "Afar, Oromia" },
      { key: "booking.purpose", label: "Purpose of trip", sample: "Field mission" },
      { key: "booking.pickupDate", label: "Pickup date", sample: "01/12/2026" },
      { key: "booking.returnDate", label: "Return date", sample: "15/12/2026" },
      { key: "booking.days", label: "Number of days", sample: "15" },
      { key: "booking.daysWords", label: "Number of days (words)", sample: "Fifteen" },
      { key: "booking.ruralAccess", label: "Rural kebeles (Yes/No)", sample: "No" },
      { key: "booking.note", label: "Customer note", sample: "Early start please" },
      { key: "booking.requestedOn", label: "Requested on", sample: "10/11/2026" },
    ],
  },
  {
    key: "vehicles",
    label: "Vehicles & drivers",
    fields: [
      { key: "vehicles.count", label: "Number of vehicles", sample: "2" },
      { key: "vehicles.list", label: "Vehicle list", sample: "Toyota Land Cruiser 2020 (AA-03-A61524), Nissan Patrol 2019 (AA-03-34498)" },
      { key: "vehicles.plates", label: "Plate numbers", sample: "AA-03-A61524, AA-03-34498" },
      { key: "vehicles.types", label: "Car types", sample: "Long Base, SUV" },
      { key: "vehicles.drivers", label: "Driver names", sample: "Behaylu Mersha, Ermiyas Elias" },
    ],
  },
  {
    key: "price",
    label: "Price & payment",
    fields: [
      { key: "price.total", label: "Total amount", sample: "225,000.00" },
      { key: "price.totalWords", label: "Total amount (words)", sample: "Two Hundred Twenty-Five Thousand" },
      { key: "price.perDay", label: "Price per vehicle per day", sample: "7,500.00" },
      { key: "price.perDayWords", label: "Price per day (words)", sample: "Seven Thousand Five Hundred" },
      { key: "price.beforeVat", label: "Amount before VAT", sample: "195,652.17" },
      { key: "price.vat", label: "VAT amount", sample: "29,347.83" },
      { key: "price.withholding", label: "Withholding tax", sample: "5,869.57" },
      { key: "price.net", label: "Net payable", sample: "219,130.43" },
      { key: "price.vatNote", label: "VAT note", sample: "including 15% VAT" },
      { key: "price.paid", label: "Paid so far", sample: "22,500.00" },
      { key: "price.balance", label: "Balance", sample: "202,500.00" },
      { key: "settings.currency", label: "Currency", sample: "ETB" },
      { key: "settings.vatRate", label: "VAT rate %", sample: "15" },
      { key: "settings.withholdingRate", label: "Withholding rate %", sample: "3" },
    ],
  },
];

/* ------------------------------------------------------------------ who fills a custom field */
// "admin": filled when preparing · "customer": typed by the customer when signing
// "signer": the name the customer signs with (pre-filled with the customer's name)
export const FIELD_SOURCES = [
  { value: "admin", label: "Admin, when preparing" },
  { value: "customer", label: "Customer, when signing" },
  { value: "signer", label: "Customer's signing name" },
];
export const isCustomerField = (f) => f?.source === "customer" || f?.source === "signer";
export const customerFieldMap = (document) =>
  Object.fromEntries((document?.fields || []).filter(isCustomerField).map((f) => [f.key, f]));
export const adminFields = (document) => (document?.fields || []).filter((f) => !isCustomerField(f));

const BUILTIN = Object.fromEntries(FIELD_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f])));

/** Label for any key (built-in or custom). */
export const fieldLabel = (key, document) => {
  if (BUILTIN[key]) return BUILTIN[key].label;
  if (key.startsWith("custom.")) {
    const f = (document?.fields || []).find((x) => `custom.${x.key}` === key);
    return f?.label || key.slice(7);
  }
  return key;
};

export const customFieldGroup = (document) => ({
  key: "custom",
  label: "Custom fields (filled per booking)",
  fields: (document?.fields || []).map((f) => ({
    key: `custom.${f.key}`,
    label: f.label,
    sample: isCustomerField(f) ? "Filled by the customer when signing" : f.default || `[${f.label}]`,
  })),
});

export const slugKey = (label) =>
  String(label || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "field";

/* ------------------------------------------------------------------ values */
/** Values filled for one booking: dates, custom fields, schedule rows. */
export const defaultValues = (document, request) => {
  const days = Math.max(Number(request?.days) || 1, 1);
  const start = request?.pickupDate ? dayjs(request.pickupDate) : dayjs();
  return {
    initialized: true,
    meta: {
      agreementDate: dayjs().toISOString(),
      effectiveDate: start.toISOString(),
      expiryDate: start.add(days - 1, "day").toISOString(),
    },
    fields: Object.fromEntries(adminFields(document).map((f) => [f.key, f.default ?? ""])),
    schedule: { rows: defaultScheduleRows(request) },
  };
};

/** Make sure values have every custom field (template may have changed). */
export const normalizeValues = (values, document, request) => {
  if (!values?.initialized) return defaultValues(document, request);
  const fields = { ...(values.fields || {}) };
  adminFields(document).forEach((f) => {
    if (fields[f.key] === undefined) fields[f.key] = f.default ?? "";
  });
  return {
    ...values,
    meta: values.meta || {},
    fields,
    schedule: { rows: values.schedule?.rows || defaultScheduleRows(request) },
  };
};

/* ------------------------------------------------------------------ context */
const SAMPLE_REQUEST = {
  trackingCode: "WL-2026-ABC123",
  contactName: "Sample Customer PLC",
  contactPhone: "0911 223 344",
  contactEmail: "customer@example.com",
  pickupCity: "Addis Ababa",
  destinations: ["Afar", "Oromia"],
  purpose: "Field mission",
  ruralAccess: false,
  pickupDate: dayjs().add(14, "day").startOf("day").toISOString(),
  days: 15,
  note: "",
  totalPrice: 225000,
  paidAmount: 22500,
  balance: 202500,
  createdAt: dayjs().subtract(2, "day").toISOString(),
  cars: [
    { car: { id: "s1", make: { name: "Toyota" }, model: { name: "Land Cruiser" }, year: 2020, licensePlate: "AA-03-A61524", carType: { name: "Long Base" } } },
    { car: { id: "s2", make: { name: "Nissan" }, model: { name: "Patrol" }, year: 2019, licensePlate: "AA-03-34498", carType: { name: "SUV" } } },
  ],
};
export const sampleRequest = () => SAMPLE_REQUEST;

/**
 * Everything a contract can show, as a flat map of key → text.
 * `values` are the per-booking values (see defaultValues).
 */
export const buildContext = ({ document, request, values, contract }) => {
  const settings = document?.settings || {};
  const company = settings.company || {};
  const req = request || SAMPLE_REQUEST;
  const v = normalizeValues(values, document, req);
  const rows = v.schedule.rows || [];
  const totals = scheduleTotals(rows, settings);
  const days = Math.max(Number(req.days) || 1, 1);
  const end = req.pickupDate ? dayjs(req.pickupDate).add(days - 1, "day") : null;

  const hasRows = rows.length && totals.sum > 0;
  const manual = Number(v.meta?.totalPrice) || 0;
  // const total = hasRows ? totals.gross : manual || req.totalPrice || 0;
  const total = hasRows ? totals.gross : req.totalPrice || manual || 0;
  const rates = rows.map((r) => Number(r.rate) || 0).filter(Boolean);
  const perDay = rates.length
    ? rates.every((x) => x === rates[0])
      ? rates[0]
      : round2(rates.reduce((a, b) => a + b, 0) / rates.length)
    : req.totalPrice
      ? round2(req.totalPrice / days / Math.max(req.cars?.length || 1, 1))
      : 0;
  const vatRate = Number(settings.vatRate ?? 15) || 0;

  const ctx = {
    "company.name": company.name,
    "company.shortName": company.shortName || company.name,
    "company.address": company.address,
    "company.phone": company.phone,
    "company.email": company.email,
    "company.tin": company.tin,

    "contract.number": contract?.contractNo || (request ? "" : "WCR/CRA/001/2026"),
    "contract.title": contract?.title || "",
    "contract.agreementDate": fmtDate(v.meta.agreementDate),
    "contract.effectiveDate": fmtDate(v.meta.effectiveDate),
    "contract.expiryDate": fmtDate(v.meta.expiryDate),
    "contract.today": fmtDate(new Date()),

    "customer.name": req.contactName,
    "customer.phone": req.contactPhone,
    "customer.email": req.contactEmail,

    "booking.code": req.trackingCode,
    "booking.pickupCity": req.pickupCity,
    "booking.destinations": (req.destinations || []).join(", "),
    "booking.purpose": req.purpose,
    "booking.pickupDate": fmtDate(req.pickupDate),
    "booking.returnDate": fmtDate(end),
    "booking.days": String(days),
    "booking.daysWords": numberToWords(days),
    "booking.ruralAccess": req.ruralAccess ? "Yes" : "No",
    "booking.note": req.note,
    "booking.requestedOn": fmtDate(req.createdAt),

    "vehicles.count": String(rows.length || req.cars?.length || 0),
    "vehicles.list": rows
      .map((r) => [r.vehicle || r.carType, r.plate && `(${r.plate})`].filter(Boolean).join(" "))
      .filter(Boolean)
      .join(", "),
    "vehicles.plates": rows.map((r) => r.plate).filter(Boolean).join(", "),
    "vehicles.types": [...new Set(rows.map((r) => r.carType).filter(Boolean))].join(", "),
    "vehicles.drivers": rows.map((r) => r.driver).filter(Boolean).join(", "),

    "price.total": total ? fmtMoney(total) : "",
    "price.totalWords": total ? numberToWords(total) : "",
    "price.perDay": perDay ? fmtMoney(perDay) : "",
    "price.perDayWords": perDay ? numberToWords(perDay) : "",
    "price.beforeVat": hasRows ? fmtMoney(totals.beforeVat) : "",
    "price.vat": hasRows ? fmtMoney(totals.vat) : "",
    "price.withholding": hasRows ? fmtMoney(totals.withholding) : "",
    "price.net": hasRows ? fmtMoney(totals.net) : "",
    "price.vatNote": isVatIncluded(settings)
      ? vatRate
        ? `including ${vatRate}% VAT`
        : "VAT not applicable"
      : "VAT exclusive (VAT not included)",
    "price.paid": fmtMoney(req.paidAmount || 0),
    "price.balance": req.balance !== null && req.balance !== undefined ? fmtMoney(req.balance) : "",
    "settings.currency": settings.currency || "ETB",
    "settings.vatRate": String(vatRate),
    "settings.withholdingRate": String(Number(settings.withholdingRate ?? 0) || 0),
  };
  (document?.fields || []).forEach((f) => {
    const val = v.fields[f.key];
    ctx[`custom.${f.key}`] = f.type === "date" && val ? fmtDate(val) : val;
  });
  return { ctx, rows, totals, settings, values: v };
};

/** Keys used in a document, e.g. to warn about empty fields before sending. */
export const usedKeys = (document) => {
  const text = JSON.stringify(document?.blocks || []);
  return [...new Set([...text.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map((m) => m[1]))];
};

export const missingKeys = (document, ctx) =>
  usedKeys(document).filter((k) => {
    if (k.startsWith("custom.") && customerFieldMap(document)[k.slice(7)]) return false; // customer fills it
    const v = ctx[k];
    return v === undefined || v === null || String(v).trim() === "";
  });
