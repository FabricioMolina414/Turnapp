const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_FILE_PATH = path.join(__dirname, 'staff.json');

const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="%23f1f5f9"/><circle cx="64" cy="52" r="26" fill="%2394a3b8"/><path d="M24 112c0-22 18-40 40-40s40 18 40 40" fill="%23cbd5f5"/></svg>';

const DEFAULT_AVAILABILITY_DAYS = [1, 2, 3, 4, 5, 6, 0];

const DEFAULT_SCHEDULE = {
  mode: 'continuous',
  defaultStart: '09:00',
  defaultEnd: '17:00',
  shift1Start: '09:00',
  shift1End: '13:00',
  shift2Start: '15:00',
  shift2End: '19:00',
  availabilityDays: DEFAULT_AVAILABILITY_DAYS,
  overrides: {},
};

const DEFAULT_STAFF = [
  {
    id: 'ana',
    name: 'Ana López',
    role: 'Colorista senior',
    specialties: ['Balayage', 'Tratamientos reconstructivos', 'Cortes bob'],
    availability: 'Lunes a sábado · 09:00 a 17:00',
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'martin',
    name: 'Martín Pérez',
    role: 'Barbero master',
    specialties: ['Fades', 'Perfilado de barba', 'Cejas masculinas'],
    availability: 'Lunes a viernes · 10:00 a 18:00',
    avatar:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'paula',
    name: 'Paula Quinteros',
    role: 'Manicurista y nail artist',
    specialties: ['Semipermanente', 'Nail art minimalista', 'Spa de manos'],
    availability: 'Martes a sábado · 09:00 a 15:00',
    avatar:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'bruno',
    name: 'Bruno Ledesma',
    role: 'Stylist integral',
    specialties: ['Cortes masculinos', 'Tratamientos capilares', 'Asesoría de imagen'],
    availability: 'Miércoles a domingo · 11:00 a 19:00',
    avatar:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80',
  },
];

function loadStaffFromFile() {
  if (!fs.existsSync(DATA_FILE_PATH)) {
    saveStaffToFile(DEFAULT_STAFF);
    return [...DEFAULT_STAFF];
  }

  try {
    const fileContents = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    const parsed = JSON.parse(fileContents);
    if (Array.isArray(parsed)) {
      return parsed.map((member) => ({
        ...member,
        workSchedule: member.workSchedule ? normalizeSchedule(member.workSchedule) : { ...DEFAULT_SCHEDULE },
        slotDurationMinutes:
          typeof member.slotDurationMinutes === 'number' && member.slotDurationMinutes > 0
            ? member.slotDurationMinutes
            : 45,
      }));
    }
    throw new Error('Invalid data format');
  } catch (error) {
    console.error('[Staff] Error al leer staff.json, restaurando datos por defecto', error);
    saveStaffToFile(DEFAULT_STAFF);
    return [...DEFAULT_STAFF];
  }
}

function saveStaffToFile(data) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('[Staff] Error al guardar staff.json', error);
  }
}

const staffMembers = loadStaffFromFile();

function listStaff() {
  return staffMembers;
}

function normalizeSchedule(inputSchedule) {
  if (!inputSchedule) return { ...DEFAULT_SCHEDULE };
  const rawAvailability = Array.isArray(inputSchedule.availabilityDays)
    ? inputSchedule.availabilityDays
    : DEFAULT_SCHEDULE.availabilityDays;
  const availabilityDays = rawAvailability
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
  const safeSchedule = {
    mode: inputSchedule.mode === 'split' ? 'split' : 'continuous',
    defaultStart: inputSchedule.defaultStart || DEFAULT_SCHEDULE.defaultStart,
    defaultEnd: inputSchedule.defaultEnd || DEFAULT_SCHEDULE.defaultEnd,
    shift1Start: inputSchedule.shift1Start || DEFAULT_SCHEDULE.shift1Start,
    shift1End: inputSchedule.shift1End || DEFAULT_SCHEDULE.shift1End,
    shift2Start: inputSchedule.shift2Start || DEFAULT_SCHEDULE.shift2Start,
    shift2End: inputSchedule.shift2End || DEFAULT_SCHEDULE.shift2End,
    availabilityDays: availabilityDays.length ? availabilityDays : DEFAULT_SCHEDULE.availabilityDays,
    overrides: {},
  };

  if (inputSchedule.overrides && typeof inputSchedule.overrides === 'object') {
    Object.entries(inputSchedule.overrides).forEach(([isoDate, value]) => {
      if (!isoDate || typeof isoDate !== 'string') return;
      if (value === null) return;
      if (value && typeof value === 'object') {
        const { start, end, closed } = value;
        if (closed) {
          safeSchedule.overrides[isoDate] = { closed: true };
        } else if (start && end) {
          safeSchedule.overrides[isoDate] = { start, end };
        }
      }
    });
  }

  return safeSchedule;
}

