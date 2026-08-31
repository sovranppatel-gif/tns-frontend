import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Eye,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import {
  archiveExamPaper,
  createExamPaper,
  getExamPaperById,
  getExamPapers,
  publishExamPaper,
  updateExamPaper,
} from '../../../services/examPaperService.js'
import { getQuestions } from '../../../services/questionBankService.js'
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
  useClientTable,
} from '../shared/MasterAdminUI.jsx'
import QuestionEditor from './QuestionEditor.jsx'
import {
  emptyQuestion,
  formatAnswer,
  inputClass,
  textareaClass,
} from './examFormUtils.js'

function emptyPaper() {
  return {
    title: '',
    code: '',
    description: '',
    universityId: '',
    courseId: '',
    batchId: '',
    subject: '',
    durationMinutes: 60,
    passingPercentage: 40,
    negativeMarkingEnabled: false,
    instructions: [
      'Do not refresh the page unnecessarily.',
      'Submit before the timer expires.',
      'Once submitted, the exam cannot be restarted unless allowed.',
      'Each question may have different marks.',
      'Negative marking may apply.',
    ],
    questions: [],
    status: 'Draft',
  }
}

function snapshotFromBank(question) {
  return {
    questionId: question._id || question.id,
    text: question.text,
    type: question.type,
    options: question.options || [],
    correctAnswer: question.correctAnswer,
    marks: question.marks,
    negativeMarks: question.negativeMarks,
    explanation: question.explanation || '',
    difficulty: question.difficulty,
    subject: question.subject || '',
  }
}

function bankQuestionId(question) {
  return String(question?._id || question?.id || '')
}

