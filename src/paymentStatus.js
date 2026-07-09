const pool = require('./db');

// Shared by the /payments/notification webhook and the client-triggered sync
// endpoint — both end up with a Midtrans status response and need to apply it
// to our payments/reservations rows the same way.
const applyTransactionStatus = async (statusResponse) => {
  const {
    order_id: orderId,
    transaction_status: transactionStatus,
    fraud_status: fraudStatus,
    payment_type: paymentType,
    transaction_id: transactionId,
  } = statusResponse;

  const [paymentRows] = await pool.query(
    'SELECT id, reservation_id AS reservationId, status FROM payments WHERE order_id = ?',
    [orderId]
  );
  if (paymentRows.length === 0) {
    return null;
  }
  const payment = paymentRows[0];

  let nextStatus = payment.status;
  if (transactionStatus === 'capture') {
    nextStatus = fraudStatus === 'accept' ? 'paid' : 'failed';
  } else if (transactionStatus === 'settlement') {
    nextStatus = 'paid';
  } else if (transactionStatus === 'deny' || transactionStatus === 'failure') {
    nextStatus = 'failed';
  } else if (transactionStatus === 'cancel' || transactionStatus === 'expire') {
    nextStatus = 'expired';
  }

  // Already-processed notifications (Midtrans retries, or a sync that finds
  // nothing new) or statuses we don't act on (e.g. repeated 'pending') are a no-op.
  if (nextStatus === payment.status) {
    return { reservationId: payment.reservationId, status: nextStatus, changed: false };
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE payments SET status = ?, payment_type = ?, transaction_id = ?,
         paid_at = IF(? = 'paid', NOW(), paid_at) WHERE id = ?`,
      [nextStatus, paymentType ?? null, transactionId ?? null, nextStatus, payment.id]
    );

    if (nextStatus === 'paid') {
      await connection.query(
        "UPDATE reservations SET status = 'confirmed' WHERE id = ? AND status = 'pending_payment'",
        [payment.reservationId]
      );
    } else if (nextStatus === 'failed' || nextStatus === 'expired') {
      const [reservationRows] = await connection.query(
        'SELECT vehicle_unit_id AS vehicleUnitId, status FROM reservations WHERE id = ? FOR UPDATE',
        [payment.reservationId]
      );
      if (reservationRows.length > 0 && reservationRows[0].status === 'pending_payment') {
        await connection.query("UPDATE reservations SET status = 'cancelled' WHERE id = ?", [
          payment.reservationId,
        ]);
        await connection.query('UPDATE vehicle_units SET available = TRUE WHERE id = ?', [
          reservationRows[0].vehicleUnitId,
        ]);
      }
    }

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  return { reservationId: payment.reservationId, status: nextStatus, changed: true };
};

module.exports = { applyTransactionStatus };
