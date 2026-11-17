// Car catalog for Ethiopia: car types, makes and models, with the names people
// use locally (Cobra, Abadula, Dolphin, Hardtop, V8, Pick-up …).
//
// Pictures come from Wikipedia / Wikimedia Commons (freely licensed):
//   files:   exact Commons file names tried first
//   wiki:    English Wikipedia article title → its lead picture
//   commons: search text on Wikimedia Commons → first matching picture
//   logoFiles: exact Commons file names tried first; logo: search text as fallback
// Credits for every picture are written to car-catalog-credits.json.
//
// Used by scripts/seed-car-catalog.js — safe to run again (it updates, never duplicates).

const types = [
  { name: 'Small car', description: 'Vitz, Yaris, Swift — cheap and easy in city traffic', files: ['File:Toyota Vitz, Korle-Klottey (P1100243).jpg', 'File:Toyota Vitz (XP90&XP130) front.JPG'], commons: 'Toyota Vitz 2005' },
  { name: 'Sedan', description: 'Corolla, Axio, Camry — comfortable for city and long trips', wiki: 'Toyota Corolla (E120)' },
  { name: 'SUV', description: 'RAV4, Rush, Tucson — higher seat, more space', wiki: 'Toyota RAV4' },
  { name: '4x4 / Off-road', description: 'Land Cruiser (Cobra, V8, Hardtop), Prado — for rough roads and field trips', wiki: 'Toyota Land Cruiser (J80)' },
  { name: 'Pickup', description: 'Hilux, D-Max, Navara — for goods and rough roads', wiki: 'Toyota Hilux' },
  { name: 'Minibus', description: 'HiAce (Abadula, Dolphin, High Roof) — 10–14 seats for groups', wiki: 'Toyota HiAce (H200)' },
  { name: 'Bus', description: 'Coaster — 22–30 seats for big groups and events', wiki: 'Toyota Coaster' },
  { name: 'Van', description: 'H-1, Sprinter — for families, luggage and staff transport', wiki: 'Hyundai Starex' },
  { name: 'Luxury & wedding', description: 'Mercedes-Benz, Land Cruiser V8 — weddings and VIP guests', wiki: 'Mercedes-Benz S-Class' },
  { name: 'Electric', description: 'BYD, Volkswagen ID — quiet, no fuel queues', wiki: 'Volkswagen ID.4' },
  { name: 'Taxi', description: 'City taxi with driver — Vitz, Corolla, minibus taxi', commons: 'Addis Ababa taxi' },
];

