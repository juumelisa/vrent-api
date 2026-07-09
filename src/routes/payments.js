const express = require('express');

const { snap } = require('../midtrans');
const { applyTransactionStatus } = require('../paymentStatus');

const router = express.Router();

// Midtrans calls this after every transaction status change. There's no user
// session here — snap.transaction.notification() re-fetches the transaction
// status from Midtrans using the order_id in the body and verifies the
// signature_key itself, so we never trust req.body's status fields directly.
//
// Note: this only fires if Midtrans can reach this server, i.e. it's
// publicly reachable and the Notification URL is set in the Midtrans
// Dashboard. In local dev, use POST /reservations/:id/sync-payment instead.
router.post('/notification', async (req, res, next) => {
  try {
    const statusResponse = await snap.transaction.notification(req.body);
    const result = await applyTransactionStatus(statusResponse);
    if (!result) {
      return res.status(404).json({ message: 'Unknown order_id' });
    }
    res.status(200).json({ message: 'OK' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
