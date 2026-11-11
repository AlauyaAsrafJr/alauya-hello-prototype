const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

export function mediaUrl(path) {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_ORIGIN}${path}`;
}

export class ApiError extends Error {
  status;
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

async function request(path, options = {}, skipJsonContentType = false) {
  const headers = skipJsonContentType ? {} : { 'Content-Type': 'application/json' };
  if (options.headers) Object.assign(headers, options.headers);
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || res.statusText || 'Request failed';
    throw new ApiError(message, res.status);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: (path, body) => request(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData }, true),
};
