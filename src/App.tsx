import { useState, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
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
import Login from './pages/Login';
import Manufacturing from './pages/Manufacturing';
import Banking from './pages/Banking';
import Pos from './pages/Pos';
import NotificationsPage from './pages/NotificationsPage';
import AccessControl from './pages/AccessControl';
import AuditPage from './pages/AuditPage';
import BackupPage from './pages/BackupPage';
import { testConnection } from './db/neon';
import { Bell, Database, ShieldAlert } from 'lucide-react';
import { dbNotifications } from './db/database';
import { UserRole } from './types';

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
  manufacturing: Manufacturing,
  banking: Banking,
  pos: Pos,
  notifications: NotificationsPage,
  access: AccessControl,
  audit: AuditPage,
  backup: BackupPage,
};

const pageTitles: Record<string, string> = {
  dashboard: 'داشبورد', catalog: 'کاتالوگ اجناس', currencies: 'ارزها', installments: 'اقساط',
  accounting: 'حسابداری', sales: 'فروش', purchases: 'خرید', inventory: 'انبارداری',
  crm: 'CRM', payroll: 'حقوق و دستمزد', tax: 'مالیات', reports: 'گزارش‌گیری', settings: 'تنظیمات',
  manufacturing: 'تولید و مونتاژ', banking: 'چک و بانک', pos: 'فروش سریع POS', notifications: 'هشدارها', access: 'سطوح دسترسی', audit: 'گزارش رخدادها', backup: 'پشتیبان',
};

const roleAccess: Record<UserRole, string[]> = {
  admin: Object.keys(pages),
  accountant: ['dashboard', 'accounting', 'banking', 'currencies', 'installments', 'tax', 'reports', 'notifications', 'settings'],
  sales: ['dashboard', 'pos', 'sales', 'crm', 'installments', 'notifications'],
  inventory: ['dashboard', 'catalog', 'inventory', 'manufacturing', 'purchases', 'notifications'],
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

function AppInner() {
  const [page, setPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<UserRole>('admin');

  useEffect(() => {
    testConnection().then((r) => setDbStatus(r.ok ? 'online' : 'offline'));
    if (localStorage.getItem('erp_auth_token') === 'logged_in') {
      setIsAuthenticated(true);
      setRole((localStorage.getItem('erp_user_role') as UserRole) || 'admin');
    }
  }, []);

  if (!isAuthenticated) {
    return <Login onSuccess={() => { setIsAuthenticated(true); setRole((localStorage.getItem('erp_user_role') as UserRole) || 'admin'); }} />;
  }

  const allowed = roleAccess[role] || roleAccess.admin;
  const canView = allowed.includes(page);
  const PageComponent = canView ? (pages[page] || Dashboard) : AccessDenied;
  const notificationCount = dbNotifications.getAll().length;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 print:bg-white" dir="rtl">
      <div className="print:hidden">
        <Sidebar active={page} onNavigate={setPage} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-3 backdrop-blur print:hidden">
          <h1 className="text-base font-bold text-slate-900">{pageTitles[page]}</h1>
          <div className="flex items-center gap-2">
          <button
            onClick={() => setPage('notifications')}
            className="relative rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Bell size={14} />
            {notificationCount > 0 && <span className="absolute -left-1 -top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] text-white">{notificationCount}</span>}
          </button>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{role}</span>
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
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 print:p-0 print:max-w-none">
          <PageComponent />
        </div>
        <footer className="mt-10 border-t border-slate-200 bg-white py-4 print:hidden">
          <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-500">
            سیستم مدیریت کسب‌وکار — نسخه ۱.۰ | دیتابیس: Neon PostgreSQL (Serverless)
          </div>
        </footer>
      </main>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
      <ShieldAlert className="mx-auto mb-3 text-red-600" size={40} />
      <h2 className="text-lg font-bold text-red-800">دسترسی غیرمجاز</h2>
      <p className="mt-2 text-sm text-red-600">نقش کاربری شما اجازه مشاهده این بخش را ندارد.</p>
    </div>
  );
}
