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
