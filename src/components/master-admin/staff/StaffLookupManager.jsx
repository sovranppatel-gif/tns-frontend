import { useCallback, useEffect, useState } from 'react'
import { Pencil, RefreshCw } from 'lucide-react'
import {
  DataTable,
  Modal,
  PageToolbar,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
} from '../shared/MasterAdminUI.jsx'
import { inputClass } from './staffConstants.js'

const actionBtn =
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition'

export default function StaffLookupManager({
  title,
  addLabel,
  description,
  columns,
  emptyForm,
  fields,
  loadRows,
  createRow,
  updateRow,
  setStatus,
  archiveRow,
}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatusFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [form, setForm] = useState(() => ({ ...emptyForm }))
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await loadRows({ search, status })
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.message || 'Unable to load records')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [loadRows, search, status])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(t)
  }, [toast])

  const openCreate = () => {
    setEditingId('')
    setForm({ ...emptyForm })
    setError('')
    setFormOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row._id)
    setForm({ ...emptyForm, ...row })
    setError('')
    setFormOpen(true)
  }

  const save = async () => {
    if (!String(form.name || '').trim()) return setError('Name is required')
    setSaving(true)
    setError('')
    try {
      if (editingId) await updateRow(editingId, form)
      else await createRow(form)
      setToast(editingId ? 'Updated' : 'Created')
      setFormOpen(false)
      await reload()
    } catch (err) {
      setError(err?.message || 'Unable to save')
    } finally {
      setSaving(false)
    }
  }

  const tableColumns = [
    ...columns,
    { key: 'staffCount', label: 'Staff', render: (row) => String(row.staffCount ?? 0) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: '_actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={`${actionBtn} border-slate-200 bg-white`} onClick={() => openEdit(row)}>
            <Pencil size={12} /> Edit
          </button>
          <button
            type="button"
            className={`${actionBtn} border-slate-200 bg-white`}
            onClick={async () => {
              try {
                await setStatus(row._id, row.status === 'Active' ? 'Inactive' : 'Active')
                setToast('Status updated')
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
              if (!window.confirm(`Archive ${row.name}?`)) return
              try {
                await archiveRow(row._id)
                setToast('Archived')
                await reload()
              } catch (err) {
                setError(err?.message || 'Unable to archive')
              }
            }}
          >
            Archive
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
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      </div>

      <PageToolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder={`Search ${title.toLowerCase()}…`}
        filters={['Active', 'Inactive']}
        filterValue={status}
        onFilter={setStatusFilter}
        addLabel={addLabel || `Add ${title}`}
        onAdd={openCreate}
        extraActions={
          <button type="button" onClick={reload} disabled={loading} className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        }
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Loading…</p>
      ) : (
        <DataTable wrap columns={tableColumns} rows={rows} emptyTitle={`No ${title.toLowerCase()} yet`} />
      )}

      <Modal
        open={formOpen}
        title={editingId ? `Edit ${title.replace(/s$/, '')}` : `Add ${title.replace(/s$/, '')}`}
        onClose={() => setFormOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <SecondaryButton onClick={() => setFormOpen(false)}>Cancel</SecondaryButton>
            <PrimaryButton disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save'}
            </PrimaryButton>
          </div>
        }
      >
        <div className="space-y-3">
          {fields({ form, setForm, inputClass })}
        </div>
      </Modal>
    </section>
  )
}
