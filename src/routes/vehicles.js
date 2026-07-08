const express = require('express');

const pool = require('../db');
const { TRANSMISSION_CODES, TRANSMISSION_LABELS } = require('../transmission');
const { placeholderImage } = require('../vehicleImage');
const { toBigInt } = require('../utils/bigint');

const router = express.Router();

const mapVehicle = (row) => ({ ...row, transmission: TRANSMISSION_LABELS[row.transmission] });

router.get('/', async (req, res, next) => {
  const {
    location,
    city,
    type,
    brand,
    minPrice,
    maxPrice,
    minSeats,
    search,
    page,
    limit,
  } = req.query;

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.max(1, Number(limit) || 20);

  const conditions = [];
  const params = [];

  if (location) {
    const locationId = toBigInt(location);
    if (locationId === null) {
      return res.json({
        data: [],
        pagination: { page: pageNumber, limit: pageSize, offset: (pageNumber - 1) * pageSize, total: 0, totalPages: 0 },
      });
    }
    conditions.push('v.location_id = ?');
    params.push(locationId);
  }

  if (city) {
    conditions.push('LOWER(c.name) = LOWER(?)');
    params.push(city);
  }

  if (type) {
    // The taxonomy has no literal 'car' row — it's split into body styles
    // (sedan, suv, hatchback, mpv, van, pickup, jeep, electric, luxury
    // sedan) with 'motorcycle' as the only two-wheeler. Treat 'car' as an
    // umbrella alias for "anything but a motorcycle" so callers can filter
    // by the everyday category without knowing the exact body style.
    if (type.toLowerCase() === 'car') {
      conditions.push('LOWER(vm.type) != ?');
      params.push('motorcycle');
    } else {
      conditions.push('LOWER(vm.type) = LOWER(?)');
      params.push(type);
    }
  }

  if (brand) {
    conditions.push('LOWER(vm.brand) = LOWER(?)');
    params.push(brand);
  }

  if (minPrice) {
    conditions.push('v.price_per_day >= ?');
    params.push(Number(minPrice));
  }

  if (maxPrice) {
    conditions.push('v.price_per_day <= ?');
    params.push(Number(maxPrice));
  }

  if (minSeats) {
    conditions.push('v.seats >= ?');
    params.push(Number(minSeats));
  }

  if (search) {
    const keyword = `%${search.toLowerCase()}%`;
    conditions.push('(LOWER(vm.brand) LIKE ? OR LOWER(vm.model) LIKE ? OR LOWER(vm.type) LIKE ?)');
    params.push(keyword, keyword, keyword);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const baseQuery = `
    SELECT v.id, vm.type, vm.brand, vm.model, vm.image_url AS imageUrl, v.location_id AS locationId,
           v.price_per_day AS pricePerDay, v.seats, v.transmission,
           COUNT(vu.id) AS totalUnits, COALESCE(SUM(vu.available), 0) AS availableUnits
    FROM vehicles v
    JOIN vehicle_models vm ON vm.id = v.vehicle_model_id
    JOIN locations l ON l.id = v.location_id
    JOIN cities c ON c.id = l.city_id
    LEFT JOIN vehicle_units vu ON vu.vehicle_id = v.id
    ${where}
    GROUP BY v.id, vm.type, vm.brand, vm.model, vm.image_url, v.location_id, v.price_per_day, v.seats, v.transmission
    HAVING availableUnits > 0
  `;

  const offset = (pageNumber - 1) * pageSize;

  try {
    const [[{ count }]] = await pool.query(`SELECT COUNT(*) AS count FROM (${baseQuery}) AS t`, params);
    const total = Number(count);

    const [rows] = await pool.query(`${baseQuery} ORDER BY v.id LIMIT ? OFFSET ?`, [...params, pageSize, offset]);

    res.json({
      data: rows.map(mapVehicle),
      pagination: {
        page: pageNumber,
        limit: pageSize,
        offset,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  const id = toBigInt(req.params.id);
  if (id === null) {
    return res.status(404).json({ message: 'Vehicle not found' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT v.id, vm.type, vm.brand, vm.model, vm.image_url AS imageUrl, v.location_id AS locationId,
              v.price_per_day AS pricePerDay, v.seats, v.transmission
       FROM vehicles v
       JOIN vehicle_models vm ON vm.id = v.vehicle_model_id
       WHERE v.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const [units] = await pool.query(
      'SELECT id, police_number AS policeNumber, available FROM vehicle_units WHERE vehicle_id = ? ORDER BY id',
      [id]
    );

    res.json({ ...mapVehicle(rows[0]), units });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/units', async (req, res, next) => {
  const id = toBigInt(req.params.id);
  if (id === null) {
    return res.status(404).json({ message: 'Vehicle not found' });
  }

  const { policeNumber, available } = req.body;
  if (!policeNumber) {
    return res.status(400).json({ message: 'Please provide policeNumber' });
  }

  try {
    const [vehicleRows] = await pool.query('SELECT id FROM vehicles WHERE id = ?', [id]);
    if (vehicleRows.length === 0) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const [result] = await pool.query(
      'INSERT INTO vehicle_units (vehicle_id, police_number, available) VALUES (?, ?, ?)',
      [id, policeNumber, available !== false]
    );

    const [rows] = await pool.query(
      'SELECT id, police_number AS policeNumber, available FROM vehicle_units WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'policeNumber already exists' });
    }
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const { type, brand, model, locationId, pricePerDay, seats, transmission, policeNumbers } = req.body;

  if (!type || !brand || !model || !locationId || !pricePerDay) {
    return res.status(400).json({ message: 'Please provide type, brand, model, locationId and pricePerDay' });
  }

  const parsedLocationId = toBigInt(locationId);
  if (parsedLocationId === null) {
    return res.status(400).json({ message: 'locationId must be a valid integer' });
  }

  const transmissionCode = TRANSMISSION_CODES[transmission] || TRANSMISSION_CODES.Automatic;

  try {
    const [existingModel] = await pool.query(
      'SELECT id FROM vehicle_models WHERE type = ? AND brand = ? AND model = ?',
      [type, brand, model]
    );

    let vehicleModelId;
    if (existingModel.length > 0) {
      vehicleModelId = existingModel[0].id;
    } else {
      const [modelResult] = await pool.query(
        'INSERT INTO vehicle_models (type, brand, model, image_url) VALUES (?, ?, ?, ?)',
        [type, brand, model, placeholderImage(brand, model)]
      );
      vehicleModelId = modelResult.insertId;
    }

    const [result] = await pool.query(
      `INSERT INTO vehicles (vehicle_model_id, location_id, price_per_day, seats, transmission)
       VALUES (?, ?, ?, ?, ?)`,
      [
        vehicleModelId,
        parsedLocationId,
        Number(pricePerDay),
        Number(seats) || 4,
        transmissionCode,
      ]
    );

    if (Array.isArray(policeNumbers)) {
      for (const policeNumber of policeNumbers) {
        await pool.query(
          'INSERT INTO vehicle_units (vehicle_id, police_number, available) VALUES (?, ?, ?)',
          [result.insertId, policeNumber, true]
        );
      }
    }

    const [rows] = await pool.query(
      `SELECT v.id, vm.type, vm.brand, vm.model, vm.image_url AS imageUrl, v.location_id AS locationId,
              v.price_per_day AS pricePerDay, v.seats, v.transmission
       FROM vehicles v
       JOIN vehicle_models vm ON vm.id = v.vehicle_model_id
       WHERE v.id = ?`,
      [result.insertId]
    );

    const [units] = await pool.query(
      'SELECT id, police_number AS policeNumber, available FROM vehicle_units WHERE vehicle_id = ? ORDER BY id',
      [result.insertId]
    );

    res.status(201).json({ ...mapVehicle(rows[0]), units });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
      return res.status(400).json({ message: 'locationId does not exist' });
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'One of the policeNumbers already exists' });
    }
    next(err);
  }
});

module.exports = router;
