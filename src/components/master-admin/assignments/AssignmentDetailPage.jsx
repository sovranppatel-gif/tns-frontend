import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, ClipboardList, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getAssignment } from '../../../services/assignmentService.js'
import { DataTable, EmptyState, Panel, StatusBadge } from '../shared/MasterAdminUI.jsx'

export default function AssignmentDetailPage({ assignmentId }) {
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { getAssignment(assignmentId).then(setAssignment).catch((e) => setError(e.message)) }, [assignmentId])
  if (error) return <Panel><p className="text-sm text-rose-700">{error}</p><button type="button" className="btn-secondary mt-3" onClick={() => navigate('/master-admin/assignments')}>Back</button></Panel>
  if (!assignment) return <Panel><p className="text-sm text-slate-500">Loading assignment…</p></Panel>
  const columns = [
    { key: 'studentId', label: 'Student', render: (row) => <div><p className="font-semibold">{row.studentId?.nameEnglish || 'Student'}</p><p className="text-xs text-slate-500">{row.studentId?.studentId || '—'}</p></div> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'submittedAt', label: 'Submitted', render: (row) => row.submittedAt ? new Date(row.submittedAt).toLocaleString('en-IN') : 'Pending' },
    { key: 'marksObtained', label: 'Marks', render: (row) => row.marksObtained == null ? '—' : `${row.marksObtained} / ${assignment.totalMarks}` },
    { key: '_actions', label: 'Action', render: (row) => row.submissionCount ? <button type="button" className="btn-primary" onClick={() => navigate(`/master-admin/assignments/${assignmentId}/evaluate/${row._id}`)}><CheckCircle2 size={14} /> Evaluate</button> : <span className="text-xs text-slate-400">Awaiting submission</span> },
  ]
  return <section className="space-y-3"><button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600" onClick={() => navigate('/master-admin/assignments')}><ArrowLeft size={16} /> All assignments</button><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#008C95]">{assignment.courseId?.name || 'Course'}</p><h2 className="text-xl font-semibold text-slate-900">{assignment.title}</h2><p className="mt-1 text-sm text-slate-500">Due {new Date(assignment.dueAt).toLocaleString('en-IN')} · {assignment.totalMarks} marks</p></div><StatusBadge status={assignment.status} /></div><div className="grid gap-3 sm:grid-cols-3"><Panel title="Targets"><p className="text-2xl font-semibold">{assignment.targets?.length || 0}</p></Panel><Panel title="Assigned"><p className="text-2xl font-semibold">{assignment.students?.length || 0}</p></Panel><Panel title="Submitted"><p className="text-2xl font-semibold">{assignment.students?.filter((row) => row.submissionCount > 0).length || 0}</p></Panel></div><Panel title="Description"><p className="whitespace-pre-wrap text-sm text-slate-600">{assignment.description || 'No description provided.'}</p></Panel><Panel title="Student progress">{assignment.students?.length ? <DataTable columns={columns} rows={assignment.students} /> : <EmptyState icon={ClipboardList} title="No student records yet" description="Publish the assignment to distribute it to eligible active students." />}</Panel></section>
}
