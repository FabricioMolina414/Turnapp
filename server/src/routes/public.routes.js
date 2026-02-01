const express = require('express');
const https = require('https');
const { listStaff } = require('../data/staff');
const { listServices } = require('../data/services');
const { getBranding } = require('../data/branding');
const {
  getAvailableSlotsForStaff,
  createBooking,
} = require('../data/bookings');

const router = express.Router();

function postMercadoPagoPreference(accessToken, preference) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(preference);
    const request = https.request(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (response) => {
        let body = '';
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(body);
          } catch (error) {
            parsed = null;
          }
          if (response.statusCode < 200 || response.statusCode >= 300) {
            const err = new Error(parsed?.message || 'MERCADO_PAGO_ERROR');
            err.statusCode = response.statusCode;
            err.payload = parsed;
            reject(err);
            return;
          }
          resolve(parsed);
        });
      }
    );

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

router.get('/staff', (req, res) => {
  return res.json({ staff: listStaff() });
});

router.get('/services', (req, res) => {
  const services = listServices().filter((service) => service?.active !== false);
  return res.json({ services });
});

router.get('/branding', (req, res) => {
  return res.json({ branding: getBranding() });
});

router.post('/payments/mercadopago', async (req, res) => {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return res.status(500).json({ message: 'Mercado Pago no está configurado.' });
  }

  const {
    title,
    unitPrice,
    quantity = 1,
    bookingId,
    customer,
  } = req.body ?? {};

  const numericPrice = Number(unitPrice);
  if (!title || !Number.isFinite(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({ message: 'Datos de pago inválidos.' });
  }

  const baseUrl = process.env.PUBLIC_BASE_URL || req.headers.origin;
  if (!baseUrl) {
    return res.status(400).json({ message: 'No se pudo determinar la URL de retorno.' });
  }

  try {
    const preference = {
      items: [
        {
          title,
          quantity: Math.max(1, Number(quantity) || 1),
          unit_price: numericPrice,
          currency_id: 'ARS',
        },
      ],
      external_reference: bookingId || undefined,
      payer: {
        name: customer?.name || undefined,
        email: customer?.email || undefined,
        phone: customer?.phone ? { number: customer.phone } : undefined,
      },
      back_urls: {
        success: `${baseUrl}/?payment=success`,
        pending: `${baseUrl}/?payment=pending`,
        failure: `${baseUrl}/?payment=failure`,
      },
      auto_return: 'approved',
      metadata: {
        bookingId: bookingId || null,
      },
    };

    const response = await postMercadoPagoPreference(accessToken, preference);
    const useSandbox =
      String(process.env.MERCADOPAGO_USE_SANDBOX || process.env.MP_USE_SANDBOX || '').toLowerCase() === 'true';
    const initPoint = useSandbox ? response?.sandbox_init_point : response?.init_point;

    if (!initPoint) {
      return res.status(502).json({ message: 'No pudimos generar el enlace de pago.' });
    }

    return res.json({ initPoint });
  } catch (error) {
    /* eslint-disable no-console */
    console.error('[MercadoPago] Error al crear preferencia', error?.payload || error);
    return res.status(502).json({ message: 'No pudimos iniciar el pago con Mercado Pago.' });
  }
});

router.get('/staff/:id/slots', (req, res) => {
  const { id } = req.params;
  const { date, durationMinutes } = req.query;

  const staff = listStaff().find((member) => member.id === id);
  if (!staff) {
    return res.status(404).json({ message: 'Profesional no encontrado' });
  }
  if (!date) {
    return res.status(400).json({ message: 'La fecha es obligatoria' });
  }

  const slots = getAvailableSlotsForStaff(staff, date, durationMinutes);
  return res.json({ slots });
});

router.post('/bookings', (req, res) => {
  const {
    staffId,
    date,
    slot,
    durationMinutes,
    clientName,
    contact,
    serviceId,
    service,
    serviceCategory,
    notes,
  } =
    req.body ?? {};

  const staff = listStaff().find((member) => member.id === staffId);
  if (!staff) {
    return res.status(404).json({ message: 'Profesional no encontrado' });
  }
  if (!date || !slot) {
    return res.status(400).json({ message: 'Fecha y horario son obligatorios' });
  }

  try {
    const serviceInfo = listServices().find((item) => item.id === serviceId) ?? null;
    const booking = createBooking({
      staff,
      date,
      startTime: slot,
      durationMinutes,
      clientName,
      contact,
      serviceId: serviceInfo?.id,
      service: serviceInfo?.name || service,
      serviceCategory: serviceInfo?.category || serviceCategory,
      price: serviceInfo?.price ?? 0,
      notes,
    });
    return res.status(201).json({ booking });
  } catch (error) {
    if (error.message === 'STAFF_NOT_AVAILABLE' || error.message === 'OUTSIDE_SCHEDULE') {
      return res.status(400).json({ message: 'El profesional no atiende en ese horario.' });
    }
    if (error.message === 'SLOT_TAKEN') {
      return res.status(409).json({ message: 'Ese horario ya fue reservado.' });
    }
    return res.status(500).json({ message: 'No se pudo reservar el turno.' });
  }
});

module.exports = router;
