import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { getBatches } from '../../../services/batchService.js'
import { getCourseById, getCourses } from '../../../services/courseService.js'
import { getUniversities } from '../../../services/universityService.js'
import {
  createFacultyAssignment,
  deleteFacultyAssignment,
  getFacultyAssignments,
  updateFacultyAssignment,
  updateFacultyAssignmentStatus,
} from '../../../services/facultyService.js'
import {
  DataTable,
  Modal,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
} from '../shared/MasterAdminUI.jsx'
import { inputClass } from './facultyFormUtils.js'

function emptyAssign() {
  return {
    universityId: '',
    courseId: '',
    semester: '',
    subjectName: '',
    subjectCode: '',
    batchId: '',
    academicYear: '',
    status: 'Active',
  }
}

export default function FacultyAssignments({ facultyId, onToast, onError }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(() => emptyAssign())
  const [universities, setUniversities] = useState([])
  const [courses, setCourses] = useState([])
  const [courseDetail, setCourseDetail] = useState(null)
  const [batches, setBatches] = useState([])

  const reload = useCallback(async () => {
    if (!facultyId) return
    setLoading(true)
    try {
      const data = await getFacultyAssignments(facultyId)
      setRows(data.rows)
    } catch (err) {
      onError?.(err?.message || 'Unable to load assignments')
    } finally {
      setLoading(false)
    }
  }, [facultyId, onError])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (!open) return undefined
    getUniversities()
      .then((data) => setUniversities(data.rows || []))
      .catch(() => setUniversities([]))
    return undefined
  }, [open])

  useEffect(() => {
    if (!open || !form.universityId) {
      setCourses([])
      return undefined
    }
    getCourses({ universityId: form.universityId })
      .then((data) => setCourses(data.rows || []))
      .catch(() => setCourses([]))
    return undefined
  }, [open, form.universityId])

  useEffect(() => {
    if (!open || !form.courseId) {
      setCourseDetail(null)
      setBatches([])
      return undefined
    }
    let cancelled = false
    Promise.all([getCourseById(form.courseId), getBatches({ courseId: form.courseId })])
      .then(([course, batchData]) => {
        if (cancelled) return
        setCourseDetail(course)
        setBatches(batchData.rows || [])
      })
      .catch(() => {
        if (!cancelled) {
          setCourseDetail(null)
          setBatches([])
        }
      })
    return () => {
      cancelled = true
    }
  }, [open, form.courseId])

  const semesters = useMemo(() => {
    const list = Array.isArray(courseDetail?.semesters) ? courseDetail.semesters : []
    if (list.length) return list
    const count = Number(courseDetail?.semesterCount) || 0
    return Array.from({ length: count }, (_, i) => ({ number: i + 1, title: `Semester ${i + 1}`, subjects: [] }))
  }, [courseDetail])

  const subjects = useMemo(() => {
    const sem = semesters.find((s) => String(s.number) === String(form.semester))
    return Array.isArray(sem?.subjects) ? sem.subjects : []
  }, [semesters, form.semester])

  const openCreate = () => {
    setEditingId('')
    setForm(emptyAssign())
    setOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row._id)
    setForm({
      universityId: row.universityId || '',
      courseId: row.courseId || '',
      semester: row.semester || '',
      subjectName: row.subjectName || '',
      subjectCode: row.subjectCode || '',
      batchId: row.batchId || '',
      academicYear: row.academicYear || '',
      status: row.status || 'Active',
    })
    setOpen(true)
  }

  const save = async () => {
    if (!form.courseId || !form.subjectName) {
      onError?.('Course and subject are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        universityId: form.universityId,
        courseId: form.courseId,
        semester: form.semester ? Number(form.semester) : null,
        subjectName: form.subjectName,
        subjectCode: form.subjectCode,
        batchId: form.batchId,
        academicYear: form.academicYear,
        status: form.status,
      }
      if (editingId) await updateFacultyAssignment(facultyId, editingId, payload)
      else await createFacultyAssignment(facultyId, payload)
      onToast?.(editingId ? 'Assignment updated' : 'Assignment added')
      setOpen(false)
      await reload()
    } catch (err) {
      onError?.(err?.message || 'Unable to save assignment')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'universityName', label: 'University', render: (row) => row.universityName || '—' },
    { key: 'courseName', label: 'Course' },
    {
      key: 'semester',
      label: 'Semester',
      render: (row) => (row.semester ? `Sem ${row.semester}` : '—'),
    },
    {
      key: 'subjectName',
      label: 'Subject',
      render: (row) => (
        <div>
          <p>{row.subjectName}</p>
          <p className="text-xs text-slate-500">{row.subjectCode}</p>
        </div>
      ),
    },
    { key: 'batchName', label: 'Batch', render: (row) => row.batchName || '—' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: '_actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className="text-xs font-semibold text-navy-800" onClick={() => openEdit(row)}>
            <Pencil size={12} className="mr-1 inline" /> Edit
          </button>
          <button
            type="button"
            className="text-xs font-semibold text-amber-700"
            onClick={async () => {
              const next = row.status === 'Active' ? 'Inactive' : 'Active'
              try {
                await updateFacultyAssignmentStatus(facultyId, row._id, next)
                onToast?.(`Assignment ${next.toLowerCase()}`)
                await reload()
              } catch (err) {
                onError?.(err?.message || 'Unable to update assignment')
              }
            }}
          >
            {row.status === 'Active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            className="text-xs font-semibold text-rose-600"
            onClick={async () => {
              if (!window.confirm('Remove this assignment?')) return
              try {
                await deleteFacultyAssignment(facultyId, row._id)
                onToast?.('Assignment removed')
                await reload()
              } catch (err) {
                onError?.(err?.message || 'Unable to remove assignment')
              }
            }}
          >
            <Trash2 size={12} className="mr-1 inline" /> Remove
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={reload} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
        <PrimaryButton onClick={openCreate}>
          <Plus size={15} /> Add assignment
        </PrimaryButton>
      </div>
      {loading ? (
        <p className="py-6 text-center text-sm text-slate-500">Loading assignments…</p>
      ) : (
        <DataTable columns={columns} rows={rows} emptyTitle="No assignments yet" emptyDescription="Add a university → course → semester → subject → batch mapping." />
      )}

      <Modal
        open={open}
        title={editingId ? 'Edit assignment' : 'Add assignment'}
        onClose={() => setOpen(false)}
        wide
        footer={
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save assignment'}
            </PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            University
            <select
              value={form.universityId}
              onChange={(e) => setForm((p) => ({ ...p, universityId: e.target.value, courseId: '', semester: '', subjectName: '', subjectCode: '', batchId: '' }))}
              className={inputClass}
            >
              <option value="">Select university</option>
              {universities.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.shortName ? `${u.shortName} — ${u.name}` : u.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Course
            <select
              value={form.courseId}
              onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value, semester: '', subjectName: '', subjectCode: '', batchId: '' }))}
              className={inputClass}
              disabled={!form.universityId}
            >
              <option value="">{form.universityId ? 'Select course' : 'Select university first'}</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code ? `${c.name} — ${c.code}` : c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Semester
            <select
              value={form.semester}
              onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value, subjectName: '', subjectCode: '' }))}
              className={inputClass}
              disabled={!form.courseId}
            >
              <option value="">Select semester</option>
              {semesters.map((s) => (
                <option key={s.number} value={s.number}>
                  {s.title || `Semester ${s.number}`}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Subject
            <select
              value={form.subjectName}
              onChange={(e) => {
                const sub = subjects.find((s) => s.name === e.target.value)
                setForm((p) => ({ ...p, subjectName: e.target.value, subjectCode: sub?.code || '' }))
              }}
              className={inputClass}
              disabled={!form.semester}
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={`${s.code}-${s.name}`} value={s.name}>
                  {s.code ? `${s.name} (${s.code})` : s.name}
                </option>
              ))}
            </select>
          </label>
          {subjects.length === 0 && form.semester ? (
            <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2">
              Subject name
              <input
                value={form.subjectName}
                onChange={(e) => setForm((p) => ({ ...p, subjectName: e.target.value }))}
                className={inputClass}
                placeholder="Type subject if not listed on the course"
              />
            </label>
          ) : null}
          <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Batch
            <select value={form.batchId} onChange={(e) => setForm((p) => ({ ...p, batchId: e.target.value }))} className={inputClass} disabled={!form.courseId}>
              <option value="">Select batch</option>
              {batches.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name || b.batchId}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Academic year
            <input value={form.academicYear} onChange={(e) => setForm((p) => ({ ...p, academicYear: e.target.value }))} className={inputClass} placeholder="2026–27" />
          </label>
        </div>
      </Modal>
    </div>
  )
}
