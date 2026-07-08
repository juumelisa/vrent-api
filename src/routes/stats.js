const express = require('express');

const pool = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [[locationCount]] = await pool.query('SELECT COUNT(*) AS count FROM locations');
    const [[listingCount]] = await pool.query('SELECT COUNT(*) AS count FROM vehicles');
    const [[unitCount]] = await pool.query('SELECT COUNT(*) AS count FROM vehicle_units');
    const [[availableCount]] = await pool.query(
      'SELECT COUNT(*) AS count FROM vehicle_units WHERE available = TRUE'
    );
    const [byType] = await pool.query(
      `SELECT vm.type, COUNT(vu.id) AS count
       FROM vehicle_units vu
       JOIN vehicles v ON v.id = vu.vehicle_id
       JOIN vehicle_models vm ON vm.id = v.vehicle_model_id
       GROUP BY vm.type`
    );

    res.json({
      locations: locationCount.count,
      listings: listingCount.count,
      vehicles: unitCount.count,
      availableVehicles: availableCount.count,
      byType: byType.reduce((acc, row) => {
        acc[row.type] = row.count;
        return acc;
      }, {}),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
