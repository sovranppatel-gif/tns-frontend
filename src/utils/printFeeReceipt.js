const INSTITUTE_NAME = 'GROW SKILLS TECH'
const INSTITUTE_TAG = 'IT TRAINING CENTER'

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function line(value) {
  const text = esc(value).trim()
  return text || '—'
}

function formatINR(amount) {
  const n = Number(amount) || 0
  return `₹${n.toLocaleString('en-IN')}`
}

function amountInWords(amount) {
  const n = Math.round(Number(amount) || 0)
  if (n === 0) return 'Zero Rupees Only'
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function twoDigits(num) {
    if (num < 20) return ones[num]
    return `${tens[Math.floor(num / 10)]}${num % 10 ? ` ${ones[num % 10]}` : ''}`.trim()
  }

  function threeDigits(num) {
    if (num < 100) return twoDigits(num)
    return `${ones[Math.floor(num / 100)]} Hundred${num % 100 ? ` ${twoDigits(num % 100)}` : ''}`.trim()
  }

  let remaining = n
  const crore = Math.floor(remaining / 10000000)
  remaining %= 10000000
  const lakh = Math.floor(remaining / 100000)
  remaining %= 100000
  const thousand = Math.floor(remaining / 1000)
  remaining %= 1000
  const hundred = remaining

  const parts = []
  if (crore) parts.push(`${threeDigits(crore)} Crore`)
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`)
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`)
  if (hundred) parts.push(threeDigits(hundred))
  return `${parts.join(' ')} Rupees Only`
}

function findInstallmentLabel(feeDetail, payment) {
  if (!payment?.installmentId) return '—'
  const ins = (feeDetail?.installments || []).find((i) => i.id === payment.installmentId)
  return ins?.label || payment.installmentId
}

function ordinal(n) {
  const num = Number(n) || 0
  if (num <= 0) return String(n)
  const v = num % 100
  if (v >= 11 && v <= 13) return `${num}th`
  switch (num % 10) {
    case 1:
      return `${num}st`
    case 2:
      return `${num}nd`
    case 3:
      return `${num}rd`
    default:
      return `${num}th`
  }
}

