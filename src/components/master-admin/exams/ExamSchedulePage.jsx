import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import {
  cancelExamSchedule,
  createExamSchedule,
  getExamSchedules,
  releaseExamResults,
} from '../../../services/examScheduleService.js'
import { getExamPapers } from '../../../services/examPaperService.js'
import { getUniversities } from '../../../services/universityService.js'
import { getCourses } from '../../../services/courseService.js'
import { getBatches } from '../../../services/batchService.js'
import { getStudents } from '../../../services/studentService.js'
import {
  DataTable,
  PageToolbar,
  Pagination,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatCard,
  StatusBadge,
  useClientTable,
} from '../shared/MasterAdminUI.jsx'
import { DateInput } from '../../shared/DateInput.jsx'
import { inputClass } from './examFormUtils.js'

const STEPS = [
  'Paper',
  'University',
  'Course',
  'Batch',
  'Students',
  'Date & Time',
  'Review',
  'Schedule',
]

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function emptyWizard() {
  return {
    examPaperId: '',
    universityId: '',
    courseId: '',
    batchId: '',
    studentIds: [],
    startDate: todayIso(),
    startTime: '10:00',
    endDate: todayIso(),
    endTime: '11:00',
    durationMinutes: 60,
    attemptLimit: 1,
    resultVisibility: 'Immediately',
    instructions: [],
  }
}

