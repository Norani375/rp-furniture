import {
  LayoutDashboard, Receipt, ShoppingCart, Truck, Package,
  Users, Users2, Wallet, FileText, Settings, ChevronRight,
  Database, LogOut, ChevronLeft, Factory, Banknote, Bell, Shield, Store,
} from 'lucide-react';
import { authService } from '../services/securityService';

interface Props {
  active: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const menuGroups = [
  {
    label: 'اصلی',
    items: [
      { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    ],
  },
  {
    label: 'کسب‌وکار',
    items: [
      { id: 'catalog', label: 'کاتالوگ اجناس', icon: Package },
      { id: 'pos', label: 'فروش سریع POS', icon: Store },
      { id: 'sales', label: 'فروش', icon: ShoppingCart },
      { id: 'purchases', label: 'خرید', icon: Truck },
      { id: 'inventory', label: 'انبارداری', icon: Package },
      { id: 'manufacturing', label: 'تولید و مونتاژ', icon: Factory },
    ],
  },
  {
    label: 'مالی',
    items: [
      { id: 'accounting', label: 'حسابداری', icon: Receipt },
      { id: 'banking', label: 'چک و بانک', icon: Banknote },
      { id: 'currencies', label: 'ارزها', icon: Wallet },
      { id: 'installments', label: 'اقساط', icon: FileText },
      { id: 'tax', label: 'مالیات', icon: Receipt },
    ],
  },
  {
    label: 'منابع انسانی',
    items: [
      { id: 'crm', label: 'CRM مشتریان', icon: Users2 },
      { id: 'payroll', label: 'حقوق و دستمزد', icon: Users },
    ],
  },
  {
    label: 'گزارشات',
    items: [
      { id: 'reports', label: 'گزارش‌گیری', icon: FileText },
      { id: 'audit', label: 'رخدادها (Audit)', icon: Shield },
      { id: 'backup', label: 'پشتیبان', icon: Database },
      { id: 'notifications', label: 'هشدارها', icon: Bell },
      { id: 'access', label: 'سطوح دسترسی', icon: Shield },
      { id: 'settings', label: 'تنظیمات', icon: Settings },
    ],
  },
];

export default function Sidebar({ active, onNavigate, collapsed, onToggle }: Props) {
  return (
    <aside
      className={`${collapsed ? 'w-20' : 'w-64'} flex flex-col border-l border-slate-200 bg-white transition-all duration-300`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 text-sm font-bold text-white">
              ERP
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900">سیستم مدیریت</h1>
              <p className="text-[10px] text-slate-400">نسخه ۱.۰</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          title={collapsed ? 'باز کردن' : 'بستن'}
        >
          {collapsed ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        {menuGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon size={18} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User + Footer */}
      <div className="border-t border-slate-100 p-3">
        {!collapsed && (
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {(localStorage.getItem('erp_user_name') || 'م').charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{localStorage.getItem('erp_user_name') || 'مدیر'}</p>
              <p className="truncate text-[10px] text-slate-500">{localStorage.getItem('erp_user_role') || 'admin'}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            if (confirm('آیا از ریست دیتابیس محلی مطمئن هستید؟')) {
              // فقط دیتای محلی مربوط به erp پاک می‌شود
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('erp_') && k !== 'erp_auth_token') localStorage.removeItem(k);
              }
              window.location.reload();
            }
          }}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'ریست دیتابیس' : undefined}
        >
          <Database size={18} />
          {!collapsed && <span>ریست دیتابیس</span>}
        </button>
        <button
          onClick={() => { authService.logout(); }}
          className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'خروج' : undefined}
        >
          <LogOut size={18} />
          {!collapsed && <span>خروج</span>}
        </button>
      </div>
    </aside>
  );
}
