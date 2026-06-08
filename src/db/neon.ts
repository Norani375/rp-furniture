/**
 * Secure Backend API Client
 * -------------------------
 * This file intentionally does NOT connect to Neon directly.
 * All database traffic goes through server/index.js so DB credentials stay server-side only.
 */
import type { InventoryItem, InstallmentPlan, Transaction } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: 'Bearer erp-token',
    'X-User-Role': localStorage.getItem('erp_user_role') || 'admin',
    'X-User-Name': localStorage.getItem('erp_user_name') || 'کاربر',
  };
}

async function api<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...authHeaders(), ...(init?.headers || {}) }, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const mapTransaction = (r: any): Transaction => ({
  id: String(r.id),
  date: typeof r.date === 'string' ? r.date.slice(0, 10) : String(r.date || ''),
  type: r.type,
  status: r.status,
  title: r.title,
  description: r.description || '',
  debit: Number(r.debit || 0),
  credit: Number(r.credit || 0),
  balance: Number(r.balance || 0),
  refType: r.ref_type || r.refType || '',
  refId: r.ref_id || r.refId || '',
  createdBy: r.created_by || r.createdBy || '',
  createdAt: r.created_at || r.createdAt || '',
  updatedAt: r.updated_at || r.updatedAt || r.created_at || '',
});

export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  const result = await api<{ status: string; database: string }>('/health');
  if (result?.status === 'ok') return { ok: true, message: 'اتصال امن به Backend و Neon برقرار است' };
  return { ok: false, message: 'Backend یا دیتابیس در دسترس نیست' };
}

export const neonInventory = {
  async getAll(): Promise<InventoryItem[]> {
    const rows = await api<any[]>('/inventory');
    return (rows || []).map((r) => ({ id: Number(r.id), name: r.name, unit: r.unit, quantity: Number(r.quantity), unitPriceAFN: Number(r.unit_price_afn), category: r.category || undefined }));
  },
  async add(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem | null> {
    const row = await api<any>('/inventory', { method: 'POST', body: JSON.stringify({ sku: `GEN-${Date.now()}`, name: item.name, unit: item.unit, quantity: item.quantity, unit_price_afn: item.unitPriceAFN, category: item.category || 'عمومی' }) });
    return row ? { id: Number(row.id), name: row.name, unit: row.unit, quantity: Number(row.quantity), unitPriceAFN: Number(row.unit_price_afn), category: row.category } : null;
  },
  async update(id: number, patch: Partial<InventoryItem>): Promise<boolean> {
    const row = await api<any>(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify({ name: patch.name, unit: patch.unit, quantity: patch.quantity, unit_price_afn: patch.unitPriceAFN, category: patch.category }) });
    return Boolean(row);
  },
  async remove(id: number): Promise<boolean> {
    const row = await api<{ ok: boolean }>(`/inventory/${id}`, { method: 'DELETE' });
    return Boolean(row?.ok);
  },
};

export const neonLedger = {
  async getAll(): Promise<Transaction[]> {
    const rows = await api<any[]>('/transactions');
    return (rows || []).map(mapTransaction);
  },
  async add(tx: Transaction): Promise<boolean> {
    const row = await api<any>('/transactions', { method: 'POST', body: JSON.stringify({ id: tx.id, date: tx.date, type: tx.type, status: tx.status, title: tx.title, description: tx.description, debit: tx.debit, credit: tx.credit, balance: tx.balance, ref_type: tx.refType, ref_id: tx.refId, created_by: tx.createdBy }) });
    return Boolean(row);
  },
  async update(id: string, patch: Partial<Transaction>): Promise<boolean> {
    const existing = (await this.getAll()).find((t) => t.id === id);
    if (!existing) return false;
    return this.add({ ...existing, ...patch, id });
  },
  async remove(id: string): Promise<boolean> {
    const row = await api<{ ok: boolean }>(`/transactions/${id}`, { method: 'DELETE' });
    return Boolean(row?.ok);
  },
  async count(): Promise<number> {
    const rows = await this.getAll();
    return rows.length;
  },
};

export const neonInstallments = {
  async getPlans(): Promise<InstallmentPlan[]> {
    const result = await api<{ plans: any[]; installments: any[] }>('/installments');
    return (result?.plans || []).map((p) => {
      const planInstallments = (result?.installments || []).filter((i) => i.plan_id === p.id);
      return { id: p.id, customerName: p.customer_name, totalAmount: Number(p.total_amount), paidAmount: Number(p.paid_amount), remainingAmount: Number(p.total_amount) - Number(p.paid_amount), dueDate: p.end_date || '', status: p.status, installments: planInstallments.map((i) => ({ id: String(i.installment_no), dueDate: i.due_date, amount: Number(i.amount), paid: Boolean(i.paid) })) };
    });
  },
  async getInstallments(planId: string) {
    const result = await api<{ installments: any[] }>('/installments');
    return (result?.installments || []).filter((i) => i.plan_id === planId);
  },
  async pay(planId: string, installmentNo: number): Promise<boolean> {
    const row = await api<{ ok: boolean }>(`/installments/${planId}/pay/${installmentNo}`, { method: 'POST' });
    return Boolean(row?.ok);
  },
  async remove(planId: string): Promise<boolean> {
    const row = await api<{ ok: boolean }>(`/installments/${planId}`, { method: 'DELETE' });
    return Boolean(row?.ok);
  },
};

export async function neonDelete(table: 'customers' | 'suppliers' | 'employees' | 'invoices' | 'payroll_records' | 'tax_records' | 'activity_log', id: string): Promise<boolean> {
  const row = await api<{ ok: boolean }>(`/${table}/${id}`, { method: 'DELETE' });
  return Boolean(row?.ok);
}

export async function neonCustomers() { return (await api<any[]>('/customers')) || []; }
export async function neonSuppliers() { return (await api<any[]>('/suppliers')) || []; }
export async function neonEmployees() { return (await api<any[]>('/employees')) || []; }
export async function neonCurrencies() { return (await api<any[]>('/currencies')) || []; }

export async function neonStats() {
  return (await api<{ inventoryCount: number; inventoryValue: number; transactionCount: number; planCount: number; receivable: number }>('/stats')) || { inventoryCount: 0, inventoryValue: 0, transactionCount: 0, planCount: 0, receivable: 0 };
}
