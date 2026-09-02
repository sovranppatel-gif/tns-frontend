import { useEffect, useState } from 'react'
import { BarChart3, ClipboardList, Plus, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DataTable, EmptyState, PageToolbar, Panel, StatCard, StatusBadge } from '../shared/MasterAdminUI.jsx'
import { createAssignment, getAssignmentAnalytics, getAssignments, publishAssignment } from '../../../services/assignmentService.js'
import { getBatches } from '../../../services/batchService.js'
import { getCourses } from '../../../services/courseService.js'
import { getStudents } from '../../../services/studentService.js'
import { inputFocus, primaryBtn, secondaryBtn } from '../../../utils/masterAdminTheme.js'
import { masterAdminPath } from '../../../utils/masterAdminRoutes.js'

const fieldClass = `mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none ${inputFocus}`
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-500'
const assignmentTypes = ['THEORY', 'PRACTICAL', 'FILE_SUBMISSION', 'LAB', 'PROJECT', 'QUIZ', 'VIDEO', 'LINK', 'IMAGE']

export default function AssignmentsPage({ create = false }) {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({})
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ title: '', description: '', assignmentType: 'THEORY', priority: 'MEDIUM', courseId: '', totalMarks: 20, passingMarks: 8, dueAt: '', submissionRules: { types: ['TEXT_ANSWER'], allowLateSubmission: false } })

  useEffect(() => {
    if (create) return undefined
    Promise.all([getAssignments({ search, status, limit: 50 }), getAssignmentAnalytics()])
      .then(([list, analytics]) => { setRows(list.rows || []); setStats(analytics || {}) })
      .catch((e) => setError(e.message)).finally(() => setLoading(false))
    return undefined
  }, [create, search, status])

  if (create) return <CreateAssignmentForm form={form} setForm={setForm} onDone={() => navigate(masterAdminPath('Assignments'))} />

  const publish = async (row) => { try { await publishAssignment(row._id); setRows((current) => current.map((item) => item._id === row._id ? { ...item, status: 'ACTIVE' } : item)) } catch (e) { setError(e.message) } }
  const columns = [
    { key: 'title', label: 'Assignment', render: (row) => <div><p className="font-semibold text-slate-900">{row.title}</p><p className="text-xs text-slate-500">{row.courseId?.name || 'Course'}</p></div> },
    { key: 'assignmentType', label: 'Type' },
    { key: 'dueAt', label: 'Due', render: (row) => row.dueAt ? new Date(row.dueAt).toLocaleDateString('en-IN') : '—' },
    { key: 'stats', label: 'Students', render: (row) => `${row.stats?.submitted || 0} / ${row.stats?.total || 0} submitted` },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { key: '_actions', label: 'Actions', render: (row) => <div className="flex flex-wrap gap-2"><button type="button" className={secondaryBtn} onClick={() => navigate(`/master-admin/assignments/${row._id}`)}>View</button>{row.status === 'DRAFT' ? <button type="button" className={primaryBtn} onClick={() => publish(row)}><Send size={13} /> Publish</button> : null}</div> },
  ]
  return <section className="space-y-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold text-slate-900">Assignment Management</h2><p className="text-sm text-slate-500">Create, assign, track and evaluate student assignments.</p></div><button type="button" className={primaryBtn} onClick={() => navigate('/master-admin/assignments/create')}><Plus size={15} /> Create Assignment</button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Total assignments" value={stats.totalAssignments || rows.length} icon={ClipboardList} /><StatCard label="Assigned students" value={stats.totalAssigned || 0} icon={ClipboardList} /><StatCard label="Submitted" value={stats.statuses?.SUBMITTED || 0} icon={Send} /><StatCard label="Evaluated" value={stats.statuses?.EVALUATED || 0} icon={BarChart3} /></div>{error ? <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}<Panel><PageToolbar search={search} onSearch={setSearch} searchPlaceholder="Search assignments…" filters={['DRAFT', 'SCHEDULED', 'ACTIVE', 'CLOSED', 'ARCHIVED']} filterValue={status} onFilter={setStatus} /><div className="mt-3">{loading ? <div className="p-8 text-center text-sm text-slate-500">Loading assignments…</div> : rows.length ? <DataTable columns={columns} rows={rows} /> : <EmptyState icon={ClipboardList} title="No assignments found" description="Create your first assignment." />}</div></Panel></section>
}

