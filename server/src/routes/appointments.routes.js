const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { listStaff } = require('../data/staff');
const {
  listBookingsByRange,
  listBookingsByDate,
  cancelBooking,
  getAvailableSlotsForStaff,
} = require('../data/bookings');

const router = express.Router();

router.use(authenticate, authorize(['admin', 'superadmin']));

router.get('/week', (req, res) => {
  const { referenceDate } = req.query;
  const date = referenceDate ? new Date(referenceDate) : new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() + diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const weekAppointments = listBookingsByRange(startOfWeek.toISOString(), endOfWeek.toISOString());
  const grouped = weekAppointments.reduce((acc, booking) => {
    acc[booking.date] = acc[booking.date] || [];
    acc[booking.date].push(booking);
    return acc;
  }, {});

  return res.json({ schedule: grouped });
});

router.get('/day/:isoDate', (req, res) => {
  const { isoDate } = req.params;
  const appointments = listBookingsByDate(isoDate);
  return res.json({ appointments });
});

router.get('/month', (req, res) => {
  const { referenceDate } = req.query;
  const date = referenceDate ? new Date(referenceDate) : new Date();
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const monthAppointments = listBookingsByRange(
    startOfMonth.toISOString(),
    endOfMonth.toISOString()
  );

  const summary = monthAppointments.reduce(
    (acc, appointment) => {
      const status = (appointment.status || '').toString().toLowerCase();
      if (status === 'confirmado') {
        acc.confirmedCount += 1;
        acc.confirmedRevenue += appointment.price || 0;
      }
      if (status === 'cancelado' || status === 'cancelada' || status === 'cancelled') {
        acc.cancelledCount += 1;
      }
      acc.totalCount += 1;
      return acc;
    },
    { confirmedCount: 0, confirmedRevenue: 0, cancelledCount: 0, totalCount: 0 }
  );

  return res.json({ summary });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    cancelBooking(id);
    return res.status(204).send();
  } catch (error) {
    if (error.message === 'BOOKING_NOT_FOUND') {
      return res.status(404).json({ message: 'Turno no encontrado.' });
    }
    return res.status(500).json({ message: 'No se pudo cancelar el turno.' });
  }
});

router.get('/availability', (req, res) => {
  const { staffId, date, durationMinutes } = req.query;
  if (!staffId || !date) {
    return res.status(400).json({ message: 'staffId y date son obligatorios' });
  }
  const staff = listStaff().find((member) => member.id === staffId);
  if (!staff) {
    return res.status(404).json({ message: 'Profesional no encontrado' });
  }
  const slots = getAvailableSlotsForStaff(staff, date, durationMinutes);
  return res.json({ slots });
});

module.exports = router;
