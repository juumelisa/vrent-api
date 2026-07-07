const fs = require('fs');
const path = require('path');

const pool = require('../src/db');
const { TRANSMISSION_CODES } = require('../src/transmission');
const { placeholderImage } = require('../src/vehicleImage');

const locations = [
  { name: 'Hub Jakarta Pusat', city: 'Jakarta', address: 'Jl. Jenderal Sudirman No. 1', openHours: '08:00 - 20:00' },
  { name: 'Terminal Bandara Juanda', city: 'Surabaya', address: 'Jl. Bandara Juanda No. 2', openHours: '24/7' },
  { name: 'Stasiun Pantai Kuta', city: 'Denpasar', address: 'Jl. Pantai Kuta No. 3', openHours: '07:00 - 22:00' },
  { name: 'Hub Dago', city: 'Bandung', address: 'Jl. Ir. H. Djuanda No. 45', openHours: '08:00 - 21:00' },
  { name: 'Terminal Amplas', city: 'Medan', address: 'Jl. Sisingamangaraja No. 88', openHours: '06:00 - 22:00' },
  { name: 'Hub Malioboro', city: 'Yogyakarta', address: 'Jl. Malioboro No. 12', openHours: '07:00 - 21:00' },
  { name: 'Terminal Bandara Sultan Hasanuddin', city: 'Makassar', address: 'Jl. Bandara No. 7', openHours: '24/7' },
  { name: 'Hub Simpang Lima', city: 'Semarang', address: 'Jl. Pandanaran No. 20', openHours: '08:00 - 20:00' },
];

// Indonesian vehicle registration region code (kode plat) per city.
const REGION_CODE_BY_CITY = {
  Jakarta: 'B',
  Surabaya: 'L',
  Denpasar: 'DK',
  Bandung: 'D',
  Medan: 'BK',
  Yogyakarta: 'AB',
  Makassar: 'DD',
  Semarang: 'H',
};

// How many physical units (stock) a listing typically has, by vehicle type.
const STOCK_BY_TYPE = {
  motorcycle: 3,
  hatchback: 3,
  sedan: 3,
  mpv: 2,
  suv: 2,
  pickup: 2,
  van: 1,
  jeep: 1,
  electric: 1,
  'luxury sedan': 1,
};

