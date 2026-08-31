import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  createFacultyTimetable,
  deleteFacultyTimetable,
  getFacultyAssignments,
  getFacultyTimetable,
  getTimetable,
} from '../../../services/facultyService.js'
import { getFaculties } from '../../../services/facultyService.js'
import {
  Modal,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
} from '../shared/MasterAdminUI.jsx'
import { TIMETABLE_DAYS, inputClass } from './facultyFormUtils.js'

function emptySlot() {
  return {
    facultyId: '',
    universityId: '',
    courseId: '',
    batchId: '',
    assignmentId: '',
    semester: '',
    subjectName: '',
    subjectCode: '',
    day: 'Monday',
    startTime: '10:00',
    endTime: '11:00',
    room: '',
  }
}

export default function FacultyTimetable({ facultyId = '', onToast, onError, showFacultyPicker = false }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(() => emptySlot())
  const [assignments, setAssignments] = useState([])
  const [faculties, setFaculties] = useState([])

  const activeFacultyId = form.facultyId || facultyId

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const data = facultyId ? await getFacultyTimetable(facultyId) : await getTimetable()
      setRows(data.rows || [])
    } catch (err) {
      onError?.(err?.message || 'Unable to load timetable')
    } finally {
      setLoading(false)
    }
  }, [facultyId, onError])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (!showFacultyPicker) return undefined
    getFaculties({ limit: 50, status: 'Active' })
      .then((data) => setFaculties(data.rows || []))
      .catch(() => setFaculties([]))
    return undefined
  }, [showFacultyPicker])

  useEffect(() => {
    if (!open || !activeFacultyId) {
      setAssignments([])
      return undefined
    }
    getFacultyAssignments(activeFacultyId)
      .then((data) => setAssignments(data.rows || []))
      .catch(() => setAssignments([]))
    return undefined
  }, [open, activeFacultyId])

  const byDay = useMemo(() => {
    const map = Object.fromEntries(TIMETABLE_DAYS.map((d) => [d, []]))
    for (const row of rows) {
      if (map[row.day]) map[row.day].push(row)
    }
    for (const day of TIMETABLE_DAYS) {
      map[day].sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)))
    }
    return map
  }, [rows])

  const save = async () => {
    const target = form.facultyId || facultyId
    if (!target) return onError?.('Select a faculty')
    if (!form.courseId || !form.batchId || !form.subjectName) {
      return onError?.('Course, batch and subject are required')
    }
    setSaving(true)
    try {
      await createFacultyTimetable(target, form)
      onToast?.('Class added')
      setOpen(false)
      setForm(emptySlot())
      await reload()
    } catch (err) {
      onError?.(err?.message || 'Unable to add class')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <PrimaryButton
          onClick={() => {
            setForm({ ...emptySlot(), facultyId })
            setOpen(true)
          }}
        >
          <Plus size={15} /> Add class
        </PrimaryButton>
      </div>
      {loading ? (
        <p className="py-6 text-center text-sm text-slate-500">Loading timetable…</p>
      ) : (
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {TIMETABLE_DAYS.map((day) => (
            <article key={day} className="rounded-lg border border-slate-200 bg-white p-2.5">
              <h3 className="mb-2 text-sm font-semibold text-navy-900">{day}</h3>
              {byDay[day].length ? (
                <ul className="space-y-2">
                  {byDay[day].map((row) => (
                    <li key={row._id} className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5 text-xs">
                      <p className="font-semibold text-slate-800">
                        {row.startTime}–{row.endTime}
                      </p>
                      <p className="text-slate-600">{row.subjectName}</p>
                      <p className="text-slate-400">
                        {row.batchName || '—'} · {row.room || 'No room'}
                      </p>
                      {row.facultyName ? <p className="text-slate-500">{row.facultyName}</p> : null}
                      <div className="mt-1 flex items-center justify-between">
                        <StatusBadge status={row.status} />
                        <button
                          type="button"
                          className="text-rose-600"
                          onClick={async () => {
                            if (!window.confirm('Remove this class?')) return
                            try {
                              await deleteFacultyTimetable(row.facultyMongoId || facultyId, row._id)
                              onToast?.('Class removed')
                              await reload()
                            } catch (err) {
                              onError?.(err?.message || 'Unable to remove class')
                            }
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400">No classes</p>
              )}
            </article>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title="Add class"
        onClose={() => setOpen(false)}
        wide
        footer={
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save class'}
            </PrimaryButton>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {showFacultyPicker ? (
            <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2">
              Faculty
              <select
                value={form.facultyId}
                onChange={(e) => setForm((p) => ({ ...p, facultyId: e.target.value, assignmentId: '', courseId: '', batchId: '', subjectName: '' }))}
                className={inputClass}
              >
                <option value="">Select faculty</option>
                {faculties.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.facultyId} — {f.fullName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:col-span-2">
            Assignment
            <select
              value={form.assignmentId}
              onChange={(e) => {
                const a = assignments.find((x) => x._id === e.target.value)
                setForm((p) => ({
                  ...p,
                  assignmentId: e.target.value,
                  universityId: a?.universityId || '',
                  courseId: a?.courseId || '',
                  batchId: a?.batchId || '',
                  semester: a?.semester || '',
                  subjectName: a?.subjectName || '',
                  subjectCode: a?.subjectCode || '',
                }))
              }}
              className={inputClass}
            >
              <option value="">Select from assignments</option>
              {assignments.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.courseName} · {a.subjectName} · {a.batchName || 'No batch'}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Day
            <select value={form.day} onChange={(e) => setForm((p) => ({ ...p, day: e.target.value }))} className={inputClass}>
              {TIMETABLE_DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Room
            <input value={form.room} onChange={(e) => setForm((p) => ({ ...p, room: e.target.value }))} className={inputClass} />
          </label>
          <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Start
            <input type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} className={inputClass} />
          </label>
          <label className="space-y-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            End
            <input type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} className={inputClass} />
          </label>
        </div>
      </Modal>
    </div>
  )
}
