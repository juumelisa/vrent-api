const express = require('express');
const crypto = require('crypto');

const pool = require('../db');
const authenticate = require('../middleware/authenticate');
const { toBigInt } = require('../utils/bigint');
const { toDateOnly, MS_PER_DAY } = require('../utils/date');
const { snap } = require('../midtrans');
const { applyTransactionStatus } = require('../paymentStatus');

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

router.post('/:id/pay', authenticate, async (req, res, next) => {
  const id = toBigInt(req.params.id);
  if (id === null) {
    return res.status(404).json({ message: 'Reservation not found' });
  }

  try {
    const [rows] = await pool.query(`${RESERVATION_SELECT} WHERE id = ? AND user_id = ?`, [id, req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    const reservation = mapReservation(rows[0]);
    if (reservation.status !== 'pending_payment') {
      return res.status(409).json({ message: `Reservation is already ${reservation.status}` });
    }

    // Reuse an in-flight Midtrans transaction instead of minting a new order_id
    // every time the pay page is (re)loaded.
    const [existing] = await pool.query(
      "SELECT order_id AS orderId, snap_token AS snapToken FROM payments WHERE reservation_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 1",
      [id]
    );
    if (existing.length > 0) {
      return res.json(existing[0]);
    }

    const [userRows] = await pool.query('SELECT name, email FROM users WHERE id = ?', [req.userId]);
    const user = userRows[0];
    const orderId = `RSV-${id}-${crypto.randomBytes(4).toString('hex')}`;

    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: reservation.totalPrice,
      },
      item_details: [
        {
          id: String(reservation.vehicleId),
          name: `${reservation.brand} ${reservation.model} (${reservation.startDate} to ${reservation.endDate})`.slice(0, 50),
          price: reservation.totalPrice,
          quantity: 1,
        },
      ],
      customer_details: {
        first_name: user?.name ?? 'Customer',
        email: user?.email,
      },
    });

    await pool.query(
      "INSERT INTO payments (reservation_id, order_id, amount, status, snap_token) VALUES (?, ?, ?, 'pending', ?)",
      [id, orderId, reservation.totalPrice, transaction.token]
    );

    res.json({ orderId, snapToken: transaction.token });
  } catch (err) {
    next(err);
  }
});

// Actively pulls the transaction status from Midtrans instead of waiting for
// the /payments/notification webhook — needed in local dev, where Midtrans's
// servers have no way to reach this machine to deliver that webhook.
router.post('/:id/sync-payment', authenticate, async (req, res, next) => {
  const id = toBigInt(req.params.id);
  if (id === null) {
    return res.status(404).json({ message: 'Reservation not found' });
  }

  try {
    const [reservationRows] = await pool.query(`${RESERVATION_SELECT} WHERE id = ? AND user_id = ?`, [
      id,
      req.userId,
    ]);
    if (reservationRows.length === 0) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservationRows[0].status === 'pending_payment') {
      const [paymentRows] = await pool.query(
        'SELECT order_id AS orderId FROM payments WHERE reservation_id = ? ORDER BY created_at DESC LIMIT 1',
        [id]
      );
      if (paymentRows.length > 0) {
        try {
          const statusResponse = await snap.transaction.status(paymentRows[0].orderId);
          await applyTransactionStatus(statusResponse);
        } catch {
          // Midtrans returns 404 until the customer has actually interacted with
          // the Snap page — that just means there's nothing new to sync yet.
        }
      }
    }

    const [rows] = await pool.query(`${RESERVATION_SELECT} WHERE id = ? AND user_id = ?`, [id, req.userId]);
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
    if (!['pending_payment', 'confirmed'].includes(rows[0].status)) {
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
