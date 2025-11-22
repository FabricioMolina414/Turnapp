const servicesCatalog = [
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

function listServices() {
  return servicesCatalog;
}

module.exports = {
  servicesCatalog,
  listServices,
};
