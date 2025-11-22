const { verifyToken } = require('../utils/jwt');
const { findUserById, sanitizeUser } = require('../data/users');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no provisto' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = verifyToken(token);
    const user = findUserById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: 'Usuario inválido' });
    }

    req.user = sanitizeUser(user);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

function authorize(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(500).json({ message: 'Falta autenticación previa' });
    }

    if (roles.length === 0 || roles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({ message: 'No tenés permisos para esta acción' });
  };
}

module.exports = {
  authenticate,
  authorize,
};
