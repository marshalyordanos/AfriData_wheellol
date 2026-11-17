// Ready-made articles admins can drop into any contract, then edit.
import { uid } from "./contractFields";

const p = (t) => `<p>${t}</p>`;

const LIBRARY = [
  {
    key: "parties",
    title: "PARTIES",
    category: "Basics",
    intro: p("This Agreement is entered into by and between the following parties:"),
    clauses: [
      p("<strong>{{company.name}}</strong>, with its office at {{company.address}}; telephone: {{company.phone}}; (the “Lessor”)."),
      p("<strong>{{customer.name}}</strong>, telephone: {{customer.phone}}; (the “Lessee”)."),
    ],
  },
  {
    key: "scope",
    title: "PURPOSE AND SCOPE OF SERVICE",
    category: "Basics",
    clauses: [
      p("The Lessor shall provide {{vehicles.count}} vehicle(s) with qualified driver(s) for {{booking.purpose}}."),
      p("Pickup is in {{booking.pickupCity}} on {{booking.pickupDate}}; the service area is {{booking.destinations}}; the rental period is {{booking.days}} days, ending on {{booking.returnDate}}."),
    ],
  },
  {
    key: "payment-schedule",
    title: "PAYMENT SCHEDULE",
    category: "Money",
    intro: p("The total contract amount is <strong>{{price.total}} {{settings.currency}}</strong> ({{price.totalWords}} Birr), payable as follows:"),
    clauses: [
      p("Ten percent (10%) advance payment on confirmation of the booking."),
      p("Forty percent (40%) at vehicle pickup, bringing the total paid to fifty percent (50%)."),
      p("Twenty-five percent (25%) mid-way through the rental period."),
      p("The remaining balance on or before the return date ({{booking.returnDate}})."),
      p("Payments may be made in cash, by telebirr, Chapa or bank transfer. Each payment shall be acknowledged with a receipt."),
    ],
  },
  {
    key: "deposit",
    title: "SECURITY DEPOSIT",
    category: "Money",
    clauses: [
      p("The Lessee shall pay a refundable security deposit of [amount] {{settings.currency}} before the vehicle is released."),
      p("The deposit shall be returned within seven (7) working days after the vehicle is returned, less any agreed charges for damage, fuel, fines or extra days."),
    ],
  },
  {
    key: "fuel",
    title: "FUEL POLICY",
    category: "Operations",
    clauses: [
      p("Fuel consumed during the service shall be supplied and paid for by the Lessee, unless otherwise agreed in writing."),
      p("The vehicle is delivered with [level] fuel and shall be returned with the same level; any difference shall be settled at the current market price."),
    ],
  },
  {
    key: "mileage",
    title: "MILEAGE AND ROUTE",
    category: "Operations",
    clauses: [
      p("The vehicle shall operate within the agreed service area ({{booking.destinations}})."),
      p("Travel outside the agreed route or above [km] kilometres per day requires prior written approval and may be charged at [rate] {{settings.currency}} per kilometre."),
    ],
  },
  {
    key: "driver",
    title: "DRIVER, WORKING HOURS AND ALLOWANCES",
    category: "Operations",
    clauses: [
      p("The Lessor provides a qualified, licensed driver for each vehicle. Normal working hours are from [08:00] to [18:00]."),
      p("Overtime, night travel, accommodation and per diem for the driver shall be agreed in writing before they are incurred."),
      p("The driver shall follow traffic laws and refuse any unsafe or unlawful instruction."),
    ],
  },
  {
    key: "insurance",
    title: "INSURANCE, DAMAGE AND LIABILITY",
    category: "Risk",
    clauses: [
      p("The Lessor keeps each vehicle insured as required by Ethiopian law."),
      p("The Lessee is liable for loss or damage caused by its negligence, misuse, or breach of this Agreement, to the extent not covered by insurance."),
      p("Accidents, theft or damage must be reported to the Lessor and the police immediately, and in any case within twenty-four (24) hours."),
    ],
  },
  {
    key: "fines",
    title: "TRAFFIC FINES AND TOLLS",
    category: "Risk",
    clauses: [
      p("Parking fees, tolls and road charges incurred during the service are paid by the Lessee unless agreed otherwise."),
      p("Traffic fines caused by the driver's own fault are the responsibility of the Lessor."),
    ],
  },
  {
    key: "cancellation",
    title: "CANCELLATION AND REFUND",
    category: "Money",
    clauses: [
      p("The Lessee may cancel free of charge up to [72] hours before the pickup date ({{booking.pickupDate}})."),
      p("Cancellations made later than that forfeit the advance payment, unless the Lessor agrees otherwise in writing."),
      p("If the Lessor cannot provide the vehicle, all payments made shall be refunded in full within seven (7) working days."),
    ],
  },
  {
    key: "late-return",
    title: "EXTENSION AND LATE RETURN",
    category: "Operations",
    clauses: [
      p("Any extension of the rental period must be requested at least twenty-four (24) hours before {{booking.returnDate}} and confirmed in writing."),
      p("Extra days are charged at {{price.perDay}} {{settings.currency}} per vehicle per day unless another rate is agreed."),
    ],
  },
  {
    key: "confidentiality",
    title: "CONFIDENTIALITY",
    category: "Legal",
    clauses: [
      p("Each Party shall keep confidential any information about the other Party's business, staff and travel that it learns under this Agreement, except where disclosure is required by law."),
    ],
  },
  {
    key: "force-majeure",
    title: "FORCE MAJEURE",
    category: "Legal",
    clauses: [
      p("Neither Party shall be liable for delay or failure caused by events beyond its reasonable control, such as natural disasters, civil unrest or government restrictions."),
      p("If such an event continues for more than thirty (30) days, either Party may terminate the affected service by written notice, subject to payment for services already provided."),
    ],
  },
  {
    key: "law",
    title: "DISPUTE RESOLUTION AND GOVERNING LAW",
    category: "Legal",
    clauses: [
      p("The Parties shall first try to settle any dispute amicably through negotiation."),
      p("Disputes not settled within thirty (30) days may be referred to the competent courts of the Federal Democratic Republic of Ethiopia, whose laws govern this Agreement."),
    ],
  },
  {
    key: "termination",
    title: "TERMINATION",
    category: "Legal",
    clauses: [
      p("Either Party may terminate this Agreement for material breach if the breach is not remedied within seven (7) days after written notice."),
      p("On termination, the Lessee pays for services properly provided up to the termination date."),
    ],
  },
  {
    key: "general",
    title: "GENERAL PROVISIONS",
    category: "Legal",
    clauses: [
      p("Amendments are binding only when made in writing and signed or approved by authorised representatives of both Parties."),
      p("This Agreement may be signed electronically. An electronic signature has the same effect as a handwritten signature."),
    ],
  },
];

