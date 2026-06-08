import { dbInventory, dbLedger, dbInstallments, dbBanking, AFN, persianDate } from '../db/database';
import { SystemNotification } from '../types';

// ============================================
// REAL-TIME NOTIFICATION + SEARCH ENGINE
// ============================================

let _listeners: Array<(notifications: SystemNotification[]) => void> = [];

export const notificationService = {
  // Generate fresh notifications (every time called)
  generate(): SystemNotification[] {
    const items = dbInventory.getAll();
    const plans = dbInstallments.getAll();
    const cheques = dbBanking.getCheques();

    const lowStock: SystemNotification[] = items
      .filter((i) => i.quantity <= 2)
      .map((i, idx) => ({
        id: `LOW-${idx}-${i.id}`,
        title: '⚠️ کمبود موجودی بحرانی',
        message: `"${i.name}" فقط ${i.quantity} ${i.unit} باقی مانده است`,
        severity: 'danger' as const,
        module: 'انبار',
        createdAt: persianDate(),
        read: false,
      }));

    const warningStock: SystemNotification[] = items
      .filter((i) => i.quantity > 2 && i.quantity <= 5)
      .slice(0, 10)
      .map((i, idx) => ({
        id: `WARN-${idx}-${i.id}`,
        title: '⚠️ موجودی رو به اتمام',
        message: `"${i.name}" — ${i.quantity} ${i.unit} باقی مانده`,
        severity: 'warning' as const,
        module: 'انبار',
        createdAt: persianDate(),
        read: false,
      }));

    const overduePlans: SystemNotification[] = plans
      .filter((p) => p.status === 'overdue')
      .map((p) => ({
        id: `INS-${p.id}`,
        title: '🔴 قسط معوق / وصول نشده',
        message: `مشتری "${p.customerName}" — باقیمانده ${AFN(p.remainingAmount)}`,
        severity: 'danger' as const,
        module: 'اقساط',
        createdAt: p.dueDate,
        read: false,
      }));

    const pendingCheques: SystemNotification[] = cheques
      .filter((c) => c.status === 'pending')
      .map((c) => ({
        id: `CHQ-${c.id}`,
        title: c.type === 'received' ? '📄 چک دریافتی وصول نشده' : '📄 چک پرداختی در انتظار',
        message: `شماره ${c.chequeNo} — ${c.partyName} — ${AFN(c.amount)}`,
        severity: c.type === 'issued' ? 'danger' as const : 'info' as const,
        module: 'چک و بانک',
        createdAt: c.dueDate,
        read: false,
      }));

    const productionAlerts: SystemNotification[] = [];
    const orders = JSON.parse(localStorage.getItem('erp_production_orders') || '[]');
    productionAlerts.push({
      id: `PROD-CALC`,
      title: '📊 آخرین محاسبه تولید',
      message: `${orders.length} سفارش تولید در سیستم ثبت شده`,
      severity: 'info' as const,
      module: 'تولید',
      createdAt: persianDate(),
      read: false,
    });

    return [...overduePlans, ...pendingCheques, ...lowStock, ...warningStock, ...productionAlerts];
  },

  // Get current notifications (cached in memory)
  getAll(): SystemNotification[] {
    return this.generate();
  },

  // Count unread / active
  count(): number {
    return this.generate().length;
  },

  // ============================================
  // REAL-TIME SEARCH (Fuzzy across all modules)
  // ============================================
  search(query: string): Array<{ module: string; title: string; description: string; page: string }> {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const results: Array<{ module: string; title: string; description: string; page: string }> = [];

    // Search inventory
    dbInventory.getAll()
      .filter((i) => i.name.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((i) => results.push({ module: 'انبار', title: i.name, description: `${i.quantity} ${i.unit} — ${AFN(i.unitPriceAFN)}`, page: 'catalog' }));

    // Search transactions
    dbLedger.getAll()
      .filter((t) => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q))
      .slice(0, 5)
      .forEach((t) => results.push({ module: 'حسابداری', title: t.title, description: `${AFN(t.debit || t.credit)}`, page: 'accounting' }));

    // Search installments
    dbInstallments.getAll()
      .filter((p) => p.customerName.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((p) => results.push({ module: 'اقساط', title: p.customerName, description: `${AFN(p.remainingAmount)} باقیمانده`, page: 'installments' }));

    return results;
  },

  // ============================================
  // SUBSCRIBE to notification changes
  // ============================================
  subscribe(listener: (notifications: SystemNotification[]) => void) {
    _listeners.push(listener);
    return () => { _listeners = _listeners.filter((l) => l !== listener); };
  },

  refresh() {
    const all = this.generate();
    _listeners.forEach((l) => l(all));
  },
};
