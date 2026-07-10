import axios from 'axios';

export const api = axios.create({ baseURL: 'http://localhost:4000/api/v1' });

let accessToken = null;
let orgId = null;

export function setAuth({ token, organizationId }) {
  if (token !== undefined) accessToken = token;
  if (organizationId !== undefined) orgId = organizationId;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  if (orgId) config.headers['X-Org-Id'] = orgId;
  return config;
});
