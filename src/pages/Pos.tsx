import { useMemo, useState } from 'react';
import { Minus, Plus, Printer, ShoppingCart, Trash2, Search, AlertTriangle } from 'lucide-react';
import { AFN, dbLedger, dbInventory, persianDate } from '../db/database';
import { printMinimalDocument } from '../utils/printTemplates';
import { InventoryItem } from '../types';

type CartItem = { id: number; name: string; unit: string; price: number; qty: number; stock: number };

export default function Pos() {
  const [items, setItems] = useState<InventoryItem[]>(dbInventory.getAll());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState('مشتری حضوری');
  const [search, setSearch] = useState('');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter((i) => i.name.includes(search));
  }, [items, search]);

  const add = (item: InventoryItem) => {
    setCart((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        if (found.qty >= item.quantity) return prev; // بیشتر از موجودی نفروشد
        return prev.map((p) => p.id === item.id ? { ...p, qty: p.qty + 1 } : p);
      }
      if (item.quantity <= 0) return prev; // کالای ناموجود
      return [...prev, { id: item.id, name: item.name, unit: item.unit, price: item.unitPriceAFN, qty: 1, stock: item.quantity }];
    });
  };

  const changeQty = (id: number, diff: number) => {
    setCart((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      const newQty = i.qty + diff;
      if (newQty < 1) return i;
      if (newQty > i.stock) return i; // بیشتر از موجودی نشود
      return { ...i, qty: newQty };
    }));
  };

  const remove = (id: number) => setCart((prev) => prev.filter((i) => i.id !== id));

  const checkout = () => {
    if (cart.length === 0) return;

    // ۱. کسر از انبار
    cart.forEach((cartItem) => {
      const current = dbInventory.getAll().find((i) => i.id === cartItem.id);
      if (current) {
        dbInventory.update(cartItem.id, {
          quantity: Math.max(0, current.quantity - cartItem.qty),
        });
      }

      // ۲. ثبت تراکنش خروج کالا
      dbLedger.add({
        date: persianDate(),
        type: 'inventory_out',
        status: 'confirmed',
        title: `فروش ${cartItem.name}`,
        description: `${cartItem.qty} ${cartItem.unit} به ${customer}`,
        debit: 0,
        credit: cartItem.price * cartItem.qty,
        refType: 'pos',
        refId: String(cartItem.id),
        createdBy: 'فروشنده',
      });
    });

    // ۳. ثبت تراکنش فروش (دریافت پول)
    dbLedger.add({
      date: persianDate(),
      type: 'sale',
      status: 'confirmed',
      title: `فروش POS — ${customer}`,
      description: cart.map((i) => `${i.name} × ${i.qty}`).join(' | '),
      debit: total,
      credit: 0,
      refType: 'pos',
      refId: `POS-${Date.now()}`,
      createdBy: 'فروشنده',
    });

    // ۴. چاپ فاکتور
    printMinimalDocument({
      title: 'فاکتور فروش',
      subtitle: 'فروش مواد و اجناس',
      party: customer,
      headers: ['#', 'کالا', 'واحد', 'تعداد', 'قیمت واحد', 'قیمت کل'],
      rows: cart.map((i, idx) => [idx + 1, i.name, i.unit, i.qty, AFN(i.price), AFN(i.price * i.qty)]),
      totals: [
        { label: 'تعداد اقلام', value: `${cart.length} قلم` },
        { label: 'جمع کل', value: AFN(total) },
      ],
      note: 'کالای فروخته شده تا ۲۴ ساعت قابل مرجوعی است. از خرید شما سپاسگزاریم.',
    });

    setCart([]);
    setItems(dbInventory.getAll()); // بروزرسانی لیست
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h2 className="text-xl font-bold text-slate-900">فروش سریع (POS)</h2>
        <p className="text-sm text-slate-500">فروش مواد اولیه و محصولات — موجودی لحظه‌ای</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 print:hidden">
        {/* لیست کالا */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <h3 className="font-bold text-slate-900">انتخاب کالا</h3>
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی کالا..." className="w-full rounded-xl border border-slate-300 py-2 pr-9 pl-3 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 max-h-[60vh] overflow-y-auto">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => add(item)}
                disabled={item.quantity <= 0}
                className={`rounded-xl border p-3 text-right transition-colors ${
                  item.quantity <= 0
                    ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed'
                    : item.quantity <= 2
                    ? 'border-amber-200 hover:bg-amber-50'
                    : 'border-slate-100 hover:bg-indigo-50 hover:border-indigo-200'
                }`}
              >
                <p className="text-sm font-medium text-slate-900 line-clamp-2">{item.name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700">{AFN(item.unitPriceAFN)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    item.quantity <= 0 ? 'bg-red-100 text-red-700' : item.quantity <= 2 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {item.quantity} {item.unit}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* سبد فروش */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingCart size={18} className="text-indigo-600" />
            <h3 className="font-bold text-slate-900">سبد فروش</h3>
            <span className="mr-auto rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">{cart.length}</span>
          </div>

          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="نام مشتری"
            className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />

          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            {cart.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">سبد خالی است</p>
            )}
            {cart.map((i) => (
              <div key={i.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex justify-between gap-2">
                  <p className="text-sm font-medium">{i.name}</p>
                  <button onClick={() => remove(i.id)} className="text-red-500"><Trash2 size={14} /></button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button onClick={() => changeQty(i.id, -1)} className="rounded bg-slate-100 p-1"><Minus size={12} /></button>
                    <span className="w-8 text-center text-sm font-bold">{i.qty}</span>
                    <button onClick={() => changeQty(i.id, 1)} className="rounded bg-slate-100 p-1"><Plus size={12} /></button>
                    <span className="mr-2 text-[10px] text-slate-400">از {i.stock}</span>
                  </div>
                  <b className="text-sm">{AFN(i.price * i.qty)}</b>
                </div>
                {i.qty >= i.stock && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600">
                    <AlertTriangle size={10} /> حداکثر موجودی
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>جمع کل</span>
              <span>{AFN(total)}</span>
            </div>
            <button
              onClick={checkout}
              disabled={cart.length === 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer size={16} />
              ثبت فروش و چاپ فاکتور
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
