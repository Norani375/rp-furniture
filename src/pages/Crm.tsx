import { useState, useMemo } from 'react';
import { Phone, Mail, Calendar, Plus } from 'lucide-react';
import { customers } from '../data/mockData';
import { dbLedger, AFN, persianDate } from '../db/database';
import RecordActions from '../components/RecordActions';
import { printMinimalDocument } from '../utils/printTemplates';
import { neonDelete } from '../db/neon';

export default function Crm() {
  const [tab, setTab] = useState<'customers' | 'interactions'>('customers');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(''); const [note, setNote] = useState('');
  const [customerList, setCustomerList] = useState(customers);

  const interactions = useMemo(() => dbLedger.getAll().filter((t) => t.title.includes('مشتری') || t.title.includes('CRM')), []);

  const addInteraction = () => {
    if (!name.trim()) return;
    dbLedger.add({ date: persianDate(), type: 'payment_in', status: 'confirmed', title: `تعامل با مشتری: ${name.trim()}`, description: note.trim() || '—', debit: 0, credit: 0, refType: 'crm', refId: name.trim(), createdBy: 'کاربر' });
    setShowForm(false); setName(''); setNote('');
  };

  const printCrm = () => printMinimalDocument({
    title: 'فاکتور / گزارش مشتریان',
    subtitle: 'CRM',
    party: 'واحد فروش',
    headers: ['نام مشتری', 'شرکت', 'ایمیل', 'تلفن', 'کل خرید', 'وضعیت'],
    rows: customerList.map((c) => [c.name, c.company, c.email, c.phone, AFN(c.totalSpent), c.status === 'active' ? 'فعال' : 'غیرفعال']),
    totals: [{ label: 'تعداد مشتریان', value: String(customerList.length) }],
  });

  const editCustomer = (id: string) => {
    const current = customerList.find((c) => c.id === id);
    if (!current) return;
    const next = prompt('نام مشتری را ویرایش کنید:', current.name);
    if (!next) return;
    setCustomerList((list) => list.map((c) => c.id === id ? { ...c, name: next } : c));
  };

  const deleteCustomer = async (id: string) => {
    if (!confirm('آیا از حذف مشتری مطمئن هستید؟')) return;
    await neonDelete('customers', id);
    setCustomerList((list) => list.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">CRM — مدیریت ارتباط با مشتریان</h2><p className="text-sm text-slate-500">{customerList.length} مشتری · {interactions.length} تعامل</p></div>
        <div className="flex gap-2"><button onClick={printCrm} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">پرینت</button><button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Plus size={16} /> تعامل جدید</button></div>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">ثبت تعامل جدید</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام مشتری" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="توضیحات تعامل" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="mt-3 flex gap-2"><button onClick={addInteraction} className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800">ثبت</button><button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">انصراف</button></div>
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setTab('customers')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'customers' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>مشتریان ({customerList.length})</button>
        <button onClick={() => setTab('interactions')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'interactions' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>تعاملات ({interactions.length})</button>
      </div>

      {tab === 'customers' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customerList.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-bold text-white">{c.name.charAt(0)}</div>
                  <div><h3 className="font-semibold text-slate-900">{c.name}</h3><p className="text-xs text-slate-500">{c.company}</p></div>
                </div>
                <div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{c.status === 'active' ? 'فعال' : 'غیرفعال'}</span><RecordActions compact onEdit={() => editCustomer(c.id)} onDelete={() => deleteCustomer(c.id)} onPrint={printCrm} /></div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-600"><div className="flex items-center gap-2"><Mail size={14} /> {c.email}</div><div className="flex items-center gap-2"><Phone size={14} /> {c.phone}</div><div className="flex items-center gap-2"><Calendar size={14} /> آخرین تماس: {c.lastContact}</div></div>
              <div className="mt-4 border-t border-slate-100 pt-3"><p className="text-xs text-slate-500">کل خرید</p><p className="text-sm font-bold text-slate-900">{AFN(c.totalSpent)}</p></div>
            </div>
          ))}
        </div>
      )}

      {tab === 'interactions' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><th className="px-4 py-3 font-semibold">#</th><th className="px-4 py-3 font-semibold">تاریخ</th><th className="px-4 py-3 font-semibold">عنوان</th><th className="px-4 py-3 font-semibold">توضیحات</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{[...interactions].reverse().map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60"><td className="px-4 py-3 text-xs text-indigo-600">{tx.id}</td><td className="px-4 py-3 text-xs text-slate-600">{tx.date}</td><td className="px-4 py-3 text-xs text-slate-900">{tx.title}</td><td className="px-4 py-3 text-xs text-slate-500">{tx.description}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
