const { randomUUID } = require('crypto');
const { prisma } = require('../config/database');

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

const LEGACY_DEFAULT_SCHEDULE = { ...DEFAULT_SCHEDULE };

const DEFAULT_STAFF = [
  {
    id: 'ana',
    name: 'Ana López',
    role: 'Colorista senior',
    specialties: ['Balayage', 'Tratamientos reconstructivos', 'Cortes bob'],
    availability: 'Lunes a sábado · 09:00 a 17:00',
    workSchedule: {
      ...DEFAULT_SCHEDULE,
      availabilityDays: [1, 2, 3, 4, 5, 6],
      defaultStart: '09:00',
      defaultEnd: '17:00',
    },
    slotDurationMinutes: 45,
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'martin',
    name: 'Martín Pérez',
    role: 'Barbero master',
    specialties: ['Fades', 'Perfilado de barba', 'Cejas masculinas'],
    availability: 'Lunes a viernes · 10:00 a 18:00',
    workSchedule: {
      ...DEFAULT_SCHEDULE,
      availabilityDays: [1, 2, 3, 4, 5],
      defaultStart: '10:00',
      defaultEnd: '18:00',
    },
    slotDurationMinutes: 45,
    avatar:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'paula',
    name: 'Paula Quinteros',
    role: 'Manicurista y nail artist',
    specialties: ['Semipermanente', 'Nail art minimalista', 'Spa de manos'],
    availability: 'Martes a sábado · 09:00 a 15:00',
    workSchedule: {
      ...DEFAULT_SCHEDULE,
      availabilityDays: [2, 3, 4, 5, 6],
      defaultStart: '09:00',
      defaultEnd: '15:00',
    },
    slotDurationMinutes: 60,
    avatar:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'bruno',
    name: 'Bruno Ledesma',
    role: 'Stylist integral',
    specialties: ['Cortes masculinos', 'Tratamientos capilares', 'Asesoría de imagen'],
    availability: 'Miércoles a domingo · 11:00 a 19:00',
    workSchedule: {
      ...DEFAULT_SCHEDULE,
      availabilityDays: [3, 4, 5, 6, 0],
      defaultStart: '11:00',
      defaultEnd: '19:00',
    },
    slotDurationMinutes: 45,
    avatar:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80',
  },
];

function normalizeSchedule(inputSchedule) {
  if (!inputSchedule || typeof inputSchedule !== 'object') return { ...DEFAULT_SCHEDULE };
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

let seedPromise = null;

function hasLegacyDefaultSchedule(workSchedule) {
  const normalizedIncoming = normalizeSchedule(workSchedule);
  const normalizedLegacy = normalizeSchedule(LEGACY_DEFAULT_SCHEDULE);
  return JSON.stringify(normalizedIncoming) === JSON.stringify(normalizedLegacy);
}

async function ensureSeededStaff() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const total = await prisma.appStaff.count();
      if (total === 0) {
        await prisma.appStaff.createMany({
          data: DEFAULT_STAFF.map((member) => ({
            id: member.id,
            name: member.name,
            role: member.role,
            specialties: member.specialties,
            availability: member.availability,
            avatar: member.avatar,
            workSchedule: normalizeSchedule(member.workSchedule),
            slotDurationMinutes: member.slotDurationMinutes || 45,
          })),
        });
        return;
      }

      const seededMembers = await prisma.appStaff.findMany({
        where: {
          id: {
            in: DEFAULT_STAFF.map((member) => member.id),
          },
        },
      });

      await Promise.all(
        seededMembers.map((member) => {
          const definition = DEFAULT_STAFF.find((item) => item.id === member.id);
          if (!definition) return Promise.resolve();

          const shouldRefreshSchedule =
            hasLegacyDefaultSchedule(member.workSchedule) &&
            Number(member.slotDurationMinutes || 45) === 45;

          if (!shouldRefreshSchedule) {
            return Promise.resolve();
          }

          return prisma.appStaff.update({
            where: { id: member.id },
            data: {
              availability: definition.availability,
              workSchedule: normalizeSchedule(definition.workSchedule),
              slotDurationMinutes: definition.slotDurationMinutes || 45,
            },
          });
        })
      );
    })();
  }

  return seedPromise;
}

function mapStaffRow(member) {
  return {
    id: member.id,
    name: member.name,
    role: member.role || '',
    specialties: Array.isArray(member.specialties) ? member.specialties : [],
    availability: member.availability || '',
    avatar: member.avatar || DEFAULT_AVATAR,
    workSchedule: normalizeSchedule(member.workSchedule),
    slotDurationMinutes:
      typeof member.slotDurationMinutes === 'number' && member.slotDurationMinutes > 0
        ? member.slotDurationMinutes
        : 45,
  };
}

async function listStaff() {
  await ensureSeededStaff();
  const members = await prisma.appStaff.findMany({
    orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
  });
  return members.map(mapStaffRow);
}

