const { randomUUID } = require('crypto');
const { prisma } = require('../config/database');

const PENDING_CONFIRMATION_STATUS = 'pending_confirmation';
const CONFIRMED_STATUS = 'confirmed';
const CANCELLED_STATUSES = new Set(['cancelled', 'cancelado', 'cancelada']);
const COMPLETED_STATUS = 'completed';
const PAYMENT_PENDING_STATUS = 'pending';
const PAYMENT_APPROVED_STATUS = 'approved';
// Ventana silenciosa: si nadie confirmó ni canceló un turno "pendiente" en
// este tiempo, deja de bloquear ese horario para otros clientes. Es solo un
// límite de disponibilidad, nunca se le muestra al cliente como un plazo y
// nunca le impide al admin confirmar -- confirmBooking() no la usa, así que
// un turno pendiente siempre se puede confirmar sin importar cuánto tiempo
// pasó, mientras el horario no haya sido tomado por otra reserva.
const PENDING_CONFIRMATION_WINDOW_MS = 24 * 60 * 60 * 1000;

const toMinutes = (time) => {
  const [hh = '0', mm = '0'] = String(time || '').split(':');
  return Number(hh) * 60 + Number(mm);
};

const toHHMM = (minutes) => {
  const hh = Math.floor(minutes / 60)
    .toString()
    .padStart(2, '0');
  const mm = (minutes % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
};

const overlaps = (startA, endA, startB, endB) => {
  return startA < endB && startB < endA;
};

function parseDateValue(value) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getPendingConfirmationExpiresAt(value) {
  const createdAt = parseDateValue(value);
  if (!createdAt) return null;
  return new Date(createdAt.getTime() + PENDING_CONFIRMATION_WINDOW_MS);
}

// Solo se usa para decidir si un turno pendiente sigue bloqueando el
// horario (ver PENDING_CONFIRMATION_WINDOW_MS más arriba). No afecta el
// estado que ve el cliente/admin ni la posibilidad de confirmarlo.
function isPendingConfirmationStale(booking, referenceDate = new Date()) {
  const normalizedStatus = (booking?.status || '').toString().toLowerCase();
  if (normalizedStatus !== PENDING_CONFIRMATION_STATUS) {
    return false;
  }

  const expiresAt = getPendingConfirmationExpiresAt(booking.createdAt);
  if (!expiresAt) return false;

  return expiresAt.getTime() <= referenceDate.getTime();
}

function isBlockingStatus(status) {
  const normalizedStatus = (status || '').toString().toLowerCase();
  return normalizedStatus === CONFIRMED_STATUS || normalizedStatus === COMPLETED_STATUS;
}

function isBookingBlockingSlot(booking, referenceDate = new Date()) {
  const normalizedStatus = (booking?.status || '').toString().toLowerCase();
  if (CANCELLED_STATUSES.has(normalizedStatus)) {
    return false;
  }
  if (normalizedStatus === PENDING_CONFIRMATION_STATUS) {
    return !isPendingConfirmationStale(booking, referenceDate);
  }
  return isBlockingStatus(normalizedStatus);
}

function toIsoDateOnly(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function mapBookingRow(booking) {
  const createdAt = parseDateValue(booking.createdAt);
  const status = booking.status || '';
  const normalizedStatus = status.toString().toLowerCase();
  // Informativo para el admin ("pendiente desde hace X"), nunca bloquea
  // la confirmación ni se le muestra al cliente como un plazo.
  const pendingSince =
    normalizedStatus === PENDING_CONFIRMATION_STATUS ? createdAt : null;

  return {
    id: booking.id,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    durationMinutes: booking.durationMinutes,
    clientName: booking.clientName,
    contact: booking.contact || '',
    contactPhone: booking.contactPhone || '',
    contactEmail: booking.contactEmail || '',
    serviceId: booking.serviceId || null,
    service: booking.service,
    serviceCategory: booking.serviceCategory || '',
    stylist: booking.stylist,
    stylistId: booking.stylistId,
    paymentMethod: booking.paymentMethod || '',
    paymentStatus: booking.paymentStatus || '',
    paymentId: booking.paymentId || undefined,
    paymentApprovedAt: booking.paymentApprovedAt || undefined,
    price: Number(booking.price) || 0,
    status,
    rawStatus: booking.status,
    notes: booking.notes || '',
    createdAt: createdAt ? createdAt.toISOString() : String(booking.createdAt),
    pendingSince: pendingSince ? pendingSince.toISOString() : undefined,
  };
}

function getScheduleForDate(staff, isoDate) {
  if (!staff) return null;
  const overrides = staff.workSchedule?.overrides ?? {};
  const override = overrides[isoDate];
  if (override) {
    if (override.closed) return null;
    return [{ start: override.start, end: override.end }];
  }

  const availabilityDays = staff.workSchedule?.availabilityDays;
  if (Array.isArray(availabilityDays)) {
    const day = new Date(isoDate).getDay();
    if (!availabilityDays.includes(day)) {
      return null;
    }
  }

  const mode = staff.workSchedule?.mode || 'continuous';
  if (mode === 'split') {
    const shift1Start = staff.workSchedule?.shift1Start;
    const shift1End = staff.workSchedule?.shift1End;
    const shift2Start = staff.workSchedule?.shift2Start;
    const shift2End = staff.workSchedule?.shift2End;
    const intervals = [];
    if (shift1Start && shift1End) {
      intervals.push({ start: shift1Start, end: shift1End });
    }
    if (shift2Start && shift2End) {
      intervals.push({ start: shift2Start, end: shift2End });
    }
    if (intervals.length) {
      return intervals;
    }
  }

  const defaultStart = staff.workSchedule?.defaultStart || '09:00';
  const defaultEnd = staff.workSchedule?.defaultEnd || '17:00';
  return [{ start: defaultStart, end: defaultEnd }];
}

async function listBookingsByRange(fromIsoDate, toIsoDate) {
  const fromDate = toIsoDateOnly(fromIsoDate);
  const toDate = toIsoDateOnly(toIsoDate);

  if (!fromDate || !toDate) {
    return [];
  }

  const items = await prisma.appBooking.findMany({
    where: {
      date: {
        gte: fromDate,
        lte: toDate,
      },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  return items.map(mapBookingRow);
}

async function listBookingsByDate(isoDate) {
  const items = await prisma.appBooking.findMany({
    where: { date: isoDate },
    orderBy: { startTime: 'asc' },
  });

  return items.map(mapBookingRow);
}

async function getAvailableSlotsForStaff(staff, isoDate, durationMinutes) {
  const schedule = getScheduleForDate(staff, isoDate);
  if (!schedule) return [];

  const requestedDuration = Number(durationMinutes);
  const slotDuration =
    Number.isFinite(requestedDuration) && requestedDuration > 0
      ? requestedDuration
      : Number(staff.slotDurationMinutes) || 45;
  const baseStep = Number(staff.slotDurationMinutes) || 45;

  const takenBookings = await prisma.appBooking.findMany({
    where: {
      date: isoDate,
      stylistId: staff.id,
      status: {
        notIn: ['cancelled', 'cancelado', 'cancelada'],
      },
    },
    orderBy: { startTime: 'asc' },
  });

  const takenSlots = takenBookings
    .filter((booking) => isBookingBlockingSlot(booking))
    .map((booking) => ({
      start: toMinutes(booking.startTime),
      end: toMinutes(booking.endTime),
    }))
    .sort((a, b) => a.start - b.start);

  const slots = new Set();
  const freeIntervals = [];

  schedule.forEach((interval) => {
    const startMinutes = toMinutes(interval.start);
    const endMinutes = toMinutes(interval.end);

    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || endMinutes <= startMinutes) {
      return;
    }

    let cursor = startMinutes;
    takenSlots.forEach((booking) => {
      if (booking.end <= startMinutes || booking.start >= endMinutes) {
        return;
      }
      if (booking.start > cursor) {
        freeIntervals.push({ start: cursor, end: Math.min(booking.start, endMinutes) });
      }
      cursor = Math.max(cursor, booking.end);
    });

    if (cursor < endMinutes) {
      freeIntervals.push({ start: cursor, end: endMinutes });
    }

    for (let slotStart = startMinutes; slotStart + slotDuration <= endMinutes; slotStart += baseStep) {
      const slotEnd = slotStart + slotDuration;
      const collides = takenSlots.some(({ start, end }) => overlaps(slotStart, slotEnd, start, end));
      if (!collides) {
        slots.add(toHHMM(slotStart));
      }
    }
  });

  freeIntervals.forEach((interval) => {
    if (interval.end - interval.start < slotDuration) {
      return;
    }
    const slotEnd = interval.start + slotDuration;
    const collides = takenSlots.some(({ start, end }) => overlaps(interval.start, slotEnd, start, end));
    if (!collides) {
      slots.add(toHHMM(interval.start));
    }
  });

  return Array.from(slots).sort();
}

async function createBooking({
  staff,
  date,
  startTime,
  durationMinutes,
  clientName,
  contact,
  contactPhone,
  contactEmail,
  serviceId,
  service,
  serviceCategory,
  price,
  notes,
  // Por defecto replica el flujo público (reserva online a confirmar).
  // El alta manual del admin pasa status/paymentMethod/paymentStatus
  // propios porque el turno ya está acordado con el cliente.
  status = PENDING_CONFIRMATION_STATUS,
  paymentMethod = 'Transferencia',
  paymentStatus = PAYMENT_PENDING_STATUS,
}) {
  if (!staff) throw new Error('STAFF_REQUIRED');
  if (!date || !startTime) throw new Error('DATE_AND_TIME_REQUIRED');

  const schedule = getScheduleForDate(staff, date);
  if (!schedule) throw new Error('STAFF_NOT_AVAILABLE');

  const slotDuration = Number(durationMinutes) || Number(staff.slotDurationMinutes) || 45;
  const start = toMinutes(startTime);
  const end = start + slotDuration;

  const fitsSchedule = schedule.some((interval) => {
    const scheduleStart = toMinutes(interval.start);
    const scheduleEnd = toMinutes(interval.end);
    return start >= scheduleStart && end <= scheduleEnd;
  });

  if (!fitsSchedule) {
    throw new Error('OUTSIDE_SCHEDULE');
  }

  const existing = await prisma.appBooking.findMany({
    where: {
      date,
      stylistId: staff.id,
      status: {
        notIn: ['cancelled', 'cancelado', 'cancelada'],
      },
    },
  });

  const conflicts = existing
    .filter((booking) => isBookingBlockingSlot(booking))
    .some((booking) =>
    overlaps(start, end, toMinutes(booking.startTime), toMinutes(booking.endTime))
    );

  if (conflicts) {
    throw new Error('SLOT_TAKEN');
  }

  const created = await prisma.appBooking.create({
    data: {
      id: randomUUID(),
      date,
      startTime,
      endTime: toHHMM(end),
      durationMinutes: slotDuration,
      clientName: clientName?.trim() || 'Cliente',
      contact: contactPhone?.trim() || contact?.trim() || '',
      contactPhone: contactPhone?.trim() || '',
      contactEmail: contactEmail?.trim() || '',
      serviceId: serviceId || null,
      service: service?.trim() || 'Turno',
      serviceCategory: serviceCategory?.trim() || '',
      stylist: staff.name,
      stylistId: staff.id,
      paymentMethod,
      paymentStatus,
      price: Number(price) || 0,
      status,
      notes: notes?.trim() || '',
    },
  });

  return mapBookingRow(created);
}

async function cancelBooking(id) {
  try {
    const updated = await prisma.appBooking.update({
      where: { id },
      data: { status: 'cancelled' },
    });
    return mapBookingRow(updated);
  } catch (error) {
    if (error && error.code === 'P2025') {
      throw new Error('BOOKING_NOT_FOUND');
    }
    throw error;
  }
}

async function confirmBooking(id) {
  const booking = await prisma.appBooking.findUnique({
    where: { id },
  });

  if (!booking) {
    throw new Error('BOOKING_NOT_FOUND');
  }

  // A propósito no hay chequeo de vencimiento acá: un turno pendiente
  // siempre se puede confirmar sin importar cuánto tiempo pasó desde que
  // se pidió (ver PENDING_CONFIRMATION_WINDOW_MS). Si mientras tanto otro
  // cliente ya confirmó ese mismo horario, el admin lo va a ver reflejado
  // en la agenda y puede decidir manualmente cómo resolverlo.
  const normalizedStatus = (booking.status || '').toString().toLowerCase();
  if (normalizedStatus !== PENDING_CONFIRMATION_STATUS) {
    throw new Error('BOOKING_NOT_PENDING');
  }

  const updated = await prisma.appBooking.update({
    where: { id },
    data: {
      status: CONFIRMED_STATUS,
      paymentStatus: PAYMENT_APPROVED_STATUS,
      paymentApprovedAt: new Date().toISOString(),
    },
  });

  return mapBookingRow(updated);
}

module.exports = {
  listBookingsByRange,
  listBookingsByDate,
  getAvailableSlotsForStaff,
  createBooking,
  cancelBooking,
  confirmBooking,
  getScheduleForDate,
  PENDING_CONFIRMATION_STATUS,
  CONFIRMED_STATUS,
  PENDING_CONFIRMATION_WINDOW_MS,
};
