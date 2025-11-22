const { randomUUID } = require('crypto');

const sampleAppointments = [
  {
    id: randomUUID(),
    date: '2024-07-22',
    startTime: '09:00',
    endTime: '09:45',
    clientName: 'Lucía Romero',
    contact: '+54 9 11 2345-9988',
    service: 'Corte & Styling',
    serviceCategory: 'Peluquería',
    stylist: 'Ana López',
    paymentMethod: 'Mercado Pago',
    status: 'confirmado',
    price: 6500,
    notes: 'Prefiere flequillo recto y styling natural.',
  },
  {
    id: randomUUID(),
    date: '2024-07-22',
    startTime: '10:00',
    endTime: '10:40',
    clientName: 'Julián Cabral',
    contact: '@julicabral',
    service: 'Barba & perfilado',
    serviceCategory: 'Barbería',
    stylist: 'Martín Pérez',
    paymentMethod: 'Efectivo',
    status: 'confirmado',
    price: 4800,
    notes: 'Quiere mantener largos laterales con fade bajo.',
  },
  {
    id: randomUUID(),
    date: '2024-07-23',
    startTime: '09:30',
    endTime: '10:30',
    clientName: 'Elsa Morales',
    contact: '+54 9 11 3345-2211',
    service: 'Tratamiento capilar',
    serviceCategory: 'Tratamientos',
    stylist: 'Bruno Ledesma',
    paymentMethod: 'Transferencia',
    status: 'confirmado',
    price: 11000,
    notes: 'Cabello sensibilizado, aplicar terapia hidratante.',
  },
  {
    id: randomUUID(),
    date: '2024-07-23',
    startTime: '13:00',
    endTime: '14:10',
    clientName: 'Marcos Tello',
    contact: '@tello.marcos',
    service: 'Corte + barba',
    serviceCategory: 'Barbería',
    stylist: 'Bruno Ledesma',
    paymentMethod: 'Mercado Pago',
    status: 'pendiente',
    price: 9200,
    notes: 'Enviar recordatorio 24 hs antes.',
  },
  {
    id: randomUUID(),
    date: '2024-07-24',
    startTime: '09:00',
    endTime: '10:00',
    clientName: 'Laura Sosa',
    contact: '+54 9 11 4423-5030',
    service: 'Manos Spa',
    serviceCategory: 'Manicuría',
    stylist: 'Paula Quinteros',
    paymentMethod: 'Mercado Pago',
    status: 'confirmado',
    price: 7200,
    notes: 'Prefiere aromaterapia con lavanda.',
  },
  {
    id: randomUUID(),
    date: '2024-07-25',
    startTime: '09:00',
    endTime: '10:10',
    clientName: 'Eduardo Campos',
    contact: '+54 9 11 2222-6754',
    service: 'Corte + barba',
    serviceCategory: 'Barbería',
    stylist: 'Martín Pérez',
    paymentMethod: 'Mercado Pago',
    status: 'confirmado',
    price: 9200,
    notes: 'Quiere mantener degradado medio.',
  },
  {
    id: randomUUID(),
    date: '2024-07-26',
    startTime: '11:00',
    endTime: '12:30',
    clientName: 'Agustina Torres',
    contact: '@agus.torres',
    service: 'Nail Art',
    serviceCategory: 'Manicuría',
    stylist: 'Paula Quinteros',
    paymentMethod: 'Mercado Pago',
    status: 'confirmado',
    price: 11500,
    notes: 'Diseño abstracto multicolor.',
  },
  {
    id: randomUUID(),
    date: '2024-07-27',
    startTime: '12:00',
    endTime: '13:00',
    clientName: 'Josefina Barrios',
    contact: '+54 9 11 8730-4456',
    service: 'Tratamiento capilar',
    serviceCategory: 'Tratamientos',
    stylist: 'Ana López',
    paymentMethod: 'Mercado Pago',
    status: 'confirmado',
    price: 11000,
    notes: 'Aplicar booster nutritivo.',
  },
];

function getAppointmentsWithinRange(from, to) {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  return sampleAppointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.date);
    return appointmentDate >= fromDate && appointmentDate <= toDate;
  });
}

function getWeeklyAppointments(referenceDate = new Date()) {
  const date = new Date(referenceDate);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() + diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return groupAppointmentsByDate(getAppointmentsWithinRange(startOfWeek, endOfWeek));
}

function groupAppointmentsByDate(appointments) {
  return appointments.reduce((acc, appointment) => {
    acc[appointment.date] = acc[appointment.date] || [];
    acc[appointment.date].push(appointment);
    return acc;
  }, {});
}

module.exports = {
  sampleAppointments,
  getAppointmentsWithinRange,
  getWeeklyAppointments,
  groupAppointmentsByDate,
};
