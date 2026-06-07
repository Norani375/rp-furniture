import { useMemo, useState } from 'react';
import { Factory, Hammer, PlusCircle } from 'lucide-react';
import { AFN, dbProduction } from '../db/database';

export default function Manufacturing() {
  const [recipeId, setRecipeId] = useState('BOM-001');
  const [quantity, setQuantity] = useState('1');
  const [refresh, setRefresh] = useState(0);
  const recipes = dbProduction.getRecipes();
  const orders = dbProduction.getOrders();
  const selected = recipes.find((r) => r.id === recipeId) || recipes[0];
  const cost = useMemo(() => {
    if (!selected) return 0;
    return selected.materials.reduce((s, m) => s + m.quantity * m.unitCost, 0) + selected.laborCost + selected.overheadCost;
  }, [selected, refresh]);

  const complete = () => {
    const q = Number(quantity);
    if (!selected || q <= 0) return;
    dbProduction.completeOrder(selected.id, q);
    setRefresh((x) => x + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">تولید و مونتاژ</h2>
          <p className="text-sm text-slate-500">فرمول ساخت، مصرف مواد اولیه و ثبت تولید</p>
        </div>
        <div className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">BOM فعال: {recipes.length}</div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <div className="mb-4 flex items-center gap-2"><Factory size={18} className="text-indigo-600" /><h3 className="font-bold text-slate-900">ثبت تولید</h3></div>
          <label className="text-xs font-medium text-slate-600">محصول</label>
          <select value={recipeId} onChange={(e) => setRecipeId(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
            {recipes.map((r) => <option key={r.id} value={r.id}>{r.productName}</option>)}
          </select>
          <label className="mt-4 block text-xs font-medium text-slate-600">تعداد تولید</label>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">هزینه یک واحد</span><b>{AFN(cost)}</b></div>
            <div className="mt-1 flex justify-between"><span className="text-slate-500">هزینه کل</span><b>{AFN(cost * Number(quantity || 0))}</b></div>
          </div>
          <button onClick={complete} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            <PlusCircle size={16} /> ثبت تولید
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center gap-2"><Hammer size={18} className="text-indigo-600" /><h3 className="font-bold text-slate-900">مواد مورد نیاز</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead><tr className="border-b bg-slate-50 text-xs text-slate-500"><th className="px-3 py-2">ماده</th><th className="px-3 py-2">واحد</th><th className="px-3 py-2">مقدار</th><th className="px-3 py-2">قیمت</th><th className="px-3 py-2">کل</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {selected?.materials.map((m) => (
                  <tr key={m.itemId}><td className="px-3 py-2 font-medium">{m.name}</td><td className="px-3 py-2">{m.unit}</td><td className="px-3 py-2">{m.quantity}</td><td className="px-3 py-2">{AFN(m.unitCost)}</td><td className="px-3 py-2 font-bold text-indigo-700">{AFN(m.quantity * m.unitCost)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 font-bold text-slate-900">تاریخچه تولید</h3>
        <div className="space-y-2">
          {orders.length === 0 && <p className="text-sm text-slate-400">هنوز تولیدی ثبت نشده است.</p>}
          {orders.slice().reverse().map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
              <div><p className="text-sm font-medium text-slate-900">{o.productName}</p><p className="text-xs text-slate-500">{o.id} · {o.date}</p></div>
              <div className="text-left"><p className="text-sm font-bold text-slate-900">{AFN(o.totalCost)}</p><p className="text-xs text-emerald-600">{o.quantity} دانه تکمیل شد</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}