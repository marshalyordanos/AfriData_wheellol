// The 11 supplier cars (photos + owner folders from "Wheellol Vehicle Full Documents").
// Names follow the Ethiopian catalog (prisma/seed-data/car-catalog.js): make = "Toyota",
// model = "Land Cruiser 70" (Hardtop), "Land Cruiser 80" (Cobra), "Land Cruiser 100 / 105" (Cobra) …
//
// check: true  → guessed from ONE photo, please confirm (model, year, plate, seats, colour) before going live.
// phone: null  → owner phone not known yet; the script makes a placeholder number (09000000NN)
//                 that you can replace later in admin → Suppliers.
module.exports = [
  { key: 'adisalem-wolde', folder: 'Adisalem Wolde', owner: 'Adisalem Wolde',
    make: 'Toyota', model: 'Land Cruiser 70', carType: '4x4 / Off-road',
    year: 2010, color: 'White', plate: 'A44820A', seats: 9, transmission: 'MANUAL', phone: null, check: true },
  { key: 'ashenafi', folder: 'Ashenafi', owner: 'Ashenafi',
    make: 'Toyota', model: 'Land Cruiser 80', carType: '4x4 / Off-road',
    year: 1995, color: 'White', plate: 'TBD', seats: 8, transmission: 'MANUAL', phone: null, check: true },
  { key: 'ashenafi-girma', folder: 'Ashenafi Girma', owner: 'Ashenafi Girma',
    make: 'Toyota', model: 'Land Cruiser 100 / 105', carType: '4x4 / Off-road',
    year: 2005, color: 'Dark green', plate: 'TBD', seats: 8, transmission: 'MANUAL', phone: null, check: true },
  { key: 'dereje-longbaze', folder: 'Dereje(2cars)/Dereje Longbaze', owner: 'Dereje',
    make: 'Toyota', model: 'Land Cruiser 70', carType: '4x4 / Off-road',
    year: 2010, color: 'White', plate: 'B13785A', seats: 9, transmission: 'MANUAL', phone: null, check: true },
  { key: 'dereje-mark-2', folder: 'Dereje(2cars)/Dereje Mark 2', owner: 'Dereje',
    make: 'Toyota', model: 'Land Cruiser 70', carType: '4x4 / Off-road',
    year: 2008, color: 'White', plate: 'A82568', seats: 9, transmission: 'MANUAL', phone: null, check: true }, // plate from the "Libre A82568.pdf" file name
  { key: 'ermiyas', folder: 'Ermiyas', owner: 'Ermiyas',
    make: 'Toyota', model: 'Land Cruiser 70', carType: '4x4 / Off-road',
    year: 2005, color: 'White', plate: '34498', seats: 9, transmission: 'MANUAL', phone: null, check: true },
  { key: 'fikadu-lemlem', folder: 'Fikadu Lemlem', owner: 'Fikadu Lemlem',
    make: 'Toyota', model: 'Land Cruiser 100 / 105', carType: '4x4 / Off-road',
    year: 2005, color: 'White', plate: 'TBD', seats: 8, transmission: 'MANUAL', phone: null, check: true }, // only interior photos seen
  { key: 'shimels-kebede', folder: 'Shimels kebede', owner: 'Shimels Kebede',
    make: 'Toyota', model: 'Land Cruiser 100 / 105', carType: '4x4 / Off-road',
    year: 2005, color: 'White', plate: 'B47290A', seats: 8, transmission: 'MANUAL', phone: null, check: true },
  { key: 'tadele', folder: 'Tadele', owner: 'Tadele',
    make: 'Toyota', model: 'Land Cruiser 70', carType: '4x4 / Off-road',
    year: 2010, color: 'White', plate: 'TBD', seats: 9, transmission: 'MANUAL', phone: null, check: true }, // model not seen clearly
  { key: 'tirsit-yigalem', folder: 'Tirsit', owner: 'Tirsit Yigalem',
    make: 'Nissan', model: 'Patrol', carType: '4x4 / Off-road',
    year: 2005, color: 'White', plate: 'TBD', seats: 7, transmission: 'MANUAL', phone: null, check: true }, // Nissan steering wheel
  { key: 'umer', folder: 'Umer', owner: 'Umer',
    make: 'Toyota', model: 'Land Cruiser 80', carType: '4x4 / Off-road',
    year: 1995, color: 'White', plate: 'TBD', seats: 8, transmission: 'MANUAL', phone: null, check: true },
];