const usedPlates = new Set();
function generatePlateNumber(regionCode) {
  let plate;
  do {
    const number = Math.floor(1000 + Math.random() * 9000);
    const letters = Array.from({ length: 3 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
    plate = `${regionCode} ${number} ${letters}`;
  } while (usedPlates.has(plate));
  usedPlates.add(plate);
  return plate;
}

// pricePerDay values are the actual Rupiah/day rate, roughly matched to real Indonesian
// self-drive rental rates by vehicle class (e.g. scooters ~Rp 90rb-150rb, sedans
// ~Rp 380rb-650rb, SUVs ~Rp 550rb-950rb, vans ~Rp 900rb-1.5jt, luxury ~Rp 2.2jt+).
const vehiclesByCity = {
  Jakarta: [
    { type: 'motorcycle', brand: 'Honda', model: 'CBR500R', pricePerDay: 250000, seats: 2, transmission: 'Manual', available: true },
    { type: 'sedan', brand: 'Toyota', model: 'Corolla', pricePerDay: 480000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'suv', brand: 'Honda', model: 'CR-V', pricePerDay: 750000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'hatchback', brand: 'Toyota', model: 'Yaris', pricePerDay: 320000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'mpv', brand: 'Toyota', model: 'Avanza', pricePerDay: 380000, seats: 7, transmission: 'Manual', available: true },
    { type: 'electric', brand: 'Hyundai', model: 'Ioniq 5', pricePerDay: 1100000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'luxury sedan', brand: 'BMW', model: '5 Series', pricePerDay: 2200000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'motorcycle', brand: 'Kawasaki', model: 'Ninja 250', pricePerDay: 220000, seats: 2, transmission: 'Manual', available: false },
    { type: 'suv', brand: 'Mazda', model: 'CX-5', pricePerDay: 650000, seats: 5, transmission: 'Automatic', available: true },
  ],
  Surabaya: [
    { type: 'suv', brand: 'Ford', model: 'Explorer', pricePerDay: 850000, seats: 7, transmission: 'Automatic', available: false },
    { type: 'van', brand: 'Mercedes', model: 'Sprinter', pricePerDay: 1500000, seats: 12, transmission: 'Automatic', available: true },
    { type: 'sedan', brand: 'Honda', model: 'Civic', pricePerDay: 420000, seats: 5, transmission: 'Manual', available: true },
    { type: 'mpv', brand: 'Suzuki', model: 'Ertiga', pricePerDay: 380000, seats: 7, transmission: 'Manual', available: true },
    { type: 'hatchback', brand: 'Honda', model: 'Jazz', pricePerDay: 320000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'pickup', brand: 'Isuzu', model: 'D-Max', pricePerDay: 550000, seats: 5, transmission: 'Manual', available: true },
    { type: 'motorcycle', brand: 'Honda', model: 'PCX 160', pricePerDay: 150000, seats: 2, transmission: 'Automatic', available: true },
    { type: 'suv', brand: 'Nissan', model: 'X-Trail', pricePerDay: 700000, seats: 5, transmission: 'Automatic', available: false },
    { type: 'van', brand: 'Hyundai', model: 'Staria', pricePerDay: 1000000, seats: 11, transmission: 'Automatic', available: true },
  ],
  Denpasar: [
    { type: 'pickup', brand: 'Chevrolet', model: 'Silverado', pricePerDay: 900000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'motorcycle', brand: 'Yamaha', model: 'R3', pricePerDay: 220000, seats: 2, transmission: 'Manual', available: true },
    { type: 'motorcycle', brand: 'Yamaha', model: 'NMAX', pricePerDay: 110000, seats: 2, transmission: 'Automatic', available: true },
    { type: 'jeep', brand: 'Suzuki', model: 'Jimny', pricePerDay: 450000, seats: 4, transmission: 'Manual', available: true },
    { type: 'motorcycle', brand: 'Honda', model: 'Scoopy', pricePerDay: 90000, seats: 2, transmission: 'Automatic', available: true },
    { type: 'hatchback', brand: 'Toyota', model: 'Agya', pricePerDay: 300000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'suv', brand: 'Toyota', model: 'Rush', pricePerDay: 550000, seats: 7, transmission: 'Manual', available: true },
    { type: 'motorcycle', brand: 'Vespa', model: 'Primavera', pricePerDay: 150000, seats: 2, transmission: 'Automatic', available: true },
    { type: 'sedan', brand: 'Mazda', model: '2', pricePerDay: 400000, seats: 5, transmission: 'Automatic', available: false },
  ],
  Bandung: [
    { type: 'sedan', brand: 'Toyota', model: 'Camry', pricePerDay: 600000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'suv', brand: 'Mitsubishi', model: 'Pajero Sport', pricePerDay: 800000, seats: 7, transmission: 'Automatic', available: true },
    { type: 'mpv', brand: 'Daihatsu', model: 'Xenia', pricePerDay: 360000, seats: 7, transmission: 'Manual', available: true },
    { type: 'hatchback', brand: 'Kia', model: 'Picanto', pricePerDay: 300000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'suv', brand: 'Hyundai', model: 'Creta', pricePerDay: 550000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'motorcycle', brand: 'Yamaha', model: 'XMAX', pricePerDay: 220000, seats: 2, transmission: 'Automatic', available: true },
    { type: 'sedan', brand: 'Nissan', model: 'Almera', pricePerDay: 400000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'van', brand: 'Isuzu', model: 'Elf', pricePerDay: 950000, seats: 15, transmission: 'Manual', available: false },
    { type: 'pickup', brand: 'Mitsubishi', model: 'Triton', pricePerDay: 600000, seats: 5, transmission: 'Manual', available: true },
  ],
  Medan: [
    { type: 'van', brand: 'Toyota', model: 'Hiace', pricePerDay: 950000, seats: 14, transmission: 'Manual', available: true },
    { type: 'sedan', brand: 'Honda', model: 'City', pricePerDay: 380000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'suv', brand: 'Suzuki', model: 'Grand Vitara', pricePerDay: 600000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'hatchback', brand: 'Honda', model: 'Brio', pricePerDay: 300000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'motorcycle', brand: 'Suzuki', model: 'Address', pricePerDay: 95000, seats: 2, transmission: 'Automatic', available: true },
    { type: 'mpv', brand: 'Wuling', model: 'Confero', pricePerDay: 340000, seats: 7, transmission: 'Manual', available: true },
    { type: 'sedan', brand: 'Mitsubishi', model: 'Lancer', pricePerDay: 420000, seats: 5, transmission: 'Manual', available: false },
    { type: 'suv', brand: 'Ford', model: 'EcoSport', pricePerDay: 520000, seats: 5, transmission: 'Automatic', available: true },
  ],
  Yogyakarta: [
    { type: 'motorcycle', brand: 'Honda', model: 'Vario 125', pricePerDay: 100000, seats: 2, transmission: 'Automatic', available: true },
    { type: 'suv', brand: 'Daihatsu', model: 'Terios', pricePerDay: 550000, seats: 7, transmission: 'Manual', available: true },
    { type: 'motorcycle', brand: 'Honda', model: 'Beat', pricePerDay: 85000, seats: 2, transmission: 'Automatic', available: true },
    { type: 'hatchback', brand: 'Suzuki', model: 'Swift', pricePerDay: 330000, seats: 5, transmission: 'Manual', available: true },
    { type: 'mpv', brand: 'Toyota', model: 'Innova', pricePerDay: 600000, seats: 7, transmission: 'Automatic', available: true },
    { type: 'suv', brand: 'Wuling', model: 'Almaz', pricePerDay: 580000, seats: 7, transmission: 'Automatic', available: true },
    { type: 'motorcycle', brand: 'Yamaha', model: 'Fino', pricePerDay: 90000, seats: 2, transmission: 'Automatic', available: false },
    { type: 'sedan', brand: 'Toyota', model: 'Vios', pricePerDay: 400000, seats: 5, transmission: 'Automatic', available: true },
  ],
  Makassar: [
    { type: 'pickup', brand: 'Toyota', model: 'Hilux', pricePerDay: 600000, seats: 5, transmission: 'Manual', available: true },
    { type: 'sedan', brand: 'Suzuki', model: 'Baleno', pricePerDay: 380000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'suv', brand: 'Daihatsu', model: 'Terios', pricePerDay: 560000, seats: 7, transmission: 'Manual', available: true },
    { type: 'motorcycle', brand: 'Honda', model: 'ADV160', pricePerDay: 240000, seats: 2, transmission: 'Automatic', available: true },
    { type: 'sedan', brand: 'Kia', model: 'Rio', pricePerDay: 390000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'van', brand: 'Toyota', model: 'Hiace', pricePerDay: 970000, seats: 14, transmission: 'Manual', available: true },
    { type: 'pickup', brand: 'Ford', model: 'Ranger', pricePerDay: 650000, seats: 5, transmission: 'Manual', available: false },
    { type: 'suv', brand: 'Chery', model: 'Tiggo 7', pricePerDay: 600000, seats: 5, transmission: 'Automatic', available: true },
  ],
  Semarang: [
    { type: 'suv', brand: 'Toyota', model: 'Fortuner', pricePerDay: 900000, seats: 7, transmission: 'Automatic', available: true },
    { type: 'motorcycle', brand: 'Yamaha', model: 'Aerox', pricePerDay: 110000, seats: 2, transmission: 'Automatic', available: false },
    { type: 'hatchback', brand: 'Daihatsu', model: 'Sirion', pricePerDay: 300000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'motorcycle', brand: 'Honda', model: 'Genio', pricePerDay: 90000, seats: 2, transmission: 'Automatic', available: true },
    { type: 'mpv', brand: 'Honda', model: 'Mobilio', pricePerDay: 370000, seats: 7, transmission: 'Manual', available: true },
    { type: 'suv', brand: 'Kia', model: 'Sportage', pricePerDay: 650000, seats: 5, transmission: 'Automatic', available: true },
    { type: 'sedan', brand: 'Hyundai', model: 'Elantra', pricePerDay: 550000, seats: 5, transmission: 'Automatic', available: false },
    { type: 'van', brand: 'Kia', model: 'Grand Sedona', pricePerDay: 900000, seats: 8, transmission: 'Automatic', available: true },
    { type: 'pickup', brand: 'Toyota', model: 'Hilux', pricePerDay: 590000, seats: 5, transmission: 'Manual', available: true },
  ],
};

async function seed() {
  await pool.query('SET FOREIGN_KEY_CHECKS = 0');
  await pool.query('DROP TABLE IF EXISTS reservations');
  await pool.query('DROP TABLE IF EXISTS vehicle_units');
  await pool.query('DROP TABLE IF EXISTS vehicles');
  await pool.query('DROP TABLE IF EXISTS vehicle_models');
  await pool.query('DROP TABLE IF EXISTS locations');
  await pool.query('SET FOREIGN_KEY_CHECKS = 1');

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const statements = schema.split(';').map((s) => s.trim()).filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }

  const modelIds = new Map();
  const getModelId = async (type, brand, model) => {
    const key = `${type}|${brand}|${model}`;
    if (modelIds.has(key)) {
      return modelIds.get(key);
    }

    const [result] = await pool.query(
      'INSERT INTO vehicle_models (type, brand, model, image_url) VALUES (?, ?, ?, ?)',
      [type, brand, model, placeholderImage(brand, model)]
    );
    modelIds.set(key, result.insertId);
    return result.insertId;
  };

  let unitCount = 0;

  for (const location of locations) {
    const [locationResult] = await pool.query(
      'INSERT INTO locations (name, city, address, open_hours) VALUES (?, ?, ?, ?)',
      [location.name, location.city, location.address, location.openHours]
    );

    const regionCode = REGION_CODE_BY_CITY[location.city];
    const vehicles = vehiclesByCity[location.city] || [];
    for (const vehicle of vehicles) {
      const vehicleModelId = await getModelId(vehicle.type, vehicle.brand, vehicle.model);

      const [vehicleResult] = await pool.query(
        `INSERT INTO vehicles (vehicle_model_id, location_id, price_per_day, seats, transmission)
         VALUES (?, ?, ?, ?, ?)`,
        [
          vehicleModelId,
          locationResult.insertId,
          vehicle.pricePerDay,
          vehicle.seats,
          TRANSMISSION_CODES[vehicle.transmission],
        ]
      );

      // Listings marked unavailable have their whole stock out; otherwise all units
      // are available except the last one when there's more than 2 in stock.
      const stock = STOCK_BY_TYPE[vehicle.type] || 2;
      for (let i = 0; i < stock; i++) {
        const unitAvailable = vehicle.available && !(stock > 2 && i === stock - 1);
        await pool.query(
          'INSERT INTO vehicle_units (vehicle_id, police_number, available) VALUES (?, ?, ?)',
          [vehicleResult.insertId, generatePlateNumber(regionCode), unitAvailable]
        );
        unitCount += 1;
      }
    }
  }

  console.log(`Seeded ${locations.length} locations, ${modelIds.size} vehicle models, and ${unitCount} vehicle units.`);
  await pool.end();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});