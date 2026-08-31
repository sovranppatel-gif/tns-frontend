import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { masterAdminPath } from '../../../utils/masterAdminRoutes.js'
import {
  Eye,
  GraduationCap,
  Layers,
  Pencil,
  RefreshCw,
  UserCheck,
  UserMinus,
  Users,
} from 'lucide-react'
import {
  createFaculty,
  deleteFaculty,
  getFaculties,
  getFacultyById,
  getFacultyMeta,
  updateFaculty,
  updateFacultyStatus,
} from '../../../services/facultyService.js'
import { getUniversities } from '../../../services/universityService.js'
import { getCourses } from '../../../services/courseService.js'
import { API_URL } from '../../../utils/api.js'
import {
  DataTable,
  Modal,
  PageToolbar,
  Pagination,
  PrimaryButton,
  SecondaryButton,
  StatCard,
  StatusBadge,
  downloadCsv,
} from '../shared/MasterAdminUI.jsx'
import FacultyForm from './FacultyForm.jsx'
import {
  emptyFacultyForm,
  facultyInitials,
  facultyProfilePath,
  facultyToForm,
  formToPayload,
  photoSrc,
} from './facultyFormUtils.js'

const exportColumns = [
  { key: 'facultyId', label: 'Faculty ID' },
  { key: 'fullName', label: 'Name' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'email', label: 'Email' },
  { key: 'designation', label: 'Designation' },
  { key: 'department', label: 'Department' },
  { key: 'qualification', label: 'Qualification' },
  { key: 'experienceYears', label: 'Experience' },
  { key: 'joiningDateLabel', label: 'Joining Date' },
  { key: 'status', label: 'Status' },
]

const actionBtn =
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition'

