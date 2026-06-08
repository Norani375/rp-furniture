import { useState } from 'react';
import { Database, CheckCircle, XCircle, Loader2, Server, ExternalLink } from 'lucide-react';
import { testConnection, neonStats, neonInventory, neonLedger } from '../db/neon';
import { dbInventory, dbLedger, AFN } from '../db/database';

type Status = 'idle' | 'loading' | 'ok' | 'error';

export default function SettingsPage() {
  const [testStatus, setTestStatus] = useState<Status>('idle');
  const [testMsg, setTestMsg] = useState('');
  const [syncStatus, setSyncStatus] = useState<Status>('idle');
  const [syncMsg, setSyncMsg] = useState('');
  const [stats, setStats] = useState<any>(null);

  const handleTest = async () => {
    setTestStatus('loading');
    const res = await testConnection();
    setTestStatus(res.ok ? 'ok' : 'error');
    setTestMsg(res.message);
  };

  const handleSync = async () => {
    setSyncStatus('loading');
    setSyncMsg('در حال بررسی...');

    try {
      const conn = await testConnection();
      if (!conn.ok) {
        setSyncStatus('ok');
        setSyncMsg('Backend فعلاً در دسترس نیست؛ سیستم در حالت محلی فعال است و اطلاعات در مرورگر ذخیره می‌شود. برای همگام‌سازی آنلاین، Backend را اجرا کنید.');
        return;
      }
      setSyncMsg('اتصال برقرار است، شروع انتقال داده‌ها...');

      // 1. Upload inventory
      const localInv = dbInventory.getAll();
      const remoteInv = await neonInventory.getAll();
      if (remoteInv.length === 0 && localInv.length > 0) {
        setSyncMsg(`${localInv.length} قلم کالا در حال انتقال...`);
        for (const item of localInv) {
          await neonInventory.add({ name: item.name, unit: item.unit, quantity: item.quantity, unitPriceAFN: item.unitPriceAFN, category: item.category });
        }
      }

      // 2. Upload transactions
      const localTx = dbLedger.getAll();
      const remoteTxCount = await neonLedger.count();
      if (remoteTxCount === 0 && localTx.length > 0) {
        setSyncMsg(`${localTx.length} تراکنش در حال انتقال...`);
        for (const tx of localTx) {
          await neonLedger.add(tx);
        }
      }

      // 3. Load stats
      const s = await neonStats();
      setStats(s);
      setSyncStatus('ok');
      setSyncMsg('همگام‌سازی کامل شد! آمار به‌روزرسانی شد.');
    } catch {
      setSyncStatus('ok');
      setSyncMsg('همگام‌سازی آنلاین انجام نشد؛ سیستم بدون مشکل در حالت محلی ادامه می‌دهد.');
    }
  };

  const handleLoadStats = async () => {
    setSyncStatus('loading');
    const conn = await testConnection();
    if (!conn.ok) {
      setStats(null);
      setSyncStatus('ok');
      setSyncMsg('Backend در دسترس نیست؛ آمار آنلاین موجود نیست اما سیستم محلی فعال است.');
      return;
    }
    const s = await neonStats();
    setStats(s);
    setSyncStatus('ok');
    setSyncMsg('آمار از Backend/Neon بارگذاری شد');
  };

  const StatusIcon = ({ s }: { s: Status }) =>
    s === 'loading' ? <Loader2 size={16} className="animate-spin text-indigo-500" /> :
    s === 'ok' ? <CheckCircle size={16} className="text-emerald-500" /> :
    s === 'error' ? <XCircle size={16} className="text-red-500" /> : null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">تنظیمات و دیتابیس</h2>

      {/* Connection */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Server size={18} className="text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">اتصال به Backend امن</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          اتصال امن از طریق Backend انجام می‌شود. اگر Backend اجرا نباشد، سیستم به صورت محلی و بدون خطا کار می‌کند.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleTest} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <StatusIcon s={testStatus} />
            {testStatus === 'loading' ? 'در حال تست...' : 'تست اتصال'}
          </button>
          {testMsg && <span className={`text-sm ${testStatus === 'ok' ? 'text-emerald-600' : 'text-amber-600'}`}>{testMsg}</span>}
        </div>
      </div>

      {/* Sync */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Database size={18} className="text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">همگام‌سازی داده‌ها</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">انتقال داده‌های محلی به Backend/Neon. اگر Backend اجرا نباشد، داده‌ها در حالت محلی باقی می‌مانند.</p>
        <div className="flex gap-3">
          <button onClick={handleSync} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            <StatusIcon s={syncStatus} />
            همگام‌سازی آنلاین
          </button>
          <button onClick={handleLoadStats} className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            بارگذاری آمار آنلاین
          </button>
        </div>
        {syncMsg && <p className={`mt-3 text-sm ${syncStatus === 'ok' ? 'text-emerald-600' : syncStatus === 'error' ? 'text-red-600' : 'text-slate-500'}`}>{syncMsg}</p>}
      </div>

      {/* Live stats from Neon */}
      {stats && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">📊 داده‌های زنده از Backend/Neon</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-white p-4">
              <p className="text-xs text-slate-500">اجناس</p>
              <p className="text-lg font-bold text-slate-900">{stats.inventoryCount}</p>
            </div>
            <div className="rounded-xl bg-white p-4">
              <p className="text-xs text-slate-500">ارزش موجودی</p>
              <p className="text-sm font-bold text-emerald-700">{AFN(stats.inventoryValue)}</p>
            </div>
            <div className="rounded-xl bg-white p-4">
              <p className="text-xs text-slate-500">تراکنش‌ها</p>
              <p className="text-lg font-bold text-slate-900">{stats.transactionCount}</p>
            </div>
            <div className="rounded-xl bg-white p-4">
              <p className="text-xs text-slate-500">مطالبات اقساط</p>
              <p className="text-sm font-bold text-red-600">{AFN(stats.receivable)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Help */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3">راهنما</h3>
        <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
          <li><strong>تست اتصال</strong> — مطمئن شوید مرورگر می‌تواند به Neon وصل شود</li>
          <li><strong>همگام‌سازی</strong> — داده‌های محلی را به Neon ارسال کنید</li>
          <li><strong>آمار از Neon</strong> — مستقیماً از دیتابیس واقعی آمار بخوانید</li>
        </ol>
        <a href="https://console.neon.tech" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
          باز کردن کنسول Neon <ExternalLink size={12} />
        </a>
      </div>

      {/* Local data management */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">مدیریت داده محلی</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              const data: Record<string, unknown> = {};
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('erp_')) data[k] = localStorage.getItem(k);
              }
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'erp-backup.json'; a.click();
            }}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            📥 دانلود نسخه پشتیبان
          </button>
          <button
            onClick={() => { if (confirm('تمام داده‌های محلی حذف شوند؟')) { localStorage.clear(); window.location.reload(); } }}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            🗑️ ریست داده محلی
          </button>
        </div>
      </div>
    </div>
  );
}
