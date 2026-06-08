import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Cloud, CloudOff, RefreshCw, Loader2 } from 'lucide-react';
import { dbLedger, AFN, persianDate } from '../db/database';
import { neonLedger, testConnection } from '../db/neon';
import { Transaction } from '../types';
import RecordActions from '../components/RecordActions';
import { printMinimalDocument } from '../utils/printTemplates';

export default function Accounting() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<'sale' | 'expense' | 'payment_in' | 'payment_out'>('sale');
  const [amount, setAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [ledger, setLedger] = useState<Transaction[]>([]);
  const [dataSource, setDataSource] = useState<'neon' | 'local'>('local');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    // 1. فوراً از localStorage بخوان (بدون انتظار)
    setLedger(dbLedger.getAll());
    setDataSource('local');
    setLoading(false);

    // 2. در پس‌زمینه Backend را چک کن (بدون بلاک کردن UI)
    try {
      const conn = await testConnection();
      if (conn.ok) {
        const data = await neonLedger.getAll();
        if (data.length > 0) {
          setLedger(data);
          setDataSource('neon');
          localStorage.setItem('erp_ledger_cache', JSON.stringify(data));
        }
      }
    } catch {}
  };

  useEffect(() => { loadData(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return ledger;
    return ledger.filter((t) =>
      t.title?.includes(search) || t.id?.includes(search) || t.description?.includes(search)
    );
  }, [ledger, search]);

  const stats = useMemo(() => {
    const totalDebit = ledger.reduce((s, t) => s + t.debit, 0);
    const totalCredit = ledger.reduce((s, t) => s + t.credit, 0);
    return { totalDebit, totalCredit, netBalance: totalDebit - totalCredit };
  }, [ledger]);

  const printAccounting = () => printMinimalDocument({
    title: 'فاکتور / صورت‌حساب حسابداری',
    subtitle: 'دفتر کل',
    party: 'حسابداری',
    headers: ['شماره', 'تاریخ', 'نوع', 'عنوان', 'واریزی', 'برداشت', 'مانده'],
    rows: filtered.map((tx) => [tx.id, tx.date, tx.type, tx.title, tx.debit ? AFN(tx.debit) : '—', tx.credit ? AFN(tx.credit) : '—', AFN(tx.balance)]),
    totals: [
      { label: 'واریزی کل', value: AFN(stats.totalDebit) },
      { label: 'برداشت کل', value: AFN(stats.totalCredit) },
      { label: 'مانده خالص', value: AFN(stats.netBalance) },
    ],
  });

  const saveTx = async () => {
    if (!title.trim() || !amount) return;
    const amt = Number(amount);
    if (amt <= 0) return;
    const isDebit = type === 'sale' || type === 'payment_in';

    if (editingId) {
      const updated = dbLedger.update(editingId, {
        title: title.trim(),
        description: desc.trim() || '—',
        type,
        debit: isDebit ? amt : 0,
        credit: isDebit ? 0 : amt,
      });
      await neonLedger.update(editingId, {
        title: title.trim(),
        description: desc.trim() || '—',
        type,
        debit: isDebit ? amt : 0,
        credit: isDebit ? 0 : amt,
      });
      setLedger(updated);
      setEditingId(null);
      setShowForm(false);
      setTitle('');
      setDesc('');
      setAmount('');
      return;
    }

    const newId = `TRX-${String(Date.now()).slice(-5)}`;

    const newTx: Transaction = {
      id: newId,
      date: persianDate(),
      type,
      status: 'confirmed',
      title: title.trim(),
      description: desc.trim() || '—',
      debit: isDebit ? amt : 0,
      credit: isDebit ? 0 : amt,
      balance: stats.netBalance + (isDebit ? amt : -amt),
      refType: 'manual',
      refId: '',
      createdBy: 'کاربر',
      createdAt: '',
      updatedAt: '',
    };

    // ذخیره در Neon اگر متصل باشد
    if (dataSource === 'neon') {
      try { await neonLedger.add(newTx); } catch {}
    }
    // همیشه localStorage
    dbLedger.add({ date: newTx.date, type, status: 'confirmed', title: newTx.title, description: newTx.description, debit: newTx.debit, credit: newTx.credit, refType: 'manual', refId: '', createdBy: 'کاربر' });

    setShowForm(false); setTitle(''); setDesc(''); setAmount('');
    await loadData();
  };

  const editTx = (tx: Transaction) => {
    setEditingId(tx.id);
    setTitle(tx.title);
    setDesc(tx.description || '');
    setType(tx.type as 'sale' | 'expense' | 'payment_in' | 'payment_out');
    setAmount(String(tx.debit || tx.credit));
    setShowForm(true);
  };

  const deleteTx = async (id: string) => {
    if (!confirm('آیا از حذف این تراکنش مطمئن هستید؟')) return;
    const updated = dbLedger.remove(id);
    await neonLedger.remove(id);
    setLedger(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">حسابداری یکپارچه</h2>
          <p className="text-sm text-slate-500">{ledger.length} تراکنش ثبت شده</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${dataSource === 'neon' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {dataSource === 'neon' ? <Cloud size={12} /> : <CloudOff size={12} />}
            {dataSource === 'neon' ? 'Backend/Neon' : 'محلی'}
          </span>
          <button onClick={loadData} className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50" title="بارگذاری مجدد">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
          <button onClick={printAccounting} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">پرینت</button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus size={16} /> تراکنش جدید
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">کل تراکنش‌ها</p><p className="mt-1 text-2xl font-bold text-slate-900">{ledger.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">واریزی کل</p><p className="mt-1 text-2xl font-bold text-emerald-700">{AFN(stats.totalDebit)}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">برداشت کل</p><p className="mt-1 text-2xl font-bold text-red-700">{AFN(stats.totalCredit)}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">مانده خالص</p><p className={`mt-1 text-2xl font-bold ${stats.netBalance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{AFN(stats.netBalance)}</p></div>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">{editingId ? 'ویرایش تراکنش' : 'ثبت تراکنش جدید'}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان تراکنش" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="توضیحات" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
              <option value="sale">فروش (دریافت)</option>
              <option value="expense">هزینه (پرداخت)</option>
              <option value="payment_in">دریافت دیگر</option>
              <option value="payment_out">پرداخت دیگر</option>
            </select>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="مبلغ (AFN)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={saveTx} className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800">{editingId ? 'ذخیره تغییرات' : `ثبت در ${dataSource === 'neon' ? 'Backend/Neon' : 'محلی'}`}</button>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="rounded-xl border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">انصراف</button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 p-4">
          <Search className="text-slate-400" size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو در تراکنش‌ها..." className="flex-1 text-sm focus:outline-none" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <th className="px-4 py-3 font-semibold">شماره</th><th className="px-4 py-3 font-semibold">تاریخ</th><th className="px-4 py-3 font-semibold">نوع</th>
              <th className="px-4 py-3 font-semibold">عنوان</th><th className="px-4 py-3 font-semibold">واریزی</th><th className="px-4 py-3 font-semibold">برداشت</th>
              <th className="px-4 py-3 font-semibold">مانده</th><th className="px-4 py-3 font-semibold">وضعیت</th><th className="px-4 py-3 font-semibold print:hidden">عملیات</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && !loading && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">هیچ تراکنشی یافت نشد</td></tr>
              )}
              {[...filtered].reverse().map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-indigo-700">{tx.id}</td>
                  <td className="px-4 py-3 text-slate-600">{tx.date}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{tx.type}</span></td>
                  <td className="px-4 py-3 text-slate-900">{tx.title}<span className="block text-[10px] text-slate-400">{tx.description}</span></td>
                  <td className="px-4 py-3 font-semibold text-emerald-600">{tx.debit > 0 ? AFN(tx.debit) : '—'}</td>
                  <td className="px-4 py-3 font-semibold text-red-600">{tx.credit > 0 ? AFN(tx.credit) : '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{AFN(tx.balance)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tx.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : tx.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{tx.status === 'confirmed' ? 'تایید' : tx.status === 'pending' ? 'در انتظار' : 'لغو'}</span></td>
                  <td className="px-4 py-3 print:hidden"><RecordActions compact onEdit={() => editTx(tx)} onDelete={() => deleteTx(tx.id)} onPrint={printAccounting} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