function slugPart(value, fallback = '') {
  const cleaned = String(value || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
  return cleaned || fallback
}

/**
 * e.g. Registration | 1st_Installment | 2nd_Installment | Exam
 */
function resolveInstallmentFilePart(feeDetail, payment) {
  const list = feeDetail?.installments || []
  const byId = list.find((i) => i.id === payment?.installmentId)
  const label = byId?.label || findInstallmentLabel(feeDetail, payment)
  const category = byId?.category || ''

  if (/regist/i.test(label) || /regist/i.test(category)) return 'Registration'
  if (/exam/i.test(label) || /exam/i.test(category)) return 'Exam'

  const fromLabel = String(label).match(/installment\s*(\d+)/i)
  if (fromLabel) return `${ordinal(Number(fromLabel[1]))}_Installment`

  const fromId = String(payment?.installmentId || '').match(/ins-(\d+)/i)
  if (fromId) return `${ordinal(Number(fromId[1]))}_Installment`

  // Fall back to position among tuition-like installments
  const tuition = list.filter(
    (i) => !/regist|exam/i.test(`${i.label || ''} ${i.category || ''}`),
  )
  const tIdx = tuition.findIndex((i) => i.id === payment?.installmentId)
  if (tIdx >= 0) return `${ordinal(tIdx + 1)}_Installment`

  const allIdx = list.findIndex((i) => i.id === payment?.installmentId)
  if (allIdx >= 0) return `${ordinal(allIdx + 1)}_Installment`

  if (label && label !== '—') return slugPart(label, 'Installment')
  return 'Installment'
}

/**
 * Auto filename for print/download:
 * StudentName_CourseName_1st_Installment_Receipt
 */
export function buildFeeReceiptFileName(feeDetail, payment, ext = 'pdf') {
  const student = slugPart(feeDetail?.student, 'Student')
  const course = slugPart(feeDetail?.course || feeDetail?.courseCode, 'Course')
  const installment = resolveInstallmentFilePart(feeDetail, payment)
  const base = [student, course, installment, 'Receipt'].filter(Boolean).join('_')
  const safeExt = String(ext || 'pdf').replace(/^\./, '')
  return `${base}.${safeExt}`
}

function buildReceiptHtml(feeDetail, payment) {
  const printedAt = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const amount = Number(payment?.amount) || 0
  const installmentLabel = findInstallmentLabel(feeDetail, payment)
  // Browser "Save as PDF" uses <title> as the suggested file name
  const fileTitle = buildFeeReceiptFileName(feeDetail, payment, 'pdf').replace(/\.pdf$/i, '')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(fileTitle)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: "Segoe UI", Arial, sans-serif;
      color: #0f172a;
      background: #fff;
    }
    .sheet {
      max-width: 780px;
      margin: 0 auto;
      border: 2px solid #0f766e;
      border-radius: 8px;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(90deg, #0f766e, #0d9488);
      color: #fff;
      padding: 18px 22px;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
    }
    .brand h1 {
      margin: 0;
      font-size: 22px;
      letter-spacing: 0.04em;
    }
    .brand p {
      margin: 4px 0 0;
      font-size: 12px;
      opacity: 0.92;
    }
    .receipt-meta {
      text-align: right;
      font-size: 12px;
      line-height: 1.5;
    }
    .badge {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,0.18);
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .body { padding: 20px 22px 24px; }
    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 12px;
    }
    .title-row h2 {
      margin: 0;
      font-size: 18px;
      color: #0f766e;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 24px;
      margin-bottom: 18px;
    }
    .field label {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 2px;
    }
    .field div {
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }
    .amount-box {
      border: 1px solid #99f6e4;
      background: #f0fdfa;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 16px;
    }
    .amount-box .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #0f766e;
      margin-bottom: 4px;
    }
    .amount-box .value {
      font-size: 28px;
      font-weight: 800;
      color: #115e59;
    }
    .amount-box .words {
      margin-top: 6px;
      font-size: 12px;
      color: #334155;
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 18px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 9px 10px;
      text-align: left;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 22px;
    }
    .summary .card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      background: #fff;
    }
    .summary .card span {
      display: block;
      font-size: 11px;
      color: #64748b;
      margin-bottom: 2px;
    }
    .summary .card strong {
      font-size: 15px;
      color: #0f172a;
    }
    .note {
      font-size: 12px;
      color: #475569;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 22px;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 28px;
    }
    .sign {
      text-align: center;
      padding-top: 36px;
      border-top: 1px solid #94a3b8;
      font-size: 12px;
      color: #475569;
    }
    .footer {
      margin-top: 18px;
      font-size: 11px;
      color: #64748b;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .sheet { border-radius: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        <h1>${esc(INSTITUTE_NAME)}</h1>
        <p>${esc(INSTITUTE_TAG)}</p>
      </div>
      <div class="receipt-meta">
        <div>Fee Receipt</div>
        <div>Printed: ${esc(printedAt)}</div>
        <div class="badge">${esc(payment?.status || 'Success')}</div>
      </div>
    </div>
    <div class="body">
      <div class="title-row">
        <h2>Payment Receipt</h2>
        <div style="font-size:12px;color:#64748b;">Keep this for your records</div>
      </div>

      <div class="grid">
        <div class="field"><label>Receipt / Payment ID</label><div>${line(payment?.id)}</div></div>
        <div class="field"><label>Invoice No.</label><div>${line(payment?.invoice)}</div></div>
        <div class="field"><label>Student Name</label><div>${line(feeDetail?.student)}</div></div>
        <div class="field"><label>Admission ID</label><div>${line(feeDetail?.admissionId)}</div></div>
        <div class="field"><label>Email</label><div>${line(feeDetail?.email)}</div></div>
        <div class="field"><label>Phone</label><div>${line(feeDetail?.phone)}</div></div>
        <div class="field"><label>Course</label><div>${line(feeDetail?.course)}</div></div>
        <div class="field"><label>Course Code</label><div>${line(feeDetail?.courseCode)}</div></div>
        <div class="field"><label>Fee ID</label><div>${line(feeDetail?.feeId)}</div></div>
        <div class="field"><label>Category</label><div>${line(feeDetail?.category)}</div></div>
      </div>

      <div class="amount-box">
        <div class="label">Amount Received</div>
        <div class="value">${esc(payment?.amountLabel || formatINR(amount))}</div>
        <div class="words">${esc(amountInWords(amount))}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Payment Date</th>
            <th>Method</th>
            <th>Installment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${line(payment?.date)}</td>
            <td>${line(payment?.method || payment?.mode)}</td>
            <td>${line(installmentLabel)}</td>
            <td>${line(payment?.status)}</td>
          </tr>
        </tbody>
      </table>

      <div class="summary">
        <div class="card"><span>Course Total</span><strong>${esc(feeDetail?.amount || formatINR(feeDetail?.totalAmount))}</strong></div>
        <div class="card"><span>Total Paid</span><strong>${esc(feeDetail?.paid || formatINR(feeDetail?.paidAmount))}</strong></div>
        <div class="card"><span>Balance Due</span><strong>${esc(feeDetail?.due || formatINR(feeDetail?.dueAmount))}</strong></div>
      </div>

      ${
        payment?.note
          ? `<div class="note"><strong>Remark:</strong> ${esc(payment.note)}</div>`
          : ''
      }
      ${
        payment?.proofName
          ? `<div class="note"><strong>Proof:</strong> ${esc(payment.proofName)}</div>`
          : ''
      }

      <div class="signatures">
        <div class="sign">Student / Guardian Signature</div>
        <div class="sign">Authorized Signatory<br/>${esc(INSTITUTE_NAME)}</div>
      </div>

      <div class="footer">
        This is a computer-generated fee receipt from ${esc(INSTITUTE_NAME)}. For queries contact the accounts desk.
      </div>
    </div>
  </div>
</body>
</html>`
}

function cleanupPrintFrame(frame) {
  if (!frame) return
  try {
    if (frame.parentNode) frame.parentNode.removeChild(frame)
  } catch {
    // ignore
  }
}

/**
 * Print HTML via a hidden iframe (no popup window — avoids browser blockers).
 */
function printHtmlDocument(html) {
  const existing = document.getElementById('fee-receipt-print-frame')
  if (existing) cleanupPrintFrame(existing)

  const frame = document.createElement('iframe')
  frame.id = 'fee-receipt-print-frame'
  frame.setAttribute('aria-hidden', 'true')
  frame.title = 'Fee receipt print'
  Object.assign(frame.style, {
    position: 'fixed',
    right: '0',
    bottom: '0',
    width: '0',
    height: '0',
    border: '0',
    opacity: '0',
    pointerEvents: 'none',
  })
  document.body.appendChild(frame)

  const frameWindow = frame.contentWindow
  const frameDoc = frame.contentDocument || frameWindow?.document
  if (!frameWindow || !frameDoc) {
    cleanupPrintFrame(frame)
    throw new Error('Unable to prepare receipt for printing')
  }

  frameDoc.open()
  frameDoc.write(html)
  frameDoc.close()

  const triggerPrint = () => {
    try {
      frameWindow.focus()
      frameWindow.print()
    } catch (err) {
      cleanupPrintFrame(frame)
      throw err instanceof Error ? err : new Error('Unable to open print dialog')
    }
    // Remove after print dialog closes (or after a short delay as fallback)
    const remove = () => cleanupPrintFrame(frame)
    if (typeof frameWindow.onafterprint !== 'undefined') {
      frameWindow.onafterprint = remove
    }
    window.setTimeout(remove, 60_000)
  }

  // Wait a tick so layout/images settle before print
  if (frameDoc.readyState === 'complete') {
    window.setTimeout(triggerPrint, 100)
  } else {
    frame.onload = () => window.setTimeout(triggerPrint, 100)
  }
}

export function printFeeReceipt(feeDetail, payment) {
  if (!feeDetail || !payment) {
    throw new Error('Fee and payment details are required to print receipt')
  }
  printHtmlDocument(buildReceiptHtml(feeDetail, payment))
}

/**
 * Download receipt as HTML file with auto student/course/installment file name.
 * (Print → Save as PDF also uses the same title-based name.)
 */
export function downloadFeeReceipt(feeDetail, payment) {
  if (!feeDetail || !payment) {
    throw new Error('Fee and payment details are required to download receipt')
  }
  const html = buildReceiptHtml(feeDetail, payment)
  const filename = buildFeeReceiptFileName(feeDetail, payment, 'html')
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
  return filename
}

export function buildFeeScheduleFileName(feeDetail, ext = 'pdf') {
  const student = slugPart(feeDetail?.student, 'Student')
  const course = slugPart(feeDetail?.course || feeDetail?.courseCode, 'Course')
  const feeId = slugPart(feeDetail?.feeId || feeDetail?.id, 'Fee')
  const base = [student, course, feeId, 'Fee_Schedule'].filter(Boolean).join('_')
  const safeExt = String(ext || 'pdf').replace(/^\./, '')
  return `${base}.${safeExt}`
}

function formatStatementDate(raw, fallback = '—') {
  if (raw) {
    const d = new Date(raw)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    }
  }
  return fallback || '—'
}

function buildFeeScheduleHtml(feeDetail) {
  const printedAt = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const fileTitle = buildFeeScheduleFileName(feeDetail, 'pdf').replace(/\.pdf$/i, '')
  const installments = feeDetail?.installments || []
  const payments = [...(feeDetail?.payments || [])].sort((a, b) => {
    const ta = new Date(a.dateRaw || a.date).getTime() || 0
    const tb = new Date(b.dateRaw || b.date).getTime() || 0
    return ta - tb
  })
  const installmentRows = installments.length
    ? installments
        .map(
          (ins) => `<tr>
            <td>
              <strong>${line(ins.label)}</strong>
              <div class="muted">${line(ins.category)}</div>
            </td>
            <td>${line(ins.amountLabel || formatINR(ins.amount))}</td>
            <td>${line(ins.paidLabel || formatINR(ins.paid))}</td>
            <td>${line(ins.dueLabel || formatINR(ins.due))}</td>
            <td>${line(ins.dueDate)}</td>
            <td>${line(ins.paidDate)}</td>
            <td>${line(ins.status)}</td>
          </tr>`,
        )
        .join('')
    : `<tr><td colspan="7" class="empty">No installments found.</td></tr>`

  const paymentRows = payments.length
    ? payments
        .map(
          (p) => `<tr>
            <td>${line(p.id)}</td>
            <td>${line(p.method)}</td>
            <td>${line(p.amountLabel || formatINR(p.amount))}</td>
            <td>${line(formatStatementDate(p.dateRaw, p.date))}</td>
            <td>${line(p.status)}</td>
            <td>${line(p.note)}</td>
          </tr>`,
        )
        .join('')
    : `<tr><td colspan="6" class="empty">No payments recorded.</td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${esc(fileTitle)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: "Segoe UI", Arial, sans-serif;
      color: #0f172a;
      background: #fff;
    }
    .sheet { max-width: 900px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      padding: 16px 18px;
      border-radius: 10px;
      background: linear-gradient(90deg, #FF5E14, #008C95);
      color: #fff;
    }
    .brand h1 { margin: 0; font-size: 22px; letter-spacing: 0.04em; }
    .brand p { margin: 4px 0 0; font-size: 12px; opacity: 0.92; }
    .meta { text-align: right; font-size: 12px; line-height: 1.5; }
    .badge {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,0.18);
      font-weight: 700;
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    h2 { margin: 22px 0 10px; font-size: 16px; color: #0f766e; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px 20px;
    }
    .field label {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 2px;
    }
    .field div { font-size: 14px; font-weight: 600; }
    .totals {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-top: 16px;
    }
    .total-box {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .total-box span { display: block; font-size: 11px; color: #64748b; text-transform: uppercase; }
    .total-box strong { display: block; margin-top: 4px; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #475569; }
    .muted { font-size: 11px; color: #64748b; font-weight: 400; }
    .empty { text-align: center; color: #64748b; }
    .footer { margin-top: 22px; font-size: 11px; color: #64748b; }
    @media print {
      body { padding: 0; }
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        <h1>${esc(INSTITUTE_NAME)}</h1>
        <p>${esc(INSTITUTE_TAG)}</p>
      </div>
      <div class="meta">
        Fee schedule<br/>
        Printed ${esc(printedAt)}<br/>
        <span class="badge">${esc(feeDetail?.status || 'Fee')}</span>
      </div>
    </div>

    <h2>Student details</h2>
    <div class="grid">
      <div class="field"><label>Student</label><div>${line(feeDetail?.student)}</div></div>
      <div class="field"><label>Fee ID</label><div>${line(feeDetail?.feeId || feeDetail?.id)}</div></div>
      <div class="field"><label>Admission ID</label><div>${line(feeDetail?.admissionId)}</div></div>
      <div class="field"><label>Course</label><div>${line(feeDetail?.course)}${feeDetail?.courseCode ? ` (${esc(feeDetail.courseCode)})` : ''}</div></div>
      <div class="field"><label>Email</label><div>${line(feeDetail?.email)}</div></div>
      <div class="field"><label>Phone</label><div>${line(feeDetail?.phone)}</div></div>
      <div class="field"><label>Category</label><div>${line(feeDetail?.category)}</div></div>
      <div class="field"><label>Installments</label><div>${line(feeDetail?.installment)}</div></div>
    </div>

    <div class="totals">
      <div class="total-box"><span>Total fee</span><strong>${esc(formatINR(feeDetail?.totalAmount))}</strong></div>
      <div class="total-box"><span>Paid</span><strong>${esc(formatINR(feeDetail?.paidAmount))}</strong></div>
      <div class="total-box"><span>Discount</span><strong>${esc(formatINR(feeDetail?.discountAmount))}</strong></div>
      <div class="total-box"><span>Due</span><strong>${esc(formatINR(feeDetail?.dueAmount))}</strong></div>
    </div>

    <h2>Installments</h2>
    <table>
      <thead>
        <tr>
          <th>Installment</th>
          <th>Amount</th>
          <th>Paid</th>
          <th>Due</th>
          <th>Due date</th>
          <th>Paid date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${installmentRows}</tbody>
    </table>

    <h2>Payment history</h2>
    <table>
      <thead>
        <tr>
          <th>Payment ID</th>
          <th>Method</th>
          <th>Amount</th>
          <th>Date</th>
          <th>Status</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>${paymentRows}</tbody>
    </table>

    <div class="footer">
      This is a computer-generated fee schedule from ${esc(INSTITUTE_NAME)}.
    </div>
  </div>
</body>
</html>`
}

export function printFeeSchedule(feeDetail) {
  if (!feeDetail) {
    throw new Error('Fee details are required to print the schedule')
  }
  printHtmlDocument(buildFeeScheduleHtml(feeDetail))
  return buildFeeScheduleFileName(feeDetail, 'pdf')
}
