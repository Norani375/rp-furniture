import { useState } from 'react';
import { Lock, User } from 'lucide-react';

interface LoginProps {
  onSuccess: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = [
      { username: 'admin', password: '123456', role: 'admin', name: 'مدیر سیستم' },
      { username: 'accountant', password: '123456', role: 'accountant', name: 'حسابدار' },
      { username: 'sales', password: '123456', role: 'sales', name: 'فروشنده' },
      { username: 'inventory', password: '123456', role: 'inventory', name: 'انباردار' },
    ];
    const user = users.find((u) => u.username === username && u.password === password);
    if (user) {
      localStorage.setItem('erp_auth_token', 'logged_in');
      localStorage.setItem('erp_user_role', user.role);
      localStorage.setItem('erp_user_name', user.name);
      onSuccess();
    } else {
      setError('نام کاربری یا رمز عبور اشتباه است.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-2xl font-bold text-white shadow-lg">
            ERP
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ورود به سیستم</h1>
          <p className="mt-2 text-sm text-slate-500">لطفا اطلاعات کاربری خود را وارد کنید</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">نام کاربری</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                <User size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 py-2.5 pl-3 pr-10 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">رمز عبور</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 py-2.5 pl-3 pr-10 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="123456"
                required
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-700"
          >
            ورود
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          کاربران دمو: <br/> <b>admin</b> / <b>accountant</b> / <b>sales</b> / <b>inventory</b><br/> رمز همه: <b>123456</b>
        </div>
      </div>
    </div>
  );
}
