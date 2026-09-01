import { institute } from '../data/masterAdminData.js'

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

function cleanupPrintFrame(frame) {
  try {
    frame?.parentNode?.removeChild(frame)
  } catch {
    /* ignore */
  }
}

function printHtmlDocument(html) {
  const existing = document.getElementById('tns-report-print-frame')
  if (existing) cleanupPrintFrame(existing)

  const frame = document.createElement('iframe')
  frame.id = 'tns-report-print-frame'
  frame.setAttribute('aria-hidden', 'true')
  frame.title = 'Institute report print'
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
    throw new Error('Unable to prepare report for printing')
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
    const remove = () => cleanupPrintFrame(frame)
    if (typeof frameWindow.onafterprint !== 'undefined') {
      frameWindow.onafterprint = remove
    }
    window.setTimeout(remove, 60_000)
  }

  if (frameDoc.readyState === 'complete') {
    window.setTimeout(triggerPrint, 120)
  } else {
    frame.onload = () => window.setTimeout(triggerPrint, 120)
  }
}

function tableHtml(title, columns, rows) {
  if (!columns?.length || !rows?.length) return ''
  const head = columns.map((col) => `<th>${esc(col.label)}</th>`).join('')
  const body = rows
    .map(
      (row) =>
        `<tr>${columns
          .map((col) => `<td>${line(col.render ? col.render(row) : row[col.key])}</td>`)
          .join('')}</tr>`,
    )
    .join('')
  return `
    <section class="block">
      <h2>${esc(title)}</h2>
      <table>
        <thead><tr>${head}</tr></thead>
        <tbody>${body}</tbody>
      </table>
    </section>
  `
}

export function printInstituteReport({
  title,
  description,
  periodLabel,
  filterLabel,
  stats = [],
  tables = [],
}) {
  const generated = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const statsHtml = stats.length
    ? `<div class="kpis">${stats
        .map(
          (st) =>
            `<article><p class="k-label">${esc(st.label)}</p><p class="k-value">${esc(st.value)}</p></article>`,
        )
        .join('')}</div>`
    : ''

  const tablesHtml = tables.map((t) => tableHtml(t.title, t.columns, t.rows)).join('')

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(title)} · ${esc(institute.short)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #0b1d3a; margin: 24px; }
    header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 3px solid #c41e3a; padding-bottom: 12px; }
    h1 { margin: 0; font-size: 20px; }
    .sub { margin: 4px 0 0; font-size: 12px; color: #475569; }
    .meta { text-align: right; font-size: 11px; color: #64748b; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 16px 0; }
    .kpis article { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; }
    .k-label { margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }
    .k-value { margin: 4px 0 0; font-size: 16px; font-weight: 700; }
    .block { margin-top: 18px; }
    h2 { font-size: 13px; margin: 0 0 8px; color: #c41e3a; text-transform: uppercase; letter-spacing: .06em; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; vertical-align: top; }
    th { background: #0b1d3a; color: #fff; font-weight: 600; }
    tr:nth-child(even) td { background: #f8fafc; }
    footer { margin-top: 24px; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    @page { margin: 12mm; }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>${esc(institute.name)}</h1>
      <p class="sub">${esc(institute.branch)} · ${esc(institute.address)}</p>
      <p class="sub">${esc(title)}${description ? ` — ${esc(description)}` : ''}</p>
    </div>
    <div class="meta">
      <p>${esc(periodLabel || '')}</p>
      <p>${esc(filterLabel || '')}</p>
      <p>Printed ${esc(generated)}</p>
      <p>${esc(institute.phone)}</p>
    </div>
  </header>
  ${statsHtml}
  ${tablesHtml}
  <footer>${esc(institute.short)} · Official institute report · ${esc(institute.email)}</footer>
</body>
</html>`

  printHtmlDocument(html)
}
