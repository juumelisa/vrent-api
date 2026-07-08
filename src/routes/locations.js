const express = require('express');

const pool = require('../db');
const { toBigInt } = require('../utils/bigint');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.id, l.name, c.name AS city, l.address, l.open_hours AS openHours, c.image_url AS imageUrl
       FROM locations l
       JOIN cities c ON c.id = l.city_id`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  const id = toBigInt(req.params.id);
  if (id === null) {
    return res.status(404).json({ message: 'Location not found' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT l.id, l.name, c.name AS city, l.address, l.open_hours AS openHours, c.image_url AS imageUrl
       FROM locations l
       JOIN cities c ON c.id = l.city_id
       WHERE l.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
