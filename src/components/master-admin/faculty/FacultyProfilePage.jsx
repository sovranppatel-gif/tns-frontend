import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import {
  getFacultyAttendance,
  getFacultyById,
  getFacultyExams,
  getFacultyMeta,
  getFacultyStudents,
  saveFacultyAttendance,
  updateFaculty,
} from '../../../services/facultyService.js'
import { API_URL } from '../../../utils/api.js'
import {
  DataTable,
  Modal,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatCard,
  StatusBadge,
  Tabs,
} from '../shared/MasterAdminUI.jsx'
import { DateInput } from '../../shared/DateInput.jsx'
import FacultyAssignments from './FacultyAssignments.jsx'
import FacultyForm from './FacultyForm.jsx'
import FacultyTimetable from './FacultyTimetable.jsx'
import {
  ATTENDANCE_STATUSES,
  emptyFacultyForm,
  facultyInitials,
  facultyToForm,
  formToPayload,
  inputClass,
  photoSrc,
} from './facultyFormUtils.js'

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-800">{value || '—'}</p>
    </div>
  )
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'timetable', label: 'Timetable' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'students', label: 'Students' },
  { id: 'exams', label: 'Exams' },
]

export default function FacultyProfilePage({
  facultyId,
  onBack,
  onEdit,
  onToast,
  onError,
}) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedTab = searchParams.get('tab')
  const tab = TABS.some((t) => t.id === requestedTab) ? requestedTab : 'overview'
  const setTab = (id) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (!id || id === 'overview') next.delete('tab')
      else next.set('tab', id)
      return next
    }, { replace: true })
  }
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [students, setStudents] = useState([])
  const [exams, setExams] = useState([])
  const [attendance, setAttendance] = useState({ today: null, rows: [], stats: {} })
  const [attForm, setAttForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    status: 'Present',
    checkInTime: '09:30',
    checkOutTime: '16:30',
    method: 'Manual',
    note: '',
  })
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(() => emptyFacultyForm())
  const [meta, setMeta] = useState({ designations: [], departments: [], permissions: [] })
  const [formSaving, setFormSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')

  const showError = (message) => {
    setError(message)
    onError?.(message)
  }
  const showToast = (message) => {
    setToast(message)
    onToast?.(message)
  }

  const load = useCallback(async (opts = {}) => {
    if (!opts.silent) setLoading(true)
    setLoadError('')
    try {
      const data = await getFacultyById(facultyId)
      setEntry(data)
    } catch (err) {
      const message = err?.message || 'Unable to load faculty'
      setLoadError(message)
      onError?.(message)
      setEntry(null)
    } finally {
      if (!opts.silent) setLoading(false)
    }
  }, [facultyId, onError])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (tab !== 'students') return undefined
    getFacultyStudents(facultyId)
      .then((data) => setStudents(data.rows || []))
      .catch((err) => showError(err?.message || 'Unable to load students'))
    return undefined
  }, [tab, facultyId])

  useEffect(() => {
    if (tab !== 'exams') return undefined
    getFacultyExams(facultyId)
      .then((data) => setExams(data.rows || []))
      .catch((err) => showError(err?.message || 'Unable to load exams'))
    return undefined
  }, [tab, facultyId])

  useEffect(() => {
    if (tab !== 'attendance') return undefined
    getFacultyAttendance(facultyId)
      .then(setAttendance)
      .catch((err) => showError(err?.message || 'Unable to load attendance'))
    return undefined
  }, [tab, facultyId])

  const goBack = () => {
    if (onBack) onBack()
    else navigate('/master-admin/faculty')
  }

  const openEdit = async () => {
    try {
      if (!meta.permissions?.length) {
        const data = await getFacultyMeta()
        setMeta(data)
      }
      setForm(facultyToForm(entry))
      setFormOpen(true)
      onEdit?.(entry)
    } catch (err) {
      showError(err?.message || 'Unable to open editor')
    }
  }

  const saveEdit = async () => {
    setFormSaving(true)
    setError('')
    try {
      await updateFaculty(facultyId, formToPayload(form))
      showToast('Faculty updated')
      setFormOpen(false)
      await load({ silent: true })
    } catch (err) {
      showError(err?.message || 'Unable to save faculty')
    } finally {
      setFormSaving(false)
    }
  }

  if (loading) {
    return (
      <Panel title="Faculty profile">
        <p className="py-8 text-center text-sm text-slate-500">Loading faculty…</p>
      </Panel>
    )
  }

  if (!entry) {
    return (
      <Panel title="Faculty profile">
        <p className="py-8 text-center text-sm text-rose-600">{loadError || 'Faculty not found'}</p>
        <div className="flex justify-center">
          <SecondaryButton onClick={goBack}>
            <ArrowLeft size={15} /> Back to faculty
          </SecondaryButton>
        </div>
      </Panel>
    )
  }

  const personal = entry.personalDetails || {}
  const employment = entry.employmentDetails || {}
  const src = photoSrc(personal.profilePhoto || entry.profilePhoto, API_URL)
  const stats = entry.stats || {}

  return (
    <section className="space-y-3">
      {toast ? (
        <div className="fixed right-3 top-3 z-[90] rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}
      {error ? (
        <article className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">{error}</article>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <SecondaryButton onClick={goBack}>
          <ArrowLeft size={15} /> Back
        </SecondaryButton>
        <PrimaryButton onClick={openEdit}>
          <Pencil size={15} /> Edit
        </PrimaryButton>
      </div>

      <article className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
        {src ? (
          <img src={src} alt="" className="h-20 w-20 rounded-lg object-cover" />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-lg bg-navy-900 text-lg font-bold text-gold">
            {facultyInitials(entry.fullName)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-navy-900">{entry.fullName}</h2>
            <StatusBadge status={entry.status} />
          </div>
          <p className="text-sm text-slate-500">
            {entry.facultyId} · {entry.designation} · {entry.department || '—'}
          </p>
          <p className="text-xs text-slate-400">
            {entry.mobile} · {entry.email}
          </p>
        </div>
      </article>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'overview' ? (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Assigned courses" value={String(stats.assignedCourses ?? 0)} />
            <StatCard label="Assigned subjects" value={String(stats.assignedSubjects ?? 0)} />
            <StatCard label="Assigned batches" value={String(stats.assignedBatches ?? 0)} />
            <StatCard label="Students" value={String(stats.totalStudents ?? 0)} />
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            <Panel title="Personal details">
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Name" value={personal.fullName} />
                <Info label="Gender" value={personal.gender} />
                <Info label="Date of birth" value={personal.dateOfBirthLabel} />
                <Info label="Father / Husband" value={personal.fatherOrHusbandName} />
                <Info label="Mobile" value={personal.mobile} />
                <Info label="Email" value={personal.email} />
                <Info label="Address" value={[personal.address, personal.city, personal.state, personal.pincode].filter(Boolean).join(', ')} />
              </div>
            </Panel>
            <Panel title="Professional details">
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Faculty ID" value={entry.facultyId} />
                <Info label="Designation" value={employment.designation} />
                <Info label="Department" value={employment.department} />
                <Info label="Qualification" value={employment.qualification} />
                <Info label="Specialization" value={employment.specialization} />
                <Info label="Experience" value={`${employment.experienceYears || 0} years`} />
                <Info label="Joining date" value={employment.joiningDateLabel} />
                <Info label="Employment type" value={employment.employmentType} />
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === 'assignments' ? (
        <Panel title="Assignments">
          <FacultyAssignments facultyId={facultyId} onToast={showToast} onError={showError} />
        </Panel>
      ) : null}

      {tab === 'timetable' ? (
        <Panel title="Weekly timetable">
          <FacultyTimetable facultyId={facultyId} onToast={showToast} onError={showError} />
        </Panel>
      ) : null}

      {tab === 'attendance' ? (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Today" value={attendance.today?.status || 'Unmarked'} />
            <StatCard label="This month" value={`${attendance.stats?.percent ?? 0}%`} hint={`${attendance.stats?.present || 0} present`} />
            <StatCard label="Late" value={String(attendance.stats?.late ?? 0)} />
            <StatCard label="Leave" value={String(attendance.stats?.leave ?? 0)} />
          </div>
          <Panel title="Mark attendance">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
                Date
                <DateInput value={attForm.date} onChange={(e) => setAttForm((p) => ({ ...p, date: e.target.value }))} className={inputClass} />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
                Status
                <select value={attForm.status} onChange={(e) => setAttForm((p) => ({ ...p, status: e.target.value }))} className={inputClass}>
                  {ATTENDANCE_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
                Check-in
                <input type="time" value={attForm.checkInTime} onChange={(e) => setAttForm((p) => ({ ...p, checkInTime: e.target.value }))} className={inputClass} />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase text-slate-500">
                Check-out
                <input type="time" value={attForm.checkOutTime} onChange={(e) => setAttForm((p) => ({ ...p, checkOutTime: e.target.value }))} className={inputClass} />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase text-slate-500 lg:col-span-2">
                Note
                <input value={attForm.note} onChange={(e) => setAttForm((p) => ({ ...p, note: e.target.value }))} className={inputClass} />
              </label>
            </div>
            <div className="mt-3">
              <PrimaryButton
                disabled={saving}
                onClick={async () => {
                  setSaving(true)
                  try {
                    await saveFacultyAttendance(facultyId, attForm)
                    showToast('Attendance saved')
                    setAttendance(await getFacultyAttendance(facultyId))
                  } catch (err) {
                    showError(err?.message || 'Unable to save attendance')
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                {saving ? 'Saving…' : 'Save attendance'}
              </PrimaryButton>
            </div>
          </Panel>
          <Panel title="This month">
            <DataTable
              columns={[
                { key: 'dateLabel', label: 'Date' },
                { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
                { key: 'checkInTime', label: 'In' },
                { key: 'checkOutTime', label: 'Out' },
                { key: 'method', label: 'Method' },
              ]}
              rows={attendance.rows}
              emptyTitle="No attendance marked"
            />
          </Panel>
        </div>
      ) : null}

      {tab === 'students' ? (
        <Panel title="Students">
          <DataTable
            columns={[
              { key: 'name', label: 'Student' },
              { key: 'admissionId', label: 'Admission ID' },
              { key: 'course', label: 'Course' },
              { key: 'semester', label: 'Semester' },
              { key: 'batch', label: 'Batch' },
              { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            ]}
            rows={students}
            emptyTitle="No students linked yet"
            emptyDescription="Assign this faculty to a batch to see enrolled students."
          />
        </Panel>
      ) : null}

      {tab === 'exams' ? (
        <Panel title="Connected exams">
          <DataTable
            columns={[
              { key: 'title', label: 'Exam' },
              { key: 'course', label: 'Course' },
              { key: 'batch', label: 'Batch' },
              { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
            ]}
            rows={exams}
            emptyTitle="No exams for assigned courses"
          />
        </Panel>
      ) : null}

      <Modal
        open={formOpen}
        title="Edit faculty"
        onClose={() => setFormOpen(false)}
        wide
        footer={
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setFormOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton disabled={formSaving} onClick={saveEdit}>
              {formSaving ? 'Saving…' : 'Save faculty'}
            </PrimaryButton>
          </div>
        }
      >
        <FacultyForm form={form} setForm={setForm} meta={meta} isCreate={false} onUploadError={showError} />
      </Modal>
    </section>
  )
}
