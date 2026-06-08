import { useMemo, useState } from "react";
import {
  ArrowUp, Bell, Boxes, Building2, Calendar, CheckCircle,
  ChevronLeft, ChevronRight, Database, DollarSign, FileBarChart,
  FileText, LayoutDashboard, LogOut, Package, Plus,
  Receipt, Search, Settings as SettingsIcon, TrendingUp, Truck, UserCog,
  Users
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { inventoryItems as initialInventory, supportedCurrencies } from "./data/mockData";
import MinimalInvoice, { type DocumentType } from "./components/MinimalInvoice";
import EditModal, { type EditField } from "./components/EditModal";
import ActionButtons from "./components/ActionButtons";
import ToastContainer, { showToast } from "./components/Toast";
import Accounting from "./pages/Accounting";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./store/AuthContext";
import type { InstallmentPlan, InventoryItem } from "./types";
import { api } from "./services/api";
import { useEffect } from "react";

type Page = "dashboard" | "sales" | "purchases" | "catalog" | "raw-materials" | "customers" | "suppliers" | "accounting" | "installments" | "payroll" | "currencies" | "reports" | "settings";

const formatAFN = (value: number) => `${new Intl.NumberFormat("fa-AF").format(Math.round(value))} افغانی`;
const TAX_RATE = 5; // 5% VAT

const sidebarItems: Array<{ id: Page; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { id: "sales", label: "فروش و فاکتور", icon: TrendingUp },
  { id: "purchases", label: "خرید", icon: Truck },
  { id: "catalog", label: "انبار", icon: Boxes },
  { id: "raw-materials", label: "مواد اولیه", icon: Package },
  { id: "customers", label: "مشتریان", icon: Users },
  { id: "suppliers", label: "تامین کنندگان", icon: Building2 },
  { id: "accounting", label: "حسابداری", icon: Receipt },
  { id: "installments", label: "اقساط", icon: Calendar },
  { id: "payroll", label: "حقوق و دستمزد", icon: UserCog },
  { id: "currencies", label: "ارزها", icon: DollarSign },
  { id: "reports", label: "گزارشات دقیق", icon: FileBarChart },
  { id: "settings", label: "تنظیمات", icon: SettingsIcon },
];

// ============ Initial Data ============
const initialPlans: InstallmentPlan[] = [
  { id: "INS-001", customerName: "احمد درافشان", totalAmount: 1850000, paidAmount: 1200000, remainingAmount: 650000, dueDate: "1404/01/10", status: "active", installments: [{ id: "1", dueDate: "1403/12/10", amount: 500000, paid: true }, { id: "2", dueDate: "1403/12/25", amount: 700000, paid: true }, { id: "3", dueDate: "1404/01/10", amount: 650000, paid: false }] },
  { id: "INS-002", customerName: "محمد مراد", totalAmount: 950000, paidAmount: 200000, remainingAmount: 750000, dueDate: "1404/01/05", status: "overdue", installments: [{ id: "1", dueDate: "1403/11/20", amount: 300000, paid: true }, { id: "2", dueDate: "1403/12/05", amount: 650000, paid: false }] },
  { id: "INS-003", customerName: "حاجی کریم", totalAmount: 3200000, paidAmount: 3200000, remainingAmount: 0, dueDate: "1403/12/01", status: "completed", installments: [{ id: "1", dueDate: "1403/10/01", amount: 800000, paid: true }, { id: "2", dueDate: "1403/11/01", amount: 800000, paid: true }, { id: "3", dueDate: "1403/12/01", amount: 1600000, paid: true }] },
];

interface Customer { id: string; name: string; phone: string; city: string; balance: number; status: string; }
interface Supplier { id: string; name: string; contact: string; phone: string; city: string; orders: number; }
interface Employee { id: string; name: string; department: string; salary: number; bonus: number; deduction: number; status: string; }
interface Invoice { id: string; customer: string; date: string; items: number; subtotal: number; tax: number; total: number; paid: number; status: 'paid' | 'pending' | 'installment'; }
interface PurchaseOrder { id: string; supplier: string; date: string; items: number; total: number; status: 'received' | 'pending' | 'sent'; }
interface RawMaterial { 
  id: number; 
  sku: string; 
  name: string; 
  unit: string; 
  quantity: number; 
  min_stock: number; 
  unit_cost_afn: number; 
  unit_sell_price_afn: number; 
  supplier_name?: string;
  category: string; 
}

const initialCustomers: Customer[] = [
  { id: "C-001", name: "احمد درافشان", phone: "0700123456", city: "کابل", balance: 650000, status: "active" },
  { id: "C-002", name: "محمد مراد", phone: "0700654321", city: "هرات", balance: 750000, status: "overdue" },
  { id: "C-003", name: "علی حسینی", phone: "0700789456", city: "مزار شریف", balance: 0, status: "active" },
  { id: "C-004", name: "حاجی کریم", phone: "0799112233", city: "کابل", balance: 0, status: "vip" },
];

const initialSuppliers: Supplier[] = [
  { id: "S-001", name: "تامین کننده الف", contact: "اکبر احمد", phone: "0700111111", city: "کابل", orders: 45 },
  { id: "S-002", name: "تامین کننده ب", contact: "محمد رضا", phone: "0700222222", city: "هرات", orders: 28 },
  { id: "S-003", name: "تامین کننده چوب مرکزی", contact: "نصیر احمد", phone: "0700333444", city: "کابل", orders: 19 },
];

const initialEmployees: Employee[] = [
  { id: "EMP-001", name: "علی محمدی", department: "فروش", salary: 95000, bonus: 5000, deduction: 9500, status: "paid" },
  { id: "EMP-002", name: "سارا احمدی", department: "حسابداری", salary: 75000, bonus: 3000, deduction: 7500, status: "processing" },
  { id: "EMP-003", name: "نرگس موسوی", department: "انبار", salary: 55000, bonus: 1500, deduction: 5500, status: "pending" },
];

const initialInvoices: Invoice[] = [
  { id: "INV-001", customer: "احمد درافشان", date: "1403/12/15", items: 3, subtotal: 53500, tax: 2675, total: 56175, paid: 56175, status: "paid" },
  { id: "INV-002", customer: "محمد مراد", date: "1403/12/14", items: 5, subtotal: 950000, tax: 47500, total: 997500, paid: 200000, status: "installment" },
  { id: "INV-003", customer: "شرکت نور", date: "1403/12/12", items: 8, subtotal: 4500000, tax: 225000, total: 4725000, paid: 0, status: "pending" },
];

const initialPurchases: PurchaseOrder[] = [
  { id: "PO-001", supplier: "تامین کننده الف", date: "1403/12/10", items: 12, total: 2200000, status: "received" },
  { id: "PO-002", supplier: "تامین کننده ب", date: "1403/12/13", items: 5, total: 850000, status: "pending" },
  { id: "PO-003", supplier: "تامین کننده چوب مرکزی", date: "1403/12/14", items: 25, total: 3500000, status: "sent" },
];

const revenueTrend = [
  { month: "مهر", revenue: 420000000, expense: 310000000 },
  { month: "آبان", revenue: 580000000, expense: 340000000 },
  { month: "آذر", revenue: 650000000, expense: 390000000 },
  { month: "دی", revenue: 710000000, expense: 410000000 },
];

const categoryShare = [
  { name: "تخته", value: 42, color: "#4f46e5" },
  { name: "الماری", value: 28, color: "#10b981" },
  { name: "یراق", value: 19, color: "#f59e0b" },
  { name: "سایر", value: 11, color: "#ef4444" },
];

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    paid: { bg: "bg-emerald-100", text: "text-emerald-700", label: "پرداخت شده" },
    pending: { bg: "bg-amber-100", text: "text-amber-700", label: "در انتظار" },
    installment: { bg: "bg-indigo-100", text: "text-indigo-700", label: "قسطی" },
    received: { bg: "bg-emerald-100", text: "text-emerald-700", label: "دریافت شد" },
    sent: { bg: "bg-blue-100", text: "text-blue-700", label: "ارسال شد" },
    active: { bg: "bg-emerald-100", text: "text-emerald-700", label: "فعال" },
    overdue: { bg: "bg-red-100", text: "text-red-700", label: "معوق" },
    vip: { bg: "bg-violet-100", text: "text-violet-700", label: "ویژه" },
    processing: { bg: "bg-blue-100", text: "text-blue-700", label: "پردازش" },
    completed: { bg: "bg-emerald-100", text: "text-emerald-700", label: "تکمیل" },
  };
  const cfg = map[status] || { bg: "bg-slate-100", text: "text-slate-700", label: status };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
}

