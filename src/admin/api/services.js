import { request } from './client.js';

export async function fetchServices({ token }) {
  return request('/services', {
    token,
  });
}

export async function createService({ token, service }) {
  return request('/services', {
    method: 'POST',
    token,
    body: service,
  });
}

export async function updateService({ token, serviceId, service }) {
  return request(`/services/${serviceId}`, {
    method: 'PATCH',
    token,
    body: service,
  });
}

export async function deleteService({ token, serviceId }) {
  return request(`/services/${serviceId}`, {
    method: 'DELETE',
    token,
  });
}
