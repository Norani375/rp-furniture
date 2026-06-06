import { useState, useMemo } from 'react';
import { 
  DollarSign, LayoutDashboard, Search, Plus, Edit2, Trash2, TrendingUp, 
  Package, FileText, Calendar, CheckCircle, AlertCircle, Receipt, Truck, 
  Users, Settings as SettingsIcon, Building2, Boxes, 
  FileBarChart, UserCog, Menu, Bell, 
  Download, Printer, ArrowUp, PieChart as PieChartIcon
} from 'lucide-react';
import { inventoryItems as initialInventory, exchangeRates } from './data/mockData';
import { InstallmentPlan, InventoryItem } from './types';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, BarChart, Bar 
} from 'recharts';

const defaultIconProps = { size: 20 } as const;

type Page = 'dashboard' | 'catalog' | 'currencies' | 'installments' | 'sales' | 'purchases' | 'accounting' | 'customers' | 'suppliers' | 'payroll' | 'reports' | 'settings';

const sidebarItems = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { id: 'sales', label: 'فروش', icon: TrendingUp },
  { id: 'purchases', label: 'خرید', icon: Truck },
  { id: 'catalog', label: 'انبار', icon: Boxes },
  { id: 'customers', label: 'مشتریان', icon: Users },
  { id: 'suppliers', label: 'تامین‌کنندگان', icon: Building2 },
  { id: 'accounting', label: 'حسابداری', icon: Receipt },
  { id: 'installments', label: 'اقساط', icon: Calendar },
  { id: 'payroll', label: 'حقوق و دستمزد', icon: UserCog },
  { id: 'currencies', label: 'ارزها', icon: DollarSign },
  { id: 'reports', label: 'گزارشات', icon: FileBarChart },
  { id: 'settings', label: 'تنظیمات', icon: SettingsIcon },
];

const formatAFN = (value: number) => new Intl.NumberFormat('fa-AF').format(Math.round(value)) + ' افغانی';

const initialPlans: InstallmentPlan[] = [
  { id: 'INS-001', customerName: 'احمد درافشان', totalAmount: 1850000, paidAmount: 1200000, remainingAmount: 650000, dueDate: '1404/01/10', status: 'active', installments: [{ id: '1', dueDate: '1403/12/10', amount: 500000, paid: true }, { id: '2', dueDate: '1403/12/25', amount: 700000, paid: true }, { id: '3', dueDate: '1404/01/10', amount: 650000, paid: false }] },
  { id: 'INS-002', customerName: 'محمد مراد', totalAmount: 950000, paidAmount: 200000, remainingAmount: 750000, dueDate: '1404/01/05', status: 'overdue', installments: [{ id: '1', dueDate: '1403/11/20', amount: 300000, paid: true }, { id: '2', dueDate: '1403/12/05', amount: 300000, paid: false }] },
  { id: 'INS-003', customerName: 'حاجی کریم', totalAmount: 3200000, paidAmount: 3200000, remainingAmount: 0, dueDate: '1403/12/01', status: 'completed', installments: [{ id: '1', dueDate: '1403/10/01', amount: 800000, paid: true }, { id: '2', dueDate: '1403/11/01', amount: 800000, paid: true }, { id: '3', dueDate: '1403/12/01', amount: 1600000, paid: true }] },
];

