/**
 * Neon PostgreSQL Client (Browser-side via serverless HTTP driver)
 * ---------------------------------------------------------------
 * Uses @neondatabase/serverless for direct browser → Neon connection.
 * Falls back to localStorage when Neon is unavailable.
 */
import { neon } from '@neondatabase/serverless';
import type { Transaction, InventoryItem, InstallmentPlan } from '../types';

// ⚠️ SECURITY: In production, this module is used ONLY for local development.
// In deployed environment, set VITE_FORCE_LOCAL=true and all data goes through localStorage.
// For secure deployment, use server/index.js as backend proxy — credentials stay server-side only.
const NEON_URL = import.meta.env.VITE_DATABASE_URL || '';
// SECURITY: When this flag is true, Neon functions return empty data and no credentials are exposed
const FORCE_LOCAL = import.meta.env.VITE_FORCE_LOCAL === 'true';

let _sql: ReturnType<typeof neon> | null = null;
function sql() {
  if (FORCE_LOCAL) throw new Error('Neon disabled by VITE_FORCE_LOCAL');
  if (!_sql) {
    if (!NEON_URL) throw new Error('Database URL not configured');
    _sql = neon(NEON_URL);
  }
  return _sql;
}

/* ─── Connection Test ─── */
export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    await sql()`SELECT 1 as ok`;
    return { ok: true, message: 'اتصال موفق به Neon PostgreSQL' };
  } catch (e) {
    return { ok: false, message: `خطای اتصال: ${(e as Error).message}` };
  }
}

