import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, RefreshCw, Trash2 } from 'lucide-react'
import {
  createQuestion,
  deleteQuestion,
  getQuestionMeta,
  getQuestions,
  updateQuestion,
} from '../../../services/questionBankService.js'
import { getCourses } from '../../../services/courseService.js'
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
  useClientTable,
} from '../shared/MasterAdminUI.jsx'
import QuestionEditor from './QuestionEditor.jsx'
import { emptyQuestion, formatAnswer } from './examFormUtils.js'

const columns = [
  { key: 'text', label: 'Question' },
  { key: 'type', label: 'Type' },
  { key: 'subject', label: 'Subject' },
  { key: 'courseName', label: 'Course' },
  { key: 'difficulty', label: 'Difficulty' },
  { key: 'marks', label: 'Marks' },
  { key: 'correct', label: 'Correct' },
  { key: 'status', label: 'Status' },
]

export default function QuestionBankPage() {
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({})
  const [meta, setMeta] = useState({ subjects: [], courses: [] })
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 12 })
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyQuestion())
  const [editingId, setEditingId] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getQuestions({
        type: typeFilter,
        subject: subjectFilter,
        courseId: courseFilter,
        difficulty: difficultyFilter,
        status: statusFilter,
        page,
        limit: 12,
      })
      setRows(data.rows)
      setStats(data.stats || {})
      setPagination(data.pagination || { total: data.rows.length, totalPages: 1, limit: 12 })
    } catch (err) {
      setError(err.message || 'Unable to load questions')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [typeFilter, subjectFilter, courseFilter, difficultyFilter, statusFilter, page])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    getQuestionMeta()
      .then(setMeta)
      .catch(() => {})
    getCourses({ status: 'Active' })
      .then((data) => setCourses(data.rows || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  const table = useClientTable(rows, {
    searchKeys: ['text', 'subject', 'courseName', 'type'],
    pageSize: 12,
    filterKey: 'status',
  })

  const displayRows = useMemo(
    () =>
      table.pageRows.map((row) => ({
        ...row,
        correct: formatAnswer(row.correctAnswer),
        status: row.status,
      })),
    [table.pageRows],
  )

  const openCreate = () => {
    setEditingId('')
    setForm(emptyQuestion())
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row._id || row.id)
    setForm({
      ...emptyQuestion(),
      ...row,
      courseId: row.courseId || '',
    })
    setModalOpen(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editingId) await updateQuestion(editingId, form)
      else await createQuestion(form)
      setModalOpen(false)
      setToast(editingId ? 'Question updated' : 'Question created')
      reload()
    } catch (err) {
      setError(err.message || 'Unable to save question')
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async (row) => {
    if (!window.confirm('Deactivate this question?')) return
    try {
      await deleteQuestion(row._id || row.id)
      setToast('Question deactivated')
      reload()
    } catch (err) {
      setError(err.message || 'Unable to deactivate question')
    }
  }

  return (
    <section className="space-y-3">
      {toast ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{toast}</p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={stats.total || 0} />
        <StatCard label="Active" value={stats.active || 0} />
        <StatCard label="Draft" value={stats.draft || 0} />
        <StatCard label="Inactive" value={stats.inactive || 0} />
      </div>

      <PageToolbar
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search questions…"
        onAdd={openCreate}
        addLabel="Add Question"
        extraActions={
          <>
            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
              <option value="">All types</option>
              <option>Single Choice</option>
              <option>Multiple Choice</option>
              <option>True / False</option>
              <option>Yes / No</option>
            </select>
            <select value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); setPage(1) }} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
              <option value="">All subjects</option>
              {(meta.subjects || []).map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <select value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setPage(1) }} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={course.id || course._id} value={course.id || course._id}>{course.name}</option>
              ))}
            </select>
            <select value={difficultyFilter} onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1) }} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
              <option value="">All difficulty</option>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
              <option value="">All status</option>
              <option>Active</option>
              <option>Draft</option>
              <option>Inactive</option>
            </select>
            <SecondaryButton onClick={reload}><RefreshCw size={14} /> Refresh</SecondaryButton>
          </>
        }
      />

      <Panel title="Question Bank">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading questions…</p>
        ) : (
          <DataTable
            wrap
            columns={[
              ...columns.map((col) =>
                col.key === 'status'
                  ? { ...col, render: (row) => <StatusBadge status={row.status} /> }
                  : col.key === 'text'
                    ? { ...col, render: (row) => <span className="line-clamp-2">{row.text}</span> }
                    : col,
              ),
              {
                key: '_actions',
                label: 'Actions',
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <SecondaryButton onClick={() => openEdit(row)}><Pencil size={13} /> Edit</SecondaryButton>
                    <SecondaryButton onClick={() => deactivate(row)}><Trash2 size={13} /> Deactivate</SecondaryButton>
                  </div>
                ),
              },
            ]}
            rows={displayRows}
            emptyTitle="No questions yet"
            emptyDescription="Add reusable questions with correct answers stored securely."
          />
        )}
        <Pagination
          page={page}
          pageSize={pagination.limit || 12}
          total={pagination.total || table.total}
          onPageChange={setPage}
        />
      </Panel>

      <Modal
        open={modalOpen}
        wide
        title={editingId ? 'Edit Question' : 'Add Question'}
        onClose={() => setModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setModalOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save Question'}
            </PrimaryButton>
          </div>
        }
      >
        <QuestionEditor
          value={form}
          onChange={setForm}
          courses={courses}
          subjects={meta.subjects || []}
        />
      </Modal>
    </section>
  )
}
