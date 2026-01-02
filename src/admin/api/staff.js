import { request } from './client.js';

export async function fetchStaff({ token }) {
  return request('/staff', {
    token,
  });
}

export async function createStaffMember({ token, staff }) {
  return request('/staff', {
    method: 'POST',
    token,
    body: staff,
  });
}

export async function deleteStaffMember({ token, staffId }) {
  return request(`/staff/${staffId}`, {
    method: 'DELETE',
    token,
  });
}

export async function updateStaffSchedule({ token, staffId, schedule }) {
  return request(`/staff/${staffId}/schedule`, {
    method: 'PATCH',
    token,
    body: schedule,
  });
}

export async function updateStaffMember({ token, staffId, staff }) {
  return request(`/staff/${staffId}`, {
    method: 'PATCH',
    token,
    body: staff,
  });
}
