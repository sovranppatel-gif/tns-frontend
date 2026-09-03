import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Download, LayoutTemplate, LoaderCircle, Printer, Search, Settings2, Users, X } from 'lucide-react'
import logo from '../../../assets/tnslogo.png'
import { studentProfile } from '../../../data/studentData'
import { getStudents } from '../../../services/studentService.js'
import { API_URL } from '../../../utils/api.js'
import { Panel, PrimaryButton, SecondaryButton, StatCard, StatusBadge } from '../shared/MasterAdminUI.jsx'
import { DEFAULT_CARD_SETTINGS, ID_CARD_TEMPLATES } from './idCardTemplates.js'
import './idCard.css'

function photoSrc(photo) {
  if (!photo) return studentProfile.avatar
  return /^(data:|https?:|blob:)/i.test(photo) ? photo : `${API_URL}${photo.startsWith('/') ? photo : `/${photo}`}`
}

function value(student, key, fallback = '—') {
  return student?.[key] || fallback
}

function CardFace({ student, template, settings, back = false }) {
  const contact = student?.contact || {}
  if (back) {
    return <div className={`id-card-face ${template.className} id-card-back`}><img src={logo} alt="" /><h3>Important information</h3><p>- This card is institute property.</p><p>- Please carry it on campus.</p><p>- Report loss to the administration office.</p><div className="id-card-qr">{value(student, 'studentId', 'TNS')}</div><small>{settings.footer}</small></div>
  }
  return <div className={`id-card-face ${template.className}`}>
    <header><img src={logo} alt="" /><div><strong>TNS ITI &amp; Computer</strong><small>Narsinghpur</small></div><span>STUDENT</span></header>
    <div className="id-card-body"><img className="id-card-photo" src={photoSrc(student?.photo)} alt="" /><div className="id-card-details"><h3>{value(student, 'nameEnglish', studentProfile.name)}</h3><p className="id-card-code">{value(student, 'studentId', studentProfile.id)}</p><p><b>Course</b>{value(student, 'courseLabel', student?.courseName || studentProfile.course)}</p>{settings.showAdmission ? <p><b>Admission</b>{value(student, 'admissionId')}</p> : null}{settings.showContact ? <p><b>Mobile</b>{contact.mobile || student?.mobile || '—'}</p> : null}</div></div>
    <footer>{settings.showValidity ? <span>VALID {settings.validity}</span> : <span>{value(student, 'batchLabel', 'Current Batch')}</span>}<span>{value(student, 'status', 'Active')}</span></footer>
  </div>
}

function PrintableSheet({ student, template, settings }) {
  return <div className={`print-card-sheet is-${template.orientation}`}><CardFace student={student} template={template} settings={settings} /><CardFace student={student} template={template} settings={settings} back /></div>
}

function cardStyles() {
  return Array.from(document.styleSheets).flatMap((sheet) => {
    try {
      return Array.from(sheet.cssRules || []).map((rule) => rule.cssText)
    } catch {
      return []
    }
  }).filter((rule) => rule.includes('id-card-') || rule.includes('print-card-') || rule.includes('template-swatch')).join('')
}

function printCards(students, template, settings) {
  const popup = window.open('', '_blank', 'width=1000,height=800')
  if (!popup) throw new Error('Pop-up blocked. Allow pop-ups to print ID cards.')
  const root = cardStyles()
  popup.document.write(`<html><head><title>TNS ID Cards</title><style>${root}</style></head><body><div class="print-grid">${students.map((student) => `<div class="print-card-sheet is-${template.orientation}"><div class="id-card-face ${template.className}"><header><img src="${logo}" alt=""><div><strong>TNS ITI &amp; Computer</strong><small>Narsinghpur</small></div><span>STUDENT</span></header><div class="id-card-body"><img class="id-card-photo" src="${photoSrc(student.photo)}" alt=""><div class="id-card-details"><h3>${value(student, 'nameEnglish', studentProfile.name)}</h3><p class="id-card-code">${value(student, 'studentId', studentProfile.id)}</p><p><b>Course</b>${value(student, 'courseLabel', '—')}</p><p><b>Admission</b>${value(student, 'admissionId')}</p></div></div><footer><span>VALID ${settings.validity}</span><span>${value(student, 'status', 'Active')}</span></footer></div><div class="id-card-face ${template.className} id-card-back"><img src="${logo}" alt=""><h3>Important information</h3><p>- This card is institute property.</p><p>- Please carry it on campus.</p><p>- Report loss to the administration office.</p><div class="id-card-qr">${value(student, 'studentId', 'TNS')}</div><small>${settings.footer}</small></div></div>`).join('')}</div><script>window.onload=function(){window.print()}</script></body></html>`)
  popup.document.close()
}

