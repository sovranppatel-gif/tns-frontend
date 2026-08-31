import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Archive,
  Briefcase,
  Clock,
  Eye,
  Pencil,
  RefreshCw,
  UserCheck,
  UserMinus,
  Users,
} from 'lucide-react'
import {
  archiveStaff,
  getStaffById,
  getStaffList,
  getStaffMeta,
  updateStaff,
  updateStaffStatus,
} from '../../../services/staffService.js'
import { masterAdminPath } from '../../../utils/masterAdminRoutes.js'
import { API_URL } from '../../../utils/api.js'
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
} from '../shared/MasterAdminUI.jsx'
import { BarMetricChart, DonutChart } from '../shared/MasterAdminCharts.jsx'
import StaffForm from './StaffForm.jsx'
import {
  emptyStaffForm,
  formToPayload,
  photoSrc,
  staffAddPath,
  staffInitials,
  staffProfilePath,
  staffToForm,
  validateStaffForm,
} from './staffFormUtils.js'
import { STAFF_STATUSES } from './staffConstants.js'

const exportColumns = [
  { key: 'staffId', label: 'Staff ID' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'email', label: 'Email' },
  { key: 'designation', label: 'Designation' },
  { key: 'department', label: 'Department' },
  { key: 'staffCategory', label: 'Category' },
  { key: 'shift', label: 'Shift' },
  { key: 'dutyStart', label: 'Duty Start' },
  { key: 'dutyEnd', label: 'Duty End' },
  { key: 'employmentType', label: 'Employment Type' },
  { key: 'monthlySalary', label: 'Monthly Salary' },
  { key: 'joiningDateLabel', label: 'Joining Date' },
  { key: 'status', label: 'Status' },
]

const actionBtn =
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition'

const lookupName = (item) => (typeof item === 'string' ? item : item?.name)

