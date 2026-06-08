import { useState, useEffect } from 'react';
import { 
  Receipt, Plus, Search, Filter, 
  Wallet, TrendingUp, TrendingDown, FileText,
  MoreVertical, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

interface Account {
  id: number;
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  parent_id?: number;
}

interface JournalEntry {
  id: string;
  entry_no: string;
  date: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: 'draft' | 'posted' | 'reversed';
  lines: JournalLine[];
}

interface JournalLine {
  id: number;
  account_id: number;
  account_name: string;
  debit: number;
  credit: number;
  description: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  account: string;
  reference?: string;
}

const formatAFN = (value: number) => 
  new Intl.NumberFormat('fa-AF').format(Math.abs(value)) + ' افغانی';

const accountTypeColors: Record<string, string> = {
  asset: 'bg-blue-100 text-blue-800',
  liability: 'bg-red-100 text-red-800',
  equity: 'bg-purple-100 text-purple-800',
  revenue: 'bg-green-100 text-green-800',
  expense: 'bg-orange-100 text-orange-800',
};

const accountTypeLabels: Record<string, string> = {
  asset: 'دارایی',
  liability: 'بدهی',
  equity: 'سرمایه',
  revenue: 'درآمد',
  expense: 'هزینه',
};

export default function Accounting() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'journal' | 'accounts' | 'reports'>('dashboard');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [, setShowNewTransactionModal] = useState(false);
  const [, setSelectedAccount] = useState<Account | null>(null);
  
  // New entry form state
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    lines: [{ account_id: 0, account_name: '', debit: 0, credit: 0, description: '' }]
  });

  // Load data from API (mock for now)
  useEffect(() => {
    // Mock data - replace with actual API calls
    setAccounts([
      { id: 1, code: '1000', name: 'نقد و بانک', type: 'asset', balance: 245000000 },
      { id: 2, code: '1100', name: 'حساب‌های دریافتنی', type: 'asset', balance: 125000000 },
      { id: 3, code: '1200', name: 'موجودی کالا', type: 'asset', balance: 4280000000 },
      { id: 4, code: '2000', name: 'حساب‌های پرداختنی', type: 'liability', balance: 89000000 },
      { id: 5, code: '2100', name: 'وام‌های کوتاه‌مدت', type: 'liability', balance: 150000000 },
      { id: 6, code: '3000', name: 'سرمایه صاحبان', type: 'equity', balance: 4200000000 },
      { id: 7, code: '3100', name: 'سود انباشته', type: 'equity', balance: 186000000 },
      { id: 8, code: '4000', name: 'فروش کالا', type: 'revenue', balance: 1245000000 },
      { id: 9, code: '4100', name: 'درآمد خدمات', type: 'revenue', balance: 85000000 },
      { id: 10, code: '5000', name: 'بهای تمام‌شده کالای فروش‌رفته', type: 'expense', balance: 890000000 },
      { id: 11, code: '5100', name: 'حقوق و دستمزد', type: 'expense', balance: 220000000 },
      { id: 12, code: '5200', name: 'اجاره', type: 'expense', balance: 45000000 },
      { id: 13, code: '5300', name: 'هزینه‌های اداری', type: 'expense', balance: 32000000 },
      { id: 14, code: '5400', name: 'استهلاک', type: 'expense', balance: 28000000 },
    ]);

    setJournalEntries([
      {
        id: '1',
        entry_no: 'JV-001',
        date: '1403/12/15',
        description: 'فروش به شرکت نور',
        total_debit: 450000000,
        total_credit: 450000000,
        status: 'posted',
        lines: [
          { id: 1, account_id: 2, account_name: 'حساب‌های دریافتنی', debit: 450000000, credit: 0, description: 'فروش به نسیه' },
          { id: 2, account_id: 8, account_name: 'فروش کالا', debit: 0, credit: 450000000, description: 'درآمد فروش' }
        ]
      },
      {
        id: '2',
        entry_no: 'JV-002',
        date: '1403/12/14',
        description: 'پرداخت حقوق کارکنان',
        total_debit: 220000000,
        total_credit: 220000000,
        status: 'posted',
        lines: [
          { id: 3, account_id: 11, account_name: 'حقوق و دستمزد', debit: 220000000, credit: 0, description: 'حقوق آذرماه' },
          { id: 4, account_id: 1, account_name: 'نقد و بانک', debit: 0, credit: 220000000, description: 'پرداخت از بانک' }
        ]
      },
      {
        id: '3',
        entry_no: 'JV-003',
        date: '1403/12/13',
        description: 'خرید مواد اولیه',
        total_debit: 150000000,
        total_credit: 150000000,
        status: 'draft',
        lines: [
          { id: 5, account_id: 3, account_name: 'موجودی کالا', debit: 150000000, credit: 0, description: 'خرید تخته لمونشین' },
          { id: 6, account_id: 4, account_name: 'حساب‌های پرداختنی', debit: 0, credit: 150000000, description: 'خرید به نسیه' }
        ]
      }
    ]);

    setTransactions([
      { id: 'TRX-001', date: '1403/12/15', description: 'فروش به شرکت نور', type: 'income', amount: 450000000, account: 'حساب‌های دریافتنی', reference: 'INV-001' },
      { id: 'TRX-002', date: '1403/12/14', description: 'پرداخت حقوق کارکنان', type: 'expense', amount: 220000000, account: 'نقد و بانک', reference: 'PAY-001' },
      { id: 'TRX-003', date: '1403/12/13', description: 'دریافت از مشتری', type: 'income', amount: 125000000, account: 'نقد و بانک', reference: 'REC-001' },
      { id: 'TRX-004', date: '1403/12/12', description: 'پرداخت اجاره مغازه', type: 'expense', amount: 45000000, account: 'نقد و بانک', reference: 'EXP-001' },
      { id: 'TRX-005', date: '1403/12/11', description: 'خرید مواد اولیه', type: 'expense', amount: 150000000, account: 'حساب‌های پرداختنی', reference: 'PO-001' },
    ]);
  }, []);

  const totalAssets = accounts.filter(a => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.type === 'liability').reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = accounts.filter(a => a.type === 'equity').reduce((sum, a) => sum + a.balance, 0);
  const totalRevenue = accounts.filter(a => a.type === 'revenue').reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = accounts.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.balance, 0);
  const netIncome = totalRevenue - totalExpenses;

  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.code.includes(searchQuery)
  );

  const addJournalLine = () => {
    setNewEntry({
      ...newEntry,
      lines: [...newEntry.lines, { account_id: 0, account_name: '', debit: 0, credit: 0, description: '' }]
    });
  };

  const updateLine = (index: number, field: string, value: any) => {
    const lines = [...newEntry.lines];
    lines[index] = { ...lines[index], [field]: value };
    setNewEntry({ ...newEntry, lines });
  };

  const totalDebits = newEntry.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredits = newEntry.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const isBalanced = totalDebits === totalCredits && totalDebits > 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">حسابداری</h1>
          <p className="text-slate-600 mt-1">مدیریت دفاتر، اسناد و گزارشات مالی</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowNewTransactionModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
          >
            <Plus size={18} />
            تراکنش سریع
          </button>
          <button 
            onClick={() => setShowNewEntryModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
          >
            <Receipt size={18} />
            سند جدید
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">دارایی‌های جاری</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatAFN(totalAssets)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Wallet className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">بدهی‌ها</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{formatAFN(totalLiabilities)}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">درآمد خالص</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{formatAFN(netIncome)}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">اسناد ثبت‌نشده</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {journalEntries.filter(e => e.status === 'draft').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <FileText className="text-amber-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex">
            {[
              { id: 'dashboard', label: 'داشبورد مالی', icon: Wallet },
              { id: 'journal', label: 'دفتر روزنامه', icon: Receipt },
              { id: 'accounts', label: 'دفتر کل', icon: FileText },
              { id: 'reports', label: 'گزارشات', icon: TrendingUp },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Financial Overview Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">ترازنامه خلاصه</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-slate-600">جمع دارایی‌ها</span>
                      <span className="font-bold text-blue-600">{formatAFN(totalAssets)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-slate-600">جمع بدهی‌ها</span>
                      <span className="font-bold text-red-600">{formatAFN(totalLiabilities)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-slate-600">سرمایه</span>
                      <span className="font-bold text-purple-600">{formatAFN(totalEquity)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-semibold">تراز</span>
                      <span className={`font-bold ${Math.abs(totalAssets - totalLiabilities - totalEquity) < 1000 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatAFN(totalAssets - totalLiabilities - totalEquity)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">صورت سود و زیان</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-slate-600">درآمدها</span>
                      <span className="font-bold text-emerald-600">{formatAFN(totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-slate-600">هزینه‌ها</span>
                      <span className="font-bold text-red-600">{formatAFN(totalExpenses)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="font-semibold">سود خالص</span>
                      <span className={`font-bold ${netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatAFN(netIncome)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">تراکنش‌های اخیر</h3>
                  <button className="text-sm text-indigo-600 hover:text-indigo-700">
                    مشاهده همه
                  </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">تاریخ</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">شرح</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">حساب</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">مبلغ</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">نوع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {transactions.map(trx => (
                        <tr key={trx.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-600">{trx.date}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{trx.description}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{trx.account}</td>
                          <td className="px-4 py-3 text-sm font-bold">{formatAFN(trx.amount)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                              trx.type === 'income' 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {trx.type === 'income' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              {trx.type === 'income' ? 'درآمد' : 'هزینه'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Journal Tab */}
          {activeTab === 'journal' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="جستجو در اسناد..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    placeholder="از تاریخ"
                    className="px-4 py-2 border border-slate-300 rounded-xl"
                  />
                  <input
                    type="date"
                    placeholder="تا تاریخ"
                    className="px-4 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {journalEntries.map(entry => (
                  <div key={entry.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-4 flex items-center justify-between bg-slate-50">
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-slate-900">{entry.entry_no}</span>
                        <span className="text-sm text-slate-600">{entry.date}</span>
                        <span className="text-sm font-medium text-slate-900">{entry.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          entry.status === 'posted' ? 'bg-emerald-100 text-emerald-700' :
                          entry.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {entry.status === 'posted' ? 'ثبت شده' : 
                           entry.status === 'draft' ? 'پیش‌نویس' : 'برگشتی'}
                        </span>
                        <button className="p-1 hover:bg-slate-200 rounded">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-slate-500">
                            <th className="text-right pb-2">حساب</th>
                            <th className="text-left pb-2">بدهکار</th>
                            <th className="text-left pb-2">بستانکار</th>
                            <th className="text-right pb-2">شرح</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {entry.lines.map(line => (
                            <tr key={line.id}>
                              <td className="py-2">{line.account_name}</td>
                              <td className="py-2 text-left font-mono">
                                {line.debit > 0 ? formatAFN(line.debit) : '-'}
                              </td>
                              <td className="py-2 text-left font-mono">
                                {line.credit > 0 ? formatAFN(line.credit) : '-'}
                              </td>
                              <td className="py-2 text-right text-slate-500">{line.description}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="border-t">
                          <tr className="font-bold">
                            <td className="py-2">جمع</td>
                            <td className="py-2 text-left font-mono">{formatAFN(entry.total_debit)}</td>
                            <td className="py-2 text-left font-mono">{formatAFN(entry.total_credit)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accounts Tab */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="جستجو در حساب‌ها (کد یا نام)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50">
                  <Filter size={18} />
                  فیلتر
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">کد حساب</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">نام حساب</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">نوع</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">مانده</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredAccounts.map(account => (
                      <tr key={account.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-sm">{account.code}</td>
                        <td className="px-4 py-3 font-medium">{account.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${accountTypeColors[account.type]}`}>
                            {accountTypeLabels[account.type]}
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-bold ${account.balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                          {formatAFN(account.balance)}
                        </td>
                        <td className="px-4 py-3">
                          <button 
                            onClick={() => setSelectedAccount(account)}
                            className="text-indigo-600 hover:text-indigo-700 text-sm"
                          >
                            جزئیات
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors text-right">
                  <FileText className="text-indigo-600 mb-3" size={28} />
                  <h3 className="font-semibold text-slate-900">تراز آزمایشی</h3>
                  <p className="text-sm text-slate-600 mt-1">گزارش کلی حساب‌ها با مانده‌های بدهکار و بستانکار</p>
                </button>
                <button className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors text-right">
                  <TrendingUp className="text-emerald-600 mb-3" size={28} />
                  <h3 className="font-semibold text-slate-900">صورت سود و زیان</h3>
                  <p className="text-sm text-slate-600 mt-1">درآمدها و هزینه‌ها برای محاسبه سود خالص</p>
                </button>
                <button className="p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors text-right">
                  <Wallet className="text-blue-600 mb-3" size={28} />
                  <h3 className="font-semibold text-slate-900">ترازنامه</h3>
                  <p className="text-sm text-slate-600 mt-1">دارایی‌ها، بدهی‌ها و سرمایه در تاریخ مشخص</p>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold mb-4">انتخاب بازه زمانی</h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-slate-600 mb-1">از تاریخ</label>
                    <input type="date" className="w-full px-4 py-2 border border-slate-300 rounded-xl" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-slate-600 mb-1">تا تاریخ</label>
                    <input type="date" className="w-full px-4 py-2 border border-slate-300 rounded-xl" />
                  </div>
                  <div className="flex items-end">
                    <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700">
                      نمایش گزارش
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Entry Modal */}
      {showNewEntryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">سند حسابداری جدید</h2>
              <button onClick={() => setShowNewEntryModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">تاریخ</label>
                  <input 
                    type="date" 
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({...newEntry, date: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">شماره سند</label>
                  <input 
                    type="text" 
                    value="JV-004"
                    disabled
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl bg-slate-50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">شرح سند</label>
                <input 
                  type="text" 
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({...newEntry, description: e.target.value})}
                  placeholder="توضیحات کلی سند..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-right text-sm">حساب</th>
                      <th className="px-4 py-2 text-right text-sm">شرح خط</th>
                      <th className="px-4 py-2 text-left text-sm">بدهکار</th>
                      <th className="px-4 py-2 text-left text-sm">بستانکار</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {newEntry.lines.map((line, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-2 py-2">
                          <select 
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                            value={line.account_id}
                            onChange={(e) => updateLine(index, 'account_id', parseInt(e.target.value))}
                          >
                            <option value="0">انتخاب حساب...</option>
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input 
                            type="text" 
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                            placeholder="شرح..."
                            value={line.description}
                            onChange={(e) => updateLine(index, 'description', e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input 
                            type="number" 
                            className="w-full px-2 py-1 border border-slate-300 rounded text-left"
                            placeholder="0"
                            value={line.debit || ''}
                            onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input 
                            type="number" 
                            className="w-full px-2 py-1 border border-slate-300 rounded text-left"
                            placeholder="0"
                            value={line.credit || ''}
                            onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)}
                          />
                        </td>
                        <td className="px-2 py-2">
                          {newEntry.lines.length > 1 && (
                            <button 
                              onClick={() => setNewEntry({...newEntry, lines: newEntry.lines.filter((_, i) => i !== index)})}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XCircle size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50">
                    <tr className="border-t">
                      <td colSpan={2} className="px-4 py-2 font-bold">جمع</td>
                      <td className={`px-4 py-2 font-bold text-left ${totalDebits === totalCredits ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatAFN(totalDebits)}
                      </td>
                      <td className={`px-4 py-2 font-bold text-left ${totalDebits === totalCredits ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatAFN(totalCredits)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <button 
                onClick={addJournalLine}
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
              >
                <Plus size={18} />
                افزودن ردیف
              </button>

              {!isBalanced && totalDebits > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-700">
                  <AlertCircle size={18} />
                  <span>سند بالانس نیست! تفاوت: {formatAFN(Math.abs(totalDebits - totalCredits))}</span>
                </div>
              )}

              {isBalanced && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-2 text-emerald-700">
                  <CheckCircle size={18} />
                  <span>سند بالانس است</span>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end gap-2">
              <button 
                onClick={() => setShowNewEntryModal(false)}
                className="px-6 py-2 border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                انصراف
              </button>
              <button 
                disabled={!isBalanced}
                className={`px-6 py-2 rounded-xl ${
                  isBalanced 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                ثبت سند
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
