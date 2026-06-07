import { useMemo } from 'react';
import { Package, Wallet, Users, AlertTriangle } from 'lucide-react';
import { inventoryItems } from '../data/mockData';
import { dbInstallments, dbLedger, AFN } from '../db/database';

export default function Dashboard() {
  const plans = dbInstallments.getAll();
  const ledger = dbLedger.getAll();

  const stats = useMemo(() => {
    const totalValue = inventoryItems.reduce((s, i) => s + i.quantity * i.unitPriceAFN, 0);
    const totalPlans = plans.length;
    const activePlans = plans.filter((p) => p.status === 'active').length;
    const overduePlans = plans.filter((p) => p.status === 'overdue').length;
    const receivable = plans.reduce((s, p) => s + p.remainingAmount, 0);
    const totalDebit = ledger.reduce((s, t) => s + t.debit, 0);
    const totalCredit = ledger.reduce((s, t) => s + t.credit, 0);
    const today = ledger.filter((t) => t.date === new Date().toISOString().slice(0, 10));
    return { totalValue, totalPlans, activePlans, overduePlans, receivable, totalDebit, totalCredit, netBalance: totalDebit - totalCredit, todayCount: today.length };
  }, [plans, ledger]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">داشبورد مدیریت یکپارچه</h2>
          <p className="text-sm text-slate-500">خلاصه کل سیستم — {ledger.length} تراکنش ثبت شده</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2">
          <span className="text-xs text-slate-500">مانده کل:</span>
          <span className={`text-sm font-bold ${stats.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {AFN(stats.netBalance)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="کل اجناس" value={String(inventoryItems.length)} sub="قلم کالا" color="bg-indigo-100 text-indigo-700" />
        <StatCard icon={Wallet} label="ارزش موجودی" value={AFN(stats.totalValue)} sub="افغانی" color="bg-emerald-100 text-emerald-700" />
        <StatCard icon={Users} label="طرح‌های قسطی" value={String(stats.totalPlans)} sub={`${stats.activePlans} فعال · ${stats.overduePlans} معوق`} color="bg-blue-100 text-blue-700" />
        <StatCard icon={AlertTriangle} label="مطالبات معوق" value={AFN(stats.receivable)} sub="باقیمانده قسط‌ها" color="bg-red-100 text-red-700" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">آخرین تراکنش‌ها</h3>
          <div className="space-y-2">
            {ledger.slice(-8).reverse().map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${tx.debit > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{tx.title}</p>
                    <p className="text-[10px] text-slate-500">{tx.id} · {tx.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${tx.debit > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {tx.debit > 0 ? '+' : '-'}{AFN(tx.debit || tx.credit)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">خلاصه اقساط</h3>
          <div className="space-y-2">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-xl border border-slate-100 px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{plan.customerName}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${plan.status === 'active' ? 'bg-blue-50 text-blue-700' : plan.status === 'overdue' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {plan.status === 'active' ? 'درجریان' : plan.status === 'overdue' ? 'معوق' : 'تکمیل'}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-slate-500">{plan.installments.filter((i) => i.paid).length}/{plan.installments.length} قسط</span>
                  <span className="font-bold text-red-600">{AFN(plan.remainingAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon size={20} /></div>
        <div><p className="text-xs text-slate-500">{label}</p><p className="text-lg font-bold text-slate-900">{value}</p></div>
      </div>
      <p className="mt-2 text-xs text-slate-400">{sub}</p>
    </div>
  );
}
