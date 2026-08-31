import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  History,
  Lock,
  LockOpen,
  Printer,
  RefreshCw,
  Save,
  UserX,
  Users,
  Clock3,
  FileSpreadsheet,
  X,
} from 'lucide-react'
import { getUniversities } from '../../../services/universityService.js'
import { getCourses, getCourseById } from '../../../services/courseService.js'
import { getBatches } from '../../../services/batchService.js'
import {
  getAttendance,
  getAttendanceOverview,
  getAttendanceReport,
  getStudentAttendanceHistory,
  markBulkAttendance,
  searchAttendance,
  setAttendanceLock,
  updateAttendance,
} from '../../../services/attendanceService.js'
import { API_URL } from '../../../utils/api.js'
import {
  StatCard,
  Panel,
  PageToolbar,
  DataTable,
  Pagination,
  StatusBadge,
  Modal,
  Tabs,
  useClientTable,
  downloadCsv,
} from '../shared/MasterAdminUI.jsx'
import { DateInput, formatDisplayDate } from '../../shared/DateInput.jsx'
import { card, primaryBtn, secondaryBtn } from '../../../utils/masterAdminTheme.js'

const STATUS_OPTIONS = ['Present', 'Absent', 'Late', 'Leave']
const TABS = [
  { id: 'mark', label: 'Mark Attendance' },
  { id: 'report', label: 'Attendance Report' },
]

const STATUS_BTN = {
  Present: {
    on: 'bg-[#008C95] text-white border-[#008C95]',
    off: 'text-[#008C95] border-slate-200 hover:border-[#008C95]',
  },
  Absent: {
    on: 'bg-rose-600 text-white border-rose-600',
    off: 'text-rose-600 border-slate-200 hover:border-rose-400',
  },
  Late: {
    on: 'bg-amber-500 text-white border-amber-500',
    off: 'text-amber-700 border-slate-200 hover:border-amber-400',
  },
  Leave: {
    on: 'bg-sky-600 text-white border-sky-600',
    off: 'text-sky-700 border-slate-200 hover:border-sky-400',
  },
}

function todayInputValue() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function toInputDate(value) {
  if (!value) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10)
  }
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function batchDateWindow(batch) {
  const today = todayInputValue()
  if (!batch) {
    return { min: '', max: today, upcoming: false, label: '' }
  }
  const min = toInputDate(batch.startDate || batch.createdAt) || today
  const end = toInputDate(batch.endDate)
  const upcoming = Boolean(min && min > today)
  if (upcoming) {
    return {
      min,
      max: min,
      upcoming: true,
      label: `Batch starts on ${formatNumericDate(min)}. Attendance can be marked from that day.`,
    }
  }
  let max = today
  if (end && end < max) max = end
  if (max < min) max = min
  return {
    min,
    max,
    upcoming: false,
    label: `Allowed dates: ${formatNumericDate(min)} – ${formatNumericDate(max)}`,
  }
}

function formatNumericDate(value) {
  return formatDisplayDate(value, '—')
}

const dateFieldClass =
  'mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#00A896] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400'

function semesterOptionsFromCourse(course) {
  if (!course) return []
  const structure = String(course.structureType || 'Semester')
  const kind =
    structure === 'Year' ? 'Year' : structure === 'Single Level' ? 'Level' : 'Semester'
  const fromList = Array.isArray(course.semesters)
    ? course.semesters
        .map((s) => ({
          number: Number(s.number),
          title: s.title || `${kind} ${s.number}`,
        }))
        .filter((s) => Number.isFinite(s.number) && s.number > 0)
    : []

  if (fromList.length) return fromList.sort((a, b) => a.number - b.number)

  const count = Number(course.semesterCount) || 0
  if (count > 0) {
    return Array.from({ length: count }, (_, i) => ({
      number: i + 1,
      title: `${kind} ${i + 1}`,
    }))
  }

  return [{ number: 1, title: `${kind} 1` }]
}

function rowKey(row) {
  return String(row.studentMongoId || row.studentCode || row.studentId || row.admissionMongoId || row.id || '')
}

function photoSrc(photo) {
  const value = String(photo || '').trim()
  if (!value) return ''
  if (/^(data:|https?:|blob:)/i.test(value)) return value
  return `${API_URL}${value}`
}

