import { useRef } from 'react';
import { Printer, X } from 'lucide-react';

interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  id: string;
  date: string;
  dueDate?: string;
  customer: {
    name: string;
    company?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  total: number;
  paidAmount?: number;
  remainingAmount?: number;
  notes?: string;
  paymentMethod?: string;
}

interface PrintInvoiceProps {
  invoice: InvoiceData;
  onClose: () => void;
}

export default function PrintInvoice({ invoice, onClose }: PrintInvoiceProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>فاکتور ${invoice.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Vazirmatn', 'Tahoma', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #1f2937;
            background: #fff;
          }
          
          .invoice-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
          }
          
          .header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            padding-bottom: 20px;
            border-bottom: 2px solid #4f46e5;
            margin-bottom: 30px;
          }
          
          .company-info h1 {
            font-size: 24px;
            font-weight: 700;
            color: #4f46e5;
            margin-bottom: 8px;
          }
          
          .company-info p {
            color: #6b7280;
            font-size: 12px;
          }
          
          .invoice-info {
            text-align: left;
          }
          
          .invoice-title {
            font-size: 28px;
            font-weight: 700;
            color: #1f2937;
          }
          
          .invoice-number {
            font-size: 16px;
            color: #4f46e5;
            font-weight: 600;
            margin-top: 4px;
          }
          
          .invoice-date {
            color: #6b7280;
            font-size: 13px;
            margin-top: 4px;
          }
          
          .section {
            margin-bottom: 30px;
          }
          
          .section-title {
            font-size: 14px;
            font-weight: 600;
            color: #4f46e5;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .customer-details {
            background: #f9fafb;
            padding: 16px;
            border-radius: 8px;
          }
          
          .customer-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
          }
          
          .customer-detail {
            color: #6b7280;
            font-size: 13px;
            margin-bottom: 4px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          th {
            background: #f3f4f6;
            padding: 12px;
            text-align: right;
            font-weight: 600;
            font-size: 13px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .text-center {
            text-align: center;
          }
          
          .text-left {
            text-align: left;
          }
          
          .totals-section {
            margin-left: 0;
            margin-right: auto;
            width: 300px;
          }
          
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .total-row:last-child {
            border-bottom: none;
          }
          
          .grand-total {
            font-size: 18px;
            font-weight: 700;
            color: #4f46e5;
            background: #eef2ff;
            padding: 12px;
            border-radius: 8px;
            margin-top: 8px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          
          .notes {
            background: #fef3c7;
            padding: 12px;
            border-radius: 8px;
            margin-top: 20px;
            font-size: 13px;
          }
          
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding-top: 20px;
          }
          
          .signature-box {
            text-align: center;
            width: 150px;
          }
          
          .signature-line {
            border-top: 1px solid #1f2937;
            padding-top: 8px;
            margin-top: 40px;
            font-size: 12px;
          }
          
          @media print {
            .no-print {
              display: none !important;
            }
            
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            
            .invoice-container {
              padding: 10mm;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-AF').format(amount) + ' افغانی';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header Actions */}
        <div className="p-4 border-b flex items-center justify-between no-print">
          <h2 className="text-lg font-bold">پیش‌نمایش فاکتور</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
            >
              <Printer size={18} />
              چاپ فاکتور
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="flex-1 overflow-auto p-6">
          <div ref={printRef} className="invoice-container">
            {/* Header */}
            <div className="header">
              <div className="company-info">
                <h1>شرکت ERP</h1>
                <p>سیستم مدیریت یکپارچه کسب‌وکار</p>
                <p>تلفن: ۰۷۰۰۱۲۳۴۵۶۷</p>
                <p>آدرس: کابل، افغانستان</p>
              </div>
              <div className="invoice-info">
                <div className="invoice-title">فاکتور فروش</div>
                <div className="invoice-number">#{invoice.id}</div>
                <div className="invoice-date">
                  تاریخ: {invoice.date}
                  {invoice.dueDate && <div>سررسید: {invoice.dueDate}</div>}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="section">
              <div className="section-title">اطلاعات مشتری</div>
              <div className="customer-details">
                <div className="customer-name">{invoice.customer.name}</div>
                {invoice.customer.company && (
                  <div className="customer-detail">{invoice.customer.company}</div>
                )}
                {invoice.customer.phone && (
                  <div className="customer-detail">تلفن: {invoice.customer.phone}</div>
                )}
                {invoice.customer.address && (
                  <div className="customer-detail">آدرس: {invoice.customer.address}</div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="section">
              <div className="section-title">اقلام فاکتور</div>
              <table>
                <thead>
                  <tr>
                    <th className="text-center" style={{ width: '50px' }}>ردیف</th>
                    <th>شرح کالا/خدمت</th>
                    <th className="text-center">تعداد</th>
                    <th className="text-center">واحد</th>
                    <th className="text-left">قیمت واحد</th>
                    <th className="text-left">جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id}>
                      <td className="text-center">{index + 1}</td>
                      <td>{item.description}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-center">{item.unit}</td>
                      <td className="text-left">{formatCurrency(item.unitPrice)}</td>
                      <td className="text-left">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="totals-section">
              <div className="total-row">
                <span>جمع کل:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="total-row">
                  <span>مالیات ({(invoice.taxAmount / invoice.subtotal * 100).toFixed(0)}%):</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="total-row">
                  <span>تخفیف:</span>
                  <span className="text-red-600">-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              <div className="total-row grand-total">
                <span>مبلغ قابل پرداخت:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              {invoice.paidAmount !== undefined && (
                <>
                  <div className="total-row">
                    <span>پرداخت شده:</span>
                    <span className="text-emerald-600">{formatCurrency(invoice.paidAmount)}</span>
                  </div>
                  <div className="total-row">
                    <span>باقیمانده:</span>
                    <span className="text-red-600">{formatCurrency(invoice.remainingAmount || 0)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="notes">
                <strong>توضیحات:</strong> {invoice.notes}
              </div>
            )}

            {/* Signature Section */}
            <div className="signature-section">
              <div className="signature-box">
                <div className="signature-line">امضای فروشنده</div>
              </div>
              <div className="signature-box">
                <div className="signature-line">امضای خریدار</div>
              </div>
              <div className="signature-box">
                <div className="signature-line">مهر شرکت</div>
              </div>
            </div>

            {/* Footer */}
            <div className="footer">
              <p>از خرید شما سپاسگزاریم</p>
              <p>برای پرداخت آنلاین به وبسایت ما مراجعه کنید</p>
              <p style={{ marginTop: '10px', fontSize: '11px' }}>
                این فاکتور به صورت سیستمی صادر شده و نیازی به مهر و امضای دستی ندارد.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
