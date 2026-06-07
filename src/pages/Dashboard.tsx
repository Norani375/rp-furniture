import { useState, useEffect } from 'react';
import { Package, Wallet, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { neonLedger, neonStats, testConnection } from '../db/neon';
import { inventoryItems } from '../data/mockData';
import { AFN, dbReports } from '../db/database';

export default function Dashboard() {
  const [stats, setStats] = useState({ 
    inventoryCount: 0, 
    inventoryValue: 0, 
    realInventoryValue: 0,
    cogs: 0,
    transactionCount: 0, 
    planCount: 0, 
    receivable: 0 
  } as any);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    loadLiveData();
  }, []);

  const loadLiveData = async () => {
    setLoading(true);
    try {
      const conn = await testConnection();
      if (conn.ok) {
        setConnected(true);
        const s = await neonStats();
        setStats(s);
        const txs = await neonLedger.getAll();
        setRecentTx(txs.slice(0, 8));
      } else {
        setConnected(false);
        setStats({
          inventoryCount: inventoryItems.length,
          inventoryValue: inventoryItems.reduce((s, i) => s + i.quantity * i.unitPriceAFN, 0),
          realInventoryValue: 0,
          cogs: 0,
          transactionCount: 0,
          planCount: 2,
          receivable: 2000000,
        });
      }
    } catch {
      setConnected(false);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">داشبورد مدیریت یکپارچه</h2>
          <p className="text-sm text-slate-500">خلاصه کل سیستم از Neon PostgreSQL</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${connected ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-red-500'} ${loading ? 'animate-pulse' : ''}`} />
            {connected ? 'Neon متصل' : 'آفلاین'}
          </span>
          <button onClick={loadLiveData} className="rounded-xl border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50" title="بروزرسانی">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700"><Package size={20} /></div>
            <div><p className="text-xs text-slate-500">کل اجناس</p><p className="text-lg font-bold text-slate-900">{stats.inventoryCount}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"><Wallet size={20} /></div>
            <div><p className="text-xs text-slate-500">ارزش موجودی</p><p className="text-lg font-bold text-slate-900">{AFN(stats.inventoryValue)}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><FileIcon size={20} /></div>
            <div><p className="text-xs text-slate-500">تراکنش‌ها</p><p className="text-lg font-bold text-slate-900">{stats.transactionCount}</p></div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700"><AlertTriangle size={20} /></div>
            <div><p className="text-xs text-slate-500">مطالبات معوق</p><p className="text-lg font-bold text-red-600">{AFN(stats.receivable)}</p></div>
          </div>
        </div>
      </div>

      {recentTx.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">آخرین تراکنش‌ها از Neon</h3>
          <div className="space-y-2">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${tx.debit > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{tx.title}</p>
                    <p className="text-[10px] text-slate-500">{tx.id} · {tx.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${tx.debit > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {tx.debit > 0 ? '+' : '-'}{AFN(tx.debit || tx.credit)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentTx.length === 0 && !loading && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-500">داده‌ای از Neon یافت نشد. ابتدا دیتابیس را راه‌اندازی کنید.</p>
        </div>
      )}
    </div>
  );
}

function FileIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}
