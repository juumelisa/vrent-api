require('dotenv').config();

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'vrent',
  waitForConnections: true,
  connectionLimit: 10,
  // Keep DATE columns as plain 'YYYY-MM-DD' strings instead of JS Date objects.
  dateStrings: ['DATE'],
  // BIGINT columns come back as JS numbers by default, which lose precision
  // above 2^53. Cast LONGLONG fields to native BigInt so ids stay exact.
  typeCast: (field, next) => {
    if (field.type === 'LONGLONG') {
      const value = field.string();
      return value === null ? null : BigInt(value);
    }
    // BOOLEAN is stored as TINYINT(1); cast it back to a real boolean.
    if (field.type === 'TINY' && field.length === 1) {
      const value = field.string();
      return value === null ? null : value === '1';
    }
    return next();
  },
});

module.exports = pool;