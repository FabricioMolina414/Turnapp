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
