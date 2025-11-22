const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getWeeklyAppointments, groupAppointmentsByDate, sampleAppointments } = require('../data/appointments');

const router = express.Router();

router.use(authenticate, authorize(['admin', 'superadmin']));

router.get('/week', (req, res) => {
  const { referenceDate } = req.query;
  const schedule = getWeeklyAppointments(referenceDate ? new Date(referenceDate) : new Date());
  return res.json({ schedule });
});

router.get('/day/:isoDate', (req, res) => {
  const { isoDate } = req.params;
  const grouped = groupAppointmentsByDate(sampleAppointments);
  return res.json({ appointments: grouped[isoDate] ?? [] });
});

module.exports = router;
