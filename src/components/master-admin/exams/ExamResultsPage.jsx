import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Printer, RefreshCw } from 'lucide-react'
import { getExamResults, getExamResultById, allotReexam } from '../../../services/examResultService.js'
import { getExamSchedules } from '../../../services/examScheduleService.js'
import { getUniversities } from '../../../services/universityService.js'
import { getCourses } from '../../../services/courseService.js'
import { getBatches } from '../../../services/batchService.js'
import {
  DataTable,
  Modal,
  PageToolbar,
  Pagination,
  Panel,
  PrimaryButton,
  SecondaryButton,
  StatCard,
  StatusBadge,
  downloadCsv,
  useClientTable,
} from '../shared/MasterAdminUI.jsx'
import { DateInput } from '../../shared/DateInput.jsx'
import { formatAnswer, inputClass } from './examFormUtils.js'

function formatDuration(seconds) {
  const n = Number(seconds) || 0
  const m = Math.floor(n / 60)
  const s = n % 60
  return `${m}m ${s}s`
}

export default function ExamResultsPage() {
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({})
  const [schedules, setSchedules] = useState([])
  const [universities, setUniversities] = useState([])
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [filters, setFilters] = useState({ examId: '', universityId: '', courseId: '', batchId: '', student: '', result: '', from: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [detail, setDetail] = useState(null)
  const [allottingId, setAllottingId] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getExamResults(filters)
      setRows(data.rows)
      setStats(data.stats || {})
    } catch (err) {
      setError(err.message || 'Unable to load results')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    getExamSchedules().then((d) => setSchedules(d.rows || [])).catch(() => {})
    getUniversities().then((d) => setUniversities(d.rows || [])).catch(() => {})
    getCourses({ status: 'Active' }).then((d) => setCourses(d.rows || [])).catch(() => {})
    getBatches().then((d) => setBatches(d.rows || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  const table = useClientTable(rows, {
    searchKeys: ['studentName', 'admissionId', 'examTitle', 'courseName', 'batchName'],
    pageSize: 12,
    filterKey: 'result',
  })

  const openDetail = async (row) => {
    try {
      const entry = await getExamResultById(row.id || row._id)
      setDetail(entry)
    } catch (err) {
      setError(err.message || 'Unable to open result')
    }
  }

  const printDetail = () => window.print()

  const allot = async (row) => {
    const name = row.studentName || 'this student'
    const confirmed = window.confirm(
      `Allot a re-exam for ${name}?\n\nThey can attempt the same exam again. The previous result stays in history.`,
    )
    if (!confirmed) return
    setAllottingId(row.id || row._id)
    setError('')
    try {
      const data = await allotReexam(row.id || row._id)
      setToast(data.message || 'Re-exam allotted')
      reload()
    } catch (err) {
      setError(err.message || 'Unable to allot re-exam')
    } finally {
      setAllottingId('')
    }
  }

  const filteredBatches = useMemo(() => {
    if (!filters.courseId) return batches
    return batches.filter((b) => String(b.courseId || '') === String(filters.courseId))
  }, [batches, filters.courseId])

  return (
    <section className="space-y-3">
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {toast ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{toast}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard label="Total Exams" value={stats.totalExams || 0} />
        <StatCard label="Total Attempts" value={stats.totalAttempts || 0} />
        <StatCard label="Submitted" value={stats.submitted || 0} />
        <StatCard label="In Progress" value={stats.inProgress || 0} />
        <StatCard label="Passed" value={stats.passed || 0} />
        <StatCard label="Failed" value={stats.failed || 0} />
        <StatCard label="Average Score" value={`${stats.averageScore || 0}%`} />
      </div>

      <PageToolbar
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search student / exam…"
        extraActions={
          <>
            <select value={filters.examId} onChange={(e) => setFilters((p) => ({ ...p, examId: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
              <option value="">All exams</option>
              {schedules.map((s) => <option key={s.id} value={s.id}>{s.examTitle}</option>)}
            </select>
            <select value={filters.universityId} onChange={(e) => setFilters((p) => ({ ...p, universityId: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
              <option value="">All universities</option>
              {universities.map((u) => <option key={u._id || u.id} value={u._id || u.id}>{u.shortName || u.name}</option>)}
            </select>
            <select value={filters.courseId} onChange={(e) => setFilters((p) => ({ ...p, courseId: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
              <option value="">All courses</option>
              {courses.map((c) => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
            </select>
            <select value={filters.batchId} onChange={(e) => setFilters((p) => ({ ...p, batchId: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
              <option value="">All batches</option>
              {filteredBatches.map((b) => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
            </select>
            <select value={filters.result} onChange={(e) => setFilters((p) => ({ ...p, result: e.target.value }))} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
              <option value="">All results</option>
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
            </select>
            <DateInput value={filters.from} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))} className={`${inputClass} mt-0 h-10 w-auto min-w-[10.5rem]`} />
            <SecondaryButton onClick={reload}><RefreshCw size={14} /> Refresh</SecondaryButton>
            <SecondaryButton onClick={() => downloadCsv('exam-results.csv', [
              { key: 'studentName', label: 'Student' },
              { key: 'admissionId', label: 'Admission ID' },
              { key: 'examTitle', label: 'Exam' },
              { key: 'courseName', label: 'Course' },
              { key: 'batchName', label: 'Batch' },
              { key: 'obtainedMarks', label: 'Score' },
              { key: 'percentage', label: 'Percentage' },
              { key: 'result', label: 'Result' },
            ], table.filtered)}><Download size={14} /> CSV</SecondaryButton>
          </>
        }
      />

      <Panel title="Exam Results">
        {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading results…</p> : (
          <DataTable
            rows={table.pageRows}
            columns={[
              { key: 'studentName', label: 'Student' },
              { key: 'admissionId', label: 'Admission ID' },
              { key: 'examTitle', label: 'Exam' },
              { key: 'courseName', label: 'Course' },
              { key: 'batchName', label: 'Batch' },
              { key: 'startedAt', label: 'Started At', render: (row) => row.startedAt ? new Date(row.startedAt).toLocaleString('en-IN') : '—' },
              { key: 'submittedAt', label: 'Submitted At', render: (row) => row.submittedAt ? new Date(row.submittedAt).toLocaleString('en-IN') : '—' },
              { key: 'score', label: 'Score' },
              { key: 'percentage', label: '%', render: (row) => `${row.percentage}%` },
              { key: 'result', label: 'Result', render: (row) => <StatusBadge status={row.result} /> },
              { key: 'status', label: 'Status', render: (row) => (
                <div className="flex flex-wrap gap-1">
                  <StatusBadge status={row.status} />
                  {row.reexamPending ? <StatusBadge status="Re-exam allotted" /> : null}
                </div>
              ) },
              {
                key: '_actions',
                label: 'Actions',
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <SecondaryButton onClick={() => openDetail(row)}>View</SecondaryButton>
                    <PrimaryButton
                      disabled={!row.canAllotReexam || allottingId === (row.id || row._id)}
                      onClick={() => allot(row)}
                    >
                      {row.reexamPending ? 'Extend re-exam' : 'Allot re-exam'}
                    </PrimaryButton>
                  </div>
                ),
              },
            ]}
            emptyTitle="No results yet"
            emptyDescription="Submitted attempts will appear here."
          />
        )}
        <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPageChange={table.setPage} />
      </Panel>

      <Modal
        open={Boolean(detail)}
        wide
        title="Attempt details"
        onClose={() => setDetail(null)}
        footer={
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={printDetail}><Printer size={14} /> Print</SecondaryButton>
          </div>
        }
      >
        {detail ? (
          <div className="space-y-3 print:text-black">
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <p><span className="font-semibold">Student:</span> {detail.studentName}</p>
              <p><span className="font-semibold">Admission ID:</span> {detail.admissionId || '—'}</p>
              <p><span className="font-semibold">Exam:</span> {detail.examTitle}</p>
              <p><span className="font-semibold">Course:</span> {detail.courseName}</p>
              <p><span className="font-semibold">Score:</span> {detail.obtainedMarks}/{detail.totalMarks} ({detail.percentage}%)</p>
              <p><span className="font-semibold">Result:</span> {detail.result}</p>
              <p><span className="font-semibold">Time taken:</span> {formatDuration(detail.timeTakenSeconds)}</p>
            </div>
            <div className="space-y-2">
              {(detail.breakdown || []).map((item, index) => (
                <article key={item.questionId || index} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-medium">Q{index + 1}. {item.text}</p>
                  <p className="mt-1 text-slate-500">Student: {formatAnswer(item.studentAnswer)}</p>
                  <p className="text-slate-500">Correct: {formatAnswer(item.correctAnswer)}</p>
                  <p className="mt-1">
                    Marks: {item.obtainedMarks}/{item.marks} · <StatusBadge status={item.verdict} />
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  )
}
