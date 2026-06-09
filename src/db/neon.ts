/**
 * Neon PostgreSQL — Direct Browser Connection
 * Uses @neondatabase/serverless HTTP driver (works from browser)
 * Falls back to Backend API if available
 */
import { neon } from '@neondatabase/serverless';
import type { InventoryItem, InstallmentPlan, Transaction } from '../types';

// Connection string — Neon serverless driver works over HTTPS from browser
const NEON_URL = 'postgresql://neondb_owner:npg_ntxjaCu6KVe2@ep-plain-fire-aqjgfoax-pooler.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require';

let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (!_sql) _sql = neon(NEON_URL);
  return _sql;
}

const mapTx = (r: any): Transaction => ({
  id: String(r.id), date: String(r.date || '').slice(0, 10), type: r.type, status: r.status,
  title: r.title, description: r.description || '', debit: Number(r.debit || 0), credit: Number(r.credit || 0),
  balance: Number(r.balance || 0), refType: r.ref_type || '', refId: r.ref_id || '',
  createdBy: r.created_by || '', createdAt: r.created_at || '', updatedAt: r.created_at || '',
});

export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const rows = await sql()`SELECT version() as v` as any[];
    return { ok: true, message: `Neon متصل — ${(rows[0]?.v || '').slice(0, 30)}` };
  } catch (e) {
    return { ok: false, message: `Neon در دسترس نیست: ${(e as Error).message?.slice(0, 60)}` };
  }
}

