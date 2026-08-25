const express = require('express');
const {
  addAdminUser,
  listAdmins,
  updateUserRole,
  removeAdminUser,
  resetUserPassword,
} = require('../data/users');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize(['admin', 'superadmin']));

function ensureSuperadmin(req, res, next) {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ message: 'Solo superadmin puede realizar esta acción' });
  }
  return next();
}

router.get('/admins', async (req, res) => {
  const admins = await listAdmins();
  return res.json({ admins });
});

router.post('/admins', ensureSuperadmin, async (req, res) => {
  const { name, email, password, username, role } = req.body;
  const allowedRoles = ['admin', 'staff'];

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: 'Nombre, email y contraseña son obligatorios para crear un usuario' });
  }

  if (role && !allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Rol inválido para crear el usuario' });
  }

  try {
    const admin = await addAdminUser({ name, email, password, username, role });
    return res.status(201).json({ admin });
  } catch (error) {
    if (error.message === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({ message: 'Ya existe un usuario con ese email' });
    }
    if (error.message === 'USERNAME_ALREADY_EXISTS') {
      return res.status(409).json({ message: 'Ya existe un usuario con ese nombre de usuario' });
    }
    return res.status(500).json({ message: 'No se pudo crear el usuario admin' });
  }
});

router.patch('/admins/:id', ensureSuperadmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body || {};
  const allowedRoles = ['admin', 'staff'];

  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Rol inválido para actualizar el usuario' });
  }

  try {
    const admin = await updateUserRole({ userId: id, role });
    return res.json({ admin });
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (error.message === 'ROLE_NOT_ALLOWED') {
      return res.status(400).json({ message: 'No se puede modificar este rol' });
    }
    return res.status(500).json({ message: 'No se pudo actualizar el usuario' });
  }
});

router.patch('/admins/:id/password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body || {};

  if (!password || String(password).trim().length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const admin = await resetUserPassword({
      userId: id,
      newPassword: String(password),
      actorId: req.user?.id,
    });
    return res.json({ admin });
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (error.message === 'ROLE_NOT_ALLOWED') {
      return res.status(400).json({ message: 'No se puede restablecer este usuario' });
    }
    if (error.message === 'SELF_ACTION_NOT_ALLOWED') {
      return res.status(400).json({ message: 'No podés restablecer tu propia contraseña desde aquí' });
    }
    if (error.message === 'PASSWORD_INVALID') {
      return res.status(400).json({ message: 'Contraseña inválida' });
    }
    return res.status(500).json({ message: 'No se pudo restablecer la contraseña' });
  }
});

router.delete('/admins/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await removeAdminUser({ userId: id, actorId: req.user?.id });
    return res.status(204).send();
  } catch (error) {
    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    if (error.message === 'ROLE_NOT_ALLOWED') {
      return res.status(400).json({ message: 'No se puede eliminar este usuario' });
    }
    if (error.message === 'SELF_ACTION_NOT_ALLOWED') {
      return res.status(400).json({ message: 'No podés eliminar tu propio usuario' });
    }
    if (error.message === 'USER_HAS_DEPENDENCIES') {
      return res.status(409).json({ message: 'No se puede eliminar: el usuario tiene datos asociados' });
    }
    return res.status(500).json({ message: 'No se pudo eliminar el usuario' });
  }
});

module.exports = router;
