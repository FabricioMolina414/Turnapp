const express = require('express');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const { findUserByIdentifier, sanitizeUser, findOrCreateGoogleUser } = require('../data/users');
const { signToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');
const config = require('../config/env');

const router = express.Router();
const googleClient = config.googleClientId ? new OAuth2Client(config.googleClientId) : null;

router.post('/login', async (req, res) => {
  const { identifier, email, username, password } = req.body;
  const loginIdentifier = (identifier || email || username || '').trim();

  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: 'Usuario/email y contraseña son obligatorios' });
  }

  const user = await findUserByIdentifier(loginIdentifier);
  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const safeUser = sanitizeUser(user);
  const token = signToken({
    sub: user.id,
    role: safeUser.role,
    email: user.email,
  });

  return res.json({
    token,
    user: safeUser,
  });
});

router.post('/google', async (req, res) => {
  if (!googleClient) {
    return res.status(500).json({ message: 'Google OAuth no está configurado' });
  }

  const { idToken, credential } = req.body || {};
  const tokenValue = (idToken || credential || '').trim();

  if (!tokenValue) {
    return res.status(400).json({ message: 'Token de Google obligatorio' });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenValue,
      audience: config.googleClientId,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(401).json({ message: 'Token de Google inválido' });
    }

    if (payload.email_verified === false) {
      return res.status(401).json({ message: 'Email de Google no verificado' });
    }

    const safeUser = await findOrCreateGoogleUser({
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.picture,
      googleSub: payload.sub,
    });

    const token = signToken({
      sub: safeUser.id,
      role: safeUser.role,
      email: safeUser.email,
    });

    return res.json({ token, user: safeUser });
  } catch (error) {
    return res.status(401).json({ message: 'Token de Google inválido' });
  }
});

router.get('/me', authenticate, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
