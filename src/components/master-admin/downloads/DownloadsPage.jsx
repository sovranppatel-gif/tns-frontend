import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ClipboardList,
  Download,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  IndianRupee,
  Printer,
  RefreshCw,
  Trash2,
  UserX,
  Users,
  Wallet,
  Layers,
} from 'lucide-react'
import { getReport, getReportsMeta } from '../../../services/reportService.js'
import { DateInput, formatDisplayDate } from '../../shared/DateInput.jsx'
import { DataTable, Panel, StatCard } from '../shared/MasterAdminUI.jsx'
import { card, primaryBtn, secondaryBtn } from '../../../utils/masterAdminTheme.js'
import { printInstituteReport } from '../../../utils/printReport.js'
import {
  ADMISSION_COLS,
  ATTENDANCE_COLS,
  DEFAULTER_COLS,
  EXAM_COLS,
  FACULTY_COLS,
  FEE_ACCOUNT_COLS,
  FEE_RECEIPT_COLS,
  STAFF_COLS,
  STUDENT_COLS,
  SUMMARY_COLS,
  downloadDelimited,
  stampName,
  statsToRows,
  wait,
} from './downloadPacks.js'

const HISTORY_KEY = 'tns_master_download_history'
const inputClass =
  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#00A896]'

const GROUPS = ['Institute', 'People', 'Finance', 'Academics']

const PACKS = [
  {
    id: 'overview',
    group: 'Institute',
    title: 'Monthly institute pack',
    hint: 'Owner snapshot — KPIs for the selected dates',
    icon: Layers,
    reportType: 'overview',
    files: [{ slug: 'institute-summary', columns: SUMMARY_COLS, rows: (data) => data.rows || statsToRows(data.stats) }],
  },
  {
    id: 'students',
    group: 'People',
    title: 'Student register',
    hint: 'Strength list with course, batch and documents',
    icon: Users,
    reportType: 'students',
    files: [{ slug: 'students', columns: STUDENT_COLS, rows: (data) => data.rows || [] }],
  },
  {
    id: 'admissions',
    group: 'People',
    title: 'Admission register',
    hint: 'Applications in the selected period',
    icon: ClipboardList,
    reportType: 'admissions',
    files: [{ slug: 'admissions', columns: ADMISSION_COLS, rows: (data) => data.rows || [] }],
  },
  {
    id: 'people',
    group: 'People',
    title: 'Faculty & staff',
    hint: 'Two files: faculty load and staff directory',
    icon: Users,
    reportType: 'people',
    files: [
      { slug: 'faculty', columns: FACULTY_COLS, rows: (data) => data.facultyRows || [] },
      { slug: 'staff', columns: STAFF_COLS, rows: (data) => data.staffRows || [] },
    ],
  },
  {
    id: 'fees',
    group: 'Finance',
    title: 'Fee accounts + receipts',
    hint: 'Current balances and payments in the period',
    icon: Wallet,
    reportType: 'fees',
    files: [
      { slug: 'fee-accounts', columns: FEE_ACCOUNT_COLS, rows: (data) => data.rows || [] },
      { slug: 'fee-receipts', columns: FEE_RECEIPT_COLS, rows: (data) => data.payments || [] },
    ],
  },
  {
    id: 'defaulters',
    group: 'Finance',
    title: 'Fee defaulters',
    hint: 'Outstanding dues, highest first',
    icon: IndianRupee,
    reportType: 'defaulters',
    files: [{ slug: 'fee-defaulters', columns: DEFAULTER_COLS, rows: (data) => data.rows || [] }],
  },
  {
    id: 'attendance',
    group: 'Academics',
    title: 'Attendance register',
    hint: 'Present % for every marked student',
    icon: UserX,
    reportType: 'attendance',
    extraParams: { shortageOnly: '' },
    files: [{ slug: 'attendance', columns: ATTENDANCE_COLS, rows: (data) => data.rows || [] }],
  },
  {
    id: 'shortage',
    group: 'Academics',
    title: 'Attendance shortage',
    hint: 'Students below 75% in the selected dates',
    icon: UserX,
    reportType: 'attendance',
    extraParams: { shortageOnly: 'true', threshold: '75' },
    files: [{ slug: 'attendance-shortage', columns: ATTENDANCE_COLS, rows: (data) => data.rows || [] }],
  },
  {
    id: 'exams',
    group: 'Academics',
    title: 'Exam results',
    hint: 'Marks, pass / fail and exam date',
    icon: GraduationCap,
    reportType: 'exams',
    files: [{ slug: 'exam-results', columns: EXAM_COLS, rows: (data) => data.rows || [] }],
  },
]

