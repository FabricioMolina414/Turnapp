const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  listStaff,
  addStaffMember,
  updateStaffMember,
  removeStaffMember,
  updateStaffSchedule,
} = require('../data/staff');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize(['admin', 'staff', 'superadmin']), async (req, res) => {
  const staff = await listStaff();
  return res.json({ staff });
});

router.post('/', authorize(['admin', 'superadmin']), async (req, res) => {
  const { name, role, availability, specialties, avatar, workSchedule, slotDurationMinutes } = req.body ?? {};

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

    const member = await addStaffMember({
      name,
      role,
      availability,
      specialties: parsedSpecialties,
      avatar,
      workSchedule,
      slotDurationMinutes: typeof slotDurationMinutes === 'number' ? slotDurationMinutes : undefined,
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

router.patch('/:id', authorize(['admin', 'superadmin']), async (req, res) => {
  const { id } = req.params;
  const { name, role, availability, specialties, avatar, workSchedule, slotDurationMinutes } = req.body ?? {};

  try {
    const parsedSpecialties =
      typeof specialties === 'string'
        ? specialties
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : Array.isArray(specialties)
        ? specialties
        : undefined;

    const updated = await updateStaffMember(id, {
      name,
      role,
      availability,
      specialties: parsedSpecialties,
      avatar,
      workSchedule,
      slotDurationMinutes: typeof slotDurationMinutes === 'number' ? slotDurationMinutes : undefined,
    });
    return res.json({ staff: updated });
  } catch (error) {
    if (error.message === 'STAFF_NOT_FOUND') {
      return res.status(404).json({ message: 'Profesional no encontrado.' });
    }
    if (error.message === 'STAFF_NAME_EXISTS') {
      return res.status(409).json({ message: 'Ya existe un profesional con ese nombre.' });
    }
    return res.status(500).json({ message: 'No se pudo actualizar el profesional.' });
  }
});

router.delete('/:id', authorize(['admin', 'superadmin']), async (req, res) => {
  const { id } = req.params;

  try {
    await removeStaffMember(id);
    return res.status(204).send();
  } catch (error) {
    if (error.message === 'STAFF_NOT_FOUND') {
      return res.status(404).json({ message: 'Profesional no encontrado.' });
    }
    return res.status(500).json({ message: 'No se pudo eliminar el profesional.' });
  }
});

router.patch('/:id/schedule', authorize(['admin', 'superadmin']), async (req, res) => {
  const { id } = req.params;
  const { defaultStart, defaultEnd, overrides, slotDurationMinutes } = req.body ?? {};

  try {
    const updated = await updateStaffSchedule(id, { defaultStart, defaultEnd, overrides, slotDurationMinutes });
    return res.json({ staff: updated });
  } catch (error) {
    if (error.message === 'STAFF_NOT_FOUND') {
      return res.status(404).json({ message: 'Profesional no encontrado.' });
    }
    return res.status(500).json({ message: 'No se pudo actualizar la disponibilidad.' });
  }
});

module.exports = router;
