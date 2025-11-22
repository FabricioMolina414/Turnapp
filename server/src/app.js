const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const superadminRoutes = require('./routes/superadmin.routes');
const appointmentsRoutes = require('./routes/appointments.routes');
const servicesRoutes = require('./routes/services.routes');
const metricsRoutes = require('./routes/metrics.routes');
const staffRoutes = require('./routes/staff.routes');
const publicRoutes = require('./routes/public.routes');

const app = express();

app.use(cors());
app.use(
  express.json({
    limit: '2mb',
  })
);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/public', publicRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  /* eslint-disable no-console */
  console.error('[UnhandledError]', err);
  return res.status(500).json({ message: 'Error interno del servidor' });
});

module.exports = app;
