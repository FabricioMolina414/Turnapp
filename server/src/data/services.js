const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_FILE_PATH = path.join(__dirname, 'services.json');

const DEFAULT_SERVICES = [
  {
    id: 'corte-styling',
    name: 'Corte & Styling',
    durationMinutes: 45,
    price: 6500,
    category: 'Peluquería',
    professionals: ['Ana López', 'Bruno Ledesma'],
    description: 'Diagnóstico personalizado, corte y styling a medida.',
    active: true,
  },
  {
    id: 'color-experto',
    name: 'Color Experto',
    durationMinutes: 150,
    price: 24500,
    category: 'Colorimetría',
    professionals: ['Ana López'],
    description: 'Balayage, iluminaciones y matices con diagnóstico previo.',
    active: true,
  },
  {
    id: 'tratamiento-capilar',
    name: 'Tratamiento capilar',
    durationMinutes: 60,
    price: 11000,
    category: 'Tratamientos',
    professionals: ['Ana López', 'Bruno Ledesma'],
    description: 'Shock de nutrición profunda con keratina y masaje relajante.',
    active: true,
  },
  {
    id: 'corte-barba',
    name: 'Corte + barba',
    durationMinutes: 70,
    price: 9200,
    category: 'Barbería',
    professionals: ['Martín Pérez', 'Bruno Ledesma'],
    description: 'Corte con degradado, mantenimiento de barba y toalla caliente.',
    active: true,
  },
  {
    id: 'semipermanente',
    name: 'Semipermanente Luxe',
    durationMinutes: 70,
    price: 9800,
    category: 'Manicuría',
    professionals: ['Paula Quinteros'],
    description: 'Preparación completa, esmaltado premium y sellado de brillo.',
    active: true,
  },
];

function loadServicesFromFile() {
  if (!fs.existsSync(DATA_FILE_PATH)) {
    saveServicesToFile(DEFAULT_SERVICES);
    return [...DEFAULT_SERVICES];
  }

  try {
    const content = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed;
    throw new Error('Invalid format');
  } catch (error) {
    console.error('[Services] Error al leer services.json, restaurando datos por defecto', error);
    saveServicesToFile(DEFAULT_SERVICES);
    return [...DEFAULT_SERVICES];
  }
}

function saveServicesToFile(data) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('[Services] Error al guardar services.json', error);
  }
}

let servicesCatalog = loadServicesFromFile();

function listServices() {
  return servicesCatalog;
}

function normalizeProfessionalName(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function serviceSupportsProfessional(service, professionalName) {
  const normalizedName = normalizeProfessionalName(professionalName);
  if (!normalizedName) return false;

  const assignedProfessionals = Array.isArray(service?.professionals) ? service.professionals : [];
  if (!assignedProfessionals.length) return true;

  return assignedProfessionals.some((item) => normalizeProfessionalName(item) === normalizedName);
}

function listActiveServicesForProfessional(professionalName) {
  return servicesCatalog.filter(
    (service) => service?.active !== false && serviceSupportsProfessional(service, professionalName)
  );
}

function addService({ name, durationMinutes, price, category, professionals, description, active = true }) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('SERVICE_NAME_REQUIRED');
  }

  const normalizedProfessionals = Array.isArray(professionals)
    ? professionals
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter((item) => item.length > 0)
    : [];

  const newService = {
    id: randomUUID(),
    name: name.trim(),
    durationMinutes: Number(durationMinutes) || 30,
    price: Number(price) || 0,
    category: category?.trim() || 'General',
    professionals: normalizedProfessionals,
    description: description?.trim() || '',
    active: Boolean(active),
  };

  servicesCatalog.push(newService);
  saveServicesToFile(servicesCatalog);
  return newService;
}

function updateService(id, { name, durationMinutes, price, category, professionals, description, active }) {
  const service = servicesCatalog.find((item) => item.id === id);
  if (!service) {
    throw new Error('SERVICE_NOT_FOUND');
  }

  if (name && typeof name === 'string' && name.trim()) {
    service.name = name.trim();
  }
  if (durationMinutes !== undefined) {
    service.durationMinutes = Number(durationMinutes) || service.durationMinutes;
  }
  if (price !== undefined) {
    service.price = Number(price) || service.price;
  }
  if (category !== undefined) {
    service.category = typeof category === 'string' ? category.trim() : service.category;
  }
  if (professionals !== undefined) {
    service.professionals = Array.isArray(professionals)
      ? professionals
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item) => item.length > 0)
      : service.professionals;
  }
  if (description !== undefined) {
    service.description = typeof description === 'string' ? description.trim() : service.description;
  }
  if (active !== undefined) {
    service.active = Boolean(active);
  }

  saveServicesToFile(servicesCatalog);
  return service;
}

function removeService(id) {
  const index = servicesCatalog.findIndex((item) => item.id === id);
  if (index === -1) {
    throw new Error('SERVICE_NOT_FOUND');
  }
  const [removed] = servicesCatalog.splice(index, 1);
  saveServicesToFile(servicesCatalog);
  return removed;
}

module.exports = {
  servicesCatalog,
  listServices,
  listActiveServicesForProfessional,
  serviceSupportsProfessional,
  addService,
  updateService,
  removeService,
  DEFAULT_SERVICES,
  DATA_FILE_PATH,
};
