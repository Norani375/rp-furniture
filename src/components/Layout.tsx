import { ReactNode } from 'react';
import { useApp } from '../store/AppContext';
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Truck,
  Package,
  Users,
  Users2,
  Wallet,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Search,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activePage: string;
  setActivePage: (page: string) => void;
}

export default function Layout({ children, activePage, setActivePage }: LayoutProps) {
  const { sidebarOpen, toggleSidebar, currentUser } = useApp();

  const sidebarItems = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'accounting', label: 'حسابداری', icon: Receipt },
    { id: 'sales', label: 'فروش', icon: ShoppingCart },
    { id: 'purchases', label: 'خرید', icon: Truck },
    { id: 'inventory', label: 'انبار', icon: Package },
    { id: 'crm', label: 'CRM', icon: Users2 },
    { id: 'payroll', label: 'حقوق و دستمزد', icon: Users },
    { id: 'tax', label: 'مالیات', icon: Wallet },
    { id: 'reports', label: 'گزارشات', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-gray-50" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} flex flex-col border-l border-gray-200 bg-white transition-all duration-300`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          {sidebarOpen && (
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-bold text-white">
                E
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">ERP</h1>
                <p className="text-xs text-gray-500">سیستم مدیریت</p>
              </div>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 hover:bg-gray-100 text-gray-600"
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`flex w-full items-center space-x-reverse space-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                activePage === item.id
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="border-t border-gray-200 p-3">
          <div className="flex items-center space-x-reverse space-x-3 rounded-xl p-2 hover:bg-gray-50">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {currentUser.avatar}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser.role}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center space-x-reverse space-x-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="جستجو..."
                className="w-64 rounded-lg border border-gray-300 py-2 pr-10 pl-4 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center space-x-reverse space-x-4">
            <button className="relative rounded-lg p-2 hover:bg-gray-100">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute -top-1 -left-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                3
              </span>
            </button>
            <button className="flex items-center space-x-reverse space-x-2 rounded-lg p-2 hover:bg-gray-100 text-gray-600">
              <Settings size={20} />
              {sidebarOpen && <span className="text-sm">تنظیمات</span>}
            </button>
            <button className="flex items-center space-x-reverse space-x-2 rounded-lg p-2 text-red-600 hover:bg-red-50">
              <LogOut size={20} />
              {sidebarOpen && <span className="text-sm">خروج</span>}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
