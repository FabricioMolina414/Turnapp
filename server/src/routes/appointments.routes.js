const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { listStaff } = require('../data/staff');
const { listServices, serviceSupportsProfessional } = require('../data/services');
const { sendConfirmedBookingEmail } = require('../services/notifications');
const {
  listBookingsByRange,
  listBookingsByDate,
  cancelBooking,
  confirmBooking,
  createBooking,
  getAvailableSlotsForStaff,
} = require('../data/bookings');

const router = express.Router();
const readRoles = ['admin', 'staff', 'superadmin'];
const writeRoles = ['admin', 'superadmin'];

router.use(authenticate);

// Alta manual: para cuando un cliente le pide el turno directo a Aaron
// (llamada, WhatsApp, en persona) y no pasa por el sitio público. Queda
// confirmado de una porque el turno ya está acordado con el cliente.
router.post('/', authorize(writeRoles), async (req, res) => {
  const {
    staffId,
    date,
    slot,
    durationMinutes,
    clientName,
    contactPhone,
    contactEmail,
    serviceId,
    service,
    serviceCategory,
    price,
    notes,
    paymentMethod,
  } = req.body ?? {};

  if (!clientName || !String(clientName).trim()) {
    return res.status(400).json({ message: 'El nombre del cliente es obligatorio.' });
  }
  if (!date || !slot) {
    return res.status(400).json({ message: 'Fecha y horario son obligatorios.' });
  }

  const staffMembers = await listStaff();
  const staff = staffMembers.find((member) => member.id === staffId);
  if (!staff) {
    return res.status(404).json({ message: 'Profesional no encontrado.' });
  }

  try {
    const serviceInfo = serviceId ? listServices().find((item) => item.id === serviceId) ?? null : null;
    if (serviceId && !serviceInfo) {
      return res.status(400).json({ message: 'El servicio seleccionado no existe.' });
    }
    if (serviceInfo && !serviceSupportsProfessional(serviceInfo, staff.name)) {
      return res.status(400).json({ message: 'Ese servicio no puede reservarse con este profesional.' });
    }

    const booking = await createBooking({
      staff,
      date,
      startTime: slot,
      durationMinutes: durationMinutes || serviceInfo?.durationMinutes,
      clientName,
      contactPhone,
      contactEmail,
      serviceId: serviceInfo?.id,
      service: serviceInfo?.name || service,
      serviceCategory: serviceInfo?.category || serviceCategory,
      price: serviceInfo?.price ?? price ?? 0,
      notes,
      status: 'confirmed',
      paymentMethod: paymentMethod?.trim() || 'Efectivo',
      paymentStatus: 'approved',
    });

    return res.status(201).json({ booking });
  } catch (error) {
    if (error.message === 'STAFF_NOT_AVAILABLE' || error.message === 'OUTSIDE_SCHEDULE') {
      return res.status(400).json({ message: 'El profesional no atiende en ese horario.' });
    }
    if (error.message === 'SLOT_TAKEN') {
      return res.status(409).json({ message: 'Ese horario ya está ocupado.' });
    }
    return res.status(500).json({ message: 'No se pudo cargar el turno.' });
  }
});

router.get('/week', authorize(readRoles), async (req, res) => {
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

  const weekAppointments = await listBookingsByRange(startOfWeek.toISOString(), endOfWeek.toISOString());
  const grouped = weekAppointments.reduce((acc, booking) => {
    acc[booking.date] = acc[booking.date] || [];
    acc[booking.date].push(booking);
    return acc;
  }, {});

  return res.json({ schedule: grouped });
});

router.get('/day/:isoDate', authorize(readRoles), async (req, res) => {
  const { isoDate } = req.params;
  const appointments = await listBookingsByDate(isoDate);
  return res.json({ appointments });
});

router.get('/month', authorize(readRoles), async (req, res) => {
  const { referenceDate } = req.query;
  const date = referenceDate ? new Date(referenceDate) : new Date();
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);

  const monthAppointments = await listBookingsByRange(
    startOfMonth.toISOString(),
    endOfMonth.toISOString()
  );

  const summary = monthAppointments.reduce(
    (acc, appointment) => {
      const status = (appointment.status || '').toString().toLowerCase();
      if (status === 'confirmed' || status === 'confirmado') {
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

router.delete('/:id', authorize(['admin', 'superadmin']), async (req, res) => {
  const { id } = req.params;
  try {
    await cancelBooking(id);
    return res.status(204).send();
  } catch (error) {
    if (error.message === 'BOOKING_NOT_FOUND') {
      return res.status(404).json({ message: 'Turno no encontrado.' });
    }
    return res.status(500).json({ message: 'No se pudo cancelar el turno.' });
  }
});

router.patch('/:id/confirm', authorize(['admin', 'superadmin']), async (req, res) => {
  const { id } = req.params;

  try {
    const booking = await confirmBooking(id);
    let emailNotification = null;

    try {
      emailNotification = await sendConfirmedBookingEmail(booking);
    } catch (notificationError) {
      console.error('[Appointments] Error al enviar email de confirmacion', notificationError);
      emailNotification = {
        delivered: false,
        skipped: false,
        reason: 'send_failed',
      };
    }

    return res.json({ booking, notifications: { email: emailNotification } });
  } catch (error) {
    if (error.message === 'BOOKING_NOT_FOUND') {
      return res.status(404).json({ message: 'Turno no encontrado.' });
    }
    if (error.message === 'BOOKING_NOT_PENDING') {
      return res.status(409).json({ message: 'Solo se pueden confirmar turnos pendientes.' });
    }
    return res.status(500).json({ message: 'No se pudo confirmar el turno.' });
  }
});

router.get('/availability', authorize(readRoles), async (req, res) => {
  const { staffId, date, durationMinutes } = req.query;
  if (!staffId || !date) {
    return res.status(400).json({ message: 'staffId y date son obligatorios' });
  }
  const staffMembers = await listStaff();
  const staff = staffMembers.find((member) => member.id === staffId);
  if (!staff) {
    return res.status(404).json({ message: 'Profesional no encontrado' });
  }
  const slots = await getAvailableSlotsForStaff(staff, date, durationMinutes);
  return res.json({ slots });
});

module.exports = router;