function addStaffMember({ name, role, specialties, availability, avatar, workSchedule, slotDurationMinutes }) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('STAFF_NAME_REQUIRED');
  }

  const trimmedName = name.trim();

  if (staffMembers.some((member) => member.name.toLowerCase() === trimmedName.toLowerCase())) {
    throw new Error('STAFF_NAME_EXISTS');
  }

  const normalizedSpecialties = Array.isArray(specialties)
    ? specialties
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
    : [];

  const normalizedDuration =
    typeof slotDurationMinutes === 'number' && slotDurationMinutes > 0 ? slotDurationMinutes : 45;

  const newMember = {
    id: randomUUID(),
    name: trimmedName,
    role: typeof role === 'string' ? role.trim() : '',
    specialties: normalizedSpecialties,
    availability: typeof availability === 'string' ? availability.trim() : '',
    avatar: typeof avatar === 'string' && avatar.trim() ? avatar.trim() : DEFAULT_AVATAR,
    workSchedule: normalizeSchedule(workSchedule),
    slotDurationMinutes: normalizedDuration,
  };

  staffMembers.push(newMember);
  saveStaffToFile(staffMembers);
  return newMember;
}

function updateStaffMember(id, { name, role, specialties, availability, avatar, workSchedule, slotDurationMinutes }) {
  const member = staffMembers.find((item) => item.id === id);
  if (!member) {
    throw new Error('STAFF_NOT_FOUND');
  }

  if (name && typeof name === 'string' && name.trim()) {
    const trimmedName = name.trim();
    const duplicate = staffMembers.find(
      (item) => item.id !== id && item.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      throw new Error('STAFF_NAME_EXISTS');
    }
    member.name = trimmedName;
  }

  if (role !== undefined) {
    member.role = typeof role === 'string' ? role.trim() : member.role;
  }

  if (availability !== undefined) {
    member.availability = typeof availability === 'string' ? availability.trim() : member.availability;
  }

  if (specialties !== undefined) {
    member.specialties = Array.isArray(specialties)
      ? specialties
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0)
      : member.specialties;
  }

  if (avatar !== undefined) {
    member.avatar = typeof avatar === 'string' && avatar.trim() ? avatar.trim() : member.avatar;
  }

  if (workSchedule) {
    member.workSchedule = normalizeSchedule({
      ...member.workSchedule,
      ...workSchedule,
    });
  }

  if (typeof slotDurationMinutes === 'number' && slotDurationMinutes > 0) {
    member.slotDurationMinutes = slotDurationMinutes;
  }

  saveStaffToFile(staffMembers);
  return member;
}

function removeStaffMember(id) {
  const index = staffMembers.findIndex((member) => member.id === id);
  if (index === -1) {
    throw new Error('STAFF_NOT_FOUND');
  }
  const [removed] = staffMembers.splice(index, 1);
  saveStaffToFile(staffMembers);
  return removed;
}

function updateStaffSchedule(
  id,
  { defaultStart, defaultEnd, overrides, slotDurationMinutes, mode, shift1Start, shift1End, shift2Start, shift2End, availabilityDays }
) {
  const member = staffMembers.find((item) => item.id === id);
  if (!member) {
    throw new Error('STAFF_NOT_FOUND');
  }

  member.workSchedule = normalizeSchedule({
    ...member.workSchedule,
    mode: mode || member.workSchedule?.mode,
    defaultStart: defaultStart || member.workSchedule?.defaultStart,
    defaultEnd: defaultEnd || member.workSchedule?.defaultEnd,
    shift1Start: shift1Start || member.workSchedule?.shift1Start,
    shift1End: shift1End || member.workSchedule?.shift1End,
    shift2Start: shift2Start || member.workSchedule?.shift2Start,
    shift2End: shift2End || member.workSchedule?.shift2End,
    availabilityDays: availabilityDays || member.workSchedule?.availabilityDays,
    overrides: overrides || member.workSchedule?.overrides,
  });

  if (typeof slotDurationMinutes === 'number' && slotDurationMinutes > 0) {
    member.slotDurationMinutes = slotDurationMinutes;
  }

  saveStaffToFile(staffMembers);
  return member;
}

module.exports = {
  staffMembers,
  listStaff,
  addStaffMember,
  updateStaffMember,
  removeStaffMember,
  updateStaffSchedule,
  DEFAULT_AVATAR,
  DEFAULT_STAFF,
};