export const neonInventory = {
  async getAll(): Promise<InventoryItem[]> {
    try {
      const rows = await sql()`SELECT * FROM inventory_items ORDER BY category, name` as any[];
      return rows.map((r) => ({ id: Number(r.id), name: r.name, unit: r.unit, quantity: Number(r.quantity), unitPriceAFN: Number(r.unit_price_afn), category: r.category || undefined }));
    } catch { return []; }
  },
  async add(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem | null> {
    try {
      const rows = await sql()`INSERT INTO inventory_items (sku,name,unit,quantity,unit_price_afn,category) VALUES (${`GEN-${Date.now()}`},${item.name},${item.unit},${item.quantity},${item.unitPriceAFN},${item.category || 'عمومی'}) RETURNING *` as any[];
      const r = rows[0]; return r ? { id: Number(r.id), name: r.name, unit: r.unit, quantity: Number(r.quantity), unitPriceAFN: Number(r.unit_price_afn) } : null;
    } catch { return null; }
  },
  async update(id: number, patch: Partial<InventoryItem>): Promise<boolean> {
    try { await sql()`UPDATE inventory_items SET name=COALESCE(${patch.name ?? null},name), unit=COALESCE(${patch.unit ?? null},unit), quantity=COALESCE(${patch.quantity ?? null},quantity), unit_price_afn=COALESCE(${patch.unitPriceAFN ?? null},unit_price_afn) WHERE id=${id}`; return true; } catch { return false; }
  },
  async remove(id: number): Promise<boolean> {
    try { await sql()`DELETE FROM inventory_items WHERE id=${id}`; return true; } catch { return false; }
  },
};

export const neonLedger = {
  async getAll(): Promise<Transaction[]> {
    try { const rows = await sql()`SELECT * FROM transactions ORDER BY created_at DESC` as any[]; return rows.map(mapTx); } catch { return []; }
  },
  async add(tx: Transaction): Promise<boolean> {
    try { await sql()`INSERT INTO transactions (id,date,type,status,title,description,debit,credit,balance,ref_type,ref_id,created_by) VALUES (${tx.id},${tx.date},${tx.type},${tx.status},${tx.title},${tx.description},${tx.debit},${tx.credit},${tx.balance},${tx.refType},${tx.refId},${tx.createdBy}) ON CONFLICT (id) DO NOTHING`; return true; } catch { return false; }
  },
  async update(id: string, patch: Partial<Transaction>): Promise<boolean> {
    try { await sql()`UPDATE transactions SET title=COALESCE(${patch.title ?? null},title), description=COALESCE(${patch.description ?? null},description), debit=COALESCE(${patch.debit ?? null},debit), credit=COALESCE(${patch.credit ?? null},credit) WHERE id=${id}`; return true; } catch { return false; }
  },
  async remove(id: string): Promise<boolean> {
    try { await sql()`DELETE FROM transactions WHERE id=${id}`; return true; } catch { return false; }
  },
  async count(): Promise<number> {
    try { const r = await sql()`SELECT COUNT(*)::int as c FROM transactions` as any[]; return r[0]?.c || 0; } catch { return 0; }
  },
};

export const neonInstallments = {
  async getPlans(): Promise<InstallmentPlan[]> {
    try {
      const rows = await sql()`SELECT * FROM installment_plans ORDER BY created_at DESC` as any[];
      return rows.map((p) => ({ id: p.id, customerName: p.customer_name, totalAmount: Number(p.total_amount), paidAmount: Number(p.paid_amount), remainingAmount: Number(p.total_amount) - Number(p.paid_amount), dueDate: p.end_date || '', status: p.status, installments: [] }));
    } catch { return []; }
  },
  async getInstallments(planId: string) {
    try { return await sql()`SELECT * FROM installments WHERE plan_id=${planId} ORDER BY installment_no` as any[]; } catch { return []; }
  },
  async pay(planId: string, installmentNo: number): Promise<boolean> {
    try {
      await sql()`UPDATE installments SET paid=TRUE, paid_date=CURRENT_DATE WHERE plan_id=${planId} AND installment_no=${installmentNo}`;
      await sql()`UPDATE installment_plans SET paid_amount=(SELECT COALESCE(SUM(amount),0) FROM installments WHERE plan_id=${planId} AND paid=TRUE) WHERE id=${planId}`;
      return true;
    } catch { return false; }
  },
  async remove(planId: string): Promise<boolean> {
    try { await sql()`DELETE FROM installment_plans WHERE id=${planId}`; return true; } catch { return false; }
  },
};

export async function neonDelete(table: 'customers' | 'suppliers' | 'employees' | 'invoices' | 'payroll_records' | 'tax_records' | 'activity_log', id: string): Promise<boolean> {
  try {
    if (table === 'customers') await sql()`DELETE FROM customers WHERE id=${id}`;
    else if (table === 'suppliers') await sql()`DELETE FROM suppliers WHERE id=${id}`;
    else if (table === 'employees') await sql()`DELETE FROM employees WHERE id=${id}`;
    else if (table === 'invoices') await sql()`DELETE FROM invoices WHERE id=${id}`;
    else if (table === 'payroll_records') await sql()`DELETE FROM payroll_records WHERE id=${id}`;
    else if (table === 'tax_records') await sql()`DELETE FROM tax_records WHERE id=${id}`;
    else if (table === 'activity_log') await sql()`DELETE FROM activity_log WHERE id=${id}`;
    return true;
  } catch { return false; }
}

export async function neonStats() {
  try {
    const inv = await sql()`SELECT COUNT(*)::int as c, COALESCE(SUM(quantity*unit_price_afn),0) as v FROM inventory_items` as any[];
    const tx = await sql()`SELECT COUNT(*)::int as c FROM transactions` as any[];
    const pl = await sql()`SELECT COUNT(*)::int as c, COALESCE(SUM(total_amount-paid_amount),0) as r FROM installment_plans` as any[];
    return { inventoryCount: inv[0]?.c || 0, inventoryValue: Number(inv[0]?.v || 0), transactionCount: tx[0]?.c || 0, planCount: pl[0]?.c || 0, receivable: Number(pl[0]?.r || 0) };
  } catch {
    return { inventoryCount: 0, inventoryValue: 0, transactionCount: 0, planCount: 0, receivable: 0 };
  }
}

export async function neonCustomers() { try { return await sql()`SELECT * FROM customers ORDER BY name` as any[]; } catch { return []; } }
export async function neonSuppliers() { try { return await sql()`SELECT * FROM suppliers ORDER BY name` as any[]; } catch { return []; } }
export async function neonEmployees() { try { return await sql()`SELECT * FROM employees ORDER BY last_name` as any[]; } catch { return []; } }
export async function neonCurrencies() { try { return await sql()`SELECT * FROM currencies ORDER BY code` as any[]; } catch { return []; } }
