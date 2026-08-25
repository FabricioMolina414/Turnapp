const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { listMonthlyMetrics } = require('../data/metrics');

const router = express.Router();

router.use(authenticate);

router.get('/monthly', authorize(['admin', 'staff', 'superadmin']), (req, res) => {
  return res.json({ metrics: listMonthlyMetrics() });
});

module.exports = router;
