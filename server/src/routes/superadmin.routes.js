const express = require('express');
const { addAdminUser, listAdmins } = require('../data/users');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize(['superadmin']));

router.get('/admins', (req, res) => {
  return res.json({ admins: listAdmins() });
});

router.post('/admins', (req, res) => {
  const { name, email, password, username } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: 'Nombre, email y contraseña son obligatorios para crear un admin' });
  }

  try {
    const admin = addAdminUser({ name, email, password, username });
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

module.exports = router;