export default function StaffPage() {
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
  const [staffCategory, setStaffCategory] = useState('')
  const [shift, setShift] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [meta, setMeta] = useState({
    designations: [],
    departments: [],
    categories: [],
    shifts: [],
    employmentTypes: [],
  })
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(() => emptyStaffForm())
  const [saving, setSaving] = useState(false)
  const [, setExporting] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(t)
  }, [search])

  const reload = useCallback(async (page = pagination.page) => {
    setLoading(true)
    setError('')
    try {
      const data = await getStaffList({
        page,
        limit: pagination.limit,
        search: debouncedSearch,
        status,
        designation,
        department,
        staffCategory,
        shift,
        employmentType,
      })
      setRows(data.rows)
      setStats(data.stats || {})
      setPagination(data.pagination)
    } catch (err) {
      setError(err?.message || 'Unable to load staff')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [pagination.limit, pagination.page, debouncedSearch, status, designation, department, staffCategory, shift, employmentType])

  useEffect(() => {
    reload(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, designation, department, staffCategory, shift, employmentType])

  useEffect(() => {
    getStaffMeta()
      .then(setMeta)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  const openEdit = async (row) => {
    try {
      const entry = await getStaffById(row._id || row.staffId)
      setEditingId(entry._id)
      setForm(staffToForm(entry))
      setFormOpen(true)
    } catch (err) {
      setError(err?.message || 'Unable to load staff')
    }
  }

  const save = async () => {
    const invalid = validateStaffForm(form)
    if (invalid) return setError(invalid)
    setSaving(true)
    setError('')
    try {
      await updateStaff(editingId, formToPayload(form))
      setToast('Staff updated')
      setFormOpen(false)
      await reload()
    } catch (err) {
      setError(err?.message || 'Unable to save staff')
    } finally {
      setSaving(false)
    }
  }

  const setRowStatus = async (row, next) => {
    try {
      await updateStaffStatus(row._id, next)
      setToast(`Staff marked ${next}`)
      await reload()
    } catch (err) {
      setError(err?.message || 'Unable to update status')
    }
  }

  const columns = [
    { key: 'staffId', label: 'Staff ID' },
    {
      key: 'fullName',
      label: 'Staff Member',
      render: (row) => {
        const src = photoSrc(row.profilePhoto, API_URL)
        return (
          <div className="flex min-w-0 items-center gap-2">
            {src ? (
              <img src={src} alt="" className="h-10 w-10 rounded-lg object-cover" />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-navy-900 text-[10px] font-bold text-gold">
                {staffInitials(row.fullName)}
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
      label: 'Mobile / Email',
      render: (row) => (
        <div>
          <p>{row.mobile || '—'}</p>
          <p className="text-xs text-slate-500">{row.email || '—'}</p>
        </div>
      ),
    },
    { key: 'designation', label: 'Designation', render: (row) => row.designation || '—' },
    { key: 'department', label: 'Department', render: (row) => row.department || '—' },
    { key: 'staffCategory', label: 'Category', render: (row) => row.staffCategory || '—' },
    {
      key: 'shift',
      label: 'Shift',
      render: (row) => (
        <div>
          <p>{row.shift || '—'}</p>
          <p className="text-xs text-slate-500">{row.dutyLabel || '—'}</p>
        </div>
      ),
    },
    { key: 'joiningDateLabel', label: 'Joining Date' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: '_actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            className={`${actionBtn} border-[#008C95]/30 bg-[#008C95]/10 text-[#008C95]`}
            onClick={() => navigate(staffProfilePath(row._id || row.staffId))}
          >
            <Eye size={12} /> View
          </button>
          <button type="button" className={`${actionBtn} border-slate-200 bg-white text-slate-700`} onClick={() => openEdit(row)}>
            <Pencil size={12} /> Edit
          </button>
          <button
            type="button"
            className={`${actionBtn} border-slate-200 bg-white`}
            onClick={() => setRowStatus(row, row.status === 'Active' ? 'Inactive' : 'Active')}
          >
            {row.status === 'Active' ? 'Deactivate' : 'Activate'}
          </button>
          <button
            type="button"
            className={`${actionBtn} border-rose-200 bg-rose-50 text-rose-700`}
            onClick={async () => {
              const ok = window.confirm(
                `Archive ${row.fullName}?\n\nThe record stays in Archived Staff and can be restored. Status is not changed.`,
              )
              if (!ok) return
              try {
                await archiveStaff(row._id)
                setToast('Staff archived')
                await reload()
              } catch (err) {
                setError(err?.message || 'Unable to archive staff')
              }
            }}
          >
            <Archive size={12} /> Archive
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

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-6">
        <StatCard label="Total Staff" value={loading ? '—' : String(stats.total ?? 0)} icon={Users} />
        <StatCard label="Active Staff" value={loading ? '—' : String(stats.active ?? 0)} icon={UserCheck} />
        <StatCard label="On Leave" value={loading ? '—' : String(stats.onLeave ?? 0)} icon={Clock} />
        <StatCard label="Inactive Staff" value={loading ? '—' : String(stats.inactive ?? 0)} icon={UserMinus} />
        <StatCard label="Full Time" value={loading ? '—' : String(stats.fullTime ?? 0)} icon={Briefcase} />
        <StatCard label="New This Month" value={loading ? '—' : String(stats.newThisMonth ?? 0)} icon={Clock} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Staff by Department">
          <BarMetricChart data={stats.byDepartment || []} yLabel="Staff" height={200} />
        </Panel>
        <Panel title="Staff by Employment Type">
          <DonutChart data={stats.byEmploymentType || []} height={200} />
        </Panel>
        <Panel title="Staff by Shift">
          <BarMetricChart data={stats.byShift || []} yLabel="Staff" height={200} />
        </Panel>
      </div>

      {error ? (
        <article className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">{error}</article>
      ) : null}

      <PageToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search ID, name, mobile, email, designation…"
        filters={STAFF_STATUSES}
        filterValue={status}
        onFilter={setStatus}
        addLabel="Add Staff"
        onAdd={() => navigate(staffAddPath())}
        onExportCsv={async () => {
          setExporting(true)
          try {
            const data = await getStaffList({
              page: 1,
              limit: 2000,
              export: 1,
              search: debouncedSearch,
              status,
              designation,
              department,
              staffCategory,
              shift,
              employmentType,
            })
            downloadCsv('staff.csv', exportColumns, data.rows)
            setToast('Staff CSV downloaded')
          } catch (err) {
            setError(err?.message || 'Unable to export staff')
          } finally {
            setExporting(false)
          }
        }}
        extraActions={
          <button type="button" onClick={() => reload()} disabled={loading} className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2.5 sm:grid-cols-2 lg:grid-cols-5">
        <select value={designation} onChange={(e) => setDesignation(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
          <option value="">All designations</option>
          {(meta.designations || []).map((d) => (
            <option key={lookupName(d)} value={lookupName(d)}>{lookupName(d)}</option>
          ))}
        </select>
        <select value={department} onChange={(e) => setDepartment(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
          <option value="">All departments</option>
          {(meta.departments || []).map((d) => (
            <option key={lookupName(d)} value={lookupName(d)}>{lookupName(d)}</option>
          ))}
        </select>
        <select value={staffCategory} onChange={(e) => setStaffCategory(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
          <option value="">All categories</option>
          {(meta.categories || []).map((c) => (
            <option key={lookupName(c)} value={lookupName(c)}>{lookupName(c)}</option>
          ))}
        </select>
        <select value={shift} onChange={(e) => setShift(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
          <option value="">All shifts</option>
          {(meta.shifts || []).map((s) => (
            <option key={lookupName(s)} value={lookupName(s)}>{lookupName(s)}</option>
          ))}
        </select>
        <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="h-10 rounded-lg border border-slate-200 px-3 text-sm">
          <option value="">All employment types</option>
          {(meta.employmentTypes || []).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading staff…</p>
      ) : (
        <DataTable wrap columns={columns} rows={rows} emptyTitle="No staff found" emptyDescription="Add the first office, accounts or support staff member." />
      )}

      <Pagination
        page={pagination.page}
        pageSize={pagination.limit}
        total={pagination.total}
        onPageChange={(p) => reload(p)}
      />

      <Modal
        open={formOpen}
        title="Edit staff"
        onClose={() => setFormOpen(false)}
        wide
        footer={
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setFormOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save staff'}
            </PrimaryButton>
          </div>
        }
      >
        <StaffForm form={form} setForm={setForm} meta={meta} onUploadError={setError} />
      </Modal>
    </section>
  )
}