function monthStartKey() {
  const d = new Date()
  if (d.getDate() <= 7) d.setMonth(d.getMonth() - 1)
  d.setDate(1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function emptyFilters() {
  return {
    from: monthStartKey(),
    to: todayKey(),
    universityId: '',
    courseId: '',
    batchId: '',
    session: '',
  }
}

function readHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function writeHistory(rows) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(rows.slice(0, 40)))
}

function Field({ label, children }) {
  return (
    <label className="min-w-0 space-y-1">
      <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{label}</span>
      {children}
    </label>
  )
}

function printPack(pack, data, periodLabel, filterLabel) {
  const tables = pack.files
    .map((file) => ({
      title: file.slug.replace(/-/g, ' '),
      columns: file.columns,
      rows: file.rows(data),
    }))
    .filter((t) => t.rows.length)
  const stats = statsToRows(data.stats).slice(0, 8).map((row) => ({ label: row.label, value: row.value }))
  printInstituteReport({
    title: pack.title,
    description: pack.hint,
    periodLabel,
    filterLabel,
    stats,
    tables: tables.length ? tables : [{ title: pack.title, columns: SUMMARY_COLS, rows: statsToRows(data.stats) }],
  })
}

export default function DownloadsPage({ onNavigate }) {
  const [filters, setFilters] = useState(emptyFilters)
  const [meta, setMeta] = useState({ universities: [], courses: [], batches: [], sessions: [] })
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [history, setHistory] = useState(readHistory)

  const courses = useMemo(() => {
    const list = meta.courses || []
    if (!filters.universityId) return list
    return list.filter((c) => !c.universityId || c.universityId === filters.universityId)
  }, [meta.courses, filters.universityId])

  const batches = useMemo(() => {
    let list = meta.batches || []
    if (filters.universityId) list = list.filter((b) => !b.universityId || b.universityId === filters.universityId)
    if (filters.courseId) list = list.filter((b) => !b.courseId || b.courseId === filters.courseId)
    return list
  }, [meta.batches, filters.universityId, filters.courseId])

  useEffect(() => {
    getReportsMeta()
      .then(setMeta)
      .catch(() => {})
  }, [])

  const periodLabel = `Period ${formatDisplayDate(filters.from)} to ${formatDisplayDate(filters.to)}`
  const filterBits = [
    meta.universities.find((u) => u.id === filters.universityId)?.name,
    courses.find((c) => c.id === filters.courseId)?.name,
    batches.find((b) => b.id === filters.batchId)?.name,
    filters.session,
  ].filter(Boolean)
  const filterLabel = filterBits.length ? filterBits.join(' · ') : 'All courses / batches'

  const reportParams = useCallback(
    (extra = {}) => ({
      from: filters.from,
      to: filters.to,
      universityId: filters.universityId,
      courseId: filters.courseId,
      batchId: filters.batchId,
      session: filters.session,
      ...extra,
    }),
    [filters],
  )

  const patch = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'universityId') {
        next.courseId = ''
        next.batchId = ''
      }
      if (key === 'courseId') next.batchId = ''
      return next
    })
  }

  const pushHistory = (entry) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 40)
      writeHistory(next)
      return next
    })
  }

  const runPack = async (pack, format) => {
    setBusyId(pack.id)
    setError('')
    setNotice('')
    try {
      const data = await getReport(pack.reportType, reportParams(pack.extraParams || {}))
      const ext = format === 'excel' ? 'xls' : 'csv'
      let rows = 0
      if (format === 'pdf') {
        printPack(pack, data, periodLabel, filterLabel)
        rows = pack.files.reduce((sum, file) => sum + file.rows(data).length, 0)
      } else {
        for (const [index, file] of pack.files.entries()) {
          const list = file.rows(data)
          rows += list.length
          downloadDelimited(stampName(file.slug, filters.from, filters.to, ext), file.columns, list)
          if (index < pack.files.length - 1) await wait(350)
        }
      }
      pushHistory({
        id: `${pack.id}-${Date.now()}`,
        packId: pack.id,
        title: pack.title,
        format: format === 'pdf' ? 'PDF / Print' : format === 'excel' ? 'Excel' : 'CSV',
        rows,
        files: pack.files.length,
        at: new Date().toISOString(),
        period: `${formatDisplayDate(filters.from)} – ${formatDisplayDate(filters.to)}`,
        filter: filterLabel,
      })
      setNotice(
        format === 'pdf'
          ? `${pack.title} opened in the print dialog. Choose Save as PDF if you need a file.`
          : `${pack.title} downloaded (${rows} row${rows === 1 ? '' : 's'}).`,
      )
    } catch (err) {
      setError(err.message || `Unable to generate ${pack.title}`)
    } finally {
      setBusyId('')
    }
  }

  const runBundle = async () => {
    setBusyId('bundle')
    setError('')
    setNotice('')
    try {
      let totalFiles = 0
      for (const pack of PACKS) {
        const data = await getReport(pack.reportType, reportParams(pack.extraParams || {}))
        for (const [index, file] of pack.files.entries()) {
          downloadDelimited(
            stampName(file.slug, filters.from, filters.to, 'csv'),
            file.columns,
            file.rows(data),
          )
          totalFiles += 1
          if (index < pack.files.length - 1) await wait(350)
        }
        await wait(400)
      }
      pushHistory({
        id: `bundle-${Date.now()}`,
        packId: 'bundle',
        title: 'Full CSV bundle',
        format: 'CSV',
        rows: totalFiles,
        files: totalFiles,
        at: new Date().toISOString(),
        period: `${formatDisplayDate(filters.from)} – ${formatDisplayDate(filters.to)}`,
        filter: filterLabel,
      })
      setNotice(`Bundle started — ${totalFiles} CSV files. Allow multiple downloads in the browser if asked.`)
    } catch (err) {
      setError(err.message || 'Unable to generate the full bundle')
    } finally {
      setBusyId('')
    }
  }

  const todayCount = history.filter((row) => {
    const d = row.at ? new Date(row.at) : null
    if (!d || Number.isNaN(d.getTime())) return false
    return d.toDateString() === new Date().toDateString()
  }).length

  const grouped = GROUPS.map((group) => ({
    group,
    packs: PACKS.filter((p) => p.group === group),
  })).filter((g) => g.packs.length)

  return (
    <section className="space-y-3">
      <div className={`${card} space-y-3 p-3`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-navy-900">Downloads</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Generate live CSV, Excel or print/PDF packs from the same data as Reports. This page keeps a local history of
              what you exported on this browser.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={secondaryBtn} onClick={() => onNavigate?.('Reports')}>
              Open reports
            </button>
            <button type="button" className={primaryBtn} onClick={runBundle} disabled={Boolean(busyId)}>
              <Download size={14} className={busyId === 'bundle' ? 'animate-pulse' : ''} />
              {busyId === 'bundle' ? 'Preparing bundle…' : 'Download all CSV'}
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Field label="From">
            <DateInput value={filters.from} onChange={(e) => patch('from', e.target.value)} className={inputClass} />
          </Field>
          <Field label="To">
            <DateInput value={filters.to} onChange={(e) => patch('to', e.target.value)} className={inputClass} />
          </Field>
          <Field label="University">
            <select className={inputClass} value={filters.universityId} onChange={(e) => patch('universityId', e.target.value)}>
              <option value="">All</option>
              {meta.universities.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Course">
            <select className={inputClass} value={filters.courseId} onChange={(e) => patch('courseId', e.target.value)}>
              <option value="">All</option>
              {courses.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Batch">
            <select className={inputClass} value={filters.batchId} onChange={(e) => patch('batchId', e.target.value)}>
              <option value="">All</option>
              {batches.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Session">
            <select className={inputClass} value={filters.session} onChange={(e) => patch('session', e.target.value)}>
              <option value="">All</option>
              {meta.sessions.map((row) => (
                <option key={row} value={row}>
                  {row}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <p className="text-[11px] text-slate-400">
          {periodLabel} · {filterLabel} · Date range applies to collections, attendance, admissions and exams
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Packs" value={String(PACKS.length)} hint="Live exports from ERP" />
        <StatCard label="Generated today" value={String(todayCount)} hint="On this browser" />
        <StatCard
          label="Last export"
          value={history[0]?.title || '—'}
          hint={history[0]?.at ? new Date(history[0].at).toLocaleString('en-IN') : 'Nothing exported yet'}
        />
      </div>

      {grouped.map((block) => (
        <div key={block.group} className="space-y-2">
          <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{block.group}</h3>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {block.packs.map((pack) => {
              const Icon = pack.icon
              const busy = busyId === pack.id
              return (
                <article key={pack.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-navy-900">{pack.title}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{pack.hint}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {pack.files.length} file{pack.files.length > 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-red/10 text-brand-red">
                      <Icon size={15} />
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className={secondaryBtn} disabled={Boolean(busyId)} onClick={() => runPack(pack, 'csv')}>
                      <FileText size={14} /> {busy ? '…' : 'CSV'}
                    </button>
                    <button type="button" className={secondaryBtn} disabled={Boolean(busyId)} onClick={() => runPack(pack, 'excel')}>
                      <FileSpreadsheet size={14} /> Excel
                    </button>
                    <button type="button" className={secondaryBtn} disabled={Boolean(busyId)} onClick={() => runPack(pack, 'pdf')}>
                      <Printer size={14} /> Print / PDF
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      ))}

      <Panel
        title="Recent downloads on this device"
        action={
          history.length ? (
            <button
              type="button"
              className={`${secondaryBtn} text-rose-700`}
              onClick={() => {
                writeHistory([])
                setHistory([])
              }}
            >
              <Trash2 size={14} /> Clear
            </button>
          ) : null
        }
      >
        <DataTable
          columns={[
            {
              key: 'at',
              label: 'When',
              render: (row) => (
                <span className="text-xs text-slate-600">
                  {row.at ? new Date(row.at).toLocaleString('en-IN') : '—'}
                </span>
              ),
            },
            { key: 'title', label: 'Pack' },
            { key: 'format', label: 'Format' },
            { key: 'rows', label: 'Rows / files' },
            { key: 'period', label: 'Period' },
            { key: 'filter', label: 'Filter' },
            {
              key: '_actions',
              label: 'Again',
              render: (row) => {
                const pack = PACKS.find((p) => p.id === row.packId)
                if (!pack) return '—'
                return (
                  <button
                    type="button"
                    className="text-xs font-semibold text-brand-red"
                    disabled={Boolean(busyId)}
                    onClick={() => runPack(pack, row.format === 'Excel' ? 'excel' : row.format.includes('PDF') ? 'pdf' : 'csv')}
                  >
                    <RefreshCw size={12} className="mr-1 inline" />
                    Generate
                  </button>
                )
              },
            },
          ]}
          rows={history}
          emptyTitle="No downloads yet"
          emptyDescription="Generate a pack above. History stays in this browser only."
        />
      </Panel>
    </section>
  )
}
