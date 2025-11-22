const express = require('express');
const bcrypt = require('bcryptjs');
const { findUserByIdentifier, sanitizeUser } = require('../data/users');
const { signToken } = require('../utils/jwt');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { identifier, email, username, password } = req.body;
  const loginIdentifier = (identifier || email || username || '').trim();

  if (!loginIdentifier || !password) {
    return res.status(400).json({ message: 'Usuario/email y contraseña son obligatorios' });
  }

  const user = findUserByIdentifier(loginIdentifier);
  if (!user) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const token = signToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });

  return res.json({
    token,
    user: sanitizeUser(user),
  });
});

router.get('/me', authenticate, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
