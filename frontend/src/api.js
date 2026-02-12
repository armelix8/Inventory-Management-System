const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

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

async function requestFormData(path, formData, method = 'POST') {
  const token = getAuthToken();
  const headers = { Authorization: token ? `Bearer ${token}` : '' };
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: formData,
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

/** Fetch proof of delivery PDF with auth and open in new tab */
export async function openProofOfDelivery(proofPath) {
  if (!proofPath) return;
  const token = getAuthToken();
  const url = `${API_BASE.replace(/\/$/, '')}/stock-in/proof?file=${encodeURIComponent(proofPath)}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error('Failed to load PDF');
  }
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank', 'noopener');
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

export const api = {
  suppliers: {
    list: () => request('/suppliers'),
    get: (id) => request(`/suppliers/${id}`),
    create: (body) => request('/suppliers', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) =>
      fetch(`${API_BASE}/suppliers/${id}`, { method: 'DELETE' }).then((r) => {
        if (!r.ok) return r.json().then((d) => { throw new Error(d.error); });
      }),
  },
  items: {
    list: () => request('/items'),
    get: (id) => request(`/items/${id}`),
    create: (body) => request('/items', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' }).then((r) => { if (!r.ok) return r.json().then((d) => { throw new Error(d.error); }); }),
    bulkImport: (rows) => request('/items/bulk', { method: 'POST', body: JSON.stringify(rows) }),
  },
  stockIn: {
    list: (itemId) => request(itemId ? `/stock-in?itemId=${itemId}` : '/stock-in'),
    create: (body) => request('/stock-in', { method: 'POST', body: JSON.stringify(body) }),
    createWithFile: (formData) => requestFormData('/stock-in', formData),
    bulkImport: (rows) => request('/stock-in/bulk', { method: 'POST', body: JSON.stringify(rows) }),
  },
  stockOut: {
    list: (itemId, status) => {
      const params = new URLSearchParams();
      if (itemId) params.append('itemId', itemId);
      if (status) params.append('status', status);
      return request(`/stock-out${params.toString() ? '?' + params.toString() : ''}`);
    },
    create: (body) => request('/stock-out', { method: 'POST', body: JSON.stringify(body) }),
    bulkImport: (rows) => request('/stock-out/bulk', { method: 'POST', body: JSON.stringify(rows) }),
    approve: (id) => request(`/stock-out/${id}/approve`, { method: 'POST' }),
    reject: (id, reason) => request(`/stock-out/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejectionReason: reason }) }),
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
  users: {
    list: () => request('/users'),
    get: (id) => request(`/users/${id}`),
    create: (body) => request('/users', { method: 'POST', body: JSON.stringify(body) }),
    update: (id, body) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id) => fetch(`${API_BASE}/users/${id}`, { method: 'DELETE' }).then((r) => { if (!r.ok) return r.json().then((d) => { throw new Error(d.error); }); }),
  },
};
