import { request } from './client.js';

export async function fetchServices({ token }) {
  return request('/services', {
    token,
  });
}