export default function ExamPapersPage() {
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({})
  const [universities, setUniversities] = useState([])
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [mode, setMode] = useState('list')
  const [form, setForm] = useState(emptyPaper())
  const [editingId, setEditingId] = useState('')
  const [saving, setSaving] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [inlineOpen, setInlineOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [bankRows, setBankRows] = useState([])
  const [bankSelected, setBankSelected] = useState([])
  const [inlineForm, setInlineForm] = useState(emptyQuestion())
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(-1)

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getExamPapers()
      setRows(data.rows)
      setStats(data.stats || {})
    } catch (err) {
      setError(err.message || 'Unable to load exam papers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
    getUniversities().then((d) => setUniversities(d.rows || [])).catch(() => {})
    getCourses({ status: 'Active' }).then((d) => setCourses(d.rows || [])).catch(() => {})
    getBatches().then((d) => setBatches(d.rows || [])).catch(() => {})
  }, [reload])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  const table = useClientTable(rows, {
    searchKeys: ['title', 'code', 'courseName', 'subject'],
    pageSize: 10,
  })

  const filteredCourses = useMemo(() => {
    if (!form.universityId) return courses
    return courses.filter((c) => String(c.universityId || '') === String(form.universityId))
  }, [courses, form.universityId])

  const filteredBatches = useMemo(() => {
    if (!form.courseId) return batches
    return batches.filter((b) => String(b.courseId || '') === String(form.courseId))
  }, [batches, form.courseId])

  const subjects = useMemo(() => {
    const course = courses.find((c) => String(c.id || c._id) === String(form.courseId))
    const fromCourse = (course?.semesters || []).flatMap((sem) =>
      (sem.subjects || []).map((s) => s.name).filter(Boolean),
    )
    return [...new Set(fromCourse)]
  }, [courses, form.courseId])

  const totals = useMemo(() => {
    const questions = form.questions || []
    return {
      totalQuestions: questions.length,
      totalMarks: questions.reduce((sum, q) => sum + Number(q.marks || 0), 0),
    }
  }, [form.questions])

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const openCreate = () => {
    setEditingId('')
    setForm(emptyPaper())
    setMode('builder')
  }

  const openEdit = async (row) => {
    try {
      const entry = await getExamPaperById(row._id || row.id)
      setEditingId(entry._id || entry.id)
      setForm({ ...emptyPaper(), ...entry, universityId: entry.universityId || '', courseId: entry.courseId || '', batchId: entry.batchId || '' })
      setMode('builder')
    } catch (err) {
      setError(err.message || 'Unable to open paper')
    }
  }

  const persist = async (publish = false) => {
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, status: 'Draft' }
      let entry
      if (editingId) entry = await updateExamPaper(editingId, payload)
      else entry = await createExamPaper(payload)
      const id = entry._id || entry.id
      setEditingId(id)
      setForm({ ...emptyPaper(), ...entry })
      if (publish) {
        const published = await publishExamPaper(id)
        setForm({ ...emptyPaper(), ...published })
        setToast('Exam paper published')
        setMode('list')
      } else {
        setToast('Draft saved')
      }
      reload()
    } catch (err) {
      setError(err.message || 'Unable to save paper')
    } finally {
      setSaving(false)
    }
  }

  const archive = async (row) => {
    try {
      await archiveExamPaper(row._id || row.id)
      setToast('Paper archived')
      reload()
    } catch (err) {
      setError(err.message || 'Unable to archive paper')
    }
  }

  const moveQuestion = (index, dir) => {
    const next = [...form.questions]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setField('questions', next)
  }

  const removeQuestion = (index) => {
    setField('questions', form.questions.filter((_, i) => i !== index))
  }

  const updateQuestionMarks = (index, patch) => {
    setField(
      'questions',
      form.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    )
  }

  const paperQuestionIds = useMemo(
    () => new Set((form.questions || []).map((q) => String(q.questionId || ''))),
    [form.questions],
  )

  const selectableBankRows = useMemo(
    () => bankRows.filter((q) => !paperQuestionIds.has(bankQuestionId(q))),
    [bankRows, paperQuestionIds],
  )

  const allBankSelected =
    selectableBankRows.length > 0 &&
    selectableBankRows.every((q) => bankSelected.includes(bankQuestionId(q)))

  const closeBank = () => {
    setBankOpen(false)
    setBankSelected([])
  }

  const openBank = async () => {
    try {
      const data = await getQuestions({
        status: 'Active',
        limit: 100,
        courseId: form.courseId || undefined,
        subject: form.subject || undefined,
      })
      setBankRows(data.rows || [])
      setBankSelected([])
      setError('')
      setBankOpen(true)
    } catch (err) {
      setError(err.message || 'Unable to load question bank')
    }
  }

  const toggleBankQuestion = (id, alreadyAdded) => {
    if (!id || alreadyAdded) return
    setBankSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleBankAll = () => {
    if (allBankSelected) {
      setBankSelected([])
      return
    }
    setBankSelected(selectableBankRows.map(bankQuestionId).filter(Boolean))
  }

  const addSelectedFromBank = () => {
    const selectedRows = bankRows.filter((q) => bankSelected.includes(bankQuestionId(q)))
    if (!selectedRows.length) {
      setError('Select at least one question')
      return
    }
    const toAdd = selectedRows.filter((q) => !paperQuestionIds.has(bankQuestionId(q)))
    if (!toAdd.length) {
      setError('Selected questions are already in this paper')
      return
    }
    setField('questions', [...form.questions, ...toAdd.map(snapshotFromBank)])
    setToast(`${toAdd.length} question${toAdd.length === 1 ? '' : 's'} added to paper`)
    setError('')
    closeBank()
  }

  const saveInlineQuestion = () => {
    const snapshot = snapshotFromBank({ ...inlineForm, _id: crypto.randomUUID?.() || `tmp-${Date.now()}` })
    if (editingQuestionIndex >= 0) {
      setField(
        'questions',
        form.questions.map((q, i) => (i === editingQuestionIndex ? { ...q, ...inlineForm } : q)),
      )
    } else {
      setField('questions', [...form.questions, snapshot])
    }
    setInlineOpen(false)
    setEditingQuestionIndex(-1)
    setInlineForm(emptyQuestion())
  }

  if (mode === 'builder') {
    const locked = form.status === 'Published' || form.status === 'Archived'
    return (
      <section className="space-y-3">
        {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        {toast ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{toast}</p> : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <SecondaryButton onClick={() => setMode('list')}>Back to papers</SecondaryButton>
          <div className="flex flex-wrap gap-2">
            <SecondaryButton onClick={() => setPreviewOpen(true)}><Eye size={14} /> Preview</SecondaryButton>
            <SecondaryButton disabled={saving || locked} onClick={() => persist(false)}>Save Draft</SecondaryButton>
            <PrimaryButton disabled={saving || locked} onClick={() => persist(true)}>Publish</PrimaryButton>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Questions" value={totals.totalQuestions} />
          <StatCard label="Marks" value={totals.totalMarks} />
          <StatCard label="Duration" value={`${form.durationMinutes || 0} min`} />
        </div>

        <Panel title="Paper details">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-slate-700">Exam Title<input value={form.title} onChange={(e) => setField('title', e.target.value)} className={inputClass} disabled={locked} /></label>
            <label className="text-sm font-medium text-slate-700">Exam Code<input value={form.code} onChange={(e) => setField('code', e.target.value)} className={inputClass} disabled={locked} /></label>
            <label className="text-sm font-medium text-slate-700">Duration (minutes)<input type="number" min="1" value={form.durationMinutes} onChange={(e) => setField('durationMinutes', e.target.value)} className={inputClass} disabled={locked} /></label>
            <label className="text-sm font-medium text-slate-700">University
              <select value={form.universityId} onChange={(e) => setField('universityId', e.target.value)} className={inputClass} disabled={locked}>
                <option value="">Select university</option>
                {universities.map((u) => <option key={u.id || u._id} value={u.id || u._id}>{u.shortName ? `${u.shortName} — ${u.name}` : u.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">Course
              <select value={form.courseId} onChange={(e) => setField('courseId', e.target.value)} className={inputClass} disabled={locked}>
                <option value="">Select course</option>
                {filteredCourses.map((c) => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">Subject
              <input list="paper-subjects" value={form.subject} onChange={(e) => setField('subject', e.target.value)} className={inputClass} disabled={locked} />
              <datalist id="paper-subjects">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
            </label>
            <label className="text-sm font-medium text-slate-700">Batch
              <select value={form.batchId} onChange={(e) => setField('batchId', e.target.value)} className={inputClass} disabled={locked}>
                <option value="">Optional batch</option>
                {filteredBatches.map((b) => <option key={b._id || b.id} value={b._id || b.id}>{b.name}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">Passing %<input type="number" min="0" max="100" value={form.passingPercentage} onChange={(e) => setField('passingPercentage', e.target.value)} className={inputClass} disabled={locked} /></label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={Boolean(form.negativeMarkingEnabled)} onChange={(e) => setField('negativeMarkingEnabled', e.target.checked)} disabled={locked} />
              Negative marking enabled
            </label>
          </div>
          <label className="mt-3 block text-sm font-medium text-slate-700">
            Description
            <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} className={textareaClass} disabled={locked} />
          </label>
          <label className="mt-3 block text-sm font-medium text-slate-700">
            Instructions (one per line)
            <textarea
              value={(form.instructions || []).join('\n')}
              onChange={(e) => setField('instructions', e.target.value.split('\n'))}
              className={textareaClass}
              disabled={locked}
            />
          </label>
        </Panel>

        <Panel
          title="Questions"
          action={
            locked ? null : (
              <div className="flex flex-wrap gap-2">
                <SecondaryButton onClick={() => { setInlineForm(emptyQuestion({ courseId: form.courseId, subject: form.subject })); setEditingQuestionIndex(-1); setInlineOpen(true) }}>
                  <Plus size={14} /> Add Question
                </SecondaryButton>
                <PrimaryButton onClick={openBank}><Plus size={14} /> Add From Question Bank</PrimaryButton>
              </div>
            )
          }
        >
          {!form.questions.length ? (
            <p className="py-6 text-center text-sm text-slate-500">No questions yet. Add from the bank or create a new one.</p>
          ) : (
            <div className="space-y-3">
              {form.questions.map((q, index) => (
                <article key={`${q.questionId}-${index}`} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Question {index + 1}</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{q.text}</p>
                      <p className="mt-1 text-xs text-slate-500">Type: {q.type} · Correct: {formatAnswer(q.correctAnswer)}</p>
                    </div>
                    {!locked ? (
                      <div className="flex flex-wrap gap-1">
                        <SecondaryButton onClick={() => { setInlineForm({ ...emptyQuestion(), ...q }); setEditingQuestionIndex(index); setInlineOpen(true) }}>Edit</SecondaryButton>
                        <SecondaryButton onClick={() => moveQuestion(index, -1)}><ArrowUp size={13} /></SecondaryButton>
                        <SecondaryButton onClick={() => moveQuestion(index, 1)}><ArrowDown size={13} /></SecondaryButton>
                        <SecondaryButton onClick={() => removeQuestion(index)}><Trash2 size={13} /></SecondaryButton>
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {(q.options || []).map((opt) => (
                      <p key={opt.key} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <span className="font-semibold">{opt.key}.</span> {opt.text}
                      </p>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-medium text-slate-500">Marks
                      <input type="number" min="0" step="0.25" value={q.marks} disabled={locked} onChange={(e) => updateQuestionMarks(index, { marks: Number(e.target.value) })} className={inputClass} />
                    </label>
                    <label className="text-xs font-medium text-slate-500">Negative
                      <input type="number" min="0" step="0.25" value={q.negativeMarks} disabled={locked} onChange={(e) => updateQuestionMarks(index, { negativeMarks: Number(e.target.value) })} className={inputClass} />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>

        <Modal
          open={bankOpen}
          wide
          title="Add from Question Bank"
          onClose={closeBank}
          footer={
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-500">{bankSelected.length} selected</p>
              <div className="flex flex-wrap gap-2">
                <SecondaryButton onClick={closeBank}>Cancel</SecondaryButton>
                <PrimaryButton disabled={!bankSelected.length} onClick={addSelectedFromBank}>
                  Add{bankSelected.length ? ` ${bankSelected.length}` : ''} {bankSelected.length === 1 ? 'question' : 'questions'}
                </PrimaryButton>
              </div>
            </div>
          }
        >
          <div className="space-y-2">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={allBankSelected}
                disabled={!selectableBankRows.length}
                onChange={toggleBankAll}
              />
              Tick all
              <span className="font-normal text-slate-500">
                ({selectableBankRows.length} available
                {paperQuestionIds.size ? `, ${paperQuestionIds.size} already in paper` : ''})
              </span>
            </label>
            {bankRows.map((q) => {
              const id = bankQuestionId(q)
              const alreadyAdded = paperQuestionIds.has(id)
              const checked = alreadyAdded || bankSelected.includes(id)
              return (
                <label
                  key={id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 ${
                    alreadyAdded
                      ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-70'
                      : checked
                        ? 'border-[#008C95] bg-[#008C95]/5'
                        : 'border-slate-200 hover:border-[#008C95]'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    disabled={alreadyAdded}
                    onChange={() => toggleBankQuestion(id, alreadyAdded)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-sm font-medium text-slate-900">{q.text}</span>
                    <span className="mt-1 block text-xs text-slate-500">
                      {q.type} · {q.subject || 'No subject'} · {q.marks} marks
                      {alreadyAdded ? ' · Already added' : ''}
                    </span>
                  </span>
                </label>
              )
            })}
            {!bankRows.length ? <p className="py-6 text-center text-sm text-slate-500">No matching bank questions.</p> : null}
          </div>
        </Modal>

        <Modal
          open={inlineOpen}
          wide
          title={editingQuestionIndex >= 0 ? 'Edit question' : 'Create question'}
          onClose={() => setInlineOpen(false)}
          footer={
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => setInlineOpen(false)}>Cancel</SecondaryButton>
              <PrimaryButton onClick={saveInlineQuestion}>Add to paper</PrimaryButton>
            </div>
          }
        >
          <QuestionEditor value={inlineForm} onChange={setInlineForm} courses={courses} subjects={subjects} showStatus={false} />
        </Modal>

        <Modal open={previewOpen} wide title="Paper preview" onClose={() => setPreviewOpen(false)}>
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">{form.title || 'Untitled exam'}</h3>
            <p className="text-sm text-slate-500">{totals.totalQuestions} questions · {totals.totalMarks} marks · {form.durationMinutes} min</p>
            {(form.questions || []).map((q, index) => (
              <div key={`${q.questionId}-preview-${index}`} className="rounded-lg border border-slate-100 p-3">
                <p className="text-sm font-medium">Q{index + 1}. {q.text}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {(q.options || []).map((opt) => (
                    <li key={opt.key}>{opt.key}. {opt.text}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Modal>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {toast ? <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{toast}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Papers" value={stats.total || 0} />
        <StatCard label="Published" value={stats.published || 0} />
        <StatCard label="Draft" value={stats.draft || 0} />
        <StatCard label="Archived" value={stats.archived || 0} />
      </div>
      <PageToolbar
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search papers…"
        filters={['Draft', 'Published', 'Archived']}
        filterValue={table.filter}
        onFilter={table.setFilter}
        onAdd={openCreate}
        addLabel="Create Paper"
        extraActions={<SecondaryButton onClick={reload}><RefreshCw size={14} /> Refresh</SecondaryButton>}
      />
      <Panel title="Exam Papers">
        {loading ? <p className="py-8 text-center text-sm text-slate-500">Loading papers…</p> : (
          <DataTable
            rows={table.pageRows}
            columns={[
              { key: 'title', label: 'Title' },
              { key: 'code', label: 'Code' },
              { key: 'courseName', label: 'Course' },
              { key: 'subject', label: 'Subject' },
              { key: 'totalQuestions', label: 'Questions' },
              { key: 'totalMarks', label: 'Marks' },
              { key: 'durationMinutes', label: 'Duration' },
              { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
              {
                key: '_actions',
                label: 'Actions',
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <SecondaryButton onClick={() => openEdit(row)}><FileText size={13} /> Open</SecondaryButton>
                    {row.status !== 'Archived' ? <SecondaryButton onClick={() => archive(row)}>Archive</SecondaryButton> : null}
                  </div>
                ),
              },
            ]}
            emptyTitle="No exam papers"
            emptyDescription="Create a paper, snapshot questions, then publish."
          />
        )}
        <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPageChange={table.setPage} />
      </Panel>
    </section>
  )
}