const makes = [
  {
    name: 'Toyota',
    logoFiles: ['File:Toyota carlogo.svg', 'File:Toyota logo.png'],
    logo: 'Toyota logo',
    models: [
      { name: 'Vitz', localName: 'Vitz', files: ['File:Toyota Vitz, Korle-Klottey (P1100243).jpg', 'File:Toyota Vitz (XP90&XP130) front.JPG'], commons: 'Toyota Vitz 2005' },
      { name: 'Yaris', localName: 'Yaris', wiki: 'Toyota Yaris (XP130)' },
      { name: 'Corolla', wiki: 'Toyota Corolla (E120)' },
      { name: 'Corolla Axio', localName: 'Axio', wiki: 'Toyota Corolla (E160)' },
      { name: 'Camry', wiki: 'Toyota Camry' },
      { name: 'RAV4', wiki: 'Toyota RAV4' },
      { name: 'Rush', wiki: 'Toyota Rush' },
      { name: 'Fortuner', wiki: 'Toyota Fortuner' },
      { name: 'Land Cruiser 80', localName: 'Cobra', files: ['File:1996 Toyota Land Cruiser 80 4.2 VX in Dark Emerald Pearl, front right.jpg'], commons: 'Toyota Land Cruiser 80 series' },
      { name: 'Land Cruiser 100 / 105', localName: 'Cobra', commons: 'Toyota Land Cruiser 100 series' },
      { name: 'Land Cruiser 70', localName: 'Hardtop', wiki: 'Toyota Land Cruiser (J70)' },
      { name: 'Land Cruiser 200', localName: 'V8', files: ['File:2014 Toyota Land Cruiser 200 VX V8 in Black, front right.jpg'], commons: 'Toyota Land Cruiser 200 V8' },
      { name: 'Land Cruiser 300', localName: 'LC 300', wiki: 'Toyota Land Cruiser (J300)' },
      { name: 'Land Cruiser Prado', localName: 'Prado', commons: 'Toyota Land Cruiser Prado 150' },
      { name: 'Hilux', localName: 'Pick-up', wiki: 'Toyota Hilux' },
      { name: 'HiAce', localName: 'Abadula · Dolphin · High Roof', wiki: 'Toyota HiAce (H200)' },
      { name: 'Coaster', localName: 'Coaster', wiki: 'Toyota Coaster' },
    ],
  },
  {
    name: 'Hyundai',
    logoFiles: ['File:Hyundai Motor Company logo.svg'],
    logo: 'Hyundai Motor Company logo',
    models: [
      { name: 'i10', wiki: 'Hyundai i10' },
      { name: 'Accent', wiki: 'Hyundai Accent' },
      { name: 'Elantra', wiki: 'Hyundai Elantra' },
      { name: 'Creta', wiki: 'Hyundai Creta' },
      { name: 'Tucson', wiki: 'Hyundai Tucson' },
      { name: 'Santa Fe', wiki: 'Hyundai Santa Fe' },
      { name: 'H-1', localName: 'H-1 van', wiki: 'Hyundai Starex' },
    ],
  },
  {
    name: 'Suzuki',
    logoFiles: ['File:Suzuki logo 2.svg', 'File:Suzuki logo 2025.svg'],
    logo: 'Suzuki logo',
    models: [
      { name: 'Alto', wiki: 'Suzuki Alto' },
      { name: 'Swift', wiki: 'Suzuki Swift' },
      { name: 'Dzire', wiki: 'Suzuki Dzire' },
      { name: 'Grand Vitara', wiki: 'Suzuki Grand Vitara' },
    ],
  },
  {
    name: 'Nissan',
    logoFiles: ['File:Nissan 2020 logo.svg', 'File:Nissan logo.svg'],
    logo: 'Nissan logo',
    models: [
      { name: 'Sunny', wiki: 'Nissan Sunny' },
      { name: 'X-Trail', wiki: 'Nissan X-Trail' },
      { name: 'Navara', localName: 'Pick-up', wiki: 'Nissan Navara' },
      { name: 'Patrol', wiki: 'Nissan Patrol' },
    ],
  },
  {
    name: 'Mitsubishi',
    logoFiles: ['File:Mitsubishi logo.svg'],
    logo: 'Mitsubishi logo',
    models: [
      { name: 'Pajero', wiki: 'Mitsubishi Pajero' },
      { name: 'L200', localName: 'Pick-up', wiki: 'Mitsubishi Triton' },
    ],
  },
  {
    name: 'Isuzu',
    logoFiles: ['File:Isuzu wordmark.svg'],
    logo: 'Isuzu logo',
    models: [{ name: 'D-Max', localName: 'Pick-up', wiki: 'Isuzu D-Max' }],
  },
  {
    name: 'Ford',
    logoFiles: ['File:Ford logo flat.svg', 'File:Ford Motor Company Logo.svg'],
    logo: 'Ford Motor Company logo',
    models: [{ name: 'Ranger', localName: 'Pick-up', wiki: 'Ford Ranger' }],
  },
  {
    name: 'Mercedes-Benz',
    logoFiles: ['File:Mercedes-Benz Star 2022.svg', 'File:Mercedes-Logo.svg', 'File:Mercedes-Benz Logo 2010.svg'],
    logo: 'Mercedes-Benz logo',
    models: [
      { name: 'E-Class', wiki: 'Mercedes-Benz E-Class' },
      { name: 'S-Class', wiki: 'Mercedes-Benz S-Class' },
      { name: 'G-Class', localName: 'G-Wagon', wiki: 'Mercedes-Benz G-Class' },
      { name: 'Sprinter', wiki: 'Mercedes-Benz Sprinter' },
    ],
  },
  {
    name: 'Volkswagen',
    logoFiles: ['File:Volkswagen logo 2019.svg'],
    logo: 'Volkswagen logo',
    models: [
      { name: 'ID.4', wiki: 'Volkswagen ID.4' },
      { name: 'ID.6', wiki: 'Volkswagen ID.6' },
    ],
  },
  {
    name: 'BYD',
    logoFiles: ['File:BYD Auto Logo.svg', 'File:BYD Auto 2022 logo.svg'],
    logo: 'BYD Auto logo',
    models: [
      // not the HiAce "Dolphin" — this is the BYD electric hatchback
      { name: 'Dolphin', localName: 'BYD Dolphin (electric)', wiki: 'BYD Dolphin' },
      { name: 'Seagull', wiki: 'BYD Seagull' },
      { name: 'Atto 3', wiki: 'BYD Atto 3' },
    ],
  },
  {
    name: 'Lada', // no reliable free logo on Commons → no logo
    models: [{ name: '2107', localName: 'Blue-and-white taxi', wiki: 'Lada Riva' }],
  },
];

module.exports = { types, makes };
