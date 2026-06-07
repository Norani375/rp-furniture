import { useState, useMemo } from 'react';
import { CheckCircle, Clock, Plus } from 'lucide-react';
import { taxRecords } from '../data/mockData';
import { dbLedger, AFN, persianDate } from '../db/database';
import RecordActions from '../components/RecordActions';
import { printMinimalDocument } from '../utils/printTemplates';

export default function Tax() {
  const [tab, setTab] = useState<'records' | 'history'>('records');
  const [showForm, setShowForm] = useState(false);
  const [taxType, setTaxType] = useState(''); const [taxAmt, setTaxAmt] = useState('');
  const [taxList, setTaxList] = useState(taxRecords);

  const txHistory = useMemo(() => dbLedger.getAll().filter((t) => t.type === 'tax'), []);

  const doTax = () => {
    const a = Number(taxAmt);
    if (!taxType.trim() || a <= 0) return;
    dbLedger.add({ date: persianDate(), type: 'tax', status: 'confirmed', title: `مالیات: ${taxType.trim()}`, description: `مبلغ ${AFN(a)}`, debit: 0, credit: a, refType: 'tax', refId: taxType.trim(), createdBy: 'کاربر' });
    setShowForm(false); setTaxType(''); setTaxAmt('');
  };

  const printTax = () => printMinimalDocument({
    title: 'فاکتور / گزارش مالیات',
    subtitle: 'سوابق مالیاتی',
    party: 'حسابداری',
    headers: ['نوع', 'دوره', 'مبلغ', 'مهلت', 'وضعیت'],
    rows: taxList.map((t) => [t.type, t.period, AFN(t.amount), t.dueDate, t.status === 'paid' ? 'پرداخت شده' : t.status === 'filed' ? 'فایل شده' : 'در انتظار']),
    totals: [{ label: 'جمع مالیات', value: AFN(taxList.reduce((s, t) => s + t.amount, 0)) }],
  });

  const editTax = (id: string) => {
    const current = taxList.find((t) => t.id === id);
    if (!current) return;
    const next = prompt('مبلغ مالیات جدید را وارد کنید:', String(current.amount));
    if (next === null) return;
    setTaxList((list) => list.map((t) => t.id === id ? { ...t, amount: Number(next) } : t));
  };

  const deleteTax = (id: string) => {
    if (!confirm('آیا از حذف رکورد مالیات مطمئن هستید؟')) return;
    setTaxList((list) => list.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">مدیریت مالیات</h2><p className="text-sm text-slate-500">{txHistory.length} پرداخت مالیات ثبت شده</p></div>
        <div className="flex gap-2"><button onClick={printTax} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">پرینت</button><button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Plus size={16} /> ثبت مالیات</button></div>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">ثبت پرداخت مالیات</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input value={taxType} onChange={(e) => setTaxType(e.target.value)} placeholder="نوع مالیات" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            <input type="number" value={taxAmt} onChange={(e) => setTaxAmt(e.target.value)} placeholder="مبلغ (AFN)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="mt-3 flex gap-2"><button onClick={doTax} className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800">ثبت</button><button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">انصراف</button></div>
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setTab('records')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'records' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>سوابق ({taxList.length})</button>
        <button onClick={() => setTab('history')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'history' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>تاریخچه ({txHistory.length})</button>
      </div>

      {tab === 'records' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><th className="px-4 py-3 font-semibold">نوع</th><th className="px-4 py-3 font-semibold">دوره</th><th className="px-4 py-3 font-semibold">مبلغ</th><th className="px-4 py-3 font-semibold">مهلت</th><th className="px-4 py-3 font-semibold">وضعیت</th><th className="px-4 py-3 font-semibold print:hidden">عملیات</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{taxList.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60"><td className="px-4 py-3 font-medium text-slate-900">{t.type}</td><td className="px-4 py-3 text-slate-600">{t.period}</td><td className="px-4 py-3 font-semibold text-slate-900">{AFN(t.amount)}</td><td className="px-4 py-3 text-slate-600">{t.dueDate}</td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${t.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : t.status === 'filed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{t.status === 'paid' ? <CheckCircle size={12} /> : <Clock size={12} />} {t.status === 'paid' ? 'پرداخت شده' : t.status === 'filed' ? 'فایل شده' : 'در انتظار'}</span></td><td className="px-4 py-3 print:hidden"><RecordActions compact onEdit={() => editTax(t.id)} onDelete={() => deleteTax(t.id)} onPrint={printTax} /></td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><th className="px-4 py-3 font-semibold">#</th><th className="px-4 py-3 font-semibold">تاریخ</th><th className="px-4 py-3 font-semibold">عنوان</th><th className="px-4 py-3 font-semibold">مبلغ</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{[...txHistory].reverse().map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60"><td className="px-4 py-3 text-xs text-indigo-600">{tx.id}</td><td className="px-4 py-3 text-xs text-slate-600">{tx.date}</td><td className="px-4 py-3 text-xs text-slate-900">{tx.title}</td><td className="px-4 py-3 text-xs font-semibold text-red-600">-{AFN(tx.credit)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
