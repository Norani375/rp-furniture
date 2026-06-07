/**
 * ERP Database Layer — localStorage with full CRUD + Transaction Logging
 * Ready to replace with @neondatabase/serverless
 */
import {
  InventoryItem, InstallmentPlan, CurrencySettings,
  Transaction, TransactionType,
  ReportFilter, ReportSummary,
  ProductionRecipe, ProductionOrder, BankAccount, ChequeRecord, SystemNotification,
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
  recipes: 'erp_recipes',
  productionOrders: 'erp_production_orders',
  bankAccounts: 'erp_bank_accounts',
  cheques: 'erp_cheques',
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

  update(id: string, patch: Partial<Transaction>): Transaction[] {
    const all = dbLedger.getAll().map((tx) => (tx.id === id ? { ...tx, ...patch, updatedAt: persianDate() } : tx));
    save(DB.transactions, all);
    return all;
  },

  remove(id: string): Transaction[] {
    const all = dbLedger.getAll().filter((tx) => tx.id !== id);
    save(DB.transactions, all);
    return all;
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
  update: (planId: string, patch: Partial<InstallmentPlan>) => {
    const all = dbInstallments.getAll().map((p) => (p.id === planId ? { ...p, ...patch } : p));
    dbInstallments.saveAll(all);
    return all;
  },
  remove: (planId: string) => {
    const all = dbInstallments.getAll().filter((p) => p.id !== planId);
    dbInstallments.saveAll(all);
    return all;
  },
};

/* ─── Currencies ─── */
const seedCurrencySettings: CurrencySettings = { baseCurrency: 'AFN', secondaryCurrencies: ['USD','EUR','PKR','IRR','CNY'], rates: { ...exchangeRates }, activeCurrencies: ['USD','EUR','PKR','IRR','CNY'] };
export const dbCurrencies = { getSettings: (): CurrencySettings => load(DB.currencies, seedCurrencySettings), saveSettings: (s: CurrencySettings) => save(DB.currencies, s) };

/* ─── Production / BOM ─── */
const seedRecipes: ProductionRecipe[] = [
  {
    id: 'BOM-001',
    productName: 'الماری دومتره',
    outputUnit: 'دانه',
    outputQuantity: 1,
    laborCost: 1200,
    overheadCost: 600,
    createdAt: persianDate(),
    materials: [
      { itemId: 1, name: 'تخته لمونشین ۱.۸۳/۲.۴۴cm', quantity: 2, unit: 'دانه', unitCost: 2200 },
      { itemId: 45, name: 'خرپیچ 50', quantity: 0.1, unit: 'کارتن', unitCost: 2200 },
      { itemId: 58, name: 'شیرش دلتا آهن', quantity: 0.1, unit: 'کارتن', unitCost: 3500 },
    ],
  },
  {
    id: 'BOM-002',
    productName: 'تخت خواب 1/50cm',
    outputUnit: 'دانه',
    outputQuantity: 1,
    laborCost: 900,
    overheadCost: 400,
    createdAt: persianDate(),
    materials: [
      { itemId: 2, name: 'تخته لمونشین 1.83/3.66', quantity: 1, unit: 'دانه', unitCost: 3200 },
      { itemId: 46, name: 'خرپیچ 32', quantity: 1, unit: 'قوطی', unitCost: 110 },
    ],
  },
];

export const dbProduction = {
  getRecipes: (): ProductionRecipe[] => load(DB.recipes, seedRecipes),
  saveRecipes: (recipes: ProductionRecipe[]) => save(DB.recipes, recipes),
  getOrders: (): ProductionOrder[] => load(DB.productionOrders, []),
  saveOrders: (orders: ProductionOrder[]) => save(DB.productionOrders, orders),
  completeOrder(recipeId: string, quantity: number) {
    const recipe = dbProduction.getRecipes().find((r) => r.id === recipeId);
    if (!recipe) return null;
    const materialCost = recipe.materials.reduce((s, m) => s + m.quantity * m.unitCost, 0) * quantity;
    const totalCost = materialCost + (recipe.laborCost + recipe.overheadCost) * quantity;
    const order: ProductionOrder = {
      id: `PROD-${Date.now().toString().slice(-6)}`,
      recipeId,
      productName: recipe.productName,
      quantity,
      totalCost,
      status: 'completed',
      date: persianDate(),
    };
    const orders = [...dbProduction.getOrders(), order];
    dbProduction.saveOrders(orders);
    dbLedger.add({ date: order.date, type: 'inventory_in', status: 'confirmed', title: `تولید ${recipe.productName}`, description: `${quantity} ${recipe.outputUnit}`, debit: totalCost, credit: 0, refType: 'production', refId: order.id, createdBy: 'کاربر' });
    return order;
  },
};

/* ─── Banking / Cheques ─── */
const seedAccounts: BankAccount[] = [
  { id: 'BA-001', name: 'صندوق فروشگاه', bankName: 'نقد', accountNo: 'CASH', balance: 599500, currency: 'AFN' },
  { id: 'BA-002', name: 'حساب بانکی اصلی', bankName: 'Azizi Bank', accountNo: '100-ERP-001', balance: 1850000, currency: 'AFN' },
];

const seedCheques: ChequeRecord[] = [
  { id: 'CHQ-001', chequeNo: '905521', partyName: 'احمد درافشان', amount: 650000, dueDate: '2025-03-30', type: 'received', status: 'pending' },
  { id: 'CHQ-002', chequeNo: '110245', partyName: 'تامین کننده الف', amount: 245000, dueDate: '2025-03-25', type: 'issued', status: 'pending' },
];

export const dbBanking = {
  getAccounts: (): BankAccount[] => load(DB.bankAccounts, seedAccounts),
  saveAccounts: (accounts: BankAccount[]) => save(DB.bankAccounts, accounts),
  getCheques: (): ChequeRecord[] => load(DB.cheques, seedCheques),
  saveCheques: (cheques: ChequeRecord[]) => save(DB.cheques, cheques),
  addCheque(cheque: ChequeRecord) {
    const all = [...dbBanking.getCheques(), cheque];
    dbBanking.saveCheques(all);
    dbLedger.add({ date: persianDate(), type: cheque.type === 'received' ? 'payment_in' : 'payment_out', status: 'pending', title: `${cheque.type === 'received' ? 'چک دریافتی' : 'چک پرداختی'} ${cheque.chequeNo}`, description: cheque.partyName, debit: cheque.type === 'received' ? cheque.amount : 0, credit: cheque.type === 'issued' ? cheque.amount : 0, refType: 'cheque', refId: cheque.id, createdBy: 'کاربر' });
    return all;
  },
};

/* ─── Notifications ─── */
export const dbNotifications = {
  getAll(): SystemNotification[] {
    const items = dbInventory.getAll();
    const cheques = dbBanking.getCheques();
    const plans = dbInstallments.getAll();
    const lowStock = items.filter((i) => i.quantity <= 2).slice(0, 8).map((i, idx) => ({
      id: `LOW-${idx}-${i.id}`,
      title: 'کمبود موجودی',
      message: `${i.name} فقط ${i.quantity} ${i.unit} باقی مانده است`,
      severity: 'warning' as const,
      module: 'انبار',
      createdAt: persianDate(),
      read: false,
    }));
    const pendingCheques = cheques.filter((c) => c.status === 'pending').map((c) => ({
      id: `CHQ-${c.id}`,
      title: 'چک در انتظار',
      message: `${c.chequeNo} - ${c.partyName} - ${AFN(c.amount)}`,
      severity: c.type === 'issued' ? 'danger' as const : 'info' as const,
      module: 'چک و بانک',
      createdAt: c.dueDate,
      read: false,
    }));
    const overduePlans = plans.filter((p) => p.status === 'overdue').map((p) => ({
      id: `INS-${p.id}`,
      title: 'قسط معوق',
      message: `${p.customerName} - باقیمانده ${AFN(p.remainingAmount)}`,
      severity: 'danger' as const,
      module: 'اقساط',
      createdAt: p.dueDate,
      read: false,
    }));
    return [...overduePlans, ...pendingCheques, ...lowStock];
  },
};

/* ─── Reset ─── */
export const dbReset = () => { Object.values(DB).forEach((k) => localStorage.removeItem(k)); window.location.reload(); };

export { AFN, persianDate, nextInvoiceId };
