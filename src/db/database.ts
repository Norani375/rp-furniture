/**
 * ERP Database Layer — localStorage with full CRUD + Transaction Logging
 * Ready to replace with @neondatabase/serverless
 */
import {
  InventoryItem, InstallmentPlan, CurrencySettings,
  Transaction, TransactionType,
  ReportFilter, ReportSummary,
} from '../types';

// Re-export for API layer
export type { InventoryItem, Transaction, InstallmentPlan, CurrencySettings, ReportFilter, ReportSummary };
import { inventoryItems as seedInventory, exchangeRates } from '../data/mockData';

/* ─── Constants ─── */
const DB = {
  inventory: 'erp_inventory',
  installments: 'erp_installments',
  currencies: 'erp_currencies',
  transactions: 'erp_ledger',        // unified transaction log
  invoiceSeq: 'erp_invoice_seq',
} as const;

const AFN = (v: number) => new Intl.NumberFormat('fa-AF').format(Math.round(v)) + ' ؋';

/* ─── Helpers ─── */
const load = <T>(key: string, fallback: T): T => {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) as T : fallback; }
  catch { return fallback; }
};
const save = (key: string, v: unknown) => localStorage.setItem(key, JSON.stringify(v));

function nextInvoiceId(): string {
  const n = (load<number>(DB.invoiceSeq, 0) + 1);
  save(DB.invoiceSeq, n);
  return `TRX-${String(n).padStart(5, '0')}`;
}

