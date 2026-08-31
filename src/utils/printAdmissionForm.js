const INSTITUTE_NAME = 'GROW SKILLS TECH'
const INSTITUTE_PLACE = 'IT TRAINING CENTER'
const INSTITUTE_HINDI = 'ग्रो स्किल्स टेक'

const AFFIDAVIT_RULES = [
  'मैं यह वचन देता / देती हूँ कि मेरे द्वारा जमा की गई फीस किसी भी परिस्थिति में वापस नहीं ली जावेगी।',
  'मैं यह वचन देता / देती हूँ कि संस्थान में निर्धारित फीस प्रत्येक माह की 1 तारीख से 10 तारीख तक जमा करूंगा / करूंगी।',
  'मैं यह वचन देता / देती हूँ कि संस्थान में होने वाली समस्त सूचनायें सूचना पट्‌टिका के माध्यम से दी जावेगी।',
  'मैं यह वचन देता / देती हूँ कि संस्थान द्वारा दिये गये समस्त निर्देशों का पालन करूंगा / करूंगी।',
  'मैं यह वचन देता / देती हूँ कि निर्धारित समय पर फीस जमा न करने पर संस्थान द्वारा वैधानिक कार्यवाही की जा सकती है।',
  'मैं यह वचन देता / देती हूँ कि अध्ययन काल में 75% उपस्थिति अनिवार्य होगी।',
  'मैं यह वचन देता / देती हूँ कि समस्त अध्ययन कार्य संस्थान द्वारा निर्धारित समय में पूर्ण करूंगा / करूंगी।',
  'मैं यह वचन देता / देती हूँ कि संस्थान में अनुशासनहीनता / दुर्व्यवहार नहीं करूंगा / करूंगी।',
]

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function line(value) {
  const text = esc(value).trim()
  return text || '&nbsp;'
}

function formatDob(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-GB')
}

