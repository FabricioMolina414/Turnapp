import { request } from './client.js';

export async function fetchMonthlyMetrics({ token }) {
  return request('/metrics/monthly', {
    token,
  });
}
