import { useRef } from 'react';
import { Printer, X, Download } from 'lucide-react';

export type DocumentType = 'sales' | 'purchase' | 'payroll' | 'customer' | 'supplier' | 'installment' | 'inventory' | 'journal';

interface DocumentField {
  label: string;
  value: string | number;
  type?: 'text' | 'currency' | 'number' | 'date';
}

interface DocumentRow {
  description: string;
  qty?: number;
  unit?: string;
  price?: number;
  total?: number;
}

interface MinimalInvoiceProps {
  type: DocumentType;
  documentNumber: string;
  date: string;
  title: string;
  partyName: string;
  partyDetails?: { phone?: string; email?: string; address?: string };
  fields?: DocumentField[];
  rows?: DocumentRow[];
  subtotal?: number;
  tax?: number;
  taxRate?: number;
  discount?: number;
  total?: number;
  paidAmount?: number;
  notes?: string;
  onClose: () => void;
}

const formatAFN = (value: number) => new Intl.NumberFormat('fa-AF').format(Math.round(value)) + ' افغانی';

const typeLabels: Record<DocumentType, { title: string; color: string; subtitle: string }> = {
  sales: { title: 'فاکتور فروش', color: '#10b981', subtitle: 'Sales Invoice' },
  purchase: { title: 'سند خرید', color: '#3b82f6', subtitle: 'Purchase Order' },
  payroll: { title: 'فیش حقوق', color: '#8b5cf6', subtitle: 'Payroll Slip' },
  customer: { title: 'صورتحساب مشتری', color: '#ec4899', subtitle: 'Customer Statement' },
  supplier: { title: 'صورتحساب تامین‌کننده', color: '#6366f1', subtitle: 'Supplier Statement' },
  installment: { title: 'برنامه اقساط', color: '#f59e0b', subtitle: 'Installment Plan' },
  inventory: { title: 'گزارش انبار', color: '#06b6d4', subtitle: 'Inventory Report' },
  journal: { title: 'سند حسابداری', color: '#64748b', subtitle: 'Journal Entry' },
};

