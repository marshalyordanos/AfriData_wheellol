// default-template.ts
// The WHEELLOL "Car Rental Service Agreement" (doc/WHEELOL_DAB_DRT_Car_Rental_Agreement)
// turned into a dynamic template. {{…}} are fields filled from the database
// (see admin src/views/contracts/contractFields.js for the full list).
// Created automatically the first time templates are listed.

let n = 0;
const id = (p: string) => `${p}${++n}`;
const clause = (html: string) => ({ id: id('c'), html });
const p = (t: string) => `<p>${t}</p>`;

export const DEFAULT_TEMPLATE_TITLE =
  'Car Rental Service Agreement (with driver)';
export const DEFAULT_TEMPLATE_DESCRIPTION =
  'Standard WHEELLOL agreement for cars with drivers: parties, scope, Schedule A vehicle list, obligations, payment, downtime, termination and signatures.';

export function defaultTemplateDocument() {
  n = 0;
  return {
    version: 3,
    settings: {
      accent: '#09234c',
      font: 'serif',
      fontSize: 11,
      numberFormat: 'WCR/CRA/{seq}/{year}',
      currency: 'ETB',
      vatRate: 15,
      withholdingRate: 3,
      // v3: prices are VAT exclusive unless the admin switches VAT on
      pricesIncludeVat: false,
      company: {
        name: 'WHEELLOL CAR RENTALS PLC',
        shortName: 'WHEELLOL',
        address:
          'Salite Mihret, Drara Mall, 5th Floor, Office No. 508-B, Addis Ababa, Ethiopia',
        phone: '+251 912 842 224 / +251 945 652 222',
        email: '',
        tin: '',
        logoUrl: '',
      },
    },
    // Extra fields the admin fills for each booking ({{custom.key}})
    fields: [
      {
        key: 'lessee_address',
        label: 'Lessee address',
        type: 'text',
        default: '',
        required: true,
      },
      {
        key: 'lessee_tin',
        label: 'Lessee TIN',
        type: 'text',
        default: '',
        required: false,
      },
      // source: "admin" (filled when preparing) | "customer" (filled when signing)
      //         | "signer" (the name the customer signs with)
      {
        key: 'lessee_representative',
        label: 'Full name',
        type: 'text',
        default: '{{customer.name}}',
        required: true,
        source: 'signer',
      },
      {
        key: 'lessee_position',
        label: 'Position / title',
        type: 'text',
        default: '',
        required: false,
        source: 'customer',
        help: 'e.g. Director, Project Manager',
      },
      {
        key: 'lessor_representative',
        label: 'Lessor representative (signs)',
        type: 'text',
        default: '',
        required: false,
      },
      {
        key: 'lessor_position',
        label: 'Lessor representative position',
        type: 'text',
        default: 'General Manager',
        required: false,
      },
      {
        key: 'payment_due_days',
        label: 'Payment due (working days)',
        type: 'number',
        default: '5',
        required: true,
      },
      {
        key: 'notice_days',
        label: 'Days to remedy a breach',
        type: 'number',
        default: '7',
        required: true,
      },
    ],
    blocks: [
      {
        id: id('b'),
        type: 'header',
        company: '{{company.name}}',
        title: 'CAR RENTAL SERVICE AGREEMENT',
        subtitle: '{{customer.name}}',
        showLogo: true,
      },
      {
        id: id('b'),
        type: 'details',
        rows: [
          { id: id('r'), label: 'Contract No.', value: '{{contract.number}}' },
          {
            id: id('r'),
            label: 'Agreement Date',
            value: '{{contract.agreementDate}}',
          },
          {
            id: id('r'),
            label: 'Effective Date',
            value: '{{contract.effectiveDate}}',
          },
          {
            id: id('r'),
            label: 'Expiry Date / Term',
            value: '{{contract.expiryDate}} ({{booking.days}} days)',
          },
        ],
      },
      {
        id: id('b'),
        type: 'article',
        title: 'PARTIES',
        intro: p(
          'This Car Rental Service Agreement (the “Agreement”) is entered into by and between the following parties:',
        ),
        clauses: [
          clause(
            p(
              '<strong>{{company.name}}</strong>, a car-rental service provider, with its office at {{company.address}}; telephone: {{company.phone}}; (the “Lessor” or “{{company.shortName}}”).',
            ),
          ),
          clause(
            p(
              '<strong>{{customer.name}}</strong>, with office/address at {{custom.lessee_address}}; telephone: {{customer.phone}}; (the “Lessee”).',
            ),
          ),
        ],
        outro: p(
          '{{company.shortName}} and the Lessee are individually referred to as a “Party” and collectively as the “Parties.” In consideration of the mutual undertakings set out herein, the Parties agree as follows:',
        ),
      },
      {
        id: id('b'),
        type: 'article',
        title: 'PURPOSE AND SCOPE OF SERVICE',
        intro: '',
        clauses: [
          clause(
            p(
              '{{company.shortName}} shall provide the vehicle(s) specified in Schedule A, with qualified driver(s), for the Lessee’s lawful project activities, field missions, office activities, regional travel, and other business purposes agreed in writing. Purpose stated by the Lessee: {{booking.purpose}}.',
            ),
          ),
          clause(
            p(
              'The approved service order or Schedule A shall specify the vehicle type, plate number, starting dates, duration, service area, odometer/kilometer covered and any special travel requirements. Pickup: {{booking.pickupCity}} on {{booking.pickupDate}}. Service area: {{booking.destinations}}.',
            ),
          ),
          clause(
            p(
              'No vehicle, driver, period, or additional service is confirmed unless recorded in this Agreement, Schedule A, or a written service order approved by both Parties.',
            ),
          ),
        ],
        outro: '',
      },
      {
        id: id('b'),
        type: 'schedule',
        title: 'Schedule A',
        intro: p(
          'Whereas the Lessee is willing to lease a car and {{company.name}} (the Lessor) agrees to give rental service as detailed in Schedule A below,',
        ),
        columns: [
          'no',
          'driver',
          'plate',
          'location',
          'carType',
          'days',
          'rate',
          'amount',
        ],
        showTotals: true,
      },
      {
        id: id('b'),
        type: 'article',
        title: 'VEHICLE CONDITION AND DOCUMENTS',
        intro: '',
        clauses: [
          clause(
            p(
              '{{company.shortName}} represents that, to the best of its knowledge, each vehicle supplied will be roadworthy, properly maintained, and free from known defects that materially affect safe operation under normal use.',
            ),
          ),
          clause(
            p(
              '{{company.shortName}} shall provide valid vehicle registration, legally required insurance, business license and VAT registration certificates, driver’s license, and other vehicle or driver documents required by applicable law.',
            ),
          ),
        ],
        outro: '',
      },
      {
        id: id('b'),
        type: 'article',
        title: 'OBLIGATIONS OF THE LESSEE',
        intro: '',
        clauses: [
          clause(
            p(
              'Use the vehicle only for lawful business purposes and in accordance with the agreed service order.',
            ),
          ),
          clause(
            p(
              'Not overload the vehicle or carry passengers, goods, or materials beyond the vehicle’s lawful carrying capacity.',
            ),
          ),
          clause(
            p(
              'Not use or permit the vehicle to be used for illegal activity, smuggling, reckless conduct, or any prohibited purpose.',
            ),
          ),
          clause(
            p(
              'Not transfer, sublease, or make the vehicle available to a third party without {{company.shortName}}’s prior written consent. Authorised staff and passengers may use the transport service in the ordinary course of the Lessee’s business.',
            ),
          ),
          clause(
            p(
              'Not drive the vehicle or allow an unauthorised person to drive it. The vehicle shall be driven only by a driver supplied or approved in writing by {{company.shortName}}.',
            ),
          ),
          clause(p('Supply and pay for fuel consumed during the service.')),
          clause(
            p(
              'Promptly notify {{company.shortName}} of any accident, breakdown, damage, theft, delay, or safety concern and cooperate with lawful reporting and insurance procedures.',
            ),
          ),
          clause(
            p(
              'Ensure passengers observe reasonable safety instructions and do not request the driver to act unlawfully or unsafely.',
            ),
          ),
          clause(
            p(
              'Review and, where accurate, approve service confirmation forms, log sheets, or other agreed supporting documents within a reasonable time.',
            ),
          ),
        ],
        outro: '',
      },
      {
        id: id('b'),
        type: 'article',
        title: 'OBLIGATIONS OF THE LESSOR',
        intro: '',
        clauses: [
          clause(
            p(
              'Provide the vehicle(s) and qualified, appropriately licensed driver(s) for the agreed service period and working hours.',
            ),
          ),
          clause(
            p(
              'Maintain each vehicle in safe operating condition and provide legally required registration, licence, and insurance documents.',
            ),
          ),
          clause(
            p(
              'Provide appropriate emergency tools and a first-aid kit, to the extent required by applicable law and vehicle specifications.',
            ),
          ),
          clause(
            p(
              'If mechanical or technical failure not caused by the Lessee or its authorised persons prevents safe use, promptly arrange repair or a reasonably equivalent replacement vehicle, subject to availability and the service requirements.',
            ),
          ),
          clause(
            p(
              'Inform the Lessee as soon as reasonably practicable of any issue affecting service and use reasonable efforts to minimise disruption.',
            ),
          ),
          clause(
            p(
              'Ensure drivers act professionally, comply with traffic laws, and observe reasonable safety and confidentiality requirements communicated by the Lessee.',
            ),
          ),
        ],
        outro: '',
      },
      {
        id: id('b'),
        type: 'article',
        title: 'RENTAL RATE, VAT AND PAYMENT',
        intro: '',
        clauses: [
          clause(
            p(
              'The agreed rate is <strong>{{price.perDay}} {{settings.currency}}</strong> ({{price.perDayWords}} Birr) per vehicle per day, {{price.vatNote}}. The total contract amount is <strong>{{price.total}} {{settings.currency}}</strong> ({{price.totalWords}} Birr) for {{vehicles.count}} vehicle(s), as detailed in Schedule A.',
            ),
          ),
          clause(
            p(
              'Payment shall be due within {{custom.payment_due_days}} working days after the Lessee receives all required documents: (a) log sheet approved by the Lessee; (b) a valid invoice/tax invoice and legally appropriate payment document; and (c) agreed trip sheets or other supporting records, unless the Parties agree otherwise in writing.',
            ),
          ),
          clause(
            p(
              'Any withholding tax shall be deducted and remitted only as required by applicable Ethiopian law. Where required, the Lessee shall provide {{company.shortName}} with the official withholding tax certificate.',
            ),
          ),
          clause(
            p(
              'Overtime, waiting time, accommodation, per diem, parking, tolls, cleaning, and travel outside the agreed route may be charged only where approved in writing by both Parties before the relevant costs are incurred.',
            ),
          ),
        ],
        outro: '',
      },
      {
        id: id('b'),
        type: 'article',
        title: 'DOWNTIME AND OUT-OF-SERVICE POLICY',
        intro: '',
        clauses: [
          clause(
            p(
              'The Lessee shall not be liable to make payment for any day on which the vehicle is rendered non-operational due to mechanical failure, accident arising from vehicle condition, or required maintenance.',
            ),
          ),
          clause(
            p(
              'Any advance payment covering such downtime shall be deducted from the final settlement. Where downtime exceeds twenty-four (24) consecutive hours, the Lessor shall provide a replacement vehicle of equal or higher standard or accept termination of this Agreement without penalty to the Lessee.',
            ),
          ),
        ],
        outro: '',
      },
      {
        id: id('b'),
        type: 'article',
        title: 'SERVICE HOURS, DELAYS AND REPLACEMENT',
        intro: '',
        clauses: [
          clause(
            p(
              'The service period and daily working hours shall be those recorded in Schedule A or the approved service order. Overtime rates, rest periods, maximum driving hours, and regional or overnight travel arrangements must be agreed in writing before service begins.',
            ),
          ),
          clause(
            p(
              'Neither Party shall require or permit a driver to operate a vehicle in breach of law or when unsafe because of fatigue, vehicle condition, weather, or another safety concern.',
            ),
          ),
          clause(
            p(
              'Where a delay or missed service is attributable to a Party, the Parties shall promptly communicate and agree on a reasonable replacement transport or a fair service-charge adjustment where appropriate.',
            ),
          ),
        ],
        outro: '',
      },
      {
        id: id('b'),
        type: 'article',
        title: 'TERM, RENEWAL AND TERMINATION',
        intro: '',
        clauses: [
          clause(
            p(
              'This Agreement begins on the Effective Date ({{contract.effectiveDate}}) and continues until the expiry date ({{contract.expiryDate}}) unless extended or terminated under this Article.',
            ),
          ),
          clause(
            p(
              'This Agreement may be renewed or extended only by a written instrument signed by duly authorised representatives of both Parties before its expiry.',
            ),
          ),
          clause(
            p(
              'Either Party may terminate for material breach if the other Party fails to remedy the breach within {{custom.notice_days}} calendar days after receiving written notice describing it. For an immediate safety risk, unlawful use, or a breach that cannot reasonably be remedied, the affected service may be suspended immediately and the Agreement terminated by written notice, subject to applicable law.',
            ),
          ),
          clause(
            p(
              'On termination, the Lessee shall pay undisputed charges for services properly provided up to the termination date, and {{company.shortName}} shall return or collect any property of the Lessee in its possession. Any final reconciliation shall be completed within 15 working days after service provided.',
            ),
          ),
        ],
        outro: '',
      },
      {
        id: id('b'),
        type: 'article',
        title: 'FORCE MAJEURE',
        intro: '',
        clauses: [
          clause(
            p(
              'Neither Party shall be liable for delay caused by events beyond its reasonable control, such as natural disasters, civil disturbance, government restrictions, or other events that could not reasonably have been prevented. The affected Party shall notify the other promptly and take reasonable steps to reduce the impact.',
            ),
          ),
          clause(
            p(
              'If the event continues for more than thirty (30) consecutive days and materially prevents the service, either Party may terminate the affected service by written notice, subject to payment for services already provided.',
            ),
          ),
        ],
        outro: '',
      },
      {
        id: id('b'),
        type: 'article',
        title: 'DISPUTE RESOLUTION AND GOVERNING LAW',
        intro: '',
        clauses: [
          clause(
            p(
              'The Parties shall first attempt in good faith to resolve any dispute through discussion between their authorised representatives.',
            ),
          ),
          clause(
            p(
              'If the dispute is not resolved within thirty (30) days after written notice of the dispute, either Party may refer it to the competent courts of the Federal Democratic Republic of Ethiopia, unless the Parties agree in writing to another lawful dispute-resolution process.',
            ),
          ),
          clause(
            p(
              'This Agreement shall be interpreted in accordance with the laws of the Federal Democratic Republic of Ethiopia.',
            ),
          ),
        ],
        outro: '',
      },
      {
        id: id('b'),
        type: 'article',
        title: 'GENERAL PROVISIONS',
        intro: '',
        clauses: [
          clause(
            p(
              'No amendment, variation, or additional service arrangement shall be binding unless documented in writing and duly signed or formally approved by authorised representatives of both Parties.',
            ),
          ),
          clause(
            p(
              'Notices under this Agreement shall be delivered by hand, courier, or email to the official contacts listed above, or to updated contacts notified in writing.',
            ),
          ),
          clause(
            p(
              'This Agreement, together with Schedule A and any approved service orders, represents the Parties’ agreement on the subject and replaces prior discussions on the same subject to the extent of any inconsistency.',
            ),
          ),
          clause(
            p(
              'If any provision is found unenforceable, the remaining provisions shall continue to the extent permitted by law.',
            ),
          ),
          clause(
            p(
              'This Agreement is executed in two (2) original copies, one for each Party. An electronic signature made through the {{company.shortName}} online system has the same effect as a handwritten signature.',
            ),
          ),
        ],
        outro: '',
      },
      {
        id: id('b'),
        type: 'signatures',
        title: 'SIGNATURES',
        numbered: true,
        intro: p(
          'The undersigned representatives confirm that they are duly authorised to execute this Agreement on behalf of their respective organizations and acknowledge that they have reviewed and accepted its terms, together with the completed Schedule A.',
        ),
        lessor: {
          label: 'FOR THE LESSOR',
          org: '{{company.name}}',
          name: '{{custom.lessor_representative}}',
          position: '{{custom.lessor_position}}',
        },
        lessee: {
          label: 'FOR THE LESSEE',
          org: '{{customer.name}}',
          name: '{{custom.lessee_representative}}',
          position: '{{custom.lessee_position}}',
        },
      },
    ],
  };
}
