const express = require('express');
const { listStaff } = require('../data/staff');
const { listServices } = require('../data/services');

const router = express.Router();

router.get('/staff', (req, res) => {
  return res.json({ staff: listStaff() });
});

router.get('/services', (req, res) => {
  return res.json({ services: listServices() });
});

module.exports = router;
