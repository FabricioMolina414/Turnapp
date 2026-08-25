import { request } from './client.js';

export async function fetchAdmins({ token }) {
  return request('/superadmin/admins', {
    token,
  });
}

export async function createAdmin({ token, admin }) {
  return request('/superadmin/admins', {
    method: 'POST',
    token,
    body: admin,
  });
}

export async function updateAdminRole({ token, userId, role }) {
  return request(`/superadmin/admins/${userId}`, {
    method: 'PATCH',
    token,
    body: { role },
  });
}

export async function resetAdminPassword({ token, userId, password }) {
  return request(`/superadmin/admins/${userId}/password`, {
    method: 'PATCH',
    token,
    body: { password },
  });
}

export async function deleteAdmin({ token, userId }) {
  return request(`/superadmin/admins/${userId}`, {
    method: 'DELETE',
    token,
  });
}