function persianDate(): string {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

/* ─── Transaction Ledger (Unified) ─── */
export const dbLedger = {
  getAll: (): Transaction[] => load<Transaction[]>(DB.transactions, []),

  add(tx: Omit<Transaction, 'id' | 'balance' | 'createdAt' | 'updatedAt'>): Transaction {
    const all = dbLedger.getAll();
    const lastBalance = all.length > 0 ? all[all.length - 1].balance : 0;
    const record: Transaction = {
      ...tx,
      id: nextInvoiceId(),
      balance: lastBalance + tx.debit - tx.credit,
      createdAt: persianDate(),
      updatedAt: persianDate(),
    };
    all.push(record);
    save(DB.transactions, all);
    return record;
  },

  addMany(rows: Omit<Transaction, 'id' | 'balance' | 'createdAt' | 'updatedAt'>[]): Transaction[] {
    const records: Transaction[] = [];
    for (const row of rows) records.push(dbLedger.add(row));
    return records;
  },

  filter(f: ReportFilter): Transaction[] {
    return dbLedger.getAll().filter((tx) => {
      if (f.from && tx.date < f.from) return false;
      if (f.to && tx.date > f.to) return false;
      if (f.type && f.type !== 'all' && tx.type !== f.type) return false;
      if (f.status && f.status !== 'all' && tx.status !== f.status) return false;
      if (f.minAmount !== undefined && tx.debit + tx.credit < f.minAmount) return false;
      if (f.maxAmount !== undefined && tx.debit + tx.credit > f.maxAmount) return false;
      return true;
    });
  },

  summary(f: ReportFilter): ReportSummary {
    const rows = dbLedger.filter(f);
    const byType = {} as Record<TransactionType, { count: number; sum: number }>;
    const types: TransactionType[] = ['sale','purchase','expense','payroll','tax','installment','inventory_in','inventory_out','payment_in','payment_out'];
    types.forEach((t) => { byType[t] = { count: 0, sum: 0 }; });

    let totalDebit = 0, totalCredit = 0;
    rows.forEach((tx) => {
      totalDebit += tx.debit;
      totalCredit += tx.credit;
      byType[tx.type].count++;
      byType[tx.type].sum += tx.debit + tx.credit;
    });

    return {
      period: `${f.from || '…'} تا ${f.to || '…'}`,
      totalTransactions: rows.length,
      totalDebit,
      totalCredit,
      netBalance: totalDebit - totalCredit,
      byType,
      dailyAverage: rows.length > 0 ? (totalDebit + totalCredit) / rows.length : 0,
    };
  },

  exportJSON(): string {
    return JSON.stringify(dbLedger.getAll(), null, 2);
  },

  exportCSV(): string {
    const rows = dbLedger.getAll();
    const header = 'id,date,type,status,title,description,debit,credit,balance,refType,refId,createdBy';
    const body = rows.map((r) =>
      `${r.id},${r.date},${r.type},${r.status},"${r.title}","${r.description}",${r.debit},${r.credit},${r.balance},${r.refType},${r.refId},${r.createdBy}`
    ).join('\n');
    return header + '\n' + body;
  },

  clear() {
    localStorage.removeItem(DB.transactions);
  },
};

/* ─── Inventory ─── */
export const dbInventory = {
  getAll: (): InventoryItem[] => load(DB.inventory, seedInventory),
  saveAll: (items: InventoryItem[]) => save(DB.inventory, items),
  add: (item: InventoryItem) => {
    const all = dbInventory.getAll();
    all.push({ ...item, id: all.length ? Math.max(...all.map((i) => i.id)) + 1 : 1 });
    dbInventory.saveAll(all);
    return all;
  },
  update: (id: number, patch: Partial<InventoryItem>) => {
    const all = dbInventory.getAll().map((i) => (i.id === id ? { ...i, ...patch } : i));
    dbInventory.saveAll(all); return all;
  },
  remove: (id: number) => {
    const all = dbInventory.getAll().filter((i) => i.id !== id);
    dbInventory.saveAll(all); return all;
  },
};

/* ─── Installments ─── */
const seedPlans: InstallmentPlan[] = [
  { id: 'INS-001', customerName: 'احمد درافشان', totalAmount: 1850000, paidAmount: 600000, remainingAmount: 1250000, dueDate: '1404/01/10', status: 'active', installments: [
    { id: '1', dueDate: '1403/12/10', amount: 500000, paid: true },
    { id: '2', dueDate: '1403/12/25', amount: 500000, paid: true },
    { id: '3', dueDate: '1404/01/10', amount: 500000, paid: false },
    { id: '4', dueDate: '1404/01/25', amount: 350000, paid: false },
  ]},
  { id: 'INS-002', customerName: 'محمد مراد', totalAmount: 950000, paidAmount: 200000, remainingAmount: 750000, dueDate: '1404/01/05', status: 'overdue', installments: [
    { id: '1', dueDate: '1403/11/20', amount: 300000, paid: true },
    { id: '2', dueDate: '1403/12/05', amount: 300000, paid: true },
    { id: '3', dueDate: '1403/12/20', amount: 350000, paid: false },
  ]},
];

export const dbInstallments = {
  getAll: (): InstallmentPlan[] => load(DB.installments, seedPlans),
  saveAll: (plans: InstallmentPlan[]) => save(DB.installments, plans),
  add: (plan: InstallmentPlan) => {
    const all = dbInstallments.getAll(); all.push(plan); dbInstallments.saveAll(all);
    dbLedger.add({ date: persianDate(), type: 'installment', status: 'confirmed', title: `طرح قسطی ${plan.customerName}`, description: `مبلغ ${plan.totalAmount}`, debit: plan.totalAmount, credit: 0, refType: 'installment', refId: plan.id, createdBy: 'سیستم' });
    return all;
  },
  pay: (planId: string, installmentId: string) => {
    const all = dbInstallments.getAll().map((plan) => {
      if (plan.id !== planId) return plan;
      const updated = plan.installments.map((inst) => inst.id === installmentId ? { ...inst, paid: true } : inst);
      const paidAmount = updated.reduce((s, i) => s + (i.paid ? i.amount : 0), 0);
      const allPaid = updated.every((i) => i.paid);
      const inst2 = plan.installments.find((i) => i.id === installmentId);
      if (inst2) {
        dbLedger.add({ date: persianDate(), type: 'payment_in', status: 'confirmed', title: `پرداخت قسط ${plan.customerName}`, description: `قسط ${installmentId} — ${inst2.amount}`, debit: inst2.amount, credit: 0, refType: 'installment', refId: plan.id, createdBy: 'کاربر' });
      }
      return { ...plan, installments: updated, paidAmount, remainingAmount: plan.totalAmount - paidAmount, status: allPaid ? 'completed' : plan.status } as InstallmentPlan;
    });
    dbInstallments.saveAll(all); return all;
  },
};

/* ─── Currencies ─── */
const seedCurrencySettings: CurrencySettings = { baseCurrency: 'AFN', secondaryCurrencies: ['USD','EUR','PKR','IRR','CNY'], rates: { ...exchangeRates }, activeCurrencies: ['USD','EUR','PKR','IRR','CNY'] };
export const dbCurrencies = { getSettings: (): CurrencySettings => load(DB.currencies, seedCurrencySettings), saveSettings: (s: CurrencySettings) => save(DB.currencies, s) };

/* ─── Reset ─── */
export const dbReset = () => { Object.values(DB).forEach((k) => localStorage.removeItem(k)); window.location.reload(); };

export { AFN, persianDate, nextInvoiceId };
