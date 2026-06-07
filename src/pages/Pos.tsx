import { useMemo, useState } from 'react';
import { Minus, Plus, Printer, ShoppingCart, Trash2 } from 'lucide-react';
import { AFN, dbLedger, persianDate } from '../db/database';
import { inventoryItems } from '../data/mockData';

type CartItem = { id: number; name: string; price: number; qty: number };

export default function Pos() {
  const popular = useMemo(() => inventoryItems.slice(0, 18), []);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState('مشتری حضوری');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const add = (item: typeof inventoryItems[number]) => {
    setCart((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) return prev.map((p) => p.id === item.id ? { ...p, qty: p.qty + 1 } : p);
      return [...prev, { id: item.id, name: item.name, price: item.unitPriceAFN, qty: 1 }];
    });
  };

  const changeQty = (id: number, diff: number) => setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: Math.max(1, i.qty + diff) } : i));
  const remove = (id: number) => setCart((prev) => prev.filter((i) => i.id !== id));

  const checkout = () => {
    if (cart.length === 0) return;
    dbLedger.add({ date: persianDate(), type: 'sale', status: 'confirmed', title: `فروش POS - ${customer}`, description: `${cart.length} قلم کالا`, debit: total, credit: 0, refType: 'pos', refId: `POS-${Date.now()}`, createdBy: 'فروشنده' });
    window.print();
    setCart([]);
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden"><h2 className="text-xl font-bold text-slate-900">فروش سریع POS</h2><p className="text-sm text-slate-500">برای فروش حضوری و چاپ رسید سریع</p></div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 print:hidden">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h3 className="mb-4 font-bold text-slate-900">اجناس پرفروش</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {popular.map((item) => <button key={item.id} onClick={() => add(item)} className="rounded-xl border border-slate-100 p-3 text-right hover:bg-indigo-50 hover:border-indigo-200"><p className="text-sm font-medium text-slate-900 line-clamp-2">{item.name}</p><p className="mt-2 text-xs font-bold text-indigo-700">{AFN(item.unitPriceAFN)}</p></button>)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2"><ShoppingCart size={18} className="text-indigo-600" /><h3 className="font-bold text-slate-900">سبد فروش</h3></div>
          <input value={customer} onChange={(e) => setCustomer(e.target.value)} className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          <div className="space-y-2">
            {cart.map((i) => <div key={i.id} className="rounded-xl border border-slate-100 p-3"><div className="flex justify-between gap-2"><p className="text-sm font-medium">{i.name}</p><button onClick={() => remove(i.id)} className="text-red-500"><Trash2 size={14} /></button></div><div className="mt-2 flex items-center justify-between"><div className="flex items-center gap-1"><button onClick={() => changeQty(i.id, -1)} className="rounded bg-slate-100 p-1"><Minus size={12}/></button><span className="w-6 text-center text-sm">{i.qty}</span><button onClick={() => changeQty(i.id, 1)} className="rounded bg-slate-100 p-1"><Plus size={12}/></button></div><b className="text-sm">{AFN(i.price * i.qty)}</b></div></div>)}
          </div>
          <div className="mt-4 border-t pt-4"><div className="flex justify-between text-lg font-bold"><span>جمع کل</span><span>{AFN(total)}</span></div><button onClick={checkout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"><Printer size={16} /> ثبت و چاپ</button></div>
        </div>
      </div>
      <div className="hidden print:block p-8" dir="rtl"><h1 className="text-2xl font-bold">رسید فروش</h1><p className="mt-1 text-sm">فروشگاه فرنیچر و یراق</p><p className="mt-4">مشتری: {customer}</p><table className="mt-4 w-full border-collapse border"><thead><tr><th className="border p-2">کالا</th><th className="border p-2">تعداد</th><th className="border p-2">مبلغ</th></tr></thead><tbody>{cart.map((i) => <tr key={i.id}><td className="border p-2">{i.name}</td><td className="border p-2 text-center">{i.qty}</td><td className="border p-2 text-left">{AFN(i.price * i.qty)}</td></tr>)}</tbody></table><div className="mt-4 text-left text-xl font-bold">جمع: {AFN(total)}</div></div>
    </div>
  );
}