function buildPrintHtml(row) {
  const d = row?.details && typeof row.details === 'object' ? row.details : {}
  const education = Array.isArray(d.education) && d.education.length ? d.education : [{}]

  const nameEnglish = d.nameEnglish || row.applicant || ''
  const fatherName = d.fatherName || ''
  const course =
    row.course ||
    d.courseNameSnapshot ||
    [d.courseNameSnapshot, d.courseCodeSnapshot].filter(Boolean).join(' — ') ||
    ''
  const universityName =
    d.universityNameSnapshot || d.universityName || row.college || ''
  const session = d.session || row.session || ''
  const termLabel =
    (d.termType || row.termType) && (d.termNumber || row.termNumber)
      ? `${d.termType || row.termType} ${d.termNumber || row.termNumber}`
      : ''
  const institutionName = d.institutionName || INSTITUTE_HINDI
  const admissionDate = formatDob(row.admissionDate || d.admissionDate)
  const contactNo = d.contactNo || row.phone || ''
  const email = row.email || ''
  const permanentAddress = d.permanentAddress || ''
  const guardianName = d.guardianName || fatherName
  const guardianAddress = d.guardianAddress || permanentAddress
  const studentMobile = d.studentMobile || contactNo
  const registrationNo = d.registrationNo || row.admissionId || ''

  const eduRows = education
    .map((r) => {
      const docLabel = r.documentName || (r.documentUrl ? 'Attached' : '')
      return `
      <tr>
        <td>${line(r.className)}</td>
        <td>${line(r.board)}</td>
        <td>${line(r.year)}</td>
        <td>${line(r.rollNo)}</td>
        <td>${line(r.percentage)}</td>
        <td>${line(r.division)}</td>
        <td>${line(docLabel)}</td>
      </tr>`
    })
    .join('')

  const photo = d.photoPreview
    ? `<img src="${String(d.photoPreview).replace(/"/g, '&quot;')}" alt="Photo" style="width:100%;height:100%;object-fit:cover;" />`
    : '<span style="font-size:10px;color:#666;">Photo</span>'

  const rules = AFFIDAVIT_RULES.map((rule, i) => `<li>${i + 1}. ${esc(rule)}</li>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Admission Form — ${esc(nameEnglish || registrationNo)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      background: #fff;
      font-size: 13px;
    }
    .sheet {
      max-width: 800px;
      margin: 0 auto 24px;
      border: 2px solid #000;
      padding: 20px 22px;
      page-break-after: always;
    }
    .sheet:last-child { page-break-after: auto; }
    .header { text-align: center; position: relative; padding-right: 110px; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.4px; }
    .header .place { margin: 2px 0 8px; font-weight: 700; text-transform: uppercase; }
    .course-box {
      display: inline-block;
      border: 1px solid #000;
      padding: 4px 12px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .session { font-weight: 700; margin: 0; }
    .photo {
      position: absolute;
      right: 0;
      top: 0;
      width: 96px;
      height: 120px;
      border: 1px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #fff;
    }
    .row { display: flex; gap: 10px; margin: 7px 0; align-items: flex-end; flex-wrap: wrap; }
    .row .label { white-space: nowrap; font-weight: 600; }
    .row .value {
      flex: 1;
      min-width: 140px;
      border-bottom: 1px dotted #000;
      min-height: 18px;
      text-transform: uppercase;
      padding: 0 4px 1px;
    }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
    table.edu {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      margin-bottom: 8px;
    }
    table.edu th, table.edu td {
      border: 1px solid #000;
      padding: 5px 4px;
      text-align: center;
      text-transform: uppercase;
      font-size: 12px;
    }
    .section-title { font-weight: 700; margin: 10px 0 4px; }
    .sigs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-top: 28px;
      text-align: center;
    }
    .sigs .space { height: 48px; }
    .affidavit-title { text-align: center; font-size: 26px; margin: 0 0 14px; font-weight: 800; }
    .rules { margin: 0 0 16px 18px; padding: 0; line-height: 1.55; }
    .rules li { margin-bottom: 6px; list-style: none; }
    .declare { line-height: 1.9; margin-bottom: 18px; }
    .underline {
      display: inline-block;
      min-width: 140px;
      border-bottom: 1px dotted #000;
      padding: 0 4px;
      text-transform: uppercase;
      font-weight: 600;
    }
    .footer-cols {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px;
      border-top: 1px dashed #999;
      padding-top: 16px;
    }
    .footer-cols h3 { text-align: center; margin: 0 0 36px; font-size: 14px; }
    @media print {
      body { padding: 0; }
      .sheet { border-width: 1.5px; margin-bottom: 0; }
    }
  </style>
</head>
<body>
  <article class="sheet">
    <header class="header">
      <div class="photo">${photo}</div>
      <h1>${esc(INSTITUTE_NAME)}</h1>
      <p class="place">${esc(INSTITUTE_PLACE)}</p>
      <div class="course-box">${line(course)}</div>
      ${universityName ? `<p class="session">${line(universityName)}</p>` : ''}
      <p class="session">Session ${line(session)}</p>
    </header>

    <div class="row"><span class="label">Registration No :</span><span class="value">${line(registrationNo)}</span></div>
    ${
      termLabel
        ? `<div class="row"><span class="label">Academic Term :</span><span class="value">${line(termLabel)}</span></div>`
        : ''
    }
    <div class="row"><span class="label">Name of applicant (in Hindi) :</span><span class="value" style="text-transform:none">${line(d.nameHindi)}</span></div>
    <div class="row"><span class="label">Name of applicant (in English) :</span><span class="value">${line(nameEnglish)}</span></div>
    <div class="row"><span class="label">Father's Name :</span><span class="value">${line(fatherName)}</span></div>
    <div class="row"><span class="label">Mother's Name :</span><span class="value">${line(d.motherName)}</span></div>

    <div class="grid-2">
      <div class="row"><span class="label">Date of Birth :</span><span class="value">${line(formatDob(d.dateOfBirth))}</span></div>
      <div class="row"><span class="label">Gender :</span><span class="value">${line(d.gender)}</span></div>
      <div class="row"><span class="label">Category :</span><span class="value">${line(d.category)}</span></div>
      <div class="row"><span class="label">Samagra Id :</span><span class="value">${line(d.samagraId)}</span></div>
      <div class="row"><span class="label">Caste certificate No :</span><span class="value">${line(d.casteCertificateNo)}</span></div>
      <div class="row"><span class="label">Marital Status :</span><span class="value">${line(d.maritalStatus)}</span></div>
      ${
        d.gender === 'Female' && d.maritalStatus === 'Married'
          ? `<div class="row"><span class="label">Husband Name :</span><span class="value">${line(d.husbandName)}</span></div>`
          : ''
      }
    </div>

    <p class="section-title">Educational Qualification</p>
    <table class="edu">
      <thead>
        <tr>
          <th>Class</th><th>Board</th><th>Year</th><th>Roll No</th><th>Per.</th><th>Division</th><th>Document</th>
        </tr>
      </thead>
      <tbody>${eduRows}</tbody>
    </table>

    <div class="row"><span class="label">Permanent Address :</span><span class="value">${line(permanentAddress)}</span></div>
    <div class="grid-2">
      <div class="row"><span class="label">Vill. :</span><span class="value">${line(d.village)}</span></div>
      <div class="row"><span class="label">Post :</span><span class="value">${line(d.post)}</span></div>
      <div class="row"><span class="label">Teh. :</span><span class="value">${line(d.tehsil)}</span></div>
      <div class="row"><span class="label">Pin Code :</span><span class="value">${line(d.pinCode)}</span></div>
    </div>
    <div class="grid-2">
      <div class="row"><span class="label">Contact No. :</span><span class="value">${line(contactNo)}</span></div>
      <div class="row"><span class="label">Home :</span><span class="value">${line(d.homeAddress || permanentAddress)}</span></div>
    </div>
    <div class="row"><span class="label">E-Mail :</span><span class="value" style="text-transform:none">${line(email)}</span></div>
    <div class="row"><span class="label">Registration No :</span><span class="value">${line(d.officeRegistrationNo || registrationNo)}</span></div>
    <div class="row"><span class="label">Total Fee :</span><span class="value">${line(d.totalFee || row.fee)}</span></div>

    <div class="sigs">
      <div>
        <div class="space"></div>
        <p><strong>Signature Of Office In charge</strong></p>
        <p>Date : ${line(d.officeDate || admissionDate)}</p>
      </div>
      <div>
        <div class="space"></div>
        <p><strong>Signature Of Applicant</strong></p>
        <p>Date : ${line(d.applicantDate || admissionDate)}</p>
      </div>
    </div>
  </article>

  <article class="sheet">
    <h2 class="affidavit-title">शपथ पत्र</h2>
    <ol class="rules">${rules}</ol>
    <p class="declare">
      उपरोक्त निर्देशों का पूर्णतः पालन करते हुए मैं
      <span class="underline">${line(nameEnglish)}</span>
      पिता / पालक
      <span class="underline">${line(fatherName)}</span>
      <span class="underline" style="text-transform:none">${line(institutionName)}</span>
      में
      <span class="underline" style="text-transform:none;min-width:180px">${line(course)}</span>
      ट्रेड में दिनांक
      <span class="underline">${line(admissionDate)}</span>
      को प्रवेश ले रहा / रही हूँ।
    </p>
    <div class="footer-cols">
      <div>
        <h3>पालक के हस्ताक्षर</h3>
        <div class="row"><span class="label">नाम :</span><span class="value">${line(guardianName)}</span></div>
        <div class="row"><span class="label">पता :</span><span class="value">${line(guardianAddress)}</span></div>
        <div class="row"><span class="label">संबंध :</span><span class="value" style="text-transform:none">${line(d.relation)}</span></div>
        <div class="row"><span class="label">मोबा :</span><span class="value">${line(d.guardianMobile)}</span></div>
      </div>
      <div>
        <h3>छात्र के हस्ताक्षर</h3>
        <div class="row"><span class="label">नाम :</span><span class="value">${line(nameEnglish)}</span></div>
        <div class="row"><span class="label">पता :</span><span class="value">${line(permanentAddress)}</span></div>
        <div class="row"><span class="label">मोबा :</span><span class="value">${line(studentMobile)}</span></div>
      </div>
    </div>
  </article>
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () {
        try {
          window.focus();
          window.print();
        } catch (e) {}
      }, 350);
    });
  </script>
</body>
</html>`
}

export function printAdmissionForm(row) {
  if (!row || typeof document === 'undefined') {
    throw new Error('Nothing to print')
  }

  const html = buildPrintHtml(row)

  // Prefer Blob URL window (most reliable for full form + photo)
  try {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      const revoke = () => {
        try {
          URL.revokeObjectURL(url)
        } catch {
          /* ignore */
        }
      }
      const runPrint = () => {
        try {
          printWindow.focus()
          printWindow.print()
        } catch {
          /* ignore */
        }
      }
      // load may already be done for blob docs
      if (printWindow.document?.readyState === 'complete') {
        window.setTimeout(runPrint, 300)
      } else {
        printWindow.addEventListener('load', () => window.setTimeout(runPrint, 300))
        window.setTimeout(runPrint, 800)
      }
      printWindow.addEventListener('afterprint', () => {
        revoke()
        try {
          printWindow.close()
        } catch {
          /* ignore */
        }
      })
      window.setTimeout(revoke, 120_000)
      return
    }
    URL.revokeObjectURL(url)
  } catch {
    /* fall through to iframe */
  }

  // Fallback: off-screen iframe (must have real size — 0x0 prints blank)
  const iframe = document.createElement('iframe')
  iframe.setAttribute('title', 'Print admission form')
  iframe.setAttribute(
    'style',
    'position:fixed;left:-10000px;top:0;width:900px;height:1200px;border:0;opacity:0;',
  )
  document.body.appendChild(iframe)

  const frameWindow = iframe.contentWindow
  const frameDoc = frameWindow?.document
  if (!frameWindow || !frameDoc) {
    iframe.remove()
    throw new Error('Unable to open print preview — allow popups and try again')
  }

  frameDoc.open()
  frameDoc.write(html)
  frameDoc.close()

  const cleanup = () => {
    window.setTimeout(() => {
      try {
        iframe.remove()
      } catch {
        /* ignore */
      }
    }, 1000)
  }

  const triggerPrint = () => {
    try {
      frameWindow.focus()
      frameWindow.print()
    } finally {
      cleanup()
    }
  }

  window.setTimeout(triggerPrint, 400)
}


