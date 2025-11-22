const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { listStaff, addStaffMember, removeStaffMember } = require('../data/staff');

const router = express.Router();

router.use(authenticate, authorize(['admin', 'superadmin']));

router.get('/', (req, res) => {
  return res.json({ staff: listStaff() });
});

router.post('/', (req, res) => {
  const { name, role, availability, specialties, avatar } = req.body ?? {};

  try {
    const parsedSpecialties =
      typeof specialties === 'string'
        ? specialties
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : Array.isArray(specialties)
        ? specialties
        : [];

    const member = addStaffMember({
      name,
      role,
      availability,
      specialties: parsedSpecialties,
      avatar,
    });

    return res.status(201).json({ member });
  } catch (error) {
    if (error.message === 'STAFF_NAME_REQUIRED') {
      return res.status(400).json({ message: 'El nombre es obligatorio.' });
    }
    if (error.message === 'STAFF_NAME_EXISTS') {
      return res.status(409).json({ message: 'Ya existe un profesional con ese nombre.' });
    }
    return res.status(500).json({ message: 'No se pudo crear el profesional.' });
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  try {
    removeStaffMember(id);
    return res.status(204).send();
  } catch (error) {
    if (error.message === 'STAFF_NOT_FOUND') {
      return res.status(404).json({ message: 'Profesional no encontrado.' });
    }
    return res.status(500).json({ message: 'No se pudo eliminar el profesional.' });
  }
});

module.exports = router;
