const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { listServices, addService, updateService, removeService } = require('../data/services');

const router = express.Router();

router.use(authenticate, authorize(['admin', 'superadmin']));

router.get('/', (req, res) => {
  return res.json({ services: listServices() });
});

router.post('/', (req, res) => {
  const { name, durationMinutes, price, category, professionals, description, active } = req.body ?? {};
  try {
    const parsedProfessionals =
      typeof professionals === 'string'
        ? professionals
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : Array.isArray(professionals)
        ? professionals
        : [];

    const service = addService({
      name,
      durationMinutes,
      price,
      category,
      professionals: parsedProfessionals,
      description,
      active,
    });
    return res.status(201).json({ service });
  } catch (error) {
    if (error.message === 'SERVICE_NAME_REQUIRED') {
      return res.status(400).json({ message: 'El nombre es obligatorio.' });
    }
    return res.status(500).json({ message: 'No se pudo crear el servicio.' });
  }
});

router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { name, durationMinutes, price, category, professionals, description, active } = req.body ?? {};

  try {
    const parsedProfessionals =
      typeof professionals === 'string'
        ? professionals
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : Array.isArray(professionals)
        ? professionals
        : undefined;

    const service = updateService(id, {
      name,
      durationMinutes,
      price,
      category,
      professionals: parsedProfessionals,
      description,
      active,
    });
    return res.json({ service });
  } catch (error) {
    if (error.message === 'SERVICE_NOT_FOUND') {
      return res.status(404).json({ message: 'Servicio no encontrado.' });
    }
    return res.status(500).json({ message: 'No se pudo actualizar el servicio.' });
  }
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    removeService(id);
    return res.status(204).send();
  } catch (error) {
    if (error.message === 'SERVICE_NOT_FOUND') {
      return res.status(404).json({ message: 'Servicio no encontrado.' });
    }
    return res.status(500).json({ message: 'No se pudo eliminar el servicio.' });
  }
});

module.exports = router;
