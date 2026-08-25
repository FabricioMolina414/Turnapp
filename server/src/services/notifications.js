const config = require('../config/env');
const { getBranding } = require('../data/branding');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDateLabel(date, timezone) {
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatCalendarDate(date, time) {
  const [hours = '00', minutes = '00'] = String(time || '').split(':');
  const dateToken = String(date || '').replace(/-/g, '');
  return `${dateToken}T${hours.padStart(2, '0')}${minutes.padStart(2, '0')}00`;
}

function buildGoogleCalendarUrl({ booking, locationAddress, timezone }) {
  const start = formatCalendarDate(booking.date, booking.startTime);
  const end = formatCalendarDate(booking.date, booking.endTime);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${booking.service} - Turno confirmado`,
    dates: `${start}/${end}`,
    details: [
      `Turno confirmado para ${booking.clientName}.`,
      `Profesional: ${booking.stylist}.`,
      booking.serviceCategory ? `Categoria: ${booking.serviceCategory}.` : null,
    ]
      .filter(Boolean)
      .join('\n'),
    location: locationAddress || '',
    ctz: timezone,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildCalendarEventIcs({ booking, locationAddress, timezone }) {
  const uid = `${booking.id}@turnapp.local`;
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const dtStart = formatCalendarDate(booking.date, booking.startTime);
  const dtEnd = formatCalendarDate(booking.date, booking.endTime);
  const description = [
    `Cliente: ${booking.clientName}`,
    `Profesional: ${booking.stylist}`,
    `Servicio: ${booking.service}`,
    booking.serviceCategory ? `Categoria: ${booking.serviceCategory}` : null,
    booking.contactPhone ? `WhatsApp: ${booking.contactPhone}` : null,
    booking.contactEmail ? `Email: ${booking.contactEmail}` : null,
  ]
    .filter(Boolean)
    .join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Turnapp//Booking Confirmation//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=${timezone}:${dtStart}`,
    `DTEND;TZID=${timezone}:${dtEnd}`,
    `SUMMARY:${booking.service} - Turno confirmado`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')}`,
    `LOCATION:${String(locationAddress || '').replace(/,/g, '\\,').replace(/;/g, '\\;')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function buildConfirmationEmail({ booking, branding, timezone }) {
  const locationAddress = branding?.locationAddress || 'Sin direccion configurada';
  const scheduleLabel = formatDateLabel(new Date(`${booking.date}T${booking.startTime}:00`), timezone);
  const googleCalendarUrl = buildGoogleCalendarUrl({ booking, locationAddress, timezone });

  return {
    subject: `Turno confirmado - ${booking.service} - ${booking.date} ${booking.startTime}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
        <h1 style="margin-bottom: 8px;">Tu turno esta confirmado</h1>
        <p>Hola ${escapeHtml(booking.clientName)}, validamos tu pago y tu reserva ya quedo confirmada.</p>
        <ul>
          <li><strong>Servicio:</strong> ${escapeHtml(booking.service)}</li>
          <li><strong>Profesional:</strong> ${escapeHtml(booking.stylist)}</li>
          <li><strong>Fecha y hora:</strong> ${escapeHtml(scheduleLabel)}</li>
          <li><strong>Direccion:</strong> ${escapeHtml(locationAddress)}</li>
        </ul>
        <p>
          <a
            href="${googleCalendarUrl}"
            style="display:inline-block;padding:12px 18px;background:#f97316;color:#fff;text-decoration:none;border-radius:8px;"
          >
            Agregar a Google Calendar
          </a>
        </p>
        <p>Tambien adjuntamos un archivo .ics para que puedas sumarlo a tu calendario preferido.</p>
        <p>Si tenes dudas, podes responder este correo o escribir por WhatsApp.</p>
      </div>
    `,
    text: [
      'Tu turno esta confirmado.',
      `Servicio: ${booking.service}`,
      `Profesional: ${booking.stylist}`,
      `Fecha y hora: ${scheduleLabel}`,
      `Direccion: ${locationAddress}`,
      `Google Calendar: ${googleCalendarUrl}`,
    ].join('\n'),
    attachments: [
      {
        filename: `turno-${booking.date}-${booking.startTime}.ics`,
        content: Buffer.from(
          buildCalendarEventIcs({ booking, locationAddress, timezone }),
          'utf8'
        ).toString('base64'),
      },
    ],
  };
}

async function sendConfirmedBookingEmail(booking) {
  if (!booking?.contactEmail) {
    return { delivered: false, skipped: true, reason: 'missing_recipient' };
  }

  if (!config.resendApiKey || !config.emailFrom) {
    return { delivered: false, skipped: true, reason: 'email_not_configured' };
  }

  const branding = getBranding();
  const email = buildConfirmationEmail({
    booking,
    branding,
    timezone: config.businessTimezone,
  });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.emailFrom,
      to: [booking.contactEmail],
      reply_to: config.emailReplyTo || undefined,
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: email.attachments,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.message || 'No se pudo enviar el email de confirmacion.');
    error.payload = payload;
    throw error;
  }

  return {
    delivered: true,
    provider: 'resend',
    messageId: payload?.id || null,
  };
}

module.exports = {
  sendConfirmedBookingEmail,
  buildGoogleCalendarUrl,
};
