const jwt = require('jsonwebtoken');
const config = require('../config/env');

function signToken(payload, options = {}) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.tokenExpiresIn,
    ...options,
  });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = {
  signToken,
  verifyToken,
};
