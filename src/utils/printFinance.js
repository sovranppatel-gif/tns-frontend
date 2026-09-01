const INSTITUTE = 'THAKUR NIRANJAN SINGH I.T.I. & COMPUTER'

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inr(amount) {
  return `₹${(Number(amount) || 0).toLocaleString('en-IN')}`
}

function openPrint(title, bodyHtml) {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>
    body { font-family: "Segoe UI", Arial, sans-serif; color: #0b1d3a; margin: 0; padding: 24px; }
    .sheet { max-width: 720px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; }
    header { padding: 18px 22px; border-bottom: 3px solid #c41e3a; }
    h1 { margin: 0; font-size: 16px; letter-spacing: .04em; }
    h2 { margin: 0; font-size: 18px; }
    .muted { color: #64748b; font-size: 12px; }
    .body { padding: 20px 22px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; text-align: left; }
    th { font-size: 11px; text-transform: uppercase; color: #64748b; }
    .tot { font-weight: 700; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; margin-bottom: 16px; }
    .label { font-size: 11px; text-transform: uppercase; color: #64748b; }
    .val { font-weight: 600; }
    @media print { button { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="sheet">${bodyHtml}</div>
  <p style="text-align:center;margin-top:16px"><button onclick="window.print()">Print</button></p>
  <script>window.onload = function () { setTimeout(function () { window.print(); }, 250); };</script>
</body>
</html>`
  const w = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900')
  if (!w) throw new Error('Pop-up blocked. Allow pop-ups to print.')
  w.document.write(html)
  w.document.close()
}

export function printPaymentReceipt(payment) {
  const body = `
    <header>
      <h1>${esc(INSTITUTE)}</h1>
      <p class="muted">Payment Receipt</p>
    </header>
    <div class="body">
      <div class="grid">
        <div><div class="label">Transaction ID</div><div class="val">${esc(payment.paymentId)}</div></div>
        <div><div class="label">Date</div><div class="val">${esc(payment.dateLabel || payment.date)}</div></div>
        <div><div class="label">Type</div><div class="val">${esc(payment.type || payment.direction)}</div></div>
        <div><div class="label">Source</div><div class="val">${esc(payment.sourceType)} / ${esc(payment.sourceId)}</div></div>
        <div><div class="label">Paid By / Paid To</div><div class="val">${esc(payment.partyName)}</div></div>
        <div><div class="label">Method</div><div class="val">${esc(payment.method)}</div></div>
        <div><div class="label">Account</div><div class="val">${esc(payment.financialAccountCode || payment.account)}</div></div>
        <div><div class="label">Reference</div><div class="val">${esc(payment.referenceNumber || '—')}</div></div>
      </div>
      <p style="font-size:22px;font-weight:700;margin:8px 0 16px">${inr(payment.amount)}</p>
      <p class="muted">${esc(payment.notes || '')}</p>
      <p class="muted">Status: ${esc(payment.status)}</p>
    </div>`
  openPrint(`Receipt ${payment.paymentId}`, body)
}

export function printPayslip(slip) {
  const earn = (slip.earnings || []).map((r) => `<tr><td>${esc(r.name)}</td><td>${inr(r.amount)}</td></tr>`).join('')
  const ded = (slip.deductionLines || []).map((r) => `<tr><td>${esc(r.name)}</td><td>${inr(r.amount)}</td></tr>`).join('')
  const body = `
    <header>
      <h1>${esc(slip.organization?.name || INSTITUTE)}</h1>
      <p class="muted">Payslip — ${esc(slip.period)}</p>
    </header>
    <div class="body">
      <div class="grid">
        <div><div class="label">Employee</div><div class="val">${esc(slip.employee)}</div></div>
        <div><div class="label">Employee ID</div><div class="val">${esc(slip.employeeCode)}</div></div>
        <div><div class="label">Department</div><div class="val">${esc(slip.department || '—')}</div></div>
        <div><div class="label">Designation</div><div class="val">${esc(slip.designation || '—')}</div></div>
        <div><div class="label">Type</div><div class="val">${esc(slip.employeeType)}</div></div>
        <div><div class="label">Payment Date</div><div class="val">${esc(slip.paymentDate)}</div></div>
      </div>
      <h2>Earnings</h2>
      <table>${earn}<tr class="tot"><td>Gross Salary</td><td>${inr(slip.grossSalary)}</td></tr></table>
      <h2 style="margin-top:18px">Deductions</h2>
      <table>${ded || '<tr><td colspan="2">None</td></tr>'}<tr class="tot"><td>Total Deductions</td><td>${inr(slip.totalDeductions)}</td></tr></table>
      <p style="font-size:20px;font-weight:700;margin-top:16px">Net Pay: ${inr(slip.netPayable)}</p>
      <p class="muted">Payment status: ${esc(slip.status)} · Paid: ${inr(slip.paidAmount)}</p>
    </div>`
  openPrint(`Payslip ${slip.itemId}`, body)
}
