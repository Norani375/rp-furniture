import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import Currencies from './pages/Currencies';
import Installments from './pages/Installments';
import Accounting from './pages/Accounting';
import Sales from './pages/Sales';
import Purchases from './pages/Purchases';
import InventoryPage from './pages/InventoryPage';
import Crm from './pages/Crm';
import Payroll from './pages/Payroll';
import Tax from './pages/Tax';
import Reports from './pages/Reports';
import SettingsPage from './pages/SettingsPage';
import { testConnection } from './db/neon';
import { Database } from 'lucide-react';

const pages: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  catalog: Catalog,
  currencies: Currencies,
  installments: Installments,
  accounting: Accounting,
  sales: Sales,
  purchases: Purchases,
  inventory: InventoryPage,
  crm: Crm,
  payroll: Payroll,
  tax: Tax,
  reports: Reports,
  settings: SettingsPage,
};

const pageTitles: Record<string, string> = {
  dashboard: 'داشبورد', catalog: 'کاتالوگ اجناس', currencies: 'ارزها', installments: 'اقساط',
  accounting: 'حسابداری', sales: 'فروش', purchases: 'خرید', inventory: 'انبارداری',
  crm: 'CRM', payroll: 'حقوق و دستمزد', tax: 'مالیات', reports: 'گزارش‌گیری', settings: 'تنظیمات',
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    testConnection().then((r) => setDbStatus(r.ok ? 'online' : 'offline'));
  }, []);

  const PageComponent = pages[page] || Dashboard;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900" dir="rtl">
      <Sidebar active={page} onNavigate={setPage} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur">
          <h1 className="text-base font-bold text-slate-900">{pageTitles[page]}</h1>
          <button
            onClick={() => setPage('settings')}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              dbStatus === 'online'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : dbStatus === 'offline'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            <Database size={14} />
            <span className={`h-2 w-2 rounded-full ${dbStatus === 'online' ? 'bg-emerald-500' : dbStatus === 'offline' ? 'bg-red-500' : 'bg-slate-400 animate-pulse'}`} />
            {dbStatus === 'online' ? 'Neon متصل' : dbStatus === 'offline' ? 'آفلاین (محلی)' : 'در حال بررسی...'}
          </button>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6">
          <PageComponent />
        </div>
        <footer className="mt-10 border-t border-slate-200 bg-white py-4">
          <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-500">
            سیستم مدیریت کسب‌وکار — نسخه ۱.۰ | دیتابیس: Neon PostgreSQL (Serverless)
          </div>
        </footer>
      </main>
    </div>
  );
}
