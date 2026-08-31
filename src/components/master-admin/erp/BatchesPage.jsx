import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Layers,
  RefreshCw,
  Users,
  CalendarDays,
  TrendingUp,
  Trash2,
  Plus,
  UserPlus,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { DateInput } from '../../shared/DateInput.jsx'
import {
  getBatches,
  syncBatches,
  seedBatchRoster,
  createBatch,
  updateBatch,
  deleteBatch,
  getBatchStudents,
  assignBatchStudents,
  removeBatchStudents,
} from '../../../services/batchService.js'
import { getUniversities } from '../../../services/universityService.js'
import { getCourses, createCourse } from '../../../services/courseService.js'
import {
  StatCard,
  Panel,
  PageToolbar,
  DataTable,
  Pagination,
  Modal,
  useClientTable,
  downloadCsv,
} from '../shared/MasterAdminUI.jsx'
import { card, primaryBtn, secondaryBtn } from '../../../utils/masterAdminTheme.js'

const columns = [
  { key: 'batchId', label: 'ID', width: '9%' },
  { key: 'name', label: 'Batch', width: '12%' },
  { key: 'courseName', label: 'Course', width: '16%' },
  { key: 'universityName', label: 'University', width: '16%' },
  { key: 'students', label: 'Students', width: '8%' },
  { key: 'startLabel', label: 'Start', width: '8%' },
  { key: 'schedule', label: 'Schedule', width: '12%' },
  { key: 'progressLabel', label: 'Progress', width: '8%' },
  { key: 'status', label: 'Status', width: '9%' },
]

const SCHEDULE_PRESETS = [
  'Mon–Fri · 10:00–12:00',
  'Mon–Fri · 14:00–16:00',
  'Mon–Sat · Morning',
  'Mon–Sat · Evening',
  'Sat–Sun · Weekend',
]

const WIZARD_STEPS = [
  { id: 1, label: 'Course' },
  { id: 2, label: 'Batch' },
  { id: 3, label: 'Students' },
]

const inputClass =
  'mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#00A896]'

function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function emptyBatchForm() {
  return {
    name: '',
    schedule: SCHEDULE_PRESETS[0],
    capacity: 20,
    startDate: todayIso(),
    endDate: '',
    faculty: '',
  }
}

function emptyCourseForm() {
  return {
    name: '',
    code: '',
    type: 'Institute',
    universityId: '',
    durationMonths: 6,
    category: 'Training',
    status: 'Active',
    mode: 'Offline',
  }
}