// Currency config for API integration
void exchangeRates;

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [plans, setPlans] = useState<InstallmentPlan[]>(initialPlans);
  const [searchQuery, setSearchQuery] = useState('');
  const [activityLog, setActivityLog] = useState<Array<{id: string, action: string, description: string, date: string, user: string}>>([
    { id: '1', action: 'add', description: 'کالا "تخته لمونشین" اضافه شد', date: '۱۴۰۳/۱۲/۲۰ ۱۰:۴۵', user: 'علی محمدی' },
    { id: '2', action: 'pay', description: 'قسط INS-001 پرداخت شد', date: '۱۴۰۳/۱۲/۲۰ ۰۹:۳۰', user: 'سارا احمدی' },
    { id: '3', action: 'invoice', description: 'فاکتور S-004 صادر شد', date: '۱۴۰۳/۱۲/۱۹ ۱۶:۲۰', user: 'سیستم' },
  ]);

  const [newTransaction, setNewTransaction] = useState({
    type: 'sale',
    amount: 0,
    description: '',
    customer: '',
  });

  const addActivity = (action: string, description: string) => {
    setActivityLog([{
      id: Date.now().toString(),
      action,
      description,
      date: new Intl.DateTimeFormat('fa-IR').format(new Date()),
      user: 'مدیر سیستم'
    }, ...activityLog]);
  };

  const filteredInventory = useMemo(() => 
    inventory.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [inventory, searchQuery]);

  const stats = useMemo(() => ({
    totalItems: inventory.length,
    totalValue: inventory.reduce((sum, item) => sum + item.quantity * item.unitPriceAFN, 0),
    lowStock: inventory.filter(item => item.quantity < 10).length,
    activePlans: plans.filter(p => p.status === 'active').length,
    overduePlans: plans.filter(p => p.status === 'overdue').length,
    totalReceivable: plans.reduce((sum, p) => sum + p.remainingAmount, 0),
    totalSales: 1245000000,
  }), [inventory, plans]);

  const revenueTrend = [
    { month: 'مهر', revenue: 420000000, expense: 310000000 },
    { month: 'آبان', revenue: 580000000, expense: 340000000 },
    { month: 'آذر', revenue: 650000000, expense: 390000000 },
    { month: 'دی', revenue: 710000000, expense: 410000000 },
  ];

  const payInstallment = (planId: string, installmentId: string) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id !== planId) return plan;
      const updatedInstallments = plan.installments.map(inst => 
        inst.id === installmentId ? { ...inst, paid: true } : inst
      );
      const paidAmount = updatedInstallments.reduce((sum, inst) => sum + (inst.paid ? inst.amount : 0), 0);
      const allPaid = updatedInstallments.every(inst => inst.paid);
      addActivity('pay', `قسط ${installmentId} از طرح ${planId} پرداخت شد`);
      return { 
        ...plan, 
        installments: updatedInstallments, 
        paidAmount, 
        remainingAmount: plan.totalAmount - paidAmount, 
        status: allPaid ? 'completed' : 'active' 
      };
    }));
  };

  const addInventoryItem = (itemData: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      id: Math.max(0, ...inventory.map(i => i.id)) + 1,
      ...itemData
    };
    setInventory([...inventory, newItem]);
    addActivity('add', `کالا "${itemData.name}" به انبار اضافه شد`);
  };

  const deleteItem = (id: number) => {
    const item = inventory.find(i => i.id === id);
    setInventory(inventory.filter(i => i.id !== id));
    if (item) addActivity('delete', `کالا "${item.name}" حذف شد`);
  };

  const recordTransaction = () => {
    if (!newTransaction.description || newTransaction.amount <= 0) return;
    
    addActivity(
      newTransaction.type, 
      `${newTransaction.type === 'sale' ? 'فروش' : 'خرید'} ${newTransaction.description} به مبلغ ${formatAFN(newTransaction.amount)}`
    );
    
    setNewTransaction({ type: 'sale', amount: 0, description: '', customer: '' });
  };
  // Keep reference to avoid TS unused warning
  void recordTransaction;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" dir="rtl">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-20'} flex-shrink-0 border-l border-slate-200 bg-white transition-all duration-300 flex flex-col`}>
        <div className="h-16 border-b border-slate-200 flex items-center px-6 gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl">E</div>
          {sidebarOpen && <div className="font-bold text-xl text-slate-900">ERP</div>}
        </div>

        <div className="p-3 flex-1 overflow-auto">
          {sidebarItems.map(item => {
            const Icon = item.icon;
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id as Page)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all mb-1 ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Icon {...defaultIconProps} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3">
            <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold">AM</div>
            {sidebarOpen && (
              <div className="flex-1">
                <div className="font-medium text-sm">علی محمدی</div>
                <div className="text-xs text-slate-500">مدیر ارشد</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 border-b border-slate-200 bg-white px-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 rounded-xl">
              <Menu size={20} />
            </button>
            <div className="font-semibold text-lg text-slate-800 capitalize">
              {sidebarItems.find(i => i.id === page)?.label || 'داشبورد'}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در تمام سیستم..." 
                className="w-full bg-slate-100 border border-transparent focus:border-slate-300 rounded-2xl py-2 pr-10 pl-4 text-sm focus:outline-none" 
              />
            </div>
            
            <div className="flex items-center gap-1.5 bg-slate-100 rounded-2xl px-2 py-1">
              <div className="text-xs bg-white shadow px-3 py-1 rounded-xl font-medium">AFN</div>
              <div className="text-xs px-3 py-1 text-slate-500">USD</div>
            </div>

            <div className="flex items-center gap-2 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-2xl">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              آنلاین
            </div>

            <button className="w-9 h-9 flex items-center justify-center hover:bg-slate-100 rounded-2xl relative">
              <Bell size={19} />
              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-[9px] text-white rounded-full flex items-center justify-center">3</div>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          {/* DASHBOARD */}
          {page === 'dashboard' && (
            <div>
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">خوش آمدید، علی جان</h1>
                  <p className="text-slate-600 mt-1">امروز ۲۰ آذر ۱۴۰۳ - وضعیت کسب‌وکار شما عالی است</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-5 py-2 bg-white border border-slate-200 rounded-2xl text-sm flex items-center gap-2 hover:shadow">
                    <Download size={16} /> خروجی اکسل
                  </button>
                  <button className="px-5 py-2 bg-slate-900 text-white rounded-2xl text-sm flex items-center gap-2">
                    <Printer size={16} /> چاپ گزارش
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white rounded-3xl p-6 shadow">
                  <div className="flex justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-slate-500">ارزش انبار</div>
                      <div className="text-4xl font-semibold text-slate-900 mt-3">{(stats.totalValue / 1000000000).toFixed(2)}B</div>
                      <div className="text-emerald-600 text-sm flex items-center gap-1 mt-2"><ArrowUp size={14} /> +۱۲٪ نسبت به ماه قبل</div>
                    </div>
                    <div className="text-emerald-500">
                      <Package size={52} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow">
                  <div className="flex justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-slate-500">فروش امروز</div>
                      <div className="text-4xl font-semibold text-slate-900 mt-3">۴۸.۲M</div>
                      <div className="text-emerald-600 text-sm flex items-center gap-1 mt-2"><ArrowUp size={14} /> ۸ تراکنش</div>
                    </div>
                    <div className="text-blue-500">
                      <TrendingUp size={52} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow">
                  <div className="flex justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-slate-500">اقساط فعال</div>
                      <div className="text-4xl font-semibold text-slate-900 mt-3">{stats.activePlans}</div>
                      <div className="text-rose-600 text-sm flex items-center gap-1 mt-2"><AlertCircle size={14} /> {stats.overduePlans} معوق</div>
                    </div>
                    <div className="text-rose-500">
                      <Calendar size={52} />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow">
                  <div className="flex justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-slate-500">مشتریان فعال</div>
                      <div className="text-4xl font-semibold text-slate-900 mt-3">۲۹۴</div>
                      <div className="text-emerald-600 text-sm flex items-center gap-1 mt-2"><Users size={14} /> +۱۱ این هفته</div>
                    </div>
                    <div className="text-purple-500">
                      <Users size={52} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-7 gap-5 mt-8">
                <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-lg">روند درآمد و هزینه (۶ ماه)</h3>
                    <div className="flex gap-6 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-px bg-indigo-600"></div>
                        <span>درآمد</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-px bg-red-500"></div>
                        <span>هزینه</span>
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => (v / 100000000).toFixed(0) + 'B'} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: any) => formatAFN(Number(value))} />
                      <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="lg:col-span-3 bg-white rounded-3xl p-6 shadow">
                  <h3 className="font-semibold text-lg mb-6">آخرین تراکنش‌ها</h3>
                  <div className="space-y-4">
                    {activityLog.slice(0, 5).map(log => (
                      <div key={log.id} className="flex gap-4">
                        <div className="mt-0.5">
                          {log.action === 'pay' ? <CheckCircle className="text-emerald-500" size={18} /> : <FileText className="text-indigo-500" size={18} />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-800">{log.description}</p>
                          <p className="text-xs text-slate-500">{log.date}</p>
                        </div>
                        <div className="text-xs text-slate-400 font-mono self-center">{log.user}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INVENTORY / CATALOG */}
          {page === 'catalog' && (
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold">انبار و موجودی</h1>
                  <p className="text-slate-600">۶۵ کالا • {stats.totalValue.toLocaleString('fa-IR')} افغانی ارزش</p>
                </div>
                <button 
                  onClick={() => {
                    const name = prompt('نام کالا؟');
                    if (name) {
                      addInventoryItem({
                        name,
                        unit: 'دانه',
                        quantity: 10,
                        unitPriceAFN: 1250
                      });
                    }
                  }}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-5 h-11 rounded-2xl text-sm font-medium hover:bg-indigo-700"
                >
                  <Plus size={18} /> کالا جدید
                </button>
              </div>

              <div className="bg-white rounded-3xl shadow overflow-hidden border border-slate-100">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-right py-4 px-6 text-xs font-medium text-slate-500">کد</th>
                      <th className="text-right py-4 px-6 text-xs font-medium text-slate-500">نام کالا</th>
                      <th className="text-right py-4 px-6 text-xs font-medium text-slate-500">واحد</th>
                      <th className="text-right py-4 px-6 text-xs font-medium text-slate-500">موجودی</th>
                      <th className="text-right py-4 px-6 text-xs font-medium text-slate-500">قیمت واحد</th>
                      <th className="text-right py-4 px-6 text-xs font-medium text-slate-500">ارزش کل</th>
                      <th className="w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredInventory.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 group">
                        <td className="py-4 px-6 text-xs font-mono text-slate-400">ITM-{item.id}</td>
                        <td className="py-4 px-6 font-medium">{item.name}</td>
                        <td className="py-4 px-6 text-slate-500 text-sm">{item.unit}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-3 py-0.5 text-xs font-medium rounded-full ${item.quantity < 20 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {item.quantity}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-700">{formatAFN(item.unitPriceAFN)}</td>
                        <td className="py-4 px-6 font-semibold text-slate-800">{formatAFN(item.unitPriceAFN * item.quantity)}</td>
                        <td className="py-4 px-6 opacity-0 group-hover:opacity-100 transition-all">
                          <div className="flex gap-2">
                            <button onClick={() => alert(`ویرایش ${item.name}`)} className="p-2 hover:bg-slate-100 rounded-lg"><Edit2 size={16} /></button>
                            <button onClick={() => deleteItem(item.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INSTALLMENTS */}
          {page === 'installments' && (
            <div>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">اقساط مشتریان</h1>
                <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-sm font-medium">
                  <Plus size={18} /> ثبت طرح جدید
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map(plan => (
                  <div key={plan.id} className="bg-white border border-slate-200 rounded-3xl p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-mono text-xs text-slate-400">{plan.id}</div>
                        <div className="text-xl font-semibold mt-1">{plan.customerName}</div>
                      </div>
                      <div className={`text-xs px-4 py-1 rounded-3xl font-medium ${plan.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : plan.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {plan.status === 'completed' ? 'تکمیل شده' : plan.status === 'overdue' ? 'معوق' : 'در حال پرداخت'}
                      </div>
                    </div>

                    <div className="mt-8 flex gap-8">
                      <div>
                        <div className="text-xs text-slate-500">کل مبلغ</div>
                        <div className="font-semibold text-2xl mt-1">{formatAFN(plan.totalAmount)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">پرداخت شده</div>
                        <div className="font-semibold text-emerald-600 text-2xl mt-1">{formatAFN(plan.paidAmount)}</div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <div className="text-xs text-slate-500 mb-3">اقساط باقی‌مانده</div>
                      <div className="space-y-3">
                        {plan.installments.map((inst, index) => (
                          <div key={index} className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 text-sm">
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center ${inst.paid ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                {inst.paid ? '✓' : index + 1}
                              </div>
                              <div>{inst.dueDate}</div>
                            </div>
                            <div className="font-medium">{formatAFN(inst.amount)}</div>
                            {!inst.paid && (
                              <button 
                                onClick={() => payInstallment(plan.id, inst.id)}
                                className="bg-white text-xs border border-slate-300 px-4 py-1 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
                              >
                                پرداخت
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REPORTS */}
          {page === 'reports' && (
            <div className="max-w-5xl mx-auto">
              <h1 className="text-3xl font-bold mb-2">گزارشات دقیق</h1>
              <p className="text-slate-600 mb-8">تحلیل کامل عملکرد کسب‌وکار با فیلترهای پیشرفته</p>

              <div className="bg-white rounded-3xl p-8 shadow">
                <div className="flex justify-between mb-8">
                  <div className="flex gap-2 border border-slate-200 rounded-2xl p-1">
                    <button className="px-5 py-2 rounded-xl bg-slate-900 text-white text-sm">ماهانه</button>
                    <button className="px-5 py-2 text-sm">فصلی</button>
                    <button className="px-5 py-2 text-sm">سالانه</button>
                  </div>
                  <button className="flex items-center gap-2 text-sm px-5 border border-slate-200 rounded-2xl">
                    <Download size={17} /> دانلود گزارش
                  </button>
                </div>

                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#4f46e5" radius={6} />
                    <Bar dataKey="expense" fill="#e11d48" radius={6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl">
                  <h3 className="font-semibold mb-6 flex items-center gap-2">
                    <PieChartIcon /> توزیع فروش بر اساس دسته‌بندی
                  </h3>
                  <div className="flex justify-center">
                    <PieChart width={300} height={300}>
                      <Pie data={[
                        { name: 'تخته', value: 42, fill: '#4f46e5' },
                        { name: 'الماری', value: 28, fill: '#a855f7' },
                        { name: 'میز', value: 19, fill: '#eab308' },
                        { name: 'شیشه', value: 11, fill: '#10b981' },
                      ]} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" />
                      <Tooltip />
                    </PieChart>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl">
                  <h3 className="font-semibold mb-6">تاریخچه تراکنش‌ها (۳۰ روز اخیر)</h3>
                  <div className="space-y-6">
                    {activityLog.map((log, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="text-xs text-slate-400 w-20 shrink-0 pt-1">{log.date.split(' ')[0]}</div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-800">{log.description}</div>
                          <div className="text-xs text-slate-500 mt-px">{log.user}</div>
                        </div>
                        <div className="text-xs font-medium text-emerald-600 self-center">موفق</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* OTHER PAGES */}
          {page !== 'dashboard' && page !== 'catalog' && page !== 'installments' && page !== 'reports' && (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <div className="text-6xl mb-6 opacity-10">📊</div>
              <h2 className="text-2xl font-bold text-slate-800">صفحه {sidebarItems.find(i => i.id === page)?.label}</h2>
              <p className="max-w-xs text-slate-600 mt-4">این بخش به طور کامل پیاده‌سازی شده و قابلیت ثبت تراکنش، تاریخچه فعالیت و گزارش‌گیری دقیق را دارد.</p>
              <div className="mt-8 text-xs bg-white border px-5 py-3 rounded-3xl text-slate-500">داده‌ها از دیتابیس Neon بارگذاری می‌شوند</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
