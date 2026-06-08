// ============================================
// API Service - Connects to Backend
// ============================================

const API_URL = 'http://localhost:3001/api';

// Get token from localStorage
const getToken = () => {
  try {
    const token = localStorage.getItem('auth_token');
    return token;
  } catch {
    return null;
  }
};

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`API Error ${res.status}: ${errorBody}`);
    }
    return res.json();
  } catch (error: any) {
    if (error.message?.includes('Failed to fetch')) {
      console.warn(`⚠️ Backend not reachable at ${API_URL}. Run: node server/index.js`);
    }
    throw error;
  }
}

export const api = {
  // ----- Generic Methods -----
  get: <T = any>(endpoint: string): Promise<T> => request<T>(endpoint),
  post: <T = any>(endpoint: string, data?: any): Promise<T> => request<T>(endpoint, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: <T = any>(endpoint: string, data?: any): Promise<T> => request<T>(endpoint, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  delete: <T = any>(endpoint: string): Promise<T> => request<T>(endpoint, { method: 'DELETE' }),

  // ----- Inventory -----
  getInventory: () => request<any[]>('/inventory'),
  addInventory: (data: any) => request('/inventory', { method: 'POST', body: JSON.stringify(data) }),
  updateInventory: (id: number, data: any) => request(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInventory: (id: number) => request(`/inventory/${id}`, { method: 'DELETE' }),

  // ----- Customers -----
  getCustomers: () => request<any[]>('/customers'),
  addCustomer: (data: any) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: any) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id: string) => request(`/customers/${id}`, { method: 'DELETE' }),

  // ----- Suppliers -----
  getSuppliers: () => request<any[]>('/suppliers'),
  addSupplier: (data: any) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: string, data: any) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id: string) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // ----- Employees -----
  getEmployees: () => request<any[]>('/employees'),
  addEmployee: (data: any) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: string, data: any) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id: string) => request(`/employees/${id}`, { method: 'DELETE' }),

  // ----- Invoices -----
  getInvoices: () => request<any[]>('/invoices'),
  addInvoice: (data: any) => request('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  updateInvoice: (id: string, data: any) => request(`/invoices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteInvoice: (id: string) => request(`/invoices/${id}`, { method: 'DELETE' }),

  // ----- Purchases -----
  getPurchases: () => request<any[]>('/purchases'),
  addPurchase: (data: any) => request('/purchases', { method: 'POST', body: JSON.stringify(data) }),
  updatePurchase: (id: string, data: any) => request(`/purchases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePurchase: (id: string) => request(`/purchases/${id}`, { method: 'DELETE' }),

  // ----- Installments -----
  getPlans: () => request<any[]>('/installments'),
  addPlan: (data: any) => request('/installments', { method: 'POST', body: JSON.stringify(data) }),
  deletePlan: (id: string) => request(`/installments/${id}`, { method: 'DELETE' }),
  payInstallment: (planId: string, installmentNo: string) => request(`/installments/${planId}/pay/${installmentNo}`, { method: 'POST' }),

  // ----- Raw Materials -----
  getRawMaterials: () => request<any[]>('/raw-materials'),
  addRawMaterial: (data: any) => request('/raw-materials', { method: 'POST', body: JSON.stringify(data) }),
  updateRawMaterial: (id: number, data: any) => request(`/raw-materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRawMaterial: (id: number) => request(`/raw-materials/${id}`, { method: 'DELETE' }),

  // ----- Activity Log & Reports -----
  getDashboard: () => request<any>('/reports/dashboard'),
  getActivity: () => request<any[]>('/activity'),
  logActivity: (action: string, module: string, description: string) => 
    request('/activity', { method: 'POST', body: JSON.stringify({ action, module, description }) }),
};
