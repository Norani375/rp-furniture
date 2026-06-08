import { dbLedger, dbProduction, dbInventory } from '../db/database';

// ============================================
// STANDARD FINANCIAL REPORTS (IFRS / GAAP)
// ============================================

export const financialReports = {
  // 1. Income Statement (صورت سود و زیان)
  getIncomeStatement(from?: string, to?: string) {
    const txns = dbLedger.getAll().filter((t) => t.status === 'confirmed');
    const filtered = from || to ? txns.filter((t) => (!from || t.date >= from) && (!to || t.date <= to)) : txns;

    const revenue = filtered.filter((t) => ['sale', 'payment_in'].includes(t.type)).reduce((s, t) => s + t.debit, 0);
    const cogs = dbProduction.getOrders()
      .filter((o) => !from || o.date >= from)
      .filter((o) => !to || o.date <= to)
      .reduce((s, o) => s + o.totalCost, 0);
    const operatingExpenses = filtered.filter((t) => ['expense', 'payroll', 'tax'].includes(t.type)).reduce((s, t) => s + t.credit, 0);
    const otherExpenses = filtered.filter((t) => ['purchase', 'payment_out'].includes(t.type)).reduce((s, t) => s + t.credit, 0);
    const totalExpenses = cogs + operatingExpenses + otherExpenses;

    const profit = revenue - totalExpenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      period: `${from || 'آغاز'} تا ${to || 'امروز'}`,
      revenue,
      cogs,
      grossProfit: revenue - cogs,
      grossMargin: revenue > 0 ? ((revenue - cogs) / revenue) * 100 : 0,
      operatingExpenses,
      otherExpenses,
      totalExpenses,
      netProfit: profit,
      netMargin: margin,
    };
  },

  // 2. Balance Sheet Summary (ترازنامه خلاصه)
  getBalanceSheet() {
    const totalAssets = dbInventory.getAll().reduce((s, i) => s + i.quantity * i.unitPriceAFN, 0);
    const lastTx = dbLedger.getAll().slice(-1)[0];
    const cashBalance = lastTx?.balance || 0;
    return { totalAssets, cashBalance, totalEquity: totalAssets + cashBalance };
  },

  // 3. Cash Flow Summary (جریان نقدی)
  getCashFlow(from?: string, to?: string) {
    const txns = dbLedger.getAll().filter((t) => t.status === 'confirmed');
    const filtered = from || to ? txns.filter((t) => (!from || t.date >= from) && (!to || t.date <= to)) : txns;

    return {
      operatingIn: filtered.filter((t) => ['sale', 'payment_in'].includes(t.type)).reduce((s, t) => s + t.debit, 0),
      operatingOut: filtered.filter((t) => ['expense', 'payroll', 'tax'].includes(t.type)).reduce((s, t) => s + t.credit, 0),
      investingOut: filtered.filter((t) => t.type === 'purchase').reduce((s, t) => s + t.credit, 0),
      inventoryChange: filtered.filter((t) => ['inventory_in', 'inventory_out'].includes(t.type)).reduce((s, t) => s + t.debit - t.credit, 0),
    };
  },

  // 4. Tax Summary (خلاصه مالیاتی)
  getTaxReport(from?: string, to?: string) {
    const txns = dbLedger.getAll().filter((t) => t.type === 'tax');
    const filtered = from || to ? txns.filter((t) => (!from || t.date >= from) && (!to || t.date <= to)) : txns;
    return {
      totalTaxPaid: filtered.filter((t) => t.status === 'confirmed').reduce((s, t) => s + t.credit, 0),
      taxRecords: filtered.length,
      estimatedVAT: this.getIncomeStatement(from, to).revenue * 0.1,
    };
  },

  // 5. Export to CSV
  exportToCSV(reportName: string, data: Record<string, any>): string {
    const header = Object.keys(data).join(',');
    const values = Object.values(data).map((v) => `"${v}"`).join(',');
    return `${reportName}\n${header}\n${values}`;
  },
};
