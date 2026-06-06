// ============================================
// API Service - Connects to Neon via Backend
// ============================================

const API_URL = 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      return res.json();
    } catch (error) {
      console.error(`API call failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ===== Inventory =====
  async getInventory() {
    return this.request<any[]>('/inventory');
  }

  async createInventoryItem(data: any) {
    return this.request<any>('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInventoryItem(id: number, data: any) {
    return this.request<any>(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInventoryItem(id: number) {
    return this.request<any>(`/inventory/${id}`, { method: 'DELETE' });
  }

  // ===== Installment Plans =====
  async getInstallmentPlans() {
    return this.request<any[]>('/installments/plans');
  }

  async createInstallmentPlan(data: any) {
    return this.request<any>('/installments/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async payInstallment(planId: string, installmentNo: string) {
    return this.request<any>(`/installments/plans/${planId}/installments/${installmentNo}/pay`, {
      method: 'POST',
    });
  }

  // ===== Customers =====
  async getCustomers() {
    return this.request<any[]>('/customers');
  }

  // ===== Currencies =====
  async getCurrencies() {
    return this.request<any[]>('/currencies');
  }

  async updateExchangeRates(rates: Record<string, number>) {
    return this.request<any>('/currencies/rates', {
      method: 'PUT',
      body: JSON.stringify({ rates }),
    });
  }

  // ===== Activity Log =====
  async getActivityLog() {
    return this.request<any[]>('/activity');
  }

  async logActivity(action: string, description: string) {
    return this.request<any>('/activity', {
      method: 'POST',
      body: JSON.stringify({ action, description }),
    });
  }

  // ===== Reports =====
  async getDashboardStats() {
    return this.request<any>('/reports/dashboard');
  }
}

export const api = new ApiService();
export default api;
