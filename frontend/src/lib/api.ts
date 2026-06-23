const BASE = '/api';

function getToken() {
  return localStorage.getItem('token') || '';
}

async function req(method: string, path: string, body?: unknown) {
  const headers: Record<string, string> = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const r = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (r.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('No autorizado');
  }
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) => req('POST', '/auth/login', { email, password }),
  register: (data: unknown) => req('POST', '/auth/register', data),
  me: () => req('GET', '/auth/me'),
  getUsuarios: () => req('GET', '/auth/usuarios'),
  deleteUsuario: (id: number) => req('DELETE', `/auth/usuarios/${id}`),
  setupNeeded: () => fetch('/api/setup/needed').then(r => r.json()),

  // Obras
  getObras: () => req('GET', '/obras'),
  getObra: (id: number) => req('GET', `/obras/${id}`),
  createObra: (data: unknown) => req('POST', '/obras', data),
  updateObra: (id: number, data: unknown) => req('PUT', `/obras/${id}`, data),
  deleteObra: (id: number) => req('DELETE', `/obras/${id}`),
  getResumen: (id: number) => req('GET', `/obras/${id}/resumen`),
  getCashflow: (id: number) => req('GET', `/obras/${id}/cashflow`),

  // Rubros
  getRubros: (obraId: number) => req('GET', `/rubros/obra/${obraId}`),
  createRubro: (data: unknown) => req('POST', '/rubros', data),
  updateRubro: (id: number, data: unknown) => req('PUT', `/rubros/${id}`, data),
  deleteRubro: (id: number) => req('DELETE', `/rubros/${id}`),

  // Proveedores
  getProveedores: () => req('GET', '/proveedores'),
  createProveedor: (data: unknown) => req('POST', '/proveedores', data),
  updateProveedor: (id: number, data: unknown) => req('PUT', `/proveedores/${id}`, data),
  deleteProveedor: (id: number) => req('DELETE', `/proveedores/${id}`),

  // Transacciones
  getIngresos: (obraId: number) => req('GET', `/transacciones/ingresos/${obraId}`),
  createIngreso: (data: unknown) => req('POST', '/transacciones/ingresos', data),
  updateIngreso: (id: number, data: unknown) => req('PUT', `/transacciones/ingresos/${id}`, data),
  deleteIngreso: (id: number) => req('DELETE', `/transacciones/ingresos/${id}`),

  getEgresos: (obraId: number) => req('GET', `/transacciones/egresos/${obraId}`),
  createEgreso: (data: unknown) => req('POST', '/transacciones/egresos', data),
  updateEgreso: (id: number, data: unknown) => req('PUT', `/transacciones/egresos/${id}`, data),
  deleteEgreso: (id: number) => req('DELETE', `/transacciones/egresos/${id}`),

  exportarExcel: (obraId: number) => {
    window.open(`${BASE}/transacciones/exportar/${obraId}?token=${getToken()}`, '_blank');
  },
};

export const fmt = (n: number, moneda = 'ARS') =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda, maximumFractionDigits: 0 }).format(n);