export default function BatchesPage() {
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({})
  const [universities, setUniversities] = useState([])
  const [courses, setCourses] = useState([])
  const [universityId, setUniversityId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [busyId, setBusyId] = useState('')

  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [wizardMode, setWizardMode] = useState('create') // create | students
  const [creatingCourse, setCreatingCourse] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [courseForm, setCourseForm] = useState(emptyCourseForm)
  const [batchForm, setBatchForm] = useState(emptyBatchForm)
  const [createdBatch, setCreatedBatch] = useState(null)
  const [wizardBusy, setWizardBusy] = useState(false)
  const [wizardError, setWizardError] = useState('')

  const [roster, setRoster] = useState({
    assigned: [],
    available: [],
    capacity: 20,
    enrolledCount: 0,
    seatsLeft: 0,
  })
  const [rosterLoading, setRosterLoading] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedAvailable, setSelectedAvailable] = useState([])
  const [selectedAssigned, setSelectedAssigned] = useState([])

  const reloadCourses = useCallback(async () => {
    const courseData = await getCourses({ status: 'Active' }).catch(() => ({ rows: [] }))
    setCourses(courseData.rows || [])
    return courseData.rows || []
  }, [])

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getBatches({
        universityId: universityId || undefined,
        courseId: courseId || undefined,
      })
      setRows(data.rows)
      setStats(data.stats || {})
    } catch (err) {
      setError(err?.message || 'Unable to load batches')
      setRows([])
      setStats({})
    } finally {
      setLoading(false)
    }
  }, [universityId, courseId])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [uniData] = await Promise.all([
          getUniversities().catch(() => ({ rows: [] })),
          reloadCourses(),
        ])
        if (cancelled) return
        setUniversities((uniData.rows || []).filter((u) => u.status !== 'Inactive'))
      } catch {
        /* ignore filter load errors */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reloadCourses])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  const filteredCourses = useMemo(() => {
    if (!universityId) return courses
    return courses.filter((c) => String(c.universityId || '') === String(universityId))
  }, [courses, universityId])

  const wizardCourseOptions = useMemo(() => {
    return courses
  }, [courses])

  const selectedCourse = useMemo(
    () => wizardCourseOptions.find((c) => String(c._id) === String(selectedCourseId)) || null,
    [wizardCourseOptions, selectedCourseId],
  )

  const table = useClientTable(rows, {
    searchKeys: [
      'batchId',
      'name',
      'courseName',
      'courseCode',
      'universityName',
      'faculty',
      'schedule',
      'status',
    ],
    pageSize: 10,
    filterKey: 'status',
  })

  const filterOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.status).filter(Boolean))
    return [...set]
  }, [rows])

  const resetWizard = () => {
    setWizardStep(1)
    setWizardMode('create')
    setCreatingCourse(false)
    setSelectedCourseId('')
    setCourseForm(emptyCourseForm())
    setBatchForm(emptyBatchForm())
    setCreatedBatch(null)
    setWizardBusy(false)
    setWizardError('')
    setRoster({
      assigned: [],
      available: [],
      capacity: 20,
      enrolledCount: 0,
      seatsLeft: 0,
    })
    setRosterLoading(false)
    setStudentSearch('')
    setSelectedAvailable([])
    setSelectedAssigned([])
  }

  const openCreateWizard = () => {
    resetWizard()
    setWizardOpen(true)
  }

  const loadRoster = async (batchId) => {
    if (!batchId) return
    setRosterLoading(true)
    setWizardError('')
    try {
      const data = await getBatchStudents(batchId)
      setRoster({
        assigned: data.assigned,
        available: data.available,
        capacity: data.capacity,
        enrolledCount: data.enrolledCount,
        seatsLeft: data.seatsLeft,
      })
      setCreatedBatch(data.batch || createdBatch)
      setSelectedAvailable([])
      setSelectedAssigned([])
    } catch (err) {
      setWizardError(err?.message || 'Unable to load students')
    } finally {
      setRosterLoading(false)
    }
  }

  const openManageStudents = async (row) => {
    resetWizard()
    setWizardMode('students')
    setWizardStep(3)
    setCreatedBatch(row)
    setSelectedCourseId(row.courseId || '')
    setWizardOpen(true)
    await loadRoster(row._id || row.batchId)
  }

  const closeWizard = () => {
    setWizardOpen(false)
    resetWizard()
  }

  const handleSync = async () => {
    setSyncing(true)
    setError('')
    try {
      const data = await syncBatches()
      setRows(data.rows)
      setStats(data.stats || {})
      setToast(
        `Synced: ${data.batchesCreated} new batches, ${data.batchesUpdated} updated, ${data.attendanceUpserts} attendance marks (last 7 days)`,
      )
    } catch (err) {
      setError(err?.message || 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const handleSeedRoster = async () => {
    setSeeding(true)
    setError('')
    try {
      const data = await seedBatchRoster(22)
      setToast(
        `${data.message} · fees ${data.feesSynced} · attendance ${data.attendanceUpserts}`,
      )
      await reload()
    } catch (err) {
      setError(err?.message || 'Seed roster failed')
    } finally {
      setSeeding(false)
    }
  }

  const handleStatusChange = async (row, status) => {
    if (!row?._id || status === row.status) return
    setBusyId(row._id)
    try {
      const entry = await updateBatch(row._id, { status })
      setRows((prev) => prev.map((r) => (r._id === row._id ? { ...r, ...entry } : r)))
      setToast(`Batch ${entry.batchId} → ${entry.status}`)
      await reload()
    } catch (err) {
      setError(err?.message || 'Unable to update batch')
    } finally {
      setBusyId('')
    }
  }

  const handleDelete = async (row) => {
    if (!row?._id) return
    const ok = window.confirm(`Archive batch ${row.batchId || row.name}?`)
    if (!ok) return
    setBusyId(row._id)
    try {
      await deleteBatch(row._id)
      setToast(`Batch ${row.batchId} archived`)
      await reload()
    } catch (err) {
      setError(err?.message || 'Unable to archive batch')
    } finally {
      setBusyId('')
    }
  }

  const handleQuickCreateCourse = async () => {
    setWizardError('')
    if (!courseForm.name.trim()) {
      setWizardError('Course name is required')
      return null
    }
    if (!courseForm.code.trim()) {
      setWizardError('Course code is required')
      return null
    }
    if (
      (courseForm.type === 'University' || courseForm.type === 'ITI / SCVT') &&
      !courseForm.universityId
    ) {
      setWizardError(
        courseForm.type === 'ITI / SCVT'
          ? 'Select an ITI / SCVT authority for this course'
          : 'Select a university for university courses',
      )
      return null
    }
    setWizardBusy(true)
    try {
      const entry = await createCourse({
        name: courseForm.name.trim(),
        code: courseForm.code.trim().toUpperCase(),
        type: courseForm.type,
        universityId:
          courseForm.type === 'University' || courseForm.type === 'ITI / SCVT'
            ? courseForm.universityId
            : '',
        category: courseForm.category || 'Training',
        durationMonths: Number(courseForm.durationMonths) || 6,
        semesterCount: 1,
        semesters: [{ number: 1, title: 'Semester 1', durationMonths: Number(courseForm.durationMonths) || 6, subjects: [] }],
        status: 'Active',
        mode: courseForm.mode || 'Offline',
      })
      const list = await reloadCourses()
      const id = entry?._id || entry?.id
      setSelectedCourseId(id ? String(id) : '')
      setCreatingCourse(false)
      setToast(`Course “${entry.name}” created`)
      if (!list.some((c) => String(c._id) === String(id)) && entry) {
        setCourses((prev) => [entry, ...prev])
      }
      return entry
    } catch (err) {
      setWizardError(err?.message || 'Unable to create course')
      return null
    } finally {
      setWizardBusy(false)
    }
  }

  const goNextFromCourse = async () => {
    setWizardError('')
    if (creatingCourse) {
      const entry = await handleQuickCreateCourse()
      if (!entry) return
      const id = entry._id || entry.id
      if (!id) {
        setWizardError('Course was created but id is missing')
        return
      }
      setSelectedCourseId(String(id))
      setWizardStep(2)
      return
    }
    if (!selectedCourseId) {
      setWizardError('Select a course or create a new one')
      return
    }
    setWizardStep(2)
  }

  const handleCreateBatchStep = async () => {
    setWizardError('')
    if (!selectedCourseId) {
      setWizardError('Course is required')
      return
    }
    const capacity = Number(batchForm.capacity)
    if (!Number.isFinite(capacity) || capacity < 1) {
      setWizardError('Capacity must be at least 1')
      return
    }
    if (!batchForm.startDate) {
      setWizardError('Start date is required')
      return
    }
    if (!batchForm.schedule.trim()) {
      setWizardError('Batch timing / schedule is required')
      return
    }

    setWizardBusy(true)
    try {
      const entry = await createBatch({
        courseId: selectedCourseId,
        name: batchForm.name.trim() || undefined,
        schedule: batchForm.schedule.trim(),
        capacity,
        startDate: batchForm.startDate,
        endDate: batchForm.endDate || undefined,
        faculty: batchForm.faculty.trim(),
      })
      setCreatedBatch(entry)
      setToast(`Batch ${entry.batchId} created`)
      await reload()
      setWizardStep(3)
      await loadRoster(entry._id || entry.batchId)
    } catch (err) {
      setWizardError(err?.message || 'Unable to create batch')
    } finally {
      setWizardBusy(false)
    }
  }

  const filteredAvailable = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    if (!q) return roster.available
    return roster.available.filter((s) =>
      [s.applicant, s.email, s.phone, s.admissionId, s.course]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [roster.available, studentSearch])

  const filteredAssigned = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    if (!q) return roster.assigned
    return roster.assigned.filter((s) =>
      [s.applicant, s.email, s.phone, s.admissionId, s.course]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [roster.assigned, studentSearch])

  const toggleId = (list, setList, id) => {
    setList((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const handleAssignSelected = async () => {
    if (!createdBatch || !selectedAvailable.length) return
    setWizardBusy(true)
    setWizardError('')
    try {
      const data = await assignBatchStudents(
        createdBatch._id || createdBatch.batchId,
        selectedAvailable,
      )
      setRoster({
        assigned: data.assigned,
        available: data.available,
        capacity: data.capacity,
        enrolledCount: data.enrolledCount,
        seatsLeft: data.seatsLeft,
      })
      setCreatedBatch(data.batch || createdBatch)
      setSelectedAvailable([])
      setToast(`Added ${selectedAvailable.length} student(s)`)
      await reload()
    } catch (err) {
      setWizardError(err?.message || 'Unable to assign students')
    } finally {
      setWizardBusy(false)
    }
  }

  const handleRemoveSelected = async () => {
    if (!createdBatch || !selectedAssigned.length) return
    setWizardBusy(true)
    setWizardError('')
    try {
      const data = await removeBatchStudents(
        createdBatch._id || createdBatch.batchId,
        selectedAssigned,
      )
      setRoster({
        assigned: data.assigned,
        available: data.available,
        capacity: data.capacity,
        enrolledCount: data.enrolledCount,
        seatsLeft: data.seatsLeft,
      })
      setCreatedBatch(data.batch || createdBatch)
      setSelectedAssigned([])
      setToast(`Removed ${selectedAssigned.length} student(s)`)
      await reload()
    } catch (err) {
      setWizardError(err?.message || 'Unable to remove students')
    } finally {
      setWizardBusy(false)
    }
  }

  const tableColumns = [
    ...columns.map((c) => {
      if (c.key === 'status') {
        return {
          ...c,
          render: (row) => (
            <select
              value={row.status || 'Running'}
              disabled={busyId === row._id}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation()
                handleStatusChange(row, e.target.value)
              }}
              className="h-8 max-w-full rounded-full border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 outline-none focus:border-[#00A896]"
            >
              {['Upcoming', 'Running', 'Completed', 'Archived'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ),
        }
      }
      if (c.key === 'batchId') {
        return {
          ...c,
          render: (row) => (
            <span className="block min-w-0 break-all text-xs font-medium text-slate-700">
              {row.batchId || '—'}
            </span>
          ),
        }
      }
      if (c.key === 'courseName') {
        return {
          ...c,
          render: (row) => (
            <div className="min-w-0">
              <p className="break-words [overflow-wrap:anywhere] font-medium leading-snug text-slate-800">
                {row.courseName || '—'}
              </p>
              {row.courseCode ? (
                <p className="mt-0.5 break-all text-xs text-slate-500">{row.courseCode}</p>
              ) : null}
            </div>
          ),
        }
      }
      if (c.key === 'universityName') {
        return {
          ...c,
          render: (row) => (
            <span className="block min-w-0 break-words [overflow-wrap:anywhere] leading-snug text-slate-700">
              {row.universityName || row.universityShortName || '—'}
            </span>
          ),
        }
      }
      if (c.key === 'schedule') {
        return {
          ...c,
          render: (row) => (
            <span className="block min-w-0 break-words [overflow-wrap:anywhere] leading-snug text-slate-700">
              {row.schedule || '—'}
            </span>
          ),
        }
      }
      if (c.key === 'startLabel') {
        return {
          ...c,
          render: (row) => (
            <span className="block min-w-0 break-words leading-snug text-slate-700">
              {row.startLabel || row.startDate || '—'}
            </span>
          ),
        }
      }
      if (c.key === 'students') {
        return {
          ...c,
          render: (row) => (
            <span className="inline-flex flex-wrap items-center gap-1 font-semibold text-slate-800">
              <Users size={12} className="shrink-0 text-[#008C95]" />
              {row.enrolledCount ?? row.students ?? 0}
              <span className="text-xs font-normal text-slate-400">/ {row.capacity || 20}</span>
            </span>
          ),
        }
      }
      if (c.key === 'progressLabel') {
        return {
          ...c,
          render: (row) => (
            <div className="min-w-0">
              <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF5E14] to-[#008C95]"
                  style={{ width: `${Math.min(100, Number(row.progress) || 0)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500">{row.progress ?? 0}%</p>
            </div>
          ),
        }
      }
      if (c.key === 'name') {
        return {
          ...c,
          render: (row) => (
            <div className="min-w-0">
              <p className="break-words [overflow-wrap:anywhere] font-semibold leading-snug text-slate-800">
                {row.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">Sem {row.currentSemester || 1}</p>
            </div>
          ),
        }
      }
      return c
    }),
    {
      key: '_actions',
      label: 'Actions',
      width: '12%',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            disabled={busyId === row._id}
            onClick={(e) => {
              e.stopPropagation()
              openManageStudents(row)
            }}
            className={`${secondaryBtn} !px-2.5 !py-1 text-xs disabled:opacity-50`}
          >
            <UserPlus size={12} /> Students
          </button>
          <button
            type="button"
            disabled={busyId === row._id}
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(row)
            }}
            className={`${secondaryBtn} !px-2.5 !py-1 text-xs text-rose-600 disabled:opacity-50`}
          >
            <Trash2 size={12} /> Archive
          </button>
        </div>
      ),
    },
  ]

  const seatsAfterSelect = Math.max(
    0,
    (roster.seatsLeft ?? 0) - selectedAvailable.length,
  )
  const canSelectMore = (roster.seatsLeft ?? 0) > selectedAvailable.length

  return (
    <section className="space-y-3">
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

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <StatCard label="Running" value={loading ? '—' : String(stats.running ?? 0)} icon={Layers} />
        <StatCard label="Upcoming" value={loading ? '—' : String(stats.upcoming ?? 0)} icon={CalendarDays} />
        <StatCard label="Students" value={loading ? '—' : String(stats.students ?? 0)} icon={Users} />
        <StatCard
          label="Avg Progress"
          value={loading ? '—' : `${stats.avgProgress ?? 0}%`}
          icon={TrendingUp}
        />
      </div>

      <div className={`${card} p-3`}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-800">Create & manage batches</p>
            <p className="text-xs text-slate-500">
              Course choose/create → batch timing + capacity → registered Approved students add
              karein. Sync/Seed sirf demo tools hain.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateWizard}
            className={`${primaryBtn} !px-3 !py-1.5 text-xs`}
          >
            <Plus size={14} /> Create Batch
          </button>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={syncing || seeding || loading}
            onClick={handleSync}
            className={`${secondaryBtn} !px-3 !py-1.5 text-xs disabled:opacity-60`}
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync (demo)'}
          </button>
          <button
            type="button"
            disabled={syncing || seeding || loading}
            onClick={handleSeedRoster}
            className={`${secondaryBtn} !px-3 !py-1.5 text-xs disabled:opacity-60`}
          >
            <Users size={14} className={seeding ? 'animate-pulse' : ''} />
            {seeding ? 'Seeding…' : 'Seed roster (demo)'}
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-600">
            University
            <select
              value={universityId}
              onChange={(e) => {
                setUniversityId(e.target.value)
                setCourseId('')
              }}
              className={inputClass}
            >
              <option value="">All universities</option>
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
              onChange={(e) => setCourseId(e.target.value)}
              className={inputClass}
            >
              <option value="">All courses</option>
              {filteredCourses.map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.code ? `${c.code} — ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <PageToolbar
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search batches, course, university…"
        filters={filterOptions}
        filterValue={table.filter}
        onFilter={table.setFilter}
        onExportCsv={() =>
          downloadCsv(
            'batches.csv',
            columns,
            table.filtered.map((r) => ({
              ...r,
              students: r.enrolledCount ?? r.students,
            })),
          )
        }
        extraActions={
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className={`${secondaryBtn} !px-3 !py-1.5 text-xs`}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      <Panel title="Batches">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading batches…</p>
        ) : (
          <>
            <DataTable
              columns={tableColumns}
              rows={table.pageRows}
              wrap
              emptyTitle="No batches yet"
              emptyDescription='Click "Create Batch" to add a course batch with timing, capacity, and students.'
            />
            <Pagination
              page={table.page}
              pageSize={table.pageSize}
              total={table.total}
              onPageChange={table.setPage}
            />
          </>
        )}
      </Panel>

      <Modal
        open={wizardOpen}
        wide
        title={
          wizardMode === 'students'
            ? `Manage students · ${createdBatch?.batchId || createdBatch?.name || ''}`
            : 'Create batch'
        }
        onClose={closeWizard}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1">
              {WIZARD_STEPS.map((s) => (
                <span
                  key={s.id}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    wizardStep === s.id
                      ? 'bg-[#00A896]/15 text-[#008C95]'
                      : wizardStep > s.id
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  {s.id}. {s.label}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {wizardMode === 'create' && wizardStep > 1 && wizardStep < 3 ? (
                <button
                  type="button"
                  className={`${secondaryBtn} !px-3 !py-1.5 text-xs`}
                  onClick={() => {
                    setWizardError('')
                    setWizardStep((s) => Math.max(1, s - 1))
                  }}
                  disabled={wizardBusy}
                >
                  <ChevronLeft size={14} /> Back
                </button>
              ) : null}
              {wizardStep === 1 ? (
                <button
                  type="button"
                  className={`${primaryBtn} !px-3 !py-1.5 text-xs disabled:opacity-60`}
                  disabled={wizardBusy}
                  onClick={goNextFromCourse}
                >
                  {wizardBusy ? 'Saving…' : 'Next'} <ChevronRight size={14} />
                </button>
              ) : null}
              {wizardStep === 2 ? (
                <button
                  type="button"
                  className={`${primaryBtn} !px-3 !py-1.5 text-xs disabled:opacity-60`}
                  disabled={wizardBusy}
                  onClick={handleCreateBatchStep}
                >
                  {wizardBusy ? 'Creating…' : 'Create & add students'} <ChevronRight size={14} />
                </button>
              ) : null}
              {wizardStep === 3 ? (
                <button
                  type="button"
                  className={`${primaryBtn} !px-3 !py-1.5 text-xs`}
                  onClick={closeWizard}
                >
                  Done
                </button>
              ) : null}
            </div>
          </div>
        }
      >
        {wizardError ? (
          <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {wizardError}
          </div>
        ) : null}

        {wizardStep === 1 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreatingCourse(false)
                  setWizardError('')
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  !creatingCourse
                    ? 'bg-gradient-to-r from-[#FF5E14] to-[#008C95] text-white'
                    : 'border border-slate-200 bg-white text-slate-600'
                }`}
              >
                Select existing course
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreatingCourse(true)
                  setWizardError('')
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  creatingCourse
                    ? 'bg-gradient-to-r from-[#FF5E14] to-[#008C95] text-white'
                    : 'border border-slate-200 bg-white text-slate-600'
                }`}
              >
                Create new course
              </button>
            </div>

            {!creatingCourse ? (
              <label className="block text-xs font-medium text-slate-600">
                Active course
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select course…</option>
                  {wizardCourseOptions.map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.code ? `${c.code} — ${c.name}` : c.name}
                      {c.universityName ? ` (${c.universityName})` : ''}
                    </option>
                  ))}
                </select>
                {!wizardCourseOptions.length ? (
                  <p className="mt-1 text-[11px] text-amber-700">
                    No active courses yet — switch to “Create new course”, or add one under Courses.
                  </p>
                ) : null}
              </label>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
                  Course name
                  <input
                    value={courseForm.name}
                    onChange={(e) => setCourseForm((p) => ({ ...p, name: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g. Full Stack Web Development"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Code
                  <input
                    value={courseForm.code}
                    onChange={(e) =>
                      setCourseForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                    }
                    className={inputClass}
                    placeholder="GST-FSWD"
                  />
                </label>
                <label className="block text-xs font-medium text-slate-600">
                  Type
                  <select
                    value={courseForm.type}
                    onChange={(e) => setCourseForm((p) => ({ ...p, type: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="Institute">Institute Self Course</option>
                    <option value="University">University Course</option>
                    <option value="ITI / SCVT">ITI / SCVT Course</option>
                  </select>
                </label>
                {courseForm.type === 'University' || courseForm.type === 'ITI / SCVT' ? (
                  <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
                    {courseForm.type === 'ITI / SCVT' ? 'ITI / SCVT Authority' : 'University'}
                    <select
                      value={courseForm.universityId}
                      onChange={(e) =>
                        setCourseForm((p) => ({ ...p, universityId: e.target.value }))
                      }
                      className={inputClass}
                    >
                      <option value="">
                        {courseForm.type === 'ITI / SCVT'
                          ? 'Select ITI / SCVT authority…'
                          : 'Select university…'}
                      </option>
                      {universities
                        .filter((u) => {
                          if (u.status && u.status !== 'Active') return false
                          if (courseForm.type === 'ITI / SCVT') return u.universityType === 'ITI / SCVT'
                          return u.universityType !== 'ITI / SCVT'
                        })
                        .map((u) => (
                          <option key={u._id || u.id} value={u._id || u.id}>
                            {u.shortName ? `${u.shortName} — ${u.name}` : u.name}
                          </option>
                        ))}
                    </select>
                  </label>
                ) : null}
                <label className="block text-xs font-medium text-slate-600">
                  Duration (months)
                  <input
                    type="number"
                    min={1}
                    value={courseForm.durationMonths}
                    onChange={(e) =>
                      setCourseForm((p) => ({ ...p, durationMonths: e.target.value }))
                    }
                    className={inputClass}
                  />
                </label>
              </div>
            )}
          </div>
        ) : null}

        {wizardStep === 2 ? (
          <div className="space-y-3">
            <p className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Course:{' '}
              <span className="font-semibold text-slate-800">
                {selectedCourse
                  ? `${selectedCourse.code ? `${selectedCourse.code} — ` : ''}${selectedCourse.name}`
                  : '—'}
              </span>
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
                Batch name (optional)
                <input
                  value={batchForm.name}
                  onChange={(e) => setBatchForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputClass}
                  placeholder="Auto: CODE-YEAR-A"
                />
              </label>
              <label className="block text-xs font-medium text-slate-600 sm:col-span-2">
                Timing / schedule
                <input
                  value={batchForm.schedule}
                  onChange={(e) => setBatchForm((p) => ({ ...p, schedule: e.target.value }))}
                  className={inputClass}
                  placeholder="Mon–Fri · 10:00–12:00"
                />
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {SCHEDULE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBatchForm((p) => ({ ...p, schedule: preset }))}
                      className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600 hover:border-[#00A896] hover:text-[#008C95]"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Strength / capacity
                <input
                  type="number"
                  min={1}
                  value={batchForm.capacity}
                  onChange={(e) => setBatchForm((p) => ({ ...p, capacity: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Faculty (optional)
                <input
                  value={batchForm.faculty}
                  onChange={(e) => setBatchForm((p) => ({ ...p, faculty: e.target.value }))}
                  className={inputClass}
                  placeholder="Faculty name"
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Start date
                <DateInput
                  value={batchForm.startDate}
                  onChange={(e) => setBatchForm((p) => ({ ...p, startDate: e.target.value }))}
                  className={inputClass}
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                End date (optional)
                <DateInput
                  value={batchForm.endDate}
                  onChange={(e) => setBatchForm((p) => ({ ...p, endDate: e.target.value }))}
                  className={inputClass}
                />
              </label>
            </div>
          </div>
        ) : null}

        {wizardStep === 3 ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <span>
                Batch{' '}
                <span className="font-semibold text-slate-800">
                  {createdBatch?.batchId || '—'}
                </span>
                {createdBatch?.name ? ` · ${createdBatch.name}` : ''}
              </span>
              <span className="font-semibold text-[#008C95]">
                {roster.enrolledCount}/{roster.capacity} seats · {roster.seatsLeft} left
              </span>
            </div>

            <input
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className={inputClass}
              placeholder="Search students by name, email, phone, admission ID…"
            />

            {rosterLoading ? (
              <p className="py-6 text-center text-sm text-slate-500">Loading students…</p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-800">
                      Available ({filteredAvailable.length})
                    </p>
                    <button
                      type="button"
                      disabled={wizardBusy || !selectedAvailable.length}
                      onClick={handleAssignSelected}
                      className={`${primaryBtn} !px-2.5 !py-1 text-[11px] disabled:opacity-50`}
                    >
                      Add selected
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {!filteredAvailable.length ? (
                      <p className="px-1 py-4 text-center text-xs text-slate-500">
                        No Approved registered students for this course (or all assigned).
                      </p>
                    ) : (
                      filteredAvailable.map((s) => {
                        const checked = selectedAvailable.includes(s._id)
                        const disableNew =
                          !checked && !canSelectMore
                        return (
                          <label
                            key={s._id}
                            className={`mb-1 flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-slate-50 ${
                              disableNew ? 'opacity-50' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="mt-0.5"
                              checked={checked}
                              disabled={disableNew || wizardBusy}
                              onChange={() => toggleId(selectedAvailable, setSelectedAvailable, s._id)}
                            />
                            <span className="min-w-0">
                              <span className="block font-medium text-slate-800">{s.applicant}</span>
                              <span className="block text-slate-500">
                                {s.admissionId} · {s.email || s.phone || '—'}
                              </span>
                            </span>
                          </label>
                        )
                      })
                    )}
                  </div>
                  {!canSelectMore && selectedAvailable.length === 0 ? (
                    <p className="border-t border-slate-100 px-3 py-1.5 text-[11px] text-amber-700">
                      Batch is at full capacity.
                    </p>
                  ) : selectedAvailable.length ? (
                    <p className="border-t border-slate-100 px-3 py-1.5 text-[11px] text-slate-500">
                      After add: {roster.enrolledCount + selectedAvailable.length}/{roster.capacity}{' '}
                      ({seatsAfterSelect} left)
                    </p>
                  ) : null}
                </div>

                <div className="rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-800">
                      In this batch ({filteredAssigned.length})
                    </p>
                    <button
                      type="button"
                      disabled={wizardBusy || !selectedAssigned.length}
                      onClick={handleRemoveSelected}
                      className={`${secondaryBtn} !px-2.5 !py-1 text-[11px] text-rose-600 disabled:opacity-50`}
                    >
                      Remove selected
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {!filteredAssigned.length ? (
                      <p className="px-1 py-4 text-center text-xs text-slate-500">
                        No students assigned yet.
                      </p>
                    ) : (
                      filteredAssigned.map((s) => (
                        <label
                          key={s._id}
                          className="mb-1 flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={selectedAssigned.includes(s._id)}
                            disabled={wizardBusy}
                            onChange={() => toggleId(selectedAssigned, setSelectedAssigned, s._id)}
                          />
                          <span className="min-w-0">
                            <span className="block font-medium text-slate-800">{s.applicant}</span>
                            <span className="block text-slate-500">
                              {s.admissionId} · {s.email || s.phone || '—'}
                            </span>
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </section>
  )
}
