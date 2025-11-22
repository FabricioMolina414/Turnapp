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
