import { useState, useMemo } from 'react';
import { CheckCircle, Plus } from 'lucide-react';
import { suppliers } from '../data/mockData';
import { dbLedger, AFN, persianDate } from '../db/database';
import RecordActions from '../components/RecordActions';
import { printMinimalDocument } from '../utils/printTemplates';

export default function Purchases() {
  const [tab, setTab] = useState<'suppliers' | 'history'>('suppliers');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(''); const [amount, setAmount] = useState('');
  const [supplierList, setSupplierList] = useState(suppliers);

  const txHistory = useMemo(() => dbLedger.getAll().filter((t) => t.type === 'purchase'), []);

  const doPurchase = () => {
    const amt = Number(amount);
    if (!name.trim() || amt <= 0) return;
    dbLedger.add({ date: persianDate(), type: 'purchase', status: 'confirmed', title: `خرید از ${name.trim()}`, description: `مبلغ ${AFN(amt)}`, debit: 0, credit: amt, refType: 'supplier', refId: name.trim(), createdBy: 'کاربر' });
    setShowForm(false); setName(''); setAmount('');
  };

  const printPurchases = () => printMinimalDocument({
    title: 'فاکتور خرید و تامین‌کنندگان',
    subtitle: 'مدیریت خرید',
    party: 'واحد خرید',
    headers: ['تامین‌کننده', 'دسته', 'امتیاز', 'سفارشات', 'وضعیت'],
    rows: supplierList.map((s) => [s.name, s.category, s.rating, s.totalOrders, 'فعال']),
    totals: [{ label: 'تعداد تامین‌کنندگان', value: String(supplierList.length) }],
  });

  const editSupplier = (id: string) => {
    const current = supplierList.find((s) => s.id === id);
    if (!current) return;
    const next = prompt('نام تامین‌کننده را ویرایش کنید:', current.name);
    if (!next) return;
    setSupplierList((list) => list.map((s) => s.id === id ? { ...s, name: next } : s));
  };

  const deleteSupplier = (id: string) => {
    if (!confirm('آیا از حذف تامین‌کننده مطمئن هستید؟')) return;
    setSupplierList((list) => list.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">مدیریت خرید</h2><p className="text-sm text-slate-500">{txHistory.length} خرید ثبت شده</p></div>
        <div className="flex gap-2"><button onClick={printPurchases} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">پرینت</button><button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Plus size={16} /> خرید جدید</button></div>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">ثبت خرید جدید</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام تامین‌کننده" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مبلغ (AFN)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="mt-3 flex gap-2"><button onClick={doPurchase} className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800">ثبت</button><button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">انصراف</button></div>
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setTab('suppliers')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'suppliers' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>تامین‌کنندگان ({supplierList.length})</button>
        <button onClick={() => setTab('history')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'history' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>تاریخچه خرید ({txHistory.length})</button>
      </div>

      {tab === 'suppliers' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><th className="px-4 py-3 font-semibold">تامین‌کننده</th><th className="px-4 py-3 font-semibold">دسته</th><th className="px-4 py-3 font-semibold">امتیاز</th><th className="px-4 py-3 font-semibold">سفارشات</th><th className="px-4 py-3 font-semibold">وضعیت</th><th className="px-4 py-3 font-semibold print:hidden">عملیات</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {supplierList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3"><p className="font-medium text-slate-900">{s.name}</p><p className="text-xs text-slate-500">{s.email}</p></td>
                    <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">{s.category}</span></td>
                    <td className="px-4 py-3"><div className="flex text-yellow-400">{Array.from({ length: 5 }).map((_, i) => <span key={i}>{i < Math.floor(s.rating) ? '★' : '☆'}</span>)}</div></td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{s.totalOrders}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"><CheckCircle size={12} /> فعال</span></td>
                    <td className="px-4 py-3 print:hidden"><RecordActions compact onEdit={() => editSupplier(s.id)} onDelete={() => deleteSupplier(s.id)} onPrint={printPurchases} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><th className="px-4 py-3 font-semibold">#</th><th className="px-4 py-3 font-semibold">تاریخ</th><th className="px-4 py-3 font-semibold">عنوان</th><th className="px-4 py-3 font-semibold">مبلغ</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {[...txHistory].reverse().map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-xs text-indigo-600">{tx.id}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{tx.date}</td>
                    <td className="px-4 py-3 text-xs text-slate-900">{tx.title}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-red-600">-{AFN(tx.credit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