async function addStaffMember({ name, role, specialties, availability, avatar, workSchedule, slotDurationMinutes }) {
  await ensureSeededStaff();

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('STAFF_NAME_REQUIRED');
  }

  const trimmedName = name.trim();
  const duplicate = await prisma.appStaff.findFirst({
    where: { name: { equals: trimmedName, mode: 'insensitive' } },
  });

  if (duplicate) {
    throw new Error('STAFF_NAME_EXISTS');
  }

  const normalizedSpecialties = Array.isArray(specialties)
    ? specialties
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
    : [];

  const normalizedDuration =
    typeof slotDurationMinutes === 'number' && slotDurationMinutes > 0 ? slotDurationMinutes : 45;

  const created = await prisma.appStaff.create({
    data: {
      id: randomUUID(),
      name: trimmedName,
      role: typeof role === 'string' ? role.trim() : '',
      specialties: normalizedSpecialties,
      availability: typeof availability === 'string' ? availability.trim() : '',
      avatar: typeof avatar === 'string' && avatar.trim() ? avatar.trim() : DEFAULT_AVATAR,
      workSchedule: normalizeSchedule(workSchedule),
      slotDurationMinutes: normalizedDuration,
    },
  });

  return mapStaffRow(created);
}

async function updateStaffMember(id, { name, role, specialties, availability, avatar, workSchedule, slotDurationMinutes }) {
  await ensureSeededStaff();

  const member = await prisma.appStaff.findUnique({ where: { id } });
  if (!member) {
    throw new Error('STAFF_NOT_FOUND');
  }

  const data = {};

  if (name && typeof name === 'string' && name.trim()) {
    const trimmedName = name.trim();
    const duplicate = await prisma.appStaff.findFirst({
      where: {
        id: { not: id },
        name: { equals: trimmedName, mode: 'insensitive' },
      },
    });

    if (duplicate) {
      throw new Error('STAFF_NAME_EXISTS');
    }

    data.name = trimmedName;
  }

  if (role !== undefined) {
    data.role = typeof role === 'string' ? role.trim() : member.role;
  }

  if (availability !== undefined) {
    data.availability = typeof availability === 'string' ? availability.trim() : member.availability;
  }

  if (specialties !== undefined) {
    data.specialties = Array.isArray(specialties)
      ? specialties
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0)
      : member.specialties;
  }

  if (avatar !== undefined) {
    data.avatar = typeof avatar === 'string' && avatar.trim() ? avatar.trim() : member.avatar;
  }

  if (workSchedule) {
    data.workSchedule = normalizeSchedule({
      ...normalizeSchedule(member.workSchedule),
      ...workSchedule,
    });
  }

  if (typeof slotDurationMinutes === 'number' && slotDurationMinutes > 0) {
    data.slotDurationMinutes = slotDurationMinutes;
  }

  const updated = await prisma.appStaff.update({
    where: { id },
    data,
  });

  return mapStaffRow(updated);
}

async function removeStaffMember(id) {
  await ensureSeededStaff();

  try {
    const removed = await prisma.appStaff.delete({ where: { id } });
    return mapStaffRow(removed);
  } catch (error) {
    if (error && error.code === 'P2025') {
      throw new Error('STAFF_NOT_FOUND');
    }
    throw error;
  }
}

async function updateStaffSchedule(
  id,
  {
    defaultStart,
    defaultEnd,
    overrides,
    slotDurationMinutes,
    mode,
    shift1Start,
    shift1End,
    shift2Start,
    shift2End,
    availabilityDays,
  }
) {
  await ensureSeededStaff();

  const member = await prisma.appStaff.findUnique({ where: { id } });
  if (!member) {
    throw new Error('STAFF_NOT_FOUND');
  }

  const currentSchedule = normalizeSchedule(member.workSchedule);
  const nextSchedule = normalizeSchedule({
    ...currentSchedule,
    mode: mode || currentSchedule.mode,
    defaultStart: defaultStart || currentSchedule.defaultStart,
    defaultEnd: defaultEnd || currentSchedule.defaultEnd,
    shift1Start: shift1Start || currentSchedule.shift1Start,
    shift1End: shift1End || currentSchedule.shift1End,
    shift2Start: shift2Start || currentSchedule.shift2Start,
    shift2End: shift2End || currentSchedule.shift2End,
    availabilityDays: availabilityDays || currentSchedule.availabilityDays,
    overrides: overrides || currentSchedule.overrides,
  });

  const updateData = {
    workSchedule: nextSchedule,
  };

  if (typeof slotDurationMinutes === 'number' && slotDurationMinutes > 0) {
    updateData.slotDurationMinutes = slotDurationMinutes;
  }

  const updated = await prisma.appStaff.update({
    where: { id },
    data: updateData,
  });

  return mapStaffRow(updated);
}

module.exports = {
  DEFAULT_AVATAR,
  DEFAULT_AVAILABILITY_DAYS,
  DEFAULT_SCHEDULE,
  DEFAULT_STAFF,
  normalizeSchedule,
  listStaff,
  addStaffMember,
  updateStaffMember,
  removeStaffMember,
  updateStaffSchedule,
};