function AppContent() {
  const { user, isAuthenticated, logout } = useAuth();
  const [page, setPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // States for all modules
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [plans, setPlans] = useState<InstallmentPlan[]>(initialPlans);
  const [customers, setCustomers] = useState(initialCustomers);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [employees, setEmployees] = useState(initialEmployees);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [purchases, setPurchases] = useState(initialPurchases);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  
  // Modal states
  const [printDoc, setPrintDoc] = useState<any>(null);
  const [editModal, setEditModal] = useState<{ title: string; fields: EditField[]; data: any; onSave: (data: any) => void } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      api.getInventory().then(data => setInventory(data.map((i: any) => ({ ...i, unitPriceAFN: Number(i.unit_price_afn) }))));
      api.getCustomers().then(data => setCustomers(data.map((c: any) => ({ id: c.id, name: c.name, phone: c.phone || '', city: c.city || '', balance: Number(c.balance) || 0, status: c.status || 'active' }))));
      api.getSuppliers().then(data => setSuppliers(data.map((s: any) => ({ id: s.id, name: s.name, contact: s.contact_person || '', phone: s.phone || '', city: s.city || '', orders: s.total_orders || 0 }))));
      api.getEmployees().then(data => setEmployees(data.map((e: any) => ({ id: e.id, name: e.first_name + ' ' + e.last_name, department: e.department || '', salary: Number(e.salary) || 0, bonus: 0, deduction: 0, status: 'paid' }))));
      api.getInvoices().then(data => setInvoices(data.map((i: any) => ({ id: i.id, customer: i.customer_name || 'مشتری', date: i.invoice_date, items: 1, subtotal: Number(i.subtotal), tax: Number(i.tax_amount) || 0, total: Number(i.total_amount), paid: Number(i.paid_amount), status: i.status }))));
      api.getPurchases().then(data => setPurchases(data.map((p: any) => ({ id: p.id, supplier: 'تامین کننده', date: p.order_date, items: 1, total: Number(p.total_amount), status: p.status }))));
      api.getPlans().then(setPlans);
      api.getRawMaterials().then(data => setRawMaterials(data.map((rm: any) => ({
        id: rm.id,
        sku: rm.sku,
        name: rm.name,
        unit: rm.unit,
        quantity: Number(rm.quantity),
        min_stock: Number(rm.min_stock),
        unit_cost_afn: Number(rm.unit_cost_afn),
        unit_sell_price_afn: Number(rm.unit_sell_price_afn),
        supplier_name: rm.supplier_name || '',
        category: rm.category || ''
      }))));
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return <Login />;

  // ============ FORMULAS / TRIGGERS ============
  // These automatically recalculate when data changes
  
  const stats = useMemo(() => {
    const totalValue = inventory.reduce((sum, item) => sum + item.quantity * item.unitPriceAFN, 0);
    const lowStock = inventory.filter(item => item.quantity < 10).length;
    
    // Sales formulas
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + inv.paid, 0);
    const totalReceivable = totalRevenue - totalCollected;
    
    // Purchase formulas
    const totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
    
    // Installment formulas (triggered when payments change)
    const activePlans = plans.filter(p => p.status === "active").length;
    const overduePlans = plans.filter(p => p.status === "overdue").length;
    const totalInstallmentReceivable = plans.reduce((sum, p) => sum + p.remainingAmount, 0);
    
    // Payroll formulas
    const totalSalaries = employees.reduce((sum, e) => sum + (e.salary + e.bonus - e.deduction), 0);
    
    // Profit formula: Revenue - Purchases - Salaries
    const grossProfit = totalRevenue - totalPurchases - totalSalaries;
    
    return {
      totalItems: inventory.length,
      totalValue,
      lowStock,
      totalRevenue,
      totalCollected,
      totalReceivable,
      totalPurchases,
      activePlans,
      overduePlans,
      totalInstallmentReceivable,
      totalSalaries,
      grossProfit,
      customersCount: customers.length,
      suppliersCount: suppliers.length,
    };
  }, [inventory, plans, customers, suppliers, employees, invoices, purchases]);

  const filteredInventory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter(item => item.name.toLowerCase().includes(q) || String(item.id).includes(q));
  }, [inventory, searchQuery]);

  // ============ Delete Handlers ============
  const handleDelete = async (type: 'inventory' | 'customer' | 'supplier' | 'employee' | 'invoice' | 'purchase' | 'installment' | 'raw-material', id: string | number, label: string, setState: React.Dispatch<React.SetStateAction<any[]>>) => {
    if (!confirm(`آیا از حذف "${label}" اطمینان دارید؟\nاین عمل غیرقابل بازگشت است.`)) return;
    
    // 🔥 ALWAYS remove from frontend state first (optimistic update)
    setState((prev: any[]) => prev.filter(item => item.id !== id));
    showToast('success', `"${label}" حذف شد`);
    
    // Then try to sync with backend (if available)
    try {
      const apiMap: Record<string, (id: any) => Promise<any>> = {
        inventory: api.deleteInventory,
        customer: api.deleteCustomer,
        supplier: api.deleteSupplier,
        employee: api.deleteEmployee,
        invoice: api.deleteInvoice,
        purchase: api.deletePurchase,
        installment: api.deletePlan,
        'raw-material': api.deleteRawMaterial,
      };
      
      await apiMap[type](id);
      console.log(`✅ Deleted from database: ${type} #${id}`);
    } catch (error: any) {
      // Backend offline - data still removed from UI
      console.warn(`⚠️ Removed from UI (backend offline): ${error.message}`);
      showToast('warning', 'حذف از UI انجام شد (backend آفلاین)');
    }
  };

  // ============ ACTIONS ============
  
  const payInstallment = (planId: string, installmentId: string) => {
    setPlans(prev => prev.map(plan => {
      if (plan.id !== planId) return plan;
      const updated = plan.installments.map(i => i.id === installmentId ? { ...i, paid: true } : i);
      const paidAmount = updated.reduce((s, i) => s + (i.paid ? i.amount : 0), 0);
      return {
        ...plan,
        installments: updated,
        paidAmount,
        remainingAmount: plan.totalAmount - paidAmount,
        status: updated.every(i => i.paid) ? "completed" : "active",
      };
    }));
  };

  // ============ PRINT HANDLERS ============
  
  const printInventoryItem = (item: InventoryItem) => {
    setPrintDoc({
      type: 'inventory' as DocumentType,
      documentNumber: `ITM-${item.id}`,
      date: new Date().toLocaleDateString('fa-IR'),
      title: 'مشخصات کالا',
      partyName: item.name,
      partyDetails: {},
      fields: [
        { label: 'واحد', value: item.unit },
        { label: 'موجودی', value: item.quantity },
        { label: 'قیمت واحد', value: item.unitPriceAFN, type: 'currency' as const },
        { label: 'ارزش کل', value: item.unitPriceAFN * item.quantity, type: 'currency' as const },
      ],
      rows: [{ description: item.name, qty: item.quantity, unit: item.unit, price: item.unitPriceAFN, total: item.unitPriceAFN * item.quantity }],
      taxRate: TAX_RATE,
    });
  };

  const printInvoice = (inv: Invoice) => {
    setPrintDoc({
      type: 'sales' as DocumentType,
      documentNumber: inv.id,
      date: inv.date,
      title: 'مشتری',
      partyName: inv.customer,
      partyDetails: {},
      rows: Array(inv.items).fill(0).map((_, i) => ({
        description: `قلم ${i + 1} از سفارش`,
        qty: Math.floor(Math.random() * 10) + 1,
        unit: 'دانه',
        price: Math.floor(inv.subtotal / inv.items),
        total: Math.floor(inv.subtotal / inv.items),
      })),
      subtotal: inv.subtotal,
      tax: inv.tax,
      taxRate: TAX_RATE,
      total: inv.total,
      paidAmount: inv.paid,
    });
  };

  const printPurchase = (p: PurchaseOrder) => {
    setPrintDoc({
      type: 'purchase' as DocumentType,
      documentNumber: p.id,
      date: p.date,
      title: 'تامین‌کننده',
      partyName: p.supplier,
      partyDetails: {},
      rows: Array(p.items).fill(0).map((_, i) => ({
        description: `قلم خرید ${i + 1}`,
        qty: Math.floor(Math.random() * 20) + 1,
        unit: 'دانه',
        price: Math.floor(p.total / p.items),
        total: Math.floor(p.total / p.items),
      })),
      total: p.total,
    });
  };

  const printCustomer = (c: Customer) => {
    setPrintDoc({
      type: 'customer' as DocumentType,
      documentNumber: c.id,
      date: new Date().toLocaleDateString('fa-IR'),
      title: 'مشتری',
      partyName: c.name,
      partyDetails: { phone: c.phone, address: c.city },
      fields: [
        { label: 'مانده حساب', value: c.balance, type: 'currency' as const },
        { label: 'وضعیت', value: c.status },
      ],
      notes: 'این صورتحساب شامل تمام تراکنش‌های مشتری است.',
    });
  };

  const printSupplier = (s: Supplier) => {
    setPrintDoc({
      type: 'supplier' as DocumentType,
      documentNumber: s.id,
      date: new Date().toLocaleDateString('fa-IR'),
      title: 'تامین‌کننده',
      partyName: s.name,
      partyDetails: { phone: s.phone, address: s.city },
      fields: [
        { label: 'نام تماس', value: s.contact },
        { label: 'تعداد سفارش', value: s.orders },
      ],
    });
  };

  const printPayroll = (e: Employee) => {
    const netPay = e.salary + e.bonus - e.deduction;
    setPrintDoc({
      type: 'payroll' as DocumentType,
      documentNumber: e.id,
      date: new Date().toLocaleDateString('fa-IR'),
      title: 'کارمند',
      partyName: e.name,
      partyDetails: {},
      fields: [
        { label: 'بخش', value: e.department },
        { label: 'حقوق پایه', value: e.salary, type: 'currency' as const },
        { label: 'پاداش', value: e.bonus, type: 'currency' as const },
        { label: 'کسورات', value: e.deduction, type: 'currency' as const },
        { label: 'خالص پرداختی', value: netPay, type: 'currency' as const },
      ],
      rows: [
        { description: 'حقوق پایه', total: e.salary },
        { description: 'پاداش و اضافه‌کاری', total: e.bonus },
        { description: 'کسورات (مالیات/بیمه)', total: -e.deduction },
      ],
      total: netPay,
    });
  };

  const printPlan = (plan: InstallmentPlan) => {
    setPrintDoc({
      type: 'installment' as DocumentType,
      documentNumber: plan.id,
      date: plan.dueDate,
      title: 'مشتری قسطی',
      partyName: plan.customerName,
      partyDetails: {},
      rows: plan.installments.map((i, idx) => ({
        description: `قسط شماره ${idx + 1} - ${i.paid ? 'پرداخت شده' : 'پرداخت نشده'}`,
        qty: idx + 1,
        unit: i.dueDate,
        total: i.amount,
      })),
      total: plan.totalAmount,
      paidAmount: plan.paidAmount,
    });
  };

  // ============ EDIT HANDLERS ============
  
  const editInventory = (item: InventoryItem) => {
    setEditModal({
      title: 'ویرایش کالا',
      fields: [
        { key: 'name', label: 'نام کالا', required: true },
        { key: 'unit', label: 'واحد', required: true },
        { key: 'quantity', label: 'موجودی', type: 'number', required: true },
        { key: 'unitPriceAFN', label: 'قیمت واحد (افغانی)', type: 'number', required: true },
      ],
      data: item,
      onSave: (data) => {
        if (item.id.toString().startsWith('NEW-')) {
          api.addInventory({ name: data.name, unit: data.unit, quantity: data.quantity, unit_price_afn: data.unitPriceAFN }).then((res: any) => {
            setInventory(prev => [{...res, unitPriceAFN: Number(res.unit_price_afn)}, ...prev.filter(i => i.id !== item.id)]);
            setEditModal(null);
          });
        } else {
          api.updateInventory(item.id, { name: data.name, unit: data.unit, quantity: data.quantity, unit_price_afn: data.unitPriceAFN }).then(() => {
            setInventory(prev => prev.map(i => i.id === item.id ? { ...i, ...data } : i));
            setEditModal(null);
          });
        }
      },
    });
  };

  const editRawMaterial = (rm: RawMaterial) => {
    setEditModal({
      title: 'ویرایش مواد اولیه',
      fields: [
        { key: 'sku', label: 'SKU', required: true },
        { key: 'name', label: 'نام ماده', required: true },
        { key: 'unit', label: 'واحد', required: true },
        { key: 'category', label: 'دسته' },
        { key: 'quantity', label: 'موجودی', type: 'number', required: true },
        { key: 'min_stock', label: 'حداقل موجودی', type: 'number' },
        { key: 'unit_cost_afn', label: 'قیمت خرید (افغانی)', type: 'number', required: true },
        { key: 'unit_sell_price_afn', label: 'قیمت فروش (افغانی)', type: 'number', required: true },
      ],
      data: rm,
      onSave: (data) => {
        if (rm.sku.startsWith('RM-') && !rm.id) {
          api.addRawMaterial(data).then((res: any) => {
            setRawMaterials(prev => [...prev.filter(x => x.id !== rm.id), { ...data, id: res.id }]);
            setEditModal(null);
          });
        } else {
          api.updateRawMaterial(rm.id, data).then(() => {
            setRawMaterials(prev => prev.map(x => x.id === rm.id ? { ...x, ...data } : x));
            setEditModal(null);
          });
        }
      },
    });
  };

  const printRawMaterial = (rm: RawMaterial) => {
    setPrintDoc({
      type: 'inventory' as DocumentType,
      documentNumber: rm.sku,
      date: new Date().toLocaleDateString('fa-IR'),
      title: 'مواد اولیه',
      partyName: rm.name,
      partyDetails: {},
      fields: [
        { label: 'SKU', value: rm.sku },
        { label: 'دسته', value: rm.category },
        { label: 'واحد', value: rm.unit },
        { label: 'موجودی', value: rm.quantity },
        { label: 'حداقل موجودی', value: rm.min_stock },
        { label: 'قیمت خرید', value: rm.unit_cost_afn, type: 'currency' as const },
        { label: 'قیمت فروش', value: rm.unit_sell_price_afn, type: 'currency' as const },
        { label: 'سود/واحد', value: rm.unit_sell_price_afn - rm.unit_cost_afn, type: 'currency' as const },
        { label: 'ارزش کل', value: rm.quantity * rm.unit_sell_price_afn, type: 'currency' as const },
      ],
      rows: [{ description: rm.name, qty: rm.quantity, unit: rm.unit, price: rm.unit_sell_price_afn, total: rm.quantity * rm.unit_sell_price_afn }],
      taxRate: TAX_RATE,
    });
  };

  const editCustomer = (c: Customer) => {
    setEditModal({
      title: 'ویرایش مشتری',
      fields: [
        { key: 'name', label: 'نام', required: true },
        { key: 'phone', label: 'تلفن', type: 'tel' },
        { key: 'city', label: 'شهر' },
        { key: 'balance', label: 'مانده', type: 'number' },
        { key: 'status', label: 'وضعیت', type: 'select', options: [
          { value: 'active', label: 'فعال' },
          { value: 'overdue', label: 'معوق' },
          { value: 'vip', label: 'ویژه' },
        ]},
      ],
      data: c,
      onSave: (data) => {
        if (c.id.startsWith('NEW-')) {
          api.addCustomer(data).then((res: any) => { setCustomers(prev => [...prev.filter(x => x.id !== c.id), { ...data, id: res.id }]); setEditModal(null); });
        } else {
          api.updateCustomer(c.id, data).then(() => { setCustomers(prev => prev.map(x => x.id === c.id ? { ...x, ...data } : x)); setEditModal(null); });
        }
      },
    });
  };

  const editSupplier = (s: Supplier) => {
    setEditModal({
      title: 'ویرایش تامین‌کننده',
      fields: [
        { key: 'name', label: 'نام', required: true },
        { key: 'contact', label: 'نام تماس' },
        { key: 'phone', label: 'تلفن', type: 'tel' },
        { key: 'city', label: 'شهر' },
        { key: 'orders', label: 'تعداد سفارش', type: 'number' },
      ],
      data: s,
      onSave: (data) => {
        if (s.id.startsWith('NEW-')) {
          api.addSupplier(data).then((res: any) => { setSuppliers(prev => [...prev.filter(x => x.id !== s.id), { ...data, id: res.id }]); setEditModal(null); });
        } else {
          api.updateSupplier(s.id, data).then(() => { setSuppliers(prev => prev.map(x => x.id === s.id ? { ...x, ...data } : x)); setEditModal(null); });
        }
      },
    });
  };

  const editEmployee = (e: Employee) => {
    setEditModal({
      title: 'ویرایش کارمند',
      fields: [
        { key: 'name', label: 'نام', required: true },
        { key: 'department', label: 'بخش' },
        { key: 'salary', label: 'حقوق پایه', type: 'number', required: true },
        { key: 'bonus', label: 'پاداش', type: 'number' },
        { key: 'deduction', label: 'کسورات', type: 'number' },
        { key: 'status', label: 'وضعیت', type: 'select', options: [
          { value: 'paid', label: 'پرداخت شد' },
          { value: 'processing', label: 'پردازش' },
          { value: 'pending', label: 'در انتظار' },
        ]},
      ],
      data: e,
      onSave: (data) => {
        const [first, ...rest] = data.name.split(' ');
        if (e.id.startsWith('NEW-')) {
          api.addEmployee({ first_name: first, last_name: rest.join(' '), department: data.department, salary: data.salary }).then((res: any) => { setEmployees(prev => [...prev.filter(x => x.id !== e.id), { ...data, id: res.id }]); setEditModal(null); });
        } else {
          api.updateEmployee(e.id, { first_name: first, last_name: rest.join(' '), department: data.department, salary: data.salary }).then(() => { setEmployees(prev => prev.map(x => x.id === e.id ? { ...x, ...data } : x)); setEditModal(null); });
        }
      },
    });
  };

  const editInvoice = (inv: Invoice) => {
    setEditModal({
      title: 'ویرایش فاکتور',
      fields: [
        { key: 'customer', label: 'مشتری', required: true },
        { key: 'date', label: 'تاریخ' },
        { key: 'items', label: 'تعداد اقلام', type: 'number' },
        { key: 'subtotal', label: 'جمع جزء', type: 'number' },
        { key: 'paid', label: 'پرداخت شده', type: 'number' },
      ],
      data: inv,
      onSave: (data) => {
        // Trigger: Auto-recalculate tax and total
        const tax = Math.round(data.subtotal * TAX_RATE / 100);
        const total = data.subtotal + tax;
        const status = data.paid >= total ? 'paid' : data.paid > 0 ? 'installment' : 'pending';
        setInvoices(prev => prev.map(x => x.id === inv.id ? { ...x, ...data, tax, total, status } : x));
        setEditModal(null);
      },
    });
  };

  const editPurchase = (p: PurchaseOrder) => {
    setEditModal({
      title: 'ویرایش سفارش خرید',
      fields: [
        { key: 'supplier', label: 'تامین‌کننده', required: true },
        { key: 'date', label: 'تاریخ' },
        { key: 'items', label: 'تعداد اقلام', type: 'number' },
        { key: 'total', label: 'مبلغ کل', type: 'number' },
        { key: 'status', label: 'وضعیت', type: 'select', options: [
          { value: 'received', label: 'دریافت شد' },
          { value: 'sent', label: 'ارسال شد' },
          { value: 'pending', label: 'در انتظار' },
        ]},
      ],
      data: p,
      onSave: (data) => {
        setPurchases(prev => prev.map(x => x.id === p.id ? { ...x, ...data } : x));
        setEditModal(null);
      },
    });
  };

  // ============ ADD HANDLERS ============
  
  const addInventory = () => {
    const newId = Math.max(...inventory.map(i => i.id), 0) + 1;
    editInventory({ id: newId, name: '', unit: 'دانه', quantity: 0, unitPriceAFN: 0 } as InventoryItem);
  };

  const addCustomer = () => {
    const id = `C-${String(customers.length + 1).padStart(3, '0')}`;
    editCustomer({ id, name: '', phone: '', city: '', balance: 0, status: 'active' });
  };

  const addSupplier = () => {
    const id = `S-${String(suppliers.length + 1).padStart(3, '0')}`;
    editSupplier({ id, name: '', contact: '', phone: '', city: '', orders: 0 });
  };

  const addEmployee = () => {
    const id = `EMP-${String(employees.length + 1).padStart(3, '0')}`;
    editEmployee({ id, name: '', department: '', salary: 0, bonus: 0, deduction: 0, status: 'pending' });
  };

  const addInvoice = () => {
    const id = `INV-${String(invoices.length + 1).padStart(3, '0')}`;
    editInvoice({ id, customer: '', date: new Date().toLocaleDateString('fa-IR'), items: 0, subtotal: 0, tax: 0, total: 0, paid: 0, status: 'pending' });
  };

  const addPurchase = () => {
    const id = `PO-${String(purchases.length + 1).padStart(3, '0')}`;
    editPurchase({ id, supplier: '', date: new Date().toLocaleDateString('fa-IR'), items: 0, total: 0, status: 'pending' });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50" dir="rtl">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-72" : "w-20"} flex flex-shrink-0 flex-col border-l border-slate-200 bg-white transition-all duration-300`}>
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xl font-bold text-white">E</div>
          {sidebarOpen && (
            <div>
              <div className="font-bold text-slate-900">ERP Furniture</div>
              <div className="text-xs text-slate-500">Neon online</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-auto p-3">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => setPage(item.id)}
                className={`mb-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${active ? "bg-indigo-600 text-white shadow-md" : "text-slate-700 hover:bg-slate-100"}`}>
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 font-bold text-indigo-700">{user?.fullName?.charAt(0) || "U"}</div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{user?.fullName}</div>
                <div className="text-xs text-slate-500">{user?.role === "admin" ? "مدیر سیستم" : user?.role}</div>
              </div>
            )}
          </div>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
            <LogOut size={20} />
            {sidebarOpen && <span>خروج از سیستم</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(o => !o)} className="rounded-xl p-2 hover:bg-slate-100">
              {sidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{sidebarItems.find(i => i.id === page)?.label}</h1>
              <p className="text-xs text-slate-500">سیستم یکپارچه با فرمول‌ها و تریگرهای خودکار</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden w-64 md:block">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="جستجو..." className="w-full rounded-2xl border border-transparent bg-slate-100 py-2 pl-4 pr-10 text-sm outline-none focus:border-slate-300" />
            </div>
            <button className="relative rounded-xl p-2 hover:bg-slate-100">
              <Bell size={20} />
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">{stats.lowStock + stats.overduePlans}</span>
            </button>
          </div>
        </header>

        <section className="flex-1 overflow-auto p-6">
          {/* DASHBOARD */}
          {page === "dashboard" && (
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">خوش آمدید، {user?.fullName?.split(" ")[0]} جان</h2>
                  <p className="mt-1 text-slate-600">آمار با فرمول و تریگرهای خودکار محاسبه شده است</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: "ارزش انبار", value: `${(stats.totalValue / 1_000_000).toFixed(1)}M`, sub: `${stats.totalItems} قلم • ${stats.lowStock} کمبود`, icon: Package, color: "text-emerald-500" },
                  { label: "درآمد کل (فروش)", value: `${(stats.totalRevenue / 1_000_000).toFixed(1)}M`, sub: `${formatAFN(stats.totalCollected)} وصول شد`, icon: TrendingUp, color: "text-blue-500" },
                  { label: "مطالبات (فاکتور+قسط)", value: `${((stats.totalReceivable + stats.totalInstallmentReceivable) / 1_000_000).toFixed(1)}M`, sub: `${stats.overduePlans} قسط معوق`, icon: Calendar, color: "text-rose-500" },
                  { label: "سود ناخالص", value: `${(stats.grossProfit / 1_000_000).toFixed(1)}M`, sub: "= درآمد - خرید - حقوق", icon: FileText, color: stats.grossProfit >= 0 ? "text-emerald-500" : "text-red-500" },
                ].map((card) => (
                  <div key={card.label} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <div className="flex justify-between gap-4">
                      <div>
                        <div className="text-xs uppercase tracking-widest text-slate-500">{card.label}</div>
                        <div className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</div>
                        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500"><ArrowUp size={14} /> {card.sub}</div>
                      </div>
                      <card.icon className={card.color} size={42} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-7">
                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 xl:col-span-4">
                  <h3 className="mb-5 text-lg font-semibold">روند درآمد و هزینه</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={v => `${(Number(v) / 100_000_000).toFixed(0)}B`} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: any) => formatAFN(Number(v))} />
                      <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} />
                      <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 xl:col-span-3">
                  <h3 className="mb-5 text-lg font-semibold">خلاصه عملیات</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between p-3 rounded-xl bg-slate-50"><span>کل فاکتورها:</span><span className="font-bold">{invoices.length}</span></div>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-50"><span>کل خریدها:</span><span className="font-bold">{purchases.length}</span></div>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-50"><span>مشتریان فعال:</span><span className="font-bold">{stats.customersCount}</span></div>
                    <div className="flex justify-between p-3 rounded-xl bg-slate-50"><span>تامین‌کنندگان:</span><span className="font-bold">{stats.suppliersCount}</span></div>
                    <div className="flex justify-between p-3 rounded-xl bg-emerald-50"><span>کل حقوق ماه:</span><span className="font-bold text-emerald-600">{formatAFN(stats.totalSalaries)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CATALOG */}
          {page === "catalog" && (
            <div className="space-y-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-bold">انبار و موجودی</h2>
                  <p className="text-sm text-slate-500">{filteredInventory.length} قلم • ارزش کل: {formatAFN(stats.totalValue)}</p>
                </div>
                <button onClick={addInventory} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
                  <Plus size={16} /> افزودن کالا
                </button>
              </div>

              <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-3 text-right">کد</th>
                      <th className="px-5 py-3 text-right">نام کالا</th>
                      <th className="px-5 py-3 text-right">واحد</th>
                      <th className="px-5 py-3 text-right">موجودی</th>
                      <th className="px-5 py-3 text-right">قیمت</th>
                      <th className="px-5 py-3 text-right">ارزش</th>
                      <th className="px-5 py-3 text-right">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInventory.slice(0, 20).map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono text-slate-400">ITM-{item.id}</td>
                        <td className="px-5 py-3 font-medium">{item.name}</td>
                        <td className="px-5 py-3 text-slate-500">{item.unit}</td>
                        <td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs ${item.quantity < 10 ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{item.quantity}</span></td>
                        <td className="px-5 py-3">{formatAFN(item.unitPriceAFN)}</td>
                        <td className="px-5 py-3 font-semibold">{formatAFN(item.unitPriceAFN * item.quantity)}</td>
                        <td className="px-5 py-3">
                          <ActionButtons
                            onPrint={() => printInventoryItem(item)}
                            onEdit={() => editInventory(item)}
                            onDelete={() => handleDelete('inventory', item.id, item.name, setInventory)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RAW MATERIALS */}
          {page === "raw-materials" && (
            <div className="space-y-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-bold">مواد اولیه</h2>
                  <p className="text-sm text-slate-500">
                    {rawMaterials.length} قلم • 
                    ارزش کل: {formatAFN(rawMaterials.reduce((sum, rm) => sum + rm.quantity * rm.unit_sell_price_afn, 0))} • 
                    سود پتانسیل: {formatAFN(rawMaterials.reduce((sum, rm) => sum + rm.quantity * (rm.unit_sell_price_afn - rm.unit_cost_afn), 0))}
                  </p>
                </div>
                <button onClick={() => {
                  const newId = Math.max(...rawMaterials.map(rm => rm.id), 0) + 1;
                  editRawMaterial({ id: newId, sku: `RM-${String(newId).padStart(3, '0')}`, name: '', unit: 'دانه', quantity: 0, min_stock: 0, unit_cost_afn: 0, unit_sell_price_afn: 0, category: '' });
                }} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
                  <Plus size={16} /> افزودن مواد اولیه
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                  <div className="text-xs text-slate-500">ارزش کل مواد</div>
                  <div className="text-2xl font-bold mt-1">{formatAFN(rawMaterials.reduce((sum, rm) => sum + rm.quantity * rm.unit_cost_afn, 0))}</div>
                </div>
                <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                  <div className="text-xs text-slate-500">ارزش فروش</div>
                  <div className="text-2xl font-bold mt-1 text-blue-600">{formatAFN(rawMaterials.reduce((sum, rm) => sum + rm.quantity * rm.unit_sell_price_afn, 0))}</div>
                </div>
                <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
                  <div className="text-xs text-slate-500">سود پتانسیل</div>
                  <div className="text-2xl font-bold mt-1 text-emerald-600">{formatAFN(rawMaterials.reduce((sum, rm) => sum + rm.quantity * (rm.unit_sell_price_afn - rm.unit_cost_afn), 0))}</div>
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-3 text-right">SKU</th>
                      <th className="px-5 py-3 text-right">نام ماده</th>
                      <th className="px-5 py-3 text-right">دسته</th>
                      <th className="px-5 py-3 text-right">واحد</th>
                      <th className="px-5 py-3 text-right">موجودی</th>
                      <th className="px-5 py-3 text-right">قیمت خرید</th>
                      <th className="px-5 py-3 text-right">قیمت فروش</th>
                      <th className="px-5 py-3 text-right">سود/واحد</th>
                      <th className="px-5 py-3 text-right">ارزش کل</th>
                      <th className="px-5 py-3 text-right">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rawMaterials.map(rm => {
                      const profit = rm.unit_sell_price_afn - rm.unit_cost_afn;
                      const totalValue = rm.quantity * rm.unit_sell_price_afn;
                      return (
                        <tr key={rm.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-mono text-slate-400">{rm.sku}</td>
                          <td className="px-5 py-3 font-medium">{rm.name}</td>
                          <td className="px-5 py-3 text-slate-500">{rm.category}</td>
                          <td className="px-5 py-3 text-slate-500">{rm.unit}</td>
                          <td className="px-5 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs ${rm.quantity <= rm.min_stock ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                              {rm.quantity}
                            </span>
                          </td>
                          <td className="px-5 py-3">{formatAFN(rm.unit_cost_afn)}</td>
                          <td className="px-5 py-3">{formatAFN(rm.unit_sell_price_afn)}</td>
                          <td className="px-5 py-3 font-semibold text-emerald-600">{formatAFN(profit)}</td>
                          <td className="px-5 py-3 font-bold">{formatAFN(totalValue)}</td>
                          <td className="px-5 py-3">
                            <ActionButtons
                              onPrint={() => printRawMaterial(rm)}
                              onEdit={() => editRawMaterial(rm)}
                              onDelete={() => handleDelete('raw-material', rm.id, rm.name, setRawMaterials)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SALES */}
          {page === "sales" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">فروش و فاکتور</h2>
                  <p className="text-sm text-slate-500">مالیات: {TAX_RATE}% • فرمول: مالیات = جمع جزء × {TAX_RATE / 100}</p>
                </div>
                <button onClick={addInvoice} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">
                  <Plus size={16} /> فاکتور جدید
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200"><div className="text-xs text-slate-500">جمع فروش</div><div className="text-2xl font-bold mt-1">{formatAFN(stats.totalRevenue)}</div></div>
                <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200"><div className="text-xs text-slate-500">وصول شده</div><div className="text-2xl font-bold mt-1 text-emerald-600">{formatAFN(stats.totalCollected)}</div></div>
                <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200"><div className="text-xs text-slate-500">مطالبات</div><div className="text-2xl font-bold mt-1 text-red-600">{formatAFN(stats.totalReceivable)}</div></div>
              </div>

              <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-3 text-right">شماره</th>
                      <th className="px-5 py-3 text-right">مشتری</th>
                      <th className="px-5 py-3 text-right">تاریخ</th>
                      <th className="px-5 py-3 text-right">اقلام</th>
                      <th className="px-5 py-3 text-right">جمع جزء</th>
                      <th className="px-5 py-3 text-right">مالیات</th>
                      <th className="px-5 py-3 text-right">جمع کل</th>
                      <th className="px-5 py-3 text-right">پرداخت</th>
                      <th className="px-5 py-3 text-right">وضعیت</th>
                      <th className="px-5 py-3 text-right">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono">{inv.id}</td>
                        <td className="px-5 py-3 font-medium">{inv.customer}</td>
                        <td className="px-5 py-3 text-slate-500">{inv.date}</td>
                        <td className="px-5 py-3 text-center">{inv.items}</td>
                        <td className="px-5 py-3">{formatAFN(inv.subtotal)}</td>
                        <td className="px-5 py-3 text-amber-600">{formatAFN(inv.tax)}</td>
                        <td className="px-5 py-3 font-semibold">{formatAFN(inv.total)}</td>
                        <td className="px-5 py-3 text-emerald-600">{formatAFN(inv.paid)}</td>
                        <td className="px-5 py-3">{statusBadge(inv.status)}</td>
                        <td className="px-5 py-3">
                        <ActionButtons
                          onPrint={() => printInvoice(inv)}
                          onEdit={() => editInvoice(inv)}
                          onDelete={() => handleDelete('invoice', inv.id, inv.customer, setInvoices)}
                        />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold">
                    <tr>
                      <td colSpan={4} className="px-5 py-3 text-left">جمع کل:</td>
                      <td className="px-5 py-3">{formatAFN(stats.totalRevenue * 100 / (100 + TAX_RATE))}</td>
                      <td className="px-5 py-3 text-amber-600">{formatAFN(stats.totalRevenue - stats.totalRevenue * 100 / (100 + TAX_RATE))}</td>
                      <td className="px-5 py-3">{formatAFN(stats.totalRevenue)}</td>
                      <td className="px-5 py-3 text-emerald-600">{formatAFN(stats.totalCollected)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* PURCHASES */}
          {page === "purchases" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">سفارش‌های خرید</h2>
                  <p className="text-sm text-slate-500">مجموع خرید: {formatAFN(stats.totalPurchases)}</p>
                </div>
                <button onClick={addPurchase} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">
                  <Plus size={16} /> سفارش جدید
                </button>
              </div>

              <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-3 text-right">شماره</th>
                      <th className="px-5 py-3 text-right">تامین‌کننده</th>
                      <th className="px-5 py-3 text-right">تاریخ</th>
                      <th className="px-5 py-3 text-right">اقلام</th>
                      <th className="px-5 py-3 text-right">مبلغ</th>
                      <th className="px-5 py-3 text-right">وضعیت</th>
                      <th className="px-5 py-3 text-right">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchases.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono">{p.id}</td>
                        <td className="px-5 py-3 font-medium">{p.supplier}</td>
                        <td className="px-5 py-3 text-slate-500">{p.date}</td>
                        <td className="px-5 py-3 text-center">{p.items}</td>
                        <td className="px-5 py-3 font-semibold">{formatAFN(p.total)}</td>
                        <td className="px-5 py-3">{statusBadge(p.status)}</td>
                        <td className="px-5 py-3">
                        <ActionButtons
                          onPrint={() => printPurchase(p)}
                          onEdit={() => editPurchase(p)}
                          onDelete={() => handleDelete('purchase', p.id, p.supplier, setPurchases)}
                        />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CUSTOMERS */}
          {page === "customers" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">مشتریان ({customers.length})</h2>
                <button onClick={addCustomer} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">
                  <Plus size={16} /> مشتری جدید
                </button>
              </div>
              <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-3 text-right">کد</th>
                      <th className="px-5 py-3 text-right">نام</th>
                      <th className="px-5 py-3 text-right">تلفن</th>
                      <th className="px-5 py-3 text-right">شهر</th>
                      <th className="px-5 py-3 text-right">مانده</th>
                      <th className="px-5 py-3 text-right">وضعیت</th>
                      <th className="px-5 py-3 text-right">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono">{c.id}</td>
                        <td className="px-5 py-3 font-medium">{c.name}</td>
                        <td className="px-5 py-3 text-slate-500">{c.phone}</td>
                        <td className="px-5 py-3">{c.city}</td>
                        <td className={`px-5 py-3 font-semibold ${c.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatAFN(c.balance)}</td>
                        <td className="px-5 py-3">{statusBadge(c.status)}</td>
                        <td className="px-5 py-3">
                          <ActionButtons
                            onPrint={() => printCustomer(c)}
                            onEdit={() => editCustomer(c)}
                            onDelete={() => handleDelete('customer', c.id, c.name, setCustomers)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUPPLIERS */}
          {page === "suppliers" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">تامین‌کنندگان ({suppliers.length})</h2>
                <button onClick={addSupplier} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">
                  <Plus size={16} /> تامین‌کننده جدید
                </button>
              </div>
              <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-3 text-right">کد</th>
                      <th className="px-5 py-3 text-right">نام</th>
                      <th className="px-5 py-3 text-right">رابط</th>
                      <th className="px-5 py-3 text-right">تلفن</th>
                      <th className="px-5 py-3 text-right">شهر</th>
                      <th className="px-5 py-3 text-right">سفارش</th>
                      <th className="px-5 py-3 text-right">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppliers.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono">{s.id}</td>
                        <td className="px-5 py-3 font-medium">{s.name}</td>
                        <td className="px-5 py-3 text-slate-500">{s.contact}</td>
                        <td className="px-5 py-3">{s.phone}</td>
                        <td className="px-5 py-3">{s.city}</td>
                        <td className="px-5 py-3 text-center font-semibold">{s.orders}</td>
                        <td className="px-5 py-3">
                          <ActionButtons
                            onPrint={() => printSupplier(s)}
                            onEdit={() => editSupplier(s)}
                            onDelete={() => handleDelete('supplier', s.id, s.name, setSuppliers)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PAYROLL */}
          {page === "payroll" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">حقوق و دستمزد</h2>
                  <p className="text-sm text-slate-500">فرمول: خالص = حقوق + پاداش - کسورات • مجموع: {formatAFN(stats.totalSalaries)}</p>
                </div>
                <button onClick={addEmployee} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white">
                  <Plus size={16} /> کارمند جدید
                </button>
              </div>
              <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-5 py-3 text-right">کد</th>
                      <th className="px-5 py-3 text-right">نام</th>
                      <th className="px-5 py-3 text-right">بخش</th>
                      <th className="px-5 py-3 text-right">حقوق</th>
                      <th className="px-5 py-3 text-right">پاداش</th>
                      <th className="px-5 py-3 text-right">کسورات</th>
                      <th className="px-5 py-3 text-right">خالص</th>
                      <th className="px-5 py-3 text-right">وضعیت</th>
                      <th className="px-5 py-3 text-right">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map(e => {
                      const net = e.salary + e.bonus - e.deduction;
                      return (
                        <tr key={e.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-mono">{e.id}</td>
                          <td className="px-5 py-3 font-medium">{e.name}</td>
                          <td className="px-5 py-3 text-slate-500">{e.department}</td>
                          <td className="px-5 py-3">{formatAFN(e.salary)}</td>
                          <td className="px-5 py-3 text-emerald-600">+{formatAFN(e.bonus)}</td>
                          <td className="px-5 py-3 text-red-600">-{formatAFN(e.deduction)}</td>
                          <td className="px-5 py-3 font-bold">{formatAFN(net)}</td>
                          <td className="px-5 py-3">{statusBadge(e.status)}</td>
                          <td className="px-5 py-3">
                              <ActionButtons
                                onPrint={() => printPayroll(e)}
                                onEdit={() => editEmployee(e)}
                                onDelete={() => handleDelete('employee', e.id, e.name, setEmployees)}
                              />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INSTALLMENTS */}
          {page === "installments" && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold">مدیریت اقساط</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {plans.map(plan => (
                  <div key={plan.id} className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-xs text-slate-400">{plan.id}</p>
                        <h3 className="mt-1 text-lg font-semibold">{plan.customerName}</h3>
                      </div>
                      <div className="flex items-start gap-2">
                        {statusBadge(plan.status)}
                        <ActionButtons size="sm" onPrint={() => printPlan(plan)} />
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-xs">
                      <div><p className="text-slate-500">کل</p><p className="font-bold">{formatAFN(plan.totalAmount)}</p></div>
                      <div><p className="text-slate-500">پرداخت</p><p className="font-bold text-emerald-600">{formatAFN(plan.paidAmount)}</p></div>
                      <div><p className="text-slate-500">مانده</p><p className="font-bold text-red-600">{formatAFN(plan.remainingAmount)}</p></div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {plan.installments.map(inst => (
                        <div key={inst.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-2 text-xs">
                          <span>{inst.dueDate}</span>
                          <span>{formatAFN(inst.amount)}</span>
                          {inst.paid ? <CheckCircle className="text-emerald-500" size={16} /> : <button onClick={() => payInstallment(plan.id, inst.id)} className="rounded-lg bg-slate-900 px-2 py-1 text-white">پرداخت</button>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {page === "accounting" && <Accounting />}

          {/* CURRENCIES */}
          {page === "currencies" && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold">مدیریت ارزها</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {supportedCurrencies.map(c => (
                  <div key={c.code} className="rounded-3xl bg-white p-5 ring-1 ring-slate-200">
                    <div className="text-2xl">{c.flag}</div>
                    <h3 className="mt-2 font-semibold">{c.label}</h3>
                    <p className="text-sm text-slate-500">کد: {c.code}</p>
                    <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm">نماد: {c.symbol}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REPORTS */}
          {page === "reports" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">گزارشات دقیق</h2>
                  <p className="text-sm text-slate-500">با فرمول‌های زنده محاسبه شده</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                  <h3 className="mb-5 font-semibold">درآمد و هزینه ماهانه</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(v: any) => formatAFN(Number(v))} />
                      <Bar dataKey="revenue" fill="#4f46e5" radius={8} />
                      <Bar dataKey="expense" fill="#ef4444" radius={8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                  <h3 className="mb-5 font-semibold">توزیع فروش بر اساس دسته</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={categoryShare} dataKey="value" nameKey="name" outerRadius={100} label>
                        {categoryShare.map((item) => <Cell key={item.name} fill={item.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                <h3 className="mb-5 font-semibold">خلاصه عملکرد مالی (فرمول‌های زنده)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="p-4 rounded-xl bg-blue-50">
                    <div className="text-xs text-blue-600 mb-1">درآمد فروش</div>
                    <div className="text-xl font-bold">{formatAFN(stats.totalRevenue)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-orange-50">
                    <div className="text-xs text-orange-600 mb-1">هزینه خرید</div>
                    <div className="text-xl font-bold">-{formatAFN(stats.totalPurchases)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50">
                    <div className="text-xs text-purple-600 mb-1">حقوق پرسنل</div>
                    <div className="text-xl font-bold">-{formatAFN(stats.totalSalaries)}</div>
                  </div>
                  <div className={`p-4 rounded-xl ${stats.grossProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    <div className={`text-xs mb-1 ${stats.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>سود ناخالص</div>
                    <div className="text-xl font-bold">{formatAFN(stats.grossProfit)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {page === "settings" && (
            <div className="space-y-5">
              <h2 className="text-2xl font-bold">تنظیمات سیستم</h2>
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                  <h3 className="mb-4 font-semibold">اطلاعات شرکت</h3>
                  <div className="space-y-3">
                    <input defaultValue="شرکت ERP Furniture" className="w-full rounded-xl border border-slate-300 px-4 py-2" />
                    <input defaultValue="کابل، افغانستان" className="w-full rounded-xl border border-slate-300 px-4 py-2" />
                    <input defaultValue="0700123456" className="w-full rounded-xl border border-slate-300 px-4 py-2" />
                    <input defaultValue={`نرخ مالیات: ${TAX_RATE}%`} className="w-full rounded-xl border border-slate-300 px-4 py-2" />
                  </div>
                </div>
                <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                  <h3 className="mb-4 flex items-center gap-2 font-semibold"><Database size={18} /> Backup / Restore</h3>
                  <p className="mb-4 text-sm text-slate-500">Backup روزانه در Neon فعال است</p>
                  <button className="w-full px-4 py-3 bg-indigo-600 text-white rounded-xl">دانلود Backup</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Print Modal */}
      {printDoc && <MinimalInvoice {...printDoc} onClose={() => setPrintDoc(null)} />}
      <ToastContainer />

      {/* Edit Modal */}
      {editModal && (
        <EditModal
          title={editModal.title}
          fields={editModal.fields}
          data={editModal.data}
          onSave={editModal.onSave}
          onClose={() => setEditModal(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