export default function IdCardPage() {
  const location = useLocation()
  const [rows, setRows] = useState([])
  const [selectedId, setSelectedId] = useState(location.state?.student?._id || location.state?.student?.studentId || '')
  const [templateId, setTemplateId] = useState('classic')
  const [settings, setSettings] = useState(DEFAULT_CARD_SETTINGS)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { getStudents().then((data) => setRows(data.rows || [])).catch((err) => setError(err.message || 'Unable to load students')).finally(() => setLoading(false)) }, [])

  const routeStudent = location.state?.student
  const allRows = useMemo(() => routeStudent && !rows.some((row) => String(row._id || row.studentId) === String(routeStudent._id || routeStudent.studentId)) ? [routeStudent, ...rows] : rows, [routeStudent, rows])
  const filteredRows = useMemo(() => { const q = query.trim().toLowerCase(); return q ? allRows.filter((row) => [row.nameEnglish, row.studentId, row.admissionId, row.courseLabel, row.batchLabel].some((item) => String(item || '').toLowerCase().includes(q))) : allRows }, [allRows, query])
  const selected = allRows.find((row) => String(row._id || row.studentId) === String(selectedId)) || routeStudent || allRows[0] || studentProfile
  const template = ID_CARD_TEMPLATES.find((item) => item.id === templateId) || ID_CARD_TEMPLATES[0]
  const activeCount = allRows.filter((row) => String(row.status || '').toLowerCase() === 'active').length
  const setSetting = (key, next) => setSettings((current) => ({ ...current, [key]: next }))
  const download = () => { const markup = document.querySelector('.id-card-face')?.outerHTML || ''; const blob = new Blob([`<!doctype html><html><head><meta charset="utf-8"><title>${value(selected, 'studentId', 'student')}-id-card</title><style>${cardStyles()} body{padding:24px}</style></head><body>${markup}</body></html>`], { type: 'text/html' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${value(selected, 'studentId', 'student-id')}-id-card.html`; a.click(); URL.revokeObjectURL(a.href) }

  return <section className="space-y-3">
    <div className="grid gap-3 sm:grid-cols-3"><StatCard label="Students loaded" value={allRows.length} hint="Ready for card generation" /><StatCard label="Active students" value={activeCount} hint="Current institute records" /><StatCard label="Templates" value={ID_CARD_TEMPLATES.length} hint="Front and back layouts" /></div>
    <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(260px,0.8fr)_minmax(420px,1.2fr)]">
      <Panel title="Choose students" action={<Users size={17} className="text-[#FF5E14]" />}>
        <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, ID or course" className="w-full bg-transparent outline-none" /></label>
        {error ? <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">{error}</p> : null}
        <div className="mt-3 max-h-[480px] space-y-1.5 overflow-y-auto">{loading ? <p className="flex items-center gap-2 p-4 text-sm text-slate-500"><LoaderCircle size={15} className="animate-spin" />Loading students…</p> : filteredRows.map((row) => { const id = row._id || row.studentId; return <button key={id} type="button" onClick={() => setSelectedId(id)} className={`flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition ${String(id) === String(selectedId) ? 'border-[#008C95] bg-[#008C95]/5' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}><img src={photoSrc(row.photo)} alt="" className="h-10 w-10 rounded-lg object-cover" /><span className="min-w-0 flex-1"><b className="block truncate text-sm text-slate-800">{value(row, 'nameEnglish', 'Unnamed student')}</b><small className="block truncate text-xs text-slate-500">{value(row, 'studentId')} · {value(row, 'courseLabel')}</small></span><StatusBadge status={row.status || 'Active'} /></button> })}</div>
      </Panel>
      <div className="space-y-3"><Panel title="Card preview" action={<button type="button" title="Clear selected student" onClick={() => setSelectedId('')} className="icon-btn"><X size={15} /></button>}><div className="flex min-h-[430px] items-center justify-center overflow-auto rounded-lg bg-slate-100 p-4"><PrintableSheet student={selected} template={template} settings={settings} /></div><div className="mt-3 flex flex-wrap gap-2"><PrimaryButton onClick={() => printCards([selected], template, settings)}><Printer size={15} /> Print card</PrimaryButton><SecondaryButton onClick={download}><Download size={15} /> Download HTML</SecondaryButton><SecondaryButton onClick={() => printCards(filteredRows, template, settings)} disabled={!filteredRows.length}><Users size={15} /> Print {filteredRows.length} filtered</SecondaryButton></div></Panel>
        <Panel title="Card templates" action={<LayoutTemplate size={17} className="text-[#00A896]" />}><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">{ID_CARD_TEMPLATES.map((item) => <button type="button" key={item.id} onClick={() => setTemplateId(item.id)} className={`rounded-lg border p-2 text-left ${templateId === item.id ? 'border-[#FF5E14] ring-2 ring-[#FF5E14]/15' : 'border-slate-200'}`}><div className={`template-swatch ${item.className}`} /><b className="mt-2 block text-xs text-slate-800">{item.name}</b><span className="text-[11px] text-slate-500">{item.description}</span></button>)}</div></Panel>
      </div>
    </div>
    <Panel title="Card settings" action={<Settings2 size={17} className="text-[#FF5E14]" />}><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="field"><span>Validity</span><input value={settings.validity} onChange={(event) => setSetting('validity', event.target.value)} /></label><label className="field sm:col-span-2"><span>Footer note</span><input value={settings.footer} onChange={(event) => setSetting('footer', event.target.value)} /></label><label className="toggle"><input type="checkbox" checked={settings.showAdmission} onChange={(event) => setSetting('showAdmission', event.target.checked)} /> Admission number</label><label className="toggle"><input type="checkbox" checked={settings.showContact} onChange={(event) => setSetting('showContact', event.target.checked)} /> Mobile number</label><label className="toggle"><input type="checkbox" checked={settings.showValidity} onChange={(event) => setSetting('showValidity', event.target.checked)} /> Validity strip</label></div></Panel>
  </section>
}