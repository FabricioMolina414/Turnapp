const express = require('express');
const { listStaff } = require('../data/staff');
const { listServices } = require('../data/services');
const {
  getAvailableSlotsForStaff,
  createBooking,
} = require('../data/bookings');

const router = express.Router();

router.get('/staff', (req, res) => {
  return res.json({ staff: listStaff() });
});

router.get('/services', (req, res) => {
  const services = listServices().filter((service) => service?.active !== false);
  return res.json({ services });
});

router.get('/staff/:id/slots', (req, res) => {
  const { id } = req.params;
  const { date, durationMinutes } = req.query;

  const staff = listStaff().find((member) => member.id === id);
  if (!staff) {
    return res.status(404).json({ message: 'Profesional no encontrado' });
  }
  if (!date) {
    return res.status(400).json({ message: 'La fecha es obligatoria' });
  }

  const slots = getAvailableSlotsForStaff(staff, date, durationMinutes);
  return res.json({ slots });
});

router.post('/bookings', (req, res) => {
  const {
    staffId,
    date,
    slot,
    durationMinutes,
    clientName,
    contact,
    serviceId,
    service,
    serviceCategory,
    notes,
  } =
    req.body ?? {};

  const staff = listStaff().find((member) => member.id === staffId);
  if (!staff) {
    return res.status(404).json({ message: 'Profesional no encontrado' });
  }
  if (!date || !slot) {
    return res.status(400).json({ message: 'Fecha y horario son obligatorios' });
  }

  try {
    const serviceInfo = listServices().find((item) => item.id === serviceId) ?? null;
    const booking = createBooking({
      staff,
      date,
      startTime: slot,
      durationMinutes,
      clientName,
      contact,
      serviceId: serviceInfo?.id,
      service: serviceInfo?.name || service,
      serviceCategory: serviceInfo?.category || serviceCategory,
      price: serviceInfo?.price ?? 0,
      notes,
    });
    return res.status(201).json({ booking });
  } catch (error) {
    if (error.message === 'STAFF_NOT_AVAILABLE' || error.message === 'OUTSIDE_SCHEDULE') {
      return res.status(400).json({ message: 'El profesional no atiende en ese horario.' });
    }
    if (error.message === 'SLOT_TAKEN') {
      return res.status(409).json({ message: 'Ese horario ya fue reservado.' });
    }
    return res.status(500).json({ message: 'No se pudo reservar el turno.' });
  }
});

module.exports = router;
