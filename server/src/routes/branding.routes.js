const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getBranding, updateBranding } = require('../data/branding');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize(['admin', 'staff', 'superadmin']), (req, res) => {
  return res.json({ branding: getBranding() });
});

router.put('/', authorize(['admin', 'superadmin']), (req, res) => {
  try {
    const branding = updateBranding(req.body ?? {});
    return res.json({ branding });
  } catch (error) {
    if (error.message === 'INVALID_PRIMARY_COLOR' || error.message === 'INVALID_ACCENT_COLOR') {
      return res.status(400).json({ message: 'Color inválido. Usá un HEX de 6 caracteres.' });
    }
    if (error.message === 'INVALID_THEME') {
      return res.status(400).json({ message: 'Tema inválido. Usá "light" o "dark".' });
    }
    return res.status(500).json({ message: 'No se pudo guardar la personalización.' });
  }
});

module.exports = router;
