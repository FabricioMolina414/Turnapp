const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

const config = {
  port: parseInt(process.env.PORT, 10) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'change-me-asap',
  tokenExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  databaseUrl: process.env.DATABASE_URL || '',
};

module.exports = config;
