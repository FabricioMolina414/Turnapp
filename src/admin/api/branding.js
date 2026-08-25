import { request } from './client';

export function fetchBranding({ token }) {
  return request('/branding', { token });
}

export function saveBranding({ token, branding }) {
  return request('/branding', {
    method: 'PUT',
    token,
    body: branding,
  });
}
