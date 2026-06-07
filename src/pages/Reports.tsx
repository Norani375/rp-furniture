import { useState, useMemo } from 'react';
import { Download, Filter, Calendar, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { dbLedger, AFN } from '../db/database';
import { TransactionType, ReportFilter } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const typeLabels: Record<TransactionType, string> = {
  sale: 'فروش', purchase: 'خرید', expense: 'هزینه', payroll: 'حقوق',
  tax: 'مالیات', installment: 'قسط', inventory_in: 'ورود کالا', inventory_out: 'خروج کالا',
  payment_in: 'دریافت', payment_out: 'پرداخت',
};

const colorMap: Record<string, string> = {
  sale: '#6366f1', purchase: '#f59e0b', expense: '#ef4444', payroll: '#8b5cf6',
  tax: '#ec4899', installment: '#14b8a6', inventory_in: '#22c55e', inventory_out: '#f97316',
  payment_in: '#3b82f6', payment_out: '#6b7280',
};

const ALL_TYPES: TransactionType[] = ['sale','purchase','expense','payroll','tax','installment','inventory_in','inventory_out','payment_in','payment_out'];

export default function Reports() {
  const ledger = dbLedger.getAll();

  const [filter, setFilter] = useState<ReportFilter>({ from: '', to: '', type: 'all', status: 'all' });
  const [view, setView] = useState<'summary' | 'chart' | 'table'>('summary');

  const filtered = useMemo(() => dbLedger.filter(filter), [filter, ledger]);
  const summary = useMemo(() => dbLedger.summary(filter), [filter, ledger]);

  const chartData = useMemo(() => {
    const grouped: Record<string, { date: string; debit: number; credit: number }> = {};
    filtered.forEach((tx) => {
      const d = tx.date;
      if (!grouped[d]) grouped[d] = { date: d, debit: 0, credit: 0 };
      grouped[d].debit += tx.debit;
      grouped[d].credit += tx.credit;
    });
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const pieData = useMemo(() => {
    return ALL_TYPES.map((t) => ({
      name: typeLabels[t],
      value: summary.byType[t]?.sum || 0,
      color: colorMap[t],
    })).filter((d) => d.value > 0);
  }, [summary]);

  const barData = useMemo(() => {
    return ALL_TYPES.map((t) => ({
      name: typeLabels[t],
      debit: filtered.filter((tx) => tx.type === t && tx.debit > 0).reduce((s, tx) => s + tx.debit, 0),
      credit: filtered.filter((tx) => tx.type === t && tx.credit > 0).reduce((s, tx) => s + tx.credit, 0),
    }));
  }, [filtered]);

  const downloadCSV = () => {
    const csv = dbLedger.exportCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'erp-report.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">گزارش‌گیری دقیق</h2><p className="text-sm text-slate-500">{ledger.length} تراکنش در سیستم</p></div>
        <button onClick={downloadCSV} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Download size={16} /> خروجی CSV</button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3"><Filter size={16} className="text-slate-400" /><span className="text-sm font-medium text-slate-700">فیلترها</span></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <div><label className="text-[10px] text-slate-500">از تاریخ</label>
            <input type="date" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" /></div>
          <div><label className="text-[10px] text-slate-500">تا تاریخ</label>
            <input type="date" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" /></div>
          <div><label className="text-[10px] text-slate-500">نوع تراکنش</label>
            <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value as any })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
              <option value="all">همه انواع</option>
              {ALL_TYPES.map((t) => (<option key={t} value={t}>{typeLabels[t]}</option>))}
            </select></div>
          <div><label className="text-[10px] text-slate-500">وضعیت</label>
            <select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value as any })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none">
              <option value="all">همه وضعیت‌ها</option>
              <option value="confirmed">تایید شده</option>
              <option value="pending">در انتظار</option>
              <option value="cancelled">لغو شده</option>
            </select></div>
          <div><label className="text-[10px] text-slate-500">مبلغ حداقل</label>
            <input type="number" placeholder="۰" onChange={(e) => setFilter({ ...filter, minAmount: e.target.value ? Number(e.target.value) : undefined })} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" /></div>
        </div>
      </div>

      {/* Summary */}
      {filtered.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => setView('summary')} className={`px-4 py-1.5 rounded-lg text-xs font-medium ${view === 'summary' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}><PieIcon size={14} className="inline ml-1" />خلاصه</button>
            <button onClick={() => setView('chart')} className={`px-4 py-1.5 rounded-lg text-xs font-medium ${view === 'chart' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}><BarChart3 size={14} className="inline ml-1" />نمودار</button>
            <button onClick={() => setView('table')} className={`px-4 py-1.5 rounded-lg text-xs font-medium ${view === 'table' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}><Calendar size={14} className="inline ml-1" />جزئیات</button>
          </div>

          {view === 'summary' && (
            <div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-6">
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">تعداد تراکنش‌ها</p><p className="text-lg font-bold text-slate-900">{summary.totalTransactions}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">مجموع واریزی</p><p className="text-lg font-bold text-emerald-600">{AFN(summary.totalDebit)}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">مجموع برداشت</p><p className="text-lg font-bold text-red-600">{AFN(summary.totalCredit)}</p></div>
                <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">خالص</p><p className={`text-lg font-bold ${summary.netBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{AFN(summary.netBalance)}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {ALL_TYPES.filter((t) => summary.byType[t].count > 0).map((t) => (
                  <div key={t} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorMap[t] }} />
                      <span className="text-xs text-slate-600">{typeLabels[t]}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{summary.byType[t].count} مورد</p>
                    <p className="text-[10px] text-slate-500">{AFN(summary.byType[t].sum)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'chart' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">روند روزانه واریزی / برداشت</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <defs><linearGradient id="cd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient>
                      <linearGradient id="cc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(v: number) => `${(v/1e6).toFixed(0)}M`} />
                    <Tooltip formatter={(v: unknown) => AFN(Number(v))} />
                    <Area type="monotone" dataKey="debit" stroke="#6366f1" fill="url(#cd)" name="واریزی" strokeWidth={2} />
                    <Area type="monotone" dataKey="credit" stroke="#ef4444" fill="url(#cc)" name="برداشت" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">توزیع بر اساس نوع</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie></PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">مقایسه واریزی/برداشت</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6b7280' }} />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={(v: number) => `${(v/1e6).toFixed(0)}M`} />
                      <Tooltip formatter={(v: unknown) => AFN(Number(v))} />
                      <Bar dataKey="debit" fill="#6366f1" name="واریزی" radius={[4,4,0,0]} />
                      <Bar dataKey="credit" fill="#ef4444" name="برداشت" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {view === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead><tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="px-3 py-2 font-semibold">#</th><th className="px-3 py-2 font-semibold">تاریخ</th><th className="px-3 py-2 font-semibold">نوع</th>
                  <th className="px-3 py-2 font-semibold">عنوان</th><th className="px-3 py-2 font-semibold">واریزی</th><th className="px-3 py-2 font-semibold">برداشت</th>
                  <th className="px-3 py-2 font-semibold">مانده</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2 text-xs text-indigo-600">{tx.id}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{tx.date}</td>
                      <td className="px-3 py-2"><span className="text-[10px] rounded-full bg-slate-100 px-2 py-0.5">{typeLabels[tx.type]}</span></td>
                      <td className="px-3 py-2 text-xs text-slate-900">{tx.title}</td>
                      <td className="px-3 py-2 text-xs font-semibold text-emerald-600">{tx.debit > 0 ? AFN(tx.debit) : '—'}</td>
                      <td className="px-3 py-2 text-xs font-semibold text-red-600">{tx.credit > 0 ? AFN(tx.credit) : '—'}</td>
                      <td className="px-3 py-2 text-xs text-slate-700">{AFN(tx.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-500">هیچ تراکنشی با فیلترهای انتخاب شده یافت نشد.</p>
        </div>
      )}
    </div>
  );
}
