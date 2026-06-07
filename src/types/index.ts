/* ─── Core ERP Entities ─── */

export type ItemUnit = 'دانه' | 'سانت' | 'کارتن' | 'متر' | 'لیتر' | 'کیلومتر' | 'لوله' | 'عدد' | 'قوطی' | 'سیت' | 'پاکت';

export interface InventoryItem {
  id: number;
  name: string;
  unit: ItemUnit;
  quantity: number;
  unitPriceAFN: number;
  category?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'active' | 'inactive';
  totalSpent: number;
  lastContact: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  rating: number;
  totalOrders: number;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
  salary: number;
  hireDate: string;
  status: 'active' | 'inactive';
}

/* ─── Transactions (Unified ledger for all modules) ─── */

export type TransactionType =
  | 'sale'          // فروش
  | 'purchase'      // خرید
  | 'expense'       // هزینه
  | 'payroll'       // حقوق
  | 'tax'           // مالیات
  | 'installment'   // قسط
  | 'inventory_in'  // ورود کالا
  | 'inventory_out' // خروج کالا
  | 'payment_in'    // دریافت
  | 'payment_out';  // پرداخت

export type TransactionStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  status: TransactionStatus;
  title: string;
  description: string;
  debit: number;   // بدهکار (افزایش دارایی)
  credit: number;  // بستانکار (کاهش دارایی)
  balance: number; // مانده پس از این تراکنش
  refType: string;
  refId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/* ─── Invoice / Installment ─── */

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
}

export interface InstallmentPlan {
  id: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  installments: { id: string; dueDate: string; amount: number; paid: boolean }[];
  status: 'active' | 'completed' | 'overdue';
}

/* ─── Currencies ─── */

export interface CurrencySettings {
  baseCurrency: 'AFN' | 'USD' | 'EUR' | 'PKR' | 'IRR' | 'CNY';
  secondaryCurrencies: string[];
  rates: Record<string, number>;
  activeCurrencies: string[];
}

/* ─── Reports ─── */

export interface ReportFilter {
  from: string;
  to: string;
  type?: TransactionType | 'all';
  status?: TransactionStatus | 'all';
  minAmount?: number;
  maxAmount?: number;
}

export interface ReportSummary {
  period: string;
  totalTransactions: number;
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
  byType: Record<TransactionType, { count: number; sum: number }>;
  dailyAverage: number;
}

/* ─── Payroll / Tax ─── */

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  baseSalary: number;
  deductions: number;
  bonuses: number;
  netPay: number;
  status: 'pending' | 'processed' | 'paid';
}

export interface TaxRecord {
  id: string;
  type: string;
  period: string;
  amount: number;
  status: 'pending' | 'filed' | 'paid';
  dueDate: string;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  date: string;
  user: string;
}

/* ─── Legacy (for backward compat) ─── */

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
  cost: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

/* ─── Production / Banking / Security ─── */

export type UserRole = 'admin' | 'accountant' | 'inventory' | 'sales';

export interface AppUser {
  username: string;
  password: string;
  name: string;
  role: UserRole;
}

export interface BOMItem {
  itemId: number;
  name: string;
  quantity: number;
  unit: ItemUnit;
  unitCost: number;
}

export interface ProductionRecipe {
  id: string;
  productName: string;
  outputUnit: ItemUnit;
  outputQuantity: number;
  laborCost: number;
  overheadCost: number;
  materials: BOMItem[];
  createdAt: string;
}

export interface ProductionOrder {
  id: string;
  recipeId: string;
  productName: string;
  quantity: number;
  totalCost: number;
  status: 'draft' | 'completed' | 'cancelled';
  date: string;
}

export interface BankAccount {
  id: string;
  name: string;
  bankName: string;
  accountNo: string;
  balance: number;
  currency: string;
}

export interface ChequeRecord {
  id: string;
  chequeNo: string;
  partyName: string;
  amount: number;
  dueDate: string;
  type: 'received' | 'issued';
  status: 'pending' | 'cleared' | 'returned';
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger';
  module: string;
  createdAt: string;
  read: boolean;
}
