import { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { dbInventory, dbLedger, AFN, persianDate } from '../db/database';
import { InventoryItem, ItemUnit } from '../types';
import RecordActions from '../components/RecordActions';
import { printMinimalDocument } from '../utils/printTemplates';

export default function Catalog() {
  const [items, setItems] = useState<InventoryItem[]>(dbInventory.getAll());
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<ItemUnit>('دانه');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    return items.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()));
  }, [items, search]);

  const totalValue = filtered.reduce((s, i) => s + i.quantity * i.unitPriceAFN, 0);

  const printCatalog = () => printMinimalDocument({
    title: 'فاکتور موجودی اجناس',
    subtitle: 'کاتالوگ کالا',
    party: 'انبار مرکزی',
    headers: ['#', 'نام کالا', 'واحد', 'تعداد', 'قیمت واحد', 'قیمت کل'],
    rows: filtered.map((item) => [item.id, item.name, item.unit, item.quantity, AFN(item.unitPriceAFN), AFN(item.unitPriceAFN * item.quantity)]),
    totals: [{ label: 'جمع کل موجودی', value: AFN(totalValue) }],
  });

  const resetForm = () => { setName(''); setUnit('دانه'); setQty(''); setPrice(''); setEditing(null); };

  const openNew = () => { resetForm(); setShowForm(true); };

  const openEdit = (item: InventoryItem) => {
    setEditing(item); setName(item.name); setUnit(item.unit);
    setQty(String(item.quantity)); setPrice(String(item.unitPriceAFN)); setShowForm(true);
  };

  const save = () => {
    const q = Number(qty); const p = Number(price);
    if (!name.trim() || q <= 0 || p <= 0) return;
    if (editing) {
      dbInventory.update(editing.id, { name: name.trim(), unit, quantity: q, unitPriceAFN: p });
    } else {
      dbInventory.add({ id: 0, name: name.trim(), unit, quantity: q, unitPriceAFN: p });
      dbLedger.add({ date: persianDate(), type: 'inventory_in', status: 'confirmed', title: `ورود کالا: ${name.trim()}`, description: `${q} ${unit} — ${AFN(p * q)}`, debit: p * q, credit: 0, refType: 'inventory', refId: '', createdBy: 'کاربر' });
    }
    setItems(dbInventory.getAll()); setShowForm(false); resetForm();
  };

  const remove = (id: number) => {
    if (!confirm('آیا از حذف این کالا مطمئن هستید؟')) return;
    const item = items.find((i) => i.id === id);
    dbInventory.remove(id);
    if (item) {
      dbLedger.add({ date: persianDate(), type: 'inventory_out', status: 'confirmed', title: `حذف کالا: ${item.name}`, description: `${item.quantity} ${item.unit}`, debit: 0, credit: item.unitPriceAFN * item.quantity, refType: 'inventory', refId: String(id), createdBy: 'کاربر' });
    }
    setItems(dbInventory.getAll());
  };

  const units: ItemUnit[] = ['دانه','کارتن','قوطی','سیت','پاکت','لوله','عدد','متر','سانت','لیتر'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">کاتالوگ اجناس</h2><p className="text-sm text-slate-500">{items.length} قلم کالا</p></div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی کالا..." className="w-56 rounded-xl border border-slate-300 bg-white py-2 pr-9 pl-3 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <button onClick={openNew} className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Plus size={16} /> جدید</button>
          <button onClick={printCatalog} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">پرینت</button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">{editing ? 'ویرایش کالا' : 'کالای جدید'}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام کالا" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            <select value={unit} onChange={(e) => setUnit(e.target.value as ItemUnit)} className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">{units.map((u) => <option key={u} value={u}>{u}</option>)}</select>
            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="تعداد" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="قیمت واحد (AFN)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={save} className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800">ذخیره</button>
            <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">انصراف</button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
              <th className="px-4 py-3 font-semibold">#</th><th className="px-4 py-3 font-semibold">نام کالا</th><th className="px-4 py-3 font-semibold">واحد</th>
              <th className="px-4 py-3 font-semibold">تعداد</th><th className="px-4 py-3 font-semibold">قیمت واحد</th><th className="px-4 py-3 font-semibold">قیمت کل</th>
              <th className="px-4 py-3 font-semibold">عملیات</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-500">{item.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-3 text-slate-600">{item.unit}</td>
                  <td className="px-4 py-3 text-slate-900">{item.quantity}</td>
                  <td className="px-4 py-3 text-slate-800">{AFN(item.unitPriceAFN)}</td>
                  <td className="px-4 py-3 font-semibold text-indigo-700">{AFN(item.unitPriceAFN * item.quantity)}</td>
                  <td className="px-4 py-3"><RecordActions compact onEdit={() => openEdit(item)} onDelete={() => remove(item.id)} onPrint={printCatalog} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="border-t-2 border-slate-200 bg-slate-50">
              <td colSpan={4} className="px-4 py-3 text-xs font-bold text-slate-700">{filtered.length} قلم</td>
              <td colSpan={3} className="px-4 py-3 text-left text-sm font-bold text-slate-900">جمع کل: {AFN(totalValue)}</td>
            </tr></tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
