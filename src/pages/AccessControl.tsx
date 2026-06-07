import { Shield, UserCheck } from 'lucide-react';

const roles = [
  { role: 'admin', label: 'مدیر', access: 'تمام بخش‌ها، گزارشات، تنظیمات و مدیریت کاربران' },
  { role: 'accountant', label: 'حسابدار', access: 'حسابداری، اقساط، مالیات، چک و بانک، گزارشات' },
  { role: 'sales', label: 'فروشنده', access: 'فروش، POS، CRM و چاپ فاکتور' },
  { role: 'inventory', label: 'انباردار', access: 'کاتالوگ، انبارداری، تولید و هشدار موجودی' },
];

export default function AccessControl() {
  const current = localStorage.getItem('erp_user_role') || 'admin';
  return (
    <div className="space-y-6">
      <div><h2 className="text-xl font-bold text-slate-900">سطوح دسترسی کاربران</h2><p className="text-sm text-slate-500">مدیریت نقش‌ها و دسترسی‌ها</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3"><Shield className="text-indigo-600" /><div><p className="font-bold text-slate-900">نقش فعلی شما</p><p className="text-sm text-slate-500">{current}</p></div></div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {roles.map((r) => <div key={r.role} className={`rounded-2xl border p-5 shadow-sm ${current === r.role ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white'}`}><div className="flex items-center gap-3"><UserCheck size={20} className="text-indigo-600" /><h3 className="font-bold text-slate-900">{r.label}</h3></div><p className="mt-2 text-sm text-slate-600">{r.access}</p></div>)}
      </div>
    </div>
  );
}