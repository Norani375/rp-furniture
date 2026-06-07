import { useState, useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import { dbInstallments, dbLedger, AFN, persianDate } from '../db/database';
import { InstallmentPlan } from '../types';
import RecordActions from '../components/RecordActions';
import { printMinimalDocument } from '../utils/printTemplates';

export default function Installments() {
  const [plans, setPlans] = useState<InstallmentPlan[]>(dbInstallments.getAll());
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<'plans' | 'history'>('plans');
  const [name, setName] = useState(''); const [amount, setAmount] = useState(''); const [count, setCount] = useState('4');

  const txHistory = useMemo(() => dbLedger.getAll().filter((t) => t.type === 'installment' || t.type === 'payment_in'), []);

  const addPlan = () => {
    const total = Number(amount); const cnt = Number(count);
    if (!name.trim() || total <= 0 || cnt <= 0) return;
    const per = Math.floor(total / cnt);
    const insts = Array.from({ length: cnt }).map((_, i) => ({ id: String(i + 1), dueDate: persianDate(), amount: i === cnt - 1 ? total - per * (cnt - 1) : per, paid: false }));
    const plan: InstallmentPlan = { id: `INS-${String(plans.length + 1).padStart(3, '0')}`, customerName: name.trim(), totalAmount: total, paidAmount: 0, remainingAmount: total, dueDate: insts[insts.length - 1].dueDate, status: 'active', installments: insts };
    dbInstallments.add(plan);
    setPlans(dbInstallments.getAll());
    setShowForm(false); setName(''); setAmount(''); setCount('4');
  };

  const printInstallments = () => printMinimalDocument({
    title: 'فاکتور / گزارش اقساط',
    subtitle: 'طرح‌های قسطی',
    party: 'واحد فروش',
    headers: ['شماره', 'مشتری', 'کل مبلغ', 'پرداخت شده', 'باقیمانده', 'وضعیت'],
    rows: plans.map((p) => [p.id, p.customerName, AFN(p.totalAmount), AFN(p.paidAmount), AFN(p.remainingAmount), p.status === 'active' ? 'درجریان' : p.status === 'overdue' ? 'معوق' : 'تکمیل شده']),
    totals: [{ label: 'جمع باقیمانده', value: AFN(plans.reduce((s, p) => s + p.remainingAmount, 0)) }],
  });

  const pay = (planId: string, instId: string) => {
    const plan = plans.find((p) => p.id === planId);
    const inst = plan?.installments.find((i) => i.id === instId);
    if (inst) {
      dbLedger.add({ date: persianDate(), type: 'payment_in', status: 'confirmed', title: `پرداخت قسط: ${plan?.customerName || ''}`, description: `قسط ${instId} — ${AFN(inst.amount)}`, debit: inst.amount, credit: 0, refType: 'installment', refId: planId, createdBy: 'کاربر' });
    }
    dbInstallments.pay(planId, instId);
    setPlans(dbInstallments.getAll());
  };

  const editPlan = (plan: InstallmentPlan) => {
    const next = prompt('مبلغ کل جدید را وارد کنید:', String(plan.totalAmount));
    if (next === null) return;
    const total = Number(next);
    if (total <= 0) return;
    setPlans(dbInstallments.update(plan.id, { totalAmount: total, remainingAmount: total - plan.paidAmount }));
  };

  const deletePlan = (planId: string) => {
    if (!confirm('آیا از حذف این طرح قسطی مطمئن هستید؟')) return;
    setPlans(dbInstallments.remove(planId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">مدیریت اقساط</h2><p className="text-sm text-slate-500">{plans.length} طرح · {txHistory.length} تراکنش</p></div>
        <div className="flex gap-2"><button onClick={printInstallments} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">پرینت</button><button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Plus size={18} /> طرح جدید</button></div>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-slate-900">ثبت طرح قسطی جدید</h3><button onClick={() => setShowForm(false)} className="rounded-lg p-1 hover:bg-slate-100 text-slate-500"><X size={18} /></button></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div><label className="text-xs font-medium text-slate-700">نام مشتری</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً: احمد درافشان" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" /></div>
            <div><label className="text-xs font-medium text-slate-700">مبلغ کل (افغانی)</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مثلاً: 1500000" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" /></div>
            <div><label className="text-xs font-medium text-slate-700">تعداد اقساط</label><input type="number" value={count} onChange={(e) => setCount(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" /></div>
          </div>
          <div className="mt-4 flex justify-end"><button onClick={addPlan} className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800">ثبت طرح</button></div>
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setTab('plans')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'plans' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>طرح‌ها ({plans.length})</button>
        <button onClick={() => setTab('history')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'history' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>تاریخچه پرداخت ({txHistory.length})</button>
      </div>

      {tab === 'plans' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-slate-500">{plan.id}</p><p className="text-base font-bold text-slate-900">{plan.customerName}</p></div>
                <div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${plan.status === 'active' ? 'bg-blue-50 text-blue-700' : plan.status === 'overdue' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>{plan.status === 'active' ? 'درجریان' : plan.status === 'overdue' ? 'معوق' : 'تکمیل شده'}</span><RecordActions compact onEdit={() => editPlan(plan)} onDelete={() => deletePlan(plan.id)} onPrint={printInstallments} /></div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3">
                <div><p className="text-[11px] text-slate-500">کل مبلغ</p><p className="text-sm font-semibold text-slate-900">{AFN(plan.totalAmount)}</p></div>
                <div><p className="text-[11px] text-slate-500">پرداخت شده</p><p className="text-sm font-semibold text-emerald-600">{AFN(plan.paidAmount)}</p></div>
                <div><p className="text-[11px] text-slate-500">باقیمانده</p><p className="text-sm font-semibold text-red-600">{AFN(plan.remainingAmount)}</p></div>
              </div>
              <div className="mt-4 space-y-2">
                {plan.installments.map((inst) => (
                  <div key={inst.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${inst.paid ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${inst.paid ? 'bg-emerald-500' : 'bg-amber-500'}`} /><span className="text-slate-700">قسط {inst.id}</span></div>
                    <div className="flex items-center gap-3"><span className="text-slate-500">{inst.dueDate}</span><span className="font-medium text-slate-900">{AFN(inst.amount)}</span>{!inst.paid && <button onClick={() => pay(plan.id, inst.id)} className="rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium text-white hover:bg-slate-800">پرداخت</button>}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><th className="px-4 py-3 font-semibold">#</th><th className="px-4 py-3 font-semibold">تاریخ</th><th className="px-4 py-3 font-semibold">عنوان</th><th className="px-4 py-3 font-semibold">مبلغ</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{[...txHistory].reverse().map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60"><td className="px-4 py-3 text-xs text-indigo-600">{tx.id}</td><td className="px-4 py-3 text-xs text-slate-600">{tx.date}</td><td className="px-4 py-3 text-xs text-slate-900">{tx.title}</td><td className={`px-4 py-3 text-xs font-semibold ${tx.debit > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{tx.debit > 0 ? '+' : '-'}{AFN(tx.debit || tx.credit)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
