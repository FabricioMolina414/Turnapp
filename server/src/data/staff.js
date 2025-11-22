const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_FILE_PATH = path.join(__dirname, 'staff.json');

const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="%23f1f5f9"/><circle cx="64" cy="52" r="26" fill="%2394a3b8"/><path d="M24 112c0-22 18-40 40-40s40 18 40 40" fill="%23cbd5f5"/></svg>';

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
      return parsed;
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

function addStaffMember({ name, role, specialties, availability, avatar }) {
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

  const newMember = {
    id: randomUUID(),
    name: trimmedName,
    role: typeof role === 'string' ? role.trim() : '',
    specialties: normalizedSpecialties,
    availability: typeof availability === 'string' ? availability.trim() : '',
    avatar: typeof avatar === 'string' && avatar.trim() ? avatar.trim() : DEFAULT_AVATAR,
  };

  staffMembers.push(newMember);
  saveStaffToFile(staffMembers);
  return newMember;
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

module.exports = {
  staffMembers,
  listStaff,
  addStaffMember,
  removeStaffMember,
  DEFAULT_AVATAR,
  DEFAULT_STAFF,
};
