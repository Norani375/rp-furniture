import { useState, useMemo } from 'react';
import { Mail, Phone, FileText, Search } from 'lucide-react';
import { customers, invoices } from '../data/mockData';
import { dbLedger, AFN, persianDate } from '../db/database';
import InvoicePrint from '../components/InvoicePrint';
import { Invoice } from '../types';
import RecordActions from '../components/RecordActions';

export default function Sales() {
  const [tab, setTab] = useState<'customers' | 'invoices' | 'history'>('customers');
  const [search, setSearch] = useState('');
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [invoiceList, setInvoiceList] = useState(invoices);

  const handlePrint = (inv: Invoice) => {
    setPrintInvoice(inv);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const txHistory = useMemo(() => dbLedger.getAll().filter((t) => t.type === 'sale'), []);

  const doSale = (customerName: string, amount: number) => {
    dbLedger.add({ date: persianDate(), type: 'sale', status: 'confirmed', title: `فروش به ${customerName}`, description: `مبلغ ${AFN(amount)}`, debit: amount, credit: 0, refType: 'customer', refId: customerName, createdBy: 'کاربر' });
  };

  const c = customers.length; const invF = invoiceList.filter((i) => search ? i.customerName.includes(search) || i.id.includes(search) : true);

  const editInvoice = (inv: Invoice) => {
    const next = prompt('مبلغ فاکتور را ویرایش کنید:', String(inv.amount));
    if (next === null) return;
    setInvoiceList((list) => list.map((i) => i.id === inv.id ? { ...i, amount: Number(next) } : i));
  };

  const deleteInvoice = (id: string) => {
    if (!confirm('آیا از حذف فاکتور مطمئن هستید؟')) return;
    setInvoiceList((list) => list.filter((i) => i.id !== id));
  };

  return (
    <>
    <div className="space-y-6 print:hidden">
      <div><h2 className="text-xl font-bold text-slate-900">مدیریت فروش</h2><p className="text-sm text-slate-500">{txHistory.length} تراکنش فروش ثبت شده</p></div>

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setTab('customers')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'customers' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>مشتریان ({c})</button>
        <button onClick={() => setTab('invoices')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'invoices' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>فاکتورها ({invoiceList.length})</button>
        <button onClick={() => setTab('history')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'history' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>تاریخچه فروش ({txHistory.length})</button>
      </div>

      {tab === 'customers' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">{c.name.charAt(0)}</div>
                  <div><h3 className="font-semibold text-slate-900">{c.name}</h3><p className="text-xs text-slate-500">{c.company}</p></div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{c.status === 'active' ? 'فعال' : 'غیرفعال'}</span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-slate-600"><div className="flex items-center gap-2"><Mail size={12} /> {c.email}</div><div className="flex items-center gap-2"><Phone size={12} /> {c.phone}</div></div>
              <div className="mt-3 border-t border-slate-100 pt-3 flex items-center justify-between">
                <div><p className="text-xs text-slate-500">کل خرید</p><p className="text-sm font-bold text-slate-900">{AFN(c.totalSpent)}</p></div>
                <button onClick={() => doSale(c.name, 100000)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-800">ثبت فروش</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'invoices' && (
        <div className="space-y-3 print:hidden">
          <div className="relative w-64"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی فاکتور..." className="w-full rounded-xl border border-slate-300 py-2 pr-9 pl-3 text-sm focus:border-indigo-500 focus:outline-none" /></div>
          {invF.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4">
              <div className="flex items-center gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600"><FileText size={20} /></div>
                <div><p className="font-medium text-slate-900">{inv.id}</p><p className="text-xs text-slate-500">{inv.customerName}</p></div>
              </div>
              <div className="text-center"><p className="font-bold text-slate-900">{AFN(inv.amount)}</p><p className="text-xs text-slate-500">{inv.date}</p></div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : inv.status === 'overdue' ? 'bg-red-100 text-red-700' : inv.status === 'sent' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>{inv.status === 'paid' ? 'پرداخت شده' : inv.status === 'overdue' ? 'معوق' : inv.status === 'sent' ? 'ارسال شده' : 'پیش‌نویس'}</span>
                <RecordActions compact onEdit={() => editInvoice(inv)} onDelete={() => deleteInvoice(inv.id)} onPrint={() => handlePrint(inv)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><th className="px-4 py-3 font-semibold">#</th><th className="px-4 py-3 font-semibold">تاریخ</th><th className="px-4 py-3 font-semibold">عنوان</th><th className="px-4 py-3 font-semibold">مبلغ</th><th className="px-4 py-3 font-semibold">وضعیت</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {[...txHistory].reverse().map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-xs text-indigo-600">{tx.id}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{tx.date}</td>
                    <td className="px-4 py-3 text-xs text-slate-900">{tx.title}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-emerald-600">+{AFN(tx.debit)}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">تایید</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    <InvoicePrint invoice={printInvoice} />
    </>
  );
}