export const LIBRARY_CATEGORIES = [...new Set(LIBRARY.map((a) => a.category))];
export const articleLibrary = LIBRARY;

/** A new article block from a library entry. */
export const articleFromLibrary = (entry) => ({
  id: uid("b"),
  type: "article",
  title: entry.title,
  intro: entry.intro || "",
  clauses: (entry.clauses || []).map((html) => ({ id: uid("c"), html })),
  outro: entry.outro || "",
});

/** Empty blocks of each type (used by the "Add block" menu). */
export const newBlock = (type) => {
  switch (type) {
    case "header":
      return { id: uid("b"), type, company: "{{company.name}}", title: "AGREEMENT", subtitle: "{{customer.name}}", showLogo: true };
    case "details":
      return {
        id: uid("b"),
        type,
        rows: [
          { id: uid("r"), label: "Contract No.", value: "{{contract.number}}" },
          { id: uid("r"), label: "Agreement Date", value: "{{contract.agreementDate}}" },
        ],
      };
    case "article":
      return { id: uid("b"), type, title: "NEW ARTICLE", intro: "", clauses: [{ id: uid("c"), html: "<p></p>" }], outro: "" };
    case "text":
      return { id: uid("b"), type, html: "<p></p>" };
    case "schedule":
      return {
        id: uid("b"),
        type,
        title: "Schedule A",
        intro: "",
        columns: ["no", "driver", "plate", "location", "carType", "days", "rate", "amount"],
        showTotals: true,
      };
    case "signatures":
      return {
        id: uid("b"),
        type,
        title: "SIGNATURES",
        numbered: true,
        intro: "<p>The undersigned confirm that they are authorised to sign this Agreement.</p>",
        lessor: { label: "FOR THE LESSOR", org: "{{company.name}}", name: "", position: "" },
        lessee: { label: "FOR THE LESSEE", org: "{{customer.name}}", name: "{{customer.name}}", position: "" },
      };
    case "pageBreak":
      return { id: uid("b"), type };
    default:
      return null;
  }
};

export const BLOCK_TYPES = [
  { type: "article", label: "Article", hint: "Numbered heading with clauses 1.1, 1.2…" },
  { type: "text", label: "Paragraph", hint: "Free text, not numbered" },
  { type: "details", label: "Details table", hint: "Label / value rows (contract no., dates…)" },
  { type: "schedule", label: "Vehicle schedule", hint: "Cars, drivers, days, price, VAT totals" },
  { type: "signatures", label: "Signatures", hint: "Lessor and lessee signature boxes" },
  { type: "header", label: "Title / letterhead", hint: "Company, contract title, logo" },
  { type: "pageBreak", label: "Page break", hint: "Start a new page when printed" },
];
