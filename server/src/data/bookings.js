const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_FILE_PATH = path.join(__dirname, 'bookings.json');

function loadBookingsFromFile() {
  if (!fs.existsSync(DATA_FILE_PATH)) {
    saveBookingsToFile([]);
    return [];
  }

  try {
    const raw = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    throw new Error('Invalid bookings file');
  } catch (error) {
    console.error('[Bookings] Error al leer bookings.json, restaurando datos vacíos', error);
    saveBookingsToFile([]);
    return [];
  }
}

function saveBookingsToFile(data) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('[Bookings] Error al guardar bookings.json', error);
  }
}

let bookings = loadBookingsFromFile();

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

function listBookingsByRange(fromIsoDate, toIsoDate) {
  const from = new Date(fromIsoDate);
  const to = new Date(toIsoDate);
  return bookings.filter((booking) => {
    const date = new Date(booking.date);
    return date >= from && date <= to;
  });
}

function listBookingsByDate(isoDate) {
  return bookings.filter((booking) => booking.date === isoDate);
}

function getAvailableSlotsForStaff(staff, isoDate, durationMinutes) {
  const schedule = getScheduleForDate(staff, isoDate);
  if (!schedule) return [];

  const requestedDuration = Number(durationMinutes);
  const slotDuration =
    Number.isFinite(requestedDuration) && requestedDuration > 0
      ? requestedDuration
      : Number(staff.slotDurationMinutes) || 45;
  const baseStep = Number(staff.slotDurationMinutes) || 45;
  const takenSlots = listBookingsByDate(isoDate)
    .filter((booking) => booking.stylistId === staff.id && booking.status !== 'cancelled')
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

function createBooking({
  staff,
  date,
  startTime,
  durationMinutes,
  clientName,
  contact,
  serviceId,
  service,
  serviceCategory,
  price,
  notes,
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

  const conflicts = listBookingsByDate(date).some(
    (booking) =>
      booking.stylistId === staff.id &&
      booking.status !== 'cancelled' &&
      overlaps(start, end, toMinutes(booking.startTime), toMinutes(booking.endTime))
  );
  if (conflicts) {
    throw new Error('SLOT_TAKEN');
  }

  const booking = {
    id: randomUUID(),
    date,
    startTime,
    endTime: toHHMM(end),
    durationMinutes: slotDuration,
    clientName: clientName?.trim() || 'Cliente',
    contact: contact?.trim() || '',
    serviceId: serviceId || null,
    service: service?.trim() || 'Turno',
    serviceCategory: serviceCategory?.trim() || '',
    stylist: staff.name,
    stylistId: staff.id,
    paymentMethod: 'pendiente',
    price: Number(price) || 0,
    status: 'confirmado',
    notes: notes?.trim() || '',
    createdAt: new Date().toISOString(),
  };

  bookings.push(booking);
  saveBookingsToFile(bookings);
  return booking;
}

function cancelBooking(id) {
  const booking = bookings.find((item) => item.id === id);
  if (!booking) throw new Error('BOOKING_NOT_FOUND');
  booking.status = 'cancelled';
  saveBookingsToFile(bookings);
  return booking;
}

module.exports = {
  bookings,
  listBookingsByRange,
  listBookingsByDate,
  getAvailableSlotsForStaff,
  createBooking,
  cancelBooking,
  getScheduleForDate,
};
