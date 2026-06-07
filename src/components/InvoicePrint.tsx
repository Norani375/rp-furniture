import { Invoice } from '../types';
import { AFN } from '../db/database';

interface Props {
  invoice: Invoice | null;
}

export default function InvoicePrint({ invoice }: Props) {
  if (!invoice) return null;

  return (
    <div className="hidden print:block bg-white text-black p-8 mx-auto" dir="rtl" style={{ width: '210mm', minHeight: '297mm' }}>
      <div className="border-2 border-slate-800 p-6 rounded-lg">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">فروشگاه فرنیچر و یراق</h1>
            <p className="text-sm mt-2 text-slate-600">آدرس: کابل، افغانستان</p>
            <p className="text-sm text-slate-600">تلفن: ۰۷۰۰۰۰۰۰۰۰</p>
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-bold text-indigo-700">فاکتور فروش</h2>
            <p className="text-sm mt-2 font-medium">شماره فاکتور: {invoice.id}</p>
            <p className="text-sm font-medium">تاریخ: {invoice.date}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-6 rounded-lg border border-slate-300 p-4 bg-slate-50">
          <h3 className="font-bold text-slate-800 mb-2 border-b border-slate-300 pb-2">اطلاعات خریدار</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p><strong>نام مشتری:</strong> {invoice.customerName}</p>
            <p><strong>شماره تماس:</strong> —</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-right mb-6 border-collapse border border-slate-800">
          <thead>
            <tr className="bg-slate-200 text-slate-900 border-b border-slate-800">
              <th className="p-3 border-l border-slate-800 font-bold">ردیف</th>
              <th className="p-3 border-l border-slate-800 font-bold">شرح کالا / خدمات</th>
              <th className="p-3 border-l border-slate-800 font-bold text-center">تعداد</th>
              <th className="p-3 border-l border-slate-800 font-bold text-center">قیمت واحد (AFN)</th>
              <th className="p-3 font-bold text-center">قیمت کل (AFN)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, index) => (
              <tr key={index} className="border-b border-slate-800">
                <td className="p-3 border-l border-slate-800 text-center">{index + 1}</td>
                <td className="p-3 border-l border-slate-800">{item.description}</td>
                <td className="p-3 border-l border-slate-800 text-center">{item.quantity}</td>
                <td className="p-3 border-l border-slate-800 text-center">{AFN(item.unitPrice)}</td>
                <td className="p-3 text-center">{AFN(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
            {(!invoice.items || invoice.items.length === 0) && (
              <tr className="border-b border-slate-800">
                <td className="p-3 border-l border-slate-800 text-center">1</td>
                <td className="p-3 border-l border-slate-800">فاکتور کلی فروش</td>
                <td className="p-3 border-l border-slate-800 text-center">1</td>
                <td className="p-3 border-l border-slate-800 text-center">{AFN(invoice.amount)}</td>
                <td className="p-3 text-center">{AFN(invoice.amount)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Total & Signatures */}
        <div className="flex justify-between items-end mt-8">
          <div className="w-1/2 space-y-8">
            <p className="text-sm font-medium">امضا فروشنده:</p>
            <p className="text-sm font-medium">امضا خریدار:</p>
          </div>
          <div className="w-1/2 rounded-lg border border-slate-800 bg-slate-50 p-4">
            <div className="flex justify-between font-bold text-lg">
              <span>مبلغ کل فاکتور:</span>
              <span>{AFN(invoice.amount)}</span>
            </div>
            <div className="mt-2 flex justify-between text-sm text-slate-600">
              <span>وضعیت پرداخت:</span>
              <span>{invoice.status === 'paid' ? 'پرداخت شده' : 'معوق/در انتظار'}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-slate-500 border-t border-slate-300 pt-4">
          از خرید شما سپاسگزاریم. کالای فروخته شده در صورت باز نشدن پلمپ تا ۲۴ ساعت قابل برگشت است.
        </div>
      </div>
    </div>
  );
}
