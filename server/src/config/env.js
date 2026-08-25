const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

const config = {
  port: parseInt(process.env.PORT, 10) || 4000,
  jwtSecret: process.env.JWT_SECRET,
  tokenExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  databaseUrl: process.env.DATABASE_URL || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || '',
  emailReplyTo: process.env.EMAIL_REPLY_TO || '',
  businessTimezone: process.env.BUSINESS_TIMEZONE || 'America/Argentina/Buenos_Aires',
};

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET no está configurada en las variables de entorno.');
}

module.exports = config;