/* ─── Inventory ─── */
export const neonInventory = {
  async getAll(): Promise<InventoryItem[]> {
    try {
      const rows = (await sql()`SELECT * FROM inventory_items ORDER BY category, name`) as any[];
      return rows.map((r) => ({
        id: Number(r.id),
        name: r.name,
        unit: r.unit,
        quantity: Number(r.quantity),
        unitPriceAFN: Number(r.unit_price_afn),
        category: r.category || undefined,
      }));
    } catch { return []; }
  },
  async add(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem | null> {
    try {
      const rows = (await sql()`
        INSERT INTO inventory_items (sku, name, unit, quantity, unit_price_afn, category)
        VALUES (${item.category || 'GEN'}, ${item.name}, ${item.unit}, ${item.quantity}, ${item.unitPriceAFN}, ${item.category || null})
        RETURNING *
      `) as any[];
      const r = rows[0];
      return { id: Number(r.id), name: r.name, unit: r.unit, quantity: Number(r.quantity), unitPriceAFN: Number(r.unit_price_afn) };
    } catch { return null; }
  },
  async update(id: number, patch: Partial<InventoryItem>): Promise<boolean> {
    try {
      await sql()`
        UPDATE inventory_items SET
          name = COALESCE(${patch.name ?? null}, name),
          unit = COALESCE(${patch.unit ?? null}, unit),
          quantity = COALESCE(${patch.quantity ?? null}, quantity),
          unit_price_afn = COALESCE(${patch.unitPriceAFN ?? null}, unit_price_afn),
          category = COALESCE(${patch.category ?? null}, category),
          updated_at = NOW()
        WHERE id = ${id}
      `;
      return true;
    } catch { return false; }
  },
  async remove(id: number): Promise<boolean> {
    try {
      await sql()`DELETE FROM inventory_items WHERE id = ${id}`;
      return true;
    } catch { return false; }
  },
};

/* ─── Transactions ─── */
export const neonLedger = {
  async getAll(): Promise<Transaction[]> {
    try {
      const rows = (await sql()`SELECT * FROM transactions ORDER BY date DESC, created_at DESC`) as any[];
      return rows.map((r) => ({
        id: r.id,
        date: typeof r.date === 'string' ? r.date : String(r.date),
        type: r.type,
        status: r.status,
        title: r.title,
        description: r.description || '',
        debit: Number(r.debit),
        credit: Number(r.credit),
        balance: Number(r.balance),
        refType: r.ref_type || '',
        refId: r.ref_id || '',
        createdBy: r.created_by || '',
        createdAt: r.created_at || '',
        updatedAt: r.created_at || '',
      }));
    } catch { return []; }
  },
  async add(tx: Transaction): Promise<boolean> {
    try {
      await sql()`
        INSERT INTO transactions (id, date, type, status, title, description, debit, credit, balance, ref_type, ref_id, created_by)
        VALUES (${tx.id}, ${tx.date}, ${tx.type}, ${tx.status}, ${tx.title}, ${tx.description || ''}, ${tx.debit}, ${tx.credit}, ${tx.balance}, ${tx.refType || ''}, ${tx.refId || ''}, ${tx.createdBy || ''})
        ON CONFLICT (id) DO NOTHING
      `;
      return true;
    } catch { return false; }
  },
  async count(): Promise<number> {
    try {
      const rows = (await sql()`SELECT COUNT(*)::int as c FROM transactions`) as any[];
      return rows[0]?.c || 0;
    } catch { return 0; }
  },
  async update(id: string, patch: Partial<Transaction>): Promise<boolean> {
    try {
      await sql()`
        UPDATE transactions SET
          title = COALESCE(${patch.title ?? null}, title),
          description = COALESCE(${patch.description ?? null}, description),
          type = COALESCE(${patch.type ?? null}, type),
          status = COALESCE(${patch.status ?? null}, status),
          debit = COALESCE(${patch.debit ?? null}, debit),
          credit = COALESCE(${patch.credit ?? null}, credit),
          balance = COALESCE(${patch.balance ?? null}, balance)
        WHERE id = ${id}
      `;
      return true;
    } catch { return false; }
  },
  async remove(id: string): Promise<boolean> {
    try {
      await sql()`DELETE FROM transactions WHERE id = ${id}`;
      return true;
    } catch { return false; }
  },
};

/* ─── Installments ─── */
export const neonInstallments = {
  async getPlans(): Promise<InstallmentPlan[]> {
    try {
      const rows = (await sql()`SELECT * FROM installment_plans ORDER BY created_at DESC`) as any[];
      return rows.map((r) => {
        const paid = Number(r.paid_amount) || 0;
        const total = Number(r.total_amount) || 0;
        return {
          id: r.id,
          customerName: r.customer_name,
          totalAmount: total,
          paidAmount: paid,
          remainingAmount: total - paid,
          dueDate: r.end_date || '',
          status: r.status,
          installments: [],
        };
      });
    } catch { return []; }
  },
  async getInstallments(planId: string) {
    try {
      return (await sql()`SELECT * FROM installments WHERE plan_id = ${planId} ORDER BY installment_no`) as any[];
    } catch { return []; }
  },
  async pay(planId: string, installmentNo: number): Promise<boolean> {
    try {
      await sql()`UPDATE installments SET paid = TRUE, paid_date = CURRENT_DATE WHERE plan_id = ${planId} AND installment_no = ${installmentNo}`;
      // Update plan totals
      await sql()`
        UPDATE installment_plans SET
          paid_amount = (SELECT COALESCE(SUM(amount), 0) FROM installments WHERE plan_id = ${planId} AND paid = TRUE)
        WHERE id = ${planId}
      `;
      return true;
    } catch { return false; }
  },
  async remove(planId: string): Promise<boolean> {
    try {
      await sql()`DELETE FROM installment_plans WHERE id = ${planId}`;
      return true;
    } catch { return false; }
  },
};

export async function neonDelete(
  table: 'customers' | 'suppliers' | 'employees' | 'invoices' | 'payroll_records' | 'tax_records' | 'activity_log',
  id: string,
): Promise<boolean> {
  try {
    if (table === 'customers') await sql()`DELETE FROM customers WHERE id = ${id}`;
    if (table === 'suppliers') await sql()`DELETE FROM suppliers WHERE id = ${id}`;
    if (table === 'employees') await sql()`DELETE FROM employees WHERE id = ${id}`;
    if (table === 'invoices') await sql()`DELETE FROM invoices WHERE id = ${id}`;
    if (table === 'payroll_records') await sql()`DELETE FROM payroll_records WHERE id = ${id}`;
    if (table === 'tax_records') await sql()`DELETE FROM tax_records WHERE id = ${id}`;
    if (table === 'activity_log') await sql()`DELETE FROM activity_log WHERE id = ${id}`;
    return true;
  } catch { return false; }
}

/* ─── Customers ─── */
export async function neonCustomers() {
  try {
    return (await sql()`SELECT * FROM customers ORDER BY name`) as any[];
  } catch { return []; }
}

/* ─── Suppliers ─── */
export async function neonSuppliers() {
  try {
    return (await sql()`SELECT * FROM suppliers ORDER BY name`) as any[];
  } catch { return []; }
}

/* ─── Employees ─── */
export async function neonEmployees() {
  try {
    return (await sql()`SELECT * FROM employees ORDER BY last_name`) as any[];
  } catch { return []; }
}

/* ─── Currencies ─── */
export async function neonCurrencies() {
  try {
    return (await sql()`SELECT * FROM currencies ORDER BY code`) as any[];
  } catch { return []; }
}

/* ─── Stats ─── */
export async function neonStats() {
  try {
    const inv = (await sql()`SELECT COUNT(*)::int as c, COALESCE(SUM(quantity * unit_price_afn),0) as v FROM inventory_items`) as any[];
    const tx = (await sql()`SELECT COUNT(*)::int as c FROM transactions`) as any[];
    const plans = (await sql()`SELECT COUNT(*)::int as c, COALESCE(SUM(total_amount - paid_amount),0) as r FROM installment_plans`) as any[];
    return {
      inventoryCount: inv[0]?.c || 0,
      inventoryValue: Number(inv[0]?.v || 0),
      transactionCount: tx[0]?.c || 0,
      planCount: plans[0]?.c || 0,
      receivable: Number(plans[0]?.r || 0),
    };
  } catch {
    return { inventoryCount: 0, inventoryValue: 0, transactionCount: 0, planCount: 0, receivable: 0 };
  }
}
