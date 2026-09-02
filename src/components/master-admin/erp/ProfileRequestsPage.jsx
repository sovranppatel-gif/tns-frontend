import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, UserCheck, X } from 'lucide-react'
import {
  approveProfileChange,
  getProfileChangeRequests,
  rejectProfileChange,
} from '../../../services/studentService.js'
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
  useClientTable,
} from '../shared/MasterAdminUI.jsx'

function photoSrc(photo) {
  const value = String(photo || '').trim()
  if (!value) return ''
  if (/^(data:|https?:|blob:)/i.test(value)) return value
  return `${API_URL}${value.startsWith('/') ? value : `/${value}`}`
}

function formatAddr(addr = {}) {
  return [
    addr.line1,
    addr.line2,
    [addr.city, addr.state].filter(Boolean).join(', '),
    addr.pincode,
  ]
    .filter(Boolean)
    .join(', ') || '—'
}

function formatParent(parent = {}) {
  return [parent.name, parent.relation, parent.phone, parent.email].filter(Boolean).join(' · ') || '—'
}

function formatEmergency(emergency = {}) {
  return [emergency.name, emergency.relation, emergency.phone].filter(Boolean).join(' · ') || '—'
}

function MiniPhoto({ src, label }) {
  const url = photoSrc(src)
  return (
    <div>
      <p className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      {url ? (
        <img src={url} alt={label} className="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200" />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
          No photo
        </div>
      )}
    </div>
  )
}

function CompareRow({ label, before, after }) {
  const changed = String(before || '') !== String(after || '')
  return (
    <div className={`grid gap-2 rounded-md px-2 py-2 text-sm sm:grid-cols-3 ${changed ? 'bg-amber-50' : ''}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-slate-600">{before || '—'}</p>
      <p className={changed ? 'font-semibold text-slate-900' : 'text-slate-700'}>{after || '—'}</p>
    </div>
  )
}

export default function ProfileRequestsPage() {
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Pending')
  const [selected, setSelected] = useState(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getProfileChangeRequests({ status })
      setRows(data.rows)
      setStats(data.stats || {})
    } catch (err) {
      setError(err.message || 'Failed to load profile requests')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  const table = useClientTable(rows, {
    searchKeys: ['studentName', 'studentEmail'],
    pageSize: 12,
  })

  const columns = useMemo(
    () => [
      { key: 'studentName', label: 'Student' },
      { key: 'studentEmail', label: 'Email' },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'createdAt',
        label: 'Submitted',
        render: (row) =>
          row.createdAt ? new Date(row.createdAt).toLocaleString('en-IN') : '—',
      },
      {
        key: '_actions',
        label: '',
        render: (row) => (
          <SecondaryButton onClick={() => { setSelected(row); setNote(row.adminNote || '') }}>
            Review
          </SecondaryButton>
        ),
      },
    ],
    [],
  )

  async function handleApprove() {
    if (!selected?.id) return
    setSaving(true)
    setError('')
    try {
      await approveProfileChange(selected.id)
      setSelected(null)
      await load()
    } catch (err) {
      setError(err.message || 'Failed to approve')
    } finally {
      setSaving(false)
    }
  }

  async function handleReject() {
    if (!selected?.id) return
    setSaving(true)
    setError('')
    try {
      await rejectProfileChange(selected.id, note)
      setSelected(null)
      await load()
    } catch (err) {
      setError(err.message || 'Failed to reject')
    } finally {
      setSaving(false)
    }
  }

  const current = selected?.currentSnapshot || {}
  const proposed = selected?.proposed || {}

  return (
    <section className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Pending" value={stats.pending || 0} icon={UserCheck} />
        <StatCard label="Approved" value={stats.approved || 0} icon={Check} />
        <StatCard label="Rejected" value={stats.rejected || 0} icon={X} />
      </div>

      <PageToolbar
        search={table.search}
        onSearch={table.setSearch}
        searchPlaceholder="Search student name or email"
        filters={['Pending', 'Approved', 'Rejected']}
        filterValue={status}
        onFilter={setStatus}
      />

      {error ? (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <Panel title="Student profile change requests">
        {loading ? (
          <p className="px-1 py-6 text-sm text-slate-500">Loading requests…</p>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={table.pageRows}
              emptyTitle="No profile requests"
              onRowClick={(row) => { setSelected(row); setNote(row.adminNote || '') }}
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
        open={Boolean(selected)}
        title={selected ? `Review · ${selected.studentName || 'Student'}` : 'Review'}
        onClose={() => setSelected(null)}
        wide
        footer={
          selected?.status === 'Pending' ? (
            <div className="flex flex-wrap justify-end gap-2">
              <SecondaryButton onClick={handleReject} disabled={saving}>
                Reject
              </SecondaryButton>
              <PrimaryButton onClick={handleApprove} disabled={saving}>
                {saving ? 'Saving…' : 'Approve & update'}
              </PrimaryButton>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-6">
              <MiniPhoto src={current.avatar} label="Current photo" />
              <MiniPhoto src={proposed.avatar} label="Requested photo" />
            </div>
            <div className="hidden text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid sm:grid-cols-3">
              <span>Field</span>
              <span>Current</span>
              <span>Requested</span>
            </div>
            <CompareRow label="Name" before={current.name} after={proposed.name} />
            <CompareRow label="Email" before={current.email} after={proposed.email} />
            <CompareRow label="Mobile" before={current.mobile} after={proposed.mobile} />
            <CompareRow label="DOB" before={current.dob} after={proposed.dob} />
            <CompareRow label="Gender" before={current.gender} after={proposed.gender} />
            <CompareRow label="Blood group" before={current.bloodGroup} after={proposed.bloodGroup} />
            <CompareRow label="Address" before={formatAddr(current.address)} after={formatAddr(proposed.address)} />
            <CompareRow label="Parent" before={formatParent(current.parent)} after={formatParent(proposed.parent)} />
            <CompareRow
              label="Emergency"
              before={formatEmergency(current.emergency)}
              after={formatEmergency(proposed.emergency)}
            />
            {selected.status === 'Pending' ? (
              <label className="block text-sm">
                <span className="text-[11px] uppercase tracking-wide text-slate-400">Reject note (optional)</span>
                <textarea
                  className="mt-1 w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-[#00A896]"
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Reason if you reject this request"
                />
              </label>
            ) : (
              <p className="text-sm text-slate-500">
                {selected.status} by {selected.reviewedBy || 'admin'}
                {selected.adminNote ? ` · ${selected.adminNote}` : ''}
              </p>
            )}
          </div>
        ) : null}
      </Modal>
    </section>
  )
}