function CreateAssignmentForm({ form, setForm, onDone }) {
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [students, setStudents] = useState([])
  const [selectedBatchIds, setSelectedBatchIds] = useState([])
  const [selectedStudentIds, setSelectedStudentIds] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingTargets, setLoadingTargets] = useState(false)
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  useEffect(() => { getCourses({ status: 'Active' }).then((data) => setCourses(data.rows || [])).catch((e) => setError(e.message)) }, [])
  useEffect(() => {
    if (!form.courseId) { setBatches([]); setStudents([]); return undefined }
    setLoadingTargets(true)
    Promise.all([getBatches({ courseId: form.courseId }), getStudents({ courseId: form.courseId, status: 'Active', limit: 100 })])
      .then(([batchData, studentData]) => { setBatches(batchData.rows || []); setStudents(studentData.rows || []); setSelectedBatchIds([]); setSelectedStudentIds([]) })
      .catch((e) => setError(e.message)).finally(() => setLoadingTargets(false))
    return undefined
  }, [form.courseId])
  useEffect(() => {
    if (!selectedBatchIds.length || !form.courseId) return undefined
    Promise.all(selectedBatchIds.map((batchId) => getStudents({ courseId: form.courseId, batchId, status: 'Active', limit: 100 })))
      .then((results) => { const unique = new Map(); results.flatMap((data) => data.rows || []).forEach((student) => unique.set(student._id, student)); setStudents([...unique.values()]); setSelectedStudentIds((current) => current.filter((id) => unique.has(id))) })
      .catch((e) => setError(e.message))
    return undefined
  }, [selectedBatchIds, form.courseId])

  const toggleStudent = (id) => setSelectedStudentIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id])
  const selectAll = () => setSelectedStudentIds(selectedStudentIds.length === students.length ? [] : students.map((student) => student._id))
  const save = async (event) => {
    event.preventDefault(); setError('')
    if (!form.courseId) return setError('Please select a course.')
    if (!selectedStudentIds.length) return setError('Select at least one active student.')
    setSaving(true)
    try { await createAssignment({ ...form, targets: selectedStudentIds.map((studentId) => ({ targetType: 'STUDENT', studentId, courseId: form.courseId })) }); onDone() } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  return <section className="space-y-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-red">Assignment Management</p><h2 className="mt-1 text-xl font-semibold text-slate-900">Create Assignment</h2><p className="mt-1 text-sm text-slate-500">Select a course, batches and eligible students.</p></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">Step 1 of 5</span></div><form className="space-y-3" onSubmit={save}>{error ? <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}<Panel title="Basic information"><div className="grid gap-4 md:grid-cols-2"><label className={`${labelClass} md:col-span-2`}>Assignment title<input required className={fieldClass} value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="e.g. JavaScript Variables Assignment" /></label><label className={`${labelClass} md:col-span-2`}>Description<textarea className={`${fieldClass} min-h-28 resize-y`} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe what students need to complete..." /></label><label className={labelClass}>Assignment type<select className={fieldClass} value={form.assignmentType} onChange={(e) => update('assignmentType', e.target.value)}>{assignmentTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label className={labelClass}>Priority<select className={fieldClass} value={form.priority} onChange={(e) => update('priority', e.target.value)}><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label></div></Panel><Panel title="Course and target"><div className="space-y-4"><label className={labelClass}>Course<select required className={fieldClass} value={form.courseId} onChange={(e) => update('courseId', e.target.value)}><option value="">Select course</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.name}{course.code ? ` (${course.code})` : ''}</option>)}</select></label><div><div className="mb-2 flex justify-between"><span className={labelClass}>Target batches</span><span className="text-xs text-slate-500">{selectedBatchIds.length} selected</span></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{batches.map((batch) => <label key={batch._id} className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm ${selectedBatchIds.includes(batch._id) ? 'border-brand-red bg-brand-red/5' : 'border-slate-200 bg-white'}`}><input type="checkbox" checked={selectedBatchIds.includes(batch._id)} onChange={() => setSelectedBatchIds((current) => current.includes(batch._id) ? current.filter((id) => id !== batch._id) : [...current, batch._id])} /><span><strong className="block text-slate-800">{batch.name}</strong><small className="text-slate-500">{batch.batchId} · {batch.enrolledCount || 0} enrolled</small></span></label>)}{form.courseId && !batches.length && !loadingTargets ? <p className="text-sm text-slate-500">No batches found for this course.</p> : null}</div></div><div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><div className="mb-2 flex items-center justify-between"><div><span className={labelClass}>Eligible active students</span><p className="mt-1 text-xs text-slate-500">{selectedStudentIds.length} of {students.length} selected</p></div><button type="button" className={secondaryBtn} onClick={selectAll} disabled={!students.length}>{selectedStudentIds.length === students.length && students.length ? 'Deselect all' : 'Select all'}</button></div><div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">{students.map((student) => <label key={student._id} className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><input type="checkbox" checked={selectedStudentIds.includes(student._id)} onChange={() => toggleStudent(student._id)} /><span><strong className="block text-slate-800">{student.nameEnglish}</strong><small className="text-slate-500">{student.studentId} · {student.batchName || 'Active student'}</small></span></label>)}{form.courseId && !students.length && !loadingTargets ? <p className="text-sm text-slate-500">No active students found.</p> : null}</div></div></div></Panel><Panel title="Marks and schedule"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className={labelClass}>Total marks<input required type="number" min="1" className={fieldClass} value={form.totalMarks} onChange={(e) => update('totalMarks', e.target.value)} /></label><label className={labelClass}>Passing marks<input required type="number" min="0" max={form.totalMarks} className={fieldClass} value={form.passingMarks} onChange={(e) => update('passingMarks', e.target.value)} /></label><label className={`${labelClass} sm:col-span-2`}>Due date and time<input required type="datetime-local" className={fieldClass} value={form.dueAt} onChange={(e) => update('dueAt', e.target.value)} /></label></div></Panel><Panel title="Submission rules"><div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Submission type<select className={fieldClass} value={form.submissionRules.types[0]} onChange={(e) => update('submissionRules', { ...form.submissionRules, types: [e.target.value] })}><option>TEXT_ANSWER</option><option>FILE_UPLOAD</option><option>PDF</option><option>IMAGE_UPLOAD</option><option>EXTERNAL_LINK</option><option>CODE</option></select></label><label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.submissionRules.allowLateSubmission} onChange={(e) => update('submissionRules', { ...form.submissionRules, allowLateSubmission: e.target.checked })} />Allow late submission</label></div></Panel><div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:justify-end"><button type="button" className={secondaryBtn} onClick={onDone}>Cancel</button><button disabled={saving} className={primaryBtn} type="submit">{saving ? 'Saving…' : 'Save draft'}</button></div></form></section>
}