export default function MinimalInvoice(props: MinimalInvoiceProps) {
  const { type, documentNumber, date, title, partyName, partyDetails, fields, rows, subtotal, tax, taxRate, discount, total, paidAmount, notes, onClose } = props;
  const printRef = useRef<HTMLDivElement>(null);
  const config = typeLabels[type];

  // Calculate totals if not provided
  const calculatedSubtotal = subtotal ?? (rows?.reduce((sum, row) => sum + (row.total || 0), 0) || 0);
  const calculatedTax = tax ?? (taxRate ? calculatedSubtotal * (taxRate / 100) : 0);
  const calculatedTotal = total ?? (calculatedSubtotal + calculatedTax - (discount || 0));
  const remainingAmount = calculatedTotal - (paidAmount || 0);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>${config.title} - ${documentNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Vazirmatn', 'Tahoma', sans-serif; font-size: 13px; line-height: 1.6; color: #1f2937; background: white; }
          .invoice-wrap { max-width: 210mm; margin: 0 auto; padding: 15mm; }
          .header { display: flex; justify-content: space-between; align-items: start; padding-bottom: 20px; border-bottom: 3px solid ${config.color}; margin-bottom: 25px; }
          .brand { display: flex; align-items: center; gap: 12px; }
          .brand-logo { width: 50px; height: 50px; background: ${config.color}; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: 700; }
          .brand h1 { font-size: 18px; color: #111827; }
          .brand p { font-size: 11px; color: #6b7280; }
          .doc-title { text-align: left; }
          .doc-title h2 { font-size: 22px; font-weight: 700; color: ${config.color}; }
          .doc-title .sub { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
          .doc-title .num { font-size: 14px; font-weight: 600; color: #1f2937; margin-top: 6px; }
          .doc-title .date { font-size: 11px; color: #6b7280; margin-top: 2px; }
          .party-section { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
          .party-box { background: #f9fafb; padding: 14px; border-radius: 8px; border-right: 3px solid ${config.color}; }
          .party-box .label { font-size: 10px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 4px; }
          .party-box .name { font-size: 14px; font-weight: 600; color: #1f2937; }
          .party-box .detail { font-size: 11px; color: #6b7280; margin-top: 3px; }
          .fields-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 20px; background: #f9fafb; padding: 14px; border-radius: 8px; }
          .field { display: flex; flex-direction: column; gap: 2px; }
          .field-label { font-size: 10px; color: #6b7280; }
          .field-value { font-size: 13px; font-weight: 600; color: #1f2937; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          thead th { background: ${config.color}10; color: ${config.color}; padding: 10px 8px; text-align: right; font-size: 11px; font-weight: 600; border-bottom: 2px solid ${config.color}; }
          tbody td { padding: 10px 8px; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
          tbody tr:last-child td { border-bottom: none; }
          .text-left { text-align: left; }
          .text-center { text-align: center; }
          .totals { margin-right: auto; width: 280px; background: #f9fafb; padding: 14px; border-radius: 8px; margin-bottom: 20px; }
          .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
          .totals-row.total { font-size: 15px; font-weight: 700; color: ${config.color}; border-top: 2px solid ${config.color}; padding-top: 10px; margin-top: 6px; }
          .totals-row.paid { color: #059669; }
          .totals-row.remaining { color: #dc2626; font-weight: 600; }
          .notes { background: #fffbeb; border-right: 3px solid #f59e0b; padding: 10px 14px; border-radius: 6px; margin-bottom: 20px; font-size: 11px; color: #78350f; }
          .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 50px; padding-top: 20px; }
          .sig { text-align: center; }
          .sig-line { border-top: 1px solid #9ca3af; padding-top: 6px; font-size: 10px; color: #6b7280; margin-top: 35px; }
          .footer { text-align: center; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; margin-top: 30px; }
          @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } .invoice-wrap { padding: 8mm; } }
        </style>
      </head>
      <body>${content}<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script></body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-slate-900">{config.title}</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm">
              <Printer size={16} />
              چاپ
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl hover:bg-slate-50 text-sm">
              <Download size={16} />
              PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Preview */}
        <div className="flex-1 overflow-auto bg-slate-100 p-6">
          <div ref={printRef} className="bg-white max-w-3xl mx-auto shadow-sm">
            <div className="invoice-wrap" style={{ padding: '40px' }}>
              {/* Header */}
              <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', paddingBottom: '20px', borderBottom: `3px solid ${config.color}`, marginBottom: '25px' }}>
                <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="brand-logo" style={{ width: '50px', height: '50px', background: config.color, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: '700' }}>E</div>
                  <div>
                    <h1 style={{ fontSize: '18px', color: '#111827', margin: 0 }}>شرکت ERP</h1>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>کابل، افغانستان | ۰۷۰۰۱۲۳۴۵۶</p>
                  </div>
                </div>
                <div className="doc-title" style={{ textAlign: 'left' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: '700', color: config.color, margin: 0 }}>{config.title}</h2>
                  <div className="sub" style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '1px' }}>{config.subtitle}</div>
                  <div className="num" style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginTop: '6px' }}>#{documentNumber}</div>
                  <div className="date" style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>{date}</div>
                </div>
              </div>

              {/* Party Info */}
              <div className="party-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className="party-box" style={{ background: '#f9fafb', padding: '14px', borderRadius: '8px', borderRight: `3px solid ${config.color}` }}>
                  <div className="label" style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.5px', marginBottom: '4px' }}>{title}</div>
                  <div className="name" style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{partyName}</div>
                  {partyDetails?.phone && <div className="detail" style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>تلفن: {partyDetails.phone}</div>}
                  {partyDetails?.email && <div className="detail" style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>ایمیل: {partyDetails.email}</div>}
                  {partyDetails?.address && <div className="detail" style={{ fontSize: '11px', color: '#6b7280', marginTop: '3px' }}>{partyDetails.address}</div>}
                </div>
                <div className="party-box" style={{ background: '#f9fafb', padding: '14px', borderRadius: '8px', borderRight: `3px solid ${config.color}` }}>
                  <div className="label" style={{ fontSize: '10px', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.5px', marginBottom: '4px' }}>اطلاعات سند</div>
                  <div className="detail" style={{ fontSize: '12px', color: '#1f2937', marginTop: '3px' }}>شماره: {documentNumber}</div>
                  <div className="detail" style={{ fontSize: '12px', color: '#1f2937', marginTop: '3px' }}>تاریخ: {date}</div>
                  <div className="detail" style={{ fontSize: '12px', color: '#1f2937', marginTop: '3px' }}>وضعیت: <span style={{ color: config.color, fontWeight: '600' }}>صادر شده</span></div>
                </div>
              </div>

              {/* Custom Fields */}
              {fields && fields.length > 0 && (
                <div className="fields-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px', background: '#f9fafb', padding: '14px', borderRadius: '8px' }}>
                  {fields.map((field, i) => (
                    <div key={i} className="field" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span className="field-label" style={{ fontSize: '10px', color: '#6b7280' }}>{field.label}</span>
                      <span className="field-value" style={{ fontSize: '13px', fontWeight: '600', color: '#1f2937' }}>
                        {field.type === 'currency' ? formatAFN(Number(field.value)) : field.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Items Table */}
              {rows && rows.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                  <thead>
                    <tr>
                      <th style={{ background: `${config.color}10`, color: config.color, padding: '10px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '600', borderBottom: `2px solid ${config.color}`, width: '40px' }}>#</th>
                      <th style={{ background: `${config.color}10`, color: config.color, padding: '10px 8px', textAlign: 'right', fontSize: '11px', fontWeight: '600', borderBottom: `2px solid ${config.color}` }}>شرح</th>
                      {rows[0].qty !== undefined && <th style={{ background: `${config.color}10`, color: config.color, padding: '10px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '600', borderBottom: `2px solid ${config.color}` }}>تعداد</th>}
                      {rows[0].unit !== undefined && <th style={{ background: `${config.color}10`, color: config.color, padding: '10px 8px', textAlign: 'center', fontSize: '11px', fontWeight: '600', borderBottom: `2px solid ${config.color}` }}>واحد</th>}
                      {rows[0].price !== undefined && <th style={{ background: `${config.color}10`, color: config.color, padding: '10px 8px', textAlign: 'left', fontSize: '11px', fontWeight: '600', borderBottom: `2px solid ${config.color}` }}>قیمت واحد</th>}
                      {rows[0].total !== undefined && <th style={{ background: `${config.color}10`, color: config.color, padding: '10px 8px', textAlign: 'left', fontSize: '11px', fontWeight: '600', borderBottom: `2px solid ${config.color}` }}>جمع</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i}>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', fontSize: '12px', textAlign: 'center' }}>{i + 1}</td>
                        <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', fontSize: '12px' }}>{row.description}</td>
                        {row.qty !== undefined && <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', fontSize: '12px', textAlign: 'center' }}>{row.qty}</td>}
                        {row.unit !== undefined && <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', fontSize: '12px', textAlign: 'center' }}>{row.unit}</td>}
                        {row.price !== undefined && <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', fontSize: '12px', textAlign: 'left' }}>{formatAFN(row.price)}</td>}
                        {row.total !== undefined && <td style={{ padding: '10px 8px', borderBottom: '1px solid #f3f4f6', fontSize: '12px', textAlign: 'left', fontWeight: '600' }}>{formatAFN(row.total)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Totals - Formulas applied */}
              {rows && rows.length > 0 && (
                <div className="totals" style={{ marginRight: 'auto', marginLeft: 0, width: '280px', background: '#f9fafb', padding: '14px', borderRadius: '8px', marginBottom: '20px' }}>
                  <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px' }}>
                    <span>جمع جزء:</span>
                    <span>{formatAFN(calculatedSubtotal)}</span>
                  </div>
                  {calculatedTax > 0 && (
                    <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px' }}>
                      <span>مالیات {taxRate ? `(${taxRate}%)` : ''}:</span>
                      <span>{formatAFN(calculatedTax)}</span>
                    </div>
                  )}
                  {discount && discount > 0 && (
                    <div className="totals-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', color: '#dc2626' }}>
                      <span>تخفیف:</span>
                      <span>-{formatAFN(discount)}</span>
                    </div>
                  )}
                  <div className="totals-row total" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 6px', fontSize: '15px', fontWeight: '700', color: config.color, borderTop: `2px solid ${config.color}`, marginTop: '6px' }}>
                    <span>مبلغ نهایی:</span>
                    <span>{formatAFN(calculatedTotal)}</span>
                  </div>
                  {paidAmount !== undefined && paidAmount > 0 && (
                    <>
                      <div className="totals-row paid" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', color: '#059669' }}>
                        <span>پرداخت شده:</span>
                        <span>{formatAFN(paidAmount)}</span>
                      </div>
                      <div className="totals-row remaining" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>
                        <span>باقیمانده:</span>
                        <span>{formatAFN(remainingAmount)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Notes */}
              {notes && (
                <div className="notes" style={{ background: '#fffbeb', borderRight: '3px solid #f59e0b', padding: '10px 14px', borderRadius: '6px', marginBottom: '20px', fontSize: '11px', color: '#78350f' }}>
                  <strong>توضیحات:</strong> {notes}
                </div>
              )}

              {/* Signatures */}
              <div className="signatures" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '50px', paddingTop: '20px' }}>
                <div className="sig" style={{ textAlign: 'center' }}>
                  <div className="sig-line" style={{ borderTop: '1px solid #9ca3af', paddingTop: '6px', fontSize: '10px', color: '#6b7280', marginTop: '35px' }}>صادرکننده</div>
                </div>
                <div className="sig" style={{ textAlign: 'center' }}>
                  <div className="sig-line" style={{ borderTop: '1px solid #9ca3af', paddingTop: '6px', fontSize: '10px', color: '#6b7280', marginTop: '35px' }}>تایید کننده</div>
                </div>
                <div className="sig" style={{ textAlign: 'center' }}>
                  <div className="sig-line" style={{ borderTop: '1px solid #9ca3af', paddingTop: '6px', fontSize: '10px', color: '#6b7280', marginTop: '35px' }}>گیرنده / دریافت کننده</div>
                </div>
              </div>

              {/* Footer */}
              <div className="footer" style={{ textAlign: 'center', paddingTop: '15px', borderTop: '1px solid #e5e7eb', fontSize: '10px', color: '#9ca3af', marginTop: '30px' }}>
                این سند به صورت الکترونیکی صادر شده است • سیستم ERP Furniture • تاریخ چاپ: {new Date().toLocaleDateString('fa-IR')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
