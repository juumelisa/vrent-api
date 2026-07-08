const express = require('express');

const pool = require('../db');
const authenticate = require('../middleware/authenticate');
const { toBigInt } = require('../utils/bigint');
const { toDateOnly, MS_PER_DAY } = require('../utils/date');

const router = express.Router();

const mapReservation = (row) => ({
  id: row.id,
  vehicleId: row.vehicleId,
  vehicleUnitId: row.vehicleUnitId,
  type: row.type,
  brand: row.brand,
  model: row.model,
  imageUrl: row.imageUrl,
  policeNumber: row.policeNumber,
  pricePerDay: row.pricePerDay,
  startDate: row.startDate,
  endDate: row.endDate,
  totalPrice: row.totalPrice,
  status: row.status,
  createdAt: row.createdAt,
});

// Reads the snapshot columns taken at booking time — never joins back to vehicles/
// vehicle_models/vehicle_units, so editing or deleting those later can't change what
// a past reservation shows.
const RESERVATION_SELECT = `
  SELECT id, vehicle_id AS vehicleId, vehicle_unit_id AS vehicleUnitId,
         vehicle_type AS type, vehicle_brand AS brand, vehicle_model AS model,
         vehicle_image_url AS imageUrl, police_number AS policeNumber, price_per_day AS pricePerDay,
         start_date AS startDate, end_date AS endDate, total_price AS totalPrice,
         status, created_at AS createdAt
  FROM reservations
`;

router.post('/', authenticate, async (req, res, next) => {
  const { vehicleId, startDate, endDate } = req.body;

  const id = toBigInt(vehicleId);
  if (id === null) {
    return res.status(400).json({ message: 'Please provide a valid vehicleId' });
  }

  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  if (!start || !end) {
    return res.status(400).json({ message: 'Please provide valid startDate and endDate (YYYY-MM-DD)' });
  }

  const today = toDateOnly(new Date().toISOString().slice(0, 10));
  if (start < today) {
    return res.status(400).json({ message: 'startDate cannot be in the past' });
  }
  if (end <= start) {
    return res.status(400).json({ message: 'endDate must be after startDate' });
  }

  const days = Math.round((end - start) / MS_PER_DAY);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Read the vehicle's current data once, to snapshot onto the reservation below.
    const [vehicleRows] = await connection.query(
      `SELECT v.price_per_day AS pricePerDay, vm.type, vm.brand, vm.model, vm.image_url AS imageUrl
       FROM vehicles v
       JOIN vehicle_models vm ON vm.id = v.vehicle_model_id
       WHERE v.id = ?`,
      [id]
    );
    if (vehicleRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Lock a candidate unit row so concurrent reservations for the same vehicle
    // can't both grab it before either transaction commits.
    const [unitRows] = await connection.query(
      'SELECT id, police_number AS policeNumber FROM vehicle_units WHERE vehicle_id = ? AND available = TRUE LIMIT 1 FOR UPDATE',
      [id]
    );
    if (unitRows.length === 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'No available units for this vehicle' });
    }

    const vehicleSnapshot = vehicleRows[0];
    const unitId = unitRows[0].id;
    const totalPrice = days * vehicleSnapshot.pricePerDay;

    await connection.query('UPDATE vehicle_units SET available = FALSE WHERE id = ?', [unitId]);

    const [result] = await connection.query(
      `INSERT INTO reservations (
         user_id, vehicle_id, vehicle_unit_id,
         vehicle_type, vehicle_brand, vehicle_model, vehicle_image_url, police_number, price_per_day,
         start_date, end_date, total_price
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.userId,
        id,
        unitId,
        vehicleSnapshot.type,
        vehicleSnapshot.brand,
        vehicleSnapshot.model,
        vehicleSnapshot.imageUrl,
        unitRows[0].policeNumber,
        vehicleSnapshot.pricePerDay,
        startDate,
        endDate,
        totalPrice,
      ]
    );

    await connection.commit();

    const [rows] = await pool.query(`${RESERVATION_SELECT} WHERE id = ?`, [result.insertId]);
    res.status(201).json(mapReservation(rows[0]));
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `${RESERVATION_SELECT} WHERE user_id = ? ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json(rows.map(mapReservation));
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  const id = toBigInt(req.params.id);
  if (id === null) {
    return res.status(404).json({ message: 'Reservation not found' });
  }

  try {
    const [rows] = await pool.query(`${RESERVATION_SELECT} WHERE id = ? AND user_id = ?`, [id, req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.json(mapReservation(rows[0]));
  } catch (err) {
    next(err);
  }
});

router.post('/:id/cancel', authenticate, async (req, res, next) => {
  const id = toBigInt(req.params.id);
  if (id === null) {
    return res.status(404).json({ message: 'Reservation not found' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      'SELECT vehicle_unit_id AS vehicleUnitId, status FROM reservations WHERE id = ? AND user_id = ? FOR UPDATE',
      [id, req.userId]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Reservation not found' });
    }
    if (rows[0].status !== 'confirmed') {
      await connection.rollback();
      return res.status(409).json({ message: 'Reservation is already cancelled' });
    }

    await connection.query('UPDATE reservations SET status = ? WHERE id = ?', ['cancelled', id]);
    await connection.query('UPDATE vehicle_units SET available = TRUE WHERE id = ?', [rows[0].vehicleUnitId]);

    await connection.commit();
    res.json({ message: 'Reservation cancelled' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

module.exports = router;
