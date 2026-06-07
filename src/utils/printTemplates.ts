interface PrintTotal {
  label: string;
  value: string;
}

interface PrintDocumentOptions {
  title: string;
  subtitle?: string;
  documentNo?: string;
  party?: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  totals?: PrintTotal[];
  note?: string;
}

const escapeHtml = (value: string | number) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export function printMinimalDocument(options: PrintDocumentOptions) {
  const printedAt = new Intl.DateTimeFormat('fa-AF', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  const totals = options.totals?.length
    ? `<div class="totals">${options.totals
        .map((item) => `<div><span>${escapeHtml(item.label)}</span><b>${escapeHtml(item.value)}</b></div>`)
        .join('')}</div>`
    : '';

  const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(options.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f8fafc; color: #0f172a; font-family: Tahoma, Arial, sans-serif; }
    .page { width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; padding: 18mm; }
    .top { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e2e8f0; padding-bottom: 18px; }
    .brand { font-size: 18px; font-weight: 800; }
    .muted { color: #64748b; font-size: 11px; margin-top: 6px; }
    .title { text-align: left; }
    .title h1 { margin: 0; font-size: 22px; }
    .chip { display: inline-block; margin-top: 8px; padding: 4px 10px; border-radius: 999px; background: #eef2ff; color: #3730a3; font-size: 11px; font-weight: 700; }
    .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0; }
    .meta div { border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; }
    .meta span { display: block; color: #64748b; font-size: 10px; margin-bottom: 5px; }
    .meta b { font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
    th { background: #f8fafc; color: #475569; font-weight: 800; text-align: right; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; }
    tr:last-child td { border-bottom: none; }
    .totals { margin-top: 18px; margin-right: auto; width: 270px; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
    .totals div { display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
    .totals div:last-child { border-bottom: none; background: #f8fafc; }
    .totals span { color: #64748b; }
    .signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; margin-top: 42px; }
    .sig { border-top: 1px solid #94a3b8; padding-top: 8px; color: #64748b; font-size: 11px; text-align: center; }
    .note { margin-top: 24px; color: #64748b; font-size: 10px; line-height: 1.8; }
    @media print { body { background: #fff; } .page { width: auto; min-height: auto; margin: 0; padding: 14mm; } }
  </style>
</head>
<body>
  <main class="page">
    <section class="top">
      <div>
        <div class="brand">فروشگاه فرنیچر و یراق</div>
        <div class="muted">سیستم مدیریت ERP | ارز پایه: افغانی</div>
      </div>
      <div class="title">
        <h1>${escapeHtml(options.title)}</h1>
        ${options.subtitle ? `<div class="chip">${escapeHtml(options.subtitle)}</div>` : ''}
      </div>
    </section>
    <section class="meta">
      <div><span>شماره سند</span><b>${escapeHtml(options.documentNo || `DOC-${Date.now().toString().slice(-6)}`)}</b></div>
      <div><span>طرف حساب / بخش</span><b>${escapeHtml(options.party || 'عمومی')}</b></div>
      <div><span>تاریخ چاپ</span><b>${escapeHtml(printedAt)}</b></div>
    </section>
    <table>
      <thead><tr>${options.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
      <tbody>
        ${options.rows.length
          ? options.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')
          : `<tr><td colspan="${options.headers.length}">موردی برای نمایش وجود ندارد</td></tr>`}
      </tbody>
    </table>
    ${totals}
    <section class="signatures"><div class="sig">امضای مسئول</div><div class="sig">امضای مشتری / تاییدکننده</div></section>
    <p class="note">${escapeHtml(options.note || 'این سند توسط سیستم ERP تولید شده است. لطفاً قبل از استفاده رسمی، اطلاعات را بررسی کنید.')}</p>
  </main>
  <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 400); };</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=1000');
  if (!win) return;
  win.document.open();
  win.document.write(html);
  win.document.close();
}