export default function ExamSchedulePage() {
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({})
  const [papers, setPapers] = useState([])
  const [universities, setUniversities] = useState([])
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [wizard, setWizard] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(emptyWizard())
  const [saving, setSaving] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getExamSchedules()
      setRows(data.rows)
      setStats(data.stats || {})
    } catch (err) {
      setError(err.message || 'Unable to load schedules')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    getExamPapers({ status: 'Published' }).then((d) => setPapers(d.rows || [])).catch(() => {})
    getUniversities().then((d) => setUniversities((d.rows || []).filter((u) => u.status !== 'Inactive'))).catch(() => {})
    getCourses({ status: 'Active' }).then((d) => setCourses(d.rows || [])).catch(() => {})
    getBatches().then((d) => setBatches(d.rows || [])).catch(() => {})
  }, [reload])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  useEffect(() => {
    if (!wizard) return
    getStudents({
      universityId: form.universityId || undefined,
      courseId: form.courseId || undefined,
      batchId: form.batchId || undefined,
      status: 'Active',
    })
      .then((d) => setStudents(d.rows || []))
      .catch(() => setStudents([]))
  }, [wizard, form.universityId, form.courseId, form.batchId])

  const table = useClientTable(rows, {
    searchKeys: ['examTitle', 'examCode', 'courseName', 'batchName'],
    pageSize: 10,
  })

  const selectedPaper = papers.find((p) => String(p._id || p.id) === String(form.examPaperId))
  const selectedUniversity = universities.find((u) => String(u._id || u.id) === String(form.universityId))
  const selectedCourse = courses.find((c) => String(c._id || c.id) === String(form.courseId))
  const selectedBatch = batches.find((b) => String(b._id || b.id) === String(form.batchId))

  const filteredCourses = useMemo(() => {
    if (!form.universityId) return courses
    return courses.filter((c) => String(c.universityId || '') === String(form.universityId) || c.type === 'Institute')
  }, [courses, form.universityId])

  const filteredBatches = useMemo(() => {
    if (!form.courseId) return batches
    return batches.filter((b) => String(b.courseId || '') === String(form.courseId))
  }, [batches, form.courseId])

  const visibleStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase()
    if (!q) return students
    return students.filter((s) =>
      [s.nameEnglish, s.studentId, s.admissionId, s.email].join(' ').toLowerCase().includes(q),
    )
  }, [students, studentSearch])

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const toggleStudent = (id) => {
    setForm((prev) => ({
      ...prev,
      studentIds: prev.studentIds.includes(id)
        ? prev.studentIds.filter((item) => item !== id)
        : [...prev.studentIds, id],
    }))
  }

  const selectAll = () => {
    setForm((prev) => ({
      ...prev,
      studentIds: students.map((s) => s._id || s.id).filter(Boolean),
    }))
  }

  const startWizard = () => {
    setForm(emptyWizard())
    setStep(1)
    setWizard(true)
  }

  const canNext = () => {
    if (step === 1) return Boolean(form.examPaperId)
    if (step === 2) return Boolean(form.universityId)
    if (step === 3) return Boolean(form.courseId)
    if (step === 4) return Boolean(form.batchId)
    if (step === 5) return form.studentIds.length > 0
    if (step === 6) return Boolean(form.startDate && form.startTime && form.endDate && form.endTime)
    return true
  }

  const submit = async () => {
    setSaving(true)
    setError('')
    try {
      await createExamSchedule({
        ...form,
        durationMinutes: form.durationMinutes || selectedPaper?.durationMinutes || 60,
        instructions: selectedPaper?.instructions || [],
      })
      setToast('Exam scheduled and students notified')
      setWizard(false)
      reload()
    } catch (err) {
      setError(err.message || 'Unable to schedule exam')
    } finally {
      setSaving(false)
    }
  }

  const cancel = async (row) => {
    if (!window.confirm('Cancel this scheduled exam?')) return
    try {
      await cancelExamSchedule(row._id || row.id)
      setToast('Exam cancelled')
      reload()
    } catch (err) {
      setError(err.message || 'Unable to cancel exam')
    }
  }

  const release = async (row) => {
    try {
      await releaseExamResults(row._id || row.id)
      setToast('Results released')
      reload()
    } catch (err) {
      setError(err.message || 'Unable to release results')
    }
  }

  if (wizard) {
    return (
      <section className="space-y-3">
        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SecondaryButton onClick={() => setWizard(false)}>Back to schedules</SecondaryButton>
          <p className="text-sm text-slate-500">Step {step} of {STEPS.length}: {STEPS[step - 1]}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {STEPS.map((label, index) => (
            <span
              key={label}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                index + 1 === step ? 'bg-navy-900 text-white' : index + 1 < step ? 'bg-[#00A896]/15 text-[#005F6B]' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {index + 1}. {label}
            </span>
          ))}
        </div>

        <Panel title={STEPS[step - 1]}>
          {step === 1 ? (
            <select value={form.examPaperId} onChange={(e) => {
              const paper = papers.find((p) => String(p._id || p.id) === e.target.value)
              setForm((prev) => ({
                ...prev,
                examPaperId: e.target.value,
                durationMinutes: paper?.durationMinutes || 60,
                universityId: paper?.universityId || prev.universityId,
                courseId: paper?.courseId || prev.courseId,
                batchId: paper?.batchId || prev.batchId,
              }))
            }} className={inputClass}>
              <option value="">Select published paper</option>
              {papers.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>{p.title} ({p.code})</option>
              ))}
            </select>
          ) : null}

          {step === 2 ? (
            <select value={form.universityId} onChange={(e) => setField('universityId', e.target.value)} className={inputClass}>
              <option value="">Select university</option>
              {universities.map((u) => (
                <option key={u._id || u.id} value={u._id || u.id}>{u.shortName ? `${u.shortName} — ${u.name}` : u.name}</option>
              ))}
            </select>
          ) : null}

          {step === 3 ? (
            <select value={form.courseId} onChange={(e) => setField('courseId', e.target.value)} className={inputClass}>
              <option value="">Select course</option>
              {filteredCourses.map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
              ))}
            </select>
          ) : null}

          {step === 4 ? (
            <select value={form.batchId} onChange={(e) => setField('batchId', e.target.value)} className={inputClass}>
              <option value="">Select batch</option>
              {filteredBatches.map((b) => (
                <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>
              ))}
            </select>
          ) : null}

          {step === 5 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Search students" className={inputClass} />
                <div className="flex gap-2">
                  <SecondaryButton onClick={selectAll}>Select all</SecondaryButton>
                  <SecondaryButton onClick={() => setField('studentIds', [])}>Clear</SecondaryButton>
                </div>
              </div>
              <p className="text-sm text-slate-500">{form.studentIds.length} selected</p>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {visibleStudents.map((s) => {
                  const id = s._id
                  const checked = form.studentIds.includes(id)
                  return (
                    <label key={id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <input type="checkbox" checked={checked} onChange={() => toggleStudent(id)} />
                      <span className="font-medium">{s.nameEnglish}</span>
                      <span className="text-slate-400">{s.studentId || s.admissionId}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ) : null}

          {step === 6 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">Start date<DateInput value={form.startDate} onChange={(e) => setField('startDate', e.target.value)} className={inputClass} /></label>
              <label className="text-sm font-medium">Start time<input type="time" value={form.startTime} onChange={(e) => setField('startTime', e.target.value)} className={inputClass} /></label>
              <label className="text-sm font-medium">End date<DateInput value={form.endDate} onChange={(e) => setField('endDate', e.target.value)} className={inputClass} /></label>
              <label className="text-sm font-medium">End time<input type="time" value={form.endTime} onChange={(e) => setField('endTime', e.target.value)} className={inputClass} /></label>
              <label className="text-sm font-medium">Duration (min)<input type="number" min="1" value={form.durationMinutes} onChange={(e) => setField('durationMinutes', e.target.value)} className={inputClass} /></label>
              <label className="text-sm font-medium">Attempt limit<input type="number" min="1" value={form.attemptLimit} onChange={(e) => setField('attemptLimit', e.target.value)} className={inputClass} /></label>
              <label className="text-sm font-medium sm:col-span-2">Result visibility
                <select value={form.resultVisibility} onChange={(e) => setField('resultVisibility', e.target.value)} className={inputClass}>
                  <option>Immediately</option>
                  <option>After Exam Ends</option>
                  <option>Manual Release</option>
                </select>
              </label>
            </div>
          ) : null}

          {step >= 7 ? (
            <div className="space-y-2 text-sm text-slate-700">
              <p><span className="font-semibold">Exam:</span> {selectedPaper?.title || '—'}</p>
              <p><span className="font-semibold">University:</span> {selectedUniversity?.name || '—'}</p>
              <p><span className="font-semibold">Course:</span> {selectedCourse?.name || '—'}</p>
              <p><span className="font-semibold">Batch:</span> {selectedBatch?.name || '—'}</p>
              <p><span className="font-semibold">Students:</span> {form.studentIds.length}</p>
              <p><span className="font-semibold">Date:</span> {form.startDate}</p>
              <p><span className="font-semibold">Time:</span> {form.startTime} - {form.endTime}</p>
              <p><span className="font-semibold">Duration:</span> {form.durationMinutes} min</p>
              <p><span className="font-semibold">Result visibility:</span> {form.resultVisibility}</p>
            </div>
          ) : null}
        </Panel>

        <div className="flex justify-between">
          <SecondaryButton disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>Back</SecondaryButton>
          {step < 8 ? (
            <PrimaryButton disabled={!canNext()} onClick={() => setStep((s) => Math.min(8, s + 1))}>Next</PrimaryButton>
          ) : (
            <PrimaryButton disabled={saving} onClick={submit}>{saving ? 'Scheduling…' : 'Schedule Exam'}</PrimaryButton>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {toast ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{toast}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Scheduled" value={stats.scheduled || 0} />
        <StatCard label="Live" value={stats.live || 0} />
        <StatCard label="Completed" value={stats.completed || 0} />
        <StatCard label="Cancelled" value={stats.cancelled || 0} />
      </div>
      <PageToolbar
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search schedules…"
        filters={['Scheduled', 'Live', 'Completed', 'Cancelled']}
        filterValue={table.filter}
        onFilter={table.setFilter}
        onAdd={startWizard}
        addLabel="Schedule Exam"
        extraActions={<SecondaryButton onClick={reload}><RefreshCw size={14} /> Refresh</SecondaryButton>}
      />
      <Panel title="Exam Schedule">
        {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading schedules…</p> : (
          <DataTable
            rows={table.pageRows}
            columns={[
              { key: 'examTitle', label: 'Exam' },
              { key: 'courseName', label: 'Course' },
              { key: 'batchName', label: 'Batch' },
              { key: 'startLabel', label: 'Date' },
              { key: 'startTimeLabel', label: 'Time' },
              { key: 'assignedCount', label: 'Students' },
              { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              {
                key: '_actions',
                label: 'Actions',
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    {row.resultVisibility === 'Manual Release' && !row.resultsReleased ? (
                      <SecondaryButton onClick={() => release(row)}>Release results</SecondaryButton>
                    ) : null}
                    {row.status !== 'Cancelled' && row.status !== 'Completed' ? (
                      <SecondaryButton onClick={() => cancel(row)}>Cancel</SecondaryButton>
                    ) : null}
                  </div>
                ),
              },
            ]}
            emptyTitle="No scheduled exams"
            emptyDescription="Publish a paper, then assign it to a batch."
          />
        )}
        <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPageChange={table.setPage} />
      </Panel>
    </section>
  )
}
