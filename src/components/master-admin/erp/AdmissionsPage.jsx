import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  ClipboardCheck,
  Globe2,
  GraduationCap,
  Pencil,
  Printer,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react'
import {
  deleteAdmission,
  getAdmissionById,
  getAdmissions,
  updateAdmission,
} from '../../../services/admissionService.js'
import { createStudentFromAdmission } from '../../../services/studentService.js'
import { masterAdminDashboardPath, masterAdminPath } from '../../../utils/masterAdminRoutes.js'
import { printAdmissionForm } from '../../../utils/printAdmissionForm.js'
import {
  StatCard,
  Panel,
  PageToolbar,
  DataTable,
  Pagination,
  StatusBadge,
  Modal,
  useClientTable,
  downloadCsv,
} from '../shared/MasterAdminUI.jsx'
import { primaryBtn, secondaryBtn } from '../../../utils/masterAdminTheme.js'

const columns = [
  { key: 'admissionId', label: 'ID' },
  { key: 'applicant', label: 'Applicant' },
  { key: 'fatherName', label: 'Father' },
  { key: 'motherName', label: 'Mother' },
  { key: 'course', label: 'Course' },
  { key: 'photo', label: 'Photo' },
  { key: 'mode', label: 'Mode' },
  { key: 'counsellor', label: 'Counsellor' },
  { key: 'fee', label: 'Fee' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status' },
]

const STATUS_OPTIONS = ['Pending', 'Verification', 'Approved', 'Rejected', 'Cancelled']

function statusSelectClass(status) {
  const key = String(status || '').toLowerCase()
  if (key === 'approved') {
    return 'border-[#00A896]/40 bg-[#00A896]/15 text-[#005F6B]'
  }
  if (key === 'pending') {
    return 'border-amber-200 bg-amber-50 text-amber-800'
  }
  if (key === 'rejected') {
    return 'border-rose-200 bg-rose-50 text-rose-700'
  }
  if (key === 'verification') {
    return 'border-sky-200 bg-sky-50 text-sky-800'
  }
  if (key === 'cancelled') {
    return 'border-slate-300 bg-slate-100 text-slate-700'
  }
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function buildUpdatePayload(row, status) {
  return {
    applicant: row.applicant,
    email: row.email,
    phone: row.phone,
    course: row.course || row.program,
    mode: row.mode || 'Online',
    counsellor: row.counsellor === '—' ? '' : row.counsellor || '',
    fee: row.fee || '₹5,000',
    status,
    city: row.city || '',
    state: row.state || '',
    college: row.college || '',
    studentStatus: row.studentStatus || '',
    notes: row.notes || '',
    // Do not send slim/list details — preserves photo & documents on server
    admissionDate: row.admissionDate,
  }
}

export default function AdmissionsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [showOnlineRequests, setShowOnlineRequests] = useState(false)
  const [actionBusyId, setActionBusyId] = useState('')
  const [statusConfirm, setStatusConfirm] = useState(null)

  const reload = useCallback(async () => {
    try {
      setError('')
      setLoading(true)
      const data = await getAdmissions()
      setRows(data.rows)
      setStats(data.stats || {})
    } catch (err) {
      setError(err?.message || 'Unable to load admissions')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  const table = useClientTable(rows, {
    searchKeys: ['admissionId', 'applicant', 'course', 'counsellor', 'email', 'phone'],
    pageSize: 8,
    filterKey: 'status',
  })

  const filterOptions = useMemo(() => {
    const set = new Set(rows.map((r) => r.status).filter(Boolean))
    return [...set]
  }, [rows])

  const onlineRequests = useMemo(() => {
    return rows.filter((r) => {
      if (r.mode !== 'Online') return false
      const source = r.details?.source
      // Prefer student-submitted online apps; also include any Online mode pending/verification
      if (source === 'student-online') return true
      return r.status === 'Pending' || r.status === 'Verification'
    })
  }, [rows])

  const onlinePendingCount = useMemo(
    () =>
      onlineRequests.filter(
        (r) => r.status === 'Pending' || r.status === 'Verification'
      ).length,
    [onlineRequests]
  )

  const openCreate = () => {
    navigate(masterAdminDashboardPath('New Admission'))
  }

  const openEdit = (row) => {
    if (!row?._id) return
    navigate(masterAdminDashboardPath('New Admission'), {
      state: { editingId: row._id },
    })
  }

  const handleDelete = async (row) => {
    if (!row?._id) return
    const ok = window.confirm(`Delete admission ${row.admissionId || row.id}?`)
    if (!ok) return
    try {
      await deleteAdmission(row._id)
      setToast('Admission deleted')
      await reload()
    } catch (err) {
      setError(err?.message || 'Delete failed')
    }
  }

  const handleCreateStudent = async (row) => {
    if (!row?._id) return
    setActionBusyId(row._id)
    try {
      const entry = await createStudentFromAdmission({ admissionMongoId: row._id })
      setToast(`Student ${entry.studentId} created`)
      await reload()
    } catch (err) {
      setError(err?.message || 'Unable to create student')
    } finally {
      setActionBusyId('')
    }
  }

  const openStudent = (row) => {
    const id = row.studentMongoId || row.studentId
    if (!id) return
    navigate(`${masterAdminPath('Students')}?id=${encodeURIComponent(id)}`)
  }

  const handlePrint = async (row) => {
    if (!row?._id) return
    try {
      setError('')
      setActionBusyId(row._id)
      const full = await getAdmissionById(row._id)
      printAdmissionForm(full)
      setToast('Opening print dialog…')
    } catch (err) {
      setError(err?.message || 'Unable to print form')
    } finally {
      setActionBusyId('')
    }
  }

  const handleStatusChange = async (row, status) => {
    if (!row?._id) return
    setActionBusyId(row._id)
    try {
      const entry = await updateAdmission(row._id, buildUpdatePayload(row, status))
      setRows((prev) =>
        prev.map((r) =>
          r._id === row._id
            ? {
                ...r,
                ...entry,
                status: entry?.status || status,
              }
            : r,
        ),
      )
      setStats((prev) => {
        const next = { ...prev }
        const old = row.status
        if (old === 'Pending') next.pending = Math.max(0, (next.pending || 0) - 1)
        if (old === 'Verification') next.verification = Math.max(0, (next.verification || 0) - 1)
        if (old === 'Approved') next.approved = Math.max(0, (next.approved || 0) - 1)
        if (old === 'Rejected') next.rejected = Math.max(0, (next.rejected || 0) - 1)
        if (old === 'Cancelled') next.cancelled = Math.max(0, (next.cancelled || 0) - 1)
        if (status === 'Pending') next.pending = (next.pending || 0) + 1
        if (status === 'Verification') next.verification = (next.verification || 0) + 1
        if (status === 'Approved') next.approved = (next.approved || 0) + 1
        if (status === 'Rejected') next.rejected = (next.rejected || 0) + 1
        if (status === 'Cancelled') next.cancelled = (next.cancelled || 0) + 1
        return next
      })
      if (status === 'Approved') {
        const studentId = entry?.studentId
        setToast(
          studentId
            ? `Admission ${row.admissionId} approved · Student ${studentId} added`
            : `Admission ${row.admissionId} approved — student create failed, use Create Student`,
        )
        await reload()
      } else {
        setToast(
          status === 'Rejected'
            ? `Admission ${row.admissionId} rejected`
            : `Status updated to ${status}`,
        )
      }
      setStatusConfirm(null)
    } catch (err) {
      setError(err?.message || 'Unable to update status')
    } finally {
      setActionBusyId('')
    }
  }

  const requestStatusChange = (row, nextStatus) => {
    if (!row || !nextStatus || nextStatus === row.status) return
    setStatusConfirm({ row, nextStatus })
  }

  const actionBtn =
    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition'

  const tableColumns = [
    ...columns.map((c) =>
      c.key === 'status'
        ? {
            ...c,
            render: (row) => (
              <select
                value={row.status || 'Pending'}
                disabled={actionBusyId === row._id}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation()
                  const next = e.target.value
                  // Reset select visual to current until user confirms
                  e.target.value = row.status || 'Pending'
                  requestStatusChange(row, next)
                }}
                className={`h-8 min-w-[7.5rem] cursor-pointer rounded-full border px-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-[#FF5E14]/25 disabled:cursor-not-allowed disabled:opacity-60 ${statusSelectClass(row.status)}`}
                title="Change status"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ),
          }
        : c.key === 'course'
          ? {
              ...c,
              render: (row) => (
                <span className="block break-words text-slate-800">
                  {row.course || row.program || '—'}
                </span>
              ),
            }
          : c.key === 'applicant'
            ? {
                ...c,
                render: (row) => (
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-800">
                      {row.applicant || '—'}
                    </p>
                    <p className="break-all text-xs text-slate-500">{row.email || ''}</p>
                    <p className="break-all text-xs text-slate-500">{row.phone || ''}</p>
                  </div>
                ),
              }
            : c.key === 'counsellor'
              ? {
                  ...c,
                  render: (row) => (
                    <span className="break-words">{row.counsellor || '—'}</span>
                  ),
                }
                : c.key === 'photo'
                  ? {
                      ...c,
                      render: (row) => row.photo ? (
                        <img src={row.photo} alt="Student" className="h-9 w-9 rounded-lg border border-slate-200 object-cover" />
                      ) : (
                        <span className="text-xs text-slate-400">{row.hasPhoto ? 'Available' : '—'}</span>
                      ),
                    }
              : c,
    ),
    {
      key: '_actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex w-full flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            disabled={actionBusyId === row._id}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handlePrint(row)
            }}
            className={`${actionBtn} border-[#FF5E14]/30 bg-[#FF5E14]/10 text-[#FF5E14] hover:bg-[#FF5E14]/15 disabled:opacity-60`}
            title="Print application form"
          >
            <Printer size={12} /> Print
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              openEdit(row)
            }}
            className={`${actionBtn} border-[#008C95]/30 bg-[#008C95]/10 text-[#008C95] hover:bg-[#008C95]/15`}
          >
            <Pencil size={12} /> Edit
          </button>
          {row.status === 'Approved' && (row.studentId || row.studentMongoId) ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                openStudent(row)
              }}
              className={`${actionBtn} border-[#008C95]/30 bg-[#008C95]/10 text-[#008C95] hover:bg-[#008C95]/15`}
            >
              <Users size={12} /> Student
            </button>
          ) : null}
          {row.status === 'Approved' && !row.studentId && !row.studentMongoId ? (
            <button
              type="button"
              disabled={actionBusyId === row._id}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleCreateStudent(row)
              }}
              className={`${actionBtn} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60`}
            >
              <UserPlus size={12} /> Create Student
            </button>
          ) : null}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleDelete(row)
            }}
            className={`${actionBtn} border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100`}
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <section className="w-full min-w-0 space-y-3 overflow-x-hidden">
      {toast ? (
        <div className="fixed right-3 top-3 z-[90] max-w-[calc(100vw-1.5rem)] rounded-lg bg-[#008C95] px-4 py-2 text-sm font-medium text-white shadow-lg sm:right-4 sm:top-4">
          {toast}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        <StatCard label="Total Admissions" value={loading ? '—' : String(stats.total ?? rows.length)} icon={GraduationCap} />
        <StatCard label="Pending" value={loading ? '—' : String(stats.pending ?? 0)} icon={ClipboardCheck} hint="Awaiting review" />
        <StatCard label="Approved" value={loading ? '—' : String(stats.approved ?? 0)} hint="This institute DB" />
        <StatCard
          label="Online Requests"
          value={loading ? '—' : String(stats.onlinePending ?? onlinePendingCount)}
          icon={Globe2}
          hint="Student portal"
        />
      </div>

      <PageToolbar
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search admissions…"
        filters={filterOptions}
        filterValue={table.filter}
        onFilter={table.setFilter}
        addLabel="Add New Admission"
        onAdd={openCreate}
        onExportCsv={() => downloadCsv('admissions.csv', columns, table.filtered)}
        onExportExcel={() => downloadCsv('admissions.xls', columns, table.filtered)}
        onExportPdf={() => window.print()}
        extraActions={
          <button
            type="button"
            onClick={() => setShowOnlineRequests((v) => !v)}
            className={`${secondaryBtn} flex-1 sm:flex-none ${
              showOnlineRequests
                ? '!border-[#008C95] !bg-[#008C95]/10 !text-[#005F6B]'
                : ''
            }`}
          >
            <Globe2 size={14} />
            Online Requests
            {onlinePendingCount > 0 ? (
              <span className="ml-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-[#FF5E14] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {onlinePendingCount}
              </span>
            ) : null}
          </button>
        }
      />

      {showOnlineRequests ? (
        <Panel
          title="Online Admission Requests"
          className="min-w-0 overflow-hidden p-3"
          action={
            <button
              type="button"
              onClick={() => setShowOnlineRequests(false)}
              className="text-xs font-semibold text-slate-500 hover:text-[#FF5E14]"
            >
              Hide
            </button>
          }
        >
          <p className="mb-3 text-xs text-slate-500">
            Applications submitted from the student Online Admission form. Review details, then
            approve or reject.
          </p>
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-500">Loading online requests…</p>
          ) : onlineRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-8 text-center">
              <p className="text-sm font-semibold text-slate-800">No online requests yet</p>
              <p className="mt-1 text-xs text-slate-500">
                When students submit the online admission form, requests will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {onlineRequests.map((row) => (
                <article
                  key={row._id || row.admissionId}
                  className="rounded-lg border border-slate-200 bg-slate-50/80 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{row.applicant}</p>
                        <StatusBadge status={row.status} />
                        <span className="rounded-full bg-[#00A896]/15 px-2 py-0.5 text-[10px] font-semibold text-[#005F6B]">
                          Online
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {row.admissionId} · {row.email} · {row.phone}
                      </p>
                      <p className="mt-1 break-words text-sm text-slate-700">
                        {row.course || row.program}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {row.college || row.details?.universityName || '—'} · Fee {row.fee} ·{' '}
                        {row.date}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(row.status === 'Pending' || row.status === 'Verification') && (
                        <>
                          <button
                            type="button"
                            disabled={actionBusyId === row._id}
                            onClick={() => requestStatusChange(row, 'Approved')}
                            className={`${actionBtn} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-60`}
                          >
                            <CheckCircle2 size={12} />
                            {actionBusyId === row._id ? '…' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            disabled={actionBusyId === row._id}
                            onClick={() => requestStatusChange(row, 'Rejected')}
                            className={`${actionBtn} border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:opacity-60`}
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className={`${actionBtn} border-[#008C95]/30 bg-[#008C95]/10 text-[#008C95] hover:bg-[#008C95]/15`}
                      >
                        <Pencil size={12} /> Review
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrint(row)}
                        className={`${actionBtn} border-[#FF5E14]/30 bg-[#FF5E14]/10 text-[#FF5E14] hover:bg-[#FF5E14]/15`}
                      >
                        <Printer size={12} /> Print
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      ) : null}

      {error ? (
        <article className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          {error}
        </article>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            reload()
          }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-[#FF5E14]/40 hover:text-[#FF5E14]"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <Panel title="Admissions" className="min-w-0 overflow-hidden p-3">
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading admissions…</p>
        ) : (
          <>
            <DataTable
              columns={tableColumns}
              rows={table.pageRows}
              wrap
              emptyTitle="No admissions yet"
              emptyDescription="Click Add New Admission to open the official admission form."
            />
            <Pagination
              page={table.page}
              pageSize={table.pageSize}
              total={table.total}
              onPageChange={table.setPage}
            />
          </>
        )}
      </Panel>

      <Modal
        open={Boolean(statusConfirm)}
        title="Update status?"
        onClose={() => {
          if (actionBusyId) return
          setStatusConfirm(null)
        }}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={Boolean(actionBusyId)}
              onClick={() => setStatusConfirm(null)}
              className={`${secondaryBtn} disabled:opacity-60`}
            >
              No
            </button>
            <button
              type="button"
              disabled={Boolean(actionBusyId)}
              onClick={() => {
                if (!statusConfirm?.row || !statusConfirm?.nextStatus) return
                handleStatusChange(statusConfirm.row, statusConfirm.nextStatus)
              }}
              className={`${primaryBtn} disabled:opacity-60`}
            >
              {actionBusyId ? 'Updating…' : 'Yes'}
            </button>
          </div>
        }
      >
        {statusConfirm ? (
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              Do you want to change status of{' '}
              <strong>{statusConfirm.row.applicant || statusConfirm.row.admissionId}</strong> from{' '}
              <StatusBadge status={statusConfirm.row.status} /> to{' '}
              <StatusBadge status={statusConfirm.nextStatus} />?
            </p>
            <p className="text-xs text-slate-500">
              ID: {statusConfirm.row.admissionId || '—'} · Course:{' '}
              {statusConfirm.row.course || statusConfirm.row.program || '—'}
            </p>
          </div>
        ) : null}
      </Modal>
    </section>
  )
}
