const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { listServices } = require('../data/services');

const router = express.Router();

router.use(authenticate, authorize(['admin', 'superadmin']));

router.get('/', (req, res) => {
  return res.json({ services: listServices() });
});

module.exports = router;