function initials(name) {
  return String(name || 'ST')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function computeDraftStats(rows, draftStatus) {
  const counts = {
    total: rows.length,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    unmarked: 0,
    percent: 0,
  }
  for (const row of rows) {
    const saved = row.marked && row.status && row.status !== 'Unmarked'
    const status = draftStatus[rowKey(row)] || (saved ? row.status : 'Present')
    const key = String(status).toLowerCase()
    if (key === 'present') counts.present += 1
    else if (key === 'absent') counts.absent += 1
    else if (key === 'late') counts.late += 1
    else if (key === 'leave') counts.leave += 1
    else counts.unmarked += 1
  }
  counts.percent =
    counts.total > 0 ? Math.round((counts.present / counts.total) * 10000) / 100 : 0
  return counts
}

function StudentCell({ row }) {
  const src = photoSrc(row.photo)
  const name = row.student || row.name || '—'
  return (
    <div className="flex min-w-0 items-start gap-2 text-left">
      {src ? (
        <img
          src={src}
          alt=""
          className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
        />
      ) : (
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-bold text-[#008C95]">
          {initials(name)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="break-words font-semibold uppercase tracking-wide text-slate-800">{name}</p>
        <p className="break-all text-xs text-slate-500">{row.studentCode || row.studentId || '—'}</p>
        <p className="break-all text-xs text-slate-400">{row.admissionId || '—'}</p>
      </div>
    </div>
  )
}

function StatusControl({ value, onChange, disabled }) {
  return (
    <div className="grid w-full min-w-0 grid-cols-2 gap-1 lg:inline-flex lg:w-auto lg:overflow-hidden lg:rounded-lg lg:border lg:border-slate-200 lg:gap-0">
      {STATUS_OPTIONS.map((status) => {
        const selected = value === status
        const tone = STATUS_BTN[status]
        return (
          <button
            key={status}
            type="button"
            disabled={disabled}
            onClick={() => onChange(status)}
            className={`rounded-md px-2 py-1.5 text-[11px] font-semibold transition lg:rounded-none ${
              selected ? tone.on : `border border-slate-200 bg-white ${tone.off} lg:border-0`
            } disabled:opacity-50`}
          >
            {status}
          </button>
        )
      })}
    </div>
  )
}

function printRows(title, columns, rows) {
  const w = window.open('', '_blank', 'noopener,noreferrer')
  if (!w) return
  const head = columns.map((c) => `<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #cbd5e1">${c.label}</th>`).join('')
  const body = rows
    .map(
      (row) =>
        `<tr>${columns
          .map((c) => `<td style="padding:6px 8px;border-bottom:1px solid #e2e8f0">${row[c.key] ?? '—'}</td>`)
          .join('')}</tr>`,
    )
    .join('')
  w.document.write(`<!doctype html><html><head><title>${title}</title></head><body>
    <h2 style="font-family:sans-serif">${title}</h2>
    <table style="width:100%;border-collapse:collapse;font-family:sans-serif;font-size:12px">
      <thead><tr>${head}</tr></thead><tbody>${body}</tbody>
    </table>
  </body></html>`)
  w.document.close()
  w.focus()
  w.print()
}

export default function AttendancePage() {
  const location = useLocation()
  const incomingSearch = String(location.state?.studentSearch || '').trim()

  const [tab, setTab] = useState('mark')
  const [universities, setUniversities] = useState([])
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [semesters, setSemesters] = useState([])

  const [universityId, setUniversityId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [batchId, setBatchId] = useState('')
  const [semester, setSemester] = useState('')
  const [date, setDate] = useState(todayInputValue())

  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({})
  const [overviewStats, setOverviewStats] = useState({})
  const [meta, setMeta] = useState(null)

  const [uniLoading, setUniLoading] = useState(true)
  const [coursesLoading, setCoursesLoading] = useState(false)
  const [batchesLoading, setBatchesLoading] = useState(false)
  const [semLoading, setSemLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [draftStatus, setDraftStatus] = useState({})
  const [draftRemarks, setDraftRemarks] = useState({})
  const [snapshot, setSnapshot] = useState({})
  const [globalSearch, setGlobalSearch] = useState(incomingSearch)
  const [searchMode, setSearchMode] = useState(Boolean(incomingSearch))
  const [confirmOpen, setConfirmOpen] = useState(false)
  const pendingChange = useRef(null)

  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyData, setHistoryData] = useState(null)

  const [reportRows, setReportRows] = useState([])
  const [reportMeta, setReportMeta] = useState(null)
  const [reportStats, setReportStats] = useState({})
  const [reportFrom, setReportFrom] = useState(todayInputValue())
  const [reportTo, setReportTo] = useState(todayInputValue())
  const [reportLoading, setReportLoading] = useState(false)

  const applyDrafts = (list) => {
    const nextStatus = {}
    const nextRemarks = {}
    const nextSnap = {}
    for (const row of list || []) {
      const key = rowKey(row)
      const status =
        row.marked && row.status && row.status !== 'Unmarked' ? row.status : 'Present'
      const remarks = row.remarks || row.note || ''
      nextStatus[key] = status
      nextRemarks[key] = remarks
      nextSnap[key] = { status, remarks }
    }
    setDraftStatus(nextStatus)
    setDraftRemarks(nextRemarks)
    setSnapshot(nextSnap)
  }

  const hasUnsaved = useCallback(() => {
    return (rows || []).some((row) => {
      const key = rowKey(row)
      const snap = snapshot[key] || { status: 'Present', remarks: '' }
      return (
        (draftStatus[key] || 'Present') !== snap.status ||
        (draftRemarks[key] || '') !== snap.remarks
      )
    })
  }, [rows, snapshot, draftStatus, draftRemarks])

  const requestChange = (apply) => {
    if (hasUnsaved()) {
      pendingChange.current = apply
      setConfirmOpen(true)
      return
    }
    apply()
  }

  useEffect(() => {
    if (!incomingSearch) return undefined
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await searchAttendance({ search: incomingSearch, limit: 50 })
        if (cancelled) return
        setRows(data.rows)
        setStats(data.stats || {})
        setMeta(data.meta || null)
        setSearchMode(true)
        applyDrafts(data.rows)
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Search failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [incomingSearch])

  const filtersReady = Boolean(universityId && courseId && batchId && semester)

  const selectedBatch = useMemo(
    () => batches.find((b) => String(b._id) === String(batchId)) || null,
    [batches, batchId],
  )
  const dateWindow = useMemo(() => batchDateWindow(selectedBatch), [selectedBatch])

  useEffect(() => {
    if (!batchId || !dateWindow.min) return undefined
    if (dateWindow.upcoming) {
      if (date !== dateWindow.min) setDate(dateWindow.min)
      return undefined
    }
    if (date && date < dateWindow.min) setDate(dateWindow.min)
    else if (date && dateWindow.max && date > dateWindow.max) setDate(dateWindow.max)
    if (reportFrom && reportFrom < dateWindow.min) setReportFrom(dateWindow.min)
    else if (reportFrom && dateWindow.max && reportFrom > dateWindow.max) {
      setReportFrom(dateWindow.max)
    }
    if (reportTo && reportTo < dateWindow.min) setReportTo(dateWindow.min)
    else if (reportTo && dateWindow.max && reportTo > dateWindow.max) {
      setReportTo(dateWindow.max)
    }
    return undefined
  }, [batchId, dateWindow.min, dateWindow.max, dateWindow.upcoming])

  const loadOverview = useCallback(async () => {
    try {
      const data = await getAttendanceOverview({ date })
      setOverviewStats(data.stats || {})
    } catch {
      /* keep last overview on soft failure */
    }
  }, [date])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setUniLoading(true)
      try {
        const data = await getUniversities()
        if (cancelled) return
        setUniversities((data.rows || []).filter((u) => String(u.status || '') !== 'Inactive'))
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Unable to load universities')
      } finally {
        if (!cancelled) setUniLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setCourseId('')
    setBatchId('')
    setSemester('')
    setCourses([])
    setBatches([])
    setSemesters([])
    setRows([])
    setStats({})
    setMeta(null)
    setDraftStatus({})
    setDraftRemarks({})
    setSnapshot({})
    setSearchMode(false)

    if (!universityId) return undefined

    ;(async () => {
      setCoursesLoading(true)
      setError('')
      try {
        const data = await getCourses({ universityId, status: 'Active' })
        if (cancelled) return
        setCourses(data.rows || [])
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load courses')
          setCourses([])
        }
      } finally {
        if (!cancelled) setCoursesLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [universityId])

  useEffect(() => {
    let cancelled = false
    setBatchId('')
    setSemester('')
    setBatches([])
    setSemesters([])
    setRows([])
    setStats({})
    setMeta(null)
    setDraftStatus({})
    setDraftRemarks({})
    setSnapshot({})
    setSearchMode(false)

    if (!courseId) return undefined

    ;(async () => {
      setBatchesLoading(true)
      setSemLoading(true)
      setError('')
      try {
        const [batchData, entry] = await Promise.all([
          getBatches({ courseId }),
          getCourseById(courseId),
        ])
        if (cancelled) return
        setBatches(
          (batchData.rows || []).filter((b) => String(b.status || '') !== 'Archived'),
        )
        setSemesters(semesterOptionsFromCourse(entry))
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to load batches')
          setBatches([])
          setSemesters([])
        }
      } finally {
        if (!cancelled) {
          setBatchesLoading(false)
          setSemLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [courseId, universityId])

  const loadAttendance = useCallback(async () => {
    if (!universityId || !courseId || !batchId || !semester) {
      setRows([])
      setStats({})
      setMeta({
        requiresFilters: true,
        message: 'Select university, course, batch and semester to load attendance',
      })
      return
    }

    if (dateWindow.upcoming) {
      setRows([])
      setStats({})
      setMeta({
        requiresFilters: true,
        message: dateWindow.label,
        batchUpcoming: true,
      })
      return
    }

    setLoading(true)
    setError('')
    setSearchMode(false)
    try {
      const data = await getAttendance({
        universityId,
        courseId,
        batchId,
        semester,
        date,
        limit: 500,
      })
      setRows(data.rows)
      setStats(data.stats || {})
      setMeta(data.meta || null)
      applyDrafts(data.rows)
      await loadOverview()
    } catch (err) {
      setError(err?.message || 'Unable to load attendance')
      setRows([])
      setStats({})
    } finally {
      setLoading(false)
    }
  }, [universityId, courseId, batchId, semester, date, loadOverview, dateWindow.upcoming, dateWindow.label])

  useEffect(() => {
    if (!filtersReady) return undefined
    loadAttendance()
    return undefined
  }, [filtersReady, loadAttendance])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  const table = useClientTable(
    rows.map((row) => ({
      ...row,
      status: draftStatus[rowKey(row)] || row.status,
      remarks: draftRemarks[rowKey(row)] || row.remarks || '',
      mobile: row.mobile || row.phone || '',
    })),
    {
    searchKeys: [
      'student',
      'name',
      'studentId',
      'studentCode',
      'admissionId',
      'email',
      'phone',
      'mobile',
      'currentTerm',
      'status',
    ],
    pageSize: 10,
    filterKey: 'status',
  })

  const locked = Boolean(meta?.isLocked)
  const selectedStats = useMemo(
    () => computeDraftStats(rows, draftStatus),
    [rows, draftStatus],
  )

  const filterOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.status).filter((s) => s && s !== 'Unmarked'))
    if (rows.some((r) => !r.marked || r.status === 'Unmarked')) set.add('Unmarked')
    return [...STATUS_OPTIONS, ...[...set].filter((s) => !STATUS_OPTIONS.includes(s))]
  }, [rows])

  const scopePayload = {
    universityId,
    courseId,
    batchId,
    semester: Number(semester),
    date,
    method: 'Manual',
  }

  const applyRosterResponse = (data) => {
    setRows(data.rows)
    setStats(data.stats || {})
    setMeta(data.meta || null)
    applyDrafts(data.rows)
  }

  const markAllDraft = (status) => {
    if (!filtersReady || !rows.length || locked) return
    const next = {}
    for (const row of rows) next[rowKey(row)] = status
    setDraftStatus(next)
  }

  const saveDrafts = async () => {
    if (!filtersReady || !rows.length || locked) return
    setBusy(true)
    setError('')
    try {
      const data = await markBulkAttendance({
        ...scopePayload,
        records: rows.map((row) => {
          const key = rowKey(row)
          return {
            studentId: row.studentMongoId || row.studentId,
            studentCode: row.studentCode || row.studentId,
            status: draftStatus[key] || row.status || 'Present',
            remarks: draftRemarks[key] || '',
          }
        }),
      })
      applyRosterResponse(data)
      setToast(`Saved attendance for ${data.marked} student(s)`)
      await loadOverview()
    } catch (err) {
      setError(err?.message || 'Failed to save attendance')
    } finally {
      setBusy(false)
    }
  }

  const saveOne = async (row) => {
    if (locked) return
    const key = rowKey(row)
    const status = draftStatus[key] || row.status || 'Present'
    const remarks = draftRemarks[key] || ''
    setBusy(true)
    setError('')
    try {
      let savedRow = null
      if (row.attendanceId || (row.marked && (row.id || row._id))) {
        savedRow = await updateAttendance(row.attendanceId || row.id || row._id, {
          status,
          remarks,
          method: 'Manual',
        })
      } else {
        const data = await markBulkAttendance({
          ...scopePayload,
          records: [
            {
              studentId: row.studentMongoId || row.studentId,
              studentCode: row.studentCode || row.studentId,
              status,
              remarks,
            },
          ],
        })
        savedRow =
          (data.rows || []).find((r) => rowKey(r) === key) || data.rows?.[0] || null
        if (data.stats) setStats(data.stats)
        if (data.meta) setMeta(data.meta)
      }
      if (savedRow) {
        setRows((prev) => prev.map((r) => (rowKey(r) === key ? { ...r, ...savedRow, marked: true } : r)))
        setSnapshot((prev) => ({ ...prev, [key]: { status, remarks } }))
        setDraftStatus((prev) => ({ ...prev, [key]: savedRow.status || status }))
        setDraftRemarks((prev) => ({ ...prev, [key]: savedRow.remarks || remarks }))
      } else {
        await loadAttendance()
      }
      setToast(`Saved ${row.student || row.studentId}`)
      await loadOverview()
    } catch (err) {
      setError(err?.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const runGlobalSearch = async () => {
    const q = globalSearch.trim()
    if (!q && !filtersReady) {
      setError('Select filters or type a student ID, name, admission no. or mobile')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await searchAttendance({
        universityId: universityId || undefined,
        courseId: courseId || undefined,
        batchId: batchId || undefined,
        semester: semester || undefined,
        date: date || undefined,
        search: q,
        limit: 50,
      })
      setRows(data.rows)
      setStats(data.stats || {})
      setMeta(data.meta || null)
      setSearchMode(Boolean(data.meta?.searchOnly) || Boolean(q && !filtersReady))
      applyDrafts(data.rows)
      table.setSearch('')
      table.setFilter('')
      table.setPage(1)
    } catch (err) {
      setError(err?.message || 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const openHistory = async (row) => {
    const id = row.studentMongoId || row.studentId || row.studentCode
    if (!id) return
    setHistoryOpen(true)
    setHistoryLoading(true)
    setHistoryData(null)
    try {
      const data = await getStudentAttendanceHistory(id, {
        courseId: courseId || undefined,
        batchId: batchId || undefined,
        semester: semester || undefined,
      })
      setHistoryData(data)
    } catch (err) {
      setError(err?.message || 'Unable to load history')
      setHistoryOpen(false)
    } finally {
      setHistoryLoading(false)
    }
  }

  const toggleLock = async (nextLocked) => {
    if (!filtersReady) return
    setBusy(true)
    setError('')
    try {
      const data = await setAttendanceLock(scopePayload, nextLocked)
      applyRosterResponse(data)
      setToast(nextLocked ? 'Attendance locked' : 'Attendance unlocked')
    } catch (err) {
      setError(err?.message || 'Failed to update lock')
    } finally {
      setBusy(false)
    }
  }

  const loadReport = async () => {
    if (!filtersReady) {
      setError('Select university, course, batch and semester for the report')
      return
    }
    setReportLoading(true)
    setError('')
    try {
      const data = await getAttendanceReport({
        universityId,
        courseId,
        batchId,
        semester,
        from: reportFrom,
        to: reportTo,
      })
      setReportRows(data.rows)
      setReportStats(data.stats || {})
      setReportMeta(data.meta || null)
    } catch (err) {
      setError(err?.message || 'Unable to load report')
      setReportRows([])
    } finally {
      setReportLoading(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: '_no',
        label: '#',
        render: (row) => {
          const idx = table.filtered.findIndex((r) => rowKey(r) === rowKey(row))
          return idx >= 0 ? idx + 1 : '—'
        },
      },
      {
        key: 'studentCode',
        label: 'Student ID',
        render: (row) => (
          <span className="font-medium text-slate-800">{row.studentCode || row.studentId || '—'}</span>
        ),
      },
      {
        key: 'student',
        label: 'Student',
        render: (row) => <StudentCell row={row} />,
      },
      {
        key: 'mobile',
        label: 'Mobile',
        render: (row) => row.mobile || row.phone || '—',
      },
      {
        key: 'currentTerm',
        label: 'Current Term',
        render: (row) => row.currentTerm || row.semesterTitle || (row.semester ? `Sem ${row.semester}` : '—'),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => {
          const key = rowKey(row)
          const value = draftStatus[key] || row.status || 'Present'
          return (
            <StatusControl
              value={value === 'Unmarked' ? 'Present' : value}
              disabled={busy || locked || searchMode}
              onChange={(status) => setDraftStatus((prev) => ({ ...prev, [key]: status }))}
            />
          )
        },
      },
      {
        key: 'remarks',
        label: 'Remarks',
        render: (row) => {
          const key = rowKey(row)
          const status = draftStatus[key] || row.status || 'Present'
          return (
            <input
              value={draftRemarks[key] || ''}
              disabled={busy || locked || searchMode}
              onChange={(e) => setDraftRemarks((prev) => ({ ...prev, [key]: e.target.value }))}
              placeholder={status === 'Present' ? 'Optional' : 'e.g. Medical leave'}
              className="h-9 w-full min-w-0 rounded-lg border border-slate-200 px-2 text-xs text-slate-700 outline-none focus:border-[#00A896] disabled:bg-slate-50 lg:w-36"
            />
          )
        },
      },
      {
        key: 'marked',
        label: 'Saved',
        render: (row) => (
          <div>
            <StatusBadge status={row.marked ? row.status || 'Present' : 'Unmarked'} />
            {row.marked && row.updatedAt ? (
              <p className="mt-1 text-[10px] text-slate-400">{formatNumericDate(row.updatedAt)}</p>
            ) : null}
          </div>
        ),
      },
      {
        key: '_actions',
        label: 'Action',
        render: (row) => (
          <div className="flex min-w-0 flex-wrap gap-1.5">
            <button
              type="button"
              disabled={busy || locked || searchMode}
              onClick={() => saveOne(row)}
              className={`${secondaryBtn} flex-1 !px-3 !py-1.5 text-xs disabled:opacity-50 lg:flex-none`}
            >
              Save
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => openHistory(row)}
              className={`${secondaryBtn} flex-1 !px-3 !py-1.5 text-xs disabled:opacity-50 lg:flex-none`}
            >
              <History size={13} /> History
            </button>
          </div>
        ),
      },
    ],
    [busy, draftStatus, draftRemarks, locked, searchMode, table.filtered],
  )

  const reportColumns = useMemo(
    () => [
      { key: 'student', label: 'Student' },
      { key: 'studentId', label: 'Student ID' },
      { key: 'totalDays', label: 'Total Days' },
      { key: 'present', label: 'Present' },
      { key: 'absent', label: 'Absent' },
      { key: 'late', label: 'Late' },
      { key: 'leave', label: 'Leave' },
      {
        key: 'percent',
        label: 'Attendance %',
        render: (row) => `${row.percent ?? 0}%`,
      },
    ],
    [],
  )

  const emptyDescription = !filtersReady
    ? 'Select University → Course → Batch → Semester → Date. Only that batch roster is loaded.'
    : loading
      ? 'Loading attendance…'
      : 'No active students are assigned to this batch.'

  const selectedUniversity = universities.find((u) => String(u._id || u.id) === universityId)
  const selectedCourse = courses.find((c) => String(c._id || c.id) === courseId)
  const selectedSemester = semesters.find((s) => String(s.number) === String(semester))

  return (
    <section className="min-w-0 space-y-3 overflow-x-hidden">
      {toast ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {toast}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Today's Total Students"
          value={overviewStats.total ?? 0}
          icon={Users}
          hint="Institute-wide active students"
        />
        <StatCard
          label="Today's Present"
          value={overviewStats.present ?? 0}
          icon={CheckCircle2}
          hint={`All batches · ${formatNumericDate(date)}`}
        />
        <StatCard label="Today's Absent" value={overviewStats.absent ?? 0} icon={UserX} />
        <StatCard
          label="Today's Late / Leave"
          value={(overviewStats.late || 0) + (overviewStats.leave || 0)}
          icon={Clock3}
        />
        <StatCard
          label="Today's Attendance %"
          value={`${overviewStats.percent ?? 0}%`}
          icon={CalendarDays}
          hint={`${overviewStats.marked ?? 0} marked of ${overviewStats.total ?? 0}`}
        />
      </div>

      <div className={`${card} p-3`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">Academic filters</p>
            <p className="text-xs text-slate-500">
              University → Course → Batch → Semester / Year → Date
            </p>
          </div>
          {tab === 'mark' ? (
            <button
              type="button"
              onClick={() => requestChange(() => loadAttendance())}
              disabled={!filtersReady || loading || busy}
              className={`${secondaryBtn} !px-3 !py-1.5 text-xs disabled:opacity-50`}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-6">
          <label className="block text-xs font-medium text-slate-600">
            University
            <select
              value={universityId}
              disabled={uniLoading}
              onChange={(e) => {
                const value = e.target.value
                requestChange(() => setUniversityId(value))
              }}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#00A896]"
            >
              <option value="">{uniLoading ? 'Loading…' : 'Select university'}</option>
              {universities.map((u) => (
                <option key={u._id || u.id} value={u._id || u.id}>
                  {u.shortName ? `${u.shortName} — ${u.name}` : u.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-slate-600">
            Course
            <select
              value={courseId}
              disabled={!universityId || coursesLoading}
              onChange={(e) => {
                const value = e.target.value
                requestChange(() => setCourseId(value))
              }}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#00A896] disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {!universityId
                  ? 'Select university first'
                  : coursesLoading
                    ? 'Loading courses…'
                    : courses.length
                      ? 'Select course'
                      : 'No courses found'}
              </option>
              {courses.map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.code ? `${c.code} — ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-slate-600">
            Batch
            <select
              value={batchId}
              disabled={!courseId || batchesLoading}
              onChange={(e) => {
                const value = e.target.value
                requestChange(() => setBatchId(value))
              }}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#00A896] disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {!courseId
                  ? 'Select course first'
                  : batchesLoading
                    ? 'Loading batches…'
                    : batches.length
                      ? 'Select batch'
                      : 'No batches found'}
              </option>
              {batches.map((b) => (
                <option key={b._id || b.id} value={b._id}>
                  {b.name || b.batchId}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-slate-600">
            Semester / Year
            <select
              value={semester}
              disabled={!batchId || semLoading}
              onChange={(e) => {
                const value = e.target.value
                requestChange(() => setSemester(value))
              }}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#00A896] disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {!batchId ? 'Select batch first' : semLoading ? 'Loading…' : 'Select semester'}
              </option>
              {semesters.map((s) => (
                <option key={s.number} value={String(s.number)}>
                  {s.title || `Semester ${s.number}`}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-slate-600">
            Date
            <DateInput
              value={date}
              min={dateWindow.min || undefined}
              max={dateWindow.max || undefined}
              disabled={!batchId || dateWindow.upcoming}
              onChange={(e) => requestChange(() => setDate(e.target.value))}
              className={dateFieldClass}
            />
            {batchId && dateWindow.label ? (
              <span className="mt-1 block text-[11px] font-normal text-slate-400">
                {dateWindow.label}
              </span>
            ) : null}
          </label>

          <div className="flex items-end">
            <button
              type="button"
              disabled={
                !universityId && !courseId && !batchId && !semester && date === todayInputValue() && !globalSearch
              }
              onClick={() =>
                requestChange(() => {
                  setUniversityId('')
                  setCourseId('')
                  setBatchId('')
                  setSemester('')
                  setDate(todayInputValue())
                  setGlobalSearch('')
                  setSearchMode(false)
                  setRows([])
                  setStats({})
                  setMeta(null)
                  setDraftStatus({})
                  setDraftRemarks({})
                  setSnapshot({})
                })
              }
              className={`${secondaryBtn} h-10 w-full !px-3 text-xs disabled:opacity-50`}
            >
              <X size={14} /> Clear
            </button>
          </div>
        </div>

        {tab === 'mark' ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
              <ClipboardCheck size={15} className="shrink-0 text-[#FF5E14]" />
              <input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    runGlobalSearch()
                  }
                }}
                placeholder="Global student attendance search — ID, name, admission no., mobile, email"
                className="w-full min-w-0 bg-transparent text-slate-800 outline-none placeholder:text-slate-400"
              />
            </label>
            <button
              type="button"
              onClick={runGlobalSearch}
              disabled={loading || busy}
              className={`${primaryBtn} !px-4 !py-2 text-sm disabled:opacity-60`}
            >
              Search
            </button>
            {searchMode ? (
              <button
                type="button"
                onClick={() => {
                  setGlobalSearch('')
                  setSearchMode(false)
                  if (filtersReady) loadAttendance()
                  else {
                    setRows([])
                    setStats({})
                  }
                }}
                className={`${secondaryBtn} !px-3 !py-2 text-sm`}
              >
                Clear search
              </button>
            ) : null}
          </div>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <label className="block text-xs font-medium text-slate-600">
              From date
              <DateInput
                value={reportFrom}
                min={dateWindow.min || undefined}
                max={dateWindow.max || undefined}
                disabled={!batchId || dateWindow.upcoming}
                onChange={(e) => setReportFrom(e.target.value)}
                className={dateFieldClass}
              />
            </label>
            <label className="block text-xs font-medium text-slate-600">
              To date
              <DateInput
                value={reportTo}
                min={dateWindow.min || undefined}
                max={dateWindow.max || undefined}
                disabled={!batchId || dateWindow.upcoming}
                onChange={(e) => setReportTo(e.target.value)}
                className={dateFieldClass}
              />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={loadReport}
                disabled={!filtersReady || reportLoading || dateWindow.upcoming}
                className={`${primaryBtn} h-10 w-full !px-4 text-sm disabled:opacity-60`}
              >
                Generate report
              </button>
            </div>
          </div>
        )}
      </div>

      {tab === 'mark' && filtersReady && !searchMode ? (
        <>
          <div className={`${card} grid gap-2 p-3 text-sm sm:grid-cols-2 lg:grid-cols-5`}>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">University</p>
              <p className="font-semibold text-slate-800">
                {meta?.universityShortName || selectedUniversity?.shortName || meta?.universityName || '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Course</p>
              <p className="font-semibold text-slate-800">
                {meta?.courseCode || selectedCourse?.code || meta?.courseName || '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Batch</p>
              <p className="font-semibold text-slate-800">
                {meta?.batchName || selectedBatch?.name || '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Semester</p>
              <p className="font-semibold text-slate-800">
                {meta?.semesterTitle || selectedSemester?.title || '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400">Date</p>
              <p className="font-semibold text-slate-800">{meta?.dateLabel || formatNumericDate(date)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total Students" value={selectedStats.total} hint="Selected batch roster" />
            <StatCard label="Present" value={selectedStats.present} />
            <StatCard label="Absent" value={selectedStats.absent} />
            <StatCard label="Late" value={selectedStats.late} />
            <StatCard label="Leave" value={selectedStats.leave} />
            <StatCard
              label="Attendance %"
              value={`${selectedStats.percent ?? 0}%`}
              hint={`Present / Total · Unmarked ${selectedStats.unmarked}`}
            />
          </div>
        </>
      ) : null}

      {tab === 'mark' ? (
        <>
          <PageToolbar
            search={table.search}
            onSearch={table.setSearch}
            searchPlaceholder="Search this batch (ID, name, admission, mobile, email)"
            filters={filterOptions}
            filterValue={table.filter}
            onFilter={table.setFilter}
            onExportCsv={() =>
              downloadCsv(
                `attendance-${date || 'export'}.csv`,
                [
                  { key: 'studentCode', label: 'Student ID' },
                  { key: 'student', label: 'Student' },
                  { key: 'admissionId', label: 'Admission No.' },
                  { key: 'mobile', label: 'Mobile' },
                  { key: 'currentTerm', label: 'Current Term' },
                  { key: 'status', label: 'Status' },
                  { key: 'remarks', label: 'Remarks' },
                ],
                table.filtered.map((row) => ({
                  ...row,
                  status: draftStatus[rowKey(row)] || row.status,
                  remarks: draftRemarks[rowKey(row)] || row.remarks || '',
                  mobile: row.mobile || row.phone,
                })),
              )
            }
            extraActions={
              <>
                <button
                  type="button"
                  disabled={!filtersReady || !rows.length || busy || locked || searchMode}
                  onClick={() => markAllDraft('Present')}
                  className={`${secondaryBtn} min-w-[calc(50%-0.25rem)] flex-1 !px-3 !py-1.5 text-xs disabled:opacity-50 sm:min-w-0 sm:flex-none`}
                >
                  <CheckCircle2 size={14} /> All Present
                </button>
                <button
                  type="button"
                  disabled={!filtersReady || !rows.length || busy || locked || searchMode}
                  onClick={() => markAllDraft('Absent')}
                  className={`${secondaryBtn} min-w-[calc(50%-0.25rem)] flex-1 !px-3 !py-1.5 text-xs disabled:opacity-50 sm:min-w-0 sm:flex-none`}
                >
                  <UserX size={14} /> All Absent
                </button>
                <button
                  type="button"
                  disabled={!filtersReady || !rows.length || busy || locked || searchMode}
                  onClick={() => markAllDraft('Late')}
                  className={`${secondaryBtn} min-w-[calc(50%-0.25rem)] flex-1 !px-3 !py-1.5 text-xs disabled:opacity-50 sm:min-w-0 sm:flex-none`}
                >
                  All Late
                </button>
                <button
                  type="button"
                  disabled={!filtersReady || !rows.length || busy || locked || searchMode}
                  onClick={() => markAllDraft('Leave')}
                  className={`${secondaryBtn} min-w-[calc(50%-0.25rem)] flex-1 !px-3 !py-1.5 text-xs disabled:opacity-50 sm:min-w-0 sm:flex-none`}
                >
                  All Leave
                </button>
                <button
                  type="button"
                  disabled={!filtersReady || !rows.length || busy || locked || searchMode}
                  onClick={saveDrafts}
                  className={`${primaryBtn} min-w-[calc(50%-0.25rem)] flex-1 !px-3 !py-1.5 text-xs disabled:opacity-50 sm:min-w-0 sm:flex-none`}
                >
                  <Save size={14} /> Save All
                </button>
                {filtersReady && !searchMode ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => toggleLock(!locked)}
                    className={`${secondaryBtn} min-w-[calc(50%-0.25rem)] flex-1 !px-3 !py-1.5 text-xs disabled:opacity-50 sm:min-w-0 sm:flex-none`}
                  >
                    {locked ? <LockOpen size={14} /> : <Lock size={14} />}
                    {locked ? 'Unlock' : 'Lock Attendance'}
                  </button>
                ) : null}
              </>
            }
          />

          <Panel
            title={
              searchMode
                ? 'Global student attendance search'
                : meta?.batchName
                  ? `${meta.batchName} · ${meta.semesterTitle || ''} · ${meta.dateLabel || formatNumericDate(date)}`
                  : meta?.requiresFilters
                    ? 'Select filters to load roster'
                    : 'Attendance roster'
            }
            action={
              locked ? (
                <StatusBadge status="Locked" />
              ) : meta?.universityName ? (
                <span className="text-xs font-medium text-slate-500">{meta.universityName}</span>
              ) : null
            }
          >
            {loading ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
                Loading attendance…
              </div>
            ) : (
              <DataTable
                columns={columns}
                rows={table.pageRows}
                emptyTitle={!filtersReady && !searchMode ? 'Select filters first' : 'No students found'}
                emptyDescription={emptyDescription}
              />
            )}
            <Pagination
              page={table.page}
              pageSize={table.pageSize}
              total={table.total}
              onPageChange={table.setPage}
            />
          </Panel>
        </>
      ) : (
        <Panel
          title={
            reportMeta?.batchName
              ? `Report · ${reportMeta.batchName} · ${reportMeta.fromLabel || ''} – ${reportMeta.toLabel || ''}`
              : 'Attendance report'
          }
          action={
            <span className="text-xs text-slate-500">
              Average {reportStats.averagePercent ?? 0}%
            </span>
          }
        >
          <PageToolbar
            search=""
            onSearch={() => {}}
            searchPlaceholder=""
            extraActions={
              <>
                <button
                  type="button"
                  disabled={!reportRows.length}
                  onClick={() =>
                    downloadCsv(
                      `attendance-report-${reportFrom}-to-${reportTo}.csv`,
                      [
                        { key: 'student', label: 'Student' },
                        { key: 'studentId', label: 'Student ID' },
                        { key: 'totalDays', label: 'Total Days' },
                        { key: 'present', label: 'Present' },
                        { key: 'absent', label: 'Absent' },
                        { key: 'late', label: 'Late' },
                        { key: 'leave', label: 'Leave' },
                        { key: 'percent', label: 'Attendance %' },
                      ],
                      reportRows,
                    )
                  }
                  className={`${secondaryBtn} !px-3 !py-1.5 text-xs disabled:opacity-50`}
                >
                  CSV
                </button>
                <button
                  type="button"
                  disabled={!reportRows.length}
                  onClick={() =>
                    downloadCsv(
                      `attendance-report-${reportFrom}-to-${reportTo}.xls`,
                      [
                        { key: 'student', label: 'Student' },
                        { key: 'studentId', label: 'Student ID' },
                        { key: 'totalDays', label: 'Total Days' },
                        { key: 'present', label: 'Present' },
                        { key: 'absent', label: 'Absent' },
                        { key: 'late', label: 'Late' },
                        { key: 'leave', label: 'Leave' },
                        { key: 'percent', label: 'Attendance %' },
                      ],
                      reportRows,
                    )
                  }
                  className={`${secondaryBtn} !px-3 !py-1.5 text-xs disabled:opacity-50`}
                >
                  <FileSpreadsheet size={14} /> Excel
                </button>
                <button
                  type="button"
                  disabled={!reportRows.length}
                  onClick={() =>
                    printRows(
                      `Attendance report ${reportMeta?.batchName || ''} ${reportMeta?.fromLabel || ''} - ${reportMeta?.toLabel || ''}`,
                      [
                        { key: 'student', label: 'Student' },
                        { key: 'studentId', label: 'Student ID' },
                        { key: 'totalDays', label: 'Total Days' },
                        { key: 'present', label: 'Present' },
                        { key: 'absent', label: 'Absent' },
                        { key: 'late', label: 'Late' },
                        { key: 'leave', label: 'Leave' },
                        { key: 'percent', label: 'Attendance %' },
                      ],
                      reportRows,
                    )
                  }
                  className={`${secondaryBtn} !px-3 !py-1.5 text-xs disabled:opacity-50`}
                >
                  <Printer size={14} /> Print
                </button>
              </>
            }
          />
          {reportLoading ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
              Generating report…
            </div>
          ) : (
            <DataTable
              columns={reportColumns}
              rows={reportRows}
              wrap
              emptyTitle="No report yet"
              emptyDescription="Select the academic filters, a date range, then generate the report."
            />
          )}
        </Panel>
      )}

      <Modal
        open={confirmOpen}
        title="Unsaved attendance changes"
        onClose={() => {
          pendingChange.current = null
          setConfirmOpen(false)
        }}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={secondaryBtn}
              onClick={() => {
                pendingChange.current = null
                setConfirmOpen(false)
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className={primaryBtn}
              onClick={() => {
                const apply = pendingChange.current
                pendingChange.current = null
                setConfirmOpen(false)
                setSnapshot({})
                apply?.()
              }}
            >
              Continue
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          You have unsaved attendance changes. Continue?
        </p>
      </Modal>

      <Modal
        open={historyOpen}
        title="Attendance history"
        onClose={() => setHistoryOpen(false)}
        wide
      >
        {historyLoading ? (
          <p className="text-sm text-slate-500">Loading history…</p>
        ) : historyData ? (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <p className="text-sm">
                <span className="text-slate-400">Student: </span>
                <span className="font-semibold text-slate-800">{historyData.student?.name}</span>
              </p>
              <p className="text-sm">
                <span className="text-slate-400">Student ID: </span>
                <span className="font-semibold text-slate-800">{historyData.student?.studentId}</span>
              </p>
              <p className="text-sm">
                <span className="text-slate-400">Course: </span>
                {historyData.student?.courseName || '—'}
              </p>
              <p className="text-sm">
                <span className="text-slate-400">Batch: </span>
                {historyData.student?.batchName || '—'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard label="Working Days" value={historyData.stats?.workingDays ?? historyData.stats?.total ?? 0} />
              <StatCard label="Present" value={historyData.stats?.present ?? 0} />
              <StatCard label="Absent" value={historyData.stats?.absent ?? 0} />
              <StatCard label="Late" value={historyData.stats?.late ?? 0} />
              <StatCard label="Leave" value={historyData.stats?.leave ?? 0} />
              <StatCard label="Attendance %" value={`${historyData.stats?.percent ?? 0}%`} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Semester</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Remarks</th>
                    <th className="py-2">Marked By</th>
                  </tr>
                </thead>
                <tbody>
                  {(historyData.rows || []).map((row) => (
                    <tr key={row.attendanceId || row.id} className="border-t border-slate-100">
                      <td className="py-2">{row.dateLabel || '—'}</td>
                      <td className="py-2">{row.semesterTitle || (row.semester ? `Sem ${row.semester}` : '—')}</td>
                      <td className="py-2">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="py-2 text-slate-600">{row.remarks || '—'}</td>
                      <td className="py-2 text-slate-600">{row.markedBy || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!historyData.rows?.length ? (
                <p className="py-6 text-center text-sm text-slate-500">No attendance records yet.</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  )
}
