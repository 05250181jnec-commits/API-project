const mysql2 = require('mysql2/promise');

const poolConfig = {
  host:     process.env.DB_HOST || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'defaultdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

if ((process.env.DB_SSL || '').toUpperCase() === 'REQUIRED') {
  const fs = require('fs');
  const ssl = { rejectUnauthorized: false };
  if (process.env.DB_SSL_CA && fs.existsSync(process.env.DB_SSL_CA)) {
    ssl.ca = fs.readFileSync(process.env.DB_SSL_CA);
    ssl.rejectUnauthorized = true;
  }
  poolConfig.ssl = ssl;
}

const pool = mysql2.createPool(poolConfig);
module.exports = pool;