import { request } from './client.js';

export async function login({ identifier, password }) {
  return request('/auth/login', {
    method: 'POST',
    body: { identifier, password },
  });
}

export async function fetchCurrentUser(token) {
  return request('/auth/me', {
    token,
  });
}
