import { useState } from 'react';
import { Banknote, Plus, Receipt } from 'lucide-react';
import { AFN, dbBanking } from '../db/database';
import { ChequeRecord } from '../types';

export default function Banking() {
  const [, setRefresh] = useState(0);
  const [show, setShow] = useState(false);
  const [chequeNo, setChequeNo] = useState('');
  const [partyName, setPartyName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'received' | 'issued'>('received');
  const accounts = dbBanking.getAccounts();
  const cheques = dbBanking.getCheques();

  const addCheque = () => {
    const value = Number(amount);
    if (!chequeNo.trim() || !partyName.trim() || value <= 0) return;
    const record: ChequeRecord = { id: `CHQ-${Date.now().toString().slice(-6)}`, chequeNo, partyName, amount: value, dueDate: new Date().toISOString().slice(0, 10), type, status: 'pending' };
    dbBanking.addCheque(record);
    setShow(false); setChequeNo(''); setPartyName(''); setAmount(''); setRefresh((x) => x + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">چک و بانک</h2><p className="text-sm text-slate-500">مدیریت صندوق، حساب بانکی و چک‌ها</p></div>
        <button onClick={() => setShow(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Plus size={16} /> ثبت چک</button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {accounts.map((a) => (
          <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3"><div className="rounded-xl bg-emerald-100 p-3 text-emerald-700"><Banknote size={22} /></div><div><p className="font-bold text-slate-900">{a.name}</p><p className="text-xs text-slate-500">{a.bankName} · {a.accountNo}</p></div></div>
            <p className="mt-4 text-2xl font-bold text-slate-900">{AFN(a.balance)}</p>
          </div>
        ))}
      </div>

      {show && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 font-bold text-slate-900">ثبت چک جدید</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input value={chequeNo} onChange={(e) => setChequeNo(e.target.value)} placeholder="شماره چک" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            <input value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="طرف حساب" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مبلغ" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            <select value={type} onChange={(e) => setType(e.target.value as 'received' | 'issued')} className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"><option value="received">دریافتی</option><option value="issued">پرداختی</option></select>
          </div>
          <div className="mt-3 flex gap-2"><button onClick={addCheque} className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800">ذخیره</button><button onClick={() => setShow(false)} className="rounded-xl border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">انصراف</button></div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b p-4"><Receipt size={18} className="text-indigo-600" /><h3 className="font-bold text-slate-900">لیست چک‌ها</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead><tr className="border-b bg-slate-50 text-xs text-slate-500"><th className="px-4 py-3">شماره</th><th className="px-4 py-3">طرف حساب</th><th className="px-4 py-3">نوع</th><th className="px-4 py-3">مبلغ</th><th className="px-4 py-3">سررسید</th><th className="px-4 py-3">وضعیت</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {cheques.map((c) => <tr key={c.id}><td className="px-4 py-3 font-medium text-indigo-700">{c.chequeNo}</td><td className="px-4 py-3">{c.partyName}</td><td className="px-4 py-3">{c.type === 'received' ? 'دریافتی' : 'پرداختی'}</td><td className={`px-4 py-3 font-bold ${c.type === 'received' ? 'text-emerald-600' : 'text-red-600'}`}>{AFN(c.amount)}</td><td className="px-4 py-3 text-slate-500">{c.dueDate}</td><td className="px-4 py-3"><span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">در انتظار</span></td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}