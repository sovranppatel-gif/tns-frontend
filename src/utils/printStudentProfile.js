const INSTITUTE = 'TNS ITI & Computer'
const PLACE = 'Narsinghpur'

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

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function buildPrintHtml(student) {
  const contact = student?.contact || {}
  const address = student?.address || {}
  const photo = student?.photo
    ? `<img src="${String(student.photo).replace(/"/g, '&quot;')}" alt="Photo" style="width:100%;height:100%;object-fit:cover;" />`
    : '<span style="font-size:11px;color:#666;">Photo</span>'

  const addr = [
    address.permanent,
    address.village,
    address.post,
    address.tehsil,
    address.district,
    address.state,
    address.pinCode,
  ]
    .filter(Boolean)
    .join(', ')

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(student.studentId || 'Student')} · Profile</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", Arial, sans-serif; color: #0f172a; margin: 0; padding: 24px; }
    .sheet { max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; }
    .head { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: linear-gradient(90deg,#008C95,#FF5E14); color: #fff; }
    .head h1 { margin: 0; font-size: 18px; letter-spacing: .08em; }
    .head p { margin: 2px 0 0; font-size: 12px; opacity: .9; }
    .body { padding: 20px; }
    .hero { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 18px; }
    .photo { width: 96px; height: 112px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #f8fafc; display:flex; align-items:center; justify-content:center; }
    h2 { margin: 0 0 4px; font-size: 20px; }
    .muted { color: #64748b; font-size: 12px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; }
    .item label { display:block; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; }
    .item div { font-size: 13px; font-weight: 600; margin-top: 2px; }
    .section { margin-top: 18px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
    .section h3 { margin: 0 0 10px; font-size: 13px; color: #008C95; text-transform: uppercase; letter-spacing: .08em; }
    @media print { body { padding: 0; } .sheet { border: none; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div>
        <h1>${esc(INSTITUTE)}</h1>
        <p>${esc(PLACE)} · Student Profile</p>
      </div>
      <div style="text-align:right;font-size:12px;">
        <div>${line(student.studentId)}</div>
        <div>${line(student.status)}</div>
      </div>
    </div>
    <div class="body">
      <div class="hero">
        <div class="photo">${photo}</div>
        <div>
          <h2>${line(student.nameEnglish)}</h2>
          <p class="muted">${student.nameHindi ? esc(student.nameHindi) : ''}</p>
          <p class="muted">Admission ${line(student.admissionId)}</p>
        </div>
      </div>
      <div class="grid">
        <div class="item"><label>University</label><div>${line(student.universityLabel)}</div></div>
        <div class="item"><label>Course</label><div>${line(student.courseLabel)}</div></div>
        <div class="item"><label>Batch</label><div>${line(student.batchLabel)}</div></div>
        <div class="item"><label>Session</label><div>${line(student.session)}</div></div>
        <div class="item"><label>Current Term</label><div>${line(student.currentTermLabel)}</div></div>
        <div class="item"><label>Admission Date</label><div>${line(student.admissionDateLabel || formatDate(student.admissionDate))}</div></div>
        <div class="item"><label>Father</label><div>${line(student.fatherName)}</div></div>
        <div class="item"><label>Mother</label><div>${line(student.motherName)}</div></div>
        <div class="item"><label>Mobile</label><div>${line(contact.mobile || student.mobile)}</div></div>
        <div class="item"><label>Email</label><div>${line(contact.email || student.email)}</div></div>
      </div>
      <div class="section">
        <h3>Address</h3>
        <div class="item"><div>${line(addr)}</div></div>
      </div>
    </div>
  </div>
  <script>window.onload = function () { window.print(); }</script>
</body>
</html>`
}

export function printStudentProfile(student) {
  if (!student) return
  const popup = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100')
  if (!popup) {
    throw new Error('Pop-up blocked. Allow pop-ups to print the student profile.')
  }
  popup.document.open()
  popup.document.write(buildPrintHtml(student))
  popup.document.close()
}
