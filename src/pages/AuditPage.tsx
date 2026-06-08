import { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { authService } from '../services/securityService';

export default function AuditPage() {
  const [logs, setLogs] = useState(authService.getAuditLogs());

  const clear = () => {
    if (!confirm('همه لاگ‌ها پاک شوند؟')) return;
    authService.clearAuditLogs();
    setLogs([]);
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'audit-log.json'; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">گزارش رخدادها (Audit Log)</h2>
          <p className="text-sm text-slate-500">مطابق با استاندارد ISO 27001 — {logs.length} رخداد ثبت شده</p>
        </div>
        <div className="flex gap-2">
          <button onClick={download} className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"><Download size={16} /> خروجی</button>
          <button onClick={clear} className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"><Trash2 size={16} /> پاک کردن</button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                <th className="px-4 py-3 font-semibold">زمان</th>
                <th className="px-4 py-3 font-semibold">نام کاربر</th>
                <th className="px-4 py-3 font-semibold">نقش</th>
                <th className="px-4 py-3 font-semibold">عملیات</th>
                <th className="px-4 py-3 font-semibold">شرح</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-xs text-slate-500">{log.timestamp}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{log.userName}</td>
                  <td className="px-4 py-3"><span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">{log.userRole}</span></td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{log.action}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 max-w-xs">{log.description}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">هیچ رخدادی ثبت نشده است</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
