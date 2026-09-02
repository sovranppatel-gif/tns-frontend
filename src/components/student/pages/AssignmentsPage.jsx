import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardList, Download, Upload } from 'lucide-react'
import { getStudentAssignments } from '../../../services/assignmentService.js'
import { getStudentToken } from '../../../utils/studentAuth.js'
import { studentMediaUrl } from '../../../services/studentClient.js'

function downloadAssignment(assignment) {
  const attachment = (assignment.assignmentId?.attachments || []).find((item) => {
    const url = typeof item === 'string' ? item : item?.url || item?.path || item?.fileUrl || item?.downloadUrl
    return Boolean(url)
  })
  const attachmentUrl = attachment
    ? typeof attachment === 'string'
      ? attachment
      : attachment.url || attachment.path || attachment.fileUrl || attachment.downloadUrl
    : ''

  if (attachmentUrl) {
    const link = document.createElement('a')
    link.href = studentMediaUrl(attachmentUrl)
    link.target = '_blank'
    link.rel = 'noreferrer'
    link.download = attachment.name || attachment.fileName || `${assignment.assignmentId.title}.file`
    document.body.appendChild(link)
    link.click()
    link.remove()
    return
  }

  const details = [
    assignment.assignmentId.title,
    '',
    `Course: ${assignment.assignmentId.courseId?.name || '—'}`,
    `Type: ${assignment.assignmentId.assignmentType || '—'}`,
    `Total marks: ${assignment.assignmentId.totalMarks ?? '—'}`,
    `Due: ${assignment.dueAt ? new Date(assignment.dueAt).toLocaleString('en-IN') : '—'}`,
    '',
    'Description',
    assignment.assignmentId.description || 'No description provided.',
    '',
    'Instructions',
    assignment.assignmentId.instructions || 'No additional instructions provided.',
  ].join('\n')
  const url = URL.createObjectURL(new Blob([details], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${assignment.assignmentId.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'assignment'}.txt`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
import {
  EmptyState,
  Panel,
  PrimaryButton,
  ProgressBar,
  SearchInput,
  SkeletonBlock,
  StatCard,
  StatusBadge,
} from '../shared/StudentUI.jsx'

export default function AssignmentsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    const token = getStudentToken()
    if (!token) {
      setRows([])
      setLoading(false)
      return undefined
    }
    getStudentAssignments(token)
      .then((data) => setRows((Array.isArray(data) ? data : []).filter((row) => row.assignmentId).map((row) => ({
        ...row,
        id: row._id,
        title: row.assignmentId.title,
        subject: row.assignmentId.subjectName || row.assignmentId.courseId?.name || 'Assignment',
        dueDate: row.dueAt ? new Date(row.dueAt).toLocaleDateString('en-IN') : '—',
        submittedDate: row.submittedAt ? new Date(row.submittedAt).toLocaleDateString('en-IN') : '—',
        marks: row.marksObtained == null ? '—' : `${row.marksObtained} / ${row.assignmentId.totalMarks}`,
        progress: row.status === 'EVALUATED' ? 100 : row.submissionCount > 0 ? 60 : 0,
        status: row.status === 'EVALUATED' ? 'Completed' : row.isLate ? 'Late' : 'Pending',
      }))))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
    return undefined
  }, [])

  const retry = () => {
    setError('')
    setLoading(true)
    const token = getStudentToken()
    if (!token) { setLoading(false); return }
    getStudentAssignments(token).then((data) => setRows((Array.isArray(data) ? data : []).filter((row) => row.assignmentId).map((row) => ({ ...row, id: row._id, title: row.assignmentId.title, subject: row.assignmentId.subjectName || row.assignmentId.courseId?.name || 'Assignment', dueDate: row.dueAt ? new Date(row.dueAt).toLocaleDateString('en-IN') : '—', submittedDate: row.submittedAt ? new Date(row.submittedAt).toLocaleDateString('en-IN') : '—', marks: row.marksObtained == null ? '—' : `${row.marksObtained} / ${row.assignmentId.totalMarks}`, progress: row.status === 'EVALUATED' ? 100 : row.submissionCount > 0 ? 60 : 0, status: row.status === 'EVALUATED' ? 'Completed' : row.isLate ? 'Late' : 'Pending' }))))
      .catch((err) => setError(err.message)).finally(() => setLoading(false))
  }

  const counts = useMemo(
    () => ({
      pending: rows.filter((a) => a.status === 'Pending').length,
      completed: rows.filter((a) => a.status === 'Completed').length,
      late: rows.filter((a) => a.status === 'Late').length,
    }),
    [rows],
  )

  const filtered = rows.filter((a) => {
    const matchQ =
      !query ||
      String(a.title || '')
        .toLowerCase()
        .includes(query.toLowerCase()) ||
      String(a.subject || '')
        .toLowerCase()
        .includes(query.toLowerCase())
    const matchF = filter === 'All' || a.status === filter
    return matchQ && matchF
  })

  if (loading) {
    return (
      <section className="grid gap-3 lg:grid-cols-2">
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-40" />
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Pending" value={counts.pending} icon={ClipboardList} />
        <StatCard label="Completed" value={counts.completed} icon={CheckCircle2} />
        <StatCard label="Late" value={counts.late} icon={AlertTriangle} />
      </div>

      {error ? <div className="flex flex-wrap items-center gap-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"><span>{error}</span><button type="button" className="font-semibold underline" onClick={retry}>Retry</button></div> : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[200px] flex-1">
          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search assignments…" />
        </div>
        {['All', 'Pending', 'Completed', 'Late'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              filter === f
                ? 'bg-gradient-to-r from-[#FF5E14] to-[#008C95] text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-[#FF5E14]/40'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="When faculty publishes assignments for your batch, they will appear here with due dates and upload."
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((a) => (
            <Panel key={a.id || a._id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-[#008C95]">{a.id}</p>
                  <h3 className="text-base font-semibold text-slate-900">{a.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {a.subject} · Faculty: {a.faculty || '—'}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                <p>
                  Due: <span className="font-medium text-slate-700">{a.dueDate || '—'}</span>
                </p>
                <p>
                  Submitted: <span className="font-medium text-slate-700">{a.submittedDate || '—'}</span>
                </p>
                <p>
                  Marks: <span className="font-medium text-slate-700">{a.marks || '—'}</span>
                </p>
                <p>
                  Progress: <span className="font-medium text-slate-700">{a.progress || 0}%</span>
                </p>
              </div>
              <div className="mt-3">
                <ProgressBar value={a.progress || 0} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <PrimaryButton type="button" onClick={() => downloadAssignment(a)}>
                  <Download size={14} />
                  {a.assignmentId?.attachments?.length ? 'Download file' : 'Download brief'}
                </PrimaryButton>
                {a.status === 'Pending' ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full border border-[#00A896]/40 bg-[#00A896]/10 px-4 py-2 text-sm font-semibold text-[#005F6B]"
                  >
                    <Upload size={14} />
                    Upload
                  </button>
                ) : null}
              </div>
            </Panel>
          ))}
        </div>
      )}
    </section>
  )
}
