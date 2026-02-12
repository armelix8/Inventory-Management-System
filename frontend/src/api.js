const API_BASE = '/api';

function getAuthToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(data?.error ?? res.statusText);
  }
  return data;
}

export const api = {
  items: {
    list: () => request('/items'),
    get: (id) => request(`/items/${id}`),
    create: (body) => request('/items', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' }).then((r) => { if (!r.ok) return r.json().then((d) => { throw new Error(d.error); }); }),
    bulkImport: (rows) => request('/items/bulk', { method: 'POST', body: JSON.stringify(rows) }),
    reclassify: (id) => request(`/items/${id}/reclassify`, { method: 'POST' }),
    reclassifyAll: () => request('/items/reclassify-all', { method: 'POST' }),
  },
  stockIn: {
    list: (itemId) => request(itemId ? `/stock-in?itemId=${itemId}` : '/stock-in'),
    create: (body) => request('/stock-in', { method: 'POST', body: JSON.stringify(body) }),
    bulkImport: (rows) => request('/stock-in/bulk', { method: 'POST', body: JSON.stringify(rows) }),
  },
  stockOut: {
    list: (itemId) => request(itemId ? `/stock-out?itemId=${itemId}` : '/stock-out'),
    create: (body) => request('/stock-out', { method: 'POST', body: JSON.stringify(body) }),
    bulkImport: (rows) => request('/stock-out/bulk', { method: 'POST', body: JSON.stringify(rows) }),
  },
  balance: {
    list: () => request('/balance'),
    get: (itemId) => request(`/balance?itemId=${itemId}`),
  },
  auth: {
    login: (username, password) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    register: (username, email, password) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
    me: () => request('/auth/me'),
  },
  dashboard: {
    stats: () => request('/dashboard/stats'),
  },
};