export default function FacultyPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({})
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [designation, setDesignation] = useState('')
  const [department, setDepartment] = useState('')
  const [universityId, setUniversityId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [meta, setMeta] = useState({ designations: [], departments: [], permissions: [] })
  const [universities, setUniversities] = useState([])
  const [courses, setCourses] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(() => emptyFacultyForm())
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const reload = useCallback(async (page = pagination.page) => {
    setLoading(true)
    setError('')
    try {
      const data = await getFaculties({
        page,
        limit: pagination.limit,
        search: debouncedSearch,
        status,
        designation,
        department,
        universityId,
        courseId,
      })
      setRows(data.rows)
      setStats(data.stats || {})
      setPagination(data.pagination)
    } catch (err) {
      setError(err?.message || 'Unable to load faculty')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [pagination.limit, pagination.page, debouncedSearch, status, designation, department, universityId, courseId])

  useEffect(() => {
    reload(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, designation, department, universityId, courseId])

  useEffect(() => {
    getFacultyMeta()
      .then(setMeta)
      .catch(() => {})
  }, [])

  useEffect(() => {
    getUniversities()
      .then((data) => setUniversities(data.rows || []))
      .catch(() => setUniversities([]))
  }, [])

  useEffect(() => {
    if (!universityId) {
      setCourses([])
      return undefined
    }
    getCourses({ universityId })
      .then((data) => setCourses(data.rows || []))
      .catch(() => setCourses([]))
  }, [universityId])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  const openCreate = () => {
    navigate(masterAdminPath('Add Faculty'))
  }

  const openEdit = async (row) => {
    try {
      const entry = await getFacultyById(row._id || row.facultyId)
      setEditingId(entry._id)
      setForm(facultyToForm(entry))
      setFormOpen(true)
    } catch (err) {
      setError(err?.message || 'Unable to load faculty')
    }
  }

  const save = async () => {
    if (!String(form.fullName || '').trim()) return setError('Full name is required')
    if (!String(form.mobile || '').trim()) return setError('Mobile number is required')
    if (!String(form.email || '').trim()) return setError('Email is required')
    if (!String(form.designation || '').trim()) return setError('Designation is required')
    if (form.loginEnabled && !editingId && !form.password) {
      return setError('Password is required when faculty login is enabled')
    }
    setSaving(true)
    setError('')
    try {
      const payload = formToPayload(form)
      if (editingId) await updateFaculty(editingId, payload)
      else await createFaculty(payload)
      setToast(editingId ? 'Faculty updated' : 'Faculty added')
      setFormOpen(false)
      await reload()
    } catch (err) {
      setError(err?.message || 'Unable to save faculty')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'facultyId', label: 'Faculty ID' },
    {
      key: 'fullName',
      label: 'Faculty',
      render: (row) => {
        const src = photoSrc(row.profilePhoto, API_URL)
        return (
          <div className="flex min-w-0 items-center gap-2">
            {src ? (
              <img src={src} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-navy-900 text-[10px] font-bold text-gold">
                {facultyInitials(row.fullName)}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-slate-900">{row.fullName}</p>
              <p className="text-xs text-slate-500">{row.designation}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'mobile',
      label: 'Contact',
      render: (row) => (
        <div>
          <p>{row.mobile || '—'}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      ),
    },
    { key: 'designation', label: 'Designation' },
    { key: 'department', label: 'Department', render: (row) => row.department || '—' },
    {
      key: 'assignedCourses',
      label: 'Assigned courses',
      render: (row) => (row.assignedCourses || []).join(', ') || '—',
    },
    { key: 'joiningDateLabel', label: 'Joining date' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: '_actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className={`${actionBtn} border-[#008C95]/30 bg-[#008C95]/10 text-[#008C95]`}
            onClick={() => navigate(facultyProfilePath(row._id || row.facultyId))}
          >
            <Eye size={12} /> View
          </button>
          <button type="button" className={`${actionBtn} border-slate-200 bg-white text-slate-700`} onClick={() => openEdit(row)}>
            <Pencil size={12} /> Edit
          </button>
          <button
            type="button"
            className={`${actionBtn} border-amber-200 bg-amber-50 text-amber-800`}
            onClick={() => navigate(`${facultyProfilePath(row._id)}?tab=assignments`)}
          >
            Assignments
          </button>
          <button
            type="button"
            className={`${actionBtn} border-slate-200 bg-white`}
            onClick={async () => {
              const next = row.status === 'Active' ? 'Inactive' : 'Active'
              try {
                await updateFacultyStatus(row._id, next)
                setToast(`Faculty ${next.toLowerCase()}`)
                await reload()
              } catch (err) {
                setError(err?.message || 'Unable to update status')
              }
            }}
          >
            {row.status === 'Active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            className={`${actionBtn} border-rose-200 bg-rose-50 text-rose-700`}
            onClick={async () => {
              const ok = window.confirm(
                `Archive ${row.fullName}?\n\nThis is a soft delete. Records stay in the system as Inactive.`,
              )
              if (!ok) return
              try {
                await deleteFaculty(row._id)
                setToast('Faculty archived')
                await reload()
              } catch (err) {
                setError(err?.message || 'Unable to archive faculty')
              }
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <section className="space-y-3">
      {toast ? (
        <div className="fixed right-3 top-3 z-[90] rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-5">
        <StatCard label="Total Faculty" value={loading ? '—' : String(stats.total ?? 0)} icon={Users} />
        <StatCard label="Active Faculty" value={loading ? '—' : String(stats.active ?? 0)} icon={UserCheck} />
        <StatCard label="Inactive Faculty" value={loading ? '—' : String(stats.inactive ?? 0)} icon={UserMinus} />
        <StatCard label="New This Month" value={loading ? '—' : String(stats.newThisMonth ?? 0)} icon={GraduationCap} />
        <StatCard label="Assigned Faculty" value={loading ? '—' : String(stats.assigned ?? 0)} icon={Layers} />
      </div>

      {error ? (
        <article className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">{error}</article>
      ) : null}

      <PageToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search name, faculty ID, mobile, email…"
        filters={['Active', 'Inactive']}
        filterValue={status}
        onFilter={setStatus}
        addLabel="Add Faculty"
        onAdd={openCreate}
        onExportCsv={async () => {
          setExporting(true)
          try {
            const data = await getFaculties({
              page: 1,
              limit: 2000,
              export: 1,
              search: debouncedSearch,
              status,
              designation,
              department,
              universityId,
              courseId,
            })
            downloadCsv('faculty.csv', exportColumns, data.rows)
            setToast('Faculty CSV downloaded')
          } catch (err) {
            setError(err?.message || 'Unable to export faculty')
          } finally {
            setExporting(false)
          }
        }}
        extraActions={
          <button type="button" onClick={() => reload()} disabled={loading} className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <select value={designation} onChange={(e) => setDesignation(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
          <option value="">All designations</option>
          {(meta.designations || []).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select value={department} onChange={(e) => setDepartment(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
          <option value="">All departments</option>
          {(meta.departments || []).map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={universityId}
          onChange={(e) => {
            setUniversityId(e.target.value)
            setCourseId('')
          }}
          className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
        >
          <option value="">All universities</option>
          {universities.map((u) => (
            <option key={u._id} value={u._id}>
              {u.shortName ? `${u.shortName} — ${u.name}` : u.name}
            </option>
          ))}
        </select>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm" disabled={!universityId}>
          <option value="">{universityId ? 'All courses' : 'Select university first'}</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading faculty…</p>
      ) : (
        <DataTable wrap columns={columns} rows={rows} emptyTitle="No faculty found" emptyDescription="Add the first instructor, trainer or HOD." />
      )}

      <Pagination
        page={pagination.page}
        pageSize={pagination.limit}
        total={pagination.total}
        onPageChange={(p) => reload(p)}
      />

      <Modal
        open={formOpen}
        title={editingId ? 'Edit faculty' : 'Add faculty'}
        onClose={() => setFormOpen(false)}
        wide
        footer={
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setFormOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save faculty'}
            </PrimaryButton>
          </div>
        }
      >
        <FacultyForm
          form={form}
          setForm={setForm}
          meta={meta}
          isCreate={!editingId}
          onUploadError={setError}
        />
      </Modal>
    </section>
  )
}
