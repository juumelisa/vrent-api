const express = require('express');
const cors = require('cors');

const pool = require('./src/db');
const { TRANSMISSION_CODES, TRANSMISSION_LABELS } = require('./src/transmission');
const { placeholderImage } = require('./src/vehicleImage');
const { hashPassword, comparePassword, signToken, verifyToken, TOKEN_TTL_MS } = require('./src/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('json replacer', (key, value) => (typeof value === 'bigint' ? value.toString() : value));

app.use(cors());
app.use(express.json());

const toBigInt = (value) => {
  try {
    return BigInt(value);
  } catch {
    return null;
  }
};

const mapVehicle = (row) => ({ ...row, transmission: TRANSMISSION_LABELS[row.transmission] });

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  try {
    const payload = verifyToken(token);

    const [sessions] = await pool.query(
      'SELECT id FROM sessions WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    if (sessions.length === 0) {
      return res.status(401).json({ message: 'Session expired or logged out' });
    }

    req.userId = toBigInt(payload.sub);
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'VRent API is running' });
});

app.post('/auth/register', async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email and password' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  try {
    const hashed = await hashPassword(password);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashed]
    );

    const token = signToken(result.insertId);
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      [result.insertId, token, new Date(Date.now() + TOKEN_TTL_MS)]
    );

    res.status(201).json({ user: { id: result.insertId, name, email }, token });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already registered' });
    }
    next(err);
  }
});

app.post('/auth/login', async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const [users] = await pool.query('SELECT id, name, email, password FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];
    const passwordMatches = await comparePassword(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user.id);
    await pool.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, new Date(Date.now() + TOKEN_TTL_MS)]
    );

    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    next(err);
  }
});

app.post('/auth/logout', authenticate, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM sessions WHERE token = ?', [req.token]);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});

app.get('/auth/me', authenticate, async (req, res, next) => {
  try {
    const [users] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [req.userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(users[0]);
  } catch (err) {
    next(err);
  }
});

app.get('/locations', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, city, address, open_hours AS openHours FROM locations'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.get('/locations/:id', async (req, res, next) => {
  const id = toBigInt(req.params.id);
  if (id === null) {
    return res.status(404).json({ message: 'Location not found' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, name, city, address, open_hours AS openHours FROM locations WHERE id = ?',
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

app.get('/vehicles', async (req, res, next) => {
  const {
    location,
    type,
    brand,
    minPrice,
    maxPrice,
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

  if (type) {
    conditions.push('LOWER(vm.type) = LOWER(?)');
    params.push(type);
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

app.get('/vehicles/:id', async (req, res, next) => {
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

app.post('/vehicles/:id/units', async (req, res, next) => {
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

app.post('/vehicles', async (req, res, next) => {
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

app.get('/stats', async (req, res, next) => {
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

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`VRent API running on http://localhost:${PORT}`);
});