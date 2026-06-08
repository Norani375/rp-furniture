import { useState } from 'react';
import { Download, Upload, RefreshCw, CheckCircle } from 'lucide-react';

export default function BackupPage() {
  const [message, setMessage] = useState('');

  const downloadBackup = () => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) data[key] = localStorage.getItem(key) || '';
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `erp-full-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setMessage(`نسخه پشتیبان با ${Object.keys(data).length} کلید دانلود شد.`);
  };

  const uploadBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          Object.entries(data).forEach(([key, value]) => localStorage.setItem(key, value as string));
          setMessage(`${Object.keys(data).length} کلید بازیابی شد. صفحه رفرش می‌شود.`);
          setTimeout(() => window.location.reload(), 1500);
        } catch { setMessage('خطا در خواندن فایل پشتیبان'); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const restoreDefaults = () => {
    if (!confirm('همه داده‌ها حذف می‌شوند. ابتدا نسخه پشتیبان بگیرید. ادامه می‌دهید؟')) return;
    const keys = Object.keys(localStorage).filter((k) => k.startsWith('erp_') && k !== 'erp_auth_token');
    keys.forEach((k) => localStorage.removeItem(k));
    setMessage(`${keys.length} کلید حذف شد.`);
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">مدیریت پشتیبان (Backup & Restore)</h2>
          <p className="text-sm text-slate-500">مطابق با استاندارد ISO 27001 — پشتیبان‌گیری و بازیابی اطلاعات</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4"><Download className="text-indigo-600" size={24} /><h3 className="font-bold text-slate-900">دانلود پشتیبان</h3></div>
          <p className="text-sm text-slate-500 mb-4">یک فایل JSON کامل از تمام داده‌های سیستم دریافت کنید.</p>
          <button onClick={downloadBackup} className="w-full rounded-xl bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700">دانلود</button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4"><Upload className="text-emerald-600" size={24} /><h3 className="font-bold text-slate-900">بازیابی پشتیبان</h3></div>
          <p className="text-sm text-slate-500 mb-4">فایل پشتیبان JSON را آپلود کنید تا داده‌های قبلی برگردند.</p>
          <button onClick={uploadBackup} className="w-full rounded-xl bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700">آپلود</button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4"><RefreshCw className="text-red-600" size={24} /><h3 className="font-bold text-slate-900">بازنشانی</h3></div>
          <p className="text-sm text-slate-500 mb-4">تمام داده‌های ERP را پاک کرده و سیستم را ریست کنید.</p>
          <button onClick={restoreDefaults} className="w-full rounded-xl bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700">بازنشانی</button>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle className="text-emerald-600" size={20} />
          <p className="text-sm text-emerald-800">{message}</p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4">آخرین پشتیبان‌ها</h3>
        <p className="text-sm text-slate-500">پشتیبان‌گیری خودکار در localStorage ذخیره می‌شود. برای ذخیره امن، فایل را دانلود کنید.</p>
      </div>
    </div>
  );
}
