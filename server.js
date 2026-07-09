const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./src/routes/auth');
const locationRoutes = require('./src/routes/locations');
const faqRoutes = require('./src/routes/faqs');
const vehicleRoutes = require('./src/routes/vehicles');
const reservationRoutes = require('./src/routes/reservations');
const statsRoutes = require('./src/routes/stats');
const paymentRoutes = require('./src/routes/payments');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('json replacer', (key, value) => (typeof value === 'bigint' ? value.toString() : value));

app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'VRent API is running' });
});

app.use('/auth', authRoutes);
app.use('/locations', locationRoutes);
app.use('/faqs', faqRoutes);
app.use('/vehicles', vehicleRoutes);
app.use('/reservations', reservationRoutes);
app.use('/stats', statsRoutes);
app.use('/payments', paymentRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`VRent API running on http://localhost:${PORT}`);
});
