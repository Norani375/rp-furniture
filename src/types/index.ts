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

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
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

export type ItemUnit = 'دانه' | 'سانت' | 'کارتن' | 'متر' | 'لیتر' | 'کیلومتر' | 'لوله' | 'عدد' | 'قوطی' | 'سیت' | 'پاکت';

export interface InventoryItem {
  id: number;
  name: string;
  unit: ItemUnit;
  quantity: number;
  unitPriceAFN: number;
}

export interface CurrencySettings {
  baseCurrency: 'AFN' | 'USD' | 'EUR' | 'PKR' | 'IRR' | 'CNY';
  secondaryCurrencies: Array<'USD' | 'EUR' | 'PKR' | 'IRR' | 'CNY'>;
  rates: Record<string, number>;
  activeCurrencies: string[];
}

export interface InstallmentPlan {
  id: string;
  customerName: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  installments: {
    id: string;
    dueDate: string;
    amount: number;
    paid: boolean;
  }[];
  status: 'active' | 'completed' | 'overdue';
}
