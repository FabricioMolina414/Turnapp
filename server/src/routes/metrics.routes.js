const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { listMonthlyMetrics } = require('../data/metrics');

const router = express.Router();

router.use(authenticate, authorize(['admin', 'superadmin']));

router.get('/monthly', (req, res) => {
  return res.json({ metrics: listMonthlyMetrics() });
});

module.exports = router;
