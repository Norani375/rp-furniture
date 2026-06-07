import { useState, useMemo } from 'react';
import { Users, CheckCircle, Clock, Plus } from 'lucide-react';
import { employees, payrollRecords } from '../data/mockData';
import { dbLedger, AFN, persianDate } from '../db/database';
import RecordActions from '../components/RecordActions';

export default function Payroll() {
  const [tab, setTab] = useState<'employees' | 'payments' | 'history'>('employees');
  const [showForm, setShowForm] = useState(false);
  const [empName, setEmpName] = useState(''); const [salary, setSalary] = useState('');
  const [employeeList, setEmployeeList] = useState(employees);

  const txHistory = useMemo(() => dbLedger.getAll().filter((t) => t.type === 'payroll'), []);

  const doPayroll = () => {
    const s = Number(salary);
    if (!empName.trim() || s <= 0) return;
    dbLedger.add({ date: persianDate(), type: 'payroll', status: 'confirmed', title: `پرداخت حقوق: ${empName.trim()}`, description: `مبلغ ${AFN(s)}`, debit: 0, credit: s, refType: 'payroll', refId: empName.trim(), createdBy: 'کاربر' });
    setShowForm(false); setEmpName(''); setSalary('');
  };

  const editEmployee = (id: string) => {
    const current = employeeList.find((e) => e.id === id);
    if (!current) return;
    const nextSalary = prompt('حقوق جدید را وارد کنید:', String(current.salary));
    if (nextSalary === null) return;
    setEmployeeList((list) => list.map((e) => e.id === id ? { ...e, salary: Number(nextSalary) } : e));
  };

  const deleteEmployee = (id: string) => {
    if (!confirm('آیا از حذف کارمند مطمئن هستید؟')) return;
    setEmployeeList((list) => list.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">حقوق و دستمزد</h2><p className="text-sm text-slate-500">{txHistory.length} پرداخت حقوق ثبت شده</p></div>
        <div className="flex gap-2"><button onClick={() => window.print()} className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">پرینت</button><button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"><Plus size={16} /> ثبت حقوق</button></div>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">ثبت پرداخت حقوق</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <input value={empName} onChange={(e) => setEmpName(e.target.value)} placeholder="نام کارمند" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            <input type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="مبلغ حقوق (AFN)" className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="mt-3 flex gap-2"><button onClick={doPayroll} className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800">ثبت</button><button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-300 px-5 py-2 text-sm text-slate-600 hover:bg-slate-50">انصراف</button></div>
        </div>
      )}

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setTab('employees')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'employees' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>کارکنان ({employeeList.length})</button>
        <button onClick={() => setTab('payments')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'payments' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>فیش‌ها ({payrollRecords.length})</button>
        <button onClick={() => setTab('history')} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'history' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'}`}>تاریخچه حقوق ({txHistory.length})</button>
      </div>

      {tab === 'employees' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><th className="px-4 py-3 font-semibold">کارمند</th><th className="px-4 py-3 font-semibold">دپارتمان</th><th className="px-4 py-3 font-semibold">سمت</th><th className="px-4 py-3 font-semibold">حقوق</th><th className="px-4 py-3 font-semibold">وضعیت</th><th className="px-4 py-3 font-semibold print:hidden">عملیات</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{employeeList.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/60"><td className="px-4 py-3 font-medium text-slate-900">{e.firstName} {e.lastName}</td><td className="px-4 py-3 text-slate-600">{e.department}</td><td className="px-4 py-3 text-slate-600">{e.position}</td><td className="px-4 py-3 font-semibold text-slate-900">{AFN(e.salary)}</td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${e.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}><Users size={12} /> {e.status === 'active' ? 'فعال' : 'غیرفعال'}</span></td><td className="px-4 py-3 print:hidden"><RecordActions compact onEdit={() => editEmployee(e.id)} onDelete={() => deleteEmployee(e.id)} onPrint={() => window.print()} /></td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'payments' && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {payrollRecords.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4">
              <div><p className="text-sm font-medium text-slate-900">{r.employeeName}</p><p className="text-xs text-slate-500">{r.period}</p></div>
              <div className="text-left"><p className="text-sm font-bold text-slate-900">{AFN(r.netPay)}</p>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${r.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : r.status === 'processed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                  {r.status === 'paid' ? <CheckCircle size={10} /> : <Clock size={10} />} {r.status === 'paid' ? 'پرداخت شده' : r.status === 'processed' ? 'پردازش شده' : 'در انتظار'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500"><th className="px-4 py-3 font-semibold">#</th><th className="px-4 py-3 font-semibold">تاریخ</th><th className="px-4 py-3 font-semibold">عنوان</th><th className="px-4 py-3 font-semibold">مبلغ</th></tr></thead>
              <tbody className="divide-y divide-slate-100">{[...txHistory].reverse().map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60"><td className="px-4 py-3 text-xs text-indigo-600">{tx.id}</td><td className="px-4 py-3 text-xs text-slate-600">{tx.date}</td><td className="px-4 py-3 text-xs text-slate-900">{tx.title}</td><td className="px-4 py-3 text-xs font-semibold text-red-600">-{AFN(tx.credit)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
