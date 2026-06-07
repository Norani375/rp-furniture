import { useState, useMemo } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Plus } from 'lucide-react';
import { products } from '../data/mockData';
import { dbLedger, AFN, persianDate } from '../db/database';
import RecordActions from '../components/RecordActions';

export default function InventoryPage() {
  const [tab, setTab] = useState<'products' | 'movements'>('products');
  const [showForm, setShowForm] = useState(false);
  const [prod, setProd] = useState(''); const [qty, setQty] = useState(''); const [dir, setDir] = useState<'in' | 'out'>('in');
  const [productList, setProductList] = useState(products);

  const txHistory = useMemo(() => dbLedger.getAll().filter((t) => t.type === 'inventory_in' || t.type === 'inventory_out'), []);

  const doMovement = () => {
    const q = Number(qty);
    if (!prod.trim() || q <= 0) return;
    dbLedger.add({ date: persianDate(), type: dir === 'in' ? 'inventory_in' : 'inventory_out', status: 'confirmed', title: `${dir === 'in' ? 'ورود' : 'خروج'} کالا: ${prod.trim()}`, description: `تعداد: ${q}`, debit: dir === 'in' ? q * 1000 : 0, credit: dir === 'out' ? q * 1000 : 0, refType: 'inventory', refId: '', createdBy: 'کاربر' });
    setShowForm(false); setProd(''); setQty('');
  };

  const editProduct = (id: string) => {
    const current = productList.find((p) => p.id === id);
    if (!current) return;
    const stock = prompt('موجودی جدید را وارد کنید:', String(current.stock));
    if (stock === null) return;
    setProductList((list) => list.map((p) => p.id === id ? { ...p, stock: Number(stock), status: Number(stock) <= 0 ? 'out_of_stock' : Number(stock) <= p.minStock ? 'low_stock' : 'in_stock' } : p));
  };

  const deleteProduct = (id: string) => {
    if (!confirm('آیا از حذف این کالا از لیست انبار مطمئن هستید؟')) return;
    setProductList((list) => list.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">انبارداری</h2><p className="text-sm text-slate-500">{txHistory.length} حرکت انبار ثبت شده</p></div>
        <div className="flex gap-2"><button onClick={() => window.print()} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">پرینت</button><button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Plus size={16} /> ثبت حرکت</button></div>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">ثبت حرکت انبار</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input value={prod} onChange={(e) => setProd(e.target.value)} placeholder="نام کالا" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="تعداد" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            <select value={dir} onChange={(e) => setDir(e.target.value as any)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"><option value="in">ورود به انبار</option><option value="out">خروج از انبار</option></select>
          </div>
          <div className="mt-3 flex gap-2"><button onClick={doMovement} className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800">ثبت</button><button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">انصراف</button></div>
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setTab('products')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'products' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>کالاها ({productList.length})</button>
        <button onClick={() => setTab('movements')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'movements' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>تاریخچه حرکات ({txHistory.length})</button>
      </div>

      {tab === 'products' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><th className="px-4 py-3 font-semibold">نام</th><th className="px-4 py-3 font-semibold">SKU</th><th className="px-4 py-3 font-semibold">دسته</th><th className="px-4 py-3 font-semibold">موجودی</th><th className="px-4 py-3 font-semibold">قیمت</th><th className="px-4 py-3 font-semibold">وضعیت</th><th className="px-4 py-3 font-semibold print:hidden">عملیات</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {productList.map((p) => {
                  const badge = p.status === 'in_stock' ? { text: 'موجود', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle } : p.status === 'low_stock' ? { text: 'کمبود', cls: 'bg-amber-100 text-amber-700', icon: AlertTriangle } : { text: 'ناموجود', cls: 'bg-red-100 text-red-700', icon: XCircle };
                  const Icon = badge.icon;
                  return (<tr key={p.id} className="hover:bg-slate-50/60"><td className="px-4 py-3 font-medium text-slate-900">{p.name}</td><td className="px-4 py-3 text-slate-600">{p.sku}</td><td className="px-4 py-3 text-slate-600">{p.category}</td><td className="px-4 py-3 font-semibold text-slate-900">{p.stock}</td><td className="px-4 py-3 text-slate-900">{(p.price / 1e6).toFixed(1)}M</td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${badge.cls}`}><Icon size={12} /> {badge.text}</span></td><td className="px-4 py-3 print:hidden"><RecordActions compact onEdit={() => editProduct(p.id)} onDelete={() => deleteProduct(p.id)} onPrint={() => window.print()} /></td></tr>);
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'movements' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><th className="px-4 py-3 font-semibold">#</th><th className="px-4 py-3 font-semibold">تاریخ</th><th className="px-4 py-3 font-semibold">نوع</th><th className="px-4 py-3 font-semibold">عنوان</th><th className="px-4 py-3 font-semibold">مبلغ</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {[...txHistory].reverse().map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-xs text-indigo-600">{tx.id}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{tx.date}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">{tx.type === 'inventory_in' ? 'ورود' : 'خروج'}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-900">{tx.title}</td>
                    <td className={`px-4 py-3 text-xs font-semibold ${tx.type === 'inventory_in' ? 'text-emerald-600' : 'text-red-600'}`}>{tx.type === 'inventory_in' ? '+' : '-'}{AFN(tx.debit || tx.credit)}</td>
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
