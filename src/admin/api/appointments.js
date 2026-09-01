import { request } from './client.js';

export async function fetchWeeklySchedule({ token, referenceDate }) {
  const params = new URLSearchParams();
  if (referenceDate) {
    params.set('referenceDate', referenceDate);
  }

  return request(`/appointments/week?${params.toString()}`, {
    token,
  });
}

export async function fetchDayAppointments({ token, isoDate }) {
  return request(`/appointments/day/${isoDate}`, {
    token,
  });
}

export async function fetchMonthSummary({ token, referenceDate }) {
  const params = new URLSearchParams();
  if (referenceDate) {
    params.set('referenceDate', referenceDate);
  }
  const query = params.toString();
  return request(`/appointments/month${query ? `?${query}` : ''}`, {
    token,
  });
}

export async function cancelAppointment({ token, appointmentId }) {
  return request(`/appointments/${appointmentId}`, {
    method: 'DELETE',
    token,
  });
}

export async function confirmAppointment({ token, appointmentId }) {
  return request(`/appointments/${appointmentId}/confirm`, {
    method: 'PATCH',
    token,
  });
}

export async function createManualAppointment({ token, appointment }) {
  return request('/appointments', {
    method: 'POST',
    token,
    body: appointment,
  });
}

export async function fetchAppointmentAvailability({ token, staffId, date, durationMinutes }) {
  const params = new URLSearchParams({ staffId, date });
  if (durationMinutes) {
    params.set('durationMinutes', durationMinutes);
  }
  return request(`/appointments/availability?${params.toString()}`, {
    token,
  });
}
