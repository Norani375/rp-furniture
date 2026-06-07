import { AlertTriangle, Bell, CheckCircle, Info } from 'lucide-react';
import { dbNotifications } from '../db/database';

export default function NotificationsPage() {
  const notifications = dbNotifications.getAll();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">هشدارها و اعلان‌ها</h2>
        <p className="text-sm text-slate-500">کمبود موجودی، اقساط معوق و چک‌های در انتظار</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">کل اعلان‌ها</p><p className="mt-1 text-2xl font-bold text-slate-900">{notifications.length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">هشدار جدی</p><p className="mt-1 text-2xl font-bold text-red-600">{notifications.filter((n) => n.severity === 'danger').length}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs text-slate-500">هشدار معمولی</p><p className="mt-1 text-2xl font-bold text-amber-600">{notifications.filter((n) => n.severity === 'warning').length}</p></div>
      </div>
      <div className="space-y-3">
        {notifications.length === 0 && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-400"><CheckCircle className="mx-auto mb-2 text-emerald-500" />هیچ هشدار فعالی وجود ندارد.</div>}
        {notifications.map((n) => {
          const Icon = n.severity === 'danger' ? AlertTriangle : n.severity === 'warning' ? Bell : Info;
          const cls = n.severity === 'danger' ? 'border-red-200 bg-red-50 text-red-700' : n.severity === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-blue-200 bg-blue-50 text-blue-700';
          return (
            <div key={n.id} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className={`rounded-xl border p-2 ${cls}`}><Icon size={18} /></div>
              <div className="flex-1"><div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">{n.title}</h3><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{n.module}</span></div><p className="mt-1 text-sm text-slate-600">{n.message}</p><p className="mt-2 text-xs text-slate-400">{n.createdAt}</p></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}