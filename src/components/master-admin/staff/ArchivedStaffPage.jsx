import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, RefreshCw, RotateCcw } from 'lucide-react'
import { getStaffList, restoreStaff } from '../../../services/staffService.js'
import { API_URL } from '../../../utils/api.js'
import {
  DataTable,
  PageToolbar,
  Pagination,
  StatusBadge,
} from '../shared/MasterAdminUI.jsx'
import { photoSrc, staffInitials, staffProfilePath } from './staffFormUtils.js'

const actionBtn =
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition'

export default function ArchivedStaffPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
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
        archived: 1,
      })
      setRows(data.rows)
      setPagination(data.pagination)
    } catch (err) {
      setError(err?.message || 'Unable to load archived staff')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [pagination.limit, pagination.page, debouncedSearch])

  useEffect(() => {
    reload(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

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
    { key: 'department', label: 'Department' },
    { key: 'status', label: 'Last status', render: (row) => <StatusBadge status={row.status} /> },
    { key: 'joiningDateLabel', label: 'Joining date' },
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
          <button
            type="button"
            className={`${actionBtn} border-slate-200 bg-white`}
            onClick={async () => {
              try {
                await restoreStaff(row._id)
                setToast('Staff restored')
                await reload()
              } catch (err) {
                setError(err?.message || 'Unable to restore staff')
              }
            }}
          >
            <RotateCcw size={12} /> Restore
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
      {error ? (
        <article className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">{error}</article>
      ) : null}

      <div>
        <h2 className="text-sm font-semibold text-slate-800">Archived Staff</h2>
        <p className="text-xs text-slate-500">
          Archived records are kept for history. Inactive is a live status; archived means the person has left active management.
        </p>
      </div>

      <PageToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search archived staff…"
        extraActions={
          <button type="button" onClick={() => reload()} disabled={loading} className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading archived staff…</p>
      ) : (
        <DataTable wrap columns={columns} rows={rows} emptyTitle="No archived staff" emptyDescription="Archived staff will appear here and can be restored." />
      )}

      <Pagination
        page={pagination.page}
        pageSize={pagination.limit}
        total={pagination.total}
        onPageChange={(p) => reload(p)}
      />
    </section>
  )
}